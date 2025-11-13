document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("postulaciones-container");
  const token = localStorage.getItem("token");
  const tipoUsuario = localStorage.getItem("tipo");

  if (!token) {
    container.innerHTML = `<div class="alert alert-danger">Debes <a href="login.html">iniciar sesión</a> para ver tus postulaciones.</div>`;
    return;
  }

  const fetchPostulaciones = async () => {
    try {
      const response = await fetch("/api/postulaciones.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "No se pudieron cargar las postulaciones."
        );
      }

      const postulaciones = await response.json();
      renderTabla(postulaciones);
    } catch (error) {
      console.error("Error:", error);
      container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
  };

  const renderTabla = (postulaciones) => {
    if (postulaciones.length === 0) {
      container.innerHTML = `<div class="alert alert-info">Aún no tienes postulaciones.</div>`;
      return;
    }

    let tablaHTML = `
            <div class="table-container">
                <table class="table table-striped table-hover">
                    <thead class="bg-primary text-white">
                        <tr>`;

    // Cabeceras dinámicas según el tipo de usuario
    if (tipoUsuario === "ong") {
      tablaHTML += `<th>Mascota</th><th>Postulante</th>`;
    } else {
      tablaHTML += `<th>Mascota</th><th>ONG Responsable</th>`;
    }

    // Cabeceras comunes
    tablaHTML += `<th>Fecha</th><th>Estado</th><th>Comentarios</th><th>Acciones</th>`;

    tablaHTML += `      </tr>
                          </thead>
                          <tbody>`;

    // Filas de la tabla
    postulaciones.forEach((p) => {
      const estado = getEstadoTexto(p.estado);
      const fecha = new Date(p.fecha_inicio).toLocaleDateString();
      const isPendiente = parseInt(p.estado) === 0;

      tablaHTML += `<tr>`;
      if (tipoUsuario === "ong") {
        tablaHTML += `<td><a href="gestionar-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a></td>
                              <td><a href="usuario.html?id=${p.usuario_id}">${p.usuario_nombre} ${p.usuario_apellido}</a></td>`;
      } else {
        tablaHTML += `<td><a href="detalle-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a></td>
                              <td>${p.ong_nombre}</td>`;
      }

      // Columnas comunes para ambos tipos de usuario
      tablaHTML += `<td>${fecha}</td>
                          <td><span class="badge ${estado.clase}">${
        estado.texto
      }</span></td>
                          <td>
                            <div class="comentarios-display" style="white-space: pre-wrap; max-height: 100px; overflow-y: auto;">${
                              p.comentarios
                                ? p.comentarios.replace(
                                    /\n---\n/g,
                                    '<hr class="my-1">'
                                  )
                                : "Sin comentarios"
                            }</div>
                            <button class="btn btn-sm btn-comentar-tabla mt-1 add-comment-btn" data-id="${
                              p.id
                            }">Comentar</button>
                          </td>
                          <td>
                            ${
                              tipoUsuario === "ong"
                                ? `<div class="d-flex gap-2">
                                     <button class="btn btn-sm btn-success approve-btn" data-id="${
                                       p.id
                                     }" ${
                                    !isPendiente ? "disabled" : ""
                                  }>Aprobar</button>
                                     <button class="btn btn-sm btn-danger reject-btn" data-id="${
                                       p.id
                                     }" ${
                                    !isPendiente ? "disabled" : ""
                                  }>Rechazar</button>
                                   </div>`
                                : `<button class="btn btn-sm btn-warning" disabled>Cancelar</button>`
                            }
                          </td>`;
      tablaHTML += `</tr>`;
    });

    tablaHTML += `    </tbody>
                </table>
            </div>`;
    container.innerHTML = tablaHTML;

    // Attach event listeners to the new buttons
    document.querySelectorAll(".add-comment-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const adopcionId = event.target.dataset.id;
        const newComment = prompt("Introduce tu comentario:");
        if (newComment) {
          await addComment(adopcionId, newComment);
        }
      });
    });

    document.querySelectorAll(".approve-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const adopcionId = event.target.dataset.id;
        if (confirm("¿Estás seguro de que quieres APROBAR esta postulación?")) {
          await updatePostulacionStatus(adopcionId, 1); // 1 = Aprobada
        }
      });
    });

    document.querySelectorAll(".reject-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const adopcionId = event.target.dataset.id;
        if (
          confirm("¿Estás seguro de que quieres RECHAZAR esta postulación?")
        ) {
          await updatePostulacionStatus(adopcionId, 2); // 2 = Rechazada
        }
      });
    });
  };

  const addComment = async (adopcionId, commentText) => {
    try {
      const response = await fetch("/api/postulaciones.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adopcion_id: adopcionId,
          comentario: commentText,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        fetchPostulaciones(); // Re-fetch to update the table
      } else {
        throw new Error(result.message || "Error al agregar comentario.");
      }
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      showToast(error.message, "danger");
    }
  };

  const updatePostulacionStatus = async (adopcionId, newStatus) => {
    try {
      const response = await fetch("/api/postulaciones.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adopcion_id: adopcionId,
          new_status: newStatus,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        fetchPostulaciones(); // Recargar la tabla para mostrar el nuevo estado
      } else {
        throw new Error(result.message || "Error al actualizar el estado.");
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showToast(error.message, "danger");
    }
  };

  const getEstadoTexto = (estado) => {
    switch (parseInt(estado)) {
      case 0:
        return { texto: "Pendiente", clase: "bg-warning text-dark" };
      case 1:
        return { texto: "Aprobada", clase: "bg-success" };
      case 2:
        return { texto: "Rechazada", clase: "bg-danger" };
      default:
        return { texto: "Desconocido", clase: "bg-secondary" };
    }
  };

  fetchPostulaciones();
});
