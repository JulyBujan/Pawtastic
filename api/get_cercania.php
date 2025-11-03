<?php
require_once __DIR__ . '/api_init.php';

// 1. Verificar token y obtener el ID del usuario
require_once __DIR__ . '/verificar_token.php';
$user_id = $decoded_token->user_id; // Asumiendo que el user_id está en el token

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "ID de usuario no encontrado en el token."]);
    exit;
}

try {
    // 2. Llamar al Stored Procedure para calcular la distancia
    $stmt = $conn->prepare("CALL calcular_distancia_mascotas(?)");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $mascotas_cercanas = $result->fetch_all(MYSQLI_ASSOC);
        
        // Verificar si el SP devolvió el mensaje de error porque el usuario no tiene coordenadas
        if (count($mascotas_cercanas) === 0 && $result->num_rows === 0) {
             // El SP devuelve un conjunto vacío con un mensaje de error si no hay lat/lon
             // En este caso, el fetch_all devuelve un array vacío.
             http_response_code(412); // Precondition Failed
             echo json_encode(["message" => "Tu ubicación no está definida. Por favor, valida tu dirección en tu perfil para ver las mascotas más cercanas."]);
        } else {
             echo json_encode($mascotas_cercanas);
        }
    } else {
        throw new Exception("Error al ejecutar la consulta de cercanía.");
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>