document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") {
      showToast("Debes iniciar sesión para acceder a este módulo.", "warning");
    }
    window.location.href = "login.html";
    return;
  }

  const detailContainer = document.getElementById("lostFoundDetail");
  const matchesList = document.getElementById("matchesList");
  const matchesLoading = document.getElementById("matchesLoading");
  const matchesEmpty = document.getElementById("matchesEmpty");
  const messagesList = document.getElementById("messagesList");
  const messagesLoading = document.getElementById("messagesLoading");
  const messagesEmpty = document.getElementById("messagesEmpty");
  const messagesNotice = document.getElementById("messagesNotice");
  const messageForm = document.getElementById("messageForm");
  const messageText = document.getElementById("messageText");
  const messageRecipientGroup = document.getElementById("messageRecipientGroup");
  const messageRecipientSelect = document.getElementById("messageRecipient");
  const mapSection = document.getElementById("mapa-section");
  const mapCollapse = document.getElementById("mapa-collapse");
  const mapNote = document.getElementById("lost-map-note");
  let mapInstance = null;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  if (!postId) {
    if (detailContainer) {
      detailContainer.innerHTML = '<div class="lost-found-empty">Falta el ID del post.</div>';
    }
    return;
  }

  const messageContext = {
    isOwner: false,
    canMessage: true,
  };

  const safeText = (value) => String(value ?? "");

  const resolvePhoto = (value) => {
    if (!value) return "../img/mascotas/default.jpg";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
    if (value.startsWith("../")) return value;
    return `../${value}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  const formatSize = (value) => {
    switch ((value || "").toString().toLowerCase()) {
      case "small":
        return "Pequeño";
      case "medium":
        return "Mediano";
      case "large":
        return "Grande";
      default:
        return value ? safeText(value) : "";
    }
  };

  const renderDetail = (post) => {
    if (!detailContainer) return;
    const colorsRaw = post.colors || "";
    const colors = colorsRaw
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);
    const colorBadges = colors.length
      ? colors.map((color) => `<span class="lost-tag">${safeText(color)}</span>`).join("")
      : "<span class=\"lost-tag lost-tag-muted\">Sin colores</span>";

    const typeLabel = post.type === "LOST" ? "Perdida" : "Encontrada";
    const petName = post.pet_name ? safeText(post.pet_name) : "Mascota";

    const photoUrl = resolvePhoto(post.photo_url);
    let resolveAction = "";
    if (post.is_owner) {
      if ((post.status || "").toUpperCase() === "RESOLVED") {
        resolveAction = `
          <span class="btn btn-success btn-sm disabled" aria-disabled="true">
            <i class="bi bi-check-circle"></i> Resuelto
          </span>
        `;
      } else {
        const resolveLabel = post.type === "FOUND" ? "Ya está con su dueño" : "Ya apareció";
        resolveAction = `
          <button type="button" class="btn btn-success btn-sm" id="lostFoundResolve">
            <i class="bi bi-check-circle"></i> ${resolveLabel}
          </button>
        `;
      }
    }

    const ownerActions = post.is_owner
      ? `
          <div class="lost-detail-actions">
            <a href="lost_found_edit.html?id=${post.id}" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-pencil-square"></i> Editar
            </a>
            ${resolveAction}
            <button type="button" class="btn btn-outline-danger btn-sm" id="lostFoundDelete">
              <i class="bi bi-trash"></i> Borrar
            </button>
          </div>
        `
      : "";

    detailContainer.innerHTML = `
      <article class="lost-detail-card">
        <div class="lost-detail-card__photo">
          <a href="${photoUrl}" target="_blank" rel="noopener noreferrer" class="lost-detail-card__photo-link">
            <img src="${photoUrl}" alt="${petName}">
            <span class="lost-detail-card__zoom" aria-hidden="true">
              <i class="bi bi-search"></i>
            </span>
          </a>
          <span class="lost-badge lost-badge--${post.type === "LOST" ? "lost" : "found"}">${typeLabel}</span>
        </div>
        <div class="lost-detail-card__body">
          <h2>${petName}</h2>
          <p class="lost-card__meta">
            ${safeText(post.species || "")}
            ${post.breed ? `· ${safeText(post.breed)}` : ""}
            ${post.size ? `· ${formatSize(post.size)}` : ""}
          </p>
          <p class="lost-card__location"><i class="bi bi-geo-alt"></i> ${safeText(post.location_text || "")}</p>
          <p class="lost-card__date">Fecha vista: ${formatDate(post.date_seen)}</p>
          ${post.description ? `<p class="lost-detail-card__desc">${safeText(post.description)}</p>` : ""}
          <div class="lost-card__tags">${colorBadges}</div>
          ${ownerActions}
        </div>
      </article>
    `;
  };

  const initMap = (lat, lon) => {
    if (!window.L || !mapSection) return;
    const coords = [parseFloat(lat), parseFloat(lon)];
    if (coords.some((value) => Number.isNaN(value))) return;

    if (!mapInstance) {
      mapInstance = L.map("map").setView(coords, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapInstance);
      L.marker(coords).addTo(mapInstance);
    } else {
      mapInstance.setView(coords, 14);
    }

    mapSection.classList.remove("d-none");
  };

  if (mapCollapse) {
    mapCollapse.addEventListener("shown.bs.collapse", () => {
      if (mapInstance) {
        setTimeout(() => mapInstance.invalidateSize(), 60);
      }
    });
  }
  const scrollMapIntoView = () => {
    if (!mapSection) return;
    mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderMatches = (items) => {
    if (!matchesList) return;
    matchesList.innerHTML = "";
    if (!Array.isArray(items) || items.length === 0) {
      if (matchesEmpty) matchesEmpty.classList.remove("d-none");
      return;
    }
    if (matchesEmpty) matchesEmpty.classList.add("d-none");

    const scoreHint =
      "Score (máx 11): +3 especie, +2 raza, +3 colores, +1 tamaño, +2 ubicación, +2 fecha.";
    const getScoreLevel = (score) => {
      if (score >= 8) return "Alto";
      if (score >= 4) return "Medio";
      return "Bajo";
    };

    items.forEach((match) => {
      const summary = match.summary || {};
      const species = safeText(summary.species || "Mascota");
      const breed = summary.breed ? safeText(summary.breed) : "";
      const colors = Array.isArray(summary.colors) ? summary.colors : [];
      const colorsText = colors.map((color) => safeText(color)).join(", ");
      const location = safeText(summary.location_text || "");
      const dateText = formatDate(summary.date_seen);
      const reasons = Array.isArray(match.reasons) ? match.reasons : [];
      const reasonsHtml = reasons.length
        ? `<ul class="lost-reasons">${reasons.map((reason) => `<li>${safeText(reason)}</li>`).join("")}</ul>`
        : "";

      const summaryParts = [species, breed].filter(Boolean).join(" · ");

      const card = `
        <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
          <div class="pet-card h-100">
            <div class="pet-image">
              <span class="pet-badge status-found" data-score-tooltip="true" data-bs-toggle="tooltip"
                data-bs-placement="top" title="${scoreHint} Nivel: ${getScoreLevel(match.score)}.">Score ${match.score}</span>
              <img class="pet-photo" src="${resolvePhoto(summary.photo_url)}" alt="${species}">
            </div>
            <div class="card-body">
              <h5 class="fw-bold">${species}</h5>
              <p class="pet-summary mb-3">${summaryParts || "Sin detalles cargados."}</p>
              <div class="pet-meta mb-3">
                <span><i class="bi bi-geo-alt"></i> ${location || "Ubicación pendiente"}</span>
                <span><i class="bi bi-calendar-event"></i> Fecha vista: ${dateText}</span>
                ${colorsText ? `<span><i class="bi bi-palette"></i> ${colorsText}</span>` : ""}
              </div>
              ${reasonsHtml}
              <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center">
                <a href="lost_found_detail.html?id=${match.postId}" class="btn btn-dark btn-sm">Ver detalle</a>
              </div>
            </div>
          </div>
        </div>
      `;

      matchesList.insertAdjacentHTML("beforeend", card);
    });

    if (window.bootstrap && typeof window.bootstrap.Tooltip === "function") {
      document.querySelectorAll("[data-score-tooltip]").forEach((el) => {
        const existing = window.bootstrap.Tooltip.getInstance(el);
        if (existing) {
          existing.dispose();
        }
        new window.bootstrap.Tooltip(el);
      });
    }
  };

  const renderMessages = (items) => {
    if (!messagesList) return;
    messagesList.innerHTML = "";
    if (!Array.isArray(items) || items.length === 0) {
      if (messagesEmpty) messagesEmpty.classList.remove("d-none");
      return;
    }
    if (messagesEmpty) messagesEmpty.classList.add("d-none");

    items.forEach((message) => {
      const sender = safeText(message.sender_name || "Usuario");
      const meta = `${sender} · ${formatDateTime(message.created_at)}`;
      const body = safeText(message.message || "").replace(/\n/g, "<br>");

      const itemHtml = `
        <div class="comment-item">
          <div class="comment-item-meta">${meta}</div>
          <div class="comment-item-body">${body}</div>
        </div>
      `;

      messagesList.insertAdjacentHTML("beforeend", itemHtml);
    });
  };

  const setMessageAvailability = (canSend, noticeText = "") => {
    if (messageText) {
      messageText.disabled = !canSend;
    }
    if (messageForm) {
      const submitBtn = messageForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = !canSend;
    }
    if (messagesNotice) {
      if (noticeText) {
        messagesNotice.textContent = noticeText;
        messagesNotice.classList.remove("d-none");
      } else {
        messagesNotice.classList.add("d-none");
      }
    }
  };

  const setupRecipients = (participants = []) => {
    if (!messageRecipientGroup || !messageRecipientSelect) return;

    if (!messageContext.isOwner) {
      if (messageForm) messageForm.classList.remove("d-none");
      messageRecipientGroup.classList.add("d-none");
      return;
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      if (messageForm) messageForm.classList.add("d-none");
      messageRecipientGroup.classList.add("d-none");
      setMessageAvailability(false, "Todavía no hay mensajes para responder.");
      return;
    }

    if (messageForm) messageForm.classList.remove("d-none");
    messageRecipientGroup.classList.remove("d-none");
    messageRecipientSelect.innerHTML = `<option value="">Seleccionar</option>${participants
      .map((user) => `<option value="${user.id}">${safeText(user.name)}</option>`)
      .join("")}`;
    setMessageAvailability(true);
  };

  const fetchDetail = async () => {
    try {
      const response = await fetch(`../api/lost_found_get.php?id=${postId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar el post.");
      }
      const data = await response.json();
      renderDetail(data);
      if (data?.is_owner) {
        const deleteBtn = document.getElementById("lostFoundDelete");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("¿Seguro que querés borrar esta publicación?");
            if (!confirmed) return;

            deleteBtn.disabled = true;
            deleteBtn.textContent = "Borrando...";

            try {
              const response = await fetch("../api/lost_found_delete.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token,
                },
                body: JSON.stringify({ id: postId }),
              });
              const result = await response.json();
              if (!response.ok) {
                throw new Error(result.message || "No se pudo borrar la publicación.");
              }
              if (typeof showToast === "function") {
                showToast("Publicación eliminada.", "success");
              }
              window.location.href = "lost_found.html";
            } catch (error) {
              if (typeof showToast === "function") {
                showToast(error.message, "danger");
              }
              deleteBtn.disabled = false;
              deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Borrar';
            }
          });
        }

        const resolveBtn = document.getElementById("lostFoundResolve");
        if (resolveBtn) {
          resolveBtn.addEventListener("click", async () => {
            const message =
              data.type === "FOUND"
                ? "¿Confirmás que la mascota ya está con su dueño?"
                : "¿Confirmás que la mascota ya apareció?";
            const confirmed = window.confirm(message);
            if (!confirmed) return;

            resolveBtn.disabled = true;
            resolveBtn.textContent = "Marcando...";

            try {
              const response = await fetch("../api/lost_found_resolve.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token,
                },
                body: JSON.stringify({ id: postId }),
              });
              const result = await response.json();
              if (!response.ok) {
                throw new Error(result.message || "No se pudo actualizar la publicación.");
              }
              if (typeof showToast === "function") {
                showToast("Publicación marcada como resuelta.", "success");
              }
              await fetchDetail();
            } catch (error) {
              if (typeof showToast === "function") {
                showToast(error.message, "danger");
              }
              resolveBtn.disabled = false;
              resolveBtn.innerHTML = `<i class="bi bi-check-circle"></i> ${
                data.type === "FOUND" ? "Ya está con su dueño" : "Ya apareció"
              }`;
            }
          });
        }
      }
      if (mapSection) {
        const normalizedType = String(data?.type ?? "")
          .trim()
          .toUpperCase();
        const isFound = normalizedType === "FOUND";
        mapSection.classList.toggle("d-none", !isFound);

        if (isFound) {
          const mapEl = document.getElementById("map");
          const mapToggle = mapSection.querySelector("[data-bs-target='#mapa-collapse']");
          const hasCoords = data.lat !== null && data.lon !== null;

          if (mapEl) {
            mapEl.style.display = hasCoords ? "block" : "none";
          }

          if (mapNote) {
            if (hasCoords) {
              mapNote.textContent = "";
              mapNote.classList.add("d-none");
            } else {
              mapNote.textContent = "No hay coordenadas para mostrar el mapa.";
              mapNote.classList.remove("d-none");
            }
          }

          if (hasCoords) {
            initMap(data.lat, data.lon);
            if (mapCollapse && window.bootstrap) {
              const collapseInstance =
                window.bootstrap.Collapse.getOrCreateInstance(mapCollapse, { toggle: false });
              collapseInstance.show();
            } else if (mapCollapse) {
              mapCollapse.classList.add("show");
            }
            if (mapToggle) {
              mapToggle.setAttribute("aria-expanded", "true");
            }
            setTimeout(scrollMapIntoView, 250);
          } else {
            if (mapCollapse) {
              if (window.bootstrap) {
                const collapseInstance =
                  window.bootstrap.Collapse.getOrCreateInstance(mapCollapse, { toggle: false });
                collapseInstance.hide();
              } else {
                mapCollapse.classList.remove("show");
              }
            }
            if (mapToggle) {
              mapToggle.setAttribute("aria-expanded", "false");
            }
          }
        }
      }
    } catch (error) {
      if (detailContainer) {
        detailContainer.innerHTML = `<div class="lost-found-empty text-danger">${safeText(error.message)}</div>`;
      }
    }
  };

  const fetchMatches = async () => {
    if (matchesLoading) matchesLoading.classList.remove("d-none");
    try {
      const response = await fetch(`../api/lost_found_matches.php?id=${postId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las coincidencias.");
      }
      const data = await response.json();
      renderMatches(data.matches || []);
    } catch (error) {
      if (matchesList) {
        matchesList.innerHTML = `<div class="col-12"><p class="text-center text-danger">${safeText(error.message)}</p></div>`;
      }
    } finally {
      if (matchesLoading) matchesLoading.classList.add("d-none");
    }
  };

  const fetchMessages = async () => {
    if (messagesLoading) messagesLoading.classList.remove("d-none");
    try {
      const response = await fetch(`../api/lost_found_messages.php?post_id=${postId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los mensajes.");
      }
      const data = await response.json();
      messageContext.isOwner = Boolean(data.isOwner);
      messageContext.canMessage = data.canMessage !== false;
      renderMessages(data.messages || []);
      setupRecipients(data.participants || []);

      if (!messageContext.canMessage) {
        setMessageAvailability(false, "Esta publicación no tiene un usuario asociado.");
      } else if (!messageContext.isOwner) {
        setMessageAvailability(true);
      }
    } catch (error) {
      if (messagesList) {
        messagesList.innerHTML = `<div class="text-center text-danger">${safeText(error.message)}</div>`;
      }
      setMessageAvailability(false);
    } finally {
      if (messagesLoading) messagesLoading.classList.add("d-none");
    }
  };

  if (messageForm) {
    messageForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = messageText ? messageText.value.trim() : "";
      if (!text) {
        if (typeof showToast === "function") {
          showToast("Escribí un mensaje antes de enviar.", "warning");
        }
        return;
      }

      const payload = {
        post_id: parseInt(postId, 10),
        message: text,
      };

      if (messageContext.isOwner) {
        const recipientId = messageRecipientSelect ? parseInt(messageRecipientSelect.value, 10) : NaN;
        if (!recipientId) {
          if (typeof showToast === "function") {
            showToast("Seleccioná un destinatario.", "warning");
          }
          return;
        }
        payload.recipient_id = recipientId;
      }

      const submitBtn = messageForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
      }

      try {
        const response = await fetch("../api/lost_found_messages.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "No se pudo enviar el mensaje.");
        }

        if (typeof showToast === "function") {
          showToast("Mensaje enviado.", "success");
        }
        if (messageText) {
          messageText.value = "";
        }
        await fetchMessages();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message, "danger");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar mensaje";
        }
      }
    });
  }

  fetchDetail();
  fetchMatches();
  fetchMessages();
});
