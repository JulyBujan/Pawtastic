<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Verificamos token
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["message" => "Falta token"]);
    exit;
}

list(, $jwt) = explode(' ', $headers['Authorization']);
$key = $_ENV["JWT_KEY"];

try {
    $decoded = JWT::decode($jwt, new Key($key, 'HS256'));
    $email = $decoded->email;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido o expirado: " . $e->getMessage()]);
    exit;
}

try {
    // Obtener el id_ong según el email
    $stmt = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $idOng = $user['ong_id'] ?? null;

    if (!$idOng) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró una ONG asociada a este usuario."]);
        exit;
    }

    // Traer mascotas de esa ONG
    $stmt = $conn->prepare("SELECT * FROM mascotas WHERE id_ong = ?");
    $stmt->bind_param("i", $idOng);
    $stmt->execute();
    $result = $stmt->get_result();
    $mascotas = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode($mascotas);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor al consultar la base de datos: " . $e->getMessage()]);
}
?>
