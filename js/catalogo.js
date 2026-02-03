document.addEventListener('DOMContentLoaded', () => {
    const mascotasContainer = document.getElementById('mascotas-container');
    const btnCompatibilidad = document.getElementById('btn-compatibilidad');
    const filtrosForm = document.getElementById('filtros-form');
    const btnCercania = document.getElementById('btn-cercania');
    const catalogPagination = document.getElementById('catalogPagination');
    const catalogPrev = document.getElementById('catalogPrev');
    const catalogNext = document.getElementById('catalogNext');
    const catalogPageInfo = document.getElementById('catalogPageInfo');
    const pageSize = 9;
    const urlParams = new URLSearchParams(window.location.search);
    let initialPage = parseInt(urlParams.get('page'), 10);
    let hasInitialPage = Number.isFinite(initialPage) && initialPage > 0;
    let currentPage = 1;
    let currentMascotas = [];
    let currentMode = { compatibilidad: false, cercania: false };

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
        const isLoggedIn = Boolean(localStorage.getItem('token'));
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

            const pageQuery = `&page=${currentPage}`;
            const actionButton = isLoggedIn
                ? `<a href="detalle-mascota.html?id=${mascota.id}${pageQuery}" class="btn btn-dark btn-sm">
                      <i class="bi bi-eye me-2"></i>Ver perfil
                   </a>`
                : `<button type="button" class="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#modalLoginRequired">
                      <i class="bi bi-eye me-2"></i>Ver perfil
                   </button>`;

            const metaItems = [];
            if (mascota.tipo) {
                metaItems.push(`<span><i class="bi bi-tag"></i> ${mascota.tipo}</span>`);
            }
            const tamanoMascota = mascota['tamaño'] || mascota.tamano;
            if (tamanoMascota) {
                metaItems.push(`<span><i class="bi bi-arrows-angle-expand"></i> ${tamanoMascota}</span>`);
            }
            if (mascota.sexo) {
                metaItems.push(`<span><i class="bi bi-gender-ambiguous"></i> ${mascota.sexo}</span>`);
            }
            const metaHtml = metaItems.length ? `<div class="pet-meta mb-3">${metaItems.join('')}</div>` : '';

            const card = `
                <div class="col-12 col-sm-6 col-lg-4">
                    <article class="pet-card h-100">
                        <div class="pet-image">
                            <img src="${mascota.imagen ? '/img/mascotas/' + mascota.imagen : '/img/mascotas/default.jpg'}" class="pet-photo" alt="Foto de ${mascota.nombre}">
                            <span class="pet-badge status-active">Disponible</span>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="fw-bold">${mascota.nombre}</h5>
                            <p class="pet-summary mb-3">${descripcionModificada}</p>
                            ${metaHtml}
                            <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center mt-auto">
                                ${actionButton}
                            </div>
                        </div>
                    </article>
                </div>
            `;
            mascotasContainer.insertAdjacentHTML('beforeend', card);
        });
    };

    const updatePagination = () => {
        if (!catalogPagination || !catalogPrev || !catalogNext || !catalogPageInfo) {
            return;
        }
        const totalPages = Math.max(1, Math.ceil(currentMascotas.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const showPagination = currentMascotas.length > pageSize;
        catalogPagination.classList.toggle('d-none', !showPagination);
        catalogPrev.disabled = currentPage <= 1;
        catalogNext.disabled = currentPage >= totalPages;
        catalogPageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    };

    const renderPage = () => {
        const start = (currentPage - 1) * pageSize;
        const pageItems = currentMascotas.slice(start, start + pageSize);
        renderizarMascotas(pageItems, currentMode.compatibilidad, currentMode.cercania);
        updatePagination();
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

            currentMascotas = Array.isArray(data) ? data : [];
            currentMode = { compatibilidad: true, cercania: false };
            currentPage = 1;
            renderPage();
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

            currentMascotas = Array.isArray(data) ? data : [];
            currentMode = { compatibilidad: false, cercania: true };
            currentPage = 1;
            renderPage();
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
            currentMascotas = Array.isArray(mascotas) ? mascotas : [];
            currentMode = { compatibilidad: false, cercania: false };
            if (hasInitialPage) {
                currentPage = initialPage;
                hasInitialPage = false;
            } else {
                currentPage = 1;
            }
            renderPage();
        } catch (error) {
            console.error('Error al cargar mascotas:', error);
            currentMascotas = [];
            currentPage = 1;
            updatePagination();
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

    const clearFiltersButton = document.getElementById('clearFilters');
    clearFiltersButton?.addEventListener('click', () => {
        resetearFiltros();
        cargarMascotasDefault();
    });

    // Carga inicial de mascotas
    cargarMascotasDefault();

    if (catalogPrev) {
        catalogPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage -= 1;
                renderPage();
            }
        });
    }

    if (catalogNext) {
        catalogNext.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(currentMascotas.length / pageSize));
            if (currentPage < totalPages) {
                currentPage += 1;
                renderPage();
            }
        });
    }
});
