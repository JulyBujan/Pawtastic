document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipo");
    const nombreAdminSpan = document.getElementById("nombreAdmin");
    const bienvenidaH2 = document.getElementById("bienvenidaAdmin");

    // 1. Verificar autenticación y tipo de usuario
    if (!token || tipo !== 'admin') {
        showToast("⚠️ Debes iniciar sesión como Administrador para acceder a esta página.", "danger");
        window.location.href = "login.html";
        return;
    }

    // 2. Función para obtener y mostrar los datos del Admin
    const fetchAdminData = async () => {
        try {
            const response = await fetch("../api/perfil-admin.php", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los datos del administrador.');
            }

            const admin = await response.json();

            // 3. Actualizar el HTML con el nombre del admin
            if (admin.nombre) {
                nombreAdminSpan.textContent = admin.nombre;
                bienvenidaH2.textContent = `¡Bienvenido, ${admin.nombre}!`;
            }

        } catch (error) {
            console.error(error);
            nombreAdminSpan.textContent = "Error al cargar";
            bienvenidaH2.textContent = "Error al cargar datos";
        }
    };

    fetchAdminData();
});