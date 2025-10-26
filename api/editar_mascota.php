<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php"; // Define $decoded_token
$ong_email = $decoded_token->email;

// Verificar que el método sea POST para la edición
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
        $imagen = $nombreArchivo; // Guardar solo el nombre del archivo
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
    $stmt->close();

    // Verificar que la mascota pertenezca a la ONG
    $stmt = $conn->prepare("SELECT id FROM mascotas WHERE id = ? AND id_ong = ?");
    $stmt->bind_param("ii", $id, $idOng);
    $stmt->execute();
    $stmt->store_result(); // Necesario para poder usar num_rows
    if ($stmt->num_rows == 0) {
        http_response_code(403);
        echo json_encode(["message" => "No tienes permiso para editar esta mascota"]);
        exit;
    }
    $stmt->close();

    // Actualizar mascota
    $sql = "UPDATE mascotas SET nombre = ?, tipo = ?, edad = ?, sexo = ?, tamaño = ?, descripcion = ?, vacunado = ?, esterilizado = ?, chip = ?, energia = ?, sociabilidad = ?, presencia = ?, estilo = ?";
    $types = "ssssssssiiiii";
    $params = [$nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $vacunado, $esterilizado, $chip, $energia, $sociabilidad, $presencia, $estilo];

    if ($imagen) {
        $sql .= ", imagen = ?";
        $types .= "s";
        $params[] = $imagen;
    }

    $sql .= " WHERE id = ? AND id_ong = ?";
    $types .= "ii";
    $params[] = $id;
    $params[] = $idOng;

    $query = $conn->prepare($sql);
    $query->bind_param($types, ...$params);
    $query->execute();

    echo json_encode(["message" => "Mascota actualizada con éxito 💚"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
$conn->close();
?>