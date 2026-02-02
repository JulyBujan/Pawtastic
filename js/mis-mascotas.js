document.addEventListener("DOMContentLoaded", () => {
  const mascotasGrid = document.getElementById("mascotasGrid");
  const searchInput = document.getElementById("searchMascotas");
  const filterTipo = document.getElementById("filterTipo");
  const filterEstado = document.getElementById("filterEstado");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const paginationInfo = document.getElementById("paginationInfo");
  const pagination = document.getElementById("pagination");
  const statsActivas = document.getElementById("statsActivas");
  const statsPendientes = document.getElementById("statsPendientes");
  const statsAdoptadas = document.getElementById("statsAdoptadas");
  const deleteModalEl = document.getElementById("modalEliminarMascota");
  const confirmDeleteBtn = document.getElementById("confirmarEliminarMascota");

  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const notifDropdown = document.getElementById("notifDropdown");
  const markAllNotif = document.getElementById("markAllNotif");
  const hasNotifUi = Boolean(notifBadge || notifList || notifDropdown);

  const token = localStorage.getItem("token");

  let mascotasData = [];
  let filteredMascotas = [];
  let currentPage = 1;
  const pageSize = 8;
  let mascotaToDelete = null;

  if (!token) {
    if (mascotasGrid) {
      mascotasGrid.innerHTML =
        "<div class='col-12'><p class='text-danger text-center'>⚠️ Debes iniciar sesión para ver tus mascotas.</p></div>";
    }
    return;
  }

  const estadoLabel = (mascota) => {
    const value = parseInt(mascota.estado, 10);
    if (value === 1) return "Activa";
    if (value === 0) return "En revisión";
    if (value === 2) return "Adoptada";
    if (value === 3) return "Archivada";
    return "Activa";
  };

  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const estadoClass = (label) => {
    if (label === "Activa") return "status-active";
    if (label === "En revisión") return "status-pending";
    if (label === "Adoptada") return "status-adopted";
    if (label === "Archivada") return "status-archived";
    return "status-active";
  };

  const formatEdad = (mesesTotal) => {
    const total = parseInt(mesesTotal, 10);
    if (!total && total !== 0) return "Sin edad";
    const anos = Math.floor(total / 12);
    const meses = total % 12;
    const partes = [];
    if (anos > 0) {
      partes.push(`${anos} año${anos === 1 ? "" : "s"}`);
    }
    if (meses > 0 || partes.length === 0) {
      partes.push(`${meses} mes${meses === 1 ? "" : "es"}`);
    }
    return partes.join(" ");
  };

  const energiaLabel = (valor) => {
    const map = { 1: "baja", 2: "media", 3: "alta" };
    return map[parseInt(valor, 10)] || "media";
  };

  const buildMeta = (mascota) => {
    const items = [];
    if (mascota.vacunado === "si") {
      items.push({ icon: "bi-shield-check", text: "Vacunado" });
    }
    if (mascota.esterilizado === "si") {
      items.push({ icon: "bi-heart", text: "Esterilizado" });
    }
    if (parseInt(mascota.apto_ninos, 10) === 1) {
      items.push({ icon: "bi-emoji-smile", text: "Apto niños" });
    }
    if (items.length === 0) {
      items.push({ icon: "bi-info-circle", text: "Sin datos" });
    }
    return items.slice(0, 2);
  };

  const updateStats = () => {
    const counts = { Activa: 0, "En revisión": 0, Adoptada: 0 };
    mascotasData.forEach((mascota) => {
      const label = estadoLabel(mascota);
      counts[label] = (counts[label] || 0) + 1;
    });

    if (statsActivas) {
      statsActivas.textContent = `Activas: ${counts.Activa || 0}`;
    }
    if (statsPendientes) {
      statsPendientes.textContent = `En revisión: ${counts["En revisión"] || 0}`;
    }
    if (statsAdoptadas) {
      statsAdoptadas.textContent = `Adoptadas: ${counts.Adoptada || 0}`;
    }
  };

  const applyFilters = () => {
    const query = normalizeText((searchInput?.value || "").trim());
    const tipo = normalizeText(filterTipo?.value || "");
    const estado = normalizeText(filterEstado?.value || "");

    filteredMascotas = mascotasData.filter((mascota) => {
      const label = normalizeText(estadoLabel(mascota));
      const matchesQuery =
        !query ||
        normalizeText(mascota.nombre).includes(query) ||
        normalizeText(mascota.breed).includes(query) ||
        label.includes(query);

      const matchesTipo = !tipo || normalizeText(mascota.tipo) === tipo;
      const matchesEstado = !estado || label === estado;

      return matchesQuery && matchesTipo && matchesEstado;
    });

    currentPage = 1;
    renderPage();
  };

  const renderPagination = (totalItems) => {
    if (!pagination) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
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
      li.appendChild(link);
      return li;
    };

    pagination.innerHTML = "";
    pagination.appendChild(createPageItem(currentPage - 1, "Anterior", currentPage === 1));

    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pagination.appendChild(createPageItem(page, String(page), false, page === currentPage));
    }

    pagination.appendChild(createPageItem(currentPage + 1, "Siguiente", currentPage === totalPages));
  };

  const renderPage = () => {
    if (!mascotasGrid) return;
    mascotasGrid.innerHTML = "";

    if (!filteredMascotas || filteredMascotas.length === 0) {
      mascotasGrid.innerHTML =
        '<div class="col-12"><p class="text-center text-muted">No se encontraron mascotas con esos filtros.</p></div>';
      if (paginationInfo) {
        paginationInfo.textContent = "Mostrando 0 de 0 mascotas";
      }
      renderPagination(0);
      return;
    }

    const total = filteredMascotas.length;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const pageItems = filteredMascotas.slice(startIndex, endIndex);

    pageItems.forEach((mascota) => {
      const estado = estadoLabel(mascota);
      const estadoCss = estadoClass(estado);
      const edadTexto = formatEdad(mascota.edad);
      const energiaTexto = energiaLabel(mascota.energia);
      const sexoTexto = mascota.sexo || "";
      const metaItems = buildMeta(mascota);
      const metaHtml = metaItems
        .map((item) => `<span><i class="bi ${item.icon}"></i> ${item.text}</span>`)
        .join("");

      const card = `
        <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
          <div class="pet-card h-100">
            <div class="pet-image">
              <span class="pet-badge ${estadoCss}">${estado}</span>
              <img class="pet-photo" src="../img/mascotas/${mascota.imagen || "default.jpg"}" alt="${mascota.nombre}">
            </div>
            <div class="card-body">
              <h5 class="fw-bold">${mascota.nombre}</h5>
              <p class="pet-summary mb-3">${sexoTexto}, ${edadTexto}, <span class="pet-highlight">energía ${energiaTexto}</span>.</p>
              <div class="pet-meta mb-3">${metaHtml}</div>
              <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center">
                <a class="btn btn-outline-secondary btn-sm btn-icon" href="gestionar-mascota-cards.html?id=${mascota.id}" data-bs-toggle="tooltip" title="Editar">
                  <i class="bi bi-pencil"></i>
                </a>
                <a class="btn btn-dark btn-sm btn-icon" href="detalle-mascota.html?id=${mascota.id}" data-bs-toggle="tooltip" title="Ver perfil">
                  <i class="bi bi-eye"></i>
                </a>
                <button class="btn btn-outline-info btn-sm btn-icon" data-action="estimar" data-id="${mascota.id}" data-bs-toggle="tooltip" title="Estimar adopción">
                  <i class="bi bi-graph-up"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm btn-icon" data-action="eliminar" data-id="${mascota.id}" data-bs-toggle="tooltip" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      mascotasGrid.insertAdjacentHTML("beforeend", card);
    });

    if (paginationInfo) {
      paginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${total} mascotas`;
    }
    renderPagination(total);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle=\"tooltip\"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  };

  const fetchMascotas = async () => {
    try {
      const response = await fetch("../api/get_mascota.php?include_adoptadas=1", {
        headers: { Authorization: "Bearer " + token },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al cargar las mascotas");
      }

      const data = await response.json();
      mascotasData = Array.isArray(data) ? data : [];
      filteredMascotas = mascotasData;
      updateStats();
      renderPage();
    } catch (error) {
      if (mascotasGrid) {
        mascotasGrid.innerHTML = `<div class="col-12"><p class="text-center text-danger">${error.message}</p></div>`;
      }
    }
  };

  const setBadge = (count) => {
    if (!notifBadge) return;
    if (count > 0) {
      notifBadge.textContent = count;
      notifBadge.classList.remove("d-none");
    } else {
      notifBadge.textContent = "0";
      notifBadge.classList.add("d-none");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("es-AR");
  };

  const renderNotifications = (items) => {
    if (!notifList) return;
    notifList.innerHTML = "";
    if (!items || items.length === 0) {
      notifList.textContent = "Sin notificaciones.";
      return;
    }

    items.forEach((item) => {
      let payload = item.payload;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (error) {
          payload = null;
        }
      }
      const wrapper = document.createElement("div");
      wrapper.className = "notification-item" + (item.leida_at ? "" : " unread");
      wrapper.dataset.notifId = item.id;

      const header = document.createElement("div");
      header.className = "notification-header";

      const title = document.createElement("div");
      title.className = "fw-semibold";
      title.textContent = item.titulo;
      header.appendChild(title);

      if (!item.leida_at) {
        const pill = document.createElement("span");
        pill.className = "notification-pill";
        pill.textContent = "Nueva";
        header.appendChild(pill);
      }

      const body = document.createElement("div");
      body.className = "text-muted small";
      body.textContent = item.cuerpo;

      const meta = document.createElement("div");
      meta.className = "notification-meta";
      meta.textContent = formatDate(item.created_at);

      wrapper.append(header, body, meta);
      notifList.appendChild(wrapper);
    });
  };

  const fetchUnreadCount = async () => {
    if (!hasNotifUi) return;
    if (!token) {
      setBadge(0);
      return;
    }
    try {
      const response = await fetch("../api/notificaciones.php?count=1", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("Error al cargar el contador.");
      }
      const data = await response.json();
      setBadge(Number(data.unread) || 0);
    } catch (error) {
      setBadge(0);
    }
  };

  const fetchNotifications = async () => {
    if (!token) {
      if (notifList) {
        notifList.textContent = "Inicia sesión para ver notificaciones.";
      }
      return;
    }
    try {
      const response = await fetch("../api/notificaciones.php?limit=6", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("Error al cargar notificaciones.");
      }
      const data = await response.json();
      renderNotifications(data);
    } catch (error) {
      if (notifList) {
        notifList.textContent = "No se pudieron cargar las notificaciones.";
      }
    }
  };

  const marcarNotificaciones = async (ids) => {
    try {
      const response = await fetch("../api/notificaciones.php", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error("Error al marcar notificaciones.");
      }
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      if (notifList) {
        notifList.textContent = "No se pudieron actualizar las notificaciones.";
      }
    }
  };

  if (notifDropdown) {
    notifDropdown.addEventListener("show.bs.dropdown", () => {
      fetchNotifications();
      fetchUnreadCount();
    });
  }

  if (markAllNotif) {
    markAllNotif.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!token) return;
      try {
        const response = await fetch("../api/notificaciones.php", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mark_all: true }),
        });
        if (!response.ok) {
          throw new Error("Error al marcar notificaciones.");
        }
        fetchNotifications();
        fetchUnreadCount();
      } catch (error) {
        if (notifList) {
          notifList.textContent = "No se pudieron actualizar las notificaciones.";
        }
      }
    });
  }

  if (notifList) {
    notifList.addEventListener("click", (event) => {
      const item = event.target.closest(".notification-item");
      if (!item || !item.classList.contains("unread")) {
        return;
      }
      const notifId = item.dataset.notifId;
      if (notifId) {
        marcarNotificaciones([parseInt(notifId, 10)]);
      }
    });
  }

  if (pagination) {
    pagination.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-page]");
      if (!link) return;
      event.preventDefault();
      let page = parseInt(link.dataset.page, 10);
      if (!Number.isFinite(page) || page === currentPage) return;
      if (page < 1) page = 1;
      const totalPages = Math.max(1, Math.ceil((filteredMascotas || []).length / pageSize));
      if (page > totalPages) page = totalPages;
      currentPage = page;
      renderPage();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  if (filterTipo) {
    filterTipo.addEventListener("change", () => {
      applyFilters();
    });
  }

  if (filterEstado) {
    filterEstado.addEventListener("change", () => {
      applyFilters();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (filterTipo) filterTipo.value = "";
      if (filterEstado) filterEstado.value = "";
      applyFilters();
    });
  }

  if (mascotasGrid) {
    mascotasGrid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      const mascotaId = button.dataset.id;
      const mascota = mascotasData.find((item) => String(item.id) === String(mascotaId));

      if (action === "estimar" && mascota) {
        estimarAdopcion(mascota);
      }
      if (action === "eliminar" && mascotaId) {
        mascotaToDelete = mascotaId;
        if (deleteModalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
          modal.show();
        }
      }
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!mascotaToDelete) return;
      await eliminarMascota(mascotaToDelete);
      mascotaToDelete = null;
      if (deleteModalEl) {
        const modal = bootstrap.Modal.getInstance(deleteModalEl);
        if (modal) {
          modal.hide();
        }
      }
    });
  }

  if (hasNotifUi) {
    fetchUnreadCount();
  }
  fetchMascotas();

  if (hasNotifUi) {
    setInterval(() => {
      fetchUnreadCount();
    }, 30000);
  }
});

