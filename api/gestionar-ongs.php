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
            $stmt = $conn->prepare("SELECT id, nombre, razon_social, cuit FROM ONGs ORDER BY id");
            $stmt->execute();
            $ongs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            echo json_encode($ongs);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->nombre)) {
                throw new Exception("El nombre de la ONG es obligatorio.");
            }

            // Si hay un ID, es una actualización (EDITAR)
            if (isset($data->id) && !empty($data->id)) {
                $stmt = $conn->prepare("UPDATE ONGs SET nombre = ?, razon_social = ?, cuit = ? WHERE id = ?");
                $stmt->bind_param("sssi", $data->nombre, $data->razon_social, $data->cuit, $data->id);
                $message = "ONG actualizada correctamente.";
            } 
            // Si no hay ID, es una inserción (CREAR)
            else {
                $stmt = $conn->prepare("INSERT INTO ONGs (nombre, razon_social, cuit) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $data->nombre, $data->razon_social, $data->cuit);
                $message = "ONG creada correctamente.";
            }

            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                echo json_encode(["message" => $message]);
            } else {
                echo json_encode(["message" => "No se realizaron cambios."]);
            }
            $stmt->close();
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                throw new Exception("Falta el ID de la ONG para eliminar.");
            }
            $id = (int)$_GET['id'];

            $stmt = $conn->prepare("DELETE FROM ONGs WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(["message" => "ONG eliminada correctamente."]);
            } else {
                throw new Exception("No se encontró la ONG o no se pudo eliminar.");
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