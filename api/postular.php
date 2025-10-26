<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Verificar token
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["message" => "Falta token"]);
    exit;
}

list(, $jwt) = explode(' ', $headers['Authorization']);
$key = $_ENV["JWT_KEY"];

try {
    $decoded = JWT::decode($jwt, new Key($key, 'HS256'));
    $email = $decoded->email;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido o expirado: " . $e->getMessage()]);
    exit;
}

// Obtener datos del POST
$data = json_decode(file_get_contents("php://input"));
if (!isset($data->id_mascota)) {
    http_response_code(400);
    echo json_encode(["message" => "Falta el ID de la mascota"]);
    exit;
}
$idMascota = $data->id_mascota;

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

    // Obtener id_ong de la mascota
    $stmtMascota = $conn->prepare("SELECT id_ong FROM mascotas WHERE id = ?");
    $stmtMascota->bind_param("i", $idMascota);
    $stmtMascota->execute();
    $resultMascota = $stmtMascota->get_result();
    $mascota = $resultMascota->fetch_assoc();
    $idOng = $mascota['id_ong'] ?? null;

    if (!$idOng) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró la mascota o no tiene una ONG asociada."]);
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

    // Insertar la postulación
    $stmtInsert = $conn->prepare("INSERT INTO adopciones (id_usuario, id_mascota, id_ong, estado) VALUES (?, ?, ?, 0)");
    $stmtInsert->bind_param("iii", $idUsuario, $idMascota, $idOng);
    
    if ($stmtInsert->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Postulación enviada con éxito."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al enviar la postulación: " . $stmtInsert->error]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>
