<?php
header("Content-Type: application/json");

include_once "conexion.php";
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->nombre) || !isset($data->apellido) || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios."]);
    exit;
}

$nombre = trim($data->nombre);
$apellido = trim($data->apellido);
$email = trim($data->email);
$password_hash = $data->password; // La contraseña ya viene hasheada desde JS

// 1. Verificar si el email ya existe
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409); // 409 Conflict
    echo json_encode(["message" => "El correo electrónico ya está registrado."]);
    exit;
}

// 2. Generar token de validación
$token = bin2hex(random_bytes(32));

// 3. Insertar usuario como 'pendiente'
try {
    $query = $conn->prepare(
        "INSERT INTO usuarios (nombre, apellido, email, password, tipo, estado, token_validacion) 
         VALUES (?, ?, ?, ?, 'usuario', 'pendiente', ?)"
    );
    $query->execute([$nombre, $apellido, $email, $password_hash, $token]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al registrar el usuario: " . $e->getMessage()]);
    exit;
}

// 4. Enviar correo de validación
$mail = new PHPMailer(true);

try {
    // Configuración del servidor de correo (usando Gmail como ejemplo)
    // ⚠️ Para producción, usa variables de entorno para estos datos sensibles.
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'tu_correo@gmail.com'; // 🚨 TU CORREO DE GMAIL
    $mail->Password   = 'tu_contraseña_de_aplicacion'; // 🚨 TU CONTRASEÑA DE APLICACIÓN DE GMAIL
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    // Remitente y destinatario
    $mail->setFrom('no-reply@pawtastic.com', 'Pawtastic');
    $mail->addAddress($email, $nombre);

    // Contenido del correo
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = '🐾 ¡Confirma tu cuenta en Pawtastic!';
    
    // El enlace debe apuntar a tu sitio web
    $validation_link = "http://localhost/Pawtastic/pages/validar.php?token=" . $token;

    $mail->Body    = "
        <h1>¡Hola {$nombre}!</h1>
        <p>Gracias por registrarte en Pawtastic. Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
        <p><a href='{$validation_link}' style='padding: 10px 15px; background-color: #F7931E; color: white; text-decoration: none; border-radius: 5px;'>Activar mi cuenta</a></p>
        <p>Si no te registraste en nuestro sitio, puedes ignorar este correo.</p>
        <p>El equipo de Pawtastic.</p>
    ";
    $mail->AltBody = "Hola {$nombre}, para activar tu cuenta, copia y pega este enlace en tu navegador: {$validation_link}";

    $mail->send();
    echo json_encode(['message' => 'Registro exitoso. Por favor, revisa tu correo para activar tu cuenta.']);

} catch (Exception $e) {
    http_response_code(500);
    // En un entorno real, podrías querer eliminar el usuario recién creado o marcarlo para reintentar el envío.
    echo json_encode(["message" => "El usuario fue registrado, pero hubo un error al enviar el correo de validación. Mailer Error: {$mail->ErrorInfo}"]);
}
?>
