<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

// Verificar token y obtener payload en $decoded_token
include_once "verificar_token.php"; // Define $decoded_token
$ong_email = $decoded_token->email;

// Verificar que el método sea POST para la edición
if (
    $_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id']) ||
    empty($_POST['nombre']) || empty($_POST['tipo']) || !isset($_POST['edad']) ||
    empty($_POST['sexo']) || empty($_POST['tamaño']) || empty($_POST['descripcion']) ||
    !isset($_POST['vacunado']) || !isset($_POST['esterilizado']) || !isset($_POST['chip']) ||
    empty($_POST['energia']) || empty($_POST['sociabilidad']) || empty($_POST['presencia']) ||
    empty($_POST['estilov'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
    exit;
}

// --- Validación y Sanitización de Datos ---
// Convertir a enteros los campos que deben serlo
$id = (int)$_POST['id'];
$edad = (int)$_POST['edad'];
$energia = (int)$_POST['energia'];
$sociabilidad = (int)$_POST['sociabilidad'];
$presencia = (int)$_POST['presencia'];
$estilov = (int)$_POST['estilov'];

// Limpiar strings
$nombre = trim($_POST['nombre']);
$tipo = trim($_POST['tipo']);
$sexo = trim($_POST['sexo']);
$tamaño = trim($_POST['tamaño']);
$descripcion = trim($_POST['descripcion']);
$vacunado = trim($_POST['vacunado']);
$esterilizado = trim($_POST['esterilizado']);
$chip = trim($_POST['chip']);

// Procesar imagen si se cargó
$nombre_imagen = "";
if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] == 0) {
    $tmp_name = $_FILES["imagen"]["tmp_name"];
    $nombre_original = basename($_FILES["imagen"]["name"]);
    $ext = pathinfo($nombre_original, PATHINFO_EXTENSION);
    $nombre_imagen = uniqid("img_") . "." . $ext;
    $ruta_destino = "../img/mascotas/" . $nombre_imagen;

    if (!move_uploaded_file($tmp_name, $ruta_destino)) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen. Verifique los permisos de la carpeta 'img/mascotas'."]);
        exit;
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
    $sql = "UPDATE mascotas SET nombre = ?, tipo = ?, edad = ?, sexo = ?, tamaño = ?, descripcion = ?, vacunado = ?, esterilizado = ?, chip = ?, energia = ?, sociabilidad = ?, presencia = ?, estilov = ?";
    $types = "ssisssssssiii";
    $params = [$nombre, $tipo, $edad, $sexo, $tamaño, $descripcion, $vacunado, $esterilizado, $chip, $energia, $sociabilidad, $presencia, $estilov];

    if ($nombre_imagen) {
        $sql .= ", imagen = ?";
        $types .= "s";
        $params[] = $nombre_imagen;
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