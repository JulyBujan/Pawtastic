<?php
$host = "localhost";
$dbname = "dbpawtastic"; // ⚠️ Cambiá el nombre si tu base se llama distinto
$username = "root"; // o el usuario que uses
$password = ""; // si tenés contraseña en MySQL, ponela acá

try {
  $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
  echo json_encode(["message" => "Error en la conexión: " . $e->getMessage()]);
  exit;
}
?>
