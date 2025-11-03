<?php
header("Content-Type: application/json");
require "conexion.php";

// Incluir el verificador de token para proteger el endpoint
require __DIR__ . '/vendor/autoload.php';
require "verificar_token.php"; // Este script ya nos da el payload en $decoded_token

// El email del usuario se obtiene del token decodificado
$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

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
            // Convertir valores numéricos de preferencias a enteros
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
        $directorio = "../img/profile/";
        if (!is_dir($directorio)) {
            mkdir($directorio, 0777, true);
        }

        $nombreArchivo = "user_" . uniqid() . "_" . basename($_FILES["foto_perfil"]["name"]);
        $rutaDestino = $directorio . $nombreArchivo;
        $urlRelativa = "/img/profile/" . $nombreArchivo;

        if (move_uploaded_file($_FILES["foto_perfil"]["tmp_name"], $rutaDestino)) {
            try {
                $stmt = $conn->prepare("UPDATE usuarios SET foto_perfil_url = ? WHERE email = ?"); // Solo puede actualizar su propia foto
                $stmt->bind_param("ss", $urlRelativa, $email);
                if ($stmt->execute()) {
                    echo json_encode(["message" => "Foto actualizada con éxito.", "foto_perfil_url" => $urlRelativa]);
                } else {
                    throw new Exception("Error al guardar la URL en la base de datos.");
                }
                $stmt->close();
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al subir el archivo."]);
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

            // Asignar null si el tipo de documento está vacío, de lo contrario convertir a entero
            $tipo_documento = !empty($data->tipo_documento) ? (int)$data->tipo_documento : null;

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
            $otras_mascotas = $data->otras_mascotas ?? null;
            $experiencia = $data->experiencia ?? null;

            $stmt->bind_param(
                "sssisssisssdsisiiiis",
                $data->nombre,
                $data->apellido,
                $data->telefono,
                $tipo_documento,
                $data->documento,
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