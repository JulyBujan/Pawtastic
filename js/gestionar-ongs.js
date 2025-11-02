document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-ongs-body");
    const modalOngEl = document.getElementById('modalOng');
    const modalOng = new bootstrap.Modal(modalOngEl);
    const formOng = document.getElementById('form-ong');
    const modalLabel = document.getElementById('modalOngLabel');

    // 1. Proteger la ruta
    if (!token || tipoUsuario !== 'admin') {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let allOngs = [];

    /**
     * Carga todas las ONGs desde la API y las renderiza.
     */
    const fetchOngs = async () => {
        try {
            const response = await fetch('../api/gestionar-ongs.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las ONGs.');
            
            allOngs = await response.json();
            renderTabla(allOngs);
        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    /**
     * Renderiza la tabla de ONGs.
     * @param {Array} ongs - El array de ONGs a mostrar.
     */
    const renderTabla = (ongs) => {
        tablaBody.innerHTML = '';
        if (ongs.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay ONGs registradas.</td></tr>`;
            return;
        }
        ongs.forEach(ong => {
            tablaBody.innerHTML += `
                <tr>
                    <td>${ong.id}</td>
                    <td>${ong.nombre}</td>
                    <td>${ong.razon_social || 'N/A'}</td>
                    <td>${ong.cuit || 'N/A'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${ong.id}"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${ong.id}"><i class="bi bi-trash"></i> Eliminar</button>
                    </td>
                </tr>
            `;
        });
    };

    /**
     * Maneja el envío del formulario para crear o editar una ONG.
     */
    formOng.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ongId = document.getElementById('ong-id').value;
        const data = {
            nombre: document.getElementById('ong-nombre').value,
            razon_social: document.getElementById('ong-razon-social').value,
            cuit: document.getElementById('ong-cuit').value,
        };
        if (ongId) data.id = ongId;

        try {
            const response = await fetch('../api/gestionar-ongs.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message, 'success');
            modalOng.hide();
            fetchOngs();
        } catch (error) {
            showToast(error.message, 'danger');
        }
    });

    /**
     * Maneja los clics en los botones de la tabla.
     */
    tablaBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const ongId = target.dataset.id;

        // Botón Editar
        if (target.classList.contains('btn-editar')) {
            const ong = allOngs.find(o => o.id == ongId);
            if (ong) {
                modalLabel.textContent = 'Editar ONG';
                document.getElementById('ong-id').value = ong.id;
                document.getElementById('ong-nombre').value = ong.nombre;
                document.getElementById('ong-razon-social').value = ong.razon_social || '';
                document.getElementById('ong-cuit').value = ong.cuit || '';
                modalOng.show();
            }
        }

        // Botón Eliminar
        if (target.classList.contains('btn-eliminar')) {
            if (confirm(`¿Estás seguro de que quieres eliminar la ONG con ID ${ongId}? Esta acción no se puede deshacer.`)) {
                try {
                    const response = await fetch(`../api/gestionar-ongs.php?id=${ongId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);

                    showToast(result.message, 'success');
                    fetchOngs();
                } catch (error) {
                    showToast(error.message, 'danger');
                }
            }
        }
    });

    /**
     * Resetea el modal para la creación de una nueva ONG.
     */
    document.getElementById('btn-crear-ong').addEventListener('click', () => {
        modalLabel.textContent = 'Crear Nueva ONG';
        formOng.reset();
        document.getElementById('ong-id').value = '';
    });

    // Limpiar el formulario cuando el modal se cierra
    modalOngEl.addEventListener('hidden.bs.modal', () => {
        formOng.reset();
        document.getElementById('ong-id').value = '';
    });

    // Carga inicial
    fetchOngs();
});