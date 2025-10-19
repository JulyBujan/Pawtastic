<?php
$host = "192.168.71.150";
$user = "pawuser";
$pass = "pawpass123";
$dbname = "dbpawtastic";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["message" => "Conexión fallida: " . $conn->connect_error]));
}


?>


