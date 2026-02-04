<?php
header("Content-Type: application/json");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

if ($decoded_token->tipo !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de Administrador."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

try {
    $query = "
        SELECT 
            m.id,
            m.nombre,
            m.tipo,
            m.edad,
            m.estado,
            m.date_update,
            m.date_publicacion,
            m.id_ong,
            o.nombre AS ong_nombre
        FROM mascotas m
        LEFT JOIN ONGs o ON m.id_ong = o.id
        WHERE m.estado = 3
        ORDER BY m.date_update DESC, m.id DESC
    ";
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->execute();
    $mascotas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($mascotas);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
