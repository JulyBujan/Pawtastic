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

$user_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : 0;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = $_POST;
}

$message_id = isset($data['id']) ? (int)$data['id'] : 0;
$message = isset($data['message']) ? trim((string)$data['message']) : '';

if (!$message_id || $message === '') {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios."]);
    exit;
}

if (function_exists('mb_strlen')) {
    if (mb_strlen($message, 'UTF-8') > 600) {
        http_response_code(400);
        echo json_encode(["message" => "El mensaje supera el máximo de 600 caracteres."]);
        exit;
    }
} elseif (strlen($message) > 600) {
    http_response_code(400);
    echo json_encode(["message" => "El mensaje supera el máximo de 600 caracteres."]);
    exit;
}

try {
    $stmt_column = $conn->prepare(
        "SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'lost_found_messages'
           AND COLUMN_NAME = 'edited_at'"
    );
    $has_edited_at = false;
    if ($stmt_column) {
        $stmt_column->execute();
        $row = $stmt_column->get_result()->fetch_assoc();
        $stmt_column->close();
        $has_edited_at = $row && (int)$row['total'] > 0;
    }

    $stmt = $conn->prepare(
        "SELECT m.id, m.sender_id, p.deleted_at, p.status
         FROM lost_found_messages m
         JOIN lost_found_posts p ON p.id = m.post_id
         WHERE m.id = ?"
    );
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("i", $message_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        http_response_code(404);
        echo json_encode(["message" => "Mensaje no encontrado."]);
        exit;
    }

    if (!empty($row['deleted_at'])) {
        http_response_code(404);
        echo json_encode(["message" => "Publicación no encontrada."]);
        exit;
    }

    if (($row['status'] ?? '') === 'RESOLVED') {
        http_response_code(400);
        echo json_encode(["message" => "No se puede editar un mensaje en una publicación resuelta."]);
        exit;
    }

    $sender_id = (int)$row['sender_id'];
    if ($sender_id !== $user_id) {
        http_response_code(403);
        echo json_encode(["message" => "No tienes permisos para editar este mensaje."]);
        exit;
    }

    if ($has_edited_at) {
        $stmt = $conn->prepare("UPDATE lost_found_messages SET message = ?, edited_at = NOW() WHERE id = ?");
    } else {
        $stmt = $conn->prepare("UPDATE lost_found_messages SET message = ? WHERE id = ?");
    }
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("si", $message, $message_id);
    if (!$stmt->execute()) {
        throw new Exception("No se pudo actualizar el mensaje.");
    }
    $stmt->close();

    echo json_encode(["message" => "Mensaje actualizado."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
