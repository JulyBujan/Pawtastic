<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

try {
    // Primero, obtenemos el ID del usuario/ONG desde la base de datos usando el email del token
    $stmt_user = $conn->prepare("SELECT id, ong_id FROM usuarios WHERE email = ?");
    if (!$stmt_user) {
        throw new Exception("Error al preparar la consulta de usuario: " . $conn->error);
    }
    $stmt_user->bind_param("s", $user_email);
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();
    $usuario = $result_user->fetch_assoc();

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario del token no encontrado."]);
        exit;
    }
    $stmt_user->close();

    $query = "";
    if ($user_tipo === 'ong') {
        // Si es una ONG, trae todas las postulaciones a sus mascotas
        $id_ong = $usuario['ong_id'];
        $query = "SELECT a.id, m.nombre AS mascota_nombre, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, a.estado, a.fecha_inicio 
                  FROM adopciones a
                  JOIN mascotas m ON a.id_mascota = m.id
                  JOIN usuarios u ON a.id_usuario = u.id
                  WHERE a.id_ong = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id_ong);
    } elseif ($user_tipo === 'usuario') {
        // Si es un usuario, trae solo sus propias postulaciones
        $id_usuario = $usuario['id'];
        $query = "SELECT a.id, m.nombre AS mascota_nombre, o.nombre AS ong_nombre, a.estado, a.fecha_inicio 
                  FROM adopciones a
                  JOIN mascotas m ON a.id_mascota = m.id
                  JOIN ONGs o ON a.id_ong = o.id
                  WHERE a.id_usuario = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id_usuario);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $postulaciones = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($postulaciones);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>