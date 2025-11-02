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
    if ($method === 'GET') {
        // Obtener todos los usuarios
        $stmt_users = $conn->prepare("SELECT id, nombre, apellido, email, tipo, estado FROM usuarios");
        $stmt_users->execute();
        $usuarios = $stmt_users->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt_users->close();

        // Obtener todas las ONGs para el modal de asignación
        $stmt_ongs = $conn->prepare("SELECT id, nombre FROM ONGs");
        $stmt_ongs->execute();
        $ongs = $stmt_ongs->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt_ongs->close();

        echo json_encode(["usuarios" => $usuarios, "ongs" => $ongs]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->action) || !isset($data->user_id)) {
            throw new Exception("Faltan parámetros en la solicitud.");
        }

        $action = $data->action;
        $user_id = (int)$data->user_id;

        switch ($action) {
            case 'habilitar':
                $stmt = $conn->prepare("UPDATE usuarios SET estado = 0 WHERE id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                if ($stmt->affected_rows > 0) {
                    echo json_encode(["message" => "Usuario habilitado correctamente."]);
                } else {
                    throw new Exception("No se pudo habilitar al usuario o ya estaba habilitado.");
                }
                $stmt->close();
                break;

            case 'deshabilitar':
                // Un admin no se puede deshabilitar a sí mismo
                if ($user_id == $decoded_token->user_id) {
                    throw new Exception("Un administrador no puede deshabilitarse a sí mismo.");
                }
                $stmt = $conn->prepare("UPDATE usuarios SET estado = 1 WHERE id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                if ($stmt->affected_rows > 0) {
                    echo json_encode(["message" => "Usuario deshabilitado correctamente."]);
                } else {
                    throw new Exception("No se pudo deshabilitar al usuario o ya estaba deshabilitado.");
                }
                $stmt->close();
                break;

            case 'asignar-ong':
                if (!isset($data->ong_id)) {
                    throw new Exception("Falta el ID de la ONG para asignar.");
                }
                $ong_id = (int)$data->ong_id;

                // Verificar que el usuario sea de tipo 'ong'
                $stmt_check = $conn->prepare("SELECT tipo FROM usuarios WHERE id = ?");
                $stmt_check->bind_param("i", $user_id);
                $stmt_check->execute();
                $user_to_assign = $stmt_check->get_result()->fetch_assoc();
                $stmt_check->close();

                if (!$user_to_assign || $user_to_assign['tipo'] !== 'ong') {
                    throw new Exception("Solo se puede asignar una ONG a usuarios de tipo 'ong'.");
                }

                $stmt = $conn->prepare("UPDATE usuarios SET ong_id = ? WHERE id = ?");
                $stmt->bind_param("ii", $ong_id, $user_id);
                $stmt->execute();
                if ($stmt->affected_rows > 0) {
                    echo json_encode(["message" => "ONG asignada correctamente al usuario."]);
                } else {
                    throw new Exception("No se pudo asignar la ONG o ya estaba asignada.");
                }
                $stmt->close();
                break;

            default:
                throw new Exception("Acción no reconocida.");
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>