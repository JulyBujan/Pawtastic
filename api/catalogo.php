<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Obtener parámetros de filtro de la URL
$especie = isset($_GET['especie']) ? $_GET['especie'] : '';
$edad = isset($_GET['edad']) ? $_GET['edad'] : '';
$tamano = isset($_GET['tamano']) ? $_GET['tamano'] : '';

// Construir la consulta SQL con filtros
$query = "SELECT id, nombre, tipo, edad, sexo, tamaño, descripcion, imagen FROM mascotas WHERE 1=1";

if (!empty($especie)) {
    $query .= " AND tipo = '" . $conn->real_escape_string($especie) . "'";
}
if (!empty($edad)) {
    if ($edad === 'cachorro') {
        $query .= " AND edad BETWEEN 0 AND 3";
    } elseif ($edad === 'adulto') {
        $query .= " AND edad BETWEEN 4 AND 8";
    } elseif ($edad === 'senior') {
        $query .= " AND edad >= 9";
    }
}
if (!empty($tamano)) {
    $query .= " AND tamaño = '" . $conn->real_escape_string($tamano) . "'";
}

$result = $conn->query($query);

if ($result) {
    $mascotas = [];
    while ($row = $result->fetch_assoc()) {
        $mascotas[] = $row;
    }
    echo json_encode($mascotas);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener las mascotas: " . $conn->error]);
}

$conn->close();
?>