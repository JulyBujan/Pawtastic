document.addEventListener("DOMContentLoaded", () => {
    const formMascota = document.getElementById("formMascota");

    // Verifica si existe un token guardado
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipo");

    if (!token || tipo !== 'ong') {
      showToast("⚠️ Debes iniciar sesión como ONG para acceder a esta página.", "danger");
      window.location.href = "login.html";
      return;
    }

    formMascota.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(formMascota);

        try {
            const res = await fetch("../api/cargar_mascota.php", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                showToast(data.message, "success");
                formMascota.reset();
                window.location.href = './mis-mascotas.html'; // Redirigir a la lista de mascotas
            } else {
                throw new Error(data.message || 'Error al cargar la mascota');
            }

        } catch (error) {
            console.error(error);
            showToast(error.message, "danger");
        }
    });
});
