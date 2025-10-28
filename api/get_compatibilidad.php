<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// 1. Verificar token y obtener el ID del usuario
include_once "verificar_token.php";
$user_id = $decoded_token->user_id; // Asumiendo que el user_id está en el token

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "ID de usuario no encontrado en el token."]);
    exit;
}

try {
    // 2. Llamar al Stored Procedure
    $stmt = $conn->prepare("CALL calcular_compatibilidad_mascotas(?)");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $mascotas_compatibles = $result->fetch_all(MYSQLI_ASSOC);
        
        // Verificar si el perfil estaba incompleto
        if (count($mascotas_compatibles) > 0 && isset($mascotas_compatibles[0]['compatibilidad']) && !is_numeric($mascotas_compatibles[0]['compatibilidad'])) {
             http_response_code(412); // Precondition Failed
             echo json_encode(["message" => "Tu perfil de preferencias está incompleto. Por favor, complétalo para ver la compatibilidad."]);
        } else {
             echo json_encode($mascotas_compatibles);
        }

    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al ejecutar la consulta de compatibilidad."]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>
