<?php
header("Content-Type: application/json");
include_once "conexion.php";

// 1. Verificar el método de la solicitud
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

// 2. Validar campos de texto obligatorios
$required_fields = ['nombre', 'razon_social', 'cuit', 'fecha_constitucion', 'calle', 'numero', 'localidad'];
foreach ($required_fields as $field) {
    if (empty($_POST[$field])) {
        http_response_code(400);
        echo json_encode(["message" => "Faltan datos obligatorios. El campo '{$field}' es requerido."]);
        exit;
    }
}

// 3. Validar archivos subidos
$required_files = ['estatuto', 'constancia_cuit', 'acta_autoridades'];
foreach ($required_files as $file_key) {
    if (!isset($_FILES[$file_key]) || $_FILES[$file_key]['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Falta el archivo '{$file_key}' o hubo un error al subirlo."]);
        exit;
    }
}

// --- Sanitización de datos ---
$nombre = trim($_POST['nombre']);
$razon_social = trim($_POST['razon_social']);
$cuit = trim($_POST['cuit']);
$fecha_constitucion = $_POST['fecha_constitucion'];
$calle = trim($_POST['calle']);
$numero = trim($_POST['numero']);
$localidad = trim($_POST['localidad']);
$barrio = !empty($_POST['barrio']) ? trim($_POST['barrio']) : null;
$file_paths = [];
$logo_path = null;
$has_logo_column = false;

$check_logo = $conn->query("SHOW COLUMNS FROM ONGs LIKE 'logo_url'");
if ($check_logo && $check_logo->num_rows > 0) {
    $has_logo_column = true;
}

// --- Validar logo opcional ---
if (isset($_FILES['logo']) && $_FILES['logo']['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Hubo un error al subir el logo de la ONG."]);
        exit;
    }
}

// --- Directorio para guardar documentos ---
$upload_dir = "../documentos_ong/";
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0777, true)) {
        http_response_code(500);
        echo json_encode(["message" => "Error: No se pudo crear el directorio para los documentos."]);
        exit;
    }
}

// --- Iniciar transacción ---
$conn->begin_transaction();

try {
    // 4. Verificar si el CUIT ya existe
    $stmt_check = $conn->prepare("SELECT id FROM ONGs WHERE cuit = ?");
    $stmt_check->bind_param("s", $cuit);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    if ($result_check->num_rows > 0) {
        throw new Exception("El CUIT ingresado ya se encuentra registrado.", 409); // 409 Conflict
    }
    $stmt_check->close();

    // 5. Insertar la ONG en la tabla `ONGs`
    // Nota: Se asume que la tabla ONGs tiene los campos necesarios.
    // Los campos lat y lon se dejan en 0 temporalmente. Se pueden calcular después.
    $stmt_ong = $conn->prepare(
        "INSERT INTO ONGs (nombre, razon_social, cuit, road, house_number, city, suburb, fecha_constitucion, lat, lon, logo_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL)"
    );
    if (!$stmt_ong) {
        throw new Exception("Error al preparar la consulta para insertar ONG: " . $conn->error);
    }
    $stmt_ong->bind_param("ssssssss", $nombre, $razon_social, $cuit, $calle, $numero, $localidad, $barrio, $fecha_constitucion);
    $stmt_ong->execute();

    // Obtener el ID de la ONG recién creada
    $ong_id = $conn->insert_id;
    if ($ong_id === 0) {
        throw new Exception("No se pudo obtener el ID de la nueva ONG.");
    }
    $stmt_ong->close();

    // 6. Procesar y guardar logo opcional (solo si la columna existe)
    if ($has_logo_column && isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $logo_dir = "../img/ong_logos/";
        if (!is_dir($logo_dir)) {
            if (!mkdir($logo_dir, 0777, true)) {
                throw new Exception("Error: No se pudo crear el directorio para el logo.");
            }
        }

        $logo_file = $_FILES['logo'];
        $logo_extension = strtolower(pathinfo($logo_file['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($logo_extension, $allowed_extensions, true)) {
            throw new Exception("Formato de logo inválido. Usá JPG, PNG o WEBP.");
        }

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
    }

    // 7. Procesar y guardar archivos
    foreach ($required_files as $file_key) {
        $file = $_FILES[$file_key];
        // Generar un nombre de archivo único para evitar colisiones
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safe_filename = "ong_{$ong_id}_{$file_key}_" . uniqid() . "." . $file_extension;
        $destination = $upload_dir . $safe_filename;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            // Guardar la ruta relativa para la base de datos
            $file_paths[$file_key] = "documentos_ong/" . $safe_filename;
        } else {
            throw new Exception("Error al mover el archivo '{$file_key}'.");
        }
    }

    // 8. Insertar las rutas de los archivos en `documentacion_ong`
    $stmt_doc = $conn->prepare(
        "INSERT INTO documentacion_ong (ong_id, url_estatuto, url_cuit, url_acta, estado) 
         VALUES (?, ?, ?, ?, 0)" // estado 0 = Pendiente
    );
    if (!$stmt_doc) {
        throw new Exception("Error al preparar la consulta para insertar documentación: " . $conn->error);
    }
    $stmt_doc->bind_param(
        "isss",
        $ong_id,
        $file_paths['estatuto'],
        $file_paths['constancia_cuit'],
        $file_paths['acta_autoridades']
    );
    $stmt_doc->execute();
    $stmt_doc->close();

    // 9. Si todo fue bien, confirmar la transacción
    $conn->commit();

    http_response_code(201); // 201 Created
    echo json_encode(["message" => "ONG registrada con éxito."]);

} catch (Exception $e) {
    // 10. Si algo falla, revertir la transacción
    $conn->rollback();

    // Eliminar archivos que se hayan subido para no dejar basura
    if (!empty($file_paths)) {
        foreach ($file_paths as $path) {
            if (file_exists("../" . $path)) {
                unlink("../" . $path);
            }
        }
    }
    if (!empty($logo_path) && file_exists("../" . $logo_path)) {
        unlink("../" . $logo_path);
    }

    // Determinar el código de respuesta HTTP
    $code = $e->getCode();
    if ($code < 400 || $code >= 600) {
        $code = 500; // Default a error de servidor si no es un código de error de cliente válido
    }
    http_response_code($code);

    echo json_encode([
        "message" => "Error al procesar el registro: " . $e->getMessage()
    ]);
}

$conn->close();
?>
