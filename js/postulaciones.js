document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('postulaciones-container');
    const token = localStorage.getItem('token');
    const tipoUsuario = localStorage.getItem('tipo');

    if (!token) {
        container.innerHTML = `<div class="alert alert-danger">Debes <a href="login.html">iniciar sesión</a> para ver tus postulaciones.</div>`;
        return;
    }

    const fetchPostulaciones = async () => {
        try {
            const response = await fetch('/api/postulaciones.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudieron cargar las postulaciones.');
            }

            const postulaciones = await response.json();
            renderTabla(postulaciones);

        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    };

    const renderTabla = (postulaciones) => {
        if (postulaciones.length === 0) {
            container.innerHTML = `<div class="alert alert-info">Aún no tienes postulaciones.</div>`;
            return;
        }

        let tablaHTML = `<table class="table table-striped table-hover shadow-sm">
                            <thead class="table-dark">
                                <tr>`;

        // Cabeceras dinámicas según el tipo de usuario
        if (tipoUsuario === 'ong') {
            tablaHTML += `<th>Mascota</th>
                          <th>Postulante</th>
                          <th>Fecha</th>
                          <th>Estado</th>`;
        } else {
            tablaHTML += `<th>Mascota</th>
                          <th>ONG Responsable</th>
                          <th>Fecha</th>
                          <th>Estado</th>`;
        }

        tablaHTML += `      </tr>
                          </thead>
                          <tbody>`;

        // Filas de la tabla
        postulaciones.forEach(p => {
            const estado = getEstadoTexto(p.estado);
            const fecha = new Date(p.fecha_inicio).toLocaleDateString();

            tablaHTML += `<tr>`;
            if (tipoUsuario === 'ong') {
                tablaHTML += `<td>${p.mascota_nombre}</td>
                              <td>${p.usuario_nombre} ${p.usuario_apellido}</td>
                              <td>${fecha}</td>
                              <td><span class="badge ${estado.clase}">${estado.texto}</span></td>`;
            } else {
                tablaHTML += `<td>${p.mascota_nombre}</td>
                              <td>${p.ong_nombre}</td>
                              <td>${fecha}</td>
                              <td><span class="badge ${estado.clase}">${estado.texto}</span></td>`;
            }
            tablaHTML += `</tr>`;
        });

        tablaHTML += `</tbody></table>`;
        container.innerHTML = tablaHTML;
    };

    const getEstadoTexto = (estado) => {
        switch (parseInt(estado)) {
            case 0: return { texto: 'Pendiente', clase: 'bg-warning text-dark' };
            case 1: return { texto: 'Aprobada', clase: 'bg-success' };
            case 2: return { texto: 'Rechazada', clase: 'bg-danger' };
            default: return { texto: 'Desconocido', clase: 'bg-secondary' };
        }
    };

    fetchPostulaciones();
});