document.addEventListener('DOMContentLoaded', function () {
  const formRegistro = document.getElementById('formRegistro');

  // Helper para mostrar alertas (puedes mejorarlo con toasts de Bootstrap)
  // Helper para hashear con SHA-256 (igual que en login.js)
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  if (formRegistro) {
    formRegistro.addEventListener('submit', async function (event) {
      event.preventDefault();
      event.stopPropagation();

      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirm-password');
      
      // Validar que las contraseñas coincidan
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.classList.add('is-invalid');
        formRegistro.classList.add('was-validated');
        return;
      } else {
        confirmPasswordInput.classList.remove('is-invalid');
      }

      if (!formRegistro.checkValidity()) {
        formRegistro.classList.add('was-validated');
        return;
      }

      const nombre = document.getElementById('nombre').value;
      const apellido = document.getElementById('apellido').value;
      const email = document.getElementById('email').value;
      const plainPassword = passwordInput.value;
      const password = await sha256(plainPassword);

      try {
        const res = await fetch('/api/registro.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          showToast(data.message, 'success');
          formRegistro.reset();
          // Opcional: redirigir al index después de unos segundos
          setTimeout(() => { window.location.href = '../index.html'; }, 3000);
        } else {
          showToast(data.message || 'Ocurrió un error en el registro.', 'danger');
        }
      } catch (error) {
        console.error('Error de conexión:', error);
        showToast('No se pudo conectar con el servidor. Inténtalo más tarde.', 'danger');
      }
    });
  }
});
