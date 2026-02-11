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

$type = isset($_GET['type']) ? strtoupper(trim($_GET['type'])) : '';
$status = isset($_GET['status']) ? strtoupper(trim($_GET['status'])) : 'OPEN';
$deleted = isset($_GET['deleted']) ? (int)$_GET['deleted'] : 0;

if (!in_array($type, ['LOST', 'FOUND', 'ALL'], true)) {
    http_response_code(400);
    echo json_encode(["message" => "Tipo inválido."]);
    exit;
}

if (!in_array($status, ['OPEN', 'RESOLVED', 'ALL'], true)) {
    http_response_code(400);
    echo json_encode(["message" => "Estado inválido."]);
    exit;
}

function sanitize_text($value) {
    if ($value === null) {
        return null;
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function ends_with_text($value, $suffix) {
    $value = (string)$value;
    $suffix = (string)$suffix;
    $len = strlen($suffix);
    if ($len === 0) {
        return true;
    }
    return substr($value, -$len) === $suffix;
}

function is_missing_photo($photo_url) {
    if ($photo_url === null) {
        return true;
    }
    $photo_url = trim((string)$photo_url);
    return $photo_url === '' || $photo_url === 'img/mascotas/default.jpg' || ends_with_text($photo_url, '/default.jpg');
}

function should_hide_post($photo_url) {
    return is_missing_photo($photo_url);
}


try {
    $viewer_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;
    $user_tipo = $decoded_token->tipo ?? '';

    if ($deleted && $user_tipo !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Acceso denegado."]);
        exit;
    }

    if (!$deleted && $status === 'ALL') {
        http_response_code(400);
        echo json_encode(["message" => "Estado inválido."]);
        exit;
    }

    $query = "SELECT id, type, user_id, pet_name, species, breed, colors, size, location_text, suburb, date_seen, photo_url, status FROM lost_found_posts WHERE deleted_at IS ";
    $query .= $deleted ? "NOT NULL" : "NULL";
    $bind_types = "";
    $bind_values = [];

    if ($status !== 'ALL') {
        $query .= " AND status = ?";
        $bind_types .= "s";
        $bind_values[] = $status;
    }

    if ($type !== 'ALL') {
        $query .= " AND type = ?";
        $bind_types .= "s";
        $bind_values[] = $type;
    }

    if (!$deleted && $status === 'RESOLVED') {
        if (!$viewer_id) {
            echo json_encode([]);
            $conn->close();
            exit;
        }
        $query .= " AND user_id = ?";
        $bind_types .= "i";
        $bind_values[] = $viewer_id;
    }

    $query .= " ORDER BY created_at DESC, id DESC";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    if ($bind_types !== '') {
        $stmt->bind_param($bind_types, ...$bind_values);
    }
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $string_fields = ['type', 'pet_name', 'species', 'breed', 'colors', 'size', 'location_text', 'suburb', 'date_seen', 'photo_url', 'status'];

    $viewer_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;

    $filtered = array_filter($rows, function ($row) {
        return !should_hide_post($row['photo_url'] ?? null);
    });

    $posts = array_map(function ($row) use ($string_fields, $viewer_id) {
        foreach ($string_fields as $field) {
            if (array_key_exists($field, $row)) {
                $row[$field] = sanitize_text($row[$field]);
            }
        }
        $row['user_id'] = $row['user_id'] !== null ? (int)$row['user_id'] : null;
        $is_owner = $viewer_id && $row['user_id'] === $viewer_id;
        if (!$is_owner) {
            $row['location_text'] = $row['suburb'] ?: 'Barrio no disponible';
        }
        unset($row['suburb'], $row['user_id']);
        $row['id'] = (int)$row['id'];
        return $row;
    }, $filtered);

    echo json_encode($posts);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
