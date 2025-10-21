<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Verificar si se recibió el ID de la mascota
if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Falta el ID de la mascota"]);
    exit;
}

$idMascota = $_GET['id'];

try {
    $query = $conn->prepare("SELECT * FROM mascotas WHERE id = ?");
    $query->execute([$idMascota]);
    $mascota = $query->fetch(PDO::FETCH_ASSOC);

    if ($mascota) {
        echo json_encode($mascota);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Mascota no encontrada"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>