<?php
require_once __DIR__ . '/api_init.php'; // Incluye headers, error handler, y conexión ($conn)

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php";
$ong_email = $decoded_token->email; // recuperamos el email desde el token

// Obtener el ID de la ONG para seguridad
// solo al principio porque después lo utilizan todos los casos
$idOng = null;
$actorId = null;
try {
    $stmt_ong = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ? AND tipo = 'ong' LIMIT 1");
    $stmt_ong->bind_param("s", $ong_email);
    $stmt_ong->execute();
    $idOng = $stmt_ong->get_result()->fetch_assoc()['ong_id'] ?? null;
    $stmt_ong->close();
    if (!$idOng) {
        http_response_code(403);
        echo json_encode(["message" => "Usuario de ONG no válido."]);
        exit;
    }
    $stmt_actor = $conn->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
    $stmt_actor->bind_param("s", $ong_email);
    $stmt_actor->execute();
    $actorId = $stmt_actor->get_result()->fetch_assoc()['id'] ?? null;
    $stmt_actor->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

function crearNotificacionOng($conn, $idOng, $actorId, $tipo, $titulo, $cuerpo, $entidadTipo, $entidadId, $payload = null) {
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
}

/**
 * Gestiona la subida de una imagen de mascota.
 * Si se sube una nueva, mueve el archivo, opcionalmente borra el antiguo y devuelve el nuevo nombre.
 *
 * @param string|null $imagenActual El nombre del archivo de la imagen actual para borrarla si se sube una nueva.
 * @return string|null El nombre del archivo a guardar en la BD (el nuevo o el actual).
 * @throws Exception Si ocurre un error al mover el archivo.
 */
function manejarSubidaImagen($imagenActual = null) {
    // Si no se subió un archivo nuevo, devolvemos el nombre del archivo que ya existía.
    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        return $imagenActual;
    }

    $directorio = "../img/mascotas/";
    if (!is_dir($directorio)) {
        mkdir($directorio, 0777, true);
    }

    $nombreArchivo = uniqid('mascota_') . "_" . basename($_FILES["imagen"]["name"]);
    $rutaDestino = $directorio . $nombreArchivo;

    if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $rutaDestino)) {
        // Si se subió una nueva imagen y existía una anterior, la borramos.
        if ($imagenActual && file_exists($directorio . $imagenActual)) {
            unlink($directorio . $imagenActual);
        }
        return $nombreArchivo; // Devolvemos el nombre del nuevo archivo.
    } else {
        throw new Exception("Error al mover el archivo de imagen subido.");
    }
}

/**
 * Guarda imagenes extra para una mascota (hasta $maxExtra).
 * @param mysqli $conn
 * @param int $idMascota
 * @param int $maxExtra
 * @return array Lista de nombres de archivo subidos
 * @throws Exception
 */
