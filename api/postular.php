<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php";
// El payload del token está ahora en la variable $decoded_token
$email = $decoded_token->email;

// Obtener datos del POST
$data = json_decode(file_get_contents("php://input"));
if (!isset($data->id_mascota)) {
    http_response_code(400);
    echo json_encode(["message" => "Falta el ID de la mascota"]);
    exit;
}
$idMascota = $data->id_mascota;
$inTransaction = false;

try {
    // Obtener el id_usuario y id_ong según el email
    $stmt = $conn->prepare("SELECT id, ong_id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $idUsuario = $user['id'] ?? null;

    if (!$idUsuario) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró un usuario asociado a este token."]);
        exit;
    }

    // Obtener id_ong, nombre y estado de la mascota
    $stmtMascota = $conn->prepare("SELECT id_ong, nombre, estado FROM mascotas WHERE id = ?");
    $stmtMascota->bind_param("i", $idMascota);
    $stmtMascota->execute();
    $resultMascota = $stmtMascota->get_result();
    $mascota = $resultMascota->fetch_assoc();
    $idOng = $mascota['id_ong'] ?? null;
    $mascotaNombre = $mascota['nombre'] ?? 'Mascota';
    $mascotaEstado = isset($mascota['estado']) ? (int) $mascota['estado'] : null;

    if (!$idOng) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró la mascota o no tiene una ONG asociada."]);
        exit;
    }
    if ($mascotaEstado !== 1) {
        http_response_code(409);
        echo json_encode(["message" => "La mascota no está disponible para postulación."]);
        exit;
    }

    // Verificar si ya existe una postulación
    $stmtCheck = $conn->prepare("SELECT id FROM adopciones WHERE id_usuario = ? AND id_mascota = ?");
    $stmtCheck->bind_param("ii", $idUsuario, $idMascota);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    if ($resultCheck->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["message" => "Ya te has postulado para esta mascota."]);
        exit;
    }

    $conn->begin_transaction();
    $inTransaction = true;

    $stmtInsert = $conn->prepare("INSERT INTO adopciones (id_usuario, id_mascota, id_ong, estado) VALUES (?, ?, ?, 0)");
    $stmtInsert->bind_param("iii", $idUsuario, $idMascota, $idOng);
    if (!$stmtInsert->execute()) {
        throw new Exception("Error al enviar la postulación: " . $stmtInsert->error);
    }

    $adopcionId = $conn->insert_id;

    $eventoTipo = "postulacion_creada";
    $eventoDetalle = "Nueva postulacion para " . $mascotaNombre;
    $eventoMeta = json_encode([
        "mascota_id" => $idMascota,
        "ong_id" => $idOng
    ]);
    $stmtEvento = $conn->prepare("INSERT INTO adopcion_eventos (adopcion_id, actor_id, tipo, estado_nuevo, detalle, metadata) VALUES (?, ?, ?, 0, ?, ?)");
    $stmtEvento->bind_param("iisss", $adopcionId, $idUsuario, $eventoTipo, $eventoDetalle, $eventoMeta);
    if (!$stmtEvento->execute()) {
        throw new Exception("Error al registrar el evento: " . $stmtEvento->error);
    }

    $stmtOngUsers = $conn->prepare("SELECT id FROM usuarios WHERE tipo = 'ong' AND ong_id = ?");
    $stmtOngUsers->bind_param("i", $idOng);
    $stmtOngUsers->execute();
    $resultOngUsers = $stmtOngUsers->get_result();

    $notifTipo = "postulacion_creada";
    $notifTitulo = "Nueva postulacion";
    $notifCuerpo = "Nueva postulacion para " . $mascotaNombre . ". La ONG revisará todas las solicitudes.";
    $notifEntidadTipo = "adopcion";
    $notifEntidadId = $adopcionId;
    $notifPayload = json_encode([
        "adopcion_id" => $adopcionId,
        "mascota_id" => $idMascota
    ]);
    $stmtNotif = $conn->prepare("INSERT INTO notificaciones (usuario_id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    while ($row = $resultOngUsers->fetch_assoc()) {
        $ongUserId = (int) $row['id'];
        $stmtNotif->bind_param("iissssis", $ongUserId, $idUsuario, $notifTipo, $notifTitulo, $notifCuerpo, $notifEntidadTipo, $notifEntidadId, $notifPayload);
        if (!$stmtNotif->execute()) {
            throw new Exception("Error al crear la notificacion: " . $stmtNotif->error);
        }
    }

    $stmtOngUsers->close();
    $stmtNotif->close();
    $stmtEvento->close();

    $conn->commit();

    http_response_code(201);
    echo json_encode(["message" => "Postulación enviada con éxito."]);

} catch (Exception $e) {
    if ($inTransaction) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>
