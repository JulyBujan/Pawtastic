<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

$email = $conn->real_escape_string($data->email);
$password = $data->password;

$sql = "SELECT * FROM usuarios WHERE email = '$email'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();

    if (hash('sha256', $password) === $user['password']) {

        // Verificar si la cuenta está activa
        if ($user['estado'] === 'pendiente') {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "Tu cuenta está pendiente de validación. Por favor, revisa tu correo electrónico."]);
            exit;
        }

        $secret_key = $_ENV["JWT_KEY"];
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
        exit;
    }
}

// Si llegó acá, falló el login
http_response_code(401);
echo json_encode(["message" => "Credenciales inválidas"]);
?>