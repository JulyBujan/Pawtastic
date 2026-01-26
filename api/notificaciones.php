<?php
header("Content-Type: application/json");
include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';
include_once "verificar_token.php";

$email = $decoded_token->email;

$stmt_user = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
if (!$stmt_user) {
    http_response_code(500);
    echo json_encode(["message" => "Error al preparar la consulta de usuario."]);
    exit;
}
$stmt_user->bind_param("s", $email);
$stmt_user->execute();
$result_user = $stmt_user->get_result();
$usuario = $result_user->fetch_assoc();
$stmt_user->close();

if (!$usuario) {
    http_response_code(404);
    echo json_encode(["message" => "Usuario del token no encontrado."]);
    exit;
}

$usuario_id = (int) $usuario['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $count_only = isset($_GET['count']) && $_GET['count'] === '1';
    $only_unread = isset($_GET['unread']) && $_GET['unread'] === '1';
    $limit = isset($_GET['limit']) ? max(1, min(100, (int) $_GET['limit'])) : 20;
    $offset = isset($_GET['offset']) ? max(0, (int) $_GET['offset']) : 0;

    if ($count_only) {
        $stmt_count = $conn->prepare("SELECT COUNT(*) AS unread FROM notificaciones WHERE usuario_id = ? AND leida_at IS NULL");
        $stmt_count->bind_param("i", $usuario_id);
        $stmt_count->execute();
        $count_result = $stmt_count->get_result()->fetch_assoc();
        $stmt_count->close();

        echo json_encode(["unread" => (int) $count_result['unread']]);
        exit;
    }

    $query = "SELECT id, actor_id, tipo, titulo, cuerpo, entidad_tipo, entidad_id, leida_at, created_at, payload
              FROM notificaciones
              WHERE usuario_id = ?";
    if ($only_unread) {
        $query .= " AND leida_at IS NULL";
    }
    $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    $stmt_list = $conn->prepare($query);
    $stmt_list->bind_param("iii", $usuario_id, $limit, $offset);
    $stmt_list->execute();
    $result_list = $stmt_list->get_result();
    $notificaciones = $result_list->fetch_all(MYSQLI_ASSOC);
    $stmt_list->close();

    echo json_encode($notificaciones);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["message" => "Payload inválido."]);
        exit;
    }

    $mark_all = !empty($data['mark_all']);
    $ids = isset($data['ids']) && is_array($data['ids']) ? $data['ids'] : [];
    $ids = array_values(array_filter($ids, function ($id) {
        return is_int($id) || ctype_digit((string) $id);
    }));

    if ($mark_all) {
        $stmt_mark_all = $conn->prepare("UPDATE notificaciones SET leida_at = CURRENT_TIMESTAMP WHERE usuario_id = ? AND leida_at IS NULL");
        $stmt_mark_all->bind_param("i", $usuario_id);
        $stmt_mark_all->execute();
        $updated = $stmt_mark_all->affected_rows;
        $stmt_mark_all->close();

        echo json_encode(["message" => "Notificaciones marcadas como leidas.", "updated" => $updated]);
        exit;
    }

    if (empty($ids)) {
        http_response_code(400);
        echo json_encode(["message" => "Debes enviar ids o mark_all."]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids) + 1);
    $params = array_merge([$usuario_id], array_map('intval', $ids));

    $stmt_mark = $conn->prepare("UPDATE notificaciones SET leida_at = CURRENT_TIMESTAMP WHERE usuario_id = ? AND id IN ($placeholders)");
    $bind_args = [];
    $bind_args[] = $types;
    foreach ($params as $index => $value) {
        $bind_args[] = &$params[$index];
    }
    call_user_func_array([$stmt_mark, 'bind_param'], $bind_args);
    $stmt_mark->execute();
    $updated = $stmt_mark->affected_rows;
    $stmt_mark->close();

    echo json_encode(["message" => "Notificaciones marcadas como leidas.", "updated" => $updated]);
    exit;
}

http_response_code(405);
echo json_encode(["message" => "Metodo no permitido."]);
