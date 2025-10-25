<?php
header("Content-Type: application/json");
include_once "conexion.php";

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Falta el ID de la mascota"]);
    exit;
}

$idMascota = $_GET['id'];

// Use mysqli prepared statements
$stmt = $conn->prepare("SELECT m.*, o.nombre AS ong_nombre FROM mascotas m LEFT JOIN ongs o ON m.id_ong = o.id WHERE m.id = ?");
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Error al preparar la consulta: " . $conn->error]);
    exit;
}

$stmt->bind_param("i", $idMascota);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    $mascota = $result->fetch_assoc();

    if ($mascota) {
        echo json_encode($mascota);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Mascota no encontrada"]);
    }
} else {
    http_response_code(500);
    echo json_encode(["message" => "Error al ejecutar la consulta: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>