document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const tipo = localStorage.getItem("tipo");

  const nombreOngSpan = document.getElementById("nombreOng");
  const bienvenidaH2 = document.getElementById("bienvenidaOng");
  const totalMascotasEl = document.getElementById("totalMascotas");
  const totalMascotasActivasEl = document.getElementById("totalMascotasActivas");
  const ultimaMascotaUpdateEl = document.getElementById("ultimaMascotaUpdate");
  const totalPostulacionesEl = document.getElementById("totalPostulaciones");
  const ultimaPostulacionUpdateEl = document.getElementById("ultimaPostulacionUpdate");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markAllNotifBtn = document.getElementById("markAllNotif");
  const actividadList = document.getElementById("actividadList");

  if (!token || tipo !== "ong") {
    showToast("⚠️ Debes iniciar sesión como ONG para acceder a esta página.", "danger");
    window.location.href = "login.html";
    return;
  }

  const handleUnauthorized = (response) => {
    if (response && response.status === 401) {
      if (!window.__pawtasticAuthExpired) {
        window.__pawtasticAuthExpired = true;
        showToast("Tu sesión expiró. Volvé a iniciar sesión.", "warning");
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

  const fetchOngData = async () => {
    try {
      const response = await fetch("../api/perfil-ong.php", {
        headers: { Authorization: "Bearer " + token },
      });

      if (handleUnauthorized(response)) {
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cargar los datos de la ONG.");
      }

      const ong = await response.json();
      if (ong.nombre) {
        nombreOngSpan.textContent = ong.nombre;
      }
    } catch (error) {
      console.error(error);
      nombreOngSpan.textContent = "Error al cargar";
    }
  };

  const fetchMascotasData = async () => {
    try {
      const response = await fetch("../api/get_mascota.php?include_adoptadas=1&include_archivadas=1", {
        headers: { Authorization: "Bearer " + token },
      });
      if (handleUnauthorized(response)) {
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudieron cargar las mascotas.");
      }
      const mascotas = await response.json();
      const total = Array.isArray(mascotas) ? mascotas.length : 0;
      const activas = Array.isArray(mascotas)
        ? mascotas.filter((m) => parseInt(m.estado, 10) === 1).length
        : 0;
      totalMascotasEl.textContent = total;
      if (totalMascotasActivasEl) {
        totalMascotasActivasEl.textContent = activas;
      }

      if (total > 0) {
        const fechas = mascotas
          .map((m) => m.date_publicacion)
          .filter(Boolean)
          .map((value) => new Date(value))
          .filter((date) => !Number.isNaN(date.getTime()));
        const latestDate = fechas.sort((a, b) => b - a)[0];
        ultimaMascotaUpdateEl.textContent = `Última actualización: ${formatDate(latestDate)}`;
      } else {
        ultimaMascotaUpdateEl.textContent = "Última actualización: —";
      }
    } catch (error) {
      console.error(error);
      totalMascotasEl.textContent = "0";
      if (totalMascotasActivasEl) {
        totalMascotasActivasEl.textContent = "0";
      }
      ultimaMascotaUpdateEl.textContent = "Última actualización: —";
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
      const total = Array.isArray(postulaciones) ? postulaciones.length : 0;
      totalPostulacionesEl.textContent = total;

      if (total > 0) {
        const fechas = postulaciones
          .map((p) => p.fecha_inicio)
          .filter(Boolean)
          .map((value) => new Date(value))
          .filter((date) => !Number.isNaN(date.getTime()));
        const latestDate = fechas.sort((a, b) => b - a)[0];
        ultimaPostulacionUpdateEl.textContent = `Última: ${formatDateTime(latestDate)}`;
      } else {
        ultimaPostulacionUpdateEl.textContent = "Última: —";
      }
    } catch (error) {
      console.error(error);
      totalPostulacionesEl.textContent = "0";
      ultimaPostulacionUpdateEl.textContent = "Última: —";
    }
  };

  const renderNotifications = (notificaciones) => {
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
      notifList.innerHTML = "<div class=\"text-muted small\">Sin notificaciones por ahora.</div>";
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
              ${notif.leida_at ? "" : "<span class=\"notification-pill\">Nueva</span>"}
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
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
      actividadList.innerHTML = "<li class=\"activity-item text-muted\">Sin actividad reciente.</li>";
      return;
    }

    const html = notificaciones.slice(0, 2).map((notif) => {
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
      if (countRes.ok) {
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
        notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
        actividadList.innerHTML = "<li class=\"activity-item text-muted\">Sin actividad reciente.</li>";
      }
    } catch (error) {
      console.error(error);
      notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
      actividadList.innerHTML = "<li class=\"activity-item text-muted\">Sin actividad reciente.</li>";
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
      showToast("No se pudieron marcar las notificaciones.", "danger");
    }
  };

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

      showToast("Notificaciones marcadas como leídas.", "success");
      await fetchNotificaciones();
    } catch (error) {
      console.error(error);
      showToast("No se pudieron marcar las notificaciones.", "danger");
    }
  });

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

  fetchOngData();
  fetchMascotasData();
  fetchPostulacionesData();
  fetchNotificaciones();
});
