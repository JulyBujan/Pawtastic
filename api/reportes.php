<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

if ($decoded_token->tipo !== 'ong') {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. Esta función es solo para ONGs."]);
    exit;
}

$email_ong = $decoded_token->email;

function generarReporteParaPeriodo($conn, $id_ong, $fecha_inicio, $fecha_fin) {
    $reporte = [
        'adopciones' => [],
        'publicaciones' => [],
        'metricas_clave' => [] // Nueva sección para métricas específicas
    ];

    // --- 1. ESTADÍSTICAS DE ADOPCIONES ---
    $fecha_fin_full = $fecha_fin . ' 23:59:59';
    $stmt_adopciones = $conn->prepare(
        "SELECT 
            SUM(CASE WHEN fecha_inicio BETWEEN ? AND ? THEN 1 ELSE 0 END) as iniciadas,
            SUM(CASE WHEN fecha_actualizacion BETWEEN ? AND ? AND fecha_inicio NOT BETWEEN ? AND ? THEN 1 ELSE 0 END) as actualizadas,
            SUM(CASE WHEN estado = 2 AND fecha_actualizacion BETWEEN ? AND ? THEN 1 ELSE 0 END) as aprobadas,
            SUM(CASE WHEN estado = 3 AND fecha_actualizacion BETWEEN ? AND ? THEN 1 ELSE 0 END) as canceladas
        FROM adopciones
        WHERE id_ong = ?"
    );
    // Bind parameters: ssssssssi
    if (!$stmt_adopciones) {
        throw new Exception("Error al preparar la consulta de adopciones: " . $conn->error);
    }
    $stmt_adopciones->bind_param("ssssssssssi",
        $fecha_inicio, $fecha_fin_full, 
        $fecha_inicio, $fecha_fin_full, $fecha_inicio, $fecha_fin_full,
        $fecha_inicio, $fecha_fin_full, 
        $fecha_inicio, $fecha_fin_full,
        $id_ong
    );
    $stmt_adopciones->execute();
    $result_adopciones = $stmt_adopciones->get_result()->fetch_assoc();
    $reporte['adopciones'] = [
        'iniciadas' => (int)$result_adopciones['iniciadas'],
        'actualizadas' => (int)$result_adopciones['actualizadas'],
        'aprobadas' => (int)$result_adopciones['aprobadas'],
        'canceladas' => (int)$result_adopciones['canceladas']
    ];
    $stmt_adopciones->close();


    // --- 2. ESTADÍSTICAS DE PUBLICACIONES ---

    // a) Publicaciones por día (para el gráfico)
    $stmt_pub_dia = $conn->prepare(
        "SELECT DATE(date_publicacion) as fecha, COUNT(id) as cantidad
         FROM mascotas
         WHERE id_ong = ? AND date_publicacion BETWEEN ? AND ?
         GROUP BY DATE(date_publicacion)
         ORDER BY fecha ASC"
    );
    $stmt_pub_dia->bind_param("iss", $id_ong, $fecha_inicio, $fecha_fin_full);
    $stmt_pub_dia->execute();
    $result_pub_dia = $stmt_pub_dia->get_result()->fetch_all(MYSQLI_ASSOC);
    $reporte['publicaciones']['por_dia'] = $result_pub_dia;
    $stmt_pub_dia->close();

    // b) Publicaciones en el período que resultaron en adopción aprobada
    $stmt_pub_adopcion = $conn->prepare(
        "SELECT COUNT(DISTINCT m.id) as cantidad
         FROM mascotas m
         JOIN adopciones a ON m.id = a.id_mascota
         WHERE m.id_ong = ? 
         AND m.date_publicacion BETWEEN ? AND ?
         AND a.estado = 2" // 2 = Aprobada
    );
    $stmt_pub_adopcion->bind_param("iss", $id_ong, $fecha_inicio, $fecha_fin_full);
    $stmt_pub_adopcion->execute();
    $result_pub_adopcion = $stmt_pub_adopcion->get_result()->fetch_assoc();
    $reporte['publicaciones']['con_adopcion_aprobada'] = (int)$result_pub_adopcion['cantidad'];
    $stmt_pub_adopcion->close();

    // --- 3. NUEVO REPORTE: TIEMPO PROMEDIO DE ADOPCIÓN (PERROS Y GATOS) ---
    $stmt_promedio_adopcion = $conn->prepare(
        "SELECT
            m.tipo,
            ROUND(AVG(DATEDIFF(a.fecha_actualizacion, m.date_publicacion)), 1) AS tiempo_promedio_dias
        FROM
            mascotas AS m
        JOIN
            adopciones AS a ON m.id = a.id_mascota
        WHERE
            a.estado = 2 -- Aprobada
            AND m.tipo IN ('perro', 'gato')
            AND a.id_ong = ?
            AND a.fecha_actualizacion BETWEEN ? AND ?
        GROUP BY
            m.tipo"
    );
    if (!$stmt_promedio_adopcion) {
        throw new Exception("Error al preparar la consulta de tiempo promedio: " . $conn->error);
    }
    $stmt_promedio_adopcion->bind_param("iss", $id_ong, $fecha_inicio, $fecha_fin_full);
    $stmt_promedio_adopcion->execute();
    $result_promedio = $stmt_promedio_adopcion->get_result();
    $tiempos_promedio = [];
    while ($row = $result_promedio->fetch_assoc()) {
        $tiempos_promedio[$row['tipo']] = (float)$row['tiempo_promedio_dias'];
    }
    $reporte['metricas_clave']['tiempo_promedio_adopcion'] = $tiempos_promedio;
    $stmt_promedio_adopcion->close();

    return $reporte;
}

