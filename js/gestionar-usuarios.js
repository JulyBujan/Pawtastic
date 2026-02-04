document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-usuarios-body");
    const modalAsignarOngEl = document.getElementById('modalAsignarOng');
    const modalAsignarOng = new bootstrap.Modal(modalAsignarOngEl);
    const formAsignarOng = document.getElementById('formAsignarOng');
    const filtroInput = document.getElementById("filtro-usuarios");
    const limpiarFiltroBtn = document.getElementById("limpiarFiltro");
    const totalUsuariosEl = document.getElementById("adminUsuariosTotal");
    const activosUsuariosEl = document.getElementById("adminUsuariosActivos");
    const inactivosUsuariosEl = document.getElementById("adminUsuariosInactivos");
    const mostrandoUsuariosEl = document.getElementById("adminUsuariosMostrando");
    const paginationEl = document.getElementById("usuariosPagination");
    const paginationInfoEl = document.getElementById("usuariosPaginationInfo");
    const estadoFilterButtons = Array.from(document.querySelectorAll("[data-estado-filter]"));
    const tableColspan = 4;

    // 1. Proteger la ruta
    if (!token || tipoUsuario !== 'admin') {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let listaOngs = []; // Almacenar la lista de ONGs
    let todosLosUsuarios = []; // Almacenar la lista completa de usuarios para filtrar
    let currentPage = 1;
    const pageSize = 10;
    let lastTotalPages = 1;
    let estadoFiltro = "todos";

    const escapeHtml = (value) => {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const getInitials = (user) => {
        const nombre = `${user.nombre || ""}`.trim();
        const apellido = `${user.apellido || ""}`.trim();
        const first = nombre ? nombre[0] : "";
        const last = apellido ? apellido[0] : "";
        if (first || last) {
            return `${first}${last}`.toUpperCase();
        }
        const email = `${user.email || ""}`.trim();
        return email ? email[0].toUpperCase() : "?";
    };

    const updateResumen = (cantidadFiltrados = 0) => {
        const total = todosLosUsuarios.length;
        const activos = todosLosUsuarios.filter((user) => user.estado == 0).length;
        const inactivos = total - activos;
        if (totalUsuariosEl) totalUsuariosEl.textContent = total;
        if (activosUsuariosEl) activosUsuariosEl.textContent = activos;
        if (inactivosUsuariosEl) inactivosUsuariosEl.textContent = inactivos;
        if (mostrandoUsuariosEl) mostrandoUsuariosEl.textContent = cantidadFiltrados;
    };

    const getFilteredUsuarios = () => {
        const terminoBusqueda = filtroInput ? filtroInput.value.toLowerCase().trim() : "";
        let filtrados = [...todosLosUsuarios];
        if (terminoBusqueda) {
            filtrados = filtrados.filter((user) => {
                const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
                const email = `${user.email || ""}`.toLowerCase();
                return nombreCompleto.includes(terminoBusqueda) || email.includes(terminoBusqueda);
            });
        }
        if (estadoFiltro !== "todos") {
            filtrados = filtrados.filter((user) => {
                const activo = user.estado == 0;
                return estadoFiltro === "activos" ? activo : !activo;
            });
        }
        return filtrados;
    };

    const paginate = (lista) => {
        const totalItems = lista.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        const startIndex = (currentPage - 1) * pageSize;
        const items = lista.slice(startIndex, startIndex + pageSize);
        return { items, totalPages, totalItems, startIndex };
    };

    /**
     * Obtiene todos los usuarios y ONGs desde la API y renderiza la tabla.
     */
    const fetchUsuariosYongs = async () => {
        try {
            const response = await fetch('../api/gestionar-usuarios.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los datos.');
            }

            const data = await response.json();
            listaOngs = Array.isArray(data.ongs) ? data.ongs : []; // Guardar lista de ONGs
            const usuarios = Array.isArray(data.usuarios) ? data.usuarios : [];
            // Mostrar solo usuarios adoptantes en esta vista
            todosLosUsuarios = usuarios.filter((user) => user.tipo === 'usuario');
            renderUsuariosView();
            populateOngSelect();

        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="${tableColspan}" class="text-center text-danger">${error.message}</td></tr>`;
            updateResumen(0);
            if (paginationEl) paginationEl.innerHTML = "";
            if (paginationInfoEl) paginationInfoEl.textContent = "Sin usuarios para mostrar.";
        }
    };

    /**
     * Renderiza las filas de la tabla de usuarios.
     * @param {Array} usuarios - Array de objetos de usuario.
     */
    const renderTabla = (usuarios) => {
        if (usuarios.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="${tableColspan}" class="text-center">No se encontraron usuarios.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = usuarios.map(user => {
            const estadoBadge = user.estado == 0
                ? `<span class="admin-status-pill is-active">Activo</span>`
                : `<span class="admin-status-pill is-inactive">Inactivo</span>`;

            const accionHabilitar = user.estado == 0
                ? `<a class="dropdown-item" href="#" data-action="deshabilitar" data-id="${user.id}">Deshabilitar</a>`
                : `<a class="dropdown-item" href="#" data-action="habilitar" data-id="${user.id}">Habilitar</a>`;

            const initials = getInitials(user);
            const fullName = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Usuario";
            const email = user.email || "Sin email";
            const accionAsignarOng = user.tipo === 'ong'
                ? `<li><a class="dropdown-item" href="#" data-action="asignar-ong" data-id="${user.id}" data-nombre="${escapeHtml(fullName)}">Asignar ONG</a></li>`
                : '';

            return `
                <tr>
                    <td>${escapeHtml(user.id)}</td>
                    <td>
                        <div class="admin-user-cell">
                            <span class="admin-avatar">${escapeHtml(initials)}</span>
                            <div class="admin-user-meta">
                                <span class="admin-user-name">${escapeHtml(fullName)}</span>
                                <span class="admin-user-email">${escapeHtml(email)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${estadoBadge}</td>
                    <td class="text-center">
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-admin-action dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                Acciones
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="admin-ver-usuario.html?id=${user.id}" target="_blank">Ver Perfil</a></li>
                                ${accionAsignarOng}
                                <li><hr class="dropdown-divider"></li>
                                <li>${accionHabilitar}</li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderPagination = (totalPages, totalItems, startIndex, pageItemsCount) => {
        lastTotalPages = totalPages;
        if (!paginationEl) return;

        if (totalItems === 0) {
            paginationEl.innerHTML = "";
            if (paginationInfoEl) {
                paginationInfoEl.textContent = "Sin usuarios para mostrar.";
            }
            return;
        }

        const endIndex = startIndex + pageItemsCount;
        if (paginationInfoEl) {
            paginationInfoEl.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems}`;
        }

        const createPageItem = (label, page, disabled = false, active = false, ariaLabel = "") => {
            const safeLabel = ariaLabel ? ` aria-label="${ariaLabel}"` : "";
            return `
                <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                    <a class="page-link" href="#" data-page="${page}"${safeLabel}>${label}</a>
                </li>
            `;
        };

        let pages = [];
        if (totalPages <= 7) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            pages.push(1);
            if (currentPage > 3) {
                pages.push("ellipsis-left");
            }
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let page = start; page <= end; page += 1) {
                pages.push(page);
            }
            if (currentPage < totalPages - 2) {
                pages.push("ellipsis-right");
            }
            pages.push(totalPages);
        }

        const itemsHtml = [];
        itemsHtml.push(
            createPageItem("&laquo;", currentPage - 1, currentPage === 1, false, "Página anterior")
        );

        pages.forEach((page) => {
            if (typeof page === "string" && page.startsWith("ellipsis")) {
                itemsHtml.push(`
                    <li class="page-item disabled">
                        <span class="page-link">…</span>
                    </li>
                `);
                return;
            }
            itemsHtml.push(
                createPageItem(page, page, false, page === currentPage, `Página ${page}`)
            );
        });

        itemsHtml.push(
            createPageItem("&raquo;", currentPage + 1, currentPage === totalPages, false, "Página siguiente")
        );

        paginationEl.innerHTML = itemsHtml.join("");
    };

    const renderUsuariosView = () => {
        const filtrados = getFilteredUsuarios();
        updateResumen(filtrados.length);
        const { items, totalPages, totalItems, startIndex } = paginate(filtrados);
        renderTabla(items);
        renderPagination(totalPages, totalItems, startIndex, items.length);
    };

    /**
     * Rellena el select del modal con la lista de ONGs.
     */
    const populateOngSelect = () => {
        const selectOng = document.getElementById('selectOng');
        selectOng.innerHTML = '<option value="">Seleccione una ONG</option>';
        selectOng.innerHTML += listaOngs.map(ong => `<option value="${ong.id}">${ong.nombre}</option>`).join('');
    };

    /**
     * Maneja las acciones de la tabla (habilitar, deshabilitar, asignar).
     * @param {string} action - La acción a realizar.
     * @param {number} userId - El ID del usuario.
     */
    const handleUserAction = async (action, userId) => {
        try {
            const response = await fetch('../api/gestionar-usuarios.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, user_id: userId })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'success');
            fetchUsuariosYongs(); // Recargar la tabla

        } catch (error) {
            showToast(error.message, 'danger');
        }
    };

    // Event listener para los botones de acción usando delegación
    tablaBody.addEventListener('click', (e) => {
        if (e.target.matches('[data-action]')) {
            e.preventDefault();
            const action = e.target.dataset.action;
            const userId = e.target.dataset.id;

            if (action === 'asignar-ong') {
                document.getElementById('usuarioIdParaAsignar').value = userId;
                document.getElementById('nombreUsuarioParaAsignar').textContent = e.target.dataset.nombre;
                modalAsignarOng.show();
            } else {
                handleUserAction(action, userId);
            }
        }
    });

    // Event listener para el formulario del modal
    formAsignarOng.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('usuarioIdParaAsignar').value;
        const ongId = document.getElementById('selectOng').value;

        if (!ongId) {
            showToast("Por favor, seleccione una ONG.", "warning");
            return;
        }

        try {
            const response = await fetch('../api/gestionar-usuarios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'asignar-ong', user_id: userId, ong_id: ongId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showToast(result.message, 'success');
            modalAsignarOng.hide();
            fetchUsuariosYongs();
        } catch (error) {
            showToast(error.message, 'danger');
        }
    });

    // Event listener para el campo de búsqueda
    filtroInput.addEventListener('input', () => {
        currentPage = 1;
        renderUsuariosView();
    });

    if (limpiarFiltroBtn) {
        limpiarFiltroBtn.addEventListener("click", () => {
            if (filtroInput) {
                filtroInput.value = "";
            }
            estadoFiltro = "todos";
            estadoFilterButtons.forEach((btn) => {
                btn.classList.toggle("is-active", btn.dataset.estadoFilter === "todos");
            });
            currentPage = 1;
            renderUsuariosView();
        });
    }

    if (estadoFilterButtons.length > 0) {
        estadoFilterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const nextFilter = button.dataset.estadoFilter || "todos";
                estadoFiltro = nextFilter;
                estadoFilterButtons.forEach((btn) => {
                    btn.classList.toggle("is-active", btn === button);
                });
                currentPage = 1;
                renderUsuariosView();
            });
        });
    }

    if (paginationEl) {
        paginationEl.addEventListener("click", (event) => {
            const link = event.target.closest("[data-page]");
            if (!link) return;
            event.preventDefault();
            const nextPage = parseInt(link.dataset.page, 10);
            if (Number.isNaN(nextPage)) return;
            if (nextPage < 1 || nextPage > lastTotalPages) return;
            currentPage = nextPage;
            renderUsuariosView();
        });
    }

    document.addEventListener("shown.bs.dropdown", (event) => {
        const row = event.target ? event.target.closest("tr") : null;
        if (row) {
            row.classList.add("is-dropdown-open");
        }
    });

    document.addEventListener("hidden.bs.dropdown", (event) => {
        const row = event.target ? event.target.closest("tr") : null;
        if (row) {
            row.classList.remove("is-dropdown-open");
        }
    });

    // Carga inicial de datos
    fetchUsuariosYongs();
});
