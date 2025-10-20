document.addEventListener('DOMContentLoaded', function () {
  const formLogin = document.getElementById("formLogin");
  const formRecuperar = document.getElementById('formRecuperar');
  const modalRecuperarEl = document.getElementById('modalRecuperar');

  // Helper to show alerts
  function showAlert(message, type = 'danger') {
    // In a real app, you would replace this with a more robust toast/alert system.
    // For now, we'll use the browser's alert.
    console.log(`Alert (${type}): ${message}`);
    alert(message);
  }

  // Helper para hashear un string con SHA-256
  async function sha256(message) {
    // codificar como UTF-8
    const msgBuffer = new TextEncoder().encode(message);
    // hashear el mensaje
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    // convertir ArrayBuffer a array de bytes
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convertir bytes a string hexadecimal
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }


  // --- Login Form Logic ---
  if (formLogin) {
    formLogin.addEventListener("submit", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!formLogin.checkValidity()) {
        formLogin.classList.add('was-validated');
        return;
      }

      const email = document.getElementById("email").value.trim();
      const plainPassword = document.getElementById("password").value.trim();
      const password = await sha256(plainPassword); // Hasheamos la contraseña

      try {
        const res = await fetch("../api/login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("tipo", data.tipo);

          showAlert("Inicio de sesión exitoso 🎉", "success");

          if (data.tipo === "usuario") {
            window.location.href = "catalogo.html";
          } else if (data.tipo === "ong") {
            window.location.href = "perfil-ong.html";
          }
        } else {
          showAlert(data.message || "Error en las credenciales.");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        showAlert("Error de conexión con el servidor.");
      }
    });
  }

  // --- Forgot Password Modal Logic ---
  if (formRecuperar && modalRecuperarEl) {
    formRecuperar.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (formRecuperar.checkValidity()) {
        showAlert("📬 Si el correo está registrado, te enviaremos instrucciones para restablecer tu contraseña.", "info");
        formRecuperar.reset();
        const modal = bootstrap.Modal.getInstance(modalRecuperarEl);
        modal.hide();
      }
      formRecuperar.classList.add('was-validated');
    });
  }
});