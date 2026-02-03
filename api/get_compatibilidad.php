<?php
require_once __DIR__ . '/api_init.php';

// 1. Verificar token y obtener el ID del usuario
require_once __DIR__ . '/verificar_token.php';
$user_id = $decoded_token->user_id ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "ID de usuario no encontrado en el token."]);
    exit;
}

try {
    // 2. Traer preferencias del usuario
    $stmt = $conn->prepare("SELECT energia, sociabilidad, presencia, estilov FROM usuarios WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta de usuario: " . $conn->error);
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $userResult = $stmt->get_result();
    $userPrefs = $userResult ? $userResult->fetch_assoc() : null;
    $stmt->close();

    if (!$userPrefs) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    $requiredFields = ['energia', 'sociabilidad', 'presencia', 'estilov'];
    foreach ($requiredFields as $field) {
        if ($userPrefs[$field] === null) {
            http_response_code(412);
            echo json_encode(["message" => "Tu perfil de preferencias está incompleto. Por favor, complétalo para ver la compatibilidad."]);
            exit;
        }
    }

    // 3. Obtener mascotas activas
    $stmt = $conn->prepare("SELECT * FROM mascotas WHERE estado = 1");
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta de mascotas: " . $conn->error);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $mascotas = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    // 4. Modelo ligero (ponderado) para compatibilidad
    $weights = [
        'energia' => 0.35,
        'sociabilidad' => 0.25,
        'presencia' => 0.2,
        'estilov' => 0.2
    ];
    $maxDiffPerFeature = 2; // Escala 1-3
    $maxWeighted = array_sum($weights) * $maxDiffPerFeature;
    $unknownPenalty = 1; // Penalidad suave si falta algún dato en la mascota

    foreach ($mascotas as &$mascota) {
        $diff = 0.0;
        foreach ($weights as $field => $weight) {
            $petValue = $mascota[$field];
            if ($petValue === null || $petValue === '') {
                $diff += $weight * $unknownPenalty;
                continue;
            }
            $diff += $weight * abs((int)$petValue - (int)$userPrefs[$field]);
        }

        $score = 100 - ($diff / $maxWeighted) * 100;
        $score = max(0, min(100, round($score)));
        $mascota['compatibilidad'] = $score;
    }
    unset($mascota);

    usort($mascotas, function ($a, $b) {
        return (int)$b['compatibilidad'] <=> (int)$a['compatibilidad'];
    });

    echo json_encode($mascotas);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>
