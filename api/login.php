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

$email = $data->email;
$password = $data->password;

// Usar consultas preparadas para mayor seguridad
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();

    // La contraseña ya viene hasheada desde el cliente
    if ($password === $user['password']) {

        // Verificar si la cuenta está activa (estado = 0)
        if ($user['estado'] != 0) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "Tu cuenta no ha sido validada. Por favor, revisa tu correo para activarla."]);
            exit;
        }

        $secret_key = $_ENV["JWT_KEY"];
        $payload = [
            "user_id" => $user['id'],
            "email" => $user['email'],
            "tipo" => $user['tipo'],
            "exp" => time() + 3600 // Expira en 1 hora
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

// Si se llega a este punto, las credenciales son inválidas
http_response_code(401);
echo json_encode(["message" => "Credenciales inválidas"]);
?>