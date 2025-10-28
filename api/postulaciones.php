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
            $query = "SELECT a.id, m.id AS mascota_id, m.nombre AS mascota_nombre, u.id AS usuario_id, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, a.estado, a.fecha_inicio, a.comentarios 
                      FROM adopciones a
                      JOIN mascotas m ON a.id_mascota = m.id
                      JOIN usuarios u ON a.id_usuario = u.id
                      WHERE a.id_ong = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $id_ong);
        } elseif ($user_tipo === 'usuario') {
            // Si es un usuario, trae solo sus propias postulaciones
            $id_usuario = $usuario['id']; // ID del usuario que postula
            $query = "SELECT a.id, m.id AS mascota_id, m.nombre AS mascota_nombre, o.nombre AS ong_nombre, a.estado, a.fecha_inicio, a.comentarios 
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

            $stmt_adopcion = $conn->prepare("SELECT id_usuario, id_ong, comentarios FROM adopciones WHERE id = ?");
            $stmt_adopcion->bind_param("i", $adopcion_id);
            $stmt_adopcion->execute();
            $adopcion = $stmt_adopcion->get_result()->fetch_assoc();
            $stmt_adopcion->close();

            // ... (verificación de permisos para comentar)

            // Concatenar el nuevo comentario
            $fecha_comentario = date("d/m/Y H:i");
            $quien_comenta = ($user_tipo === 'ong') ? "ONG" : "Usuario";
            $comentario_actual = $adopcion['comentarios'] ? $adopcion['comentarios'] . "\n---\n" : "";
            $nuevo_comentarios_final = $comentario_actual . "[$fecha_comentario - $quien_comenta]: " . $nuevo_comentario_texto;

            $stmt_update = $conn->prepare("UPDATE adopciones SET comentarios = ? WHERE id = ?");
            $stmt_update->bind_param("si", $nuevo_comentarios_final, $adopcion_id);
            if ($stmt_update->execute()) {
                echo json_encode(["message" => "Comentario agregado con éxito.", "comentarios" => $nuevo_comentarios_final]);
            } else {
                throw new Exception("Error al actualizar el comentario: " . $conn->error);
            }
            $stmt_update->close();

        } elseif (isset($data->new_status)) {
            // --- LÓGICA PARA ACTUALIZAR ESTADO ---
            if ($user_tipo !== 'ong') {
                http_response_code(403);
                echo json_encode(["message" => "Solo las ONGs pueden cambiar el estado de una postulación."]);
                exit;
            }

            $adopcion_id = $data->adopcion_id;
            $new_status = $data->new_status;

            // Obtener la postulación para verificar que pertenece a la ONG
            $stmt_adopcion = $conn->prepare("SELECT id_ong FROM adopciones WHERE id = ?");
            $stmt_adopcion->bind_param("i", $adopcion_id);
            $stmt_adopcion->execute();
            $adopcion = $stmt_adopcion->get_result()->fetch_assoc();
            $stmt_adopcion->close();

            if (!$adopcion) {
                http_response_code(404);
                echo json_encode(["message" => "Postulación no encontrada."]);
                exit;
            }

            if ($usuario_data['ong_id'] != $adopcion['id_ong']) {
                http_response_code(403);
                echo json_encode(["message" => "No tienes permiso para modificar esta postulación."]);
                exit;
            }

            $stmt_update = $conn->prepare("UPDATE adopciones SET estado = ? WHERE id = ?");
            $stmt_update->bind_param("ii", $new_status, $adopcion_id);
            if ($stmt_update->execute()) {
                echo json_encode(["message" => "Estado de la postulación actualizado con éxito."]);
            } else {
                throw new Exception("Error al actualizar el estado: " . $conn->error);
            }
            $stmt_update->close();
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Petición no válida."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }
}

$conn->close();
?>