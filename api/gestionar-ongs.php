<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Nos da $decoded_token

$user_tipo = $decoded_token->tipo;

// Solo los administradores pueden acceder a este endpoint
if ($user_tipo !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de Administrador."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Obtener todas las ONGs con la información de su documentación (si existe)
            $query = "
                SELECT 
                    o.id, o.nombre, o.razon_social, o.cuit,
                    d.url_estatuto, d.url_cuit, d.url_acta, d.estado
                FROM ONGs o
                LEFT JOIN documentacion_ong d ON o.id = d.ong_id
                ORDER BY o.id ASC
            ";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $solicitudes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC); // El nombre de la variable se mantiene por simplicidad
            $stmt->close();
            echo json_encode($solicitudes);
            break;

        case 'POST':
            // Manejar la aprobación o rechazo de una solicitud
            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->ong_id) || !isset($data->action)) {
                throw new Exception("Faltan datos para procesar la solicitud (ong_id, action).");
            }

            $ong_id = (int)$data->ong_id;
            $action = $data->action;
            $nuevo_estado = null;
            $message = "";

            if ($action === 'aprobar') {
                $nuevo_estado = 1; // 1: Aprobado
                $message = "Solicitud de ONG aprobada correctamente.";
            } elseif ($action === 'rechazar') {
                $nuevo_estado = 2; // 2: Rechazado
                $message = "Solicitud de ONG rechazada.";
            } else {
                throw new Exception("Acción no válida.");
            }

            // Actualizar el estado en la tabla de documentación
            $stmt = $conn->prepare("UPDATE documentacion_ong SET estado = ?, fecha_revision = CURRENT_TIMESTAMP WHERE ong_id = ? AND estado = 0");
            $stmt->bind_param("ii", $nuevo_estado, $ong_id);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(["message" => $message]);
            } else {
                throw new Exception("No se encontró la solicitud o ya fue procesada.");
            }
            $stmt->close();
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>