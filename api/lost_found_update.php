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

$post_id = isset($data['id']) ? (int)$data['id'] : 0;
if (!$post_id) {
    http_response_code(400);
    echo json_encode(["message" => "ID inválido."]);
    exit;
}

$user_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : 0;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido."]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, user_id, location_text, suburb, lat, lon, photo_url FROM lost_found_posts WHERE id = ? AND deleted_at IS NULL");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $post = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$post) {
        http_response_code(404);
        echo json_encode(["message" => "Publicación no encontrada."]);
        exit;
    }

    $owner_id = $post['user_id'] !== null ? (int)$post['user_id'] : null;
    if ($owner_id === null || $owner_id !== $user_id) {
        http_response_code(403);
        echo json_encode(["message" => "No tienes permisos para editar esta publicación."]);
        exit;
    }

    $type = isset($data['type']) ? strtoupper(trim((string)$data['type'])) : '';
    $species = normalize_text($data['species'] ?? null);
    if (!in_array($type, ['LOST', 'FOUND'], true)) {
        http_response_code(400);
        echo json_encode(["message" => "Tipo inválido."]);
        exit;
    }
    if (!$species) {
        http_response_code(400);
        echo json_encode(["message" => "La especie es obligatoria."]);
        exit;
    }

    $city = normalize_text($data['city'] ?? null);
    $road = normalize_text($data['road'] ?? null);
    $house_number = normalize_text($data['house_number'] ?? null);
    $departamento = normalize_text($data['departamento'] ?? null);
    $suburb = normalize_text($data['suburb'] ?? null);
    $lat = normalize_text($data['lat'] ?? null);
    $lon = normalize_text($data['lon'] ?? null);
    $location_text = normalize_text($data['location_text'] ?? null);

    if ($lat !== null && !is_numeric($lat)) {
        $lat = null;
    }
    if ($lon !== null && !is_numeric($lon)) {
        $lon = null;
    }

    $has_location_update = $city || $road || $house_number || $departamento || $suburb || $lat || $lon || $location_text;

    if ($has_location_update) {
        if (!$suburb) {
            http_response_code(400);
            echo json_encode(["message" => "Debes validar la dirección para completar el barrio."]);
            exit;
        }
        if (!$location_text) {
            if (!$city || !$road || !$house_number) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan datos para la dirección."]);
                exit;
            }
            $locality = $suburb && $suburb !== $city ? $suburb . ", " . $city : $city;
            $depto = $departamento ? " " . $departamento : "";
            $location_text = trim($road . " " . $house_number . $depto . ", " . $locality);
        }
    } else {
        if (empty($post['suburb'])) {
            http_response_code(400);
            echo json_encode(["message" => "La dirección debe estar validada con barrio."]);
            exit;
        }
        $location_text = $post['location_text'];
        $suburb = $post['suburb'];
        $lat = $post['lat'];
        $lon = $post['lon'];
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

    $pet_name = limit_text($pet_name, 100);
    $breed = limit_text($breed, 80);
    $colors = limit_text($colors, 255);
    $description = limit_text($description, 600);
    $species = limit_text($species, 30);
    $location_text = limit_text($location_text, 120);
    $suburb = limit_text($suburb, 80);

    $photo_url = null;
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

    if ($photo_url === null) {
        $photo_url = $post['photo_url'];
    }

    $stmt = $conn->prepare("UPDATE lost_found_posts SET type = ?, pet_name = ?, species = ?, breed = ?, colors = ?, size = ?, location_text = ?, suburb = ?, lat = ?, lon = ?, date_seen = ?, description = ?, photo_url = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param(
        "sssssssssssssii",
        $type,
        $pet_name,
        $species,
        $breed,
        $colors,
        $size,
        $location_text,
        $suburb,
        $lat,
        $lon,
        $date_seen,
        $description,
        $photo_url,
        $post_id,
        $user_id
    );

    if (!$stmt->execute()) {
        throw new Exception("No se pudo actualizar la publicación.");
    }
    $stmt->close();

    echo json_encode(["message" => "Publicación actualizada."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
