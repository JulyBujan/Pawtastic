<?php
require_once __DIR__ . '/api_init.php'; // Incluye headers, error handler, y conexión ($conn)

// --- LÓGICA DE ENRUTAMIENTO ---
// Si se proporciona un ID, se obtiene una sola mascota (endpoint público).
// Si no, se obtiene una lista de mascotas para la ONG logueada (endpoint privado).

if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    // --- OBTENER UNA SOLA MASCOTA (LÓGICA ORIGINAL) ---
    $id_mascota = (int)$_GET['id'];

    try {
        $query = "SELECT m.id, m.nombre, m.tipo, m.edad, m.sexo, m.tamaño, m.descripcion, m.imagen, m.id_ong, 
                         m.vacunado, m.esterilizado, m.chip, m.apto_ninos, m.apto_mascotas, m.estado,
                         m.energia, m.sociabilidad, m.presencia, m.estilov, m.date_publicacion,
                         m.breed, m.color,
                         o.nombre AS ong_nombre, o.lat AS ong_lat, o.lon AS ong_lon 
                  FROM mascotas m
                  LEFT JOIN ONGs o ON m.id_ong = o.id
                  WHERE m.id = ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Error en la preparación de la consulta: " . $conn->error);
        }

        $stmt->bind_param("i", $id_mascota);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($mascota = $result->fetch_assoc()) {
            echo json_encode($mascota);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Mascota no encontrada."]);
        }
        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }

} else {
    // --- OBTENER LISTA DE MASCOTAS PARA UNA ONG (LÓGICA DE listar_mascotas.php) ---
    
    // 1. Verificar token
    include_once "verificar_token.php";
    $email = $decoded_token->email;

    try {
        // 2. Obtener el id_ong según el email del token
        $stmt = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ? AND tipo = 'ong'");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $idOng = $stmt->get_result()->fetch_assoc()['ong_id'] ?? null;

        if (!$idOng) {
            http_response_code(403);
            echo json_encode(["message" => "No se encontró una ONG asociada a este usuario."]);
            exit;
        }

        // 3. Traer mascotas de esa ONG que no estén archivadas (estado != 2)
        $stmt = $conn->prepare("SELECT id, nombre, tipo, edad, sexo, tamaño, descripcion, imagen, id_ong, 
                                       vacunado, esterilizado, chip, apto_ninos, apto_mascotas, estado,
                                       energia, sociabilidad, presencia, estilov, date_publicacion,
                                       breed, color
                                FROM mascotas WHERE id_ong = ? AND estado != 2 ORDER BY id DESC");
        $stmt->bind_param("i", $idOng);
        $stmt->execute();
        $mascotas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode($mascotas);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor al consultar la base de datos: " . $e->getMessage()]);
    }
}

$conn->close();
?>