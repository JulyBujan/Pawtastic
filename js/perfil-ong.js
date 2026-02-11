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
  const ongLogoImg = document.getElementById("ongLogo");
  const ongLogoInput = document.getElementById("ongLogoInput");
  const ongLogoTrigger = document.getElementById("ongLogoTrigger");
  const ongPerfilNombre = document.getElementById("ongPerfilNombre");
  const ongPerfilRazon = document.getElementById("ongPerfilRazon");
  const ongPerfilCuit = document.getElementById("ongPerfilCuit");
  const ongPerfilEmail = document.getElementById("ongPerfilEmail");
  const ongPerfilDireccion = document.getElementById("ongPerfilDireccion");
  const ongPerfilActualizacion = document.getElementById("ongPerfilActualizacion");

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

  const defaultLogoSrc = "../img/pdefault.jpg";

  const resolveLogoSrc = (logoUrl) => {
    if (!logoUrl) return defaultLogoSrc;
    if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
    if (logoUrl.startsWith("/")) return logoUrl;
    const cleanPath = logoUrl.replace(/^\.\//, "");
    return `../${cleanPath}`;
  };

  const setText = (element, value, fallback = "—") => {
    if (!element) return;
    const text = value === null || value === undefined || value === "" ? fallback : value;
    element.textContent = text;
  };

  const formatAddress = (ong) => {
    if (!ong) return "—";
    const road = ong.road || "";
    const number = parseInt(ong.house_number, 10);
    const safeNumber = Number.isNaN(number) || number <= 0 ? "" : String(number);
    const depto = ong.departamento ? `, Depto ${ong.departamento}` : "";
    const line = [road, safeNumber].filter(Boolean).join(" ");
    const area = [ong.suburb, ong.city].filter(Boolean).join(", ");
    const full = [line ? `${line}${depto}` : "", area].filter(Boolean).join(" • ");
    return full || "—";
  };

  if (ongLogoImg) {
    ongLogoImg.onerror = () => {
      ongLogoImg.src = defaultLogoSrc;
    };
  }

  const validateLogoFile = (file) => {
    if (!file) {
      return "Seleccioná una imagen.";
    }
    if (!file.type.startsWith("image/")) {
      return "El archivo debe ser una imagen.";
    }
    const maxSizeMb = 4;
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `La imagen no puede superar los ${maxSizeMb}MB.`;
    }
    return "";
  };

  const uploadOngLogo = async (file) => {
    const error = validateLogoFile(file);
    if (error) {
      showToast(error, "warning");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch("../api/perfil-ong.php", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el logo.");
      }

      if (data.logo_url && ongLogoImg) {
        ongLogoImg.src = resolveLogoSrc(data.logo_url);
      }
      showToast("Logo actualizado con éxito.", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo actualizar el logo.", "danger");
    } finally {
      if (ongLogoInput) {
        ongLogoInput.value = "";
      }
    }
  };

  if (ongLogoTrigger && ongLogoInput) {
    ongLogoTrigger.addEventListener("click", () => ongLogoInput.click());
  }

  if (ongLogoImg && ongLogoInput) {
    ongLogoImg.addEventListener("click", () => ongLogoInput.click());
  }

  if (ongLogoInput) {
    ongLogoInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        uploadOngLogo(file);
      }
    });
  }

  const getIconForNotif = (tipoNotif) => {
    const type = (tipoNotif || "").toLowerCase();
    if (type.includes("comentario")) return "bi-chat-left-dots";
    if (type.includes("mensaje") || type.includes("message") || type.includes("lost_found")) return "bi-chat-left-dots";
    if (type.includes("estado")) return "bi-check-circle";
    if (type.includes("postul")) return "bi-envelope";
    return "bi-heart-fill";
  };

  const buildNotificationLink = (notif) => {
    const tipo = (notif.tipo || "").toLowerCase();
    const entidadTipo = (notif.entidad_tipo || "").toLowerCase();
    const payload = parsePayload(notif.payload) || {};
    const adopcionId = payload.adopcion_id || (entidadTipo === "adopcion" ? notif.entidad_id : null);
    const mascotaId = payload.mascota_id || (entidadTipo === "mascota" ? notif.entidad_id : null);
    const lostFoundId = payload.lost_found_id || payload.post_id || (entidadTipo === "lost_found" ? notif.entidad_id : null);

    if (entidadTipo === "adopcion" || tipo.includes("postul") || tipo.includes("comentario") || tipo.includes("estado")) {
      return adopcionId ? `postulaciones.html?adopcion=${encodeURIComponent(adopcionId)}` : "postulaciones.html";
    }
    if (entidadTipo === "mascota" || tipo.includes("mascota") || tipo.includes("vacuna")) {
      return mascotaId ? `gestionar-mascota-cards.html?id=${encodeURIComponent(mascotaId)}` : "mis-mascotas.html";
    }
    if (entidadTipo === "lost_found" || tipo.includes("lost_found") || tipo.includes("mensaje") || tipo.includes("message")) {
      return lostFoundId ? `lost_found_detail.html?id=${encodeURIComponent(lostFoundId)}` : "lost_found.html";
    }
    return "";
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
      if (ong.nombre && nombreOngSpan) {
        nombreOngSpan.textContent = ong.nombre;
      }
      setText(ongPerfilNombre, ong.nombre);
      setText(ongPerfilRazon, ong.razon_social);
      setText(ongPerfilCuit, ong.cuit);
      setText(ongPerfilEmail, ong.email);
      setText(ongPerfilDireccion, formatAddress(ong));
      setText(ongPerfilActualizacion, formatDateTime(ong.ultima_actualizacion));
      if (ongLogoImg) {
        ongLogoImg.src = resolveLogoSrc(ong.logo_url);
      }
    } catch (error) {
      console.error(error);
      if (nombreOngSpan) {
        nombreOngSpan.textContent = "Error al cargar";
      }
      setText(ongPerfilNombre, "Error al cargar", "Error al cargar");
    }
  };

  const fetchMascotasData = async () => {
    if (!totalMascotasEl || !ultimaMascotaUpdateEl) {
      return;
    }
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
    if (!totalPostulacionesEl || !ultimaPostulacionUpdateEl) {
      return;
    }
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
        const hrefAttr = link ? ` href="${link}"` : "";
        const linkClass = link ? " notification-link" : "";
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

  const renderActividad = (notificaciones) => {
    if (!actividadList) {
      return;
    }
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
    if (!notifBadge && !notifList && !actividadList) {
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
        renderActividad(notificaciones);
      } else {
        if (notifList) {
          notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
        }
        if (actividadList) {
          actividadList.innerHTML = "<li class=\"activity-item text-muted\">Sin actividad reciente.</li>";
        }
      }
    } catch (error) {
      console.error(error);
      if (notifList) {
        notifList.innerHTML = "<div class=\"text-muted small\">No se pudieron cargar las notificaciones.</div>";
      }
      if (actividadList) {
        actividadList.innerHTML = "<li class=\"activity-item text-muted\">Sin actividad reciente.</li>";
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
      showToast("No se pudieron marcar las notificaciones.", "danger");
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

        showToast("Notificaciones marcadas como leídas.", "success");
        await fetchNotificaciones();
      } catch (error) {
        console.error(error);
        showToast("No se pudieron marcar las notificaciones.", "danger");
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

  fetchOngData();
  fetchMascotasData();
  fetchPostulacionesData();
  fetchNotificaciones();
});
