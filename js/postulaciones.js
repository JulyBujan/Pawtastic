document.addEventListener("DOMContentLoaded", () => {
  const tableCard = document.querySelector(".postulaciones-table-card");
  const pendientesContainer = document.getElementById("postulaciones-pendientes");
  const aprobadasContainer = document.getElementById("postulaciones-aprobadas");
  const rechazadasContainer = document.getElementById("postulaciones-rechazadas");
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
  const searchInput = document.getElementById("postulacionesSearch");
  const statusFilter = document.getElementById("postulacionesStatus");
  const clearFilters = document.getElementById("postulacionesClear");
  const statTotal = document.getElementById("statTotal");
  const statPostulaciones = document.getElementById("statPostulaciones");
  const statAprobadas = document.getElementById("statAprobadas");
  const statPendientes = document.getElementById("statPendientes");
  const statRechazadas = document.getElementById("statRechazadas");
  const countPendientes = document.getElementById("countPendientes");
  const countAprobadas = document.getElementById("countAprobadas");
  const countRechazadas = document.getElementById("countRechazadas");
  const sectionTabs = document.querySelectorAll("[data-section-tab]");
  const sections = document.querySelectorAll(".postulaciones-section");
  const paginationInfo = {
    pendientes: document.getElementById("postulacionesPaginationInfoPendientes"),
    aprobadas: document.getElementById("postulacionesPaginationInfoAprobadas"),
    rechazadas: document.getElementById("postulacionesPaginationInfoRechazadas"),
  };
  const pagination = {
    pendientes: document.getElementById("postulacionesPaginationPendientes"),
    aprobadas: document.getElementById("postulacionesPaginationAprobadas"),
    rechazadas: document.getElementById("postulacionesPaginationRechazadas"),
  };
  let comentarioAdopcionId = null;
  let confirmAdopcionId = null;
  let confirmStatus = null;
  let allPostulaciones = [];
  let filteredPostulaciones = [];
  const sectionPages = {
    pendientes: 1,
    aprobadas: 1,
    rechazadas: 1,
  };
  const pageSize = 5;
  let activeSection = "pendientes";

  const renderState = (title, message, actionHtml = "") => {
    if (!tableCard) {
      return;
    }
    tableCard.innerHTML = `
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
      allPostulaciones = postulaciones || [];
      applyFilters();
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
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      return renderCards(postulaciones);
    }
    let tablaHTML = `
            <div class="table-container table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>`;

    // Cabeceras dinámicas según el tipo de usuario
    if (tipoUsuario === "ong") {
      tablaHTML += `<th>Mascota</th><th>Postulante</th>`;
    } else {
      tablaHTML += `<th>Mascota</th><th>ONG Responsable</th>`;
    }

    // Cabeceras comunes
    tablaHTML += `<th>Inicio</th><th>Cierre</th><th>Estado</th><th>Comentarios</th><th>Acciones</th>`;

    tablaHTML += `      </tr>
                          </thead>
                          <tbody>`;

    // Filas de la tabla
    postulaciones.forEach((p) => {
      const estado = getEstadoTexto(p.estado);
      const fecha = new Date(p.fecha_inicio).toLocaleDateString();
      const fechaCierre = p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : "—";
      const isPendiente = parseInt(p.estado) === 0;
      const fechaInicio = p.fecha_inicio ? new Date(p.fecha_inicio) : null;
      const diasEnRevision = fechaInicio
        ? Math.max(0, Math.floor((Date.now() - fechaInicio.getTime()) / 86400000))
        : null;
      const diasLabel = diasEnRevision !== null
        ? `${diasEnRevision} día${diasEnRevision === 1 ? "" : "s"}`
        : "";
      const estadoExtra = isPendiente && diasLabel
        ? `<div class="estado-subtext">En revisión · ${diasLabel}</div>`
        : "";
      const comentariosRaw = (p.comentarios || "").trim();
      const comentariosParts = comentariosRaw ? comentariosRaw.split(/\n---\n/) : [];
      const comentariosCount = comentariosParts.length;
      const comentarioBadge = comentariosCount
        ? `<span class="comment-badge comment-badge--ok"><i class="bi bi-chat-dots"></i>${comentariosCount} comentario${comentariosCount === 1 ? "" : "s"}</span>`
        : `<span class="comment-badge comment-badge--empty"><i class="bi bi-chat"></i>Sin comentarios</span>`;
      const comentarioMetaHtml = `<div class="comment-meta">${comentarioBadge}</div>`;
      const formatCommentItem = (texto) => {
        const trimmed = (texto || "").trim();
        if (!trimmed) return "";
        const match = trimmed.match(/^\[(.*?)\]:\s*([\s\S]*)$/);
        const meta = match ? match[1] : "";
        const body = match ? match[2] : trimmed;
        const metaDisplay = meta
          ? meta.split(" - ").slice(-1)[0].trim() || meta.trim()
          : "";
        const bodyHtml = body.replace(/\n/g, "<br>");
        return `
          <div class="comment-item">
            ${metaDisplay ? `<div class="comment-item-meta">${metaDisplay}</div>` : ""}
            <div class="comment-item-body">${bodyHtml}</div>
          </div>
        `;
      };
      const comentariosHtml = comentariosParts.length
        ? comentariosParts.map(formatCommentItem).join("")
        : '<span class="comment-empty">Todavía no hay comentarios.</span>';

      tablaHTML += `<tr class="postulacion-row${isPendiente ? " postulacion-row--pending" : ""}">`;
      if (tipoUsuario === "ong") {
        tablaHTML += `<td data-label="Mascota"><a href="gestionar-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a></td>
                              <td data-label="Postulante"><a href="usuario.html?id=${p.usuario_id}">${p.usuario_nombre} ${p.usuario_apellido}</a></td>`;
      } else {
        tablaHTML += `<td data-label="Mascota"><a href="detalle-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a></td>
                              <td data-label="ONG Responsable">${p.ong_nombre}</td>`;
      }

      // Columnas comunes para ambos tipos de usuario
      tablaHTML += `<td data-label="Inicio">${fecha}</td>
                          <td data-label="Cierre">${fechaCierre}</td>
                          <td data-label="Estado"><span class="badge status-badge ${estado.clase}">${
        estado.emoji
          ? `<span class="status-indicator status-indicator--${estado.indicator} ${estado.anim}" aria-hidden="true">${estado.emoji}</span>${estado.texto}`
          : estado.texto
      }</span>${estadoExtra}</td>
                          <td data-label="Comentarios" class="cell-comments">
                            ${comentarioMetaHtml}
                            <div class="comentarios-display">${comentariosHtml}</div>
                            <button class="btn btn-action btn-action-outline mt-2 add-comment-btn" data-id="${
                              p.id
                            }"><i class="bi bi-chat-dots"></i>Comentar</button>
                          </td>
                          <td data-label="Acciones" class="cell-actions">
                            ${
                              tipoUsuario === "ong"
                                ? isPendiente
                                  ? `<div class="d-flex flex-wrap gap-2">
                                       <button class="btn btn-action btn-action-success approve-btn" data-id="${
                                         p.id
                                       }"><i class="bi bi-check-circle"></i>Aprobar</button>
                                       <button class="btn btn-action btn-action-danger reject-btn" data-id="${
                                         p.id
                                       }"><i class="bi bi-x-circle"></i>Rechazar</button>
                                     </div>`
                                  : `<span class="text-muted small">Sin acciones</span>`
                                : `<button class="btn btn-action btn-action-warning" disabled><i class="bi bi-clock"></i>Cancelar</button>`
                            }
                          </td>`;
      tablaHTML += `</tr>`;
    });

    tablaHTML += `    </tbody>
                </table>
            </div>`;
    return tablaHTML;
  };

  const renderCards = (postulaciones) => {
    const cards = postulaciones.map((p) => {
      const estado = getEstadoTexto(p.estado);
      const fecha = new Date(p.fecha_inicio).toLocaleDateString();
      const fechaCierre = p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : "—";
      const isPendiente = parseInt(p.estado, 10) === 0;
      const fechaInicio = p.fecha_inicio ? new Date(p.fecha_inicio) : null;
      const diasEnRevision = fechaInicio
        ? Math.max(0, Math.floor((Date.now() - fechaInicio.getTime()) / 86400000))
        : null;
      const diasLabel = diasEnRevision !== null
        ? `${diasEnRevision} día${diasEnRevision === 1 ? "" : "s"}`
        : "";
      const estadoExtra = isPendiente && diasLabel
        ? `<div class="estado-subtext">En revisión · ${diasLabel}</div>`
        : "";
      const comentariosRaw = (p.comentarios || "").trim();
      const comentariosParts = comentariosRaw ? comentariosRaw.split(/\n---\n/) : [];
      const comentariosCount = comentariosParts.length;
      const comentarioBadge = comentariosCount
        ? `<span class="comment-badge comment-badge--ok"><i class="bi bi-chat-dots"></i>${comentariosCount} comentario${comentariosCount === 1 ? "" : "s"}</span>`
        : `<span class="comment-badge comment-badge--empty"><i class="bi bi-chat"></i>Sin comentarios</span>`;
      const formatCommentItem = (texto) => {
        const trimmed = (texto || "").trim();
        if (!trimmed) return "";
        const match = trimmed.match(/^\[(.*?)\]:\s*([\s\S]*)$/);
        const meta = match ? match[1] : "";
        const body = match ? match[2] : trimmed;
        const metaDisplay = meta
          ? meta.split(" - ").slice(-1)[0].trim() || meta.trim()
          : "";
        const bodyHtml = body.replace(/\n/g, "<br>");
        return `
          <div class="comment-item">
            ${metaDisplay ? `<div class="comment-item-meta">${metaDisplay}</div>` : ""}
            <div class="comment-item-body">${bodyHtml}</div>
          </div>
        `;
      };
      const comentariosHtml = comentariosParts.length
        ? comentariosParts.map(formatCommentItem).join("")
        : '<span class="comment-empty">Todavía no hay comentarios.</span>';
      const comentarioMetaHtml = `<div class="comment-meta">${comentarioBadge}</div>`;
      const accionesHtml = tipoUsuario === "ong"
        ? isPendiente
          ? `<div class="d-flex flex-wrap gap-2">
               <button class="btn btn-action btn-action-success approve-btn" data-id="${p.id}"><i class="bi bi-check-circle"></i>Aprobar</button>
               <button class="btn btn-action btn-action-danger reject-btn" data-id="${p.id}"><i class="bi bi-x-circle"></i>Rechazar</button>
             </div>`
          : `<span class="text-muted small">Sin acciones</span>`
        : `<button class="btn btn-action btn-action-warning" disabled><i class="bi bi-clock"></i>Cancelar</button>`;

      const headerLeft = tipoUsuario === "ong"
        ? `<a href="gestionar-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a>`
        : `<a href="detalle-mascota.html?id=${p.mascota_id}">${p.mascota_nombre}</a>`;
      const headerRight = tipoUsuario === "ong"
        ? `<span class="text-muted">Postulante: <a href="usuario.html?id=${p.usuario_id}">${p.usuario_nombre} ${p.usuario_apellido}</a></span>`
        : `<span class="text-muted">ONG: ${p.ong_nombre}</span>`;

      return `
        <article class="postulacion-card${isPendiente ? " postulacion-card--pending" : ""}">
          <div class="postulacion-card-header">
            <div class="postulacion-card-title">${headerLeft}</div>
            <div class="postulacion-card-sub">${headerRight}</div>
          </div>
          <div class="postulacion-card-body">
            <div class="postulacion-card-row">
              <span class="label">Estado</span>
              <span class="value"><span class="badge status-badge ${estado.clase}">${
        estado.emoji
          ? `<span class="status-indicator status-indicator--${estado.indicator} ${estado.anim}" aria-hidden="true">${estado.emoji}</span>${estado.texto}`
          : estado.texto
      }</span>${estadoExtra}</span>
            </div>
            <div class="postulacion-card-row">
              <span class="label">Inicio</span>
              <span class="value">${fecha}</span>
            </div>
            <div class="postulacion-card-row">
              <span class="label">Cierre</span>
              <span class="value">${fechaCierre}</span>
            </div>
            <div class="postulacion-card-row">
              <span class="label">Comentarios</span>
              <span class="value">
                ${comentarioMetaHtml}
                <div class="comentarios-display">${comentariosHtml}</div>
              </span>
            </div>
          </div>
          <div class="postulacion-card-actions">${accionesHtml}</div>
        </article>
      `;
    });

    return `<div class="postulaciones-cards">${cards.join("")}</div>`;
  };

  const renderEmptySection = (containerEl, message) => {
    if (!containerEl) return;
    containerEl.innerHTML = `
      <div class="text-center text-muted small py-4">
        <i class="bi bi-info-circle me-1"></i>${message}
      </div>
    `;
  };

  const bindRowActions = () => {
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
        return {
          texto: "Pendiente",
          clase: "bg-warning text-dark",
          emoji: "⏳",
          indicator: "pending",
          anim: "status-icon-spin",
        };
      case 1:
        return {
          texto: "Aprobada",
          clase: "bg-success",
          emoji: "✅",
          indicator: "approved",
          anim: "status-icon-pop",
        };
      case 2:
        return {
          texto: "Rechazada",
          clase: "bg-danger",
          emoji: "❌",
          indicator: "rejected",
          anim: "status-icon-shake",
        };
      default:
        return {
          texto: "Desconocido",
          clase: "bg-secondary",
          emoji: "❓",
          indicator: "unknown",
          anim: "",
        };
    }
  };

  let totalMascotas = null;

  const fetchMascotasTotal = async () => {
    try {
      const response = await fetch(
        "/api/get_mascota.php?include_adoptadas=1&include_archivadas=1",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const mascotas = await response.json();
      totalMascotas = Array.isArray(mascotas) ? mascotas.length : 0;
      if (statTotal) statTotal.textContent = totalMascotas;
    } catch (error) {
      console.warn("No se pudo obtener el total de mascotas:", error);
    }
  };

  fetchPostulaciones();
  fetchMascotasTotal();

  const normalizeText = (value) => {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const getCounts = (list) => ({
    total: list.length,
    pendientes: list.filter((p) => parseInt(p.estado, 10) === 0).length,
    aprobadas: list.filter((p) => parseInt(p.estado, 10) === 1).length,
    rechazadas: list.filter((p) => parseInt(p.estado, 10) === 2).length,
  });

  const updateStats = (baseList, visibleList) => {
    const baseCounts = getCounts(baseList);
    const visibleCounts = getCounts(visibleList);

    if (statTotal) {
      statTotal.textContent = totalMascotas !== null ? totalMascotas : baseCounts.total;
    }
    if (statPostulaciones) statPostulaciones.textContent = baseCounts.total;
    if (statPendientes) statPendientes.textContent = baseCounts.pendientes;
    if (statAprobadas) statAprobadas.textContent = baseCounts.aprobadas;
    if (statRechazadas) statRechazadas.textContent = baseCounts.rechazadas;
    if (countPendientes) countPendientes.textContent = visibleCounts.pendientes;
    if (countAprobadas) countAprobadas.textContent = visibleCounts.aprobadas;
    if (countRechazadas) countRechazadas.textContent = visibleCounts.rechazadas;
  };

  const applyFilters = () => {
    const query = normalizeText(searchInput?.value);
    const status = statusFilter ? statusFilter.value : "";
    const filtered = allPostulaciones.filter((p) => {
      const estado = getEstadoTexto(p.estado).texto.toLowerCase();
      const matchesStatus = !status || estado === status;

      const nombreMascota = normalizeText(p.mascota_nombre);
      const nombreUsuario = normalizeText(`${p.usuario_nombre || ""} ${p.usuario_apellido || ""}`.trim());
      const nombreOng = normalizeText(p.ong_nombre);
      const matchesQuery = !query
        || nombreMascota.includes(query)
        || (tipoUsuario === "ong"
          ? nombreUsuario.includes(query)
          : nombreOng.includes(query));

      return matchesStatus && matchesQuery;
    });

    filteredPostulaciones = filtered;
    sectionPages.pendientes = 1;
    sectionPages.aprobadas = 1;
    sectionPages.rechazadas = 1;
    updateStats(allPostulaciones, filteredPostulaciones);
    renderSections();
  };

  const renderPagination = (sectionKey, totalItems) => {
    const paginationEl = pagination[sectionKey];
    const infoEl = paginationInfo[sectionKey];
    if (!paginationEl) return;

    if (totalItems === 0) {
      paginationEl.innerHTML = "";
      if (infoEl) {
        infoEl.textContent = "Sin postulaciones";
      }
      return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (sectionPages[sectionKey] > totalPages) {
      sectionPages[sectionKey] = totalPages;
    }

    const createPageItem = (page, label, disabled = false, active = false) => {
      const li = document.createElement("li");
      li.className = "page-item";
      if (disabled) li.classList.add("disabled");
      if (active) li.classList.add("active");
      const link = document.createElement("a");
      link.className = "page-link";
      link.href = "#";
      link.textContent = label;
      link.dataset.page = page;
      link.dataset.section = sectionKey;
      li.appendChild(link);
      return li;
    };

    paginationEl.innerHTML = "";
    const currentPage = sectionPages[sectionKey];
    paginationEl.appendChild(
      createPageItem(currentPage - 1, "Anterior", currentPage === 1)
    );

    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page += 1) {
      paginationEl.appendChild(
        createPageItem(page, String(page), false, page === currentPage)
      );
    }

    paginationEl.appendChild(
      createPageItem(currentPage + 1, "Siguiente", currentPage === totalPages)
    );
  };

  const renderSection = (sectionKey, containerEl, items, emptyMessage) => {
    if (!containerEl) return;
    if (!items || items.length === 0) {
      renderEmptySection(containerEl, emptyMessage);
      renderPagination(sectionKey, 0);
      return;
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (sectionPages[sectionKey] > totalPages) {
      sectionPages[sectionKey] = totalPages;
    }
    const currentPage = sectionPages[sectionKey];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const pageItems = items.slice(startIndex, endIndex);

    containerEl.innerHTML = renderTabla(pageItems);

    const infoEl = paginationInfo[sectionKey];
    if (infoEl) {
      infoEl.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${total} postulaciones`;
    }
    renderPagination(sectionKey, total);
  };

  const renderSections = () => {
    const pendientes = [];
    const aprobadas = [];
    const rechazadas = [];

    filteredPostulaciones.forEach((p) => {
      const estado = parseInt(p.estado, 10);
      if (estado === 1) {
        aprobadas.push(p);
      } else if (estado === 2) {
        rechazadas.push(p);
      } else {
        pendientes.push(p);
      }
    });

    renderSection(
      "pendientes",
      pendientesContainer,
      pendientes,
      "No hay postulaciones pendientes."
    );
    renderSection(
      "aprobadas",
      aprobadasContainer,
      aprobadas,
      "No hay postulaciones aprobadas todavía."
    );
    renderSection(
      "rechazadas",
      rechazadasContainer,
      rechazadas,
      "No hay postulaciones rechazadas."
    );

    bindRowActions();
    updateSectionVisibility();
  };

  const updateSectionVisibility = () => {
    sections.forEach((section) => {
      const key = section.dataset.section;
      section.classList.toggle("is-hidden", key !== activeSection);
    });
    sectionTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.sectionTab === activeSection);
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "";
      applyFilters();
    });
  }

  sectionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.sectionTab;
      if (!target) return;
      activeSection = target;
      updateSectionVisibility();
    });
  });

  Object.entries(pagination).forEach(([sectionKey, paginationEl]) => {
    if (!paginationEl) return;
    paginationEl.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-page]");
      if (!link) return;
      event.preventDefault();
      const pageItem = link.closest(".page-item");
      if (pageItem && pageItem.classList.contains("disabled")) {
        return;
      }
      const targetSection = link.dataset.section || sectionKey;
      let page = parseInt(link.dataset.page, 10);
      if (!Number.isFinite(page)) return;
      if (page < 1) page = 1;
      sectionPages[targetSection] = page;
      renderSections();
    });
  });
});
