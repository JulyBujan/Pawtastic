document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") {
      showToast("Debes iniciar sesión para acceder a este módulo.", "warning");
    }
    window.location.href = "login.html";
    return;
  }

  const backLink = document.getElementById("lostFoundBack");
  if (backLink) {
    const tipo = localStorage.getItem("tipo");
    let target = "../index.html";
    if (tipo === "ong") target = "perfil-ong.html";
    if (tipo === "usuario") target = "perfil-usuario.html";
    if (tipo === "admin") target = "perfil-admin.html";
    backLink.setAttribute("href", target);
  }

  const tipoUsuario = localStorage.getItem("tipo");
  const isAdmin = tipoUsuario === "admin";

  const lostList = document.getElementById("lostList");
  const foundList = document.getElementById("foundList");
  const resolvedList = document.getElementById("resolvedList");
  const deletedList = document.getElementById("deletedList");
  const lostLoading = document.getElementById("lostLoading");
  const foundLoading = document.getElementById("foundLoading");
  const resolvedLoading = document.getElementById("resolvedLoading");
  const deletedLoading = document.getElementById("deletedLoading");
  const lostEmpty = document.getElementById("lostEmpty");
  const foundEmpty = document.getElementById("foundEmpty");
  const resolvedEmpty = document.getElementById("resolvedEmpty");
  const deletedEmpty = document.getElementById("deletedEmpty");
  const deletedTabItem = document.getElementById("deleted-tab-item");
  const deletedPanel = document.getElementById("deleted-panel");
  const filtersForm = document.getElementById("lostFiltersForm");
  const filterSpecies = document.getElementById("lostFilterSpecies");
  const filterSize = document.getElementById("lostFilterSize");
  const sortToggle = document.getElementById("lostSortDate");
  const sortLabel = document.getElementById("lostSortLabel");
  const clearFiltersBtn = document.getElementById("lostClearFilters");

  const dataStore = {
    lost: [],
    found: [],
    resolved: [],
    deleted: [],
  };
  const loadState = {
    lost: false,
    found: false,
    resolved: false,
    deleted: false,
  };

  const filterState = {
    species: "",
    size: "",
    sort: "desc",
  };

  const safeText = (value) => String(value ?? "");
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

  const renderList = (items, container, emptyEl) => {
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      if (emptyEl) emptyEl.classList.remove("d-none");
      return;
    }

    if (emptyEl) emptyEl.classList.add("d-none");

    items.forEach((item) => {
      const petName = item.pet_name ? safeText(item.pet_name) : "Mascota";
      const typeLabel = item.type === "LOST" ? "Perdida" : "Encontrada";
      const typeClass = item.type === "LOST" ? "status-lost" : "status-found";
      const species = safeText(item.species || "");
      const breed = item.breed ? safeText(item.breed) : "";
      const size = item.size ? formatSize(item.size) : "";
      const summaryParts = [species, breed, size].filter(Boolean);
      const summary = summaryParts.join(" · ");
      const location = safeText(item.location_text || "");
      const dateLabel = item.type === "LOST" ? "Extravío" : "Hallazgo";
      const dateText = formatDate(item.date_seen);
      const colorsRaw = item.colors || "";
      const colors = colorsRaw
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean)
        .join(", ");

      const card = `
        <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
          <div class="pet-card h-100">
            <div class="pet-image">
              <span class="pet-badge ${typeClass}">${typeLabel}</span>
              <img class="pet-photo" src="${resolvePhoto(item.photo_url)}" alt="${petName}">
            </div>
            <div class="card-body">
              <h5 class="fw-bold">${petName}</h5>
              <p class="pet-summary mb-3">${summary || "Sin detalles cargados."}</p>
              <div class="pet-meta mb-3">
                <span><i class="bi bi-geo-alt"></i> ${location || "Ubicación pendiente"}</span>
                <span><i class="bi bi-calendar-event"></i> ${dateLabel}: ${dateText}</span>
                ${colors ? `<span><i class="bi bi-palette"></i> ${safeText(colors)}</span>` : ""}
              </div>
              <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center">
                <a class="btn btn-dark btn-sm" href="lost_found_detail.html?id=${item.id}">
                  Ver detalle
                </a>
              </div>
            </div>
          </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", card);
    });
  };

  const renderDeletedList = (items) => {
    if (!deletedList) return;
    deletedList.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      if (deletedEmpty) deletedEmpty.classList.remove("d-none");
      return;
    }

    if (deletedEmpty) deletedEmpty.classList.add("d-none");

    items.forEach((item) => {
      const petName = item.pet_name ? safeText(item.pet_name) : "Mascota";
      const typeLabel = item.type === "LOST" ? "Perdida" : "Encontrada";
      const typeClass = item.type === "LOST" ? "status-lost" : "status-found";
      const species = safeText(item.species || "");
      const breed = item.breed ? safeText(item.breed) : "";
      const size = item.size ? formatSize(item.size) : "";
      const summaryParts = [species, breed, size].filter(Boolean);
      const summary = summaryParts.join(" · ");
      const location = safeText(item.location_text || "");
      const dateLabel = item.type === "LOST" ? "Extravío" : "Hallazgo";
      const dateText = formatDate(item.date_seen);
      const colorsRaw = item.colors || "";
      const colors = colorsRaw
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean)
        .join(", ");
      const statusLabel = (item.status || "").toUpperCase() === "RESOLVED" ? "Resuelto" : "Activo";

      const card = `
        <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
          <div class="pet-card h-100">
            <div class="pet-image">
              <span class="pet-badge ${typeClass}">${typeLabel}</span>
              <img class="pet-photo" src="${resolvePhoto(item.photo_url)}" alt="${petName}">
            </div>
            <div class="card-body">
              <h5 class="fw-bold">${petName}</h5>
              <p class="pet-summary mb-3">${summary || "Sin detalles cargados."}</p>
              <div class="pet-meta mb-3">
                <span><i class="bi bi-geo-alt"></i> ${location || "Ubicación pendiente"}</span>
                <span><i class="bi bi-calendar-event"></i> ${dateLabel}: ${dateText}</span>
                ${colors ? `<span><i class="bi bi-palette"></i> ${safeText(colors)}</span>` : ""}
                <span><i class="bi bi-info-circle"></i> Estado: ${statusLabel}</span>
              </div>
              <div class="d-flex flex-wrap gap-2 pet-actions justify-content-center">
                <button class="btn btn-outline-success btn-sm lost-restore-btn" data-id="${item.id}">
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      deletedList.insertAdjacentHTML("beforeend", card);
    });

    deletedList.querySelectorAll(".lost-restore-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.dataset.id;
        const confirmed = window.confirm("¿Querés restaurar esta publicación?");
        if (!confirmed) return;

        btn.disabled = true;
        btn.textContent = "Restaurando...";

        try {
          const response = await fetch("../api/lost_found_restore.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ id: postId }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "No se pudo restaurar la publicación.");
          }
          if (typeof showToast === "function") {
            showToast("Publicación restaurada.", "success");
          }
          fetchDeletedList();
        } catch (error) {
          if (typeof showToast === "function") {
            showToast(error.message, "danger");
          }
          btn.disabled = false;
          btn.textContent = "Restaurar";
        }
      });
    });
  };

  const normalizeValue = (value) => (value || "").toString().trim().toLowerCase();

  const getDateValue = (item) => {
    if (!item?.date_seen) return null;
    const date = new Date(`${item.date_seen}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date.getTime();
  };

  const applyFilters = (items) => {
    let filtered = Array.isArray(items) ? items.slice() : [];

    if (filterState.species) {
      filtered = filtered.filter(
        (item) => normalizeValue(item.species) === filterState.species
      );
    }

    if (filterState.size) {
      filtered = filtered.filter(
        (item) => normalizeValue(item.size) === filterState.size
      );
    }

    filtered.sort((a, b) => {
      const dateA = getDateValue(a);
      const dateB = getDateValue(b);

      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      return filterState.sort === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const applyFiltersToAll = () => {
    if (loadState.lost) {
      renderList(
        applyFilters(dataStore.lost),
        lostList,
        lostEmpty
      );
    }
    if (loadState.found) {
      renderList(
        applyFilters(dataStore.found),
        foundList,
        foundEmpty
      );
    }
    if (loadState.resolved) {
      renderList(
        applyFilters(dataStore.resolved),
        resolvedList,
        resolvedEmpty
      );
    }

    if (isAdmin && loadState.deleted) {
      renderDeletedList(applyFilters(dataStore.deleted));
    }
  };

  const syncFilterState = () => {
    filterState.species = normalizeValue(filterSpecies?.value);
    filterState.size = normalizeValue(filterSize?.value);
    filterState.sort = sortToggle && sortToggle.checked ? "desc" : "asc";
    if (sortLabel) {
      sortLabel.textContent = filterState.sort === "desc" ? "Descendente" : "Ascendente";
    }
  };

  const fetchList = async (type, container, loadingEl, emptyEl, status = "OPEN") => {
    if (loadingEl) loadingEl.classList.remove("d-none");
    try {
      const response = await fetch(`../api/lost_found_list.php?type=${type}&status=${status}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar la lista.");
      }
      const data = await response.json();
      if (status === "RESOLVED") {
        dataStore.resolved = data;
        loadState.resolved = true;
      } else if (type === "LOST") {
        dataStore.lost = data;
        loadState.lost = true;
      } else if (type === "FOUND") {
        dataStore.found = data;
        loadState.found = true;
      }
      applyFiltersToAll();
    } catch (error) {
      if (container) {
        container.innerHTML = `<div class="col-12"><p class="text-center text-danger">${safeText(error.message)}</p></div>`;
      }
    } finally {
      if (loadingEl) loadingEl.classList.add("d-none");
    }
  };

  const fetchDeletedList = async () => {
    if (!isAdmin) return;
    if (deletedLoading) deletedLoading.classList.remove("d-none");
    try {
      const response = await fetch("../api/lost_found_list.php?type=ALL&status=ALL&deleted=1", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar la lista.");
      }
      const data = await response.json();
      dataStore.deleted = data;
      loadState.deleted = true;
      applyFiltersToAll();
    } catch (error) {
      if (deletedList) {
        deletedList.innerHTML = `<div class="col-12"><p class="text-center text-danger">${safeText(error.message)}</p></div>`;
      }
    } finally {
      if (deletedLoading) deletedLoading.classList.add("d-none");
    }
  };

  if (isAdmin) {
    if (deletedTabItem) deletedTabItem.classList.remove("d-none");
    if (deletedPanel) deletedPanel.classList.remove("d-none");
  }

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      syncFilterState();
      applyFiltersToAll();
    });
  }

  [filterSpecies, filterSize, sortToggle].forEach((control) => {
    if (!control) return;
    control.addEventListener("change", () => {
      syncFilterState();
      applyFiltersToAll();
    });
  });

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (filterSpecies) filterSpecies.value = "";
      if (filterSize) filterSize.value = "";
      if (sortToggle) sortToggle.checked = true;
      syncFilterState();
      applyFiltersToAll();
    });
  }

  syncFilterState();
  fetchList("LOST", lostList, lostLoading, lostEmpty);
  fetchList("FOUND", foundList, foundLoading, foundEmpty);
  fetchList("ALL", resolvedList, resolvedLoading, resolvedEmpty, "RESOLVED");
  fetchDeletedList();
});
