<?php
header("Content-Type: application/json; charset=utf-8");
include_once "conexion.php";

require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

$user_id = isset($decoded_token->user_id) ? (int)$decoded_token->user_id : 0;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["message" => "Token inválido."]);
    exit;
}

function sanitize_text($value) {
    if ($value === null) {
        return null;
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function format_user_name($row) {
    $nombre = trim(($row['nombre'] ?? '') . ' ' . ($row['apellido'] ?? ''));
    return $nombre !== '' ? $nombre : 'Usuario';
}

function text_length($value) {
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    return strlen($value);
}

$method = $_SERVER['REQUEST_METHOD'];

function has_column($conn, $table, $column) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?"
    );
    if (!$stmt) {
        return false;
    }
    $stmt->bind_param("ss", $table, $column);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return ($row && (int)$row['total'] > 0);
}

if ($method === 'GET') {
    $post_id = filter_input(INPUT_GET, 'post_id', FILTER_VALIDATE_INT);
    if (!$post_id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inválido."]);
        exit;
    }

    $inTransaction = false;
    try {
        $hasEditedAt = has_column($conn, 'lost_found_messages', 'edited_at');
        $editedSelect = $hasEditedAt ? "m.edited_at" : "NULL AS edited_at";

        $stmt_post = $conn->prepare("SELECT id, user_id, pet_name, status FROM lost_found_posts WHERE id = ? AND deleted_at IS NULL");
        if (!$stmt_post) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        $stmt_post->bind_param("i", $post_id);
        $stmt_post->execute();
        $post = $stmt_post->get_result()->fetch_assoc();
        $stmt_post->close();

        if (!$post) {
            http_response_code(404);
            echo json_encode(["message" => "Publicación no encontrada."]);
            exit;
        }

        $owner_id = $post['user_id'] !== null ? (int)$post['user_id'] : null;
        $is_owner = $owner_id !== null && $owner_id === $user_id;

        if (($post['status'] ?? '') === 'RESOLVED' && !$is_owner) {
            http_response_code(404);
            echo json_encode(["message" => "Publicación no encontrada."]);
            exit;
        }

        if ($is_owner) {
            $stmt_msgs = $conn->prepare("SELECT m.id, m.sender_id, m.recipient_id, m.message, m.created_at, $editedSelect, u.nombre, u.apellido FROM lost_found_messages m JOIN usuarios u ON u.id = m.sender_id WHERE m.post_id = ? ORDER BY m.created_at ASC, m.id ASC");
            $stmt_msgs->bind_param("i", $post_id);
        } else {
            $stmt_msgs = $conn->prepare("SELECT m.id, m.sender_id, m.recipient_id, m.message, m.created_at, $editedSelect, u.nombre, u.apellido FROM lost_found_messages m JOIN usuarios u ON u.id = m.sender_id WHERE m.post_id = ? AND (m.sender_id = ? OR m.recipient_id = ?) ORDER BY m.created_at ASC, m.id ASC");
            $stmt_msgs->bind_param("iii", $post_id, $user_id, $user_id);
        }

        if (!$stmt_msgs) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }

        $stmt_msgs->execute();
        $rows = $stmt_msgs->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt_msgs->close();

        $messages = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'sender_id' => (int)$row['sender_id'],
                'recipient_id' => (int)$row['recipient_id'],
                'message' => sanitize_text($row['message'] ?? ''),
                'created_at' => sanitize_text($row['created_at'] ?? ''),
                'edited_at' => sanitize_text($row['edited_at'] ?? ''),
                'sender_name' => sanitize_text(format_user_name($row)),
            ];
        }, $rows);

        $participants = [];
        if ($is_owner) {
            $stmt_participants = $conn->prepare(
                "SELECT DISTINCT u.id, u.nombre, u.apellido
                 FROM usuarios u
                 WHERE u.id IN (
                    SELECT DISTINCT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id
                    FROM lost_found_messages
                    WHERE post_id = ? AND (sender_id = ? OR recipient_id = ?)
                 )
                 ORDER BY u.nombre, u.apellido"
            );
            if (!$stmt_participants) {
                throw new Exception("Error al preparar la consulta: " . $conn->error);
            }
            $stmt_participants->bind_param("iiii", $user_id, $post_id, $user_id, $user_id);
            $stmt_participants->execute();
            $participants_rows = $stmt_participants->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_participants->close();

            $participants = array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'name' => sanitize_text(format_user_name($row))
                ];
            }, $participants_rows);
        }

        echo json_encode([
            'postId' => (int)$post_id,
            'ownerId' => $owner_id,
            'viewerId' => $user_id,
            'isOwner' => $is_owner,
            'canMessage' => $owner_id !== null,
            'postStatus' => sanitize_text($post['status'] ?? ''),
            'participants' => $participants,
            'messages' => $messages
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }

    $conn->close();
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["message" => "Payload inválido."]);
        exit;
    }

    $post_id = isset($data['post_id']) ? (int)$data['post_id'] : 0;
    $message = isset($data['message']) ? trim((string)$data['message']) : '';

    if (!$post_id || $message === '') {
        http_response_code(400);
        echo json_encode(["message" => "Faltan datos obligatorios."]);
        exit;
    }

    if (text_length($message) > 600) {
        http_response_code(400);
        echo json_encode(["message" => "El mensaje supera el máximo de 600 caracteres."]);
        exit;
    }

    try {
        $stmt_post = $conn->prepare("SELECT id, user_id, pet_name, status FROM lost_found_posts WHERE id = ? AND deleted_at IS NULL");
        if (!$stmt_post) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        $stmt_post->bind_param("i", $post_id);
        $stmt_post->execute();
        $post = $stmt_post->get_result()->fetch_assoc();
        $stmt_post->close();

        if (!$post) {
            http_response_code(404);
            echo json_encode(["message" => "Publicación no encontrada."]);
            exit;
        }

        $owner_id = $post['user_id'] !== null ? (int)$post['user_id'] : null;
        if (!$owner_id) {
            http_response_code(400);
            echo json_encode(["message" => "La publicación no tiene un usuario asociado."]);
            exit;
        }

        $is_owner = $owner_id === $user_id;
        if (($post['status'] ?? '') === 'RESOLVED' && !$is_owner) {
            http_response_code(404);
            echo json_encode(["message" => "Publicación no encontrada."]);
            exit;
        }
        $recipient_id = null;

        if ($is_owner) {
            $recipient_id = isset($data['recipient_id']) ? (int)$data['recipient_id'] : 0;
            if (!$recipient_id || $recipient_id === $owner_id) {
                http_response_code(400);
                echo json_encode(["message" => "Seleccioná un destinatario válido."]);
                exit;
            }
            $stmt_check = $conn->prepare("SELECT 1 FROM lost_found_messages WHERE post_id = ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1");
            if (!$stmt_check) {
                throw new Exception("Error al preparar la consulta: " . $conn->error);
            }
            $stmt_check->bind_param("iii", $post_id, $recipient_id, $recipient_id);
            $stmt_check->execute();
            $exists = $stmt_check->get_result()->fetch_row();
            $stmt_check->close();
            if (!$exists) {
                http_response_code(400);
                echo json_encode(["message" => "El destinatario no participa en la conversación."]);
                exit;
            }
        } else {
            $recipient_id = $owner_id;
        }

        $conn->begin_transaction();
        $inTransaction = true;

        $stmt_insert = $conn->prepare("INSERT INTO lost_found_messages (post_id, sender_id, recipient_id, message) VALUES (?, ?, ?, ?)");
        if (!$stmt_insert) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        $stmt_insert->bind_param("iiis", $post_id, $user_id, $recipient_id, $message);
        if (!$stmt_insert->execute()) {
            throw new Exception("No se pudo guardar el mensaje.");
        }
        $stmt_insert->close();

        $stmt_sender = $conn->prepare("SELECT nombre, apellido FROM usuarios WHERE id = ?");
        $stmt_sender->bind_param("i", $user_id);
        $stmt_sender->execute();
        $sender_row = $stmt_sender->get_result()->fetch_assoc();
        $stmt_sender->close();
        $sender_name = $sender_row ? format_user_name($sender_row) : 'Usuario';

        $pet_name = $post['pet_name'] ?: 'mascota';
        $notif_tipo = "lost_found_message";
        $notif_titulo = "Nuevo mensaje";
        $notif_cuerpo = $sender_name . " te envió un mensaje sobre " . $pet_name . ".";
        $notif_entidad_tipo = "lost_found";
        $notif_entidad_id = $post_id;
        $notif_payload = json_encode([
            "lost_found_id" => $post_id,
            "post_id" => $post_id,
            "sender_id" => $user_id
        ]);

        $stmt_notif = $conn->prepare("INSERT INTO notificaciones (usuario_id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt_notif) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        $stmt_notif->bind_param("iissssis", $recipient_id, $user_id, $notif_tipo, $notif_titulo, $notif_cuerpo, $notif_entidad_tipo, $notif_entidad_id, $notif_payload);
        if (!$stmt_notif->execute()) {
            throw new Exception("Error al crear la notificación.");
        }
        $stmt_notif->close();

        $conn->commit();
        $inTransaction = false;
        echo json_encode(["message" => "Mensaje enviado."]);
    } catch (Exception $e) {
        if ($inTransaction) {
            $conn->rollback();
        }
        http_response_code(500);
        echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
    }

    $conn->close();
    exit;
}

http_response_code(405);
echo json_encode(["message" => "Método no permitido."]);
$conn->close();
?>
