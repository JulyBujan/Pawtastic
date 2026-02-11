document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") {
      showToast("Debes iniciar sesión para acceder a este módulo.", "warning");
    }
    window.location.href = "login.html";
    return;
  }

  const cancelBtn = document.getElementById("lostFoundCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "lost_found.html";
    });
  }

  const form = document.getElementById("lostFoundForm");
  if (!form) {
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");
  const validarDireccionBtn = document.getElementById("validar-direccion-btn");
  const usarUbicacionBtn = document.getElementById("usar-ubicacion-btn");
  const geoStatus = document.getElementById("geoStatus");
  const dateLabel = document.getElementById("lostDateLabel");
  const nameHint = document.getElementById("lostNameHint");
  const photoInput = document.getElementById("lostPhotoFile");
  const photoPreviewImg = document.getElementById("lostPhotoPreviewImg");
  const photoPlaceholder = document.getElementById("lostPhotoPlaceholder");
  let direccionValidada = false;

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

  const updateNameHint = () => {
    if (!nameHint) return;
    const typeValue = getValue("lostType");
    nameHint.classList.toggle("d-none", typeValue !== "FOUND");
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
      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        throw new Error("La respuesta del servidor no es válida.");
      }

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
      field.addEventListener("input", resetDireccionValidada);
    }
  });

  if (validarDireccionBtn) {
    validarDireccionBtn.addEventListener("click", handleValidarDireccion);
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      notify("Tu navegador no permite usar geolocalización.", "warning");
      if (geoStatus) {
        geoStatus.textContent = "Tu navegador no permite usar geolocalización.";
      }
      return;
    }

    if (usarUbicacionBtn) {
      usarUbicacionBtn.disabled = true;
      usarUbicacionBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Detectando...';
    }
    if (geoStatus) {
      geoStatus.textContent = "Detectando tu ubicación...";
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latField = document.getElementById("lat");
        const lonField = document.getElementById("lon");
        const cityField = document.getElementById("city");
        const roadField = document.getElementById("road");
        const houseField = document.getElementById("house_number");
        const suburbField = document.getElementById("suburb");

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        if (latField) latField.value = lat;
        if (lonField) lonField.value = lon;

        try {
          const response = await fetch(
            `/api/reverse_geocodificar.php?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
            { headers: { Authorization: "Bearer " + token } }
          );
          const rawText = await response.text();
          let data = {};
          try {
            data = rawText ? JSON.parse(rawText) : {};
          } catch (parseError) {
            throw new Error("La respuesta del servidor no es válida.");
          }
          if (!response.ok) {
            throw new Error(data.message || "No se pudo obtener la dirección.");
          }

          if (cityField && data.city) cityField.value = data.city;
          if (roadField && data.road) roadField.value = data.road;
          if (houseField && data.house_number) houseField.value = data.house_number;
          if (suburbField) suburbField.value = data.suburb || "";

          direccionValidada = Boolean(suburbField && suburbField.value);
          if (direccionValidada) {
            notify("Ubicación detectada y dirección completada.", "success");
            if (geoStatus) {
              geoStatus.textContent = "Ubicación detectada y dirección completada.";
            }
          } else {
            notify("Ubicación detectada. Revisá la dirección y validá el barrio.", "warning");
            if (geoStatus) {
              geoStatus.textContent = "Ubicación detectada. Revisá la dirección y validá el barrio.";
            }
          }
        } catch (error) {
          notify("Ubicación detectada, pero no se pudo completar la dirección.", "warning");
          if (geoStatus) {
            geoStatus.textContent = "Ubicación detectada. Completá la dirección manualmente y validá.";
          }
        } finally {
          if (usarUbicacionBtn) {
            usarUbicacionBtn.disabled = false;
            usarUbicacionBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Usar mi ubicación';
          }
        }
      },
      (error) => {
        if (error && error.code === error.PERMISSION_DENIED) {
          notify("Necesitamos permiso para acceder a tu ubicación.", "warning");
          if (geoStatus) {
            geoStatus.textContent = "No se otorgó permiso para acceder a la ubicación.";
          }
        } else {
          notify("No se pudo obtener tu ubicación. Intentá de nuevo.", "warning");
          if (geoStatus) {
            geoStatus.textContent = "No se pudo obtener tu ubicación. Intentá de nuevo.";
          }
        }
        if (usarUbicacionBtn) {
          usarUbicacionBtn.disabled = false;
          usarUbicacionBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Usar mi ubicación';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (usarUbicacionBtn) {
    usarUbicacionBtn.addEventListener("click", handleUseLocation);
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
    typeSelect.addEventListener("change", () => {
      updateDateLabel();
      updateNameHint();
    });
    updateDateLabel();
    updateNameHint();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requiredIds = ["lostType", "lostSpecies", "city", "road", "house_number"];
    requiredIds.forEach((id) => {
      const field = document.getElementById(id);
      if (field) {
        const value = `${field.value ?? ""}`.trim();
        field.classList.toggle("is-invalid", value === "");
      }
    });

    const payload = {
      type: getValue("lostType"),
      species: getValue("lostSpecies"),
      size: getValue("lostSize") || null,
      pet_name: getValue("lostPetName") || null,
      breed: getValue("lostBreed") || null,
      colors: getValue("lostColors") || null,
      date_seen: getValue("lostDate") || null,
      description: getValue("lostDescription") || null,
      city: getValue("city"),
      road: getValue("road"),
      house_number: getValue("house_number"),
      departamento: getValue("departamento") || null,
      suburb: getValue("suburb") || null,
      lat: getValue("lat") || null,
      lon: getValue("lon") || null,
    };

    if (!payload.type || !payload.species || !payload.city || !payload.road || !payload.house_number) {
      notify("Completá Tipo, Especie y Dirección.", "warning");
      return;
    }

    if (!payload.suburb) {
      notify("La dirección debe estar validada con barrio.", "warning");
      return;
    }

    if (
      !checkLength(payload.pet_name, limits.pet_name, "Nombre") ||
      !checkLength(payload.breed, limits.breed, "Raza") ||
      !checkLength(payload.colors, limits.colors, "Colores") ||
      !checkLength(payload.city, limits.city, "Localidad") ||
      !checkLength(payload.road, limits.road, "Calle") ||
      !checkLength(payload.departamento, limits.departamento, "Depto") ||
      !checkLength(payload.description, limits.description, "Descripción") ||
      !checkLength(payload.house_number, 10, "Número")
    ) {
      return;
    }

    if (!direccionValidada) {
      const ok = await handleValidarDireccion();
      if (!ok) {
        return;
      }
    }

    payload.location_text = buildLocationText();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Publicando...";
    }

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });
      if (photoInput && photoInput.files && photoInput.files[0]) {
        formData.append("imagen", photoInput.files[0]);
      }

      const response = await fetch("../api/lost_found_create.php", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data && data.message ? data.message : "No se pudo publicar.";
        throw new Error(message);
      }

      notify("Publicación creada.", "success");

      sessionStorage.setItem(
        "lostFoundToast",
        JSON.stringify({ message: "La mascota fue publicada.", type: "success" })
      );

      if (data && data.id) {
        window.location.href = `lost_found_detail.html?id=${data.id}`;
      } else {
        window.location.href = "lost_found.html";
      }
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publicar";
      }
    }
  });
});
