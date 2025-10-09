<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Verificar encabezado Authorization
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["message" => "Falta token"]);
    exit;
}

// Extraer token del encabezado
list(, $jwt) = explode(' ', $headers['Authorization']);
$key = "CLAVE_SUPER_SECRETA"; // 🔥 MISMA clave que en login.php

try {
    $decoded = JWT::decode($jwt, new Key($key, 'HS256'));
    $ong_email = $decoded->email; // recuperamos el email desde el token
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido o expirado"]);
    exit;
}

// Verificar si llegaron los campos obligatorios
if (
    empty($_POST['nombre']) || empty($_POST['tipo']) || empty($_POST['edad']) ||
    empty($_POST['sexo']) || empty($_POST['tamaño']) || empty($_POST['descripcion'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos"]);
    exit;
}

$nombre = $_POST['nombre'];
$tipo = $_POST['tipo'];
$edad = $_POST['edad'];
$sexo = $_POST['sexo'];
$tamaño = $_POST['tamaño'];
$descripcion = $_POST['descripcion'];

// Manejo de imagen
$imagen = null;
if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
    $directorio = "../img/mascotas/";
    if (!is_dir($directorio)) mkdir($directorio, 0777, true);
    
    $nombreArchivo = uniqid() . "_" . basename($_FILES["imagen"]["name"]);
    $rutaDestino = $directorio . $nombreArchivo;
    
    if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $rutaDestino)) {
        $imagen = "img/mascotas/" . $nombreArchivo;
    }
}

try {
    // Buscar el ID de la ONG según su email (del token)
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND tipo = 'ong' LIMIT 1");
    $stmt->execute([$ong_email]);
    $idOng = $stmt->fetchColumn();

    if (!$idOng) {
        http_response_code(403);
        echo json_encode(["message" => "No se encontró una ONG válida para este usuario"]);
        exit;
    }

    // Insertar mascota con el ID real de la ONG y el email
    $query = $conn->prepare("
        INSERT INTO mascotas (nombre, tipo, edad, sexo, tamaño, descripcion, imagen, id_ong, ong_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $query->execute([$nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $imagen, $idOng, $ong_email]);

    echo json_encode(["message" => "Mascota cargada con éxito 💚"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

?>
