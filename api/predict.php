<?php
require_once __DIR__ . '/api_init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
    exit;
}

$input = file_get_contents("php://input");
$payload = json_decode($input, true);

if (!is_array($payload) || empty($payload)) {
    http_response_code(400);
    echo json_encode(["message" => "Payload inválido."]);
    exit;
}

$mlUrl = getenv('ML_API_URL') ?: "http://mlapi:8000/predict";
// Evitar que warnings de red rompan la respuesta JSON.
$previousHandler = set_error_handler(function () {
    return true;
});

$buildFallback = function ($payload) {
    $petsize = isset($payload['petsize']) ? (int) $payload['petsize'] : 2;
    $animaltype = isset($payload['animaltype']) ? (int) $payload['animaltype'] : 0;
    $gender = isset($payload['gender']) ? (int) $payload['gender'] : 0;
    $breed = isset($payload['breed']) ? (string) $payload['breed'] : '';
    $color = isset($payload['color']) ? (string) $payload['color'] : '';

    $base = 20 + ($petsize * 6) + ($animaltype === 1 ? 3 : 0);
    $base += ($gender === 1 ? 2 : 0);
    $base += ($breed === 'Others' ? 5 : 0);
    $base += ($color === 'Others' ? 3 : 0);

    $dias_estimados = max(7, min(120, $base));
    $rango_min = max(5, $dias_estimados - 6);
    $rango_max = $dias_estimados + 8;

    return [
        "dias_estimados" => $dias_estimados,
        "rango_estimado" => "{$rango_min} - {$rango_max} días",
        "confianza_modelo" => "Media (simulada)",
        "probabilidades_temporales" => [
            "adopcion_en_menos_de_30_dias" => "35%",
            "adopcion_en_30_a_60_dias" => "45%",
            "adopcion_en_mas_de_60_dias" => "20%"
        ],
        "simulado" => true
    ];
};

if (function_exists('curl_init')) {
    $ch = curl_init($mlUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError || $httpCode < 200 || $httpCode >= 300) {
        echo json_encode($buildFallback($payload));
        exit;
    }

    restore_error_handler();
    echo $response;
    exit;
}

$context = stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/json\r\n",
        "content" => json_encode($payload),
        "timeout" => 15,
    ],
]);

$response = @file_get_contents($mlUrl, false, $context);
$statusLine = $http_response_header[0] ?? "";
preg_match('/\s(\d{3})\s/', $statusLine, $matches);
$httpCode = isset($matches[1]) ? (int) $matches[1] : 0;

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    restore_error_handler();
    echo json_encode($buildFallback($payload));
    exit;
}

restore_error_handler();
echo $response;
?>