async function eliminarMascota(id) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`../api/gestionar_mascota.php?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    if (response.ok) {
      showToast("Mascota eliminada con éxito", "success");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar la mascota");
    }
  } catch (error) {
    showToast(error.message, "danger");
  }
}

async function estimarAdopcion(mascota) {
  const modalElementId = "predictionModal";
  let modalElement = document.getElementById(modalElementId);

  if (!modalElement) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="${modalElementId}" tabindex="-1" aria-labelledby="predictionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered prediction-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="predictionModalLabel">Estimación de Adopción</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="predictionModalBody">
              <p>Cargando estimación...</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `);
    modalElement = document.getElementById(modalElementId);
  }

  const modalBody = document.getElementById('predictionModalBody');
  const predictionModal = new bootstrap.Modal(modalElement);

  modalBody.innerHTML = '<div class="d-flex justify-content-center align-items-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><strong class="ms-3">Calculando...</strong></div>';
  predictionModal.show();

  const animaltype = mascota.tipo.toLowerCase() === 'perro' ? 1 : 0;
  const gender = mascota.sexo.toLowerCase() === 'macho' ? 1 : 0;

  const sizeMap = {
    'cachorro': 0, 'miniatura': 0,
    'pequeño': 1,
    'mediano': 2,
    'grande': 3,
    'muy grande': 4
  };
  const petsize = sizeMap[mascota.tamaño?.toLowerCase()] ?? 2;

  const allowedBreeds = [
    'DOMESTIC SH', 'PIT BULL', 'LABRADOR RETR', 'GERM SHEPHERD', 'DOMESTIC MH',
    'BEAGLE', 'BOXER', 'DOMESTIC LH', 'CHIHUAHUA SH', 'SHIH TZU',
    'SIBERIAN HUSKY', 'ALASKAN HUSKY'
  ];
  const allowedColors = [
    'BLACK', 'TABBY', 'WHITE', 'BROWN', 'GRAY',
    'TAN', 'BRINDLE', 'TORTIE', 'ORANGE', 'CALICO'
  ];

  const normalizeValue = (value) => {
    if (!value) {
      return '';
    }
    return String(value).trim().toUpperCase();
  };

  const rawBreed = normalizeValue(mascota.breed);
  const breed = allowedBreeds.includes(rawBreed) ? rawBreed : 'Others';

  const rawColor = normalizeValue(mascota.color);
  const color = allowedColors.includes(rawColor) ? rawColor : 'Others';

  const payload = {
    animaltype,
    gender,
    petsize,
    breed,
    color
  };

  try {
    const response = await fetch('../api/predict.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en la API de predicción.');
    }

    const prediction = await response.json();

    const diasEstimados = prediction.dias_estimados;
    const fechaPublicacion = mascota.date_publicacion ? new Date(mascota.date_publicacion) : new Date();
    const hoy = new Date();
    const diffTime = Math.abs(hoy - fechaPublicacion);
    const diasPasados = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const diasRestantes = Math.max(0, Math.round(diasEstimados - diasPasados));

    let probabilidadesHTML = '';
    if (prediction.probabilidades_temporales) {
      probabilidadesHTML += '<li class="list-group-item"><h6 class="mb-1 mt-2 text-center">Probabilidades Temporales</h6></li>';
      for (const key in prediction.probabilidades_temporales) {
        const label = key.replace(/_/g, ' ').replace('adopcion en menos de ', '').replace(' dias', ' días');
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        probabilidadesHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${formattedLabel}: <span class="badge bg-secondary rounded-pill">${prediction.probabilidades_temporales[key]}</span>
          </li>`;
      }
    }

    modalBody.innerHTML = `
      <h6 class="card-title text-center mb-3">Resultados para: <strong>${mascota.nombre}</strong></h6>
      <ul class="list-group list-group-flush">
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Días estimados restantes:
          <span class="badge bg-primary rounded-pill fs-6">${diasRestantes}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Rango de adopción:
          <span class="badge bg-info text-dark rounded-pill">${prediction.rango_estimado}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Confianza del modelo:
          <span class="badge bg-success rounded-pill">${prediction.confianza_modelo}</span>
        </li>
        <li class="list-group-item">
          <small class="text-muted">
            La estimación original fue de ${prediction.dias_estimados} días. Han pasado ${diasPasados} día(s) desde su publicación.
          </small>
        </li>
        ${probabilidadesHTML}
      </ul>
      <div class="bg-light border rounded-3 p-3 mt-3">
        <small><i class="bi bi-info-circle-fill"></i> Esta es una estimación basada en un modelo de Machine Learning y no garantiza el tiempo real de adopción.</small>
      </div>
    `;
  } catch (error) {
    modalBody.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}
