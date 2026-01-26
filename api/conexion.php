<?php
$host = getenv("MYSQL_HOST") ?: ($_ENV["MYSQL_HOST"] ?? "db");
$user = getenv("MYSQL_USER") ?: ($_ENV["MYSQL_USER"] ?? "");
$pass = getenv("MYSQL_PASSWORD") ?: ($_ENV["MYSQL_PASSWORD"] ?? "");
$db = getenv("MYSQL_DB") ?: ($_ENV["MYSQL_DB"] ?? "");

$conn = new mysqli($host, $user, $pass, $db);

// Verificar si hay algún error en la conexión
if ($conn->connect_error) {
    http_response_code(500);
    die("Error de conexión: " . $conn->connect_error);
}
?>
