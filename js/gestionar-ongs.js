document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-ongs-body");

    // 1. Proteger la ruta
    if (!token || tipoUsuario !== 'admin') {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    /**
     * Carga todas las ONGs y su estado desde la API.
     */
    const fetchOngs = async () => {
        try {
            const response = await fetch('../api/gestionar-ongs.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las ONGs.');
            
            const ongs = await response.json();
            renderTabla(ongs);
        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    /**
     * Renderiza la tabla de ONGs.
     * @param {Array} ongs - El array de ONGs a mostrar.
     */
    const renderTabla = (ongs) => {
        tablaBody.innerHTML = '';
        if (ongs.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay ONGs registradas.</td></tr>`;
            return;
        }
        ongs.forEach(ong => {
            let estadoHtml = '';
            let documentosHtml = '<span class="text-muted">N/A</span>';
            let accionesHtml = '<span class="text-muted">N/A</span>';

            // Determinar el estado y las acciones según el campo 'estado' de la documentación
            switch (parseInt(ong.estado)) {
                case 0: // Pendiente
                    estadoHtml = '<span class="badge bg-warning text-dark">Pendiente</span>';
                    accionesHtml = `
                        <button class="btn btn-sm btn-success btn-aprobar" data-id="${ong.id}"><i class="bi bi-check-lg"></i> Aprobar</button>
                        <button class="btn btn-sm btn-danger btn-rechazar" data-id="${ong.id}"><i class="bi bi-x-lg"></i> Rechazar</button>
                    `;
                    break;
                case 1: // Aprobado
                    estadoHtml = '<span class="badge bg-success">Aprobado</span>';
                    break;
                case 2: // Rechazado
                    estadoHtml = '<span class="badge bg-danger">Rechazado</span>';
                    break;
                default: // Pre-existente (ong.estado es null)
                    estadoHtml = '<span class="badge bg-secondary">Pre-existente</span>';
            }

            // Si hay documentos, mostrar los enlaces
            if (ong.url_estatuto) {
                documentosHtml = `
                    <a href="../${ong.url_estatuto}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Estatuto Social"><i class="bi bi-file-earmark-text"></i></a>
                    <a href="../${ong.url_cuit}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Constancia de CUIT"><i class="bi bi-file-earmark-text"></i></a>
                    <a href="../${ong.url_acta}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Acta de Autoridades"><i class="bi bi-file-earmark-text"></i></a>
                `;
            }

            tablaBody.innerHTML += `
                <tr>
                    <td>${ong.nombre}</td>
                    <td>${ong.razon_social || 'N/A'}</td>
                    <td>${ong.cuit || 'N/A'}</td>
                    <td class="text-center">${estadoHtml}</td>
                    <td class="text-center">${documentosHtml}</td>
                    <td class="text-center">${accionesHtml}</td>
                </tr>
            `;
        });
    };


    /**
     * Maneja los clics en los botones de la tabla.
     */
    tablaBody.addEventListener('click', async (e) => {
        const aprobarBtn = e.target.closest('.btn-aprobar');
        const rechazarBtn = e.target.closest('.btn-rechazar');

        if (aprobarBtn) {
            const ongId = aprobarBtn.dataset.id;
            if (confirm(`¿Estás seguro de que quieres APROBAR la solicitud de la ONG con ID ${ongId}?`)) {
                handleSolicitudAction(ongId, 'aprobar');
            }
        }

        if (rechazarBtn) {
            const ongId = rechazarBtn.dataset.id;
            if (confirm(`¿Estás seguro de que quieres RECHAZAR la solicitud de la ONG con ID ${ongId}?`)) {
                handleSolicitudAction(ongId, 'rechazar');
            }
        }
    });

    /**
     * Envía la acción (aprobar/rechazar) a la API.
     * @param {number} ongId - El ID de la ONG.
     * @param {string} action - La acción a realizar ('aprobar' o 'rechazar').
     */
    const handleSolicitudAction = async (ongId, action) => {
        try {
            const response = await fetch('../api/gestionar-ongs.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ong_id: ongId, action: action })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'success');
            fetchOngs(); // Recargar la lista de ONGs
        } catch (error) {
            showToast(error.message, 'danger');
        }
    };

    // Carga inicial
    fetchOngs();
});