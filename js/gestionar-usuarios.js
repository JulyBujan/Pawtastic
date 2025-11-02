document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const tipoUsuario = localStorage.getItem("tipo");
    const tablaBody = document.getElementById("tabla-usuarios-body");
    const modalAsignarOngEl = document.getElementById('modalAsignarOng');
    const modalAsignarOng = new bootstrap.Modal(modalAsignarOngEl);
    const formAsignarOng = document.getElementById('formAsignarOng');
    const filtroInput = document.getElementById("filtro-usuarios");

    // 1. Proteger la ruta
    if (!token || tipoUsuario !== 'admin') {
        showToast("Acceso denegado. Debes ser administrador.", "danger");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    let listaOngs = []; // Almacenar la lista de ONGs
    let todosLosUsuarios = []; // Almacenar la lista completa de usuarios para filtrar

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
            listaOngs = data.ongs; // Guardar lista de ONGs
            todosLosUsuarios = data.usuarios; // Guardar la lista completa
            renderTabla(data.usuarios);
            populateOngSelect();

        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    /**
     * Renderiza las filas de la tabla de usuarios.
     * @param {Array} usuarios - Array de objetos de usuario.
     */
    const renderTabla = (usuarios) => {
        if (usuarios.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" class="text-center">No se encontraron usuarios.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = usuarios.map(user => {
            const estadoBadge = user.estado == 0
                ? `<span class="badge bg-success">Activo</span>`
                : `<span class="badge bg-danger">Inactivo</span>`;

            const accionHabilitar = user.estado == 0
                ? `<a class="dropdown-item" href="#" data-action="deshabilitar" data-id="${user.id}">Deshabilitar</a>`
                : `<a class="dropdown-item" href="#" data-action="habilitar" data-id="${user.id}">Habilitar</a>`;

            const accionAsignarOng = user.tipo === 'ong'
                ? `<li><a class="dropdown-item" href="#" data-action="asignar-ong" data-id="${user.id}" data-nombre="${user.nombre} ${user.apellido}">Asignar ONG</a></li>`
                : '';

            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.nombre}</td>
                    <td>${user.apellido}</td>
                    <td>${user.email}</td>
                    <td>${user.tipo}</td>
                    <td>${estadoBadge}</td>
                    <td class="text-center">
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                Acciones
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="usuario.html?id=${user.id}" target="_blank">Ver Perfil</a></li>
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
        const terminoBusqueda = filtroInput.value.toLowerCase().trim();

        const usuariosFiltrados = todosLosUsuarios.filter(user => {
            const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
            const email = user.email.toLowerCase();
            return nombreCompleto.includes(terminoBusqueda) || email.includes(terminoBusqueda);
        });

        renderTabla(usuariosFiltrados);
    });

    // Carga inicial de datos
    fetchUsuariosYongs();
});