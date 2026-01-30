document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mascotaId = urlParams.get("id");
  const mapaSection = document.getElementById("mapa-section");
  const mapaCollapse = document.getElementById("mapa-collapse");
  let mascotaData = null;
  let mapInstance = null;

  if (!mascotaId) {
    window.location.href = "./catalogo.html";
    return;
  }

  const getSociabilidad = (level) => {
    switch (level) {
      case 1:
        return "Reservado";
      case 2:
        return "Selectivo";
      case 3:
        return "Muy Sociable";
      default:
        return "No especificado";
    }
  };

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

  const getEnergia = (level) => {
    switch (level) {
      case 1:
        return "Bajo";
      case 2:
        return "Medio";
      case 3:
        return "Alto";
      default:
        return "No especificado";
    }
  };

  const getPresencia = (level) => {
    switch (level) {
      case 1:
        return "Independiente";
      case 2:
        return "Tolera soledad";
      case 3:
        return "Compañia constante";
      default:
        return "No especificado";
    }
  };

  const getEstiloVida = (level) => {
    switch (level) {
      case 1:
        return "Indoor";
      case 2:
        return "Flexible";
      case 3:
        return "Outdoor";
      default:
        return "No especificado";
    }
  };

  const getRaza = (breedValue) => {
    const razas = {
      "DOMESTIC SH": "Mestizo Pelo Corto",
      "PIT BULL": "Pit Bull",
      "LABRADOR RETR": "Labrador Retriever",
      "GERM SHEPHERD": "Pastor Alemán",
      "DOMESTIC MH": "Mestizo Pelo Mediano",
      "BEAGLE": "Beagle",
      "BOXER": "Boxer",
      "DOMESTIC LH": "Mestizo Pelo Largo",
      "CHIHUAHUA SH": "Chihuahua Pelo Corto",
      "SHIH TZU": "Shih Tzu",
      "SIBERIAN HUSKY": "Husky Siberiano",
      "ALASKAN HUSKY": "Husky de Alaska",
      "OTHER": "Otro",
    };
    return razas[breedValue] || breedValue || "No especificada";
  };

  const getColor = (colorValue) => {
    const colores = {
      "BLACK": "Negro",
      "TABBY": "Atigrado",
      "WHITE": "Blanco",
      "BROWN": "Marrón",
      "GRAY": "Gris",
      "TAN": "Canela",
      "BRINDLE": "Brindle",
      "TORTIE": "Tortuga",
      "ORANGE": "Naranja",
      "CALICO": "Calicó",
      "OTHER": "Otro",
    };
    return colores[colorValue] || colorValue || "No especificado";
  };

  /**
   * Convierte la edad total en meses a un formato legible de años y meses.
   * @param {number} totalMeses - La edad total de la mascota en meses.
   * @returns {string} - La edad formateada como texto.
   */
  const formatarEdad = (totalMeses) => {
    if (totalMeses === null || isNaN(totalMeses) || totalMeses < 0) {
      return "No especificada";
    }
    if (totalMeses === 0) {
      return "Recién nacido";
    }
    const anos = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;

    const partes = [];
    if (anos > 0) {
      partes.push(`${anos} ${anos === 1 ? "año" : "años"}`);
    }
    if (meses > 0) {
      partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
    }
    return partes.join(" y ");
  };

  const fetchMascotaDetalle = async () => {
    try {
      const response = await fetch(`../api/get_mascota.php?id=${mascotaId}`);
      if (!response.ok) {
        throw new Error("Error al cargar la mascota");
      }
      const mascota = await response.json();
      mascotaData = mascota;
      renderMascotaDetalle(mascota);
      if (mascota.ong_lat && mascota.ong_lon) {
        if (mapaSection) {
          mapaSection.classList.remove("d-none");
        }
      } else if (mapaSection) {
        mapaSection.classList.add("d-none");
      }
    } catch (error) {
      console.error(error);
      document.querySelector("main.container").innerHTML =
        '<p class="text-center">No se pudo cargar la información de la mascota. Intente más tarde.</p>';
    }
  };

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

  /**
   * Obtiene los datos del usuario logueado y, si tiene coordenadas, muestra el mapa.
   * @param {string} token - El token de autenticación del usuario.
   * @param {object} mascota - El objeto con los datos de la mascota, incluyendo ong_lat y ong_lon.
   */
  const fetchUsuarioYMostrarMapa = async (token, mascota) => {
    const ongCoords = [
      parseFloat(mascota.ong_lat),
      parseFloat(mascota.ong_lon),
    ];

    // Si no hay token, mostramos el mapa solo con la ONG.
    if (!token) {
      document.getElementById(
        "distancia-info"
      ).textContent = `Inicia sesión para ver la distancia desde tu ubicación.`;
      inicializarMapa(null, ongCoords);
      return;
    }

    try {
      const response = await fetch("/api/usuario.php", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (handleUnauthorized(response)) {
        return;
      }
    if (response.ok) {
      const usuario = await response.json();
      // Si el usuario tiene coordenadas, mostramos ambos puntos y la distancia.
      const userLat = parseFloat(usuario.lat);
      const userLon = parseFloat(usuario.lon);
      const userCoords = [userLat, userLon];
      if (!Number.isFinite(userLat) || !Number.isFinite(userLon)) {
        document.getElementById(
          "distancia-info"
        ).textContent = `Completá tu dirección en el perfil para ver la distancia.`;
        inicializarMapa(null, ongCoords);
        return;
      }
      const distancia = calcularDistancia(
        userCoords[0],
        userCoords[1],
        ongCoords[0],
        ongCoords[1]
        );
        document.getElementById(
          "distancia-info"
        ).textContent = `La ONG se encuentra a aproximadamente ${distancia.toFixed(
          1
        )} km de tu ubicación.`;
        inicializarMapa(userCoords, ongCoords);
      } else {
        // Si la petición al usuario falla o no tiene coords, mostramos solo la ONG.
        document.getElementById(
          "distancia-info"
        ).textContent = `Valida tu dirección en tu perfil para ver la distancia.`;
        inicializarMapa(null, ongCoords);
      }
    } catch (error) {
      console.warn(
        "No se pudo cargar la información del usuario para el mapa:",
        error
      );
    }
  };

  /**
   * Inicializa el mapa de Leaflet con marcadores para el usuario y la ONG.
   * @param {Array<number>|null} userCoords - Coordenadas [lat, lon] del usuario.
   * @param {Array<number>} ongCoords - Coordenadas [lat, lon] de la ONG.
   */
  const inicializarMapa = (userCoords, ongCoords) => {
    mapInstance = L.map("map").setView(ongCoords, 13); // Centra el mapa en la ONG por defecto

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    const ongMarker = L.marker(ongCoords)
      .addTo(mapInstance)
      .bindPopup("<b>Ubicación de la ONG</b>");

    // Si también tenemos las coordenadas del usuario, añadimos su marcador y la línea.
    if (userCoords) {
      const userMarker = L.marker(userCoords)
        .addTo(mapInstance)
        .bindPopup("<b>Tu ubicación</b>")
        .openPopup();

      // Crear una línea punteada entre los dos puntos
      const polyline = L.polyline([userCoords, ongCoords], {
        color: "red",
        dashArray: "5, 10",
      }).addTo(mapInstance);

      // Ajustar el zoom del mapa para que ambos puntos sean visibles
      mapInstance.fitBounds(polyline.getBounds().pad(0.2)); // pad añade un poco de margen
    } else {
      // Si solo tenemos la ONG, abrimos su popup por defecto.
      ongMarker.openPopup();
    }
  };

  /**
   * Calcula la distancia en kilómetros entre dos puntos geográficos (fórmula de Haversine).
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} - Distancia en km.
   */
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    return distancia;
  };

  const renderMascotaDetalle = (mascota) => {
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value ?? "";
      }
    };

    const mainImage = mascota.imagen || null;
    const extraImages = Array.isArray(mascota.imagenes)
      ? mascota.imagenes.filter(Boolean)
      : [];
    const mainImageUrl = resolveImageUrl(mainImage);

    const nombreEl = document.getElementById("mascota-nombre");
    if (nombreEl) {
      nombreEl.textContent = mascota.nombre || "";
    }
    setText("mascota-descripcion", mascota.descripcion);
    document.getElementById("mascota-imagen").src = mainImageUrl;
    document.getElementById("mascota-imagen").alt = mascota.nombre;
    const edadEl = document.getElementById("mascota-edad");
    if (edadEl) {
      edadEl.textContent = formatarEdad(parseInt(mascota.edad, 10));
    }
    const especieEl = document.getElementById("mascota-especie");
    if (especieEl) {
      especieEl.textContent = mascota.tipo;
    }
    const tamanoEl = document.getElementById("mascota-tamano");
    if (tamanoEl) {
      tamanoEl.textContent = mascota.tamaño;
    }
    setText("mascota-raza", getRaza(mascota.breed));
    setText("mascota-color", getColor(mascota.color));
    setText("mascota-vacunas", mascota.vacunado);
    setText("mascota-esterilizado", mascota.esterilizado);
    setText("mascota-chip", mascota.chip);
    setText("mascota-energia", getEnergia(parseInt(mascota.energia)));
    setText("mascota-sociabilidad", getSociabilidad(parseInt(mascota.sociabilidad)));
    setText("mascota-presencia", getPresencia(parseInt(mascota.presencia)));
    setText("mascota-estilo-vida", getEstiloVida(parseInt(mascota.estilov)));
    let estadoLabel = "En revisión";
    if (parseInt(mascota.estado, 10) === 0) {
      estadoLabel = "Activa";
    } else if (parseInt(mascota.estado, 10) === 2) {
      estadoLabel = "Adoptada";
    }
    setText("mascota-estado", estadoLabel);
    setText("mascota-ong", mascota.ong_nombre || "ONG Desconocida");

    const chipEdad = document.getElementById("chip-edad");
    if (chipEdad) {
      chipEdad.textContent = `Edad: ${formatarEdad(parseInt(mascota.edad, 10))}`;
    }
    const chipEspecie = document.getElementById("chip-especie");
    if (chipEspecie) {
      chipEspecie.textContent = mascota.tipo ? mascota.tipo : "Especie";
    }
    const chipTamano = document.getElementById("chip-tamano");
    if (chipTamano) {
      chipTamano.textContent = mascota.tamaño ? `Tamaño: ${mascota.tamaño}` : "Tamaño";
    }
    const chipEnergia = document.getElementById("chip-energia");
    if (chipEnergia) {
      chipEnergia.textContent = `Energía: ${getEnergia(parseInt(mascota.energia))}`;
    }

    const thumbsContainer = document.getElementById("mascota-thumbs");
    if (thumbsContainer) {
      thumbsContainer.innerHTML = "";
      const gallery = document.getElementById("detailGallery");
      const hasExtras = extraImages.length > 0;
      if (gallery) {
        gallery.classList.toggle("equal", hasExtras);
      }

      if (hasExtras) {
        const extraSlots = 3;
        const extras = extraImages.slice(0, extraSlots);
        extras.forEach((img) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "detail-thumb";
          const imgEl = document.createElement("img");
          imgEl.src = resolveImageUrl(img);
          imgEl.alt = mascota.nombre;
          btn.appendChild(imgEl);
          btn.addEventListener("click", () => {
            document.getElementById("mascota-imagen").src = resolveImageUrl(img);
          });
          thumbsContainer.appendChild(btn);
        });

        const missing = extraSlots - extras.length;
        for (let i = 0; i < missing; i += 1) {
          const placeholder = document.createElement("div");
          placeholder.className = "detail-thumb placeholder";
          const icon = document.createElement("i");
          icon.className = "bi bi-image";
          placeholder.appendChild(icon);
          thumbsContainer.appendChild(placeholder);
        }
      }
    }
  };

  fetchMascotaDetalle();

  if (mapaCollapse) {
    mapaCollapse.addEventListener("show.bs.collapse", () => {
      if (!mascotaData || !mascotaData.ong_lat || !mascotaData.ong_lon || mapInstance) {
        if (mapInstance) {
          setTimeout(() => mapInstance.invalidateSize(), 200);
        }
        return;
      }
      const token = localStorage.getItem("token");
      fetchUsuarioYMostrarMapa(token, mascotaData);
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize();
        }
      }, 200);
    });
  }

  const postularBtn = document.getElementById("postular-btn");
  if (postularBtn) {
    postularBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "./login.html";
        return;
      }

      try {
        const response = await fetch("../api/postular.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id_mascota: mascotaId }),
        });

        if (handleUnauthorized(response)) {
          return;
        }
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error al postularse");
        }

        showToast(data.message, "success");
      } catch (error) {
        console.error("Error en la postulación:", error);
        showToast(error.message, "danger");
      }
    });
  }
});
