<?php
header("Content-Type: application/json; charset=utf-8");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

$user_tipo = $decoded_token->tipo ?? '';
if ($user_tipo !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = $_POST;
}

$post_id = isset($data['id']) ? (int)$data['id'] : 0;
if (!$post_id) {
    http_response_code(400);
    echo json_encode(["message" => "ID inválido."]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, deleted_at FROM lost_found_posts WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $post = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$post) {
        http_response_code(404);
        echo json_encode(["message" => "Publicación no encontrada."]);
        exit;
    }

    if (empty($post['deleted_at'])) {
        echo json_encode(["message" => "La publicación ya estaba activa."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE lost_found_posts SET deleted_at = NULL WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("i", $post_id);
    if (!$stmt->execute()) {
        throw new Exception("No se pudo restaurar la publicación.");
    }
    $stmt->close();

    echo json_encode(["message" => "Publicación restaurada."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
