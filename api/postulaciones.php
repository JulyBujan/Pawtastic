<?php
header("Content-Type: application/json");
include_once "conexion.php";

// Proteger el endpoint y obtener datos del token
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php"; // Este script nos da el payload en $decoded_token

$user_email = $decoded_token->email;
$user_tipo = $decoded_token->tipo;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Primero, obtenemos el ID del usuario/ONG desde la base de datos usando el email del token
        $stmt_user = $conn->prepare("SELECT id, ong_id FROM usuarios WHERE email = ?");
        if (!$stmt_user) {
            throw new Exception("Error al preparar la consulta de usuario: " . $conn->error);
        }
        $stmt_user->bind_param("s", $user_email);
        $stmt_user->execute();
        $result_user = $stmt_user->get_result();
        $usuario = $result_user->fetch_assoc();

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario del token no encontrado."]);
            exit;
        }
        $stmt_user->close();

        $query = "";
        if ($user_tipo === 'ong') {
            // Si es una ONG, trae todas las postulaciones a sus mascotas
            $id_ong = $usuario['ong_id'];
            $query = "SELECT a.id, m.id AS mascota_id, m.nombre AS mascota_nombre, u.id AS usuario_id, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, a.estado, a.fecha_inicio, a.fecha_fin, a.comentarios 
                      FROM adopciones a
                      JOIN mascotas m ON a.id_mascota = m.id
                      JOIN usuarios u ON a.id_usuario = u.id
                      WHERE a.id_ong = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $id_ong);
        } elseif ($user_tipo === 'usuario') {
            // Si es un usuario, trae solo sus propias postulaciones
            $id_usuario = $usuario['id']; // ID del usuario que postula
            $query = "SELECT a.id, m.id AS mascota_id, m.nombre AS mascota_nombre, o.nombre AS ong_nombre, a.estado, a.fecha_inicio, a.fecha_fin, a.comentarios 
                      FROM adopciones a
                      JOIN mascotas m ON a.id_mascota = m.id
                      JOIN ONGs o ON a.id_ong = o.id
                      WHERE a.id_usuario = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $id_usuario);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $postulaciones = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        echo json_encode($postulaciones);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Manejar la adición de comentarios
    $data = json_decode(file_get_contents("php://input"));
    $inTransaction = false;

    try {
        // Primero, obtenemos el ID del usuario/ONG desde la base de datos usando el email del token
        $stmt_user = $conn->prepare("SELECT id, ong_id FROM usuarios WHERE email = ?");
        $stmt_user->bind_param("s", $user_email);
        $stmt_user->execute();
        $result_user = $stmt_user->get_result();
        $usuario_data = $result_user->fetch_assoc();
        $stmt_user->close();

        if (!$usuario_data) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario del token no encontrado."]);
            exit;
        }

        // Diferenciar si es para agregar comentario o para cambiar estado
        if (isset($data->comentario)) {
            // --- LÓGICA PARA AGREGAR COMENTARIO ---
            $adopcion_id = $data->adopcion_id;
            $nuevo_comentario_texto = trim($data->comentario);

            // ... (validaciones de comentario)

            $conn->begin_transaction();
            $inTransaction = true;

            $stmt_adopcion = $conn->prepare("SELECT a.id_usuario, a.id_ong, a.id_mascota, a.comentarios, m.nombre AS mascota_nombre FROM adopciones a JOIN mascotas m ON a.id_mascota = m.id WHERE a.id = ?");
            $stmt_adopcion->bind_param("i", $adopcion_id);
            $stmt_adopcion->execute();
            $adopcion = $stmt_adopcion->get_result()->fetch_assoc();
            $stmt_adopcion->close();
            if (!$adopcion) {
                $conn->rollback();
                $inTransaction = false;
                http_response_code(404);
                echo json_encode(["message" => "Postulación no encontrada."]);
                exit;
            }
            $mascotaNombre = $adopcion['mascota_nombre'] ?? 'mascota';

            // ... (verificación de permisos para comentar)

            // Concatenar el nuevo comentario
            $fecha_comentario = date("d/m/Y H:i");
            $quien_comenta = ($user_tipo === 'ong') ? "ONG" : "Usuario";
            $comentario_actual = $adopcion['comentarios'] ? $adopcion['comentarios'] . "\n---\n" : "";
            $nuevo_comentarios_final = $comentario_actual . "[$fecha_comentario - $quien_comenta]: " . $nuevo_comentario_texto;

            $stmt_update = $conn->prepare("UPDATE adopciones SET comentarios = ? WHERE id = ?");
            $stmt_update->bind_param("si", $nuevo_comentarios_final, $adopcion_id);
            if (!$stmt_update->execute()) {
                throw new Exception("Error al actualizar el comentario: " . $conn->error);
            }
            $stmt_update->close();

            $eventoTipo = "comentario_agregado";
            $eventoMeta = json_encode([
                "comentario" => $nuevo_comentario_texto
            ]);
            $stmtEvento = $conn->prepare("INSERT INTO adopcion_eventos (adopcion_id, actor_id, tipo, detalle, metadata) VALUES (?, ?, ?, ?, ?)");
            $stmtEvento->bind_param("iisss", $adopcion_id, $usuario_data['id'], $eventoTipo, $nuevo_comentario_texto, $eventoMeta);
            if (!$stmtEvento->execute()) {
                throw new Exception("Error al registrar el evento: " . $stmtEvento->error);
            }
            $stmtEvento->close();

            $notifTipo = "comentario_agregado";
            $notifTitulo = "Nuevo comentario";
            $notifCuerpo = "Nuevo comentario en la postulacion de " . $mascotaNombre . ".";
            $notifEntidadTipo = "adopcion";
            $notifEntidadId = $adopcion_id;
            $notifPayload = json_encode([
                "adopcion_id" => $adopcion_id,
                "mascota_id" => $adopcion['id_mascota']
            ]);
            $stmtNotif = $conn->prepare("INSERT INTO notificaciones (usuario_id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            if ($user_tipo === 'ong') {
                $usuarioDestino = (int) $adopcion['id_usuario'];
                $stmtNotif->bind_param("iissssis", $usuarioDestino, $usuario_data['id'], $notifTipo, $notifTitulo, $notifCuerpo, $notifEntidadTipo, $notifEntidadId, $notifPayload);
                if (!$stmtNotif->execute()) {
                    throw new Exception("Error al crear la notificacion: " . $stmtNotif->error);
                }
            } else {
                $stmtOngUsers = $conn->prepare("SELECT id FROM usuarios WHERE tipo = 'ong' AND ong_id = ?");
                $stmtOngUsers->bind_param("i", $adopcion['id_ong']);
                $stmtOngUsers->execute();
                $resultOngUsers = $stmtOngUsers->get_result();
                while ($row = $resultOngUsers->fetch_assoc()) {
                    $ongUserId = (int) $row['id'];
                    $stmtNotif->bind_param("iissssis", $ongUserId, $usuario_data['id'], $notifTipo, $notifTitulo, $notifCuerpo, $notifEntidadTipo, $notifEntidadId, $notifPayload);
                    if (!$stmtNotif->execute()) {
                        throw new Exception("Error al crear la notificacion: " . $stmtNotif->error);
                    }
                }
                $stmtOngUsers->close();
            }

            $stmtNotif->close();
            $conn->commit();
            $inTransaction = false;
            echo json_encode(["message" => "Comentario agregado con éxito.", "comentarios" => $nuevo_comentarios_final]);

        } elseif (isset($data->new_status)) {
            // --- LÓGICA PARA ACTUALIZAR ESTADO ---
            if ($user_tipo !== 'ong') {
                http_response_code(403);
                echo json_encode(["message" => "Solo las ONGs pueden cambiar el estado de una postulación."]);
                exit;
            }

            $adopcion_id = $data->adopcion_id;
            $new_status = (int) $data->new_status;

            $conn->begin_transaction();
            $inTransaction = true;

            // Obtener la postulación para verificar que pertenece a la ONG
            $stmt_adopcion = $conn->prepare("SELECT a.id_ong, a.id_usuario, a.id_mascota, a.estado, m.nombre AS mascota_nombre FROM adopciones a JOIN mascotas m ON a.id_mascota = m.id WHERE a.id = ?");
            $stmt_adopcion->bind_param("i", $adopcion_id);
            $stmt_adopcion->execute();
            $adopcion = $stmt_adopcion->get_result()->fetch_assoc();
            $stmt_adopcion->close();

            if (!$adopcion) {
                $conn->rollback();
                $inTransaction = false;
                http_response_code(404);
                echo json_encode(["message" => "Postulación no encontrada."]);
                exit;
            }

            if ($usuario_data['ong_id'] != $adopcion['id_ong']) {
                $conn->rollback();
                $inTransaction = false;
                http_response_code(403);
                echo json_encode(["message" => "No tienes permiso para modificar esta postulación."]);
                exit;
            }

            $estadoAnterior = (int) $adopcion['estado'];
            $fechaFin = ($new_status === 1 || $new_status === 2) ? date("Y-m-d H:i:s") : null;
            $stmt_update = $conn->prepare("UPDATE adopciones SET estado = ?, fecha_fin = ? WHERE id = ?");
            $stmt_update->bind_param("isi", $new_status, $fechaFin, $adopcion_id);
            if (!$stmt_update->execute()) {
                throw new Exception("Error al actualizar el estado: " . $conn->error);
            }
            $stmt_update->close();

            // Sincronizar estado de la mascota según postulaciones (si no está archivada).
            $mascotaId = (int) $adopcion['id_mascota'];
            $stmtMascotaEstado = $conn->prepare("SELECT estado FROM mascotas WHERE id = ?");
            $stmtMascotaEstado->bind_param("i", $mascotaId);
            $stmtMascotaEstado->execute();
            $mascotaEstadoRow = $stmtMascotaEstado->get_result()->fetch_assoc();
            $stmtMascotaEstado->close();

            $estadoMascotaActual = isset($mascotaEstadoRow['estado']) ? (int) $mascotaEstadoRow['estado'] : 1;
            if ($estadoMascotaActual !== 3) {
                $stmtCounts = $conn->prepare(
                    "SELECT
                        SUM(CASE WHEN estado = 1 THEN 1 ELSE 0 END) AS aprobadas,
                        SUM(CASE WHEN estado = 0 THEN 1 ELSE 0 END) AS pendientes
                     FROM adopciones
                     WHERE id_mascota = ?"
                );
                $stmtCounts->bind_param("i", $mascotaId);
                $stmtCounts->execute();
                $counts = $stmtCounts->get_result()->fetch_assoc();
                $stmtCounts->close();

                $aprobadas = (int) ($counts['aprobadas'] ?? 0);
                $pendientes = (int) ($counts['pendientes'] ?? 0);

                if ($aprobadas > 0) {
                    $nuevoEstadoMascota = 2;
                } elseif ($pendientes > 0) {
                    $nuevoEstadoMascota = 0;
                } else {
                    $nuevoEstadoMascota = 1;
                }

                $stmtMascota = $conn->prepare("UPDATE mascotas SET estado = ?, date_update = NOW() WHERE id = ?");
                $stmtMascota->bind_param("ii", $nuevoEstadoMascota, $mascotaId);
                if (!$stmtMascota->execute()) {
                    throw new Exception("Error al actualizar el estado de la mascota: " . $stmtMascota->error);
                }
                $stmtMascota->close();
            }

            $eventoTipo = "estado_actualizado";
            $eventoDetalle = "Estado actualizado";
            $eventoMeta = json_encode([
                "estado_anterior" => $estadoAnterior,
                "estado_nuevo" => $new_status,
                "fecha_fin" => $fechaFin
            ]);
            $stmtEvento = $conn->prepare("INSERT INTO adopcion_eventos (adopcion_id, actor_id, tipo, estado_anterior, estado_nuevo, detalle, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmtEvento->bind_param("iisiiss", $adopcion_id, $usuario_data['id'], $eventoTipo, $estadoAnterior, $new_status, $eventoDetalle, $eventoMeta);
            if (!$stmtEvento->execute()) {
                throw new Exception("Error al registrar el evento: " . $stmtEvento->error);
            }
            $stmtEvento->close();

            $estadoLabels = [
                0 => "Pendiente",
                1 => "Aprobada",
                2 => "Rechazada"
            ];
            $estadoTexto = $estadoLabels[$new_status] ?? "Actualizada";
            $notifTipo = "estado_actualizado";
            $notifTitulo = "Estado actualizado";
            $fechaCierreTexto = $fechaFin ? (" el " . date("d/m/Y H:i")) : "";
            $notifCuerpo = "Tu postulacion para " . $adopcion['mascota_nombre'] . " fue " . $estadoTexto . $fechaCierreTexto . ".";
            $notifEntidadTipo = "adopcion";
            $notifEntidadId = $adopcion_id;
            $notifPayload = json_encode([
                "adopcion_id" => $adopcion_id,
                "mascota_id" => $adopcion['id_mascota'],
                "estado_anterior" => $estadoAnterior,
                "estado_nuevo" => $new_status
            ]);
            $stmtNotif = $conn->prepare("INSERT INTO notificaciones (usuario_id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $usuarioDestino = (int) $adopcion['id_usuario'];
            $stmtNotif->bind_param("iissssis", $usuarioDestino, $usuario_data['id'], $notifTipo, $notifTitulo, $notifCuerpo, $notifEntidadTipo, $notifEntidadId, $notifPayload);
            if (!$stmtNotif->execute()) {
                throw new Exception("Error al crear la notificacion: " . $stmtNotif->error);
            }
            $stmtNotif->close();

            $conn->commit();
            $inTransaction = false;
            echo json_encode(["message" => "Estado de la postulación actualizado con éxito."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Petición no válida."]);
        }

    } catch (Exception $e) {
        if ($inTransaction) {
            $conn->rollback();
        }
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }
}

$conn->close();
?>
