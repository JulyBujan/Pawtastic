<?php

function errorHandler($errno, $errstr, $errfile, $errline) {
    // No queremos que PHP maneje el error, lo haremos nosotros.
    // Esto previene que se muestre el error HTML por defecto.
    if (!(error_reporting() & $errno)) {
        return false;
    }

    // Registrar el error detallado en el archivo de log
    error_log("Error: [$errno] $errstr en $errfile en la línea $errline", 0);

    // Enviar una respuesta JSON genérica al cliente
    // Solo si no se han enviado ya las cabeceras
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            "message" => "Ocurrió un error interno en el servidor."
        ]);
    }

    // Detener la ejecución del script para asegurar que no se envíe más nada.
    exit;
}

// Desactivar la visualización de errores en pantalla
ini_set('display_errors', 0);

// Establecer nuestra función como el manejador de errores global
set_error_handler("errorHandler");
?>
