document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("postulaciones-container");
  const token = localStorage.getItem("token");
  const tipoUsuario = localStorage.getItem("tipo");
  const comentarioModalEl = document.getElementById("modalComentario");
  const comentarioModal = comentarioModalEl
    ? new bootstrap.Modal(comentarioModalEl)
    : null;
  const comentarioTextarea = document.getElementById("comentarioTexto");
  const guardarComentarioBtn = document.getElementById("guardarComentarioBtn");
  const confirmModalEl = document.getElementById("modalConfirmAction");
  const confirmModal = confirmModalEl
    ? new bootstrap.Modal(confirmModalEl)
    : null;
  const confirmActionBtn = document.getElementById("confirmActionBtn");
  const confirmActionText = document.getElementById("confirmActionText");
  const confirmActionTitle = document.getElementById("confirmActionTitle");
  let comentarioAdopcionId = null;
  let confirmAdopcionId = null;
  let confirmStatus = null;

  const renderState = (title, message, actionHtml = "") => {
    if (!container) {
      return;
    }
    container.innerHTML = `
      <div class="bg-white border rounded-4 p-4 shadow-sm text-center">
        <h5 class="fw-bold mb-2">${title}</h5>
        <p class="text-muted mb-3">${message}</p>
        ${actionHtml}
      </div>
    `;
  };

  if (!token) {
    if (typeof showToast === "function") {
      showToast('Debes iniciar sesión para ver tus postulaciones.', "warning");
    }
    renderState(
      "Inicia sesión",
      "Para ver tus postulaciones necesitas ingresar con tu cuenta.",
      '<a href="login.html" class="btn btn-dark">Ingresar</a>'
    );
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
      if (typeof showToast === "function") {
        showToast(error.message, "danger");
      }
      renderState(
        "Ocurrió un error",
        error.message || "No se pudieron cargar las postulaciones."
      );
    }
  };

  const renderTabla = (postulaciones) => {
    if (postulaciones.length === 0) {
      if (typeof showToast === "function") {
        showToast("Aún no tienes postulaciones.", "info");
      }
      renderState(
        "Sin postulaciones",
        "Todavía no registras postulaciones. ¡Explora el catálogo y encuentra tu match!"
      );
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
        comentarioAdopcionId = adopcionId;
        if (comentarioTextarea) {
          comentarioTextarea.value = "";
          comentarioTextarea.focus();
        }
        comentarioModal?.show();
      });
    });

    document.querySelectorAll(".approve-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const adopcionId = event.target.dataset.id;
        confirmAdopcionId = adopcionId;
        confirmStatus = 1;
        if (confirmActionTitle) {
          confirmActionTitle.textContent = "Aprobar postulación";
        }
        if (confirmActionText) {
          confirmActionText.textContent =
            "¿Estás seguro de que quieres aprobar esta postulación?";
        }
        if (confirmActionBtn) {
          confirmActionBtn.textContent = "Aprobar";
          confirmActionBtn.className = "btn btn-success";
        }
        confirmModal?.show();
      });
    });

    document.querySelectorAll(".reject-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const adopcionId = event.target.dataset.id;
        confirmAdopcionId = adopcionId;
        confirmStatus = 2;
        if (confirmActionTitle) {
          confirmActionTitle.textContent = "Rechazar postulación";
        }
        if (confirmActionText) {
          confirmActionText.textContent =
            "¿Estás seguro de que quieres rechazar esta postulación?";
        }
        if (confirmActionBtn) {
          confirmActionBtn.textContent = "Rechazar";
          confirmActionBtn.className = "btn btn-danger";
        }
        confirmModal?.show();
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

  if (guardarComentarioBtn) {
    guardarComentarioBtn.addEventListener("click", async () => {
      if (!comentarioAdopcionId) {
        showToast("No se pudo identificar la postulación.", "danger");
        return;
      }
      const newComment = comentarioTextarea?.value.trim();
      if (!newComment) {
        showToast("Escribe un comentario antes de guardar.", "warning");
        return;
      }
      comentarioModal?.hide();
      await addComment(comentarioAdopcionId, newComment);
      comentarioAdopcionId = null;
    });
  }

  if (confirmActionBtn) {
    confirmActionBtn.addEventListener("click", async () => {
      if (!confirmAdopcionId || confirmStatus === null) {
        showToast("No se pudo continuar con la acción.", "danger");
        return;
      }
      confirmModal?.hide();
      await updatePostulacionStatus(confirmAdopcionId, confirmStatus);
      confirmAdopcionId = null;
      confirmStatus = null;
    });
  }

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
