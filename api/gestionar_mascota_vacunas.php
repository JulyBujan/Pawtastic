<?php
require_once __DIR__ . '/api_init.php';

// Proteger el endpoint y obtener datos del token
include_once "verificar_token.php";

$user_tipo = $decoded_token->tipo;
$user_email = $decoded_token->email;

// Solo las ONGs pueden gestionar vacunas de mascotas
if ($user_tipo !== 'ong') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de ONG."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Obtener el ID de la ONG del usuario para validación de permisos
    $stmt_ong = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
    $stmt_ong->bind_param("s", $user_email);
    $stmt_ong->execute();
    $idOng = $stmt_ong->get_result()->fetch_assoc()['ong_id'] ?? null;
    $stmt_ong->close();

    if (!$idOng) {
        throw new Exception("No se encontró una ONG asociada a este usuario.", 403);
    }

    switch ($method) {
        case 'GET':
            if (!isset($_GET['mascota_id'])) {
                throw new Exception("Falta el ID de la mascota.", 400);
            }
            $mascota_id = (int)$_GET['mascota_id'];

            // Obtener todas las vacunas disponibles y las aplicadas a la mascota
            $stmt_all = $conn->prepare("SELECT id_vacuna, nombre, tipo FROM vacunas ORDER BY nombre ASC");
            $stmt_all->execute();
            $todas_las_vacunas = $stmt_all->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_all->close();

            $stmt_applied = $conn->prepare(
                "SELECT mv.id_mascota, mv.id_vacuna, mv.fecha_aplicacion, v.nombre 
                 FROM mascota_vacunas mv 
                 JOIN vacunas v ON mv.id_vacuna = v.id_vacuna
                 WHERE mv.id_mascota = ?"
            );
            $stmt_applied->bind_param("i", $mascota_id);
            $stmt_applied->execute();
            $vacunas_aplicadas = $stmt_applied->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_applied->close();

            echo json_encode([
                "todas" => $todas_las_vacunas,
                "aplicadas" => $vacunas_aplicadas
            ]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!isset($data->mascota_id) || !isset($data->vacuna_id) || !isset($data->fecha_aplicacion)) {
                throw new Exception("Faltan datos para agregar la vacuna.", 400);
            }

            $stmt = $conn->prepare("INSERT INTO mascota_vacunas (id_mascota, id_vacuna, fecha_aplicacion) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $data->mascota_id, $data->vacuna_id, $data->fecha_aplicacion);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "Vacuna agregada correctamente."]);
            } else {
                throw new Exception("Error al agregar la vacuna. Es posible que ya exista.", 500);
            }
            $stmt->close();
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!isset($data->mascota_id) || !isset($data->vacuna_id) || !isset($data->fecha_aplicacion)) {
                throw new Exception("Faltan datos para eliminar la vacuna.", 400);
            }

            $stmt = $conn->prepare("DELETE FROM mascota_vacunas WHERE id_mascota = ? AND id_vacuna = ? AND fecha_aplicacion = ?");
            $stmt->bind_param("iis", $data->mascota_id, $data->vacuna_id, $data->fecha_aplicacion);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(["message" => "Vacuna eliminada correctamente."]);
            } else {
                throw new Exception("No se encontró el registro de la vacuna para eliminar.", 404);
            }
            $stmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }
} catch (Exception $e) {
    $code = $e->getCode();
    if ($code < 400 || $code >= 600) {
        $code = 500;
    }
    http_response_code($code);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}

$conn->close();
?>