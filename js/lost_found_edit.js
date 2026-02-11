document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") {
      showToast("Debes iniciar sesión para acceder a este módulo.", "warning");
    }
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  if (!postId) {
    if (typeof showToast === "function") {
      showToast("Falta el ID de la publicación.", "warning");
    }
    window.location.href = "lost_found.html";
    return;
  }

  const cancelBtn = document.getElementById("lostFoundCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = `lost_found_detail.html?id=${postId}`;
    });
  }

  const form = document.getElementById("lostFoundForm");
  if (!form) {
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");
  const validarDireccionBtn = document.getElementById("validar-direccion-btn");
  const dateLabel = document.getElementById("lostDateLabel");
  const photoInput = document.getElementById("lostPhotoFile");
  const photoPreviewImg = document.getElementById("lostPhotoPreviewImg");
  const photoPlaceholder = document.getElementById("lostPhotoPlaceholder");
  const currentLocationField = document.getElementById("lostCurrentLocation");
  let direccionValidada = false;
  let addressTouched = false;
  let existingLocationText = "";
  let existingSuburb = "";
  let existingLat = "";
  let existingLon = "";

  const getValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const notify = (message, type = "warning") => {
    if (typeof showToast === "function") {
      showToast(message, type);
    }
  };

  const limits = {
    pet_name: 100,
    breed: 80,
    colors: 255,
    description: 600,
    city: 120,
    road: 120,
    departamento: 40,
  };

  const checkLength = (value, max, label) => {
    if (value && value.length > max) {
      notify(`${label} supera el máximo de ${max} caracteres.`, "warning");
      return false;
    }
    return true;
  };

  const updateDateLabel = () => {
    if (!dateLabel) return;
    const typeValue = getValue("lostType");
    if (typeValue === "LOST") {
      dateLabel.textContent = "Fecha de extravio";
    } else if (typeValue === "FOUND") {
      dateLabel.textContent = "Fecha de hallazgo";
    } else {
      dateLabel.textContent = "Fecha vista";
    }
  };

  const resolvePhoto = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
    if (value.startsWith("../")) return value;
    return `../${value}`;
  };

  const buildLocationText = () => {
    const city = getValue("city");
    const road = getValue("road");
    const houseNumber = getValue("house_number");
    const departamento = getValue("departamento");
    const suburb = getValue("suburb");
    const locality = suburb && suburb !== city ? `${suburb}, ${city}` : city;
    const deptoPart = departamento ? ` ${departamento}` : "";
    return `${road} ${houseNumber}${deptoPart}, ${locality}`;
  };

  const handleValidarDireccion = async () => {
    direccionValidada = false;
    const road = getValue("road");
    const houseNumber = getValue("house_number");
    const city = getValue("city");

    if (!road || !houseNumber || !city) {
      notify("Por favor, completa la calle, número y localidad para validar.", "warning");
      return false;
    }

    const url = `/api/geocodificar.php?road=${encodeURIComponent(road)}&house_number=${encodeURIComponent(
      houseNumber
    )}&city=${encodeURIComponent(city)}`;

    try {
      if (validarDireccionBtn) {
        validarDireccionBtn.disabled = true;
        validarDireccionBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando...';
      }

      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al validar la dirección.");
      }

      const cityField = document.getElementById("city");
      const roadField = document.getElementById("road");
      const houseField = document.getElementById("house_number");
      const latField = document.getElementById("lat");
      const lonField = document.getElementById("lon");
      const suburbField = document.getElementById("suburb");

      if (cityField) cityField.value = data.city || city;
      if (roadField) roadField.value = data.road || road;
      if (houseField) houseField.value = data.house_number || houseNumber;
      if (latField) latField.value = data.lat || "";
      if (lonField) lonField.value = data.lon || "";
      if (suburbField) suburbField.value = data.suburb || "";

      direccionValidada = Boolean(suburbField && suburbField.value);
      if (!direccionValidada) {
        notify("No se pudo detectar el barrio. Revisá la dirección y validá de nuevo.", "warning");
        return false;
      }

      notify("Dirección validada con éxito.", "success");
      return true;
    } catch (error) {
      notify(error.message, "danger");
      return false;
    } finally {
      if (validarDireccionBtn) {
        validarDireccionBtn.disabled = false;
        validarDireccionBtn.textContent = "Validar dirección";
      }
    }
  };

  const resetDireccionValidada = () => {
    direccionValidada = false;
    const latField = document.getElementById("lat");
    const lonField = document.getElementById("lon");
    const suburbField = document.getElementById("suburb");
    if (latField) latField.value = "";
    if (lonField) lonField.value = "";
    if (suburbField) suburbField.value = "";
  };

  ["city", "road", "house_number", "departamento"].forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("input", () => {
        addressTouched = true;
        resetDireccionValidada();
      });
    }
  });

  if (validarDireccionBtn) {
    validarDireccionBtn.addEventListener("click", handleValidarDireccion);
  }

  if (photoInput) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        if (photoPreviewImg) {
          photoPreviewImg.classList.add("d-none");
          photoPreviewImg.src = "";
        }
        if (photoPlaceholder) {
          photoPlaceholder.classList.remove("d-none");
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (photoPreviewImg) {
          photoPreviewImg.src = event.target.result;
          photoPreviewImg.classList.remove("d-none");
        }
        if (photoPlaceholder) {
          photoPlaceholder.classList.add("d-none");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const typeSelect = document.getElementById("lostType");
  if (typeSelect) {
    typeSelect.addEventListener("change", updateDateLabel);
    updateDateLabel();
  }

  const fillForm = (data) => {
    const setValue = (id, value) => {
      const field = document.getElementById(id);
      if (field) field.value = value ?? "";
    };

    setValue("lostType", data.type || "");
    setValue("lostSpecies", data.species || "");
    setValue("lostSize", data.size || "");
    setValue("lostPetName", data.pet_name || "");
    setValue("lostBreed", data.breed || "");
    setValue("lostColors", data.colors || "");
    setValue("lostDate", data.date_seen || "");
    setValue("lostDescription", data.description || "");

    existingLocationText = data.location_text || "";
    existingSuburb = data.suburb || "";
    existingLat = data.lat ?? "";
    existingLon = data.lon ?? "";

    if (currentLocationField) {
      currentLocationField.value = existingLocationText;
    }
    const latField = document.getElementById("lat");
    const lonField = document.getElementById("lon");
    const suburbField = document.getElementById("suburb");
    if (latField) latField.value = existingLat;
    if (lonField) lonField.value = existingLon;
    if (suburbField) suburbField.value = existingSuburb;

    direccionValidada = Boolean(existingSuburb);
    updateDateLabel();

    if (photoPreviewImg && data.photo_url) {
      photoPreviewImg.src = resolvePhoto(data.photo_url);
      photoPreviewImg.classList.remove("d-none");
      if (photoPlaceholder) {
        photoPlaceholder.classList.add("d-none");
      }
    }

    if (!existingSuburb) {
      addressTouched = true;
      notify("Debes validar la dirección para poder guardar cambios.", "warning");
    }
  };

  const fetchDetail = async () => {
    try {
      const response = await fetch(`../api/lost_found_get.php?id=${postId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar la publicación.");
      }
      const data = await response.json();
      if (!data.is_owner) {
        notify("Solo el creador puede editar esta publicación.", "warning");
        window.location.href = `lost_found_detail.html?id=${postId}`;
        return;
      }
      fillForm(data);
    } catch (error) {
      notify(error.message, "danger");
      window.location.href = "lost_found.html";
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requiredIds = ["lostType", "lostSpecies"];
    if (addressTouched) {
      requiredIds.push("city", "road", "house_number");
    }

    requiredIds.forEach((id) => {
      const field = document.getElementById(id);
      if (field) {
        const value = `${field.value ?? ""}`.trim();
        field.classList.toggle("is-invalid", value === "");
      }
    });

    const payload = {
      id: postId,
      type: getValue("lostType"),
      species: getValue("lostSpecies"),
      size: getValue("lostSize") || null,
      pet_name: getValue("lostPetName") || null,
      breed: getValue("lostBreed") || null,
      colors: getValue("lostColors") || null,
      date_seen: getValue("lostDate") || null,
      description: getValue("lostDescription") || null,
    };

    if (!payload.type || !payload.species) {
      notify("Completá Tipo y Especie.", "warning");
      return;
    }

    if (
      !checkLength(payload.pet_name, limits.pet_name, "Nombre") ||
      !checkLength(payload.breed, limits.breed, "Raza") ||
      !checkLength(payload.colors, limits.colors, "Colores") ||
      !checkLength(payload.description, limits.description, "Descripción")
    ) {
      return;
    }

    if (addressTouched) {
      payload.city = getValue("city");
      payload.road = getValue("road");
      payload.house_number = getValue("house_number");
      payload.departamento = getValue("departamento") || null;
      payload.suburb = getValue("suburb") || null;
      payload.lat = getValue("lat") || null;
      payload.lon = getValue("lon") || null;

      if (!payload.city || !payload.road || !payload.house_number) {
        notify("Completá la nueva dirección.", "warning");
        return;
      }

      if (
        !checkLength(payload.city, limits.city, "Localidad") ||
        !checkLength(payload.road, limits.road, "Calle") ||
        !checkLength(payload.departamento, limits.departamento, "Depto") ||
        !checkLength(payload.house_number, 10, "Número")
      ) {
        return;
      }

      if (!direccionValidada) {
        const ok = await handleValidarDireccion();
        if (!ok) {
          return;
        }
        payload.suburb = getValue("suburb") || null;
        payload.lat = getValue("lat") || null;
        payload.lon = getValue("lon") || null;
      }
    } else {
      // Se mantiene la dirección actual en el servidor.
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value ?? "");
      }
    });

    if (photoInput && photoInput.files && photoInput.files[0]) {
      formData.append("imagen", photoInput.files[0]);
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
    }

    try {
      const response = await fetch("../api/lost_found_update.php", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar la publicación.");
      }
      notify("Publicación actualizada.", "success");
      window.location.href = `lost_found_detail.html?id=${postId}`;
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar cambios";
      }
    }
  });

  fetchDetail();
});
