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
  const btnLimpiarReporte = document.getElementById("btn-limpiar-reporte");

  let viviendaChartManual = null;
  let tipoMascotaChartManual = null;
  let mapaZonas = null;
  let reportLineChart = null;
  let reportStatusChart = null;
  let reportTypeChart = null;
  let reportHousingChart = null;

  const formatShortDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  const sumCantidad = (items) =>
    (items || []).reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);

  const updateKpis = (data30 = {}, data90 = {}) => {
    const kpiPostulaciones = document.getElementById("kpiPostulaciones");
    const kpiPostulacionesMeta = document.getElementById("kpiPostulacionesMeta");
    const kpiTiempoPromedio = document.getElementById("kpiTiempoPromedio");
    const kpiTiempoMeta = document.getElementById("kpiTiempoMeta");
    const kpiTasaAprobacion = document.getElementById("kpiTasaAprobacion");
    const kpiTasaMeta = document.getElementById("kpiTasaMeta");
    const kpiPublicaciones = document.getElementById("kpiPublicaciones");
    const kpiPublicacionesMeta = document.getElementById("kpiPublicacionesMeta");

    const adopciones30 = data30.adopciones || {};
    const publicaciones30 = data30.publicaciones || {};
    const metricas30 = data30.metricas_clave || {};
    const tiempos = metricas30.tiempo_promedio_adopcion || {};

    if (kpiPostulaciones) {
      kpiPostulaciones.textContent = adopciones30.iniciadas ?? "--";
    }
    if (kpiPostulacionesMeta) {
      kpiPostulacionesMeta.textContent = `Actualizadas: ${adopciones30.actualizadas ?? 0}`;
    }

    const perro = tiempos.perro;
    const gato = tiempos.gato;
    const tiempoValues = [perro, gato].filter((value) => typeof value === "number");
    if (kpiTiempoPromedio) {
      if (tiempoValues.length) {
        const promedio = tiempoValues.reduce((a, b) => a + b, 0) / tiempoValues.length;
        kpiTiempoPromedio.textContent = `${promedio.toFixed(1)} días`;
      } else {
        kpiTiempoPromedio.textContent = "--";
      }
    }
    if (kpiTiempoMeta) {
      kpiTiempoMeta.textContent = `Perros ${perro ?? "--"} · Gatos ${gato ?? "--"}`;
    }

    const tasa = data90.tasa_exito || {};
    const totalTasa = (tasa.aprobadas || 0) + (tasa.rechazadas || 0);
    if (kpiTasaAprobacion) {
      if (totalTasa > 0) {
        const porcentaje = Math.round((tasa.aprobadas / totalTasa) * 100);
        kpiTasaAprobacion.textContent = `${porcentaje}%`;
      } else {
        kpiTasaAprobacion.textContent = "--";
      }
    }
    if (kpiTasaMeta) {
      kpiTasaMeta.textContent = `Aprobadas ${tasa.aprobadas ?? 0} · Rechazadas ${tasa.rechazadas ?? 0}`;
    }

    if (kpiPublicaciones) {
      kpiPublicaciones.textContent = publicaciones30.con_adopcion_aprobada ?? "--";
    }
    if (kpiPublicacionesMeta) {
      const totalPublicadas = sumCantidad(publicaciones30.por_dia);
      kpiPublicacionesMeta.textContent = `Publicadas: ${totalPublicadas}`;
    }
  };

  const renderDashboardCharts = (data30 = {}, data90 = {}) => {
    if (typeof Chart === "undefined") {
      return;
    }

    const publicaciones = data30.publicaciones?.por_dia || [];
    const lineCanvas = document.getElementById("reportLineChart");
    if (lineCanvas) {
      if (reportLineChart) {
        reportLineChart.destroy();
      }
      reportLineChart = new Chart(lineCanvas, {
        type: "line",
        data: {
          labels: publicaciones.map((item) => formatShortDate(item.fecha)),
          datasets: [
            {
              label: "Publicaciones",
              data: publicaciones.map((item) => Number(item.cantidad) || 0),
              borderColor: "#1a94c4",
              backgroundColor: "rgba(26, 148, 196, 0.2)",
              tension: 0.35,
              fill: true,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { grid: { color: "rgba(27, 36, 54, 0.08)" } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    const adopciones30 = data30.adopciones || {};
    const adopciones90 = data90.adopciones || {};
    const statusCanvas = document.getElementById("reportStatusChart");
    if (statusCanvas) {
      if (reportStatusChart) {
        reportStatusChart.destroy();
      }
      reportStatusChart = new Chart(statusCanvas, {
        type: "bar",
        data: {
          labels: ["Iniciadas", "Actualizadas", "Aprobadas", "Canceladas"],
          datasets: [
            {
              label: "Últimos 30 días",
              data: [
                adopciones30.iniciadas || 0,
                adopciones30.actualizadas || 0,
                adopciones30.aprobadas || 0,
                adopciones30.canceladas || 0,
              ],
              backgroundColor: "rgba(26, 148, 196, 0.75)",
            },
            {
              label: "Últimos 90 días",
              data: [
                adopciones90.iniciadas || 0,
                adopciones90.actualizadas || 0,
                adopciones90.aprobadas || 0,
                adopciones90.canceladas || 0,
              ],
              backgroundColor: "rgba(148, 163, 184, 0.55)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: "rgba(27, 36, 54, 0.08)" } },
          },
        },
      });
    }

    const typeCanvas = document.getElementById("reportTypeChart");
    if (typeCanvas) {
      const items = data30.perfil_adopcion?.por_tipo_mascota || [];
      const labels = items.length
        ? items.map((item) => item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1))
        : ["Perros", "Gatos"];
      const values = items.length
        ? items.map((item) => Number(item.cantidad) || 0)
        : [0, 0];

      if (reportTypeChart) {
        reportTypeChart.destroy();
      }
      reportTypeChart = new Chart(typeCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: ["#f7b84b", "#1a94c4"],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
          },
          cutout: "62%",
        },
      });
    }

    const housingCanvas = document.getElementById("reportHousingChart");
    if (housingCanvas) {
      const items = data30.perfil_adopcion?.por_vivienda || [];
      const topItems = items.slice(0, 6);
      const labels = topItems.length
        ? topItems.map((item) => item.tipo_vivienda || "Sin dato")
        : ["Sin datos"];
      const values = topItems.length
        ? topItems.map((item) => Number(item.cantidad) || 0)
        : [0];

      if (reportHousingChart) {
        reportHousingChart.destroy();
      }
      reportHousingChart = new Chart(housingCanvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Adopciones",
              data: values,
              backgroundColor: "rgba(99, 102, 241, 0.75)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { color: "rgba(27, 36, 54, 0.08)" } },
            y: { grid: { display: false } },
          },
        },
      });
    }
  };

  /**
   * Muestra u oculta el spinner de carga.
   * @param {boolean} show - True para mostrar, false para ocultar.
   */
  const toggleLoading = (show) => {
    loadingSpinner.classList.toggle("d-none", !show);
    if (show) {
      reportePersonalizadoContainer.classList.add("d-none");
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

    // Al generar un reporte personalizado, solo mostramos el spinner
    // y ocultamos el contenedor de ese reporte específico. Los demás quedan visibles.
    const spinner = document.getElementById("loading-spinner");
    const container = document.getElementById("reporte-personalizado-container");

    spinner.classList.remove("d-none");
    container.classList.add("d-none");

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
      // Ocultamos el spinner al finalizar
      spinner.classList.add("d-none");
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
      const data30 = dataIndicadores.ultimos_30_dias || {};
      const data90 = dataIndicadores.ultimos_90_dias || {};
      updateKpis(data30, data90);
      renderDashboardCharts(data30, data90);
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

    // 2. Renderizar gráficos de perfil de adopción
    const { por_vivienda, por_tipo_mascota } = data.perfil_adopcion;

    // Gráfico de Tipo de Vivienda
    const ctxVivienda = document
      .getElementById("viviendaChart-manual")
      .getContext("2d");
    if (viviendaChartManual) {
      viviendaChartManual.destroy();
    }
    viviendaChartManual = new Chart(ctxVivienda, {
      type: "doughnut",
      data: {
        labels: por_vivienda.map((item) => item.tipo_vivienda),
        datasets: [
          {
            label: "Adopciones",
            data: por_vivienda.map((item) => item.cantidad),
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
            ],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
      },
    });

    // Gráfico de Tipo de Mascota
    const ctxTipoMascota = document
      .getElementById("tipoMascotaChart-manual")
      .getContext("2d");
    if (tipoMascotaChartManual) {
      tipoMascotaChartManual.destroy();
    }
    tipoMascotaChartManual = new Chart(ctxTipoMascota, {
      type: "pie",
      data: {
        labels: por_tipo_mascota.map(
          (item) => item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)
        ),
        datasets: [
          {
            label: "Adopciones",
            data: por_tipo_mascota.map((item) => item.cantidad),
            backgroundColor: [
              "rgba(247, 147, 30, 0.8)", // Naranja Pawtastic
              "rgba(26, 148, 196, 0.8)", // Azul Pawtastic
            ],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
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
    // PRUEBA DE DEPURACIÓN: Mostramos en la consola los datos que llegan.
    console.log("Datos recibidos para indicadores clave:", data);

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

    // --- Calcular y mostrar Tasa de Éxito para 30 días ---
    const tasaExito30 = data.ultimos_30_dias.tasa_exito || {};
    const aprobadas30 = tasaExito30.aprobadas ?? 0;
    const rechazadas30 = tasaExito30.rechazadas ?? 0;
    const total30 = aprobadas30 + rechazadas30;
    const porcientoAprobadas30 =
      total30 > 0 ? Math.round((aprobadas30 / total30) * 100) : 0;
    const porcientoRechazadas30 =
      total30 > 0 ? Math.round((rechazadas30 / total30) * 100) : 0;
    document.getElementById("tasa-aprobadas-30").textContent = `${porcientoAprobadas30}%`;
    document.getElementById("tasa-rechazadas-30").textContent = `${porcientoRechazadas30}%`;

    // --- Calcular y mostrar Tasa de Éxito para 90 días ---
    const tasaExito90 = data.ultimos_90_dias.tasa_exito || {};
    const aprobadas90 = tasaExito90.aprobadas ?? 0;
    const rechazadas90 = tasaExito90.rechazadas ?? 0;
    const total90 = aprobadas90 + rechazadas90;
    const porcientoAprobadas90 =
      total90 > 0 ? Math.round((aprobadas90 / total90) * 100) : 0;
    const porcientoRechazadas90 =
      total90 > 0 ? Math.round((rechazadas90 / total90) * 100) : 0;
    document.getElementById("tasa-aprobadas-90").textContent = `${porcientoAprobadas90}%`;
    document.getElementById("tasa-rechazadas-90").textContent = `${porcientoRechazadas90}%`;

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

  btnLimpiarReporte.addEventListener("click", () => {
    // Limpia las fechas
    fechaInicioInput.value = "";
    fechaFinInput.value = "";

    // Oculta el contenedor del reporte personalizado
    reportePersonalizadoContainer.classList.add("d-none");

    // Asegura que los reportes generales estén visibles
    indicadoresClaveContainer.classList.remove("d-none");
    // (Los otros ya deberían estar visibles, pero esto lo asegura)
  });

  // --- Carga Inicial Automática ---
  fetchDatosIniciales(); // Carga los indicadores clave y las stats por edad
});
