<?php
include_once "conexion.php";

$message = "";
$message_type = "danger"; // 'danger' o 'success'
$modal_header_class = "bg-danger-subtle";
$modal_title = "Atención";

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    // Buscar el token en la base de datos
    $stmt = $conn->prepare("SELECT id, estado FROM usuarios WHERE tokenv = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user) {
        if ($user['estado'] == 0) { // 0 es validado
            $message = "Tu cuenta ya ha sido activada anteriormente. Serás redirigido al login.";
            $message_type = "info";
            $modal_header_class = "bg-info-subtle";
            $modal_title = "Atención";
        } else {
            // Activar la cuenta (estado = 0) y limpiar el token
            $update_stmt = $conn->prepare("UPDATE usuarios SET estado = 0, tokenv = NULL WHERE id = ?");
            $update_stmt->bind_param("i", $user['id']);
            if ($update_stmt->execute()) {
                $message = "¡Tu cuenta ha sido activada con éxito! 🎉 Serás redirigido para iniciar sesión.";
                $message_type = "success";
                $modal_header_class = "bg-success-subtle";
                $modal_title = "¡Felicidades!";
            } else {
                $message = "Hubo un error al activar tu cuenta. Por favor, intenta de nuevo o contacta a soporte.";
                $modal_header_class = "bg-danger-subtle";
                $modal_title = "Atención";
            }
        }
    }
 else {
        $message = "El enlace de validación no es válido o ha expirado. Por favor, solicita uno nuevo.";
        $modal_header_class = "bg-danger-subtle";
        $modal_title = "Atención";
    }
} else {
    $message = "No se proporcionó un token de validación.";
    $modal_header_class = "bg-danger-subtle";
    $modal_title = "Atención";
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
              <h4 class="fw-bold mb-3">Validación de cuenta</h4>
              <p class="text-muted mb-4">Estamos procesando tu solicitud. Serás redirigido en unos segundos.</p>
              <a href="../pages/login.html" class="btn btn-dark mt-3">Ir a Iniciar Sesión</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="modal fade" id="validationModal" tabindex="-1" aria-labelledby="validationModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header <?php echo $modal_header_class; ?>">
          <h5 class="modal-title" id="validationModalLabel"><?php echo $modal_title; ?></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0"><?php echo $message; ?></p>
        </div>
        <div class="modal-footer">
          <a href="../pages/login.html" class="btn btn-dark">Ir a Iniciar Sesión</a>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
    validationModal.show();
    setTimeout(function() {
      window.location.href = '../pages/login.html';
    }, 3000); // 3000 milisegundos = 3 segundos
  </script>
</body>
</html>
