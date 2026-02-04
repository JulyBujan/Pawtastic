<?php
header("Content-Type: application/json");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

if ($decoded_token->tipo !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. Se requiere perfil de Administrador."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

if (empty($_POST['ong_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Falta el ID de la ONG."]);
    exit;
}

$ong_id = (int)$_POST['ong_id'];
$required_files = ['estatuto', 'constancia_cuit', 'acta_autoridades'];

foreach ($required_files as $file_key) {
    if (!isset($_FILES[$file_key]) || $_FILES[$file_key]['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Falta el archivo '{$file_key}' o hubo un error al subirlo."]);
        exit;
    }
    $extension = strtolower(pathinfo($_FILES[$file_key]['name'], PATHINFO_EXTENSION));
    if ($extension !== 'pdf') {
        http_response_code(400);
        echo json_encode(["message" => "El archivo '{$file_key}' debe ser un PDF."]);
        exit;
    }
}

// Verificar que la ONG exista
$stmt_ong = $conn->prepare("SELECT id FROM ONGs WHERE id = ?");
$stmt_ong->bind_param("i", $ong_id);
$stmt_ong->execute();
$ong_exists = $stmt_ong->get_result()->fetch_assoc();
$stmt_ong->close();

if (!$ong_exists) {
    http_response_code(404);
    echo json_encode(["message" => "ONG no encontrada."]);
    exit;
}

$upload_dir = "../documentos_ong/";
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0777, true)) {
        http_response_code(500);
        echo json_encode(["message" => "Error: No se pudo crear el directorio para los documentos."]);
        exit;
    }
}

$file_paths = [];
$new_files = [];
$old_files = [];

$conn->begin_transaction();

try {
    $stmt_existing = $conn->prepare("SELECT url_estatuto, url_cuit, url_acta FROM documentacion_ong WHERE ong_id = ?");
    $stmt_existing->bind_param("i", $ong_id);
    $stmt_existing->execute();
    $existing = $stmt_existing->get_result()->fetch_assoc();
    $stmt_existing->close();

    if ($existing) {
        $old_files = array_filter([$existing['url_estatuto'], $existing['url_cuit'], $existing['url_acta']]);
    }

    foreach ($required_files as $file_key) {
        $file = $_FILES[$file_key];
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safe_filename = "ong_{$ong_id}_{$file_key}_" . uniqid() . "." . $file_extension;
        $destination = $upload_dir . $safe_filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Error al mover el archivo '{$file_key}'.");
        }

        $relative_path = "documentos_ong/" . $safe_filename;
        $file_paths[$file_key] = $relative_path;
        $new_files[] = $relative_path;
    }

    if ($existing) {
        $stmt_update = $conn->prepare(
            "UPDATE documentacion_ong 
             SET url_estatuto = ?, url_cuit = ?, url_acta = ?, estado = 0, fecha_subida = CURRENT_TIMESTAMP, fecha_revision = NULL
             WHERE ong_id = ?"
        );
        $stmt_update->bind_param(
            "sssi",
            $file_paths['estatuto'],
            $file_paths['constancia_cuit'],
            $file_paths['acta_autoridades'],
            $ong_id
        );
        $stmt_update->execute();
        $stmt_update->close();
    } else {
        $stmt_insert = $conn->prepare(
            "INSERT INTO documentacion_ong (ong_id, url_estatuto, url_cuit, url_acta, estado) 
             VALUES (?, ?, ?, ?, 0)"
        );
        $stmt_insert->bind_param(
            "isss",
            $ong_id,
            $file_paths['estatuto'],
            $file_paths['constancia_cuit'],
            $file_paths['acta_autoridades']
        );
        $stmt_insert->execute();
        $stmt_insert->close();
    }

    $conn->commit();

    foreach ($old_files as $old_path) {
        $full_path = __DIR__ . '/../' . ltrim($old_path, '/');
        if (file_exists($full_path)) {
            unlink($full_path);
        }
    }

    echo json_encode(["message" => "Documentación subida correctamente."]);
} catch (Exception $e) {
    $conn->rollback();
    foreach ($new_files as $path) {
        $full_path = __DIR__ . '/../' . ltrim($path, '/');
        if (file_exists($full_path)) {
            unlink($full_path);
        }
    }
    http_response_code(500);
    echo json_encode(["message" => "Error al subir documentación: " . $e->getMessage()]);
}

$conn->close();
?>
