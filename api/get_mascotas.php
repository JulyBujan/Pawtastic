<?php
header('Content-Type: application/json');
include 'conexion.php'; // Asegurate que este archivo devuelve un objeto PDO llamado $conn

$sql = "SELECT mascotas.*, ongs.nombre AS nombre_ong, ongs.logo AS logo_ong
        FROM mascotas
        INNER JOIN ongs ON mascotas.id_ong = ongs.id";

try {
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $mascotas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($mascotas);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
