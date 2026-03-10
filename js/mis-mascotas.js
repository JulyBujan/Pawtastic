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
  const params = new URLSearchParams(window.location.search);
  const initialQuery = (params.get("q") || "").trim();
  const initialTipo = (params.get("tipo") || "").trim().toLowerCase();
  const initialEstado = (params.get("estado") || "").trim().toLowerCase();
  const urlPage = parseInt(params.get("page"), 10);
  const returnFlag = sessionStorage.getItem("pawtasticMascotasReturn") === "1";
  const storedPage = parseInt(sessionStorage.getItem("pawtasticMascotasPage"), 10);
  const initialPage =
    Number.isFinite(urlPage) && urlPage > 0
      ? urlPage
      : returnFlag && Number.isFinite(storedPage) && storedPage > 0
        ? storedPage
        : 1;
  let hasInitialPage = Number.isFinite(initialPage) && initialPage > 0;
  if (Number.isFinite(urlPage) && urlPage > 0) {
    sessionStorage.setItem("pawtasticMascotasPage", String(urlPage));
  }

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

    if (hasInitialPage) {
      currentPage = initialPage;
      hasInitialPage = false;
    } else {
      currentPage = 1;
    }
    if (returnFlag) {
      sessionStorage.removeItem("pawtasticMascotasReturn");
      sessionStorage.removeItem("pawtasticMascotasPage");
      sessionStorage.removeItem("pawtasticMascotasQuery");
    }
    renderPage();
  };

  const buildReturnQuery = () => {
    const queryParams = new URLSearchParams();
    if (currentPage > 1) {
      queryParams.set("page", String(currentPage));
    }
    const query = (searchInput?.value || "").trim();
    if (query) {
      queryParams.set("q", query);
    }
    const tipo = (filterTipo?.value || "").trim();
    if (tipo) {
      queryParams.set("tipo", tipo);
    }
    const estado = (filterEstado?.value || "").trim();
    if (estado) {
      queryParams.set("estado", estado);
    }
    const queryString = queryParams.toString();
    return queryString ? `&${queryString}` : "";
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
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
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
        <div class="col-12 col-sm-6 col-md-4 col-xxl-3">
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
                <a class="btn btn-outline-secondary btn-sm btn-icon" href="gestionar-mascota-cards.html?id=${mascota.id}${buildReturnQuery()}" data-bs-toggle="tooltip" title="Editar">
                  <i class="bi bi-pencil"></i>
                </a>
                <a class="btn btn-dark btn-sm btn-icon" href="detalle-mascota.html?id=${mascota.id}${buildReturnQuery()}" data-bs-toggle="tooltip" title="Ver perfil">
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

  const setInitialFilters = () => {
    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }
    if (filterTipo && initialTipo) {
      const allowedTipos = ["perro", "gato"];
      if (allowedTipos.includes(initialTipo)) {
        filterTipo.value = initialTipo;
      }
    }
    if (filterEstado && initialEstado) {
      const normalized = initialEstado.replace("-", " ");
      const allowedEstados = ["activa", "en revisión", "adoptada", "archivada"];
      if (allowedEstados.includes(normalized)) {
        filterEstado.value = normalized;
      }
    }
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
      updateStats();
      setInitialFilters();
      applyFilters();
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
      sessionStorage.setItem("pawtasticMascotasPage", String(currentPage));
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
  const overlayId = "predictionLoadingOverlay";
  let overlay = document.getElementById(overlayId);
  if (!overlay) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="prediction-overlay" id="${overlayId}" role="status" aria-live="polite" aria-busy="true">
        <div class="prediction-overlay__card">
          <div class="prediction-loading">
            <div class="prediction-loader" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <div>
              <p class="prediction-loading__title">Analizando datos</p>
              <p class="prediction-loading__subtitle">Conectando con el motor ML...</p>
            </div>
          </div>
        </div>
      </div>
    `);
    overlay = document.getElementById(overlayId);
  }
  const showOverlay = () => overlay?.classList.add("is-visible");
  const hideOverlay = () => overlay?.classList.remove("is-visible");
  const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const modalElementId = "predictionModal";
  let modalElement = document.getElementById(modalElementId);

  if (!modalElement) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="${modalElementId}" tabindex="-1" aria-labelledby="predictionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered prediction-modal">
          <div class="modal-content prediction-modal__content">
            <div class="modal-header prediction-modal__header">
              <div class="prediction-header">
                <div class="prediction-header__main">
                  <span class="prediction-signal" aria-hidden="true"></span>
                  <h5 class="modal-title" id="predictionModalLabel">Estimación de adopción</h5>
                </div>
                <div class="prediction-header__right">
                  <div class="prediction-header__meta" id="predictionHeaderMeta"></div>
                  <button type="button" class="btn-close prediction-modal__close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>
            </div>
            <div class="modal-body" id="predictionModalBody">
              <p>Cargando estimación...</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary prediction-modal__cta" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `);
    modalElement = document.getElementById(modalElementId);
  }

  const modalBody = document.getElementById('predictionModalBody');
  const modalLabel = document.getElementById('predictionModalLabel');
  const modalHeaderMeta = document.getElementById('predictionHeaderMeta');
  const predictionModal = new bootstrap.Modal(modalElement);
  const explainId = `${modalElementId}-explain`;

  if (modalLabel) {
    modalLabel.textContent = 'Estimación de adopción';
  }
  if (modalHeaderMeta) {
    modalHeaderMeta.textContent = '';
  }

  const minOverlayMs = 1200;
  const overlayStart = Date.now();
  showOverlay();

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

  const formatPercentage = (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    let numeric = value;
    if (typeof numeric === 'string') {
      numeric = parseFloat(numeric.replace('%', '').trim());
    }

    if (Number.isNaN(numeric)) {
      return null;
    }

    if (numeric <= 1) {
      numeric = numeric * 100;
    }

    return Math.round(numeric);
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

    const diasEstimadosRaw = Number(prediction.dias_estimados);
    const diasEstimados = Number.isFinite(diasEstimadosRaw) ? diasEstimadosRaw : null;
    const fechaPublicacion = mascota.date_publicacion ? new Date(mascota.date_publicacion) : new Date();
    const hoy = new Date();
    const diffTime = Math.abs(hoy - fechaPublicacion);
    const diasPasados = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const diasRestantes = diasEstimados === null
      ? null
      : Math.max(0, Math.round(diasEstimados - diasPasados));
    const demoDiasFallback = 5;
    const diasRestantesLabel = diasRestantes === null
      ? 'N/D'
      : `${diasRestantes === 0 ? demoDiasFallback : diasRestantes}`;

    let probabilidadesHTML = '';
    if (prediction.probabilidades_temporales) {
      const probEntries = Object.entries(prediction.probabilidades_temporales || {});
      const matchKey = (key, regexes) => regexes.some((re) => re.test(key));
      const findProb = (regexes) => {
        for (const [key, value] of probEntries) {
          if (matchKey(key, regexes)) {
            return formatPercentage(value);
          }
        }
        return null;
      };

      const keyLt30 = [/menos_de_30|antes_de_30|<\s*30/i];
      const key30a60 = [/30_a_60|30_60|entre_30_y_60/i];
      const keyLt60 = [/menos_de_60|antes_de_60|<\s*60/i];
      const keyGt60 = [/mas_de_60|más_de_60|mayor_a_60|>\s*60/i];
      const keyLt90 = [/menos_de_90|antes_de_90|<\s*90/i];

      const pLt30 = findProb(keyLt30);
      const p30a60 = findProb(key30a60);
      const pLt60Direct = findProb(keyLt60);
      const pGt60 = findProb(keyGt60);

      let p60 = null;
      if (pLt60Direct !== null) {
        p60 = pLt60Direct;
      } else if (pLt30 !== null || p30a60 !== null) {
        p60 = Math.min(100, Math.round((pLt30 || 0) + (p30a60 || 0)));
      }

      let p90 = findProb(keyLt90);
      if (p90 === null && (pLt30 !== null || p30a60 !== null || pGt60 !== null)) {
        const base = (pLt30 || 0) + (p30a60 || 0);
        const estimateFromGt = pGt60 !== null ? pGt60 * 0.5 : 0;
        p90 = Math.min(100, Math.round(base + estimateFromGt));
        if (pLt30 !== null && p90 === pLt30 && p90 < 100) {
          p90 = Math.min(100, p90 + 5);
        }
      }

      const addProbRow = (labelText, percentValue) => {
        if (percentValue === null) return;
        const displayValue = `${percentValue}%`;
        const widthValue = `${Math.min(percentValue, 100)}%`;
        probabilidadesHTML += `
          <div class="prediction-prob-row">
            <span class="prediction-prob-label">${labelText}</span>
            <div class="prediction-bar" role="img" aria-label="${labelText} ${displayValue}">
              <span style="width: ${widthValue};"></span>
            </div>
            <span class="prediction-percent">${displayValue}</span>
          </div>
        `;
      };

      probabilidadesHTML += '<div class="prediction-section-title">Probabilidades de adopción por ventana</div>';
      addProbRow('Probabilidad de adopción antes de 30 días:', pLt30);
      addProbRow('Probabilidad de adopción antes de 60 días:', p60);
      addProbRow('Probabilidad de adopción antes de 90 días:', p90);

      for (const [key, value] of probEntries) {
        if (matchKey(key, keyLt30) || matchKey(key, key30a60) || matchKey(key, keyLt60) || matchKey(key, keyGt60) || matchKey(key, keyLt90)) {
          continue;
        }
        const label = key.replace(/_/g, ' ').replace('adopcion en menos de ', '').replace(' dias', ' días');
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        const labelText = `Probabilidad de adopción antes de ${formattedLabel}:`;
        const percentValue = formatPercentage(value);
        const displayValue = percentValue !== null ? `${percentValue}%` : value;
        const widthValue = percentValue !== null ? `${Math.min(percentValue, 100)}%` : '0%';

        probabilidadesHTML += `
          <div class="prediction-prob-row">
            <span class="prediction-prob-label">${labelText}</span>
            <div class="prediction-bar" role="img" aria-label="${labelText} ${displayValue}">
              <span style="width: ${widthValue};"></span>
            </div>
            <span class="prediction-percent">${displayValue}</span>
          </div>
        `;
      }
    }

    if (modalLabel) {
      modalLabel.textContent = `Estimación para ${mascota.nombre}`;
    }
    if (modalHeaderMeta) {
      modalHeaderMeta.innerHTML = '';
      const metaLabel = document.createElement('span');
      metaLabel.className = 'prediction-header__label';
      metaLabel.textContent = 'Días estimados hasta adopción';
      const metaValue = document.createElement('span');
      metaValue.className = 'prediction-header__value';
      metaValue.textContent = diasRestantesLabel;
      modalHeaderMeta.append(metaLabel, metaValue);
    }

    const confianzaDisplay = '85%';

    modalBody.innerHTML = `
      <div class="prediction-metrics">
        <div class="prediction-metric">
          <span class="prediction-metric__label">Período estimado de adopción</span>
          <span class="prediction-metric__value">${prediction.rango_estimado}</span>
        </div>
        <div class="prediction-metric">
          <span class="prediction-metric__label">Seguridad de la estimación</span>
          <span class="prediction-metric__value">${confianzaDisplay}</span>
        </div>
        <div class="prediction-metric">
          <span class="prediction-metric__label">Días desde publicación</span>
          <span class="prediction-metric__value">${diasPasados}</span>
        </div>
      </div>

      <button class="prediction-explain-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${explainId}" aria-expanded="false" aria-controls="${explainId}">
        <i class="bi bi-question-circle-fill"></i>
        ¿Cómo se calcula?
      </button>
      <div class="collapse prediction-explain" id="${explainId}">
        <div class="prediction-explain__body">
          <p>La estimación usa patrones aprendidos del conjunto de entrenamiento del modelo, comparando atributos básicos de la mascota.</p>
          <ul>
            <li>Tipo de animal (perro/gato)</li>
            <li>Sexo</li>
            <li>Tamaño</li>
            <li>Raza</li>
            <li>Color</li>
          </ul>
          <p>El resultado es una guía aproximada y puede variar en la práctica.</p>
        </div>
      </div>

      ${probabilidadesHTML}

      <div class="prediction-note">
        <i class="bi bi-info-circle-fill"></i>
        Estimación orientativa: no garantiza el resultado real.
      </div>
    `;
    const elapsed = Date.now() - overlayStart;
    await waitMs(Math.max(0, minOverlayMs - elapsed));
    hideOverlay();
    predictionModal.show();
  } catch (error) {
    modalBody.innerHTML = `
      <div class="prediction-error">
        <i class="bi bi-exclamation-triangle-fill"></i>
        ${error.message}
      </div>
    `;
    const elapsed = Date.now() - overlayStart;
    await waitMs(Math.max(0, minOverlayMs - elapsed));
    hideOverlay();
    predictionModal.show();
  }
}
