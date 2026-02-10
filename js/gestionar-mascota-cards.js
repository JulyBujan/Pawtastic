document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const idMascota = params.get("id");
  const formMascota = document.getElementById("form-mascota-cards");
  const returnParams = new URLSearchParams();
  const returnPage = parseInt(params.get("page"), 10);
  const returnQuery = (params.get("q") || "").trim();
  const returnTipo = (params.get("tipo") || "").trim();
  const returnEstado = (params.get("estado") || "").trim();
  if (Number.isFinite(returnPage) && returnPage > 0) {
    returnParams.set("page", String(returnPage));
  }
  if (returnQuery) {
    returnParams.set("q", returnQuery);
  }
  if (returnTipo) {
    returnParams.set("tipo", returnTipo);
  }
  if (returnEstado) {
    returnParams.set("estado", returnEstado);
  }
  const returnQueryString = returnParams.toString();
  const returnUrl = returnQueryString ? `mis-mascotas.html?${returnQueryString}` : "mis-mascotas.html";
  const storeReturnState = () => {
    sessionStorage.setItem("pawtasticMascotasReturn", "1");
    if (Number.isFinite(returnPage) && returnPage > 0) {
      sessionStorage.setItem("pawtasticMascotasPage", String(returnPage));
    }
    if (returnQueryString) {
      sessionStorage.setItem("pawtasticMascotasQuery", returnQueryString);
    }
  };

  const edadAnosInput = document.getElementById("edad_anos");
  const edadMesesInput = document.getElementById("edad_meses");
  const edadInput = document.getElementById("edad");
  const idMascotaInput = document.getElementById("id_mascota");
  const fotoActualContainer = document.getElementById("fotoActualContainer");
  const fotoActualPreview = document.getElementById("fotoActualPreview");
  const fotoPlaceholder = document.getElementById("fotoPlaceholder");
  const fotoInput = document.getElementById("foto");
  const extraFotosInput = document.getElementById("fotos-extra");
  const extraExistingLabel = document.getElementById("fotos-extra-existing-label");
  const extraExistingContainer = document.getElementById("fotos-extra-existing");
  const extraPreviewLabel = document.getElementById("fotos-extra-preview-label");
  const extraPreviewContainer = document.getElementById("fotos-extra-preview");
  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const cancelBtn = document.getElementById("btn-cancelar");
  const saveBtn = document.getElementById("btn-guardar");
  const breedSelect = document.getElementById("breed");
  const breedCustomInput = document.getElementById("breed_custom");
  const tablaVacunasBody = document.getElementById("tabla-vacunas-body");
  const btnAgregarVacuna = document.getElementById("btnAgregarVacuna");
  const selectVacuna = document.getElementById("select-vacuna");
  const fechaVacuna = document.getElementById("fecha-aplicacion-vacuna");
  const btnGuardarVacuna = document.getElementById("btn-guardar-vacuna");
  let vacunasDisponibles = [];
  let vacunasDraft = [];
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const notifDropdown = document.getElementById("notifDropdown");
  const markAllNotif = document.getElementById("markAllNotif");
  const hasNotifUi = Boolean(notifBadge || notifList || notifDropdown);
  let notifDropdownOpen = false;
  const stepButtons = Array.from(document.querySelectorAll(".profile-step-btn"));
  const steps = Array.from(document.querySelectorAll(".profile-step"));
  const prevStepBtn = document.getElementById("profilePrev");
  const nextStepBtn = document.getElementById("profileNext");
  const stepInfo = document.getElementById("profilePageInfo");
  const actionButtons = document.getElementById("user-action-buttons");
  let currentStep = 0;
  const setFormTitle = (text) => {
    if (!formTitle) return;
    const textEl = formTitle.querySelector(".form-title-text");
    if (textEl) {
      textEl.textContent = text;
    } else {
      formTitle.textContent = text;
    }
  };

  const token = localStorage.getItem("token");
  const tipoUsuario = localStorage.getItem("tipo");

  if (!token || tipoUsuario !== "ong") {
    showToast("⚠️ Debes iniciar sesión como ONG para acceder a esta página.", "danger");
    window.location.href = "login.html";
    return;
  }

  const setStep = (nextStep) => {
    if (!steps.length) return;
    const totalSteps = steps.length;
    const clampedStep = Math.max(0, Math.min(totalSteps - 1, nextStep));
    currentStep = clampedStep;

    steps.forEach((step) => {
      step.classList.toggle("is-active", parseInt(step.dataset.step, 10) === currentStep);
    });

    stepButtons.forEach((btn) => {
      const isActive = parseInt(btn.dataset.step, 10) === currentStep;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (stepInfo) {
      stepInfo.textContent = `Paso ${currentStep + 1} de ${totalSteps}`;
    }

    if (prevStepBtn) prevStepBtn.disabled = currentStep === 0;
    if (nextStepBtn) nextStepBtn.disabled = currentStep === totalSteps - 1;

    if (actionButtons) {
      actionButtons.style.display = currentStep === totalSteps - 1 ? "flex" : "none";
    }
  };

  steps.forEach((step, index) => {
    if (!step.dataset.step) {
      step.dataset.step = `${index}`;
    }
  });

  stepButtons.forEach((button, index) => {
    if (!button.dataset.step) {
      button.dataset.step = `${index}`;
    }
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = parseInt(button.dataset.step, 10);
      if (!Number.isNaN(step)) {
        setStep(step);
      }
    });
  });

  if (prevStepBtn) {
    prevStepBtn.addEventListener("click", () => setStep(currentStep - 1));
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener("click", () => setStep(currentStep + 1));
  }

  if (steps.length) {
    setStep(0);
  }

  const setSelectValue = (id, value) => {
    const select = document.getElementById(id);
    if (!select) return;
    let normalized = value;
    if (typeof normalized === "string") {
      normalized = normalized.replace(/pequeno/i, "Pequeño");
    }
    const hasOption = Array.from(select.options).some((opt) => opt.value === normalized);
    select.value = hasOption ? normalized : "";
  };

  const toggleCustomBreed = (value) => {
    if (!breedCustomInput) {
      return;
    }
    if (value === "OTHER") {
      breedCustomInput.classList.remove("d-none");
    } else {
      breedCustomInput.classList.add("d-none");
      breedCustomInput.value = "";
    }
  };

  const MAX_EXTRA_FOTOS = 3;
  let extraPreviewUrls = [];
  let extraSelectedFiles = [];

  const resolveImageUrl = (value) => {
    if (!value) {
      return "../img/mascotas/default.jpg";
    }
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    if (value.startsWith("../") || value.startsWith("/")) {
      return value;
    }
    if (value.startsWith("img/")) {
      return `../${value}`;
    }
    if (value.startsWith("mascotas/")) {
      return `../img/${value}`;
    }
    return `../img/mascotas/${value}`;
  };

  const clearPreviewUrls = () => {
    extraPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    extraPreviewUrls = [];
  };

  const renderExtraImages = (images, container, labelEl) => {
    if (!container) return;
    container.innerHTML = "";
    if (!images || images.length === 0) {
      if (labelEl) {
        labelEl.classList.add("d-none");
      }
      return;
    }
    if (labelEl) {
      labelEl.classList.remove("d-none");
    }
    images.forEach((img) => {
      const item = document.createElement("div");
      item.className = "photo-extra-item";
      const imgEl = document.createElement("img");
      imgEl.src = resolveImageUrl(img);
      imgEl.alt = "Foto adicional";
      item.appendChild(imgEl);
      container.appendChild(item);
    });
  };

  const renderExtraFiles = (files) => {
    if (!extraPreviewContainer) return;
    extraPreviewContainer.innerHTML = "";
    clearPreviewUrls();
    if (!files || files.length === 0) {
      if (extraPreviewLabel) {
        extraPreviewLabel.classList.add("d-none");
      }
      return;
    }
    if (extraPreviewLabel) {
      extraPreviewLabel.classList.remove("d-none");
    }
    files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "photo-extra-item";
      const imgEl = document.createElement("img");
      const url = URL.createObjectURL(file);
      extraPreviewUrls.push(url);
      imgEl.src = url;
      imgEl.alt = "Foto nueva";
      imgEl.onload = () => URL.revokeObjectURL(url);
      item.appendChild(imgEl);
      extraPreviewContainer.appendChild(item);
    });
  };

  const setBadge = (count) => {
    if (!notifBadge) {
      return;
    }
    if (count > 0) {
      notifBadge.textContent = count;
      notifBadge.classList.remove("d-none");
    } else {
      notifBadge.textContent = "0";
      notifBadge.classList.add("d-none");
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString("es-AR");
  };

  const renderNotifications = (items) => {
    if (!notifList) {
      return;
    }
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

  const renderTablaVacunas = (vacunasAplicadas) => {
    if (!tablaVacunasBody) {
      return;
    }
    tablaVacunasBody.innerHTML = "";
    if (!vacunasAplicadas || vacunasAplicadas.length === 0) {
      tablaVacunasBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin vacunas registradas.</td></tr>';
      return;
    }
    vacunasAplicadas.forEach((vacuna) => {
      const fecha = vacuna.fecha_aplicacion
        ? new Date(vacuna.fecha_aplicacion + "T00:00:00").toLocaleDateString("es-AR")
        : "";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${vacuna.nombre}</td>
        <td>${fecha}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm btn-eliminar-vacuna" data-vacuna-id="${vacuna.id_vacuna || vacuna.vacuna_id}" data-fecha="${vacuna.fecha_aplicacion}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tablaVacunasBody.appendChild(row);
    });
  };

  const popularSelectVacunas = (todasLasVacunas) => {
    if (!selectVacuna) {
      return;
    }
    const tipoMascota = document.getElementById("tipo").value;
    selectVacuna.innerHTML = '<option value="">Seleccionar vacuna...</option>';
    todasLasVacunas
      .filter((vacuna) => !tipoMascota || vacuna.tipo === tipoMascota)
      .forEach((vacuna) => {
        const option = document.createElement("option");
        option.value = vacuna.id_vacuna;
        option.textContent = vacuna.nombre;
        selectVacuna.appendChild(option);
      });
  };

  const cargarVacunas = async (mascotaId) => {
    try {
      const response = await fetch(`../api/gestionar_mascota_vacunas.php?mascota_id=${mascotaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las vacunas.");
      }
      const data = await response.json();
      vacunasDisponibles = data.todas || [];
      renderTablaVacunas(data.aplicadas || []);
      popularSelectVacunas(vacunasDisponibles);
      if (data.aplicadas && data.aplicadas.length > 0) {
        document.getElementById("vacunado").value = "si";
      }
    } catch (error) {
      console.error(error);
      showToast(error.message, "danger");
      if (tablaVacunasBody) {
        tablaVacunasBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No se pudieron cargar las vacunas.</td></tr>';
      }
    }
  };

  const cargarVacunasDisponibles = async () => {
    try {
      const response = await fetch("../api/gestionar_mascota_vacunas.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las vacunas.");
      }
      const data = await response.json();
      vacunasDisponibles = data.todas || [];
      popularSelectVacunas(vacunasDisponibles);
    } catch (error) {
      console.error(error);
      showToast(error.message, "danger");
    }
  };

  const agregarVacuna = async (mascotaId, vacunaId, fecha) => {
    try {
      const response = await fetch("../api/gestionar_mascota_vacunas.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mascota_id: mascotaId, vacuna_id: vacunaId, fecha_aplicacion: fecha }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "No se pudo agregar la vacuna.");
      }
      showToast(result.message, "success");
      await cargarVacunas(mascotaId);
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregarVacuna"));
      if (modal) {
        modal.hide();
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, "danger");
    }
  };

  const eliminarVacuna = async (mascotaId, vacunaId, fecha) => {
    try {
      const response = await fetch("../api/gestionar_mascota_vacunas.php", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mascota_id: mascotaId, vacuna_id: vacunaId, fecha_aplicacion: fecha }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "No se pudo eliminar la vacuna.");
      }
      showToast(result.message, "success");
      await cargarVacunas(mascotaId);
    } catch (error) {
      showToast(`Error: ${error.message}`, "danger");
    }
  };

  if (idMascota) {
    await setupEditMode(idMascota);
  } else {
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Guardar mascota';
    }
    if (tablaVacunasBody) {
      tablaVacunasBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin vacunas registradas.</td></tr>';
    }
    await cargarVacunasDisponibles();
    setTimeout(() => {
      formMascota.reset();
      const selects = formMascota.querySelectorAll("select");
      selects.forEach((select) => {
        select.selectedIndex = 0;
      });
    }, 100);
  }

  if (breedSelect) {
    breedSelect.addEventListener("change", (event) => {
      toggleCustomBreed(event.target.value);
    });
  }

  if (notifDropdown) {
    notifDropdown.addEventListener("show.bs.dropdown", () => {
      notifDropdownOpen = true;
      fetchNotifications();
      fetchUnreadCount();
    });
    notifDropdown.addEventListener("hide.bs.dropdown", () => {
      notifDropdownOpen = false;
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

  const tipoSelect = document.getElementById("tipo");
  if (tipoSelect) {
    tipoSelect.addEventListener("change", () => {
      if (vacunasDisponibles.length > 0) {
        popularSelectVacunas(vacunasDisponibles);
      }
    });
  }

  if (fotoInput) {
    let existingPreviewSrc = "";
    fotoInput.addEventListener("change", (event) => {
      if (!existingPreviewSrc && fotoActualPreview) {
        existingPreviewSrc = fotoActualPreview.getAttribute("src") || fotoInput.getAttribute("data-existing-src") || "";
      }
      const file = event.target.files && event.target.files[0];
      if (file && fotoActualPreview) {
        const previewUrl = URL.createObjectURL(file);
        fotoActualPreview.src = previewUrl;
        fotoActualPreview.style.display = "block";
        if (fotoPlaceholder) {
          fotoPlaceholder.style.display = "none";
        }
        fotoActualPreview.onload = () => URL.revokeObjectURL(previewUrl);
        return;
      }

      if (fotoActualPreview) {
        if (existingPreviewSrc) {
          fotoActualPreview.src = existingPreviewSrc;
          fotoActualPreview.style.display = "block";
          if (fotoPlaceholder) {
            fotoPlaceholder.style.display = "none";
          }
        } else {
          fotoActualPreview.removeAttribute("src");
          fotoActualPreview.style.display = "none";
          if (fotoPlaceholder) {
            fotoPlaceholder.style.display = "block";
          }
        }
      }
    });
  }

  if (extraFotosInput) {
    extraFotosInput.addEventListener("change", () => {
      const files = Array.from(extraFotosInput.files || []);
      if (files.length === 0) {
        return;
      }
      const combined = [...extraSelectedFiles, ...files];
      const unique = [];
      const seen = new Set();
      combined.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        unique.push(file);
      });

      if (unique.length > MAX_EXTRA_FOTOS) {
        showToast(`Podés subir hasta ${MAX_EXTRA_FOTOS} fotos adicionales.`, "warning");
        extraSelectedFiles = unique.slice(0, MAX_EXTRA_FOTOS);
      } else {
        extraSelectedFiles = unique;
      }

      const dataTransfer = new DataTransfer();
      extraSelectedFiles.forEach((file) => dataTransfer.items.add(file));
      extraFotosInput.files = dataTransfer.files;
      renderExtraFiles(extraSelectedFiles);
    });
  }

  async function setupEditMode(id) {
    setFormTitle("Editar mascota");
    if (formSubtitle) {
      formSubtitle.textContent = "Actualizá la información antes de guardar cambios.";
    }
    document.title = "Editar Mascota | Pawtastic";
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Guardar cambios';
    }

    try {
      const response = await fetch(`../api/get_mascota.php?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la información de la mascota.");
      }

      const mascota = await response.json();

      idMascotaInput.value = id;
      document.getElementById("nombre").value = mascota.nombre || "";
      document.getElementById("tipo").value = mascota.tipo || "";

      const totalMeses = parseInt(mascota.edad, 10) || 0;
      edadAnosInput.value = Math.floor(totalMeses / 12);
      edadMesesInput.value = totalMeses % 12;

      document.getElementById("sexo").value = mascota.sexo || "";
      setSelectValue("tamano", mascota.tamaño || "");
      setSelectValue("breed", mascota.breed || "");
      setSelectValue("color", mascota.color || "");
      document.getElementById("descripcion").value = mascota.descripcion || "";
      document.getElementById("vacunado").value = mascota.vacunado || "";
      document.getElementById("esterilizado").value = mascota.esterilizado || "";
      document.getElementById("chip").value = mascota.chip || "";
      document.getElementById("apto_ninos").value = mascota.apto_ninos === null ? "" : String(parseInt(mascota.apto_ninos, 10));
      document.getElementById("apto_mascotas").value = mascota.apto_mascotas === null ? "" : String(parseInt(mascota.apto_mascotas, 10));
      document.getElementById("energia").value = mascota.energia || "";
      document.getElementById("sociabilidad").value = mascota.sociabilidad || "";
      document.getElementById("presencia").value = mascota.presencia || "";
      document.getElementById("estilov").value = mascota.estilov || "";

      if (mascota.imagen && fotoActualPreview && fotoActualContainer) {
        fotoActualPreview.src = `../img/mascotas/${mascota.imagen}`;
        fotoActualPreview.style.display = "block";
        if (fotoPlaceholder) {
          fotoPlaceholder.style.display = "none";
        }
        if (fotoInput) {
          fotoInput.setAttribute("data-existing-src", fotoActualPreview.src);
        }
      }

      if (Array.isArray(mascota.imagenes)) {
        renderExtraImages(mascota.imagenes.slice(0, MAX_EXTRA_FOTOS), extraExistingContainer, extraExistingLabel);
      } else {
        renderExtraImages([], extraExistingContainer, extraExistingLabel);
      }

      if (breedSelect && mascota.breed) {
        const options = Array.from(breedSelect.options).map((opt) => opt.value);
        if (!options.includes(mascota.breed)) {
          breedSelect.value = "OTHER";
          if (breedCustomInput) {
            breedCustomInput.classList.remove("d-none");
            breedCustomInput.value = mascota.breed;
          }
        } else {
          toggleCustomBreed(breedSelect.value);
        }
      }
      if (btnAgregarVacuna) {
        btnAgregarVacuna.disabled = false;
        btnAgregarVacuna.classList.remove("disabled");
      }
      if (id) {
        await cargarVacunas(id);
      }
    } catch (error) {
      console.error(error);
      showToast(error.message, "danger");
      storeReturnState();
      window.location.href = returnUrl;
    }
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", (event) => {
      event.preventDefault();
      storeReturnState();
      window.location.href = returnUrl;
    });
  }

  if (btnGuardarVacuna) {
    btnGuardarVacuna.addEventListener("click", async () => {
      const vacunaId = selectVacuna ? selectVacuna.value : "";
      const fecha = fechaVacuna ? fechaVacuna.value : "";
      if (!vacunaId || !fecha) {
        showToast("Seleccioná una vacuna y una fecha.", "warning");
        return;
      }
      if (!idMascota) {
        const vacunaInfo = vacunasDisponibles.find((vacuna) => String(vacuna.id_vacuna) === String(vacunaId));
        if (!vacunaInfo) {
          showToast("Vacuna no válida.", "danger");
          return;
        }
        const exists = vacunasDraft.some((item) => String(item.vacuna_id) === String(vacunaId) && item.fecha_aplicacion === fecha);
        if (exists) {
          showToast("Esa vacuna ya fue agregada.", "warning");
          return;
        }
        vacunasDraft.push({
          vacuna_id: vacunaId,
          fecha_aplicacion: fecha,
          nombre: vacunaInfo.nombre,
        });
        renderTablaVacunas(vacunasDraft);
        document.getElementById("vacunado").value = "si";
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregarVacuna"));
        if (modal) {
          modal.hide();
        }
        if (selectVacuna) {
          selectVacuna.value = "";
        }
        if (fechaVacuna) {
          fechaVacuna.value = "";
        }
        return;
      }

      await agregarVacuna(idMascota, vacunaId, fecha);
    });
  }

  if (tablaVacunasBody) {
    tablaVacunasBody.addEventListener("click", async (event) => {
      const button = event.target.closest(".btn-eliminar-vacuna");
      if (!button) {
        return;
      }
      const vacunaId = button.dataset.vacunaId;
      const fecha = button.dataset.fecha;
      if (!idMascota) {
        vacunasDraft = vacunasDraft.filter((item) => !(String(item.vacuna_id) === String(vacunaId) && item.fecha_aplicacion === fecha));
        renderTablaVacunas(vacunasDraft);
        return;
      }
      await eliminarVacuna(idMascota, vacunaId, fecha);
    });
  }

  formMascota.addEventListener("submit", async (event) => {
    event.preventDefault();

    const anos = parseInt(edadAnosInput.value, 10) || 0;
    const meses = parseInt(edadMesesInput.value, 10) || 0;
    edadInput.value = anos * 12 + meses;

    const extraFiles = extraFotosInput ? Array.from(extraFotosInput.files || []) : [];
    if (extraFiles.length > MAX_EXTRA_FOTOS) {
      showToast(`Podés subir hasta ${MAX_EXTRA_FOTOS} fotos adicionales.`, "warning");
      return;
    }

    const formData = new FormData(formMascota);
    if (breedSelect && breedSelect.value === "OTHER") {
      const customValue = (breedCustomInput ? breedCustomInput.value : "").trim();
      if (!customValue) {
        showToast("Por favor, especificá la raza cuando elegís \"Otro\".", "warning");
        return;
      }
      formData.set("breed", customValue);
    }
    if (!idMascota && vacunasDraft.length > 0) {
      formData.set("vacunas", JSON.stringify(vacunasDraft.map((item) => ({
        vacuna_id: item.vacuna_id,
        fecha_aplicacion: item.fecha_aplicacion,
      }))));
    }

    try {
      const response = await fetch("../api/gestionar_mascota.php", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        formMascota.reset();
        setTimeout(() => {
          storeReturnState();
          window.location.href = returnUrl;
        }, 1500);
      } else {
        throw new Error(result.message || "Ocurrió un error desconocido.");
      }
    } catch (error) {
      console.error("Error al guardar la mascota:", error);
      showToast(`Error: ${error.message}`, "danger");
    }
  });

  if (hasNotifUi) {
    fetchUnreadCount();
    setInterval(() => {
      fetchUnreadCount();
      if (notifDropdownOpen) {
        fetchNotifications();
      }
    }, 30000);
  }
});
