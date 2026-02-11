document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const tipo = localStorage.getItem("tipo");
  const nombreAdminSpan = document.getElementById("nombreAdmin");
  const bienvenidaH2 = document.getElementById("bienvenidaAdmin");
  const totalUsuariosEl = document.getElementById("adminTotalUsuarios");
  const totalOngsEl = document.getElementById("adminTotalOngs");
  const totalMascotasBorradasEl = document.getElementById("adminTotalMascotasBorradas");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markAllNotifBtn = document.getElementById("markAllNotif");

  if (!token || tipo !== "admin") {
    if (typeof showToast === "function") {
      showToast("⚠️ Debes iniciar sesión como Administrador para acceder a esta página.", "danger");
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

  const parsePayload = (payload) => {
    if (!payload) return null;
    if (typeof payload === "object") return payload;
    if (typeof payload !== "string") return null;
    try {
      return JSON.parse(payload);
    } catch (error) {
      return null;
    }
  };

  const getIconForNotif = (tipoNotif) => {
    const type = (tipoNotif || "").toLowerCase();
    if (type.includes("comentario")) return "bi-chat-left-dots";
    if (type.includes("mensaje") || type.includes("message") || type.includes("lost_found")) return "bi-chat-left-dots";
    if (type.includes("estado")) return "bi-check-circle";
    if (type.includes("postul")) return "bi-envelope";
    return "bi-heart-fill";
  };

  const buildNotificationLink = (notif) => {
    const tipoNotif = (notif.tipo || "").toLowerCase();
    const entidadTipo = (notif.entidad_tipo || "").toLowerCase();
    const payload = parsePayload(notif.payload) || {};
    const adopcionId = payload.adopcion_id || (entidadTipo === "adopcion" ? notif.entidad_id : null);
    const mascotaId = payload.mascota_id || (entidadTipo === "mascota" ? notif.entidad_id : null);
    const lostFoundId =
      payload.lost_found_id || payload.post_id || (entidadTipo === "lost_found" ? notif.entidad_id : null);

    if (entidadTipo === "ong" || tipoNotif.includes("ong")) {
      return "gestionar-ongs.html";
    }
    if (entidadTipo === "usuario" || tipoNotif.includes("usuario")) {
      return "gestionar-usuarios.html";
    }
    if (entidadTipo === "vacuna" || tipoNotif.includes("vacuna")) {
      return "gestionar-vacunas.html";
    }
    if (entidadTipo === "adopcion" || tipoNotif.includes("postul") || tipoNotif.includes("estado")) {
      return adopcionId ? `postulaciones.html?adopcion=${encodeURIComponent(adopcionId)}` : "postulaciones.html";
    }
    if (entidadTipo === "lost_found" || tipoNotif.includes("lost_found") || tipoNotif.includes("mensaje") || tipoNotif.includes("message")) {
      return lostFoundId ? `lost_found_detail.html?id=${encodeURIComponent(lostFoundId)}` : "lost_found.html";
    }
    if (entidadTipo === "mascota" || tipoNotif.includes("mascota")) {
      return mascotaId ? `detalle-mascota.html?id=${encodeURIComponent(mascotaId)}` : "catalogo.html";
    }
    return "";
  };

  const setStat = (element, value, fallback = "--") => {
    if (!element) return;
    const safeValue = value === null || value === undefined ? fallback : value;
    element.textContent = safeValue;
  };

  const fetchAdminData = async () => {
    try {
      const response = await fetch("../api/perfil-admin.php", {
        headers: { Authorization: "Bearer " + token },
      });

      if (handleUnauthorized(response)) {
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cargar los datos del administrador.");
      }

      const admin = await response.json();
      if (admin.nombre && nombreAdminSpan) {
        nombreAdminSpan.textContent = admin.nombre;
      }
      if (bienvenidaH2) {
        bienvenidaH2.textContent = "¡Bienvenido!";
      }

      const stats = admin.stats || {};
      setStat(totalUsuariosEl, stats.usuarios ?? 0);
      setStat(totalOngsEl, stats.ongs ?? 0);
      setStat(totalMascotasBorradasEl, stats.mascotas_archivadas ?? 0);
    } catch (error) {
      console.error(error);
      if (nombreAdminSpan) {
        nombreAdminSpan.textContent = "Error al cargar";
      }
      setStat(totalUsuariosEl, 0);
      setStat(totalOngsEl, 0);
      setStat(totalMascotasBorradasEl, 0);
    }
  };

  const renderNotifications = (notificaciones) => {
    if (!notifList) {
      return;
    }
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
        const link = buildNotificationLink(notif);
        const tag = link ? "a" : "div";
        const linkClass = link ? " notification-link" : "";
        const hrefAttr = link ? ` href=\"${link}\"` : "";
        return `
          <${tag}${hrefAttr} class="notification-item${unreadClass}${linkClass}" data-notif-id="${notif.id}">
            <div class="notification-header">
              <div class="fw-semibold">${title}</div>
              ${notif.leida_at ? "" : "<span class=\"notification-pill\">Nueva</span>"}
            </div>
            ${body ? `<div class="small text-muted">${body}</div>` : ""}
            <div class="notification-meta">${time}</div>
          </${tag}>
        `;
      })
      .join("");

    notifList.innerHTML = html;
  };

  const fetchNotificaciones = async () => {
    if (!notifBadge && !notifList) {
      return;
    }
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
        if (notifBadge) {
          if (unread > 0) {
            notifBadge.textContent = unread;
            notifBadge.classList.remove("d-none");
          } else {
            notifBadge.classList.add("d-none");
          }
        }
      }

      if (listRes.ok) {
        const notificaciones = await listRes.json();
        renderNotifications(notificaciones);
      } else if (notifList) {
        notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
      }
    } catch (error) {
      console.error(error);
      if (notifList) {
        notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
      }
    }
  };

  const marcarNotificaciones = async (ids, options = {}) => {
    try {
      const response = await fetch("../api/notificaciones.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ ids }),
        ...options,
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
      if (!item) {
        return;
      }
      const notifId = item.getAttribute("data-notif-id");
      const isUnread = item.classList.contains("unread");
      const link = item.getAttribute("href");
      const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1;
      if (!notifId || !isUnread) {
        return;
      }
      if (link && !isModifiedClick) {
        event.preventDefault();
        await marcarNotificaciones([parseInt(notifId, 10)]);
        window.location.href = link;
        return;
      }
      marcarNotificaciones([parseInt(notifId, 10)], { keepalive: true });
    });
  }

  fetchAdminData();
  fetchNotificaciones();
});
