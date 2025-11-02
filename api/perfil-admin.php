<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

if ($user_tipo !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de Administrador."]);
    exit;
}

try {
    // Obtener el nombre del administrador desde la tabla 'usuarios'
    $stmt = $conn->prepare("SELECT nombre FROM usuarios WHERE email = ? AND tipo = 'admin'");
    $stmt->bind_param("s", $user_email);
    $stmt->execute();
    $admin = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$admin) {
        throw new Exception("No se encontró un administrador asociado a este usuario.");
    }

    echo json_encode($admin);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>