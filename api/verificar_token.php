<?php
/**
 * Este script verifica el token JWT proporcionado en la cabecera Authorization.
 * 
 * - Si el token es válido, define la variable $decoded_token con el payload.
 * - Si el token es inválido, no existe o hay un error, el script termina la ejecución
 *   con un código de estado HTTP 401 y un mensaje de error en JSON.
 * 
 * Requiere que 'vendor/autoload.php' ya haya sido incluido.
 */
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["message" => "Falta token de autorización."]);
    exit;
}

$authHeader = $headers['Authorization'];
$parts = explode(' ', $authHeader);

if (count($parts) !== 2 || $parts[0] !== 'Bearer' || empty($parts[1])) {
    http_response_code(401);
    echo json_encode(["message" => "Formato de token inválido o token vacío."]);
    exit;
}

$jwt = $parts[1];
$key = $_ENV["JWT_KEY"];

try {
    $decoded_token = JWT::decode($jwt, new Key($key, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido o expirado: " . $e->getMessage()]);
    exit;
}