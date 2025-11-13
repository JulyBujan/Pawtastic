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
  const loadingSpinner = document.getElementById("loading-spinner");

  const fechaFinInput = document.getElementById("fecha_fin_manual");
  const fechaInicioInput = document.getElementById("fecha_inicio_manual");

  let publicacionesChartManual = null;

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
    }
  };

  /**
   * Obtiene los datos del reporte desde la API.
   * @param {string} inicio - Fecha de inicio (YYYY-MM-DD).
   * @param {string} fin - Fecha de fin (YYYY-MM-DD).
   */
  const fetchReporte = async (inicio = null, fin = null) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Debes iniciar sesión para ver los reportes.", "danger");
      window.location.href = "login.html";
      return;
    }

    toggleLoading(true);

    try {
      const url =
        inicio && fin
          ? `/api/reportes.php?fecha_inicio=${inicio}&fecha_fin=${fin}`
          : `/api/reportes.php`;

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

      // Decide qué renderizar basado en la respuesta
      if (data.ultimos_30_dias) {
        renderizarIndicadoresClave(data);
      } else {
        renderizarReportePersonalizado(data, inicio, fin);
      }
    } catch (error) {
      console.error("Error al obtener el reporte:", error);
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

  // --- Event Listeners ---

  btnSemana.addEventListener("click", () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 6);
    fetchReporte(
      inicio.toISOString().split("T")[0],
      fin.toISOString().split("T")[0]
    );
  });

  btnMes.addEventListener("click", () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setMonth(fin.getMonth() - 1);
    fetchReporte(
      inicio.toISOString().split("T")[0],
      fin.toISOString().split("T")[0]
    );
  });

  formPeriodoPersonalizado.addEventListener("submit", (e) => {
    e.preventDefault();
    const inicio = fechaInicioInput.value;
    const fin = fechaFinInput.value;
    if (inicio && fin) {
      fetchReporte(inicio, fin);
    }
  });

  // --- Carga Inicial Automática ---
  fetchReporte(); // Llama sin argumentos para obtener los indicadores clave
});
