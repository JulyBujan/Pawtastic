document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const tipo = localStorage.getItem("tipo");

  const nombreUsuarioSpan = document.getElementById("nombreUsuario");
  const bienvenidaUsuario = document.getElementById("bienvenidaUsuario");
  const totalPostulacionesEl = document.getElementById("totalPostulaciones");
  const totalMascotasActivasEl = document.getElementById("totalMascotasActivas");
  const ultimaPostulacionUpdateEl = document.getElementById("ultimaPostulacionUpdate");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markAllNotifBtn = document.getElementById("markAllNotif");
  const actividadList = document.getElementById("actividadList");

  if (!token || tipo !== "usuario") {
    if (typeof showToast === "function") {
      showToast("⚠️ Debes iniciar sesión como usuario para acceder a esta página.", "danger");
    }
    window.location.href = "login.html";
    return;
  }

  const handleUnauthorized = (response) => {
    if (response && response.status === 401) {
      if (!window.__pawtasticAuthExpired) {
        window.__pawtasticAuthExpired = true;
        if (typeof showToast === "function") {
          showToast("Tu sesión expiró. Volvé a iniciar sesión.", "warning");
        }
        localStorage.removeItem("token");
        localStorage.removeItem("tipo");
        window.location.href = "login.html";
      }
      return true;
    }
    return false;
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeHtml = (value) => {
    if (!value) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const getIconForNotif = (tipoNotif) => {
    const type = (tipoNotif || "").toLowerCase();
    if (type.includes("comentario")) return "bi-chat-left-dots";
    if (type.includes("estado")) return "bi-check-circle";
    if (type.includes("postul")) return "bi-envelope";
    return "bi-heart-fill";
  };

  const fetchUsuarioData = async () => {
    try {
      const response = await fetch("../api/usuario.php", {
        headers: { Authorization: "Bearer " + token },
      });

      if (handleUnauthorized(response)) {
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cargar los datos del usuario.");
      }

      const usuario = await response.json();
      const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ").trim();
      const nombreMostrado = nombreCompleto || "Adoptante";
      if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = nombreMostrado;
      }
      if (bienvenidaUsuario) {
        bienvenidaUsuario.textContent = "¡Bienvenido/a!";
      }
    } catch (error) {
      console.error(error);
      if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = "Usuario";
      }
    }
  };

  const fetchPostulacionesData = async () => {
    try {
      const response = await fetch("../api/postulaciones.php", {
        headers: { Authorization: "Bearer " + token },
      });

      if (handleUnauthorized(response)) {
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudieron cargar las postulaciones.");
      }

      const postulaciones = await response.json();
      const list = Array.isArray(postulaciones) ? postulaciones : [];
      const total = list.length;
      if (totalPostulacionesEl) totalPostulacionesEl.textContent = total;

      if (ultimaPostulacionUpdateEl) {
        if (total > 0) {
          const fechas = list
            .map((p) => p.fecha_inicio)
            .filter(Boolean)
            .map((value) => new Date(value))
            .filter((date) => !Number.isNaN(date.getTime()));
          const latestDate = fechas.sort((a, b) => b - a)[0];
          ultimaPostulacionUpdateEl.textContent = latestDate
            ? `Última: ${formatDateTime(latestDate)}`
            : "Última: —";
        } else {
          ultimaPostulacionUpdateEl.textContent = "Todavía no hiciste postulaciones.";
        }
      }
    } catch (error) {
      console.error(error);
      if (totalPostulacionesEl) totalPostulacionesEl.textContent = "0";
      if (ultimaPostulacionUpdateEl) {
        ultimaPostulacionUpdateEl.textContent = "Última: —";
      }
    }
  };

  const fetchCatalogoData = async () => {
    try {
      const response = await fetch("../api/catalogo.php");
      if (!response.ok) {
        throw new Error("No se pudo cargar el catálogo.");
      }
      const mascotas = await response.json();
      const totalActivas = Array.isArray(mascotas) ? mascotas.length : 0;
      if (totalMascotasActivasEl) {
        totalMascotasActivasEl.textContent = totalActivas;
      }
    } catch (error) {
      console.error(error);
      if (totalMascotasActivasEl) {
        totalMascotasActivasEl.textContent = "0";
      }
    }
  };

  const renderNotifications = (notificaciones) => {
    if (!notifList) {
      return;
    }
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
      notifList.innerHTML = '<div class="text-muted small">Sin notificaciones por ahora.</div>';
      return;
    }

    const html = notificaciones
      .map((notif) => {
        const title = escapeHtml(notif.titulo || "Notificación");
        const body = escapeHtml(notif.cuerpo || "");
        const time = formatDateTime(notif.created_at);
        const unreadClass = notif.leida_at ? "" : " unread";
        return `
          <div class="notification-item${unreadClass}" data-notif-id="${notif.id}">
            <div class="notification-header">
              <div class="fw-semibold">${title}</div>
              ${notif.leida_at ? "" : '<span class="notification-pill">Nueva</span>'}
            </div>
            ${body ? `<div class="small text-muted">${body}</div>` : ""}
            <div class="notification-meta">${time}</div>
          </div>
        `;
      })
      .join("");

    notifList.innerHTML = html;
  };

  const renderActividad = (notificaciones) => {
    if (!actividadList) {
      return;
    }
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
      actividadList.innerHTML = '<li class="activity-item text-muted">Sin actividad reciente.</li>';
      return;
    }

    const html = notificaciones.slice(0, 3).map((notif) => {
      const icon = getIconForNotif(notif.tipo);
      const texto = escapeHtml(notif.cuerpo || notif.titulo || "Actividad");
      const time = formatDateTime(notif.created_at);
      return `
        <li class="activity-item">
          <span><i class="bi ${icon} text-warning me-2"></i>${texto}</span>
          <span class="activity-time">${time}</span>
        </li>
      `;
    });

    actividadList.innerHTML = html.join("");
  };

  const fetchNotificaciones = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        fetch("../api/notificaciones.php?count=1", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("../api/notificaciones.php?limit=6", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);

      if (handleUnauthorized(countRes) || handleUnauthorized(listRes)) {
        return;
      }
      if (countRes.ok && notifBadge) {
        const countData = await countRes.json();
        const unread = countData.unread || 0;
        if (unread > 0) {
          notifBadge.textContent = unread;
          notifBadge.classList.remove("d-none");
        } else {
          notifBadge.classList.add("d-none");
        }
      }

      if (listRes.ok) {
        const notificaciones = await listRes.json();
        renderNotifications(notificaciones);
        renderActividad(notificaciones);
      } else {
        if (notifList) {
          notifList.innerHTML = '<div class="text-muted small">No se pudieron cargar las notificaciones.</div>';
        }
        if (actividadList) {
          actividadList.innerHTML = '<li class="activity-item text-muted">Sin actividad reciente.</li>';
        }
      }
    } catch (error) {
      console.error(error);
      if (notifList) {
        notifList.innerHTML = '<div class="text-muted small">No se pudieron cargar las notificaciones.</div>';
      }
      if (actividadList) {
        actividadList.innerHTML = '<li class="activity-item text-muted">Sin actividad reciente.</li>';
      }
    }
  };

  const marcarNotificaciones = async (ids) => {
    try {
      const response = await fetch("../api/notificaciones.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error("No se pudieron marcar las notificaciones.");
      }
      await fetchNotificaciones();
    } catch (error) {
      console.error(error);
      if (typeof showToast === "function") {
        showToast("No se pudieron marcar las notificaciones.", "danger");
      }
    }
  };

  if (markAllNotifBtn) {
    markAllNotifBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("../api/notificaciones.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ mark_all: true }),
        });

        if (!response.ok) {
          throw new Error("No se pudieron marcar las notificaciones.");
        }

        if (typeof showToast === "function") {
          showToast("Notificaciones marcadas como leídas.", "success");
        }
        await fetchNotificaciones();
      } catch (error) {
        console.error(error);
        if (typeof showToast === "function") {
          showToast("No se pudieron marcar las notificaciones.", "danger");
        }
      }
    });
  }

  if (notifList) {
    notifList.addEventListener("click", async (event) => {
      const item = event.target.closest(".notification-item");
      if (!item || !item.classList.contains("unread")) {
        return;
      }
      const notifId = item.getAttribute("data-notif-id");
      if (!notifId) {
        return;
      }
      await marcarNotificaciones([parseInt(notifId, 10)]);
    });
  }

  fetchUsuarioData();
  fetchPostulacionesData();
  fetchCatalogoData();
  fetchNotificaciones();
});
