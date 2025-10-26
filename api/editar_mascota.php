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
    empty($_POST['id']) || empty($_POST['nombre']) || empty($_POST['tipo']) || empty($_POST['edad']) ||
    empty($_POST['sexo']) || empty($_POST['tamaño']) || empty($_POST['descripcion']) ||
    empty($_POST['vacunado']) || empty($_POST['esterilizado']) || empty($_POST['chip']) ||
    empty($_POST['energia']) || empty($_POST['sociabilidad']) || empty($_POST['presencia']) ||
    empty($_POST['estilo'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
    exit;
}

$id = $_POST['id'];
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
$estilo = $_POST['estilo'];

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

    // Verificar que la mascota pertenezca a la ONG
    $stmt = $conn->prepare("SELECT id FROM mascotas WHERE id = ? AND id_ong = ?");
    $stmt->execute([$id, $idOng]);
    if ($stmt->rowCount() == 0) {
        http_response_code(403);
        echo json_encode(["message" => "No tienes permiso para editar esta mascota"]);
        exit;
    }

    // Actualizar mascota
    $sql = "UPDATE mascotas SET nombre = ?, tipo = ?, edad = ?, sexo = ?, tamaño = ?, descripcion = ?, vacunado = ?, esterilizado = ?, chip = ?, energia = ?, sociabilidad = ?, presencia = ?, estilo = ?";
    $params = [$nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $vacunado, $esterilizado, $chip, $energia, $sociabilidad, $presencia, $estilo];

    if ($imagen) {
        $sql .= ", imagen = ?";
        $params[] = $imagen;
    }

    $sql .= " WHERE id = ?";
    $params[] = $id;

    $query = $conn->prepare($sql);
    $query->execute($params);

    echo json_encode(["message" => "Mascota actualizada con éxito 💚"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

?>