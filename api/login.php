<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

$email = $data->email;
$password = $data->password;

// Buscar usuario
$query = $conn->prepare("SELECT * FROM usuarios WHERE email = ?");
$query->execute([$email]);
$user = $query->fetch(PDO::FETCH_ASSOC);



if ($user && $password === $user['password']) { // Compara el hash SHA256 del cliente con el de la BD
    // JWT
    $secret_key = "CLAVE_SUPER_SECRETA"; // ⚠️ Cambiala por algo propio
    $payload = [
        "user_id" => $user['id'],
        "email" => $user['email'],
        "tipo" => $user['tipo'],
        "exp" => time() + 3600
    ];
    $jwt = JWT::encode($payload, $secret_key, 'HS256');

    echo json_encode([
        "token" => $jwt,
        "tipo" => $user['tipo'],
        "message" => "Login exitoso"
    ]);
} else {
    http_response_code(401);
    echo json_encode(["message" => "Credenciales inválidas"]);
}
?>
