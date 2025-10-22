document.addEventListener('DOMContentLoaded', () => {
    const mascotasGrid = document.getElementById('contenedorMascotas');
    const token = localStorage.getItem("token");

    if (!token) {
        mascotasGrid.innerHTML = "<p class='text-danger text-center'>⚠️ Debes iniciar sesión para ver tus mascotas.</p>";
        return;
    }

    const fetchMascotas = async () => {
        try {
            const response = await fetch(`../api/listar_mascotas.php`, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las mascotas');
            }
            const mascotas = await response.json();
            renderMascotas(mascotas);
        } catch (error) {
            console.error(error);
            mascotasGrid.innerHTML = '<p class="text-center text-danger">No se pudieron cargar las mascotas. Intente más tarde.</p>';
        }
    };

    const renderMascotas = (mascotas) => {
        mascotasGrid.innerHTML = '';
        if (mascotas.length === 0) {
            mascotasGrid.innerHTML = '<p class="text-center text-muted">No has publicado ninguna mascota todavía.</p>';
            return;
        }

        mascotas.forEach(mascota => {
            const card = `
                <div class="col">
                    <div class="card h-100 shadow-sm overflow-hidden">
                        <img src="../img/mascotas/${mascota.imagen || 'default.jpg'}" class="card-img-top img-fluid rounded-top" alt="${mascota.nombre}" />
                        <div class="card-body d-flex flex-column justify-content-between text-center">
                            <h5 class="card-title">${mascota.nombre}</h5>
                            <p class="card-text">${mascota.descripcion.substring(0, 100)}...</p>
                            <div class="d-flex justify-content-around mt-auto">
                                <a href="./editar-mascota.html?id=${mascota.id}" class="btn btn-outline-primary btn-sm"><i class="bi bi-pencil"></i> Editar</a>
                                <button class="btn btn-outline-danger btn-sm" onclick="eliminarMascota(${mascota.id})"><i class="bi bi-trash"></i> Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            mascotasGrid.innerHTML += card;
        });
    };

    fetchMascotas();
});

async function eliminarMascota(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
        return;
    }

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`../api/editar_mascota.php?id=${id}`, { // Asumo que la API de edición puede manejar un DELETE
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.ok) {
            alert('Mascota eliminada con éxito');
            location.reload();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar la mascota');
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}
