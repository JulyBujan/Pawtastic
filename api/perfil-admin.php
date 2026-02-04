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

    $stats = [];

    $stmt_users = $conn->prepare("SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'usuario'");
    if (!$stmt_users) {
        throw new Exception("Error al preparar la consulta de usuarios.");
    }
    $stmt_users->execute();
    $stats['usuarios'] = (int) $stmt_users->get_result()->fetch_assoc()['total'];
    $stmt_users->close();

    $stmt_ongs = $conn->prepare("SELECT COUNT(*) AS total FROM ONGs");
    if (!$stmt_ongs) {
        throw new Exception("Error al preparar la consulta de ONGs.");
    }
    $stmt_ongs->execute();
    $stats['ongs'] = (int) $stmt_ongs->get_result()->fetch_assoc()['total'];
    $stmt_ongs->close();

    $stmt_mascotas = $conn->prepare("SELECT COUNT(*) AS total FROM mascotas WHERE estado = 3");
    if (!$stmt_mascotas) {
        throw new Exception("Error al preparar la consulta de mascotas archivadas.");
    }
    $stmt_mascotas->execute();
    $stats['mascotas_archivadas'] = (int) $stmt_mascotas->get_result()->fetch_assoc()['total'];
    $stmt_mascotas->close();

    echo json_encode([
        "nombre" => $admin['nombre'],
        "stats" => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