try {
    // Obtener el ID de la ONG desde la tabla de usuarios usando el email del token
    $stmt_user = $conn->prepare("SELECT ong_id FROM usuarios WHERE email = ?");
    if (!$stmt_user) {
        throw new Exception("Error al preparar la consulta de usuario: " . $conn->error);
    }
    $stmt_user->bind_param("s", $email_ong);
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();
    $usuario = $result_user->fetch_assoc();
    $stmt_user->close();

    if (!$usuario || !$usuario['ong_id']) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró una ONG asociada a este usuario."]);
        exit;
    }
    $id_ong = $usuario['ong_id'];

    // Si se piden fechas específicas, se devuelve el reporte para ese rango
    if (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
        $fecha_inicio = $_GET['fecha_inicio'];
        $fecha_fin = $_GET['fecha_fin'];
        $reporte_personalizado = generarReporteParaPeriodo($conn, $id_ong, $fecha_inicio, $fecha_fin);
        
        http_response_code(200);
        echo json_encode($reporte_personalizado);

    } else { // Si no, se devuelven los indicadores clave de 30 y 90 días
        $hoy = new DateTime();
        $fecha_fin_90 = $hoy->format('Y-m-d');
        $fecha_inicio_90 = (clone $hoy)->sub(new DateInterval('P89D'))->format('Y-m-d');

        $fecha_fin_30 = $hoy->format('Y-m-d');
        $fecha_inicio_30 = (clone $hoy)->sub(new DateInterval('P29D'))->format('Y-m-d');

        $reporte_30_dias = generarReporteParaPeriodo($conn, $id_ong, $fecha_inicio_30, $fecha_fin_30);
        $reporte_90_dias = generarReporteParaPeriodo($conn, $id_ong, $fecha_inicio_90, $fecha_fin_90);

        $respuesta_agrupada = [
            'ultimos_30_dias' => $reporte_30_dias,
            'ultimos_90_dias' => $reporte_90_dias
        ];

        http_response_code(200);
        echo json_encode($respuesta_agrupada);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}

finally {
    $conn->close();
}
?>