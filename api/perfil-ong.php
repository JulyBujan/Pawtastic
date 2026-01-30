<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

if ($user_tipo !== 'ong') {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de ONG."]);
    exit;
}

try {
    // 1. Obtener el ong_id del usuario logueado desde la tabla 'usuarios'
    $stmt_user = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
    $stmt_user->bind_param("s", $user_email);
    $stmt_user->execute();
    $usuario = $stmt_user->get_result()->fetch_assoc();
    $stmt_user->close();

    if (!$usuario || !$usuario['ong_id']) {
        throw new Exception("No se encontró una ONG asociada a este usuario.");
    }

    // 2. Con el ong_id, obtener el nombre de la ONG desde la tabla 'ONGs'
    $has_logo = false;
    $check_logo = $conn->query("SHOW COLUMNS FROM ONGs LIKE 'logo_url'");
    if ($check_logo && $check_logo->num_rows > 0) {
        $has_logo = true;
    }

    $query = $has_logo ? "SELECT nombre, logo_url FROM ONGs WHERE id = ?" : "SELECT nombre FROM ONGs WHERE id = ?";
    $stmt_ong = $conn->prepare($query);
    $stmt_ong->bind_param("i", $usuario['ong_id']);
    $stmt_ong->execute();
    $ong = $stmt_ong->get_result()->fetch_assoc();
    $stmt_ong->close();

    echo json_encode($ong);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
