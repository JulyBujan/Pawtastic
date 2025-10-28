<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Verificar que se ha proporcionado un ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID de mascota no válido o no proporcionado."]);
    exit;
}

$id_mascota = $_GET['id'];

try {
    // Usamos una sentencia preparada para evitar inyección SQL
    $stmt = $conn->prepare("SELECT * FROM mascotas WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error en la preparación de la consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $id_mascota);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($mascota = $result->fetch_assoc()) {
        // Si se encuentra la mascota, se devuelve como JSON
        echo json_encode($mascota);
    } else {
        // Si no se encuentra, se devuelve un error 404
        http_response_code(404);
        echo json_encode(["message" => "Mascota no encontrada."]);
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>