document.addEventListener('DOMContentLoaded', function () {
  const formLogin = document.getElementById("formLogin");
  const formRecuperar = document.getElementById('formRecuperar');
  const modalRecuperarEl = document.getElementById('modalRecuperar');

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

          showToast("Inicio de sesión exitoso 🎉", "success");

          // Redirigir según el tipo de usuario
        if (data.tipo === 'admin') {
            window.location.href = "perfil-admin.html"; // Redirigir a perfil de admin
        } else if (data.tipo === 'ong') {
            window.location.href = "perfil-ong.html"; // Redirigir a perfil de ONG
        } else {
            window.location.href = "catalogo.html"; // Redirigir a perfil de usuario normal
        }
        
        } else {
          showToast(data.message || "Error en las credenciales.", "danger");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        showToast("Error de conexión con el servidor.", "danger");
      }
    });
  }

  // --- Forgot Password Modal Logic ---
  if (formRecuperar && modalRecuperarEl) {
    formRecuperar.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (formRecuperar.checkValidity()) {
        showToast("📬 Si el correo está registrado, te enviaremos instrucciones para restablecer tu contraseña.", "info");
        formRecuperar.reset();
        const modal = bootstrap.Modal.getInstance(modalRecuperarEl);
        modal.hide();
      }
      formRecuperar.classList.add('was-validated');
    });
  }
});