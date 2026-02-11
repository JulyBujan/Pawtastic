document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-vacunas-body");
    const modalVacunaEl = document.getElementById('modalVacuna');
    const modalVacuna = new bootstrap.Modal(modalVacunaEl);
    const formVacuna = document.getElementById('form-vacuna');
    const modalLabel = document.getElementById('modalVacunaLabel');
    const filtroInput = document.getElementById("filtro-vacunas");
    const limpiarFiltroBtn = document.getElementById("limpiarFiltroVacunas");
    const totalVacunasEl = document.getElementById("adminVacunasTotal");
    const vacunasPerroEl = document.getElementById("adminVacunasPerro");
    const vacunasGatoEl = document.getElementById("adminVacunasGato");
    const vacunasMostrandoEl = document.getElementById("adminVacunasMostrando");
    const paginationEl = document.getElementById("vacunasPagination");
    const paginationInfoEl = document.getElementById("vacunasPaginationInfo");
    const tipoFilterButtons = Array.from(document.querySelectorAll("[data-tipo-filter]"));
    const submitVacunaBtn = document.getElementById("submitVacuna");
    const confirmDeleteModalEl = document.getElementById("modalConfirmVacunaDelete");
    const confirmDeleteBody = document.getElementById("modalConfirmVacunaDeleteBody");
    const confirmDeleteBtn = document.getElementById("modalConfirmVacunaDeleteBtn");
    const confirmDeleteModal = confirmDeleteModalEl ? new bootstrap.Modal(confirmDeleteModalEl) : null;

    if (!token || tipoUsuario !== 'admin') {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let allVacunas = [];
    let currentPage = 1;
    let pageSize = 10;
    let lastTotalPages = 1;
    let tipoFiltro = "todos";
    let pendingDeleteVacunaId = null;

    const escapeHtml = (value) => {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const formatTipo = (tipo) => {
        const normalized = `${tipo || ""}`.toLowerCase();
        if (normalized === "perro") return { label: "Perro", className: "is-perro" };
        if (normalized === "gato") return { label: "Gato", className: "is-gato" };
        return { label: "N/D", className: "" };
    };

    const updateResumen = (mostrando = 0) => {
        const total = allVacunas.length;
        const perros = allVacunas.filter((v) => `${v.tipo}`.toLowerCase() === "perro").length;
        const gatos = allVacunas.filter((v) => `${v.tipo}`.toLowerCase() === "gato").length;
        if (totalVacunasEl) totalVacunasEl.textContent = total;
        if (vacunasPerroEl) vacunasPerroEl.textContent = perros;
        if (vacunasGatoEl) vacunasGatoEl.textContent = gatos;
        if (vacunasMostrandoEl) vacunasMostrandoEl.textContent = mostrando;
    };

    const deleteVacuna = async (vacunaId) => {
        const response = await fetch(`../api/gestionar-vacunas.php?id=${vacunaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message, 'success');
        fetchVacunas();
    };

    const openDeleteConfirm = (vacunaId) => {
        if (!confirmDeleteModal || !confirmDeleteBtn) {
            deleteVacuna(vacunaId).catch((error) => {
                showToast(error.message, 'danger');
            });
            return;
        }
        if (confirmDeleteBody) {
            confirmDeleteBody.textContent = `¿Estás seguro de que quieres eliminar la vacuna con ID ${vacunaId}?`;
        }
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Eliminar";
        pendingDeleteVacunaId = vacunaId;
        confirmDeleteModal.show();
    };

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            if (!pendingDeleteVacunaId) return;
            const vacunaId = pendingDeleteVacunaId;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = "Eliminando...";
            try {
                await deleteVacuna(vacunaId);
                confirmDeleteModal?.hide();
            } catch (error) {
                showToast(error.message, 'danger');
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = "Eliminar";
            } finally {
                pendingDeleteVacunaId = null;
            }
        });
    }

    if (confirmDeleteModalEl) {
        confirmDeleteModalEl.addEventListener("hidden.bs.modal", () => {
            pendingDeleteVacunaId = null;
            if (confirmDeleteBtn) {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = "Eliminar";
            }
        });
    }

    const getFilteredVacunas = () => {
        const terminoBusqueda = filtroInput ? filtroInput.value.toLowerCase().trim() : "";
        let filtradas = [...allVacunas];
        if (terminoBusqueda) {
            filtradas = filtradas.filter((vacuna) => {
                const nombre = `${vacuna.nombre || ""}`.toLowerCase();
                const descripcion = `${vacuna.descripcion || ""}`.toLowerCase();
                return nombre.includes(terminoBusqueda) || descripcion.includes(terminoBusqueda);
            });
        }
        if (tipoFiltro !== "todos") {
            filtradas = filtradas.filter((vacuna) => `${vacuna.tipo}`.toLowerCase() === tipoFiltro);
        }
        return filtradas;
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

    const renderPagination = (totalPages, totalItems, startIndex, pageItemsCount) => {
        lastTotalPages = totalPages;
        if (!paginationEl) return;

        if (totalItems === 0) {
            paginationEl.innerHTML = "";
            if (paginationInfoEl) {
                paginationInfoEl.textContent = "Sin vacunas para mostrar.";
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

    const renderTabla = (vacunas) => {
        if (!tablaBody) return;
        tablaBody.innerHTML = '';
        if (vacunas.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay vacunas registradas.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = vacunas.map((vacuna) => {
            const tipoInfo = formatTipo(vacuna.tipo);
            return `
                <tr>
                    <td>${escapeHtml(vacuna.id_vacuna)}</td>
                    <td>
                        <div class="admin-vaccine-cell">
                          <span class="admin-vaccine-name">${escapeHtml(vacuna.nombre)}</span>
                          <span class="admin-vaccine-desc">${escapeHtml(vacuna.descripcion || "Sin descripción")}</span>
                        </div>
                    </td>
                    <td><span class="admin-status-pill ${tipoInfo.className}">${tipoInfo.label}</span></td>
                    <td class="text-center">
                        <div class="admin-action-buttons">
                          <button class="btn btn-sm btn-admin-action btn-editar" data-id="${vacuna.id_vacuna}">
                            <i class="bi bi-pencil"></i> Editar
                          </button>
                          <button class="btn btn-sm btn-admin-ghost btn-eliminar" data-id="${vacuna.id_vacuna}">
                            <i class="bi bi-trash"></i> Eliminar
                          </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderVacunasView = () => {
        const filtradas = getFilteredVacunas();
        updateResumen(filtradas.length);
        const { items, totalPages, totalItems, startIndex } = paginate(filtradas);
        renderTabla(items);
        renderPagination(totalPages, totalItems, startIndex, items.length);
    };

    const fetchVacunas = async () => {
        try {
            const response = await fetch('../api/gestionar-vacunas.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudieron cargar las vacunas.');
            }
            
            allVacunas = await response.json();
            pageSize = Math.max(1, Math.ceil(allVacunas.length / 2));
            renderVacunasView();
        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${error.message}</td></tr>`;
            updateResumen(0);
            if (paginationEl) paginationEl.innerHTML = "";
            if (paginationInfoEl) paginationInfoEl.textContent = "Sin vacunas para mostrar.";
        }
    };

    formVacuna.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vacunaId = document.getElementById('vacuna-id').value;
        const data = {
            nombre: document.getElementById('vacuna-nombre').value,
            tipo: document.getElementById('vacuna-tipo').value,
            descripcion: document.getElementById('vacuna-descripcion').value,
        };
        if (vacunaId) data.id_vacuna = vacunaId;

        try {
            if (submitVacunaBtn) {
                submitVacunaBtn.disabled = true;
                submitVacunaBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            }

            const response = await fetch('../api/gestionar-vacunas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'success');
            modalVacuna.hide();
            fetchVacunas();
        } catch (error) {
            showToast(error.message, 'danger');
        } finally {
            if (submitVacunaBtn) {
                submitVacunaBtn.disabled = false;
                submitVacunaBtn.textContent = 'Guardar';
            }
        }
    });

    tablaBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const vacunaId = target.dataset.id;

        if (target.classList.contains('btn-editar')) {
            const vacuna = allVacunas.find(v => v.id_vacuna == vacunaId);
            if (vacuna) {
                modalLabel.textContent = 'Editar Vacuna';
                document.getElementById('vacuna-id').value = vacuna.id_vacuna;
                document.getElementById('vacuna-nombre').value = vacuna.nombre;
                document.getElementById('vacuna-tipo').value = vacuna.tipo;
                document.getElementById('vacuna-descripcion').value = vacuna.descripcion || '';
                modalVacuna.show();
            }
        }

        if (target.classList.contains('btn-eliminar')) {
            openDeleteConfirm(vacunaId);
        }
    });

    document.getElementById('btn-crear-vacuna').addEventListener('click', () => {
        modalLabel.textContent = 'Crear Nueva Vacuna';
        formVacuna.reset();
        document.getElementById('vacuna-id').value = '';
    });

    if (filtroInput) {
        filtroInput.addEventListener('input', () => {
            currentPage = 1;
            renderVacunasView();
        });
    }

    if (limpiarFiltroBtn) {
        limpiarFiltroBtn.addEventListener('click', () => {
            if (filtroInput) filtroInput.value = "";
            tipoFiltro = "todos";
            tipoFilterButtons.forEach((btn) => {
                btn.classList.toggle("is-active", btn.dataset.tipoFilter === "todos");
            });
            currentPage = 1;
            renderVacunasView();
        });
    }

    if (tipoFilterButtons.length > 0) {
        tipoFilterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                tipoFiltro = button.dataset.tipoFilter || "todos";
                tipoFilterButtons.forEach((btn) => {
                    btn.classList.toggle("is-active", btn === button);
                });
                currentPage = 1;
                renderVacunasView();
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
            renderVacunasView();
        });
    }

    fetchVacunas();
});
