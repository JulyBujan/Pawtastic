document.addEventListener('DOMContentLoaded', () => {
    const mascotasGrid = document.querySelector('.row-cols-1.row-cols-md-3');
    const filtroForm = document.getElementById('filtro-form');

    const fetchMascotas = async (params = '') => {
        try {
            const response = await fetch(`../api/catalogo.php?${params}`);
            if (!response.ok) {
                throw new Error('Error al cargar las mascotas');
            }
            const mascotas = await response.json();
            renderMascotas(mascotas);
        } catch (error) {
            console.error(error);
            mascotasGrid.innerHTML = '<p class="text-center">No se pudieron cargar las mascotas. Intente más tarde.</p>';
        }
    };

    const renderMascotas = (mascotas) => {
        mascotasGrid.innerHTML = '';
        if (mascotas.length === 0) {
            mascotasGrid.innerHTML = '<p class="text-center">No se encontraron mascotas con los filtros seleccionados.</p>';
            return;
        }

        mascotas.forEach(mascota => {
            const card = `
                <div class="col">
                    <div class="card h-100 shadow-sm overflow-hidden">
                        <img src="../img/mascotas/${mascota.imagen || 'default.jpg'}" class="card-img-top img-fluid rounded-top" alt="${mascota.nombre}" />
                        <div class="card-body d-flex flex-column justify-content-between text-center">
                            <h5 class="card-title">${mascota.nombre}🐾 <i class="bi bi-paw-fill text-warning"></i><i class="bi bi-paw-fill text-warning"></i></h5>
                            <p class="card-text">${mascota.descripcion.substring(0, 100)}...</p>
                            <a href="./detalle-mascota.html?id=${mascota.id}" class="btn btn-dark w-100 mt-auto">Ver más</a>
                        </div>
                    </div>
                </div>
            `;
            mascotasGrid.innerHTML += card;
        });
    };

    filtroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filtroForm);
        const params = new URLSearchParams(formData);
        fetchMascotas(params.toString());
    });

    // Carga inicial de todas las mascotas
    fetchMascotas();
});