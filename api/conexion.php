<?php
$host = getenv("MYSQL_HOST") ?: ($_ENV["MYSQL_HOST"] ?? "db");
$user = getenv("MYSQL_USER") ?: ($_ENV["MYSQL_USER"] ?? "");
$pass = getenv("MYSQL_PASSWORD") ?: ($_ENV["MYSQL_PASSWORD"] ?? "");
$db = getenv("MYSQL_DB") ?: ($_ENV["MYSQL_DB"] ?? "");

$conn = new mysqli($host, $user, $pass, $db);

// Verificar si hay algún error en la conexión
if ($conn->connect_error) {
    if (!headers_sent()) {
        http_response_code(500);
        header("Content-Type: application/json");
    }
    echo json_encode(["message" => "Error de conexión a la base de datos."]);
    exit;
}

if (!$conn->set_charset("utf8mb4")) {
    if (!headers_sent()) {
        http_response_code(500);
        header("Content-Type: application/json");
    }
    echo json_encode(["message" => "Error al configurar el charset de la base de datos."]);
    exit;
}
?>
