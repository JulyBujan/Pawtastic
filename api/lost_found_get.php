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

function sanitize_text($value) {
    if ($value === null) {
        return null;
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

try {
    $stmt = $conn->prepare("SELECT id, type, user_id, pet_name, species, breed, colors, size, location_text, suburb, lat, lon, date_seen, description, photo_url, status, created_at, updated_at FROM lost_found_posts WHERE id = ? AND deleted_at IS NULL");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $post = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$post) {
        http_response_code(404);
        echo json_encode(["message" => "Post no encontrado."]);
        exit;
    }

    $string_fields = [
        'type',
        'pet_name',
        'species',
        'breed',
        'colors',
        'size',
        'location_text',
        'suburb',
        'date_seen',
        'description',
        'photo_url',
        'status',
        'created_at',
        'updated_at'
    ];

    foreach ($string_fields as $field) {
        if (array_key_exists($field, $post)) {
            $post[$field] = sanitize_text($post[$field]);
        }
    }

    $post['id'] = (int)$post['id'];
    $post['user_id'] = $post['user_id'] !== null ? (int)$post['user_id'] : null;
    $viewer_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;
    $is_owner = $viewer_id && $post['user_id'] === $viewer_id;

    if (($post['status'] ?? '') === 'RESOLVED' && !$is_owner) {
        http_response_code(404);
        echo json_encode(["message" => "Post no encontrado."]);
        exit;
    }

    if (!$is_owner) {
        $post['location_text'] = $post['suburb'] ?: 'Barrio no disponible';
    }

    $post['is_owner'] = $is_owner;
    if (!isset($post['lat']) || $post['lat'] === null || $post['lat'] === '' || !is_numeric($post['lat'])) {
        $post['lat'] = null;
    } else {
        $post['lat'] = (float)$post['lat'];
    }
    if (!isset($post['lon']) || $post['lon'] === null || $post['lon'] === '' || !is_numeric($post['lon'])) {
        $post['lon'] = null;
    } else {
        $post['lon'] = (float)$post['lon'];
    }

    echo json_encode($post);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
