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
  const reportePersonalizadoLoading = document.getElementById(
    "reporte-personalizado-loading"
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
  const reportMenu = document.getElementById("reportesMenu");
  const reportSections = document.querySelectorAll(".report-section");
  const reportMenuItems = document.querySelectorAll(".report-menu-item");
  const btnGenerarReporte =
    formPeriodoPersonalizado?.querySelector("button[type=\"submit\"]") || null;
  const exportButtons = document.querySelectorAll(".btn-export-pdf");

  let viviendaChartManual = null;
  let tipoMascotaChartManual = null;
  let mapaZonas = null;
  let reportLineChart = null;
  let reportStatusChart = null;
  let reportTypeChart = null;
  let reportHousingChart = null;
  const reportSnapshot = {
    indicadores: null,
    adopcionEdad: null,
    adopcionZona: null,
    mascotasEspera: null,
    personalizado: null,
    personalizadoRango: null,
  };

  const animateIndicatorBar = (bar, percent) => {
    if (!bar) return;
    const safeValue = Number.isFinite(percent)
      ? Math.max(0, Math.min(100, Number(percent)))
      : null;
    bar.style.width = "0%";
    if (safeValue === null) return;
    bar.getAnimations().forEach((animation) => animation.cancel());
    requestAnimationFrame(() => {
      const animation = bar.animate(
        [{ width: "0%" }, { width: `${safeValue}%` }],
        { duration: 3200, easing: "ease-out", fill: "forwards" }
      );
      animation.onfinish = () => {
        bar.style.width = `${safeValue}%`;
      };
    });
  };

  const rerunIndicatorBars = () => {
    document.querySelectorAll(".metric-bar-fill").forEach((bar) => {
      const value = Number(bar.dataset.progress);
      if (Number.isFinite(value)) {
        animateIndicatorBar(bar, value);
      }
    });
  };

  const showReportSection = (target) => {
    reportSections.forEach((section) => {
      const isTarget = section.dataset.reportSection === target;
      section.classList.toggle("d-none", !isTarget);
      if (isTarget) {
        section.classList.remove("report-animate");
        void section.offsetWidth;
        section.classList.add("report-animate");
      }
    });
    reportMenuItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.reportTarget === target);
    });
    if (target === "zonas" && mapaZonas) {
      setTimeout(() => {
        mapaZonas.invalidateSize();
      }, 120);
    }
    if (target === "indicadores" && reportSnapshot.indicadores) {
      setTimeout(() => rerunIndicatorBars(), 180);
    }
  };

  const exportActiveReportToPdf = () => {
    if (!window.jspdf?.jsPDF) {
      if (typeof showToast === "function") {
        showToast("No se pudo cargar el exportador PDF.", "danger");
      }
      return;
    }

    if (!reportSnapshot.indicadores) {
      if (typeof showToast === "function") {
        showToast("Primero cargá los datos del reporte.", "warning");
      }
      return;
    }

    const activeButton = document.activeElement;
    const exportButton = activeButton?.closest(".btn-export-pdf");
    if (exportButton) {
      exportButton.classList.add("is-loading");
      exportButton.disabled = true;
    }

    if (typeof showToast === "function") {
      showToast("Generando PDF... ⏳", "info");
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 16;

    const addLine = (text, size = 11, gap = 6, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(String(text), pageWidth - margin * 2);
      lines.forEach((line) => {
        if (cursorY > 285) {
          pdf.addPage();
          cursorY = 16;
        }
        pdf.text(line, margin, cursorY);
        cursorY += gap;
      });
    };

    const addSection = (title) => {
      cursorY += 2;
      addLine(title, 12, 7, true);
      cursorY += 1;
    };

    const formatValue = (value, suffix = "") =>
      value === null || value === undefined || value === "" ? "--" : `${value}${suffix}`;
    const getActiveReportKey = () => {
      const activeSection = Array.from(reportSections).find(
        (section) => !section.classList.contains("d-none")
      );
      return activeSection?.dataset.reportSection || "dashboard";
    };
    const addChartImage = (chart, title) => {
      if (!chart || !chart.canvas) return false;
      const dataUrl =
        typeof chart.toBase64Image === "function"
          ? chart.toBase64Image()
          : chart.canvas.toDataURL("image/png", 1.0);
      if (!dataUrl || !dataUrl.startsWith("data:image")) {
        return false;
      }
      const canvas = chart.canvas;
      const maxWidth = pageWidth - margin * 2;
      const aspect = canvas.width ? canvas.height / canvas.width : 0.6;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth * aspect;
      const maxHeight = 90;
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = aspect ? imgHeight / aspect : maxWidth;
      }
      if (cursorY + imgHeight + 12 > 285) {
        pdf.addPage();
        cursorY = 16;
      }
      addLine(title, 11, 6, true);
      pdf.addImage(dataUrl, "PNG", margin, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 8;
      return true;
    };

    const dataIndicadores = reportSnapshot.indicadores || {};
    const data30 = dataIndicadores.ultimos_30_dias || {};
    const data90 = dataIndicadores.ultimos_90_dias || {};
    const adopciones30 = data30.adopciones || {};
    const publicaciones30 = data30.publicaciones || {};
    const metricas30 = data30.metricas_clave || {};
    const tiempos = metricas30.tiempo_promedio_adopcion || {};

    const perro = tiempos.perro;
    const gato = tiempos.gato;
    const tiempoValues = [perro, gato].filter((value) => typeof value === "number");
    const promedioTiempo =
      tiempoValues.length > 0
        ? (tiempoValues.reduce((a, b) => a + b, 0) / tiempoValues.length).toFixed(1)
        : "--";

    const tasa = data90.tasa_exito || {};
    const totalTasa = (tasa.aprobadas || 0) + (tasa.rechazadas || 0);
    const porcentajeAprobadas =
      totalTasa > 0 ? Math.round((tasa.aprobadas / totalTasa) * 100) : "--";

    const date = new Date();
    addLine("Reporte ONG · Pawtastic", 14, 8, true);
    addLine(`Fecha: ${date.toLocaleDateString("es-AR")}`, 10, 6);

    if (reportSnapshot.personalizado && reportSnapshot.personalizadoRango) {
      const inicio = reportSnapshot.personalizadoRango.inicio;
      const fin = reportSnapshot.personalizadoRango.fin;
      const inicioLabel = new Date(`${inicio}T00:00:00`).toLocaleDateString("es-AR");
      const finLabel = new Date(`${fin}T00:00:00`).toLocaleDateString("es-AR");
      addLine(`Reporte personalizado: ${inicioLabel} → ${finLabel}`, 10, 6, true);
    } else {
    addLine("Reporte general: últimos 30 y 60 días", 10, 6, true);
    }

    addSection("KPIs (últimos 30 días)");
    addLine(`Postulaciones iniciadas: ${formatValue(adopciones30.iniciadas)}`);
    addLine(`Postulaciones actualizadas: ${formatValue(adopciones30.actualizadas)}`);
    addLine(`Tiempo promedio de adopción: ${formatValue(promedioTiempo, " días")}`);
    addLine(`Detalle: Perros ${formatValue(perro, " días")} · Gatos ${formatValue(gato, " días")}`);
    addLine(`Publicaciones con adopción: ${formatValue(publicaciones30.con_adopcion_aprobada)}`);

    addSection("Tasa de éxito (últimos 60 días)");
    addLine(`Aprobadas: ${formatValue(tasa.aprobadas)}`);
    addLine(`Rechazadas: ${formatValue(tasa.rechazadas)}`);
    addLine(`Porcentaje aprobación: ${formatValue(porcentajeAprobadas, "%")}`);

    if (reportSnapshot.adopcionEdad) {
      addSection("Adopción por edad (últimos 60 días)");
      const { perros, gatos } = reportSnapshot.adopcionEdad;
      const formatEdad = (label, value) =>
        `${label}: ${value !== null && value !== undefined ? `${value} días` : "N/A"}`;
      if (perros) {
        addLine("Perros");
        addLine(formatEdad("Cachorros", perros.cachorros), 10, 5);
        addLine(formatEdad("Jóvenes", perros.jovenes), 10, 5);
        addLine(formatEdad("Adultos", perros.adultos), 10, 5);
        addLine(formatEdad("Seniors", perros.seniors), 10, 5);
      }
      if (gatos) {
        cursorY += 2;
        addLine("Gatos");
        addLine(formatEdad("Cachorros", gatos.cachorros), 10, 5);
        addLine(formatEdad("Jóvenes", gatos.jovenes), 10, 5);
        addLine(formatEdad("Adultos", gatos.adultos), 10, 5);
        addLine(formatEdad("Seniors", gatos.seniors), 10, 5);
      }
    }

    if (Array.isArray(reportSnapshot.adopcionZona) && reportSnapshot.adopcionZona.length) {
      addSection("Top zonas de adopción");
      reportSnapshot.adopcionZona.slice(0, 5).forEach((zona, index) => {
        addLine(
          `${index + 1}. ${zona.barrio || "Sin barrio"}, ${zona.ciudad || "Sin ciudad"} · ${formatValue(
            zona.total_adopciones
          )} adopciones`,
          10,
          5
        );
      });
    }

    if (Array.isArray(reportSnapshot.mascotasEspera) && reportSnapshot.mascotasEspera.length) {
      addSection("Mascotas con más tiempo en espera");
      reportSnapshot.mascotasEspera.slice(0, 5).forEach((mascota, index) => {
        addLine(
          `${index + 1}. ${mascota.nombre || "Mascota"} · ${formatValue(mascota.dias_en_espera, " días")}`,
          10,
          5
        );
      });
    }

    if (reportSnapshot.personalizado && reportSnapshot.personalizadoRango) {
      const { inicio, fin } = reportSnapshot.personalizadoRango;
      const customData = reportSnapshot.personalizado;
      const stats = customData.adopciones || {};
      const perfil = customData.perfil_adopcion || {};
      addSection("Reporte personalizado");
      addLine(`Iniciadas: ${formatValue(stats.iniciadas)}`);
      addLine(`Aprobadas: ${formatValue(stats.aprobadas)}`);
      addLine(`Canceladas: ${formatValue(stats.canceladas)}`);
      if (Array.isArray(perfil.por_tipo_mascota)) {
        addLine("Perfil de adopción · Tipo de mascota");
        perfil.por_tipo_mascota.forEach((item) => {
          addLine(`- ${item.tipo_mascota}: ${formatValue(item.cantidad)}`, 10, 5);
        });
      }
      if (Array.isArray(perfil.por_vivienda)) {
        addLine("Perfil de adopción · Tipo de vivienda");
        perfil.por_vivienda.forEach((item) => {
          addLine(`- ${item.tipo_vivienda}: ${formatValue(item.cantidad)}`, 10, 5);
        });
      }
    }

    const activeSectionKey = getActiveReportKey();
    const chartsToInclude = [];
    if (activeSectionKey === "dashboard") {
      chartsToInclude.push(
        { chart: reportLineChart, title: "Publicaciones por día" },
        { chart: reportStatusChart, title: "Estados de adopción (30 vs 60 días)" },
        { chart: reportTypeChart, title: "Tipo de mascota adoptada" },
        { chart: reportHousingChart, title: "Tipo de vivienda de adoptantes" }
      );
    }
    if (activeSectionKey === "personalizado") {
      chartsToInclude.push(
        { chart: viviendaChartManual, title: "Adopciones por Tipo de Vivienda" },
        { chart: tipoMascotaChartManual, title: "Adopciones por Tipo de Mascota" }
      );
    }

    if (chartsToInclude.some((item) => item.chart)) {
      addSection("Gráficos");
      chartsToInclude.forEach(({ chart, title }) => addChartImage(chart, title));
    }

    const fileStamp = date.toISOString().slice(0, 10);
    pdf.save(`reporte-${reportSnapshot.personalizado ? "personalizado" : "dashboard"}-${fileStamp}.pdf`);

    if (exportButton) {
      exportButton.classList.remove("is-loading");
      exportButton.disabled = false;
    }
  };

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

  const animateCustomReportStats = (container) => {
    if (!container) return;

    const counters = container.querySelectorAll("[data-count]");
    counters.forEach((counter) => {
      const target = Number(counter.dataset.count) || 0;
      const decimals = Number(counter.dataset.decimals) || 0;
      const suffix = counter.dataset.suffix || "";
      const duration = 900;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = target * eased;
        const value =
          decimals > 0
            ? currentValue.toFixed(decimals)
            : Math.round(currentValue);
        counter.textContent = `${value}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    });

    const bars = container.querySelectorAll(".result-progress-bar");
    bars.forEach((bar) => {
      const percent = Number(bar.dataset.progress) || 0;
      requestAnimationFrame(() => {
        bar.style.width = `${percent}%`;
      });
    });
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
              label: "Últimos 60 días",
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

  const setCustomReportLoading = (isLoading) => {
    if (reportePersonalizadoLoading) {
      reportePersonalizadoLoading.classList.toggle("d-none", !isLoading);
    }

    if (isLoading) {
      reportePersonalizadoContainer.classList.add("d-none");
    }

    const controls = [
      btnSemana,
      btnMes,
      fechaInicioInput,
      fechaFinInput,
      btnLimpiarReporte,
      btnGenerarReporte,
    ];

    controls.forEach((control) => {
      if (control) {
        control.disabled = isLoading;
      }
    });

    if (btnGenerarReporte) {
      btnGenerarReporte.classList.toggle("is-loading", isLoading);
      const label = btnGenerarReporte.querySelector(".btn-label");
      if (label) {
        label.textContent = isLoading ? "Generando..." : "Generar";
      }
    }

    if (formPeriodoPersonalizado) {
      formPeriodoPersonalizado.setAttribute(
        "aria-busy",
        isLoading ? "true" : "false"
      );
    }
  };

  /**
   * Obtiene los datos del reporte desde la API.
   * @param {string} inicio - Fecha de inicio (YYYY-MM-DD).
   * @param {string} fin - Fecha de fin (YYYY-MM-DD).
   */
  let customReportInFlight = 0;

  const fetchReportePersonalizado = async (inicio, fin) => {
    customReportInFlight += 1;
    const requestId = customReportInFlight;
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Debes iniciar sesión para ver los reportes.", "danger");
      window.location.href = "login.html";
      return;
    }

    if (loadingSpinner) {
      loadingSpinner.classList.add("d-none");
    }
    setCustomReportLoading(true);
    const loadingStartedAt = Date.now();

    try {
      const url = `/api/reportes.php?fecha_inicio=${inicio}&fecha_fin=${fin}`;

      // La petición para el reporte personalizado no necesita 'accion'
      const fetchPromise = fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));
      const response = await fetchPromise;

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

      reportSnapshot.personalizado = data;
      reportSnapshot.personalizadoRango = { inicio, fin };
      renderizarReportePersonalizado(data, inicio, fin);
    } catch (error) {
      console.error("Error al obtener el reporte:", error);
      showToast(error.message, "danger");
    } finally {
      const elapsed = Date.now() - loadingStartedAt;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        if (requestId === customReportInFlight) {
          setCustomReportLoading(false);
          if (reportePersonalizadoContainer) {
            reportePersonalizadoContainer.classList.remove("d-none");
            reportePersonalizadoContainer.classList.remove("report-animate");
            void reportePersonalizadoContainer.offsetWidth;
            reportePersonalizadoContainer.classList.add("report-animate");
          }
        }
      }, remaining);
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
      reportSnapshot.indicadores = dataIndicadores;

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
        reportSnapshot.adopcionEdad = dataAdopcionEdad.data;
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
        reportSnapshot.adopcionZona = dataAdopcionZona.data;
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
        reportSnapshot.mascotasEspera = dataMascotasEspera.data;
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
    const iniciadas = Number(stats.iniciadas) || 0;
    const aprobadas = Number(stats.aprobadas) || 0;
    const canceladas = Number(stats.canceladas) || 0;
    const percentOfIniciadas = (value) =>
      iniciadas > 0 ? Math.round((value / iniciadas) * 100) : 0;

    const inicioDate = new Date(`${inicio}T00:00:00`);
    const finDate = new Date(`${fin}T00:00:00`);
    const diffDays = Math.round((finDate - inicioDate) / 86400000) + 1;
    const diasPeriodo = diffDays > 0 ? diffDays : 1;
    const promedioDiario = iniciadas / diasPeriodo;

    adopcionesStatsContainerManual.innerHTML = `
            <div class="col-md-3 animate-item">
                <div class="result-card result-card-primary">
                    <span class="result-icon"><i class="bi bi-play-circle"></i></span>
                    <span class="result-label">Iniciadas</span>
                    <span class="result-value" data-count="${iniciadas}">0</span>
                    <div class="result-progress"><span class="result-progress-bar" data-progress="${iniciadas > 0 ? 100 : 0}"></span></div>
                    <span class="result-meta">Total del período</span>
                </div>
            </div>
            <div class="col-md-3 animate-item">
                <div class="result-card result-card-info no-progress">
                    <span class="result-icon"><i class="bi bi-graph-up-arrow"></i></span>
                    <span class="result-label">Promedio diario</span>
                    <span class="result-value" data-count="${promedioDiario.toFixed(2)}" data-decimals="2">0</span>
                    <div class="result-progress"><span class="result-progress-bar" data-progress="0"></span></div>
                    <span class="result-meta">Postulaciones por día</span>
                </div>
            </div>
            <div class="col-md-3 animate-item">
                <div class="result-card result-card-success">
                    <span class="result-icon"><i class="bi bi-check-circle"></i></span>
                    <span class="result-label">Aprobadas</span>
                    <span class="result-value" data-count="${aprobadas}">0</span>
                    <div class="result-progress"><span class="result-progress-bar" data-progress="${percentOfIniciadas(
                      aprobadas
                    )}"></span></div>
                    <span class="result-meta">${percentOfIniciadas(aprobadas)}% de iniciadas</span>
                </div>
            </div>
            <div class="col-md-3 animate-item">
                <div class="result-card result-card-danger">
                    <span class="result-icon"><i class="bi bi-x-circle"></i></span>
                    <span class="result-label">Canceladas</span>
                    <span class="result-value" data-count="${canceladas}">0</span>
                    <div class="result-progress"><span class="result-progress-bar" data-progress="${percentOfIniciadas(
                      canceladas
                    )}"></span></div>
                    <span class="result-meta">${percentOfIniciadas(canceladas)}% de iniciadas</span>
                </div>
            </div>
        `;

    animateCustomReportStats(adopcionesStatsContainerManual);

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

    // La visibilidad del contenedor se controla después del tiempo mínimo de loading.
  };

  /**
   * Renderiza los indicadores clave de 30 y 60 días.
   * @param {object} data - La respuesta de la API con los bloques de 30 y 60 días.
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
    const barAprobadas30 = document.getElementById("tasa-aprobadas-30-bar");
    const barRechazadas30 = document.getElementById("tasa-rechazadas-30-bar");
    if (barAprobadas30) {
      barAprobadas30.dataset.progress = porcientoAprobadas30;
      animateIndicatorBar(barAprobadas30, porcientoAprobadas30);
    }
    if (barRechazadas30) {
      barRechazadas30.dataset.progress = porcientoRechazadas30;
      animateIndicatorBar(barRechazadas30, porcientoRechazadas30);
    }

    // --- Calcular y mostrar Tasa de Éxito para 60 días ---
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
    const barAprobadas90 = document.getElementById("tasa-aprobadas-90-bar");
    const barRechazadas90 = document.getElementById("tasa-rechazadas-90-bar");
    if (barAprobadas90) {
      barAprobadas90.dataset.progress = porcientoAprobadas90;
      animateIndicatorBar(barAprobadas90, porcientoAprobadas90);
    }
    if (barRechazadas90) {
      barRechazadas90.dataset.progress = porcientoRechazadas90;
      animateIndicatorBar(barRechazadas90, porcientoRechazadas90);
    }

    indicadoresClaveContainer.classList.remove("d-none");
    rerunIndicatorBars();
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
          "list-group-item age-item animate-item d-flex justify-content-between align-items-center";
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

    // Renderizar el ranking
    const tablaBody = document.getElementById("tabla-zonas-body");
    if (!tablaBody) return;

    tablaBody.innerHTML = ""; // Limpiar contenido

    if (data.length === 0) {
      tablaBody.innerHTML =
        `<div class="text-center text-muted">No hay datos de adopciones por zona para mostrar.</div>`;
    } else {
      data.forEach((zona, index) => {
        // Añadir marcador al mapa
        if (zona.lat && zona.lon) {
          const marker = L.marker([zona.lat, zona.lon]).addTo(mapaZonas);
          marker.bindPopup(
            `<b>${zona.barrio}, ${zona.ciudad}</b><br>${zona.total_adopciones} adopciones`
          );
        }

        const item = document.createElement("div");
        item.className = "zone-item animate-item";
        item.style.animationDelay = `${index * 0.06}s`;
        item.innerHTML = `
          <div class="zone-rank">${index + 1}</div>
          <div class="zone-name">${zona.barrio || "No especificado"}</div>
          <div class="zone-city">${zona.ciudad || "No especificada"}</div>
          <div class="zone-count"><i class="bi bi-heart-fill"></i> ${zona.total_adopciones} adopciones</div>
        `;
        tablaBody.appendChild(item);
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
      const fallbackImagesByName = {
        buddy: "mascota_extra_697ffd82bf286_dog-9502812_1280.jpg",
        zoe: "mascota_extra_6980ea76d40cd_cat-9476900_1280.jpg",
        jesus: "mascota_extra_69812ae1be026_animal-6591125_1280.jpg",
      };
      const topMascotas = data.slice(0, 6);
      topMascotas.forEach((mascota, index) => {
        const item = document.createElement("a");
        item.href = `ver-mascota.html?id=${mascota.id}`; // Enlace al perfil de la mascota
        item.className = "waiting-item animate-item";
        item.style.animationDelay = `${index * 0.06}s`;

        const normalizedName = (mascota.nombre || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const fallbackKey = Object.keys(fallbackImagesByName).find((key) =>
          normalizedName.includes(key)
        );
        const fallbackImage = fallbackKey ? fallbackImagesByName[fallbackKey] : null;
        const imagenFile = (mascota.imagen || "").trim();
        const isMissingImage =
          !imagenFile || imagenFile.toLowerCase().includes("default-image");
        const imagenSrc = fallbackImage
          ? `../img/mascotas/${fallbackImage}`
          : !isMissingImage
          ? imagenFile.includes("/")
            ? imagenFile
            : `../img/mascotas/${imagenFile}`
          : "../img/mascotas/default.jpg";
        const publicado = mascota.date_publicacion
          ? new Date(mascota.date_publicacion).toLocaleDateString()
          : "—";
        const tipo = mascota.tipo
          ? mascota.tipo.charAt(0).toUpperCase() + mascota.tipo.slice(1)
          : "Mascota";

        item.innerHTML = `
          <img src="${imagenSrc}" class="waiting-avatar" alt="${mascota.nombre}">
          <h5 class="waiting-name">${mascota.nombre}</h5>
          <p class="waiting-meta">${tipo} · Publicado: ${publicado}</p>
          <span class="waiting-pill-danger"><i class="bi bi-hourglass-split"></i> ${mascota.dias_en_espera} días</span>
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
    setCustomReportLoading(false);

    // Asegura que los reportes generales estén visibles
    indicadoresClaveContainer.classList.remove("d-none");
    // (Los otros ya deberían estar visibles, pero esto lo asegura)
  });

  reportMenuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.reportTarget;
      if (!target) return;
      showReportSection(target);
      if (reportMenu && typeof bootstrap !== "undefined") {
        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(reportMenu);
        offcanvas.hide();
      }
    });
  });

  exportButtons.forEach((button) => {
    button.addEventListener("click", exportActiveReportToPdf);
  });

  // --- Carga Inicial Automática ---
  showReportSection("dashboard");
  fetchDatosIniciales(); // Carga los indicadores clave y las stats por edad
});
