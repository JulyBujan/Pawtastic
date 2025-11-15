document.addEventListener("DOMContentLoaded", () => {
  const btnSemana = document.getElementById("btn-semana");
  const btnMes = document.getElementById("btn-mes");
  const formPeriodoPersonalizado = document.getElementById(
    "form-periodo-personalizado"
  );
  const indicadoresClaveContainer = document.getElementById(
    "indicadores-clave-container"
  );
  const reportePersonalizadoContainer = document.getElementById(
    "reporte-personalizado-container"
  );
  const adopcionesRapidasContainer = document.getElementById(
    "adopciones-rapidas-container"
  );
  const adopcionesPorZonaContainer = document.getElementById(
    "adopciones-por-zona-container"
  );
  const mascotasEnEsperaContainer = document.getElementById(
    "mascotas-en-espera-container"
  );
  const loadingSpinner = document.getElementById("loading-spinner");

  const fechaFinInput = document.getElementById("fecha_fin_manual");
  const fechaInicioInput = document.getElementById("fecha_inicio_manual");

  let publicacionesChartManual = null;
  let mapaZonas = null;

  /**
   * Muestra u oculta el spinner de carga.
   * @param {boolean} show - True para mostrar, false para ocultar.
   */
  const toggleLoading = (show) => {
    loadingSpinner.classList.toggle("d-none", !show);
    // Oculta ambos contenedores mientras carga
    if (show) {
      indicadoresClaveContainer.classList.add("d-none");
      reportePersonalizadoContainer.classList.add("d-none");
      adopcionesRapidasContainer.classList.add("d-none");
      adopcionesPorZonaContainer.classList.add("d-none");
      mascotasEnEsperaContainer.classList.add("d-none");
    }
  };

  /**
   * Obtiene los datos del reporte desde la API.
   * @param {string} inicio - Fecha de inicio (YYYY-MM-DD).
   * @param {string} fin - Fecha de fin (YYYY-MM-DD).
   */
  const fetchReportePersonalizado = async (inicio, fin) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Debes iniciar sesión para ver los reportes.", "danger");
      window.location.href = "login.html";
      return;
    }

    toggleLoading(true);

    try {
      const url = `/api/reportes.php?fecha_inicio=${inicio}&fecha_fin=${fin}`;

      // La petición para el reporte personalizado no necesita 'accion'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          showToast(
            "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
            "warning"
          );
          window.location.href = "login.html";
          return; // Detener la ejecución
        }
        throw new Error(data.message || "Error al generar el reporte.");
      }

      renderizarReportePersonalizado(data, inicio, fin);
    } catch (error) {
      console.error("Error al obtener el reporte:", error);
      showToast(error.message, "danger");
    } finally {
      toggleLoading(false);
    }
  };

  /**
   * Obtiene los datos iniciales (indicadores clave y adopción por edad).
   */
  const fetchDatosIniciales = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Debes iniciar sesión para ver los reportes.", "danger");
      window.location.href = "login.html";
      return;
    }

    toggleLoading(true);

    try {
      // Petición para los indicadores clave (comportamiento por defecto del API)
      const resIndicadores = await fetch(`/api/reportes.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataIndicadores = await resIndicadores.json();
      if (!resIndicadores.ok)
        throw new Error(
          dataIndicadores.message || "Error al cargar indicadores."
        );
      renderizarIndicadoresClave(dataIndicadores);

      // Petición para las estadísticas por edad
      const resAdopcionEdad = await fetch(
        `/api/reportes.php?accion=adopcion_por_edad`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const dataAdopcionEdad = await resAdopcionEdad.json();
      if (!resAdopcionEdad.ok)
        throw new Error(
          dataAdopcionEdad.message || "Error al cargar stats por edad."
        );
      if (dataAdopcionEdad.status === "success") {
        renderizarAdopcionPorEdad(dataAdopcionEdad.data);
      } else {
        throw new Error(
          dataAdopcionEdad.message || "No se pudieron cargar las estadísticas."
        );
      }

      // Petición para las estadísticas por zona
      const resAdopcionZona = await fetch(
        `/api/reportes.php?accion=adopciones_por_zona`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const dataAdopcionZona = await resAdopcionZona.json();
      if (!resAdopcionZona.ok)
        throw new Error(
          dataAdopcionZona.message || "Error al cargar stats por zona."
        );
      if (dataAdopcionZona.status === "success") {
        renderizarAdopcionesPorZona(dataAdopcionZona.data);
      }

      // Petición para las mascotas con más tiempo en espera
      const resMascotasEspera = await fetch(
        `/api/reportes.php?accion=mascotas_en_espera`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const dataMascotasEspera = await resMascotasEspera.json();
      if (!resMascotasEspera.ok)
        throw new Error(
          dataMascotasEspera.message || "Error al cargar mascotas en espera."
        );
      if (dataMascotasEspera.status === "success") {
        renderizarMascotasEnEspera(dataMascotasEspera.data);
      }

    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      showToast(error.message, "danger");
    } finally {
      toggleLoading(false);
    }
  };

  /**
   * Renderiza los datos del reporte en la página.
   * @param {object} data - Los datos del reporte personalizado desde la API.
   * @param {string} inicio - Fecha de inicio del reporte.
   * @param {string} fin - Fecha de fin del reporte.
   */
  const renderizarReportePersonalizado = (data, inicio, fin) => {
    const tituloEl = document.getElementById("titulo-reporte-personalizado");
    tituloEl.textContent = `Resultados para el período: ${new Date(
      inicio + "T00:00:00"
    ).toLocaleDateString()} - ${new Date(
      fin + "T00:00:00"
    ).toLocaleDateString()}`;

    // 1. Renderizar estadísticas de adopciones
    const stats = data.adopciones;
    const adopcionesStatsContainerManual = document.getElementById(
      "adopciones-stats-manual"
    );
    adopcionesStatsContainerManual.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-primary text-white h-100">
                    <div class="card-body">
                        <h5 class="card-title">Iniciadas</h5>
                        <p class="card-text fs-2 fw-bold">${stats.iniciadas}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info-subtle text-dark h-100">
                    <div class="card-body">
                        <h5 class="card-title">Actualizadas</h5>
                        <p class="card-text fs-2 fw-bold">${stats.actualizadas}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white h-100">
                    <div class="card-body">
                        <h5 class="card-title">Aprobadas</h5>
                        <p class="card-text fs-2 fw-bold">${stats.aprobadas}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-danger text-white h-100">
                    <div class="card-body">
                        <h5 class="card-title">Canceladas</h5>
                        <p class="card-text fs-2 fw-bold">${stats.canceladas}</p>
                    </div>
                </div>
            </div>
        `;

    // 2. Renderizar publicaciones que terminaron en adopción
    document.getElementById("publicaciones-con-adopcion-manual").textContent =
      data.publicaciones.con_adopcion_aprobada;

    // 3. Renderizar gráfico de publicaciones
    const chartData = data.publicaciones.por_dia;
    const ctx = document
      .getElementById("publicacionesChart-manual")
      .getContext("2d");

    if (publicacionesChartManual) {
      publicacionesChartManual.destroy();
    }

    publicacionesChartManual = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartData.map((d) => d.fecha),
        datasets: [
          {
            label: "Mascotas Publicadas por Día",
            data: chartData.map((d) => d.cantidad),
            backgroundColor: "rgba(247, 147, 30, 0.7)",
            borderColor: "rgba(247, 147, 30, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });

    reportePersonalizadoContainer.classList.remove("d-none");
  };

  /**
   * Renderiza los indicadores clave de 30 y 90 días.
   * @param {object} data - La respuesta de la API con los bloques de 30 y 90 días.
   */
  const renderizarIndicadoresClave = (data) => {
    const tiempos30 =
      data.ultimos_30_dias.metricas_clave.tiempo_promedio_adopcion || {};
    document.getElementById("tiempo-promedio-perros-30").textContent =
      tiempos30.perro ?? "--";
    document.getElementById("tiempo-promedio-gatos-30").textContent =
      tiempos30.gato ?? "--";

    const tiempos90 =
      data.ultimos_90_dias.metricas_clave.tiempo_promedio_adopcion || {};
    document.getElementById("tiempo-promedio-perros-90").textContent =
      tiempos90.perro ?? "--";
    document.getElementById("tiempo-promedio-gatos-90").textContent =
      tiempos90.gato ?? "--";

    indicadoresClaveContainer.classList.remove("d-none");
  };

  /**
   * Renderiza las estadísticas de adopción por edad.
   * @param {object} data - Datos con 'perros' y 'gatos'.
   */
  const renderizarAdopcionPorEdad = (data) => {
    const { perros, gatos } = data;

    const actualizarLista = (listId, stats, badgeColor) => {
      const listElement = document.getElementById(listId);
      if (!listElement) return;

      const rangos = [
        { key: "cachorros", label: "Cachorros (0-1 año)" },
        { key: "jovenes", label: "Jóvenes (1-3 años)" },
        { key: "adultos", label: "Adultos (3-7 años)" },
        { key: "seniors", label: "Seniors (7+ años)" },
      ];

      listElement.innerHTML = ""; // Limpiar contenido placeholder

      rangos.forEach((rango) => {
        const dias =
          stats[rango.key] !== null ? `${stats[rango.key]} días` : "N/A";
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `${rango.label} <span class="badge bg-${badgeColor} rounded-pill">${dias}</span>`;
        listElement.appendChild(li);
      });
    };

    actualizarLista("edad-stats-perros", perros, "primary");
    actualizarLista("edad-stats-gatos", gatos, "success");

    adopcionesRapidasContainer.classList.remove("d-none");
  };

  /**
   * Renderiza la tabla de adopciones por zona.
   * @param {Array} data - Array de objetos con barrio, ciudad y total_adopciones.
   */
  const renderizarAdopcionesPorZona = (data) => {
    // Inicializar el mapa una sola vez
    if (!mapaZonas) {
      mapaZonas = L.map("mapa-zonas").setView([-31.4135, -64.181], 12); // Coordenadas de Córdoba
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapaZonas);
    } else {
      // Limpiar marcadores anteriores si el mapa ya existe (para futuras recargas)
      mapaZonas.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapaZonas.removeLayer(layer);
        }
      });
    }

    // Renderizar la tabla
    const tablaBody = document.getElementById("tabla-zonas-body");
    if (!tablaBody) return;

    tablaBody.innerHTML = ""; // Limpiar contenido

    if (data.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay datos de adopciones por zona para mostrar.</td></tr>`;
    } else {
      data.forEach((zona, index) => {
        // Añadir marcador al mapa
        if (zona.lat && zona.lon) {
          const marker = L.marker([zona.lat, zona.lon]).addTo(mapaZonas);
          marker.bindPopup(
            `<b>${zona.barrio}, ${zona.ciudad}</b><br>${zona.total_adopciones} adopciones`
          );
        }

        // Añadir fila a la tabla
        const fila = `
          <tr>
            <td>${index + 1}</td>
            <td>${zona.barrio || "No especificado"}</td>
            <td>${zona.ciudad || "No especificada"}</td>
            <td><span class="badge bg-warning text-dark">${zona.total_adopciones}</span></td>
          </tr>`;
        tablaBody.innerHTML += fila;
      });
    }

    adopcionesPorZonaContainer.classList.remove("d-none");

    // Forzar al mapa a recalcular su tamaño después de ser visible.
    // Se usa un setTimeout para asegurar que el DOM se haya actualizado.
    setTimeout(() => {
      mapaZonas.invalidateSize();
    }, 10);
  };

  /**
   * Renderiza la lista de mascotas con más tiempo en espera.
   * @param {Array} data - Array de objetos de mascotas.
   */
  const renderizarMascotasEnEspera = (data) => {
    const listaContainer = document.getElementById("lista-mascotas-espera");
    if (!listaContainer) return;

    listaContainer.innerHTML = ""; // Limpiar contenido

    if (data.length === 0) {
      listaContainer.innerHTML = `<p class="text-center text-muted">¡Felicidades! No hay mascotas con largos tiempos de espera.</p>`;
    } else {
      data.forEach((mascota) => {
        const item = document.createElement("a");
        item.href = `ver-mascota.html?id=${mascota.id}`; // Enlace al perfil de la mascota
        item.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center";

        const imagenSrc = mascota.imagen ? `../img/mascotas/${mascota.imagen}` : '../img/default-image.webp';

        item.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${imagenSrc}" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;" alt="${mascota.nombre}">
            <div>
              <h5 class="mb-1">${mascota.nombre}</h5>
              <small class="text-muted">${mascota.tipo.charAt(0).toUpperCase() + mascota.tipo.slice(1)} - Publicado: ${new Date(mascota.date_publicacion).toLocaleDateString()}</small>
            </div>
          </div>
          <span class="badge bg-danger rounded-pill fs-6">${mascota.dias_en_espera} días esperando</span>
        `;
        listaContainer.appendChild(item);
      });
    }

    mascotasEnEsperaContainer.classList.remove("d-none");
  };

  // --- Event Listeners ---

  btnSemana.addEventListener("click", () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 6);
    fetchReportePersonalizado(
      inicio.toISOString().split("T")[0],
      fin.toISOString().split("T")[0]
    );
  });

  btnMes.addEventListener("click", () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setMonth(fin.getMonth() - 1);
    fetchReportePersonalizado(
      inicio.toISOString().split("T")[0],
      fin.toISOString().split("T")[0]
    );
  });

  formPeriodoPersonalizado.addEventListener("submit", (e) => {
    e.preventDefault();
    const inicio = fechaInicioInput.value;
    const fin = fechaFinInput.value;
    if (inicio && fin) {
      fetchReportePersonalizado(inicio, fin);
    }
  });

  // --- Carga Inicial Automática ---
  fetchDatosIniciales(); // Carga los indicadores clave y las stats por edad
});
