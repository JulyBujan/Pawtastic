document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mascotaId = urlParams.get("id");

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
      renderMascotaDetalle(mascota);

      // Intentar mostrar el mapa si el usuario está logueado
      if (mascota.ong_lat && mascota.ong_lon) {
        const token = localStorage.getItem("token");
        fetchUsuarioYMostrarMapa(token, mascota);
      } else {
        // Si no hay token o la ONG no tiene coordenadas, nos aseguramos de que el mapa no se muestre.
        const mapaContainer = document.getElementById("mapa-container");
        if (mapaContainer) {
          // Doble chequeo por si acaso
          mapaContainer.style.display = "none";
        }
      }
    } catch (error) {
      console.error(error);
      document.querySelector("main.container").innerHTML =
        '<p class="text-center">No se pudo cargar la información de la mascota. Intente más tarde.</p>';
    }
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
      document.getElementById("mapa-container").style.display = "block";
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

      document.getElementById("mapa-container").style.display = "block";

      if (response.ok) {
        const usuario = await response.json();
        // Si el usuario tiene coordenadas, mostramos ambos puntos y la distancia.
        const userCoords = [parseFloat(usuario.lat), parseFloat(usuario.lon)];
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
    const map = L.map("map").setView(ongCoords, 13); // Centra el mapa en la ONG por defecto

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const ongMarker = L.marker(ongCoords)
      .addTo(map)
      .bindPopup("<b>Ubicación de la ONG</b>");

    // Si también tenemos las coordenadas del usuario, añadimos su marcador y la línea.
    if (userCoords) {
      const userMarker = L.marker(userCoords)
        .addTo(map)
        .bindPopup("<b>Tu ubicación</b>")
        .openPopup();

      // Crear una línea punteada entre los dos puntos
      const polyline = L.polyline([userCoords, ongCoords], {
        color: "red",
        dashArray: "5, 10",
      }).addTo(map);

      // Ajustar el zoom del mapa para que ambos puntos sean visibles
      map.fitBounds(polyline.getBounds().pad(0.2)); // pad añade un poco de margen
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
    document.getElementById("mascota-nombre").textContent = mascota.nombre;
    document.getElementById("mascota-descripcion").textContent =
      mascota.descripcion;
    document.getElementById("mascota-imagen").src = `../img/mascotas/${
      mascota.imagen || "default.jpg"
    }`;
    document.getElementById("mascota-imagen").alt = mascota.nombre;
    document.getElementById("mascota-edad").textContent = formatarEdad(
      parseInt(mascota.edad, 10)
    );
    document.getElementById("mascota-especie").textContent = mascota.tipo;
    document.getElementById("mascota-tamano").textContent = mascota.tamaño;
    document.getElementById("mascota-raza").textContent = getRaza(mascota.breed);
    document.getElementById("mascota-color").textContent = getColor(mascota.color);
    document.getElementById("mascota-vacunas").textContent = mascota.vacunado;
    document.getElementById("mascota-esterilizado").textContent =
      mascota.esterilizado;
    document.getElementById("mascota-chip").textContent = mascota.chip;
    document.getElementById("mascota-energia").textContent = getEnergia(
      parseInt(mascota.energia)
    );
    document.getElementById("mascota-sociabilidad").textContent =
      getSociabilidad(parseInt(mascota.sociabilidad));
    document.getElementById("mascota-presencia").textContent = getPresencia(
      parseInt(mascota.presencia)
    );
    document.getElementById("mascota-estilo-vida").textContent = getEstiloVida(
      parseInt(mascota.estilov)
    );
    document.getElementById("mascota-estado").textContent =
      mascota.estado == 0 ? "En adopción" : "En gestión";
    document.getElementById("mascota-ong").textContent =
      mascota.ong_nombre || "ONG Desconocida";
  };

  fetchMascotaDetalle();

  document
    .getElementById("postular-btn")
    .addEventListener("click", async (e) => {
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
});
