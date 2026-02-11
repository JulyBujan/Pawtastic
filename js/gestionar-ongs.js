document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-ongs-body");
    const filtroInput = document.getElementById("filtro-ongs");
    const limpiarFiltroBtn = document.getElementById("limpiarFiltroOngs");
    const paginationInfoEl = document.getElementById("ongsPaginationInfo");
    const estadoFilterButtons = Array.from(document.querySelectorAll("[data-estado-filter]"));
    const totalOngsEl = document.getElementById("adminOngsTotal");
    const pendientesOngsEl = document.getElementById("adminOngsPendientes");
    const aprobadasOngsEl = document.getElementById("adminOngsAprobadas");
    const rechazadasOngsEl = document.getElementById("adminOngsRechazadas");
    const preexistentesOngsEl = document.getElementById("adminOngsPreexistentes");
    const modalRegistrarOngEl = document.getElementById("modalRegistrarOng");
    const formRegistroOng = document.getElementById("formRegistroOngAdmin");
    const submitRegistroBtn = document.getElementById("submitRegistrarOng");
    const modalRegistrarOng = modalRegistrarOngEl ? new bootstrap.Modal(modalRegistrarOngEl) : null;
    const modalDocsOngEl = document.getElementById("modalSubirDocsOng");
    const formDocsOng = document.getElementById("formSubirDocsOng");
    const submitDocsBtn = document.getElementById("submitDocsOng");
    const modalDocsOng = modalDocsOngEl ? new bootstrap.Modal(modalDocsOngEl) : null;
    const docsOngIdInput = document.getElementById("docs-ong-id");
    const docsOngNombreEl = document.getElementById("docs-ong-nombre");
    const confirmActionModalEl = document.getElementById("modalConfirmOngAction");
    const confirmActionTitle = document.getElementById("modalConfirmOngActionTitle");
    const confirmActionBody = document.getElementById("modalConfirmOngActionBody");
    const confirmActionBtn = document.getElementById("modalConfirmOngActionBtn");
    const confirmActionModal = confirmActionModalEl ? new bootstrap.Modal(confirmActionModalEl) : null;

    if (!token || tipoUsuario !== "admin") {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let todasLasOngs = [];
    let estadoFiltro = "todos";
    let isSubmitting = false;
    let isUploadingDocs = false;
    let pendingSolicitudAction = null;

    const escapeHtml = (value) => {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const getInitials = (name) => {
        if (!name) return "ONG";
        const parts = name.split(" ").filter(Boolean);
        const initials = parts.slice(0, 2).map(part => part[0]).join("");
        return initials ? initials.toUpperCase() : "ONG";
    };

    const getEstadoInfo = (ong) => {
        const raw = ong.estado;
        if (raw === null || raw === undefined || raw === "") {
            return { key: "preexistente", label: "Pre-existente", className: "is-preexistente" };
        }
        const parsed = parseInt(raw, 10);
        switch (parsed) {
            case 0:
                return { key: "pendiente", label: "Pendiente", className: "is-pending" };
            case 1:
                return { key: "aprobado", label: "Aprobado", className: "is-approved" };
            case 2:
                return { key: "rechazado", label: "Rechazado", className: "is-rejected" };
            default:
                return { key: "preexistente", label: "Pre-existente", className: "is-preexistente" };
        }
    };

    const updateResumen = () => {
        const counts = {
            total: todasLasOngs.length,
            pendiente: 0,
            aprobado: 0,
            rechazado: 0,
            preexistente: 0
        };

        todasLasOngs.forEach((ong) => {
            const estado = getEstadoInfo(ong).key;
            if (counts[estado] !== undefined) {
                counts[estado] += 1;
            }
        });

        if (totalOngsEl) totalOngsEl.textContent = counts.total;
        if (pendientesOngsEl) pendientesOngsEl.textContent = counts.pendiente;
        if (aprobadasOngsEl) aprobadasOngsEl.textContent = counts.aprobado;
        if (rechazadasOngsEl) rechazadasOngsEl.textContent = counts.rechazado;
        if (preexistentesOngsEl) preexistentesOngsEl.textContent = counts.preexistente;
    };

    const getFilteredOngs = () => {
        const terminoBusqueda = filtroInput ? filtroInput.value.toLowerCase().trim() : "";
        let filtradas = [...todasLasOngs];

        if (terminoBusqueda) {
            filtradas = filtradas.filter((ong) => {
                const nombre = `${ong.nombre || ""}`.toLowerCase();
                const razon = `${ong.razon_social || ""}`.toLowerCase();
                const cuit = `${ong.cuit || ""}`.toLowerCase();
                return nombre.includes(terminoBusqueda) || razon.includes(terminoBusqueda) || cuit.includes(terminoBusqueda);
            });
        }

        if (estadoFiltro !== "todos") {
            filtradas = filtradas.filter((ong) => getEstadoInfo(ong).key === estadoFiltro);
        }

        return filtradas;
    };

    const renderTabla = (ongs) => {
        if (!tablaBody) return;

        if (ongs.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay ONGs para mostrar.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = ongs.map((ong) => {
            const estadoInfo = getEstadoInfo(ong);
            const estadoHtml = `<span class="admin-status-pill ${estadoInfo.className}">${estadoInfo.label}</span>`;

            const nombre = ong.nombre || "Sin nombre";
            const razon = ong.razon_social || "Sin razón social";
            const cuit = ong.cuit || "Sin CUIT";
            const initials = getInitials(nombre);

            const docs = [];
            if (ong.url_estatuto) {
                docs.push(`<a href="../${escapeHtml(ong.url_estatuto)}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Estatuto Social"><i class="bi bi-file-earmark-text"></i></a>`);
            }
            if (ong.url_cuit) {
                docs.push(`<a href="../${escapeHtml(ong.url_cuit)}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Constancia de CUIT"><i class="bi bi-file-earmark-text"></i></a>`);
            }
            if (ong.url_acta) {
                docs.push(`<a href="../${escapeHtml(ong.url_acta)}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Acta de Autoridades"><i class="bi bi-file-earmark-text"></i></a>`);
            }

            const hasDocs = docs.length > 0;
            const docsButtonText = hasDocs ? "Actualizar docs" : "Subir docs";
            const docsContent = hasDocs ? docs.join("") : '<span class="admin-empty">Sin documentación</span>';
            const documentosHtml = `
                <div class="admin-docs">
                  ${docsContent}
                  <button type="button" class="btn btn-sm btn-admin-ghost btn-subir-docs" data-id="${ong.id}"
                    data-nombre="${escapeHtml(nombre)}">${docsButtonText}</button>
                </div>
            `;

            let accionesHtml = '<span class="admin-empty">Sin acciones</span>';
            if (estadoInfo.key === "pendiente") {
                accionesHtml = `
                    <div class="admin-action-buttons">
                      <button class="btn btn-sm btn-admin-approve btn-aprobar" data-id="${ong.id}"><i class="bi bi-check-lg"></i> Aprobar</button>
                      <button class="btn btn-sm btn-admin-reject btn-rechazar" data-id="${ong.id}"><i class="bi bi-x-lg"></i> Rechazar</button>
                    </div>
                `;
            }

            return `
                <tr>
                    <td>${escapeHtml(ong.id)}</td>
                    <td>
                      <div class="admin-entity-cell">
                        <span class="admin-entity-avatar">${escapeHtml(initials)}</span>
                        <div class="admin-entity-meta">
                          <span class="admin-entity-name">${escapeHtml(nombre)}</span>
                          <span class="admin-entity-sub">${escapeHtml(razon)}</span>
                          <span class="admin-entity-sub">${escapeHtml(cuit)}</span>
                        </div>
                      </div>
                    </td>
                    <td>${estadoHtml}</td>
                    <td class="text-center">${documentosHtml}</td>
                    <td class="text-center">${accionesHtml}</td>
                </tr>
            `;
        }).join("");
    };

    const renderOngsView = () => {
        const filtradas = getFilteredOngs();
        updateResumen();
        renderTabla(filtradas);
        if (paginationInfoEl) {
            paginationInfoEl.textContent = `Mostrando ${filtradas.length} de ${todasLasOngs.length}`;
        }
    };

    const fetchOngs = async () => {
        try {
            const response = await fetch("../api/gestionar-ongs.php", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("No se pudieron cargar las ONGs.");

            const ongs = await response.json();
            todasLasOngs = Array.isArray(ongs) ? ongs : [];
            renderOngsView();
        } catch (error) {
            if (tablaBody) {
                tablaBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
            }
            if (paginationInfoEl) {
                paginationInfoEl.textContent = "Sin ONGs para mostrar.";
            }
            updateResumen();
        }
    };

    const validarFormularioRegistro = () => {
        let esValido = true;
        const camposRequeridos = [
            "admin-ong-nombre",
            "admin-ong-razon-social",
            "admin-ong-cuit",
            "admin-ong-fecha-constitucion",
            "admin-ong-calle",
            "admin-ong-numero",
            "admin-ong-localidad"
        ];
        const archivosRequeridos = [
            "admin-ong-estatuto",
            "admin-ong-constancia-cuit",
            "admin-ong-acta-autoridades"
        ];

        camposRequeridos.forEach((id) => {
            const campo = document.getElementById(id);
            if (!campo || !campo.value.trim()) {
                campo?.classList.add("is-invalid");
                esValido = false;
            } else {
                campo.classList.remove("is-invalid");
            }
        });

        archivosRequeridos.forEach((id) => {
            const campo = document.getElementById(id);
            if (!campo || !campo.files || campo.files.length === 0) {
                campo?.classList.add("is-invalid");
                esValido = false;
            } else {
                campo.classList.remove("is-invalid");
            }
        });

        if (!esValido) {
            showToast("Por favor, completa todos los campos requeridos.", "warning");
        }

        return esValido;
    };

    const handleRegistroOngSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        if (!validarFormularioRegistro()) return;

        const formData = new FormData();
        formData.append("nombre", document.getElementById("admin-ong-nombre").value);
        formData.append("razon_social", document.getElementById("admin-ong-razon-social").value);
        formData.append("cuit", document.getElementById("admin-ong-cuit").value);
        formData.append("fecha_constitucion", document.getElementById("admin-ong-fecha-constitucion").value);
        formData.append("calle", document.getElementById("admin-ong-calle").value);
        formData.append("numero", document.getElementById("admin-ong-numero").value);
        formData.append("localidad", document.getElementById("admin-ong-localidad").value);
        const barrioEl = document.getElementById("admin-ong-barrio");
        formData.append("barrio", barrioEl ? barrioEl.value : "");

        formData.append("estatuto", document.getElementById("admin-ong-estatuto").files[0]);
        formData.append("constancia_cuit", document.getElementById("admin-ong-constancia-cuit").files[0]);
        formData.append("acta_autoridades", document.getElementById("admin-ong-acta-autoridades").files[0]);

        const logoFile = document.getElementById("admin-ong-logo").files[0];
        if (logoFile) {
            formData.append("logo", logoFile);
        }

        try {
            isSubmitting = true;
            if (submitRegistroBtn) {
                submitRegistroBtn.disabled = true;
                submitRegistroBtn.innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Registrando...";
            }

            const response = await fetch("../api/registro-ong.php", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Ocurrió un error al registrar la ONG.");
            }

            showToast(result.message || "ONG registrada correctamente.", "success");
            formRegistroOng?.reset();
            modalRegistrarOng?.hide();
            fetchOngs();
        } catch (error) {
            showToast(error.message || "No se pudo registrar la ONG.", "danger");
        } finally {
            isSubmitting = false;
            if (submitRegistroBtn) {
                submitRegistroBtn.disabled = false;
                submitRegistroBtn.textContent = "Registrar ONG";
            }
        }
    };

    const resetDocsModal = () => {
        if (docsOngIdInput) docsOngIdInput.value = "";
        if (docsOngNombreEl) docsOngNombreEl.textContent = "—";
        formDocsOng?.reset();
    };

    const handleDocsSubmit = async (event) => {
        event.preventDefault();
        if (isUploadingDocs) return;
        if (!docsOngIdInput || !docsOngIdInput.value) {
            showToast("Falta la ONG seleccionada.", "warning");
            return;
        }

        const estatuto = document.getElementById("docs-ong-estatuto");
        const cuit = document.getElementById("docs-ong-constancia-cuit");
        const acta = document.getElementById("docs-ong-acta-autoridades");

        if (!estatuto?.files.length || !cuit?.files.length || !acta?.files.length) {
            showToast("Por favor, subí los tres documentos requeridos.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("ong_id", docsOngIdInput.value);
        formData.append("estatuto", estatuto.files[0]);
        formData.append("constancia_cuit", cuit.files[0]);
        formData.append("acta_autoridades", acta.files[0]);

        try {
            isUploadingDocs = true;
            if (submitDocsBtn) {
                submitDocsBtn.disabled = true;
                submitDocsBtn.innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Subiendo...";
            }

            const response = await fetch("../api/subir-documentos-ong.php", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "No se pudieron subir los documentos.");
            }

            showToast(result.message || "Documentación actualizada.", "success");
            modalDocsOng?.hide();
            resetDocsModal();
            fetchOngs();
        } catch (error) {
            showToast(error.message || "No se pudieron subir los documentos.", "danger");
        } finally {
            isUploadingDocs = false;
            if (submitDocsBtn) {
                submitDocsBtn.disabled = false;
                submitDocsBtn.textContent = "Guardar documentos";
            }
        }
    };

    const handleSolicitudAction = async (ongId, action) => {
        try {
            const response = await fetch("../api/gestionar-ongs.php", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ong_id: ongId, action: action })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, "success");
            fetchOngs();
        } catch (error) {
            showToast(error.message, "danger");
        }
    };

    const openConfirmSolicitud = (ongId, action) => {
        if (!confirmActionModal || !confirmActionBtn) {
            handleSolicitudAction(ongId, action);
            return;
        }

        const isApprove = action === "aprobar";
        if (confirmActionTitle) {
            confirmActionTitle.textContent = isApprove ? "Confirmar aprobación" : "Confirmar rechazo";
        }
        if (confirmActionBody) {
            confirmActionBody.textContent = isApprove
                ? `¿Estás seguro de que quieres APROBAR la solicitud de la ONG con ID ${ongId}?`
                : `¿Estás seguro de que quieres RECHAZAR la solicitud de la ONG con ID ${ongId}?`;
        }
        confirmActionBtn.classList.remove("btn-success", "btn-danger");
        confirmActionBtn.classList.add(isApprove ? "btn-success" : "btn-danger");
        confirmActionBtn.textContent = isApprove ? "Aprobar" : "Rechazar";
        confirmActionBtn.disabled = false;
        pendingSolicitudAction = { ongId, action };
        confirmActionModal.show();
    };

    if (confirmActionBtn) {
        confirmActionBtn.addEventListener("click", async () => {
            if (!pendingSolicitudAction) return;
            const { ongId, action } = pendingSolicitudAction;
            confirmActionBtn.disabled = true;
            confirmActionBtn.textContent = "Procesando...";
            await handleSolicitudAction(ongId, action);
            confirmActionBtn.disabled = false;
            pendingSolicitudAction = null;
            confirmActionModal?.hide();
        });
    }

    if (confirmActionModalEl) {
        confirmActionModalEl.addEventListener("hidden.bs.modal", () => {
            pendingSolicitudAction = null;
            if (confirmActionBtn) {
                confirmActionBtn.disabled = false;
            }
        });
    }

    if (tablaBody) {
        tablaBody.addEventListener("click", (e) => {
            const aprobarBtn = e.target.closest(".btn-aprobar");
            const rechazarBtn = e.target.closest(".btn-rechazar");
            const subirDocsBtn = e.target.closest(".btn-subir-docs");

            if (aprobarBtn) {
                const ongId = aprobarBtn.dataset.id;
                openConfirmSolicitud(ongId, "aprobar");
            }

            if (rechazarBtn) {
                const ongId = rechazarBtn.dataset.id;
                openConfirmSolicitud(ongId, "rechazar");
            }

            if (subirDocsBtn) {
                const ongId = subirDocsBtn.dataset.id;
                const ongNombre = subirDocsBtn.dataset.nombre || "ONG";
                if (docsOngIdInput) docsOngIdInput.value = ongId;
                if (docsOngNombreEl) docsOngNombreEl.textContent = ongNombre;
                modalDocsOng?.show();
            }
        });
    }

    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            renderOngsView();
        });
    }

    if (limpiarFiltroBtn) {
        limpiarFiltroBtn.addEventListener("click", () => {
            if (filtroInput) filtroInput.value = "";
            estadoFiltro = "todos";
            estadoFilterButtons.forEach((btn) => {
                btn.classList.toggle("is-active", btn.dataset.estadoFilter === "todos");
            });
            renderOngsView();
        });
    }

    if (estadoFilterButtons.length > 0) {
        estadoFilterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                estadoFiltro = button.dataset.estadoFilter || "todos";
                estadoFilterButtons.forEach((btn) => {
                    btn.classList.toggle("is-active", btn === button);
                });
                renderOngsView();
            });
        });
    }

    if (formRegistroOng) {
        formRegistroOng.addEventListener("submit", handleRegistroOngSubmit);
    }

    if (formDocsOng) {
        formDocsOng.addEventListener("submit", handleDocsSubmit);
    }

    if (modalDocsOngEl) {
        modalDocsOngEl.addEventListener("hidden.bs.modal", () => {
            resetDocsModal();
        });
    }

    fetchOngs();
});
