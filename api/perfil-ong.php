<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

if ($user_tipo !== 'ong') {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de ONG."]);
    exit;
}

try {
    // 1. Obtener el ong_id del usuario logueado desde la tabla 'usuarios'
    $stmt_user = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
    $stmt_user->bind_param("s", $user_email);
    $stmt_user->execute();
    $usuario = $stmt_user->get_result()->fetch_assoc();
    $stmt_user->close();

    if (!$usuario || !$usuario['ong_id']) {
        throw new Exception("No se encontró una ONG asociada a este usuario.");
    }

    $has_logo = false;
    $check_logo = $conn->query("SHOW COLUMNS FROM ONGs LIKE 'logo_url'");
    if ($check_logo && $check_logo->num_rows > 0) {
        $has_logo = true;
    }

    $ong_id = (int)$usuario['ong_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$has_logo) {
            http_response_code(400);
            echo json_encode(["message" => "La base de datos no tiene el campo para guardar el logo."]);
            exit;
        }

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["message" => "No se recibió ninguna imagen válida."]);
            exit;
        }

        $logo_file = $_FILES['logo'];
        $logo_extension = strtolower(pathinfo($logo_file['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($logo_extension, $allowed_extensions, true)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de logo inválido. Usá JPG, PNG o WEBP."]);
            exit;
        }

        $logo_dir = "../img/ong_logos/";
        if (!is_dir($logo_dir)) {
            if (!mkdir($logo_dir, 0777, true)) {
                throw new Exception("No se pudo crear el directorio para el logo.");
            }
        }

        $stmt_current = $conn->prepare("SELECT logo_url FROM ONGs WHERE id = ?");
        $stmt_current->bind_param("i", $ong_id);
        $stmt_current->execute();
        $current = $stmt_current->get_result()->fetch_assoc();
        $stmt_current->close();

        $logo_filename = "ong_{$ong_id}_logo_" . uniqid() . "." . $logo_extension;
        $logo_destination = $logo_dir . $logo_filename;

        if (!move_uploaded_file($logo_file['tmp_name'], $logo_destination)) {
            throw new Exception("Error al guardar el logo de la ONG.");
        }

        $logo_path = "img/ong_logos/" . $logo_filename;
        $stmt_logo = $conn->prepare("UPDATE ONGs SET logo_url = ? WHERE id = ?");
        if (!$stmt_logo) {
            throw new Exception("Error al preparar la consulta para actualizar el logo: " . $conn->error);
        }
        $stmt_logo->bind_param("si", $logo_path, $ong_id);
        $stmt_logo->execute();
        $stmt_logo->close();

        if (!empty($current['logo_url'])) {
            $old_path = $current['logo_url'];
            if (strpos($old_path, '/') === 0) {
                $old_path = ltrim($old_path, '/');
            }
            $old_full = __DIR__ . '/../' . $old_path;
            if (file_exists($old_full)) {
                unlink($old_full);
            }
        }

        echo json_encode(["message" => "Logo actualizado con éxito.", "logo_url" => $logo_path]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(["message" => "Método no permitido."]);
        exit;
    }

    // 2. Con el ong_id, obtener el nombre de la ONG desde la tabla 'ONGs'
    $columns = [
        "nombre",
        "razon_social",
        "cuit",
        "city",
        "suburb",
        "road",
        "house_number",
        "departamento",
        "fecha_constitucion",
        "ultima_actualizacion"
    ];
    if ($has_logo) {
        $columns[] = "logo_url";
    }

    $query = "SELECT " . implode(", ", $columns) . " FROM ONGs WHERE id = ?";
    $stmt_ong = $conn->prepare($query);
    $stmt_ong->bind_param("i", $ong_id);
    $stmt_ong->execute();
    $ong = $stmt_ong->get_result()->fetch_assoc();
    $stmt_ong->close();

    if ($ong) {
        $ong["email"] = $user_email;
    }

    echo json_encode($ong);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>
