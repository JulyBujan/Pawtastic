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
$key = $_ENV["JWT_KEY"]; // misma clave que login y cargar_mascota

try {
    $decoded = JWT::decode($jwt, new Key($key, 'HS256'));
    $email = $decoded->email;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido o expirado"]);
    exit;
}

// Obtener el id_ong según el email
$stmt = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$idOng = $stmt->fetchColumn();

if (!$idOng) {
    http_response_code(404);
    echo json_encode(["message" => "No se encontró la ONG asociada"]);
    exit;
}

// Traer mascotas de esa ONG
$query = $conn->prepare("SELECT * FROM mascotas WHERE id_ong = ?");
$query->execute([$idOng]);
$mascotas = $query->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($mascotas);
?>
