<?php
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . '/vendor/autoload.php';
require "verificar_token.php";

if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(["message" => "El servidor no tiene cURL habilitado para validar direcciones."]);
    exit;
}

$lat = isset($_GET['lat']) ? trim($_GET['lat']) : '';
$lon = isset($_GET['lon']) ? trim($_GET['lon']) : '';

if ($lat === '' || $lon === '' || !is_numeric($lat) || !is_numeric($lon)) {
    http_response_code(400);
    echo json_encode(["message" => "Coordenadas inválidas."]);
    exit;
}

$params = [
    'lat' => $lat,
    'lon' => $lon,
    'format' => 'json',
    'addressdetails' => 1
];

$url = 'https://nominatim.openstreetmap.org/reverse?' . http_build_query($params);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'MiAppDeMapas/1.0 (tu-email@tu-dominio.com)');
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    curl_close($ch);
    http_response_code(500);
    echo json_encode(["message" => "No se pudo consultar la dirección."]);
    exit;
}
curl_close($ch);

$data = json_decode($response, true);
if (!$data || !isset($data['address'])) {
    http_response_code(404);
    echo json_encode(["message" => "No se pudo obtener la dirección para esa ubicación."]);
    exit;
}

$address = $data['address'];
$result = [
    'lat' => $data['lat'] ?? $lat,
    'lon' => $data['lon'] ?? $lon,
    'city' => $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['municipality'] ?? null,
    'road' => $address['road'] ?? $address['pedestrian'] ?? $address['footway'] ?? $address['street'] ?? null,
    'house_number' => $address['house_number'] ?? null,
    'suburb' => $address['suburb'] ?? $address['neighbourhood'] ?? $address['hamlet'] ?? null
];

echo json_encode($result);
