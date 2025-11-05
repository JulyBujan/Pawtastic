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
        "INSERT INTO ONGs (nombre, razon_social, cuit, road, house_number, city, suburb, fecha_constitucion, lat, lon) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)"
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

    // 6. Procesar y guardar archivos
    $file_paths = [];
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

    // 7. Insertar las rutas de los archivos en `documentacion_ong`
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

    // 8. Si todo fue bien, confirmar la transacción
    $conn->commit();

    http_response_code(201); // 201 Created
    echo json_encode(["message" => "Solicitud de registro de ONG enviada con éxito. Será revisada por un administrador."]);

} catch (Exception $e) {
    // 9. Si algo falla, revertir la transacción
    $conn->rollback();

    // Eliminar archivos que se hayan subido para no dejar basura
    if (!empty($file_paths)) {
        foreach ($file_paths as $path) {
            if (file_exists("../" . $path)) {
                unlink("../" . $path);
            }
        }
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