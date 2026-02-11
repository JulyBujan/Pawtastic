<?php

/**
 * Obtiene las coordenadas (latitud, longitud) de una dirección usando Nominatim (OpenStreetMap).
 *
 * @param string $address La dirección a geocodificar.
 * @return array|null Un array ['lat' => $lat, 'lon' => $lon] o null si no se encuentra.
 */
function getCoordinatesFromAddress($address) {
    
    // 1. Prepara la URL para la solicitud GET
    $params = [
        'q' => $address,
        'format' => 'json',
        'addressdetails' => 1,
        'limit' => 1 // Solo queremos el resultado más relevante
    ];
    $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query($params);

    // 2. Inicializa cURL
    $ch = curl_init($url);

    // 3. Configura las opciones de cURL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Devuelve la respuesta como string
    curl_setopt($ch, CURLOPT_HEADER, false);         // No incluye los encabezados en la respuesta

    // ¡¡MUY IMPORTANTE: Configura un User-Agent!!
    // Reemplaza "MiAppWeb/1.0" y tu email.
    curl_setopt($ch, CURLOPT_USERAGENT, 'MiAppDeMapas/1.0 (tu-email@tu-dominio.com)');
    
    // Opcional: manejar timeouts
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // 5 segundos para conectar
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);        // 10 segundos en total

    // 4. Ejecuta la solicitud
    $response = curl_exec($ch);

    // 5. Maneja errores de cURL
    if (curl_errno($ch)) {
        // echo 'Error en cURL: ' . curl_error($ch);
        curl_close($ch);
        return null;
    }

    // 6. Cierra la conexión
    curl_close($ch);

    // 7. Decodifica la respuesta JSON
    $data = json_decode($response, true);

    // 8. Extrae las coordenadas
    if (!empty($data) && isset($data[0]['lat']) && isset($data[0]['lon'])) {
        $address = $data[0]['address'] ?? [];
        return [
            'lat' => $data[0]['lat'],
            'lon' => $data[0]['lon'],
            'city' => $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['municipality'] ?? null,
            'road' => $address['road'] ?? $address['pedestrian'] ?? $address['footway'] ?? $address['street'] ?? null,
            'house_number' => $address['house_number'] ?? null,
            'suburb' => $address['suburb'] ?? $address['neighbourhood'] ?? $address['hamlet'] ?? null
        ];
    }
    return null; // No se encontraron resultados
}

// --- Ejemplo de uso ---
/*
house_number = 2876
road = "Juan Cruz Varela"
city = "Cordoba"
$direccion =  $house_number . " " . $road . ", " . $city . "Cordoba, Argentina";
$coordenadas = getCoordinatesFromAddress($direccion);

if ($coordenadas) {
    echo "Dirección: " . $direccion . "\n";
    echo "Latitud: " . $coordenadas['lat'] . "\n";
    echo "Longitud: " . $coordenadas['lon'] . "\n";
    
    // Aquí es donde harías tu "UPDATE tu_tabla SET lat = ?, lon = ? WHERE ..."
    
} else {
    echo "No se pudieron encontrar las coordenadas para: " . $direccion . "\n";
}*/

?>
