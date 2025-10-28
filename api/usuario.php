<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Incluir el verificador de token para proteger el endpoint
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script ya nos da el payload en $decoded_token

// El email del usuario se obtiene del token decodificado
$email = $decoded_token->email;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // --- OBTENER DATOS DEL USUARIO ---
    try {
        $stmt = $conn->prepare("SELECT id, nombre, apellido, telefono, direccion, fecha_nacimiento, sexo, tipo_casa, tipo_familia, otras_mascotas, experiencia, energia, sociabilidad, presencia, estilov FROM usuarios WHERE email = ?");
        if (!$stmt) {
            throw new Exception("Error en la preparación de la consulta: " . $conn->error);
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($user = $result->fetch_assoc()) {
            // Convertir valores numéricos de preferencias a enteros
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
    // --- ACTUALIZAR DATOS DEL USUARIO ---
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
                    direccion = ?, 
                    fecha_nacimiento = ?, 
                    sexo = ?, 
                    tipo_casa = ?, 
                    tipo_familia = ?, 
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

        $stmt->bind_param(
            "ssssssssssiiiis",
            $data->nombre,
            $data->apellido,
            $data->telefono,
            $data->direccion,
            $fecha_nacimiento,
            $data->sexo,
            $data->tipo_casa,
            $data->tipo_familia,
            $data->otras_mascotas,
            $data->experiencia,
            $data->energia,
            $data->sociabilidad,
            $data->presencia,
            $data->estilov,
            $email
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
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Método no permitido."]);
}

$conn->close();
?>