function guardarImagenesExtra($conn, $idMascota, $maxExtra = 3) {
    $uploaded = [];
    if (!isset($_FILES['imagenes'])) {
        return $uploaded;
    }

    $names = $_FILES['imagenes']['name'];
    $tmpNames = $_FILES['imagenes']['tmp_name'];
    $errors = $_FILES['imagenes']['error'];

    if (!is_array($names)) {
        $names = [$names];
        $tmpNames = [$tmpNames];
        $errors = [$errors];
    }

    $totalFiles = count($names);
    if ($totalFiles === 0) {
        return $uploaded;
    }

    $indices = [];
    for ($i = 0; $i < $totalFiles; $i++) {
        if ($errors[$i] !== UPLOAD_ERR_NO_FILE) {
            $indices[] = $i;
        }
    }
    $filesToUpload = count($indices);
    if ($filesToUpload === 0) {
        return $uploaded;
    }
    if ($filesToUpload > $maxExtra) {
        throw new Exception("Solo podes subir hasta {$maxExtra} fotos adicionales.");
    }

    $stmtCount = $conn->prepare("SELECT COUNT(*) AS total FROM ImagenesMascota WHERE mascota_id = ?");
    $stmtCount->bind_param("i", $idMascota);
    $stmtCount->execute();
    $currentCount = (int) ($stmtCount->get_result()->fetch_assoc()['total'] ?? 0);
    $stmtCount->close();

    if ($currentCount + $filesToUpload > $maxExtra) {
        throw new Exception("Esta mascota ya tiene {$maxExtra} fotos adicionales.");
    }

    $directorio = "../img/mascotas/";
    if (!is_dir($directorio)) {
        mkdir($directorio, 0777, true);
    }

    $allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    $stmtImg = $conn->prepare("INSERT INTO ImagenesMascota (mascota_id, url_imagen) VALUES (?, ?)");

    foreach ($indices as $i) {
        if ($errors[$i] !== UPLOAD_ERR_OK) {
            throw new Exception("Error al subir una de las fotos adicionales.");
        }
        $extension = strtolower(pathinfo($names[$i], PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            throw new Exception("Formato de imagen extra inválido. Usá JPG, PNG o WEBP.");
        }
        $nombreArchivo = uniqid('mascota_extra_') . "_" . basename($names[$i]);
        $rutaDestino = $directorio . $nombreArchivo;

        if (!move_uploaded_file($tmpNames[$i], $rutaDestino)) {
            throw new Exception("Error al mover una de las fotos adicionales.");
        }

        $stmtImg->bind_param("is", $idMascota, $nombreArchivo);
        if (!$stmtImg->execute()) {
            throw new Exception("Error al guardar las fotos adicionales.");
        }
        $uploaded[] = $nombreArchivo;
    }

    $stmtImg->close();

    return $uploaded;
}

// --- Manejo de Borrado Lógico (Método DELETE) ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Obtener el ID de la mascota desde la URL (query parameter)
    $idMascota = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($idMascota <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "ID de mascota no válido."]);
        exit;
    }
    $stmt = $conn->prepare("SELECT imagen FROM mascotas WHERE id = ? AND id_ong = ?");
    $stmt->bind_param("ii", $idMascota, $idOng);
    $stmt->execute();
    $result = $stmt->get_result();
    $mascota_actual = $result->fetch_assoc();
    if (!$mascota_actual) {
        http_response_code(403); // Forbidden
        echo json_encode(["message" => "No tienes permiso para editar esta mascota."]);
        exit;
    }
    
    try {
        // Actualizar el estado de la mascota a '2' (eliminado lógicamente)
        // Se verifica que la mascota pertenezca a la ONG que realiza la petición
        $stmt_delete = $conn->prepare("UPDATE mascotas SET estado = 2 WHERE id = ? AND id_ong = ?");
        $stmt_delete->bind_param("ii", $idMascota, $idOng);
        $stmt_delete->execute();

        $notifTipo = "mascota_archivada";
        $notifTitulo = "Mascota archivada";
        $notifCuerpo = "Archivaste una mascota.";
        crearNotificacionOng($conn, $idOng, $actorId, $notifTipo, $notifTitulo, $notifCuerpo, "mascota", $idMascota, [
            "mascota_id" => $idMascota
        ]);

        echo json_encode(["message" => "Mascota archivada con éxito."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }
    exit; // Terminar el script después de manejar DELETE
}

// --- Validación y Sanitización de Datos (Común para Crear y Editar) ---
// Verificar si llegaron los campos obligatorios
if (
    empty($_POST['nombre']) || empty($_POST['tipo']) || empty($_POST['edad']) ||
    empty($_POST['sexo']) || empty($_POST['tamaño']) || empty($_POST['descripcion']) ||
    !isset($_POST['vacunado']) || !isset($_POST['esterilizado']) || !isset($_POST['chip']) ||
    empty($_POST['energia']) || empty($_POST['sociabilidad']) || empty($_POST['presencia']) ||
    empty($_POST['estilov']) || !isset($_POST['apto_ninos']) || !isset($_POST['apto_mascotas'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
    exit;
}

// Convertir a enteros los campos que deben serlo
$edad = (int)$_POST['edad'];
$energia = (int)$_POST['energia'];
$sociabilidad = (int)$_POST['sociabilidad'];
$presencia = (int)$_POST['presencia'];
$estilov = (int)$_POST['estilov'];

// Limpiar strings
$nombre = trim($_POST['nombre']);
$tipo = trim($_POST['tipo']);
$sexo = trim($_POST['sexo']);
$tamaño = trim($_POST['tamaño']);
$descripcion = trim($_POST['descripcion']);
$vacunado = trim($_POST['vacunado']);
$breed = !empty($_POST['breed']) ? trim($_POST['breed']) : null; // Sanitizar breed
$color = !empty($_POST['color']) ? trim($_POST['color']) : null; // Sanitizar color
$esterilizado = trim($_POST['esterilizado']);
$chip = trim($_POST['chip']);
$apto_ninos = (int)$_POST['apto_ninos'];
$apto_mascotas = (int)$_POST['apto_mascotas'];
$extraImagesUploaded = [];

try {
    $conn->begin_transaction(); // Iniciar transacción
    // --- Diferenciar entre CREAR (INSERT) y EDITAR (UPDATE) ---
    $idMascota = !empty($_POST['id']) ? (int)$_POST['id'] : null;
    $vacunasPayload = [];
    if (!empty($_POST['vacunas'])) {
        $vacunasPayload = json_decode($_POST['vacunas'], true);
        if (!is_array($vacunasPayload)) {
            throw new Exception("Formato de vacunas inválido.");
        }
    }

    if ($idMascota) {
        // --- MODO EDICIÓN (UPDATE) ---
        $stmt = $conn->prepare("SELECT imagen FROM mascotas WHERE id = ? AND id_ong = ?");
        $stmt->bind_param("ii", $idMascota, $idOng);
        $stmt->execute();
        $result = $stmt->get_result();
        $mascota_actual = $result->fetch_assoc();

        if (!$mascota_actual) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "No tienes permiso para editar esta mascota."]);
            exit;
        }

        $imagen_path = manejarSubidaImagen($mascota_actual['imagen']); // La función ya devuelve la imagen actual si no se sube una nueva.

        $query = $conn->prepare("
            UPDATE mascotas SET 
            nombre = ?, tipo = ?, edad = ?, sexo = ?, tamaño = ?, descripcion = ?, imagen = ?, breed = ?, color = ?,
            vacunado = ?, esterilizado = ?, chip = ?, apto_ninos = ?, apto_mascotas = ?, 
            energia = ?, sociabilidad = ?, presencia = ?, estilov = ?
            WHERE id = ? AND id_ong = ?
        ");
        $query->bind_param(
            "ssissssssssssiiiiiii", 
            $nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $imagen_path, $breed, $color,
            $vacunado, $esterilizado, $chip, $apto_ninos, $apto_mascotas,
            $energia, $sociabilidad, $presencia, $estilov, 
            $idMascota, $idOng
        );
        $query->execute();

        // affected_rows can be 0 if the data submitted is the same as the existing data.
        // This is not an error. An error is indicated by -1.
        if ($query->affected_rows === -1) {
            throw new Exception("Error al actualizar la mascota en la base de datos.");
        }

        $extraImagesUploaded = array_merge($extraImagesUploaded, guardarImagenesExtra($conn, $idMascota));

        $notifTipo = "mascota_actualizada";
        $notifTitulo = "Mascota actualizada";
        $notifCuerpo = "Actualizaste los datos de " . $nombre . ".";
        crearNotificacionOng($conn, $idOng, $actorId, $notifTipo, $notifTitulo, $notifCuerpo, "mascota", $idMascota, [
            "mascota_id" => $idMascota
        ]);

        echo json_encode(["message" => "Mascota actualizada con éxito."]);
        $conn->commit(); // Confirmar transacción

    } else {
        // --- MODO CREACIÓN (INSERT) ---
        $imagen_path = manejarSubidaImagen(); // Usamos la función para manejar la subida.
        $query = $conn->prepare("
            INSERT INTO mascotas 
            (nombre, tipo, edad, sexo, tamaño, descripcion, imagen, id_ong, breed, color, vacunado, esterilizado, chip, apto_ninos, apto_mascotas,
            energia, sociabilidad, presencia, estilov, date_publicacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        "); // The last value is NOW(), which doesn't need a placeholder
        $query->bind_param("ssissssissssssiiiii",  // Corrected: 19 types for 19 variables
            $nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $imagen_path, $idOng, $breed, $color, $vacunado, $esterilizado, $chip, $apto_ninos, $apto_mascotas, 
            $energia, $sociabilidad, $presencia, $estilov);
        $query->execute();

        if ($query->affected_rows === 0) {
            throw new Exception("No se pudo crear la mascota en la base de datos.");
        }

        $newMascotaId = $query->insert_id;
        if ($newMascotaId && !empty($vacunasPayload)) {
            $stmtVacunas = $conn->prepare("INSERT INTO mascota_vacunas (id_mascota, id_vacuna, fecha_aplicacion) VALUES (?, ?, ?)");
            foreach ($vacunasPayload as $vacuna) {
                $vacunaId = isset($vacuna['vacuna_id']) ? (int)$vacuna['vacuna_id'] : 0;
                $fechaAplicacion = isset($vacuna['fecha_aplicacion']) ? $vacuna['fecha_aplicacion'] : null;
                if ($vacunaId <= 0 || empty($fechaAplicacion)) {
                    throw new Exception("Datos de vacunas incompletos.");
                }
                $stmtVacunas->bind_param("iis", $newMascotaId, $vacunaId, $fechaAplicacion);
                if (!$stmtVacunas->execute()) {
                    throw new Exception("Error al guardar las vacunas.");
                }
            }
            $stmtVacunas->close();
        }

        if ($newMascotaId) {
            $extraImagesUploaded = array_merge($extraImagesUploaded, guardarImagenesExtra($conn, $newMascotaId));
        }

        $notifTipo = "mascota_creada";
        $notifTitulo = "Mascota publicada";
        $notifCuerpo = "Publicaste a " . $nombre . ".";
        crearNotificacionOng($conn, $idOng, $actorId, $notifTipo, $notifTitulo, $notifCuerpo, "mascota", $newMascotaId, [
            "mascota_id" => $newMascotaId
        ]);

        echo json_encode(["message" => "Mascota cargada con éxito.", "id" => $newMascotaId]);
        $conn->commit(); // Confirmar transacción
    }
} catch (Exception $e) {
    $conn->rollback(); // Revertir transacción en caso de error

    // Si se subió una imagen nueva pero la BD falló, la borramos.
    if (isset($imagen_path) && isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $rutaCompleta = "../img/mascotas/" . $imagen_path;
        if (file_exists($rutaCompleta)) {
            unlink($rutaCompleta);
        }
    }
    if (!empty($extraImagesUploaded)) {
        foreach ($extraImagesUploaded as $extraImg) {
            $rutaExtra = "../img/mascotas/" . $extraImg;
            if (file_exists($rutaExtra)) {
                unlink($rutaExtra);
            }
        }
    }
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

?>
