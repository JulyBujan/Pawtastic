document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const navUser = document.getElementById("nav-user");
  const navGuest = document.getElementById("nav-guest");

  // --- Lógica para proteger rutas y actualizar la barra de navegación ---
  if (token) {
    // Si hay token, mostramos los enlaces para usuarios logueados
    if (navUser) navUser.style.display = "flex";
    if (navGuest) navGuest.style.display = "none";

    // Asignar el enlace correcto al perfil según el tipo de usuario
    const tipoUsuario = localStorage.getItem("tipo");
    const perfilLink = document.getElementById("nav-perfil-link");
    if (perfilLink && tipoUsuario) {
      perfilLink.href =
        tipoUsuario === "ong"
          ? "/pages/perfil-ong.html"
          : "/pages/usuario.html";
    }
  } else {
    // Si no hay token, mostramos los enlaces para invitados
    if (navUser) navUser.style.display = "none";
    if (navGuest) navGuest.style.display = "flex";
  }

  // --- Lógica para el botón de Cerrar Sesión ---
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("tipo");
      window.location.href = "../index.html"; // Redirigir a la página principal
    });
  }
});
