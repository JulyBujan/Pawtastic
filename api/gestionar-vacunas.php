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
            // Obtener todas las vacunas
            $stmt = $conn->prepare("SELECT id_vacuna, nombre, tipo, descripcion FROM vacunas ORDER BY nombre ASC");
            $stmt->execute();
            $vacunas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            echo json_encode($vacunas);
            break;

        case 'POST':
            // Crear o actualizar una vacuna
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->nombre) || empty($data->tipo)) {
                throw new Exception("El nombre y el tipo de la vacuna son obligatorios.");
            }

            // Si hay un ID, es una actualización (EDITAR)
            if (isset($data->id_vacuna) && !empty($data->id_vacuna)) {
                $stmt = $conn->prepare("UPDATE vacunas SET nombre = ?, tipo = ?, descripcion = ? WHERE id_vacuna = ?");
                $stmt->bind_param("sssi", $data->nombre, $data->tipo, $data->descripcion, $data->id_vacuna);
                $message = "Vacuna actualizada correctamente.";
            } 
            // Si no hay ID, es una inserción (CREAR)
            else {
                $stmt = $conn->prepare("INSERT INTO vacunas (nombre, tipo, descripcion) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $data->nombre, $data->tipo, $data->descripcion);
                $message = "Vacuna creada correctamente.";
            }

            if (!$stmt->execute()) {
                throw new Exception("Error en la operación de la base de datos.");
            }

            // An error is indicated by -1. For an INSERT, 0 rows affected is also an error.
            if ($stmt->affected_rows === -1 || (!isset($data->id_vacuna) && $stmt->affected_rows === 0)) {
                throw new Exception("No se realizaron cambios en la base de datos.");
            }

            // For an UPDATE, affected_rows can be 0 if no data changed, which is not an error.
            // Set the correct status code and send the success message.
            http_response_code(isset($data->id_vacuna) ? 200 : 201); // 200 OK for update, 201 Created for insert
            echo json_encode(["message" => $message]);

            $stmt->close();
            break;

        case 'DELETE':
            // Eliminar una vacuna
            if (!isset($_GET['id'])) {
                throw new Exception("Falta el ID de la vacuna para eliminar.");
            }
            $id = (int)$_GET['id'];

            $stmt = $conn->prepare("DELETE FROM vacunas WHERE id_vacuna = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(["message" => "Vacuna eliminada correctamente."]);
            } else {
                throw new Exception("No se encontró la vacuna o no se pudo eliminar.");
            }
            $stmt->close();
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }
} catch (Exception $e) {
    // Captura de errores generales
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>