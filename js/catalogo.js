document.addEventListener('DOMContentLoaded', () => {
    const mascotasContainer = document.getElementById('mascotas-container');
    const btnCompatibilidad = document.getElementById('btn-compatibilidad');
    const filtrosForm = document.getElementById('filtros-form');

    // --- FUNCIONES ---

    /**
     * Muestra una alerta o mensaje en la UI.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - El tipo de alerta (e.g., 'danger', 'warning', 'success').
     */
    const showAlert = (message, type = 'warning') => {
        const alertWrapper = document.createElement('div');
        alertWrapper.classList.add('col-12');
        alertWrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
            </div>
        `;

        mascotasContainer.prepend(alertWrapper);

        setTimeout(() => {
            // Usamos una transición suave para remover la alerta
            const alertElement = alertWrapper.querySelector('.alert');
            alertElement?.classList.remove('show');
            alertWrapper.addEventListener('transitionend', () => alertWrapper.remove());
        }, 3000); // La alerta desaparecerá después de 3 segundos
    };

    /**
     * Renderiza las tarjetas de mascotas en el contenedor.
     * @param {Array} mascotas - El array de objetos de mascotas.
     * @param {boolean} porCompatibilidad - Flag para saber si se debe mostrar la compatibilidad.
     */
    const renderizarMascotas = (mascotas, porCompatibilidad = false) => {
        mascotasContainer.innerHTML = ''; // Limpiar contenedor

        if (mascotas.length === 0) {
            showAlert('No se encontraron mascotas con los criterios seleccionados.', 'info');
            return;
        }

        mascotas.forEach(mascota => {
            let descripcionModificada = mascota.descripcion;
            // Si es por compatibilidad, añadimos el porcentaje al inicio de la descripción
            if (porCompatibilidad && mascota.compatibilidad) {
                descripcionModificada = `<strong class="text-warning">Compatibilidad: ${mascota.compatibilidad}%</strong><br>${mascota.descripcion}`;
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
            showAlert('Debes <a href="login.html">iniciar sesión</a> para usar esta función.', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/get_compatibilidad.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                showAlert(data.message, 'danger');
                return;
            }

            renderizarMascotas(data, true); // true para indicar que es por compatibilidad

        } catch (error) {
            console.error('Error al buscar por compatibilidad:', error);
            showAlert('Hubo un error al conectar con el servidor.', 'danger');
        }
    };

    /**
     * Carga las mascotas por defecto (o con filtros) desde el endpoint público.
     * @param {FormData} [formData] - Opcional. Datos del formulario de filtros.
     */
    const cargarMascotasDefault = async (formData) => {
        let url = '/api/catalogo.php';

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
            showAlert('No se pudieron cargar las mascotas. Intente más tarde.', 'danger');
        }
    };

    // --- EVENT LISTENERS ---

    btnCompatibilidad?.addEventListener('click', cargarMascotasPorCompatibilidad);

    filtrosForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filtrosForm);
        cargarMascotasDefault(formData);
    });

    // Carga inicial de mascotas
    cargarMascotasDefault();
});