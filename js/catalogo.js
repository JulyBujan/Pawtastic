document.addEventListener('DOMContentLoaded', () => {
    const mascotasContainer = document.getElementById('mascotas-container');
    const btnCompatibilidad = document.getElementById('btn-compatibilidad');
    const filtrosForm = document.getElementById('filtros-form');
    const btnCercania = document.getElementById('btn-cercania');
    const catalogPagination = document.getElementById('catalogPagination');
    const catalogPrev = document.getElementById('catalogPrev');
    const catalogNext = document.getElementById('catalogNext');
    const catalogPageInfo = document.getElementById('catalogPageInfo');
    const catalogModeNotice = document.getElementById('catalogModeNotice');
    const matchFilters = document.getElementById('matchFilters');
    const matchFilterButtons = matchFilters ? Array.from(matchFilters.querySelectorAll('button[data-range]')) : [];
    const pageSize = 9;
    const urlParams = new URLSearchParams(window.location.search);
    let initialPage = parseInt(urlParams.get('page'), 10);
    let hasInitialPage = Number.isFinite(initialPage) && initialPage > 0;
    let currentPage = 1;
    let currentMascotas = [];
    let currentMode = { compatibilidad: false, cercania: false };
    let matchRange = null;
    const userType = localStorage.getItem('tipo');
    const isUser = Boolean(localStorage.getItem('token')) && userType === 'usuario';

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
    const formatEdad = (mesesTotal) => {
        const total = parseInt(mesesTotal, 10);
        if (!Number.isFinite(total) || total < 0) return '';
        if (total === 0) return 'Recién nacido';
        const anos = Math.floor(total / 12);
        const meses = total % 12;
        const partes = [];
        if (anos > 0) {
            partes.push(`${anos} año${anos === 1 ? '' : 's'}`);
        }
        if (meses > 0) {
            partes.push(`${meses} mes${meses === 1 ? '' : 'es'}`);
        }
        return partes.join(' y ');
    };

    const renderizarMascotas = (mascotas, porCompatibilidad = false, porCercania = false) => {
        const isLoggedIn = Boolean(localStorage.getItem('token'));
        mascotasContainer.innerHTML = ''; // Limpiar contenedor

        if (mascotas.length === 0) {
            mascotasContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No se encontraron mascotas que coincidan con tu búsqueda.</p></div>';
            return;
        }

        const duplicateImageGroups = {
            "mascota_698129b418a4d_perro8.jpg": "69027d273f723_beagle-adulto.jpg",
            "schnauzer-5232202_1280.jpg": "mascota_691354641c4af_schnauzer-5232202_1280.jpg",
            "mascota_697ffd82be073_havanese-dog-9486395_1280.jpg": "mascota_69790b5e06779_havanese-dog-9486395_1280.jpg",
            "mascota_6981257fb5baa_gato6.jpg": "mascota_697c08f4f1f9d_gato6.jpg",
            "mascota_6981254d67ffb_perro4.jpg": "mascota_697c0c35263b3_Amorina.jpg",
            "mascota_6981261508a45_gato5.jpg": "mascota_697c0da7794d9_gato5.jpg",
            "mascota_extra_697c1a9017c52_cat-468232_1280.jpg": "mascota_6980f32ea7fe8_cat-468232_1280.jpg",
            "mascota_69812b9279f20_Thor.jpg": "mascota_698127371de86_Thor.jpg",
            "mascota_extra_69812ae1bea86_cat-179611_1280.jpg": "mascota_69812ae1bd4e9_cat-179611_1280.jpg",
            "mascota_extra_6980f2eb3b5f9_cat-1853372_1280.jpg": "mascota_extra_697c1a0522749_cat-1853372_1280.jpg",
            "mascota_extra_6980f32ea8716_cat-1853372_1280.jpg": "mascota_extra_697c1a0522749_cat-1853372_1280.jpg",
            "mascota_extra_6980f2eb3b869_cat-5618328_1280.jpg": "mascota_extra_697c1a660f244_cat-5618328_1280.jpg",
            "mascota_extra_6980f32ea8a63_cat-5618328_1280.jpg": "mascota_extra_697c1a660f244_cat-5618328_1280.jpg"
        };

        const getImageGroupKey = (filename) => duplicateImageGroups[filename] || filename;

        const fallbackImages = {
            perro: [
                '69027d273f723_beagle-adulto.jpg',
                'mascota_6902850151c60_rhodesian-perro-adulto.jpg',
                'mascota_691354641c4af_schnauzer-5232202_1280.jpg',
                'mascota_6913748c2ed81_perro6.jpg',
                'mascota_691374e478000_perro7.jpg',
                'mascota_69137509c440d_perro1.jpg',
                'mascota_69790b5e06779_havanese-dog-9486395_1280.jpg',
                'mascota_697ffd82be073_havanese-dog-9486395_1280.jpg',
                'mascota_6980eb6111046_puppy-345334_1280.jpg',
                'mascota_6981254d67ffb_perro4.jpg',
                'mascota_698125e9d7829_perro5.jpg',
                'mascota_698129b418a4d_perro8.jpg',
                'mascota_69812b4c17837_perro3.jpg',
                'mascota_extra_697ffd82bf286_dog-9502812_1280.jpg',
                'mascota_extra_697ffd82bf4cd_dogs-9482501_1280.jpg',
                'mascota_extra_697ffd82bf6c3_dogs-9491588_1280.jpg',
                'schnauzer-5232202_1280.jpg'
            ],
            gato: [
                'cat-4098058_1280.jpg',
                'mascota_6913757bc4b24_gato2.jpg',
                'mascota_691648fe7ec85_black-cat-2680541_1280.jpg',
                'mascota_697c08f4f1f9d_gato6.jpg',
                'mascota_697c0da7794d9_gato5.jpg',
                'mascota_6980ea76d21fe_cat-9476898_1280.jpg',
                'mascota_6980f32ea7fe8_cat-468232_1280.jpg',
                'mascota_698124f18bf87_gato4.jpg',
                'mascota_6981257fb5baa_gato6.jpg',
                'mascota_6981261508a45_gato5.jpg',
                'mascota_69812ae1bd4e9_cat-179611_1280.jpg',
                'mascota_extra_697c1a0522749_cat-1853372_1280.jpg',
                'mascota_extra_697c1a660f244_cat-5618328_1280.jpg',
                'mascota_extra_697c1a9017c52_cat-468232_1280.jpg',
                'mascota_extra_6980ea76d40cd_cat-9476900_1280.jpg',
                'mascota_extra_6980ea76d43ce_cat-9476901_1280.jpg',
                'mascota_extra_6980f2eb3b5f9_cat-1853372_1280.jpg',
                'mascota_extra_6980f2eb3b869_cat-5618328_1280.jpg',
                'mascota_extra_6980f32ea8716_cat-1853372_1280.jpg',
                'mascota_extra_6980f32ea8a63_cat-5618328_1280.jpg',
                'mascota_extra_69812ae1be7ae_cat-179608_1280.jpg',
                'mascota_extra_69812ae1bea86_cat-179611_1280.jpg'
            ],
            otros: [
                'Amorina2.jpeg',
                'Tere4.jpeg',
                'mascota_697913eca493b_german-longhaired-pointer-782498_1280.jpg',
                'mascota_697c0c35263b3_Amorina.jpg',
                'mascota_698125b7b61b1_Milu.jpg',
                'mascota_698127371de86_Thor.jpg',
                'mascota_698127853f4b6_Cleo.jpg',
                'mascota_6981290594430_Balto.jpg',
                'mascota_698129397e550_Gigi.jpg',
                'mascota_698129d9e47ea_Mimi.jpg',
                'mascota_69812b71d68e3_Daisy.jpg',
                'mascota_69812b9279f20_Thor.jpg',
                'mascota_extra_6980ea76d3e09_brown-9476891_1280.jpg',
                'mascota_extra_69812ae1be026_animal-6591125_1280.jpg'
            ]
        };

        const imageCounts = (currentMascotas || []).reduce((acc, item) => {
            if (item.imagen) {
                const key = getImageGroupKey(item.imagen);
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {});

        const usedGroups = new Set(Object.keys(imageCounts));

        const createPool = (list) => {
            const uniqueGroups = new Set();
            return list.filter((name) => {
                const key = getImageGroupKey(name);
                if (usedGroups.has(key)) {
                    return false;
                }
                if (uniqueGroups.has(key)) {
                    return false;
                }
                uniqueGroups.add(key);
                return true;
            });
        };

        const pool = {
            perro: createPool(fallbackImages.perro),
            gato: createPool(fallbackImages.gato),
            otros: createPool(fallbackImages.otros)
        };

        const pickFallback = (list, seed) => {
            if (!list || list.length === 0) {
                return '/img/mascotas/default.jpg';
            }
            const index = Number.isFinite(seed)
                ? Math.abs(seed) % list.length
                : Math.floor(Math.random() * list.length);
            const [chosen] = list.splice(index, 1);
            return `/img/mascotas/${chosen}`;
        };

        const getFallbackImage = (tipo, seed) => {
            const normalized = (tipo || '').toLowerCase();
            if (normalized.includes('gato')) return pickFallback(pool.gato, seed);
            if (normalized.includes('perro')) return pickFallback(pool.perro, seed);
            return pickFallback(pool.otros, seed);
        };

        const seenImages = new Set();

        mascotas.forEach(mascota => {
            const tamanoMascota = mascota['tamaño'] || mascota.tamano;
            const edadTexto = formatEdad(mascota.edad);
            const sexoTexto = mascota.sexo || '';
            const summaryBase = [sexoTexto, edadTexto].filter(Boolean).join(', ');
            const summaryText = summaryBase
                ? `${summaryBase}${tamanoMascota ? `, <span class="pet-highlight">${tamanoMascota}</span>` : ''}.`
                : (mascota.descripcion || '');
            let descripcionModificada = summaryText;
            
            if (porCompatibilidad && mascota.compatibilidad) {
                descripcionModificada = `<strong class="text-warning">Compatibilidad: ${mascota.compatibilidad}%</strong><br>${summaryText}`;
            }

            if (porCercania && mascota.distancia_km) {
                descripcionModificada = `<strong class="text-info"><i class="bi bi-geo-alt-fill"></i> A ${mascota.distancia_km} km de ti</strong><br>${summaryText}`;
            }

            const pageQuery = `&page=${currentPage}`;
            const actionButton = isLoggedIn
                ? `<a href="detalle-mascota.html?id=${mascota.id}${pageQuery}" class="btn btn-dark btn-sm">
                      <i class="bi bi-eye me-2"></i>Ver perfil
                   </a>`
                : `<button type="button" class="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#modalLoginRequired">
                      <i class="bi bi-eye me-2"></i>Ver perfil
                   </button>`;
            const estadoValue = mascota.estado !== undefined ? parseInt(mascota.estado, 10) : 1;
            const puedePostular = isUser && estadoValue === 1;
            const postularButton = puedePostular
                ? `<button type="button" class="btn btn-outline-secondary btn-sm" data-action="postular" data-id="${mascota.id}">
                      <i class="bi bi-check2-circle me-2"></i>Postularme
                   </button>`
                : '';

            const metaItems = [];
            if (String(mascota.vacunado || '').toLowerCase() === 'si') {
                metaItems.push(`<span><i class="bi bi-shield-check"></i> Vacunado</span>`);
            }
            if (String(mascota.esterilizado || '').toLowerCase() === 'si') {
                metaItems.push(`<span><i class="bi bi-heart"></i> Esterilizado</span>`);
            }
            if (parseInt(mascota.apto_ninos, 10) === 1) {
                metaItems.push(`<span><i class="bi bi-emoji-smile"></i> Apto niños</span>`);
            }
            if (metaItems.length === 0) {
                metaItems.push(`<span><i class="bi bi-info-circle"></i> Sin datos</span>`);
            }
            const metaContent = metaItems.length ? metaItems.join('') : '<span class="pet-meta-empty">—</span>';
            const metaHtml = `<div class="pet-meta mb-3">${metaContent}</div>`;

            const mascotaSeed = parseInt(mascota.id, 10);
            const fallbackImage = getFallbackImage(mascota.tipo, mascotaSeed);
            const hasImagen = Boolean(mascota.imagen);
            const imageKey = hasImagen ? getImageGroupKey(mascota.imagen) : null;
            const isDuplicate = hasImagen && imageCounts[imageKey] > 1;
            const useOriginal = hasImagen && (!isDuplicate || !seenImages.has(imageKey));
            const imageSrc = useOriginal
                ? `/img/mascotas/${mascota.imagen}`
                : fallbackImage;

            if (useOriginal) {
                seenImages.add(imageKey);
            }

            const card = `
                <div class="col-12 col-sm-6 col-lg-4">
                    <article class="pet-card h-100">
                        <div class="pet-image">
                            <img src="${imageSrc}" class="pet-photo" alt="Foto de ${mascota.nombre}" onerror="this.onerror=null;this.src='${fallbackImage}';">
                            <span class="pet-badge status-active">Disponible</span>
                        </div>
                        <div class="card-body">
                            <h5 class="fw-bold">${mascota.nombre}</h5>
                            <p class="pet-summary mb-3">${descripcionModificada}</p>
                            ${metaHtml}
                            <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center">
                                ${actionButton}
                                ${postularButton}
                            </div>
                        </div>
                    </article>
                </div>
            `;
            mascotasContainer.insertAdjacentHTML('beforeend', card);
        });
    };

    const updatePagination = (totalItems = currentMascotas.length) => {
        if (!catalogPagination || !catalogPrev || !catalogNext || !catalogPageInfo) {
            return;
        }
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const showPagination = totalItems > pageSize;
        catalogPagination.classList.toggle('d-none', !showPagination);
        catalogPrev.disabled = currentPage <= 1;
        catalogNext.disabled = currentPage >= totalPages;
        catalogPageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    };

    const renderPage = () => {
        const visibleMascotas = getVisibleMascotas();
        const totalPages = Math.max(1, Math.ceil(visibleMascotas.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const pageItems = visibleMascotas.slice(start, start + pageSize);
        renderizarMascotas(pageItems, currentMode.compatibilidad, currentMode.cercania);
        updateModeNotice();
        updatePagination(visibleMascotas.length);
    };

    const getVisibleMascotas = () => {
        if (!currentMode.compatibilidad || !matchRange) {
            return currentMascotas;
        }

        return currentMascotas.filter((mascota) => {
            const value = parseInt(mascota.compatibilidad, 10);
            if (!Number.isFinite(value)) {
                return false;
            }
            return value >= matchRange.min && value <= matchRange.max;
        });
    };

    const setMatchRange = (rangeValue) => {
        if (!rangeValue) {
            matchRange = null;
            matchFilterButtons.forEach((btn) => btn.classList.remove('is-active'));
            return;
        }

        if (matchRange && matchRange.key === rangeValue) {
            matchRange = null;
            matchFilterButtons.forEach((btn) => btn.classList.remove('is-active'));
            return;
        }

        const [min, max] = rangeValue.split('-').map((num) => parseInt(num, 10));
        matchRange = {
            key: rangeValue,
            min: Number.isFinite(min) ? min : 0,
            max: Number.isFinite(max) ? max : 100
        };
        matchFilterButtons.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.range === rangeValue);
        });
    };

    const updateModeNotice = () => {
        if (!catalogModeNotice) return;

        if (currentMode.compatibilidad) {
            catalogModeNotice.classList.remove('d-none');
            catalogModeNotice.innerHTML = `
              <span class="catalog-mode__badge catalog-mode__badge--match">
                <i class="bi bi-heart-fill"></i> Match activo
              </span>
              <span>Ordenado por compatibilidad (de mayor a menor).</span>
              <span class="catalog-mode__note">Recomendaciones generadas por modelo predictivo.</span>
            `;
            if (matchFilters) {
                matchFilters.classList.remove('d-none');
            }
            return;
        }

        if (currentMode.cercania) {
            catalogModeNotice.classList.remove('d-none');
            catalogModeNotice.innerHTML = `
              <span class="catalog-mode__badge catalog-mode__badge--distance">
                <i class="bi bi-geo-alt-fill"></i> Cercanía activa
              </span>
              <span>Ordenado por distancia (más cercanas primero).</span>
            `;
            if (matchFilters) {
                matchFilters.classList.add('d-none');
            }
            return;
        }

        catalogModeNotice.classList.add('d-none');
        catalogModeNotice.innerHTML = '';
        if (matchFilters) {
            matchFilters.classList.add('d-none');
        }
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
            setMatchRange(null);
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
            setMatchRange(null);
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
            setMatchRange(null);
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

    matchFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-range]');
        if (!button) return;
        setMatchRange(button.dataset.range);
        currentPage = 1;
        renderPage();
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

    if (mascotasContainer) {
        mascotasContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action="postular"]');
            if (!button) return;
            event.preventDefault();
            const token = localStorage.getItem('token');
            if (!token || localStorage.getItem('tipo') !== 'usuario') {
                window.location.href = 'login.html';
                return;
            }
            const mascotaId = button.dataset.id;
            if (!mascotaId) return;

            try {
                button.disabled = true;
                const response = await fetch('/api/postular.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ id_mascota: mascotaId })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Error al postularse');
                }
                showToast(data.message, 'success');
                button.textContent = 'Postulado';
            } catch (error) {
                showToast(error.message, 'danger');
                button.disabled = false;
            }
        });
    }
});
