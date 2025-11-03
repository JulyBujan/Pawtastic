<?php
header("Content-Type: application/json");

// Incluir la función de geocodificación y el verificador de token
require_once "get_geo.php";
require __DIR__ . '/vendor/autoload.php';
require "verificar_token.php"; // Protege el endpoint

// Verificar que se reciben los parámetros necesarios
if (empty($_GET['road']) || empty($_GET['house_number']) || empty($_GET['city'])) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos de dirección (calle, número y localidad son obligatorios)."]);
    exit;
}

$house_number = trim($_GET['house_number']);
$road = trim($_GET['road']);
$city = trim($_GET['city']);

// Construir la dirección completa para la búsqueda.
// Añadir el país mejora la precisión de los resultados.
$direccion_completa = "{$house_number} {$road}, {$city}, Argentina";

try {
    // Llamar a la función que consulta a Nominatim
    $coordenadas = getCoordinatesFromAddress($direccion_completa);

    if ($coordenadas) {
        // Si se encontraron coordenadas, devolverlas
        http_response_code(200);
        echo json_encode($coordenadas);
    } else {
        // Si no se encontraron resultados
        http_response_code(404);
        echo json_encode(["message" => "No se pudieron encontrar coordenadas para la dirección proporcionada. Verifique los datos."]);
    }

} catch (Exception $e) {
    // Capturar cualquier otro error
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor al procesar la geocodificación: " . $e->getMessage()]);
}

?>