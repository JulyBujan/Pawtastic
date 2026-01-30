<?php
require_once __DIR__ . '/api_init.php';

// Proteger el endpoint y obtener datos del token
include_once "verificar_token.php";

$user_tipo = $decoded_token->tipo;
$user_email = $decoded_token->email;
$actorId = null;

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

    $stmt_actor = $conn->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
    $stmt_actor->bind_param("s", $user_email);
    $stmt_actor->execute();
    $actorId = $stmt_actor->get_result()->fetch_assoc()['id'] ?? null;
    $stmt_actor->close();

    $crearNotificacionOng = function ($tipo, $titulo, $cuerpo, $entidadTipo, $entidadId, $payload = null) use ($conn, $idOng, $actorId) {
        $stmtOngUsers = $conn->prepare("SELECT id FROM usuarios WHERE tipo = 'ong' AND ong_id = ?");
        $stmtOngUsers->bind_param("i", $idOng);
        $stmtOngUsers->execute();
        $resultOngUsers = $stmtOngUsers->get_result();

        $stmtNotif = $conn->prepare("INSERT INTO notificaciones (usuario_id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $payloadJson = $payload ? json_encode($payload) : null;

        while ($row = $resultOngUsers->fetch_assoc()) {
            $ongUserId = (int) $row['id'];
            $stmtNotif->bind_param("iissssis", $ongUserId, $actorId, $tipo, $titulo, $cuerpo, $entidadTipo, $entidadId, $payloadJson);
            $stmtNotif->execute();
        }
        $stmtNotif->close();
        $stmtOngUsers->close();
    };

    switch ($method) {
        case 'GET':
            $mascota_id = isset($_GET['mascota_id']) ? (int)$_GET['mascota_id'] : 0;

            // Obtener todas las vacunas disponibles y las aplicadas a la mascota
            $stmt_all = $conn->prepare("SELECT id_vacuna, nombre, tipo FROM vacunas ORDER BY nombre ASC");
            $stmt_all->execute();
            $todas_las_vacunas = $stmt_all->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_all->close();

            $vacunas_aplicadas = [];
            if ($mascota_id > 0) {
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
            }

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

            $stmtMascota = $conn->prepare("SELECT nombre FROM mascotas WHERE id = ?");
            $stmtMascota->bind_param("i", $data->mascota_id);
            $stmtMascota->execute();
            $mascotaData = $stmtMascota->get_result()->fetch_assoc();
            $stmtMascota->close();
            $mascotaNombre = $mascotaData['nombre'] ?? 'Mascota';

            $stmtVacuna = $conn->prepare("SELECT nombre FROM vacunas WHERE id_vacuna = ?");
            $stmtVacuna->bind_param("i", $data->vacuna_id);
            $stmtVacuna->execute();
            $vacunaData = $stmtVacuna->get_result()->fetch_assoc();
            $stmtVacuna->close();
            $vacunaNombre = $vacunaData['nombre'] ?? 'Vacuna';

            $stmt = $conn->prepare("INSERT INTO mascota_vacunas (id_mascota, id_vacuna, fecha_aplicacion) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $data->mascota_id, $data->vacuna_id, $data->fecha_aplicacion);
            if ($stmt->execute()) {
                http_response_code(201);
                $crearNotificacionOng(
                    "vacuna_agregada",
                    "Vacuna agregada",
                    "Agregaste " . $vacunaNombre . " a " . $mascotaNombre . ".",
                    "mascota",
                    $data->mascota_id,
                    [
                        "mascota_id" => $data->mascota_id,
                        "vacuna_id" => $data->vacuna_id
                    ]
                );
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

            $stmtMascota = $conn->prepare("SELECT nombre FROM mascotas WHERE id = ?");
            $stmtMascota->bind_param("i", $data->mascota_id);
            $stmtMascota->execute();
            $mascotaData = $stmtMascota->get_result()->fetch_assoc();
            $stmtMascota->close();
            $mascotaNombre = $mascotaData['nombre'] ?? 'Mascota';

            $stmtVacuna = $conn->prepare("SELECT nombre FROM vacunas WHERE id_vacuna = ?");
            $stmtVacuna->bind_param("i", $data->vacuna_id);
            $stmtVacuna->execute();
            $vacunaData = $stmtVacuna->get_result()->fetch_assoc();
            $stmtVacuna->close();
            $vacunaNombre = $vacunaData['nombre'] ?? 'Vacuna';

            $stmt = $conn->prepare("DELETE FROM mascota_vacunas WHERE id_mascota = ? AND id_vacuna = ? AND fecha_aplicacion = ?");
            $stmt->bind_param("iis", $data->mascota_id, $data->vacuna_id, $data->fecha_aplicacion);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                $crearNotificacionOng(
                    "vacuna_eliminada",
                    "Vacuna eliminada",
                    "Quitaste " . $vacunaNombre . " de " . $mascotaNombre . ".",
                    "mascota",
                    $data->mascota_id,
                    [
                        "mascota_id" => $data->mascota_id,
                        "vacuna_id" => $data->vacuna_id
                    ]
                );
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
