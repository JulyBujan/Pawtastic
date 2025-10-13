<?php
include_once "../api/conexion.php";

$message = "";
$message_type = "danger"; // 'danger' o 'success'

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    // Buscar el token en la base de datos
    $stmt = $conn->prepare("SELECT id, estado FROM usuarios WHERE token_validacion = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if ($user['estado'] === 'activo') {
            $message = "Tu cuenta ya ha sido activada anteriormente. Ya puedes iniciar sesión.";
            $message_type = "info";
        } else {
            // Activar la cuenta y limpiar el token
            $update_stmt = $conn->prepare("UPDATE usuarios SET estado = 'activo', token_validacion = NULL WHERE id = ?");
            if ($update_stmt->execute([$user['id']])) {
                $message = "¡Tu cuenta ha sido activada con éxito! 🎉 Ya puedes iniciar sesión.";
                $message_type = "success";
            } else {
                $message = "Hubo un error al activar tu cuenta. Por favor, intenta de nuevo o contacta a soporte.";
            }
        }
    } else {
        $message = "El enlace de validación no es válido o ha expirado. Por favor, solicita uno nuevo.";
    }
} else {
    $message = "No se proporcionó un token de validación.";
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Validación de Cuenta | Pawtastic</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="icon" href="../img/favicon.ico" type="image/png">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <!-- NAVBAR -->
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center" href="../index.html">
        <img src="../img/logo.png" alt="Logo Pawtastic" width="50" height="50" class="me-2 logo-navbar">
        <span class="text-warning fw-bold">Pawtastic</span>
      </a>
    </div>
  </nav>

  <!-- MENSAJE DE VALIDACIÓN -->
  <section class="py-5 bg-light">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-lg">
            <div class="card-body p-5 text-center">
              <div class="alert alert-<?php echo $message_type; ?>" role="alert">
                <h4 class="alert-heading"><?php echo $message_type === 'success' ? '¡Felicidades!' : 'Atención'; ?></h4>
                <p><?php echo $message; ?></p>
              </div>
              <a href="./login.html" class="btn btn-dark mt-3">Ir a Iniciar Sesión</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
