document.addEventListener('DOMContentLoaded', () => {
    const mascotasContainer = document.getElementById('mascotas-container');
    const btnCompatibilidad = document.getElementById('btn-compatibilidad');
    const filtrosForm = document.getElementById('filtros-form');
    const btnCercania = document.getElementById('btn-cercania');

    // --- FUNCIONES ---

    /**
     * Muestra un spinner de carga en el contenedor de mascotas.
     */
    const mostrarSpinner = () => {
        mascotasContainer.innerHTML = `
            <div class="col-12 d-flex justify-content-center py-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>`;
    };

    /**
     * Resetea los campos de los filtros a su valor por defecto ("Todas").
     */
    const resetearFiltros = () => {
        document.getElementById('filtroEspecie').value = '';
        document.getElementById('filtroEdad').value = '';
        document.getElementById('filtroTamano').value = '';
    };

    /**
     * Renderiza las tarjetas de mascotas en el contenedor.
     * @param {Array} mascotas - El array de objetos de mascotas.
     * @param {boolean} porCompatibilidad - Flag para saber si se debe mostrar la compatibilidad.
     * @param {boolean} porCercania - Flag para saber si se debe mostrar la distancia.
     */
    const renderizarMascotas = (mascotas, porCompatibilidad = false, porCercania = false) => {
        mascotasContainer.innerHTML = ''; // Limpiar contenedor

        if (mascotas.length === 0) {
            mascotasContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No se encontraron mascotas que coincidan con tu búsqueda.</p></div>';
            return;
        }

        mascotas.forEach(mascota => {
            let descripcionModificada = mascota.descripcion;
            
            if (porCompatibilidad && mascota.compatibilidad) {
                descripcionModificada = `<strong class="text-warning">Compatibilidad: ${mascota.compatibilidad}%</strong><br>${mascota.descripcion}`;
            }

            if (porCercania && mascota.distancia_km) {
                descripcionModificada = `<strong class="text-info"><i class="bi bi-geo-alt-fill"></i> A ${mascota.distancia_km} km de ti</strong><br>${mascota.descripcion}`;
            }

            const card = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${mascota.imagen ? '/img/mascotas/' + mascota.imagen : '/img/mascotas/default.jpg'}" class="card-img-top" alt="Foto de ${mascota.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${mascota.nombre}</h5>
                            <p class="card-text">${descripcionModificada}</p>
                        </div>
                        <div class="card-footer bg-transparent border-0 text-end pb-3">
                            <a href="detalle-mascota.html?id=${mascota.id}" class="btn btn-dark">Ver más</a>
                        </div>
                    </div>
                </div>
            `;
            mascotasContainer.insertAdjacentHTML('beforeend', card);
        });
    };

    /**
     * Carga las mascotas por compatibilidad llamando al endpoint protegido.
     */
    const cargarMascotasPorCompatibilidad = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            showToast('Debes <a href="login.html" class="text-white text-decoration-underline">iniciar sesión</a> para usar esta función.', 'danger');
            return;
        }

        mostrarSpinner();

        try {
            const response = await fetch('/api/get_compatibilidad.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message, 'danger');
                return;
            }

            renderizarMascotas(data, true); // true para indicar que es por compatibilidad
            resetearFiltros(); // Reiniciamos los filtros visualmente

        } catch (error) {
            console.error('Error al buscar por compatibilidad:', error);
            mascotasContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger">Hubo un error al conectar con el servidor.</p></div>`;
        }
    };

    /**
     * Carga las mascotas ordenadas por cercanía llamando al endpoint protegido.
     */
    const cargarMascotasPorCercania = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            showToast('Debes <a href="login.html" class="text-white text-decoration-underline">iniciar sesión</a> para buscar por cercanía.', 'danger');
            return;
        }

        mostrarSpinner();

        try {
            const response = await fetch('/api/get_cercania.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // El código 412 indica que el usuario no tiene dirección validada.
                if (response.status === 412) {
                    showToast('Para usar esta función, <a href="usuario.html" class="text-white text-decoration-underline">valida tu dirección</a> en tu perfil.', 'warning');
                } else {
                    showToast(data.message, 'danger');
                }
                return;
            }

            renderizarMascotas(data, false, true); // true para indicar que es por cercanía
            resetearFiltros(); // Reiniciamos los filtros visualmente

        } catch (error) {
            console.error('Error al buscar por cercanía:', error);
            mascotasContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger">Hubo un error al conectar con el servidor.</p></div>`;
        }
    };

    /**
     * Carga las mascotas por defecto (o con filtros) desde el endpoint público.
     * @param {FormData} [formData] - Opcional. Datos del formulario de filtros.
     */
    const cargarMascotasDefault = async (formData) => {
        let url = '/api/catalogo.php';

        mostrarSpinner();

        if (formData) {
            // Construimos los query params solo con los filtros que tienen valor
            const params = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
                if (value) {
                    params.append(key, value);
                }
            }
            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        try {
            const response = await fetch(url);
            const mascotas = await response.json();
            renderizarMascotas(mascotas);
        } catch (error) {
            console.error('Error al cargar mascotas:', error);
            mascotasContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger">No se pudieron cargar las mascotas. Intente más tarde.</p></div>`;
        }
    };

    // --- EVENT LISTENERS ---

    btnCompatibilidad?.addEventListener('click', cargarMascotasPorCompatibilidad);

    btnCercania?.addEventListener('click', cargarMascotasPorCercania);

    filtrosForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filtrosForm);
        cargarMascotasDefault(formData);
    });

    // Carga inicial de mascotas
    cargarMascotasDefault();
});