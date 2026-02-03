<?php
header("Content-Type: application/json");
require_once "conexion.php";

// Obtener parámetros de filtro de la URL
$especie = isset($_GET['especie']) ? $_GET['especie'] : '';
$edad = isset($_GET['edad']) ? $_GET['edad'] : '';
$tamano = isset($_GET['tamano']) ? $_GET['tamano'] : '';

// Construir la consulta SQL base, incluyendo el filtro por estado
// Solo se muestran mascotas activas/publicadas (estado = 1)
$query = "SELECT id, nombre, tipo, edad, sexo, tamaño, descripcion, imagen, vacunado, esterilizado, apto_ninos FROM mascotas WHERE estado = 1";

$params = [];
$types = "";

if (!empty($especie)) {
    $query .= " AND tipo = ?";
    $params[] = $especie;
    $types .= "s";
}

if (!empty($edad)) {
    if ($edad === 'cachorro') {
        $query .= " AND edad BETWEEN 0 AND 42";
    } elseif ($edad === 'adulto') {
        $query .= " AND edad BETWEEN 43 AND 95";
    } elseif ($edad === 'senior') {
        $query .= " AND edad > 95";
    }
}

if (!empty($tamano)) {
    $query .= " AND tamaño = ?";
    $params[] = $tamano;
    $types .= "s";
}

try {
    $stmt = $conn->prepare($query);

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $mascotas = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($mascotas);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener las mascotas: " . $e->getMessage()]);
}

$conn->close();
?>
