<?php
header("Content-Type: application/json; charset=utf-8");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

$data = $_POST;
if (!is_array($data) || empty($data)) {
    $raw_input = file_get_contents("php://input");
    $json = json_decode($raw_input, true);
    if (is_array($json)) {
        $data = $json;
    }
}

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["message" => "Payload inválido."]);
    exit;
}

function normalize_text($value) {
    if ($value === null) {
        return null;
    }
    $value = trim((string)$value);
    return $value === '' ? null : $value;
}

function limit_text($value, $max) {
    if ($value === null) {
        return null;
    }
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max, 'UTF-8');
    }
    return substr($value, 0, $max);
}

$type = isset($data['type']) ? strtoupper(trim((string)$data['type'])) : '';
$species = normalize_text($data['species'] ?? null);
$location_text = normalize_text($data['location_text'] ?? null);
$city = normalize_text($data['city'] ?? null);
$road = normalize_text($data['road'] ?? null);
$house_number = normalize_text($data['house_number'] ?? null);
$departamento = normalize_text($data['departamento'] ?? null);
$suburb = normalize_text($data['suburb'] ?? null);
$lat = normalize_text($data['lat'] ?? null);
$lon = normalize_text($data['lon'] ?? null);
if ($lat !== null && !is_numeric($lat)) {
    $lat = null;
}
if ($lon !== null && !is_numeric($lon)) {
    $lon = null;
}

if (!in_array($type, ['LOST', 'FOUND'], true)) {
    http_response_code(400);
    echo json_encode(["message" => "Tipo inválido."]);
    exit;
}

if (!$species || (!$location_text && (!$city || !$road || !$house_number))) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan campos obligatorios."]);
    exit;
}

if (!$suburb) {
    http_response_code(400);
    echo json_encode(["message" => "Debes validar la dirección para completar el barrio."]);
    exit;
}

$size = normalize_text($data['size'] ?? null);
if ($size !== null && !in_array($size, ['small', 'medium', 'large'], true)) {
    http_response_code(400);
    echo json_encode(["message" => "Tamaño inválido."]);
    exit;
}

$date_seen = normalize_text($data['date_seen'] ?? null);
if ($date_seen) {
    $date_obj = DateTime::createFromFormat('Y-m-d', $date_seen);
    if (!$date_obj || $date_obj->format('Y-m-d') !== $date_seen) {
        http_response_code(400);
        echo json_encode(["message" => "Fecha inválida."]);
        exit;
    }
}

$pet_name = normalize_text($data['pet_name'] ?? null);
$breed = normalize_text($data['breed'] ?? null);
$colors = normalize_text($data['colors'] ?? null);
$description = normalize_text($data['description'] ?? null);
$photo_url = normalize_text($data['photo_url'] ?? null);

if (!$location_text && $city && $road && $house_number) {
    $locality = $suburb && $suburb !== $city ? $suburb . ", " . $city : $city;
    $depto = $departamento ? " " . $departamento : "";
    $location_text = trim($road . " " . $house_number . $depto . ", " . $locality);
}

$species = limit_text($species, 30);
$location_text = limit_text($location_text, 120);
$pet_name = limit_text($pet_name, 100);
$breed = limit_text($breed, 80);
$colors = limit_text($colors, 255);
$photo_url = limit_text($photo_url, 255);
$suburb = limit_text($suburb, 80);

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Error al subir la imagen."]);
        exit;
    }

    $allowed_extensions = ['jpg', 'jpeg', 'png', 'webp'];
    $extension = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $allowed_extensions, true)) {
        http_response_code(400);
        echo json_encode(["message" => "Formato de imagen inválido. Usá JPG, PNG o WEBP."]);
        exit;
    }

    $directorio = "../img/mascotas/";
    if (!is_dir($directorio)) {
        mkdir($directorio, 0777, true);
    }

    $nombreArchivo = uniqid('lost_found_') . "_" . basename($_FILES['imagen']['name']);
    $rutaDestino = $directorio . $nombreArchivo;
    if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino)) {
        http_response_code(500);
        echo json_encode(["message" => "No se pudo guardar la imagen."]);
        exit;
    }

    $photo_url = "img/mascotas/" . $nombreArchivo;
}

$user_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : null;

try {
    $stmt = $conn->prepare("INSERT INTO lost_found_posts (type, user_id, pet_name, species, breed, colors, size, location_text, date_seen, description, photo_url, status, suburb, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param(
        "sissssssssssss",
        $type,
        $user_id,
        $pet_name,
        $species,
        $breed,
        $colors,
        $size,
        $location_text,
        $date_seen,
        $description,
        $photo_url,
        $suburb,
        $lat,
        $lon
    );

    if (!$stmt->execute()) {
        throw new Exception("No se pudo guardar la publicación.");
    }

    $new_id = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "message" => "Publicación creada.",
        "id" => (int)$new_id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
