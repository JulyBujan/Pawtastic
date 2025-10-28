document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipo");
    const nombreOngSpan = document.getElementById("nombreOng");
    const bienvenidaH2 = document.getElementById("bienvenidaOng");

    // 1. Verificar autenticación y tipo de usuario
    if (!token || tipo !== 'ong') {
        alert("⚠️ Debes iniciar sesión como ONG para acceder a esta página.");
        window.location.href = "login.html";
        return;
    }

    // 2. Función para obtener y mostrar los datos de la ONG
    const fetchOngData = async () => {
        try {
            const response = await fetch("../api/perfil-ong.php", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los datos de la ONG.');
            }

            const ong = await response.json();

            // 3. Actualizar el HTML con el nombre de la ONG
            if (ong.nombre) {
                nombreOngSpan.textContent = ong.nombre;
                bienvenidaH2.textContent = `¡Bienvenida, ${ong.nombre}!`;
            }

        } catch (error) {
            console.error(error);
            nombreOngSpan.textContent = "Error al cargar";
        }
    };

    fetchOngData();
});