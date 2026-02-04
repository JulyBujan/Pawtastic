document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-mascotas-archivadas-body");
    const filtroInput = document.getElementById("filtro-mascotas-archivadas");
    const limpiarFiltroBtn = document.getElementById("limpiarFiltroMascotas");
    const totalEl = document.getElementById("adminMascotasArchivadasTotal");
    const ongsEl = document.getElementById("adminMascotasArchivadasOngs");
    const mostrandoEl = document.getElementById("adminMascotasArchivadasMostrando");
    const infoEl = document.getElementById("mascotasArchivadasInfo");

    if (!token || tipoUsuario !== "admin") {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let todasLasMascotas = [];

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
        if (!name) return "M";
        const parts = name.split(" ").filter(Boolean);
        const initials = parts.slice(0, 2).map(part => part[0]).join("");
        return initials ? initials.toUpperCase() : "M";
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const updateResumen = (mostrando = 0) => {
        const total = todasLasMascotas.length;
        const uniqueOngs = new Set(todasLasMascotas.map((m) => m.id_ong || m.ong_nombre || "sin-ong")).size;
        if (totalEl) totalEl.textContent = total;
        if (ongsEl) ongsEl.textContent = uniqueOngs;
        if (mostrandoEl) mostrandoEl.textContent = mostrando;
    };

    const getFilteredMascotas = () => {
        const termino = filtroInput ? filtroInput.value.toLowerCase().trim() : "";
        if (!termino) return todasLasMascotas;
        return todasLasMascotas.filter((mascota) => {
            const nombre = `${mascota.nombre || ""}`.toLowerCase();
            const tipo = `${mascota.tipo || ""}`.toLowerCase();
            const ong = `${mascota.ong_nombre || ""}`.toLowerCase();
            return nombre.includes(termino) || tipo.includes(termino) || ong.includes(termino);
        });
    };

    const renderTabla = (lista) => {
        if (!tablaBody) return;

        if (!Array.isArray(lista) || lista.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay mascotas archivadas.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = lista.map((mascota) => {
            const nombre = mascota.nombre || "Sin nombre";
            const tipo = mascota.tipo || "—";
            const edad = mascota.edad !== null && mascota.edad !== undefined ? `${mascota.edad} meses` : "Edad N/D";
            const ongNombre = mascota.ong_nombre || "Sin ONG";
            const initials = getInitials(nombre);
            const fecha = formatDate(mascota.date_update || mascota.date_publicacion);

            return `
                <tr>
                    <td>${escapeHtml(mascota.id)}</td>
                    <td>
                      <div class="admin-entity-cell">
                        <span class="admin-entity-avatar">${escapeHtml(initials)}</span>
                        <div class="admin-entity-meta">
                          <span class="admin-entity-name">${escapeHtml(nombre)}</span>
                          <span class="admin-entity-sub">${escapeHtml(tipo)} · ${escapeHtml(edad)}</span>
                        </div>
                      </div>
                    </td>
                    <td>${escapeHtml(ongNombre)}</td>
                    <td>${escapeHtml(fecha)}</td>
                    <td><span class="admin-status-pill is-archived">Archivada</span></td>
                    <td class="text-center"><span class="admin-empty">Sin acciones</span></td>
                </tr>
            `;
        }).join("");
    };

    const renderView = () => {
        const filtradas = getFilteredMascotas();
        updateResumen(filtradas.length);
        renderTabla(filtradas);
        if (infoEl) {
            infoEl.textContent = `Mostrando ${filtradas.length} de ${todasLasMascotas.length}`;
        }
    };

    const fetchMascotas = async () => {
        try {
            const response = await fetch("../api/gestionar-mascotas-borradas.php", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "No se pudieron cargar las mascotas archivadas.");
            }

            const data = await response.json();
            todasLasMascotas = Array.isArray(data) ? data : [];
            renderView();
        } catch (error) {
            if (tablaBody) {
                tablaBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
            }
            updateResumen(0);
            if (infoEl) {
                infoEl.textContent = "Sin mascotas para mostrar.";
            }
        }
    };

    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            renderView();
        });
    }

    if (limpiarFiltroBtn) {
        limpiarFiltroBtn.addEventListener("click", () => {
            if (filtroInput) filtroInput.value = "";
            renderView();
        });
    }

    fetchMascotas();
});
