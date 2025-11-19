<?php
require_once __DIR__ . '/api_init.php';

// Incluir el verificador de token para proteger el endpoint
require_once __DIR__ . '/verificar_token.php'; // Este script ya nos da el payload en $decoded_token

// El email del usuario se obtiene del token decodificado
$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

/**
 * Gestiona la subida de una foto de perfil de usuario.
 * Si se sube una nueva, mueve el archivo, opcionalmente borra el antiguo y devuelve la nueva URL relativa.
 *
 * @param string|null $urlActual La URL relativa de la imagen actual para borrarla si se sube una nueva.
 * @return string|null La URL relativa a guardar en la BD (la nueva o la actual).
 * @throws Exception Si ocurre un error al mover el archivo.
 */
function manejarSubidaFotoPerfil($urlActual = null) {
    // Si no se subió un archivo nuevo, devolvemos la URL que ya existía.
    if (!isset($_FILES['foto_perfil']) || $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK) {
        return $urlActual;
    }

    $directorioBase = __DIR__ . '/../img/profile/'; // Usar ruta absoluta del servidor
    if (!is_dir($directorioBase)) {
        mkdir($directorioBase, 0777, true);
    }

    $nombreArchivo = "user_" . uniqid() . "_" . basename($_FILES["foto_perfil"]["name"]);
    $rutaDestino = $directorioBase . $nombreArchivo;
    $urlRelativa = "/img/profile/" . $nombreArchivo;

    if (move_uploaded_file($_FILES["foto_perfil"]["tmp_name"], $rutaDestino)) {
        // Si se subió una nueva imagen y existía una anterior, la borramos.
        if ($urlActual && file_exists(__DIR__ . '/..' . $urlActual)) {
            unlink(__DIR__ . '/..' . $urlActual);
        }
        return $urlRelativa; // Devolvemos la nueva URL relativa.
    }
    throw new Exception("Error al mover el archivo de imagen subido.");
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // --- OBTENER DATOS DEL USUARIO ---
    try {
        // Si se pasa un ID y el usuario es una ONG, se busca por ID.
        if (isset($_GET['id']) && $user_tipo === 'ong') {
            $id_a_buscar = (int)$_GET['id'];
            $stmt = $conn->prepare("SELECT id, nombre, apellido, telefono, tipo_documento, documento, city, road, house_number, departamento, suburb, lat, lon, fecha_nacimiento, sexo, tipo_casa, otras_mascotas, experiencia, energia, sociabilidad, presencia, estilov, foto_perfil_url FROM usuarios WHERE id = ? AND tipo = 'usuario'");
            if (!$stmt) {
                throw new Exception("Error en la preparación de la consulta por ID: " . $conn->error);
            }
            $stmt->bind_param("i", $id_a_buscar);
        } elseif (isset($_GET['id'])) {
            // Si se pasa un ID pero el usuario no es ONG, se deniega el acceso.
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "No tienes permiso para ver perfiles de otros usuarios."]);
            exit;
        } else {
            // Si no se pasa ID, se busca el perfil del propio usuario logueado.
            $stmt = $conn->prepare("SELECT id, nombre, apellido, telefono, tipo_documento, documento, city, road, house_number, departamento, suburb, lat, lon, fecha_nacimiento, sexo, tipo_casa, otras_mascotas, experiencia, energia, sociabilidad, presencia, estilov, foto_perfil_url FROM usuarios WHERE email = ?");
            if (!$stmt) {
                throw new Exception("Error en la preparación de la consulta por email: " . $conn->error);
            }
            $stmt->bind_param("s", $user_email);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($user = $result->fetch_assoc()) {
            // Por seguridad, nunca devolvemos la contraseña ni el token de validación
            unset($user['password']);
            unset($user['tokenv']);
            $user['tipo_documento'] = !is_null($user['tipo_documento']) ? (int)$user['tipo_documento'] : null;
            $user['lat'] = !is_null($user['lat']) ? (float)$user['lat'] : null;
            $user['lon'] = !is_null($user['lon']) ? (float)$user['lon'] : null;
            $user['otras_mascotas'] = !is_null($user['otras_mascotas']) ? (int)$user['otras_mascotas'] : null;
            $user['energia'] = !is_null($user['energia']) ? (int)$user['energia'] : null;
            $user['sociabilidad'] = !is_null($user['sociabilidad']) ? (int)$user['sociabilidad'] : null;
            $user['presencia'] = !is_null($user['presencia']) ? (int)$user['presencia'] : null;
            $user['estilov'] = !is_null($user['estilov']) ? (int)$user['estilov'] : null;

            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }

        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // --- ACTUALIZAR DATOS O SUBIR FOTO ---
    if (isset($_FILES['foto_perfil'])) {
        // --- LÓGICA PARA SUBIR FOTO ---
        try {
            // 1. Obtener la URL de la foto actual para poder borrarla.
            $stmt_current = $conn->prepare("SELECT foto_perfil_url FROM usuarios WHERE email = ?");
            $stmt_current->bind_param("s", $user_email);
            $stmt_current->execute();
            $user_actual = $stmt_current->get_result()->fetch_assoc();
            $stmt_current->close();

            // 2. Procesar la subida de la nueva imagen.
            $nuevaUrl = manejarSubidaFotoPerfil($user_actual['foto_perfil_url'] ?? null);

            // 3. Actualizar la base de datos con la nueva URL.
            $stmt_update = $conn->prepare("UPDATE usuarios SET foto_perfil_url = ? WHERE email = ?");
            $stmt_update->bind_param("ss", $nuevaUrl, $user_email);
            if (!$stmt_update->execute()) {
                throw new Exception("Error al guardar la URL en la base de datos.");
            }
            $stmt_update->close();

            echo json_encode(["message" => "Foto actualizada con éxito.", "foto_perfil_url" => $nuevaUrl]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
        }
    } else { // Si se están actualizando los datos del formulario (JSON)
        $data = json_decode(file_get_contents("php://input"));

        // Validación básica de datos
        if (empty($data->nombre) || empty($data->apellido)) {
            http_response_code(400);
            echo json_encode(["message" => "Nombre y apellido son obligatorios."]);
            exit;
        }

        try {
            $query = "UPDATE usuarios SET 
                        nombre = ?, 
                        apellido = ?, 
                        telefono = ?,
                        tipo_documento = ?,
                        documento = ?,
                        city = ?,
                        road = ?,
                        house_number = ?,
                        departamento = ?,
                        suburb = ?,
                        lat = ?,
                        lon = ?,
                        fecha_nacimiento = ?, 
                        sexo = ?, 
                        tipo_casa = ?, 
                        otras_mascotas = ?, 
                        experiencia = ?, 
                        energia = ?, 
                        sociabilidad = ?, 
                        presencia = ?, 
                        estilov = ?
                      WHERE email = ?";

            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Error en la preparación de la consulta de actualización: " . $conn->error);
            }

            // Asignar null si la fecha está vacía
            $fecha_nacimiento = !empty($data->fecha_nacimiento) ? $data->fecha_nacimiento : null;

            // Asignar null a lat/lon si no están definidos o están vacíos
            $lat = !empty($data->lat) ? (float)$data->lat : null;
            $lon = !empty($data->lon) ? (float)$data->lon : null;

            // Verificar existencia de campos opcionales para evitar warnings
            $telefono = $data->telefono ?? null;
            $documento = $data->documento ?? null;
            $city = $data->city ?? null;
            $road = $data->road ?? null;            
            $house_number = $data->house_number ?? null;
            $departamento = $data->departamento ?? null;
            $suburb = $data->suburb ?? null;
            $sexo = $data->sexo ?? null;
            $tipo_casa = $data->tipo_casa ?? null;
            $otras_mascotas = $data->otras_mascotas ?? 0;
            $experiencia = $data->experiencia ?? null;

            $stmt->bind_param(
                "sssisssissddsssisiiiis",
                $data->nombre,
                $data->apellido,
                $telefono,
                $data->tipo_documento,
                $documento,
                $city,
                $road,
                $house_number,
                $departamento,
                $suburb,
                $lat,
                $lon,
                $fecha_nacimiento,
                $sexo,
                $tipo_casa,
                $otras_mascotas,
                $experiencia,
                $data->energia,
                $data->sociabilidad,
                $data->presencia,
                $data->estilov,
                $user_email // Solo puede actualizar su propio perfil
            );

            if ($stmt->execute()) {
                echo json_encode(["message" => "Perfil actualizado con éxito."]);
            } else {
                throw new Exception("Error al actualizar el perfil.");
            }

            $stmt->close();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error en el servidor al actualizar: " . $e->getMessage()]);
        }
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Método no permitido."]);
}

$conn->close();
?>