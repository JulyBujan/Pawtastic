<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php";
// El payload del token está ahora en la variable $decoded_token
$email = $decoded_token->email;

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
