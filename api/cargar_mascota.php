<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php";
// El payload del token está ahora en la variable $decoded_token
$ong_email = $decoded_token->email; // recuperamos el email desde el token

// Verificar si llegaron los campos obligatorios
if (
    empty($_POST['nombre']) || empty($_POST['tipo']) || empty($_POST['edad']) ||
    empty($_POST['sexo']) || empty($_POST['tamaño']) || empty($_POST['descripcion']) ||
    !isset($_POST['vacunado']) || !isset($_POST['esterilizado']) || !isset($_POST['chip']) ||
    empty($_POST['energia']) || empty($_POST['sociabilidad']) || empty($_POST['presencia']) ||
    empty($_POST['estilov'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
    exit;
}

$nombre = $_POST['nombre'];
$tipo = $_POST['tipo'];
$edad = $_POST['edad'];
$sexo = $_POST['sexo'];
$tamaño = $_POST['tamaño'];
$descripcion = $_POST['descripcion'];
$vacunado = $_POST['vacunado'];
$esterilizado = $_POST['esterilizado'];
$chip = $_POST['chip'];
$energia = $_POST['energia'];
$sociabilidad = $_POST['sociabilidad'];
$presencia = $_POST['presencia'];
$estilov = $_POST['estilov'];

// Manejo de imagen
$imagen_path = null;
if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
    $directorio = "../img/mascotas/";
    if (!is_dir($directorio)) {
        mkdir($directorio, 0777, true);
    }
    
    $nombreArchivo = uniqid('mascota_') . "_" . basename($_FILES["imagen"]["name"]);
    $rutaDestino = $directorio . $nombreArchivo;
    
    if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $rutaDestino)) {
        $imagen_path = $nombreArchivo; // Solo guardar el nombre del archivo
    }
}

try {
    // Buscar el ID de la ONG según su email (del token)
    $stmt = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ? AND tipo = 'ong' LIMIT 1");
    $stmt->bind_param("s", $ong_email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $idOng = $user['ong_id'] ?? null;

    if (!$idOng) {
        http_response_code(403);
        echo json_encode(["message" => "No se encontró una ONG válida para este usuario"]);
        exit;
    }

    // Insertar mascota con el ID real de la ONG
    $query = $conn->prepare("
        INSERT INTO mascotas (nombre, tipo, edad, sexo, tamaño, descripcion, imagen, id_ong, vacunado, esterilizado, chip, energia, sociabilidad, presencia, estilov)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $query->bind_param("ssisssssisiiiii", $nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $imagen_path, $idOng, $vacunado, $esterilizado, $chip, $energia, $sociabilidad, $presencia, $estilov);
    $query->execute();

    echo json_encode(["message" => "Mascota cargada con éxito 💚"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

?>
