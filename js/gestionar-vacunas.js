document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem("token");
    const tablaBody = document.getElementById("tabla-vacunas-body");
    const modalVacunaEl = document.getElementById('modalVacuna');
    const modalVacuna = new bootstrap.Modal(modalVacunaEl);
    const formVacuna = document.getElementById('form-vacuna');
    const modalLabel = document.getElementById('modalVacunaLabel');

    let allVacunas = []; // Almacenar todas las vacunas para la edición

    /**
     * Carga todas las vacunas desde la API y las renderiza en la tabla.
     */
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
            renderTabla(allVacunas);
        } catch (error) {
            tablaBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    /**
     * Renderiza la tabla de vacunas.
     * @param {Array} vacunas - El array de vacunas a mostrar.
     */
    const renderTabla = (vacunas) => {
        tablaBody.innerHTML = '';
        if (vacunas.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay vacunas registradas.</td></tr>`;
            return;
        }
        vacunas.forEach(vacuna => {
            tablaBody.innerHTML += `
                <tr>
                    <td>${vacuna.id_vacuna}</td>
                    <td>${vacuna.nombre}</td>
                    <td>${vacuna.tipo.charAt(0).toUpperCase() + vacuna.tipo.slice(1)}</td>
                    <td>${vacuna.descripcion || 'N/A'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${vacuna.id_vacuna}"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${vacuna.id_vacuna}"><i class="bi bi-trash"></i> Eliminar</button>
                    </td>
                </tr>
            `;
        });
    };

    /**
     * Maneja el envío del formulario para crear o editar una vacuna.
     */
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
        }
    });

    /**
     * Maneja los clics en los botones de la tabla (Editar y Eliminar).
     */
    tablaBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const vacunaId = target.dataset.id;

        // Botón Editar
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

        // Botón Eliminar
        if (target.classList.contains('btn-eliminar')) {
            if (confirm(`¿Estás seguro de que quieres eliminar la vacuna con ID ${vacunaId}?`)) {
                try {
                    const response = await fetch(`../api/gestionar-vacunas.php?id=${vacunaId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);

                    showToast(result.message, 'success');
                    fetchVacunas();
                } catch (error) {
                    showToast(error.message, 'danger');
                }
            }
        }
    });

    // Resetea el modal para la creación de una nueva vacuna.
    document.getElementById('btn-crear-vacuna').addEventListener('click', () => {
        modalLabel.textContent = 'Crear Nueva Vacuna';
        formVacuna.reset();
        document.getElementById('vacuna-id').value = '';
    });

    // Carga inicial de datos
    fetchVacunas();
});