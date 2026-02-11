<?php
header("Content-Type: application/json; charset=utf-8");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

$post_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$post_id) {
    http_response_code(400);
    echo json_encode(["message" => "ID inválido."]);
    exit;
}

$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, [
    'options' => [
        'default' => 5,
        'min_range' => 1,
        'max_range' => 50
    ]
]);

$max_days = filter_input(INPUT_GET, 'maxDays', FILTER_VALIDATE_INT, [
    'options' => [
        'default' => 60,
        'min_range' => 1,
        'max_range' => 365
    ]
]);

function sanitize_text($value) {
    if ($value === null) {
        return null;
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function normalize_text($value) {
    $value = trim((string)$value);
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }
    return strtolower($value);
}

function split_colors($value) {
    if ($value === null) {
        return [];
    }
    $parts = array_map('trim', explode(',', $value));
    $parts = array_filter($parts, function ($color) {
        return $color !== '';
    });
    return array_values(array_unique($parts));
}

function split_colors_lower($value) {
    $parts = split_colors($value);
    return array_map(function ($color) {
        return normalize_text($color);
    }, $parts);
}

function diff_days($date_a, $date_b) {
    if (!$date_a || !$date_b) {
        return null;
    }
    $a = DateTime::createFromFormat('Y-m-d', $date_a);
    $b = DateTime::createFromFormat('Y-m-d', $date_b);
    if (!$a || !$b) {
        return null;
    }
    return abs($a->diff($b)->days);
}

function compute_match_score($base, $cand, $max_days) {
    $score = 0;
    $reasons = [];

    $score += 3;
    $reasons[] = 'Misma especie';

    $base_breed = normalize_text($base['breed'] ?? '');
    $cand_breed = normalize_text($cand['breed'] ?? '');
    if ($base_breed !== '' && $cand_breed !== '') {
        if (stripos($cand_breed, $base_breed) !== false || stripos($base_breed, $cand_breed) !== false) {
            $score += 2;
            $reasons[] = 'Raza similar';
        }
    }

    $base_colors = split_colors_lower($base['colors'] ?? '');
    $cand_colors = split_colors_lower($cand['colors'] ?? '');
    $common_colors = array_values(array_intersect($base_colors, $cand_colors));
    if (!empty($common_colors)) {
        $color_points = min(count($common_colors), 3);
        $score += $color_points;
        $reasons[] = 'Colores en común: ' . implode(', ', array_slice($common_colors, 0, $color_points));
    }

    if (!empty($base['size']) && !empty($cand['size']) && $base['size'] === $cand['size']) {
        $score += 1;
        $reasons[] = 'Mismo tamaño';
    }

    $base_location = normalize_text($base['location_text'] ?? '');
    $cand_location = normalize_text($cand['location_text'] ?? '');
    if ($base_location !== '' && $cand_location !== '') {
        if (stripos($cand_location, $base_location) !== false || stripos($base_location, $cand_location) !== false) {
            $score += 2;
            $reasons[] = 'Ubicación similar';
        }
    }

    $date_diff = diff_days($base['date_seen'] ?? null, $cand['date_seen'] ?? null);
    if ($date_diff !== null) {
        if ($max_days && $date_diff > $max_days) {
            return ['skip' => true, 'score' => 0, 'reasons' => []];
        }
        if ($date_diff <= 7) {
            $score += 2;
            $reasons[] = 'Fecha cercana (+/-' . $date_diff . ' dias)';
        } elseif ($date_diff <= 30) {
            $score += 1;
            $reasons[] = 'Fecha similar (+/-' . $date_diff . ' dias)';
        }
    }

    return ['skip' => false, 'score' => $score, 'reasons' => $reasons];
}

try {
    $stmt = $conn->prepare("SELECT id, type, user_id, pet_name, species, breed, colors, size, location_text, date_seen, description, photo_url, status, created_at FROM lost_found_posts WHERE id = ? AND deleted_at IS NULL");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $base = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$base) {
        http_response_code(404);
        echo json_encode(["message" => "Post no encontrado."]);
        exit;
    }

    $viewer_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;
    $base_owner = $base['user_id'] !== null ? (int)$base['user_id'] : null;
    $is_owner = $viewer_id && $base_owner === $viewer_id;

    if (($base['status'] ?? '') === 'RESOLVED' && !$is_owner) {
        http_response_code(404);
        echo json_encode(["message" => "Post no encontrado."]);
        exit;
    }

    $base_type = $base['type'] ?? '';
    if (!in_array($base_type, ['LOST', 'FOUND'], true)) {
        http_response_code(400);
        echo json_encode(["message" => "Tipo base inválido."]);
        exit;
    }

    $target_type = $base_type === 'LOST' ? 'FOUND' : 'LOST';

    $stmt = $conn->prepare("SELECT id, type, user_id, pet_name, species, breed, colors, size, location_text, suburb, date_seen, photo_url, created_at FROM lost_found_posts WHERE status = 'OPEN' AND type = ? AND species = ? AND deleted_at IS NULL");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("ss", $target_type, $base['species']);
    $stmt->execute();
    $candidates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $matches = [];

    foreach ($candidates as $cand) {
        $score_data = compute_match_score($base, $cand, $max_days);
        if ($score_data['skip']) {
            continue;
        }

        $colors_raw = split_colors($cand['colors'] ?? '');
        $colors_safe = array_map('sanitize_text', $colors_raw);

        $viewer_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;
        $cand_user = $cand['user_id'] !== null ? (int)$cand['user_id'] : null;
        $is_owner = $viewer_id && $cand_user === $viewer_id;
        $display_location = $is_owner ? ($cand['location_text'] ?? null) : ($cand['suburb'] ?? null);

        $summary = [
            'species' => sanitize_text($cand['species'] ?? null),
            'breed' => sanitize_text($cand['breed'] ?? null),
            'colors' => $colors_safe,
            'location_text' => sanitize_text($display_location ?: 'Barrio no disponible'),
            'date_seen' => sanitize_text($cand['date_seen'] ?? null),
            'photo_url' => sanitize_text($cand['photo_url'] ?? null)
        ];

        $reasons_safe = array_map('sanitize_text', $score_data['reasons']);

        $matches[] = [
            'postId' => (int)$cand['id'],
            'type' => sanitize_text($cand['type'] ?? null),
            'score' => (int)$score_data['score'],
            'reasons' => $reasons_safe,
            'summary' => $summary,
            '_sort_date' => $cand['date_seen'] ?: $cand['created_at'],
            '_created_at' => $cand['created_at']
        ];
    }

    usort($matches, function ($a, $b) {
        if ($a['score'] !== $b['score']) {
            return $b['score'] <=> $a['score'];
        }

        $date_a = $a['_sort_date'] ?? '';
        $date_b = $b['_sort_date'] ?? '';

        if ($date_a && $date_b && $date_a !== $date_b) {
            return strcmp($date_b, $date_a);
        }

        if ($date_a && !$date_b) {
            return -1;
        }

        if (!$date_a && $date_b) {
            return 1;
        }

        $created_a = $a['_created_at'] ?? '';
        $created_b = $b['_created_at'] ?? '';

        if ($created_a === $created_b) {
            return 0;
        }

        return strcmp($created_b, $created_a);
    });

    if ($limit && count($matches) > $limit) {
        $matches = array_slice($matches, 0, $limit);
    }

    foreach ($matches as &$match) {
        unset($match['_sort_date'], $match['_created_at']);
    }
    unset($match);

    echo json_encode([
        'basePostId' => (int)$base['id'],
        'baseType' => sanitize_text($base_type),
        'matches' => $matches
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
