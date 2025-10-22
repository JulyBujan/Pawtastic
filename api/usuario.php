<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Función para obtener el ID de usuario del token JWT
function get_user_id_from_jwt() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($authHeader)) {
        return null;
    }
    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) {
        return null;
    }
    try {
        $secret_key = $_ENV["JWT_KEY"];
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        return $decoded->user_id;
    } catch (Exception $e) {
        return null;
    }
}

$user_id = get_user_id_from_jwt();

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "Acceso no autorizado"]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $conn->prepare("SELECT nombre, apellido, telefono, foto_perfil_url, direccion, fecha_nacimiento, sexo, tipo_casa, tipo_familia, otras_mascotas, experiencia, energia, sociabilidad, presencia, estilov FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado"]);
        }
        $stmt->close();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"));

        $sql = "UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, foto_perfil_url = ?, direccion = ?, fecha_nacimiento = ?, sexo = ?, tipo_casa = ?, tipo_familia = ?, otras_mascotas = ?, experiencia = ?, energia = ?, sociabilidad = ?, presencia = ?, estilov = ? WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssssssiiiiii", 
            $data->nombre,
            $data->apellido,
            $data->telefono,
            $data->foto_perfil_url,
            $data->direccion,
            $data->fecha_nacimiento,
            $data->sexo,
            $data->tipo_casa,
            $data->tipo_familia,
            $data->otras_mascotas,
            $data->experiencia,
            $data->energia,
            $data->sociabilidad,
            $data->presencia,
            $data->estilov,
            $user_id
        );

        if ($stmt->execute()) {
            echo json_encode(["message" => "Perfil actualizado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al actualizar el perfil: " . $stmt->error]);
        }
        $stmt->close();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>