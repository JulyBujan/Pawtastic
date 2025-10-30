document.addEventListener("DOMContentLoaded", () => {
  const btnSemana = document.getElementById("btn-semana");
  const btnMes = document.getElementById("btn-mes");
  const formPeriodoPersonalizado = document.getElementById(
    "form-periodo-personalizado"
  );
  const reporteContainer = document.getElementById("reporte-container");
  const loadingSpinner = document.getElementById("loading-spinner");
  const adopcionesStatsContainer = document.getElementById("adopciones-stats");
  const publicacionesConAdopcionEl = document.getElementById(
    "publicaciones-con-adopcion"
  );

  const fechaFinInput = document.getElementById("fecha_fin");
  const fechaInicioInput = document.getElementById("fecha_inicio");

  let publicacionesChart = null;

  /**
   * Muestra u oculta el spinner de carga.
   * @param {boolean} show - True para mostrar, false para ocultar.
   */
  const toggleLoading = (show) => {
    loadingSpinner.classList.toggle("d-none", !show);
    reporteContainer.classList.toggle("d-none", show);
  };

  /**
   * Obtiene los datos del reporte desde la API.
   * @param {string} inicio - Fecha de inicio (YYYY-MM-DD).
   * @param {string} fin - Fecha de fin (YYYY-MM-DD).
   */
  const fetchReporte = async (inicio, fin) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para ver los reportes.");
      window.location.href = "login.html";
      return;
    }

    toggleLoading(true);

    try {
      const response = await fetch(
        `/api/reportes.php?fecha_inicio=${inicio}&fecha_fin=${fin}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      // Si la respuesta no es OK (ej. 401, 403, 500)
      if (!response.ok) {
        // Si el token expiró, redirigir al login
        if (response.status === 401) {
          alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          window.location.href = "login.html";
          return; // Detener la ejecución
        }
        throw new Error(data.message || "Error al generar el reporte.");
      }

      renderizarReporte(data);
    } catch (error) {
      console.error("Error al obtener el reporte:", error);
      alert(error.message);
    } finally {
      toggleLoading(false);
    }
  };

  /**
   * Renderiza los datos del reporte en la página.
   * @param {object} data - Los datos del reporte desde la API.
   */
  const renderizarReporte = (data) => {
    // 1. Renderizar estadísticas de adopciones
    const stats = data.adopciones;
    adopcionesStatsContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-primary text-white h-100">
                    <div class="card-body">
                        <h5 class="card-title">Iniciadas</h5>
                        <p class="card-text fs-2 fw-bold">${stats.iniciadas}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white h-100">
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
    publicacionesConAdopcionEl.textContent =
      data.publicaciones.con_adopcion_aprobada;

    // 3. Renderizar gráfico de publicaciones
    const chartData = data.publicaciones.por_dia;
    const ctx = document.getElementById("publicacionesChart").getContext("2d");

    if (publicacionesChart) {
      publicacionesChart.destroy();
    }

    publicacionesChart = new Chart(ctx, {
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

    reporteContainer.classList.remove("d-none");
  };

  // --- Event Listeners ---

  btnSemana.addEventListener("click", () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - 6); // Últimos 7 días incluyendo hoy
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
});
