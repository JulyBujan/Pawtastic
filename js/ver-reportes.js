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
  const probabilisticaContainer = document.getElementById("probabilistica-container");
  const probabilisticaLoading = document.getElementById("probabilistica-loading");
  const probabilisticaEmpty = document.getElementById("probabilistica-empty");
  const probabilisticaTableBody = document.getElementById("probabilistica-table-body");
  const probTopCanvas = document.getElementById("probTopChart");
  const probBottomCanvas = document.getElementById("probBottomChart");
  const probDistributionCanvas = document.getElementById("probDistributionChart");
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
  let probTopChart = null;
  let probBottomChart = null;
  let probDistributionChart = null;
  const reportSnapshot = {
    indicadores: null,
    adopcionEdad: null,
    adopcionZona: null,
    mascotasEspera: null,
    personalizado: null,
    personalizadoRango: null,
    probabilistica: null,
  };
  const ongProfileCache = { loaded: false, data: null };
  const defaultOngLogoSrc = "../img/pdefault.jpg";

  const resolveLogoSrc = (logoUrl) => {
    if (!logoUrl) return defaultOngLogoSrc;
    if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
    if (logoUrl.startsWith("/")) return logoUrl;
    const cleanPath = logoUrl.replace(/^\.\//, "");
    return `../${cleanPath}`;
  };

  const fetchOngProfile = async () => {
    if (ongProfileCache.loaded) {
      return ongProfileCache.data;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      ongProfileCache.loaded = true;
      return null;
    }
    try {
      const response = await fetch("/api/perfil-ong.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar el perfil de la ONG.");
      }
      const data = await response.json();
      ongProfileCache.loaded = true;
      ongProfileCache.data = data;
      return data;
    } catch (error) {
      console.warn("No se pudo obtener el perfil de la ONG.", error);
      ongProfileCache.loaded = true;
      ongProfileCache.data = null;
      return null;
    }
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatEdad = (mesesTotal) => {
    const total = parseInt(mesesTotal, 10);
    if (!Number.isFinite(total) || total < 0) return "Sin edad";
    if (total === 0) return "Recién nacido";
    const anos = Math.floor(total / 12);
    const meses = total % 12;
    const partes = [];
    if (anos > 0) {
      partes.push(`${anos} año${anos === 1 ? "" : "s"}`);
    }
    if (meses > 0 || partes.length === 0) {
      partes.push(`${meses} mes${meses === 1 ? "" : "es"}`);
    }
    return partes.join(" ");
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return null;
    let numeric = value;
    if (typeof numeric === "string") {
      numeric = parseFloat(numeric.replace("%", "").trim());
    }
    if (Number.isNaN(numeric)) return null;
    if (numeric <= 1) {
      numeric = numeric * 100;
    }
    return Math.round(numeric);
  };

  const buildPredictFallback = (payload) => {
    const petsize = Number.isFinite(payload.petsize) ? payload.petsize : 2;
    const animaltype = payload.animaltype === 1 ? 1 : 0;
    const gender = payload.gender === 1 ? 1 : 0;
    const breed = payload.breed || "";
    const color = payload.color || "";

    let base = 20 + petsize * 6 + (animaltype === 1 ? 3 : 0);
    base += gender === 1 ? 2 : 0;
    base += breed === "Others" ? 5 : 0;
    base += color === "Others" ? 3 : 0;

    const dias_estimados = Math.max(7, Math.min(120, base));
    const rango_min = Math.max(5, dias_estimados - 6);
    const rango_max = dias_estimados + 8;

    return {
      dias_estimados,
      rango_estimado: `${rango_min} - ${rango_max} días`,
      confianza_modelo: "Media (simulada)",
      probabilidades_temporales: {
        adopcion_en_menos_de_30_dias: "35%",
        adopcion_en_30_a_60_dias: "45%",
        adopcion_en_mas_de_60_dias: "20%",
      },
      simulado: true,
    };
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const safePredict = async (payload) => {
    try {
      const response = await fetchWithTimeout("/api/predict.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const rawText = await response.text();
      let prediction = {};
      try {
        prediction = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        return buildPredictFallback(payload);
      }
      if (!response.ok) {
        return buildPredictFallback(payload);
      }
      return prediction;
    } catch (error) {
      return buildPredictFallback(payload);
    }
  };

  const setProbabilisticaLoading = (isLoading) => {
    if (probabilisticaLoading) {
      probabilisticaLoading.classList.toggle("d-none", !isLoading);
    }
    if (probabilisticaContainer) {
      probabilisticaContainer.classList.toggle("d-none", isLoading);
    }
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
    if (target === "probabilistica") {
      fetchProbabilistica();
    }
  };

  const exportActiveReportToPdf = async () => {
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

    try {
      if (typeof showToast === "function") {
        showToast("Generando PDF... ⏳", "info");
      }

      const loadImageAsDataUrl = async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const blob = await response.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          return null;
        }
      };

      const getImageFormatFromDataUrl = (dataUrl) => {
        if (!dataUrl || typeof dataUrl !== "string") return null;
        const match = dataUrl.match(/^data:image\/(png|jpe?g)/i);
        if (!match) return null;
        return match[1].toLowerCase().startsWith("png") ? "PNG" : "JPEG";
      };

      const ongProfile = await fetchOngProfile();
      const ongName =
        (ongProfile?.nombre || ongProfile?.razon_social || "ONG").toString().trim() || "ONG";
      const logoUrl = resolveLogoSrc(ongProfile?.logo_url);
      const logoDataUrl = await loadImageAsDataUrl(logoUrl);
      const logoFormat = getImageFormatFromDataUrl(logoDataUrl);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const palette = {
        primary: [245, 158, 11],
        dark: [15, 23, 42],
        text: [17, 24, 39],
        muted: [107, 114, 128],
      };
      let cursorY = 18;

    const ensureSpace = (needed = 8) => {
      if (cursorY + needed > pageHeight - 12) {
        pdf.addPage();
        cursorY = 18;
      }
    };

    const addLine = (
      text,
      size = 11,
      gap = 6,
      bold = false,
      indent = 0,
      color = palette.text
    ) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(String(text), contentWidth - indent);
      lines.forEach((line) => {
        ensureSpace(gap);
        pdf.text(line, margin + indent, cursorY);
        cursorY += gap;
      });
    };

    const addDivider = () => {
      ensureSpace(6);
      pdf.setDrawColor(...palette.primary);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 6;
    };

    const addHeader = (title, subtitle, dateLabel, metaLines = []) => {
      const headerHeight = Math.max(30, 32 + metaLines.length * 5 + 2);
      pdf.setFillColor(255, 251, 235);
      pdf.rect(0, 0, pageWidth, headerHeight, "F");
      pdf.setTextColor(...palette.dark);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      const titleX = logoDataUrl && logoFormat ? margin + 16 : margin;
      if (logoDataUrl && logoFormat) {
        try {
          pdf.addImage(logoDataUrl, logoFormat, margin, 8, 12, 12);
        } catch (error) {
          console.warn("No se pudo insertar el logo en el PDF.", error);
        }
      }
      pdf.text(title, titleX, 15);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...palette.muted);
      pdf.text(dateLabel, pageWidth - margin, 15, { align: "right" });
      cursorY = 26;
      addLine(subtitle, 11, 6, false, 0, palette.muted);
      if (metaLines.length) {
        metaLines.forEach((line) => {
          addLine(line, 10, 5, false, 0, palette.muted);
        });
      }
      addDivider();
    };

    const addSection = (title) => {
      cursorY += 2;
      pdf.setTextColor(...palette.primary);
      addLine(title, 11, 6, true, 0, palette.primary);
      pdf.setTextColor(...palette.text);
      cursorY += 1;
    };

    const addKpiCards = (kpis) => {
      if (!Array.isArray(kpis) || !kpis.length) return;
      const gap = 6;
      const cardWidth = (contentWidth - gap) / 2;
      const cardHeight = 26;
      const rows = Math.ceil(kpis.length / 2);
      const gridHeight = rows * cardHeight + (rows - 1) * gap;
      ensureSpace(gridHeight + 6);

      kpis.forEach((kpi, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (cardWidth + gap);
        const y = cursorY + row * (cardHeight + gap);

        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

        pdf.setTextColor(...palette.muted);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(String(kpi.label || ""), x + 6, y + 8);

        pdf.setTextColor(...palette.dark);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(String(kpi.value || "--"), x + 6, y + 17);

        if (kpi.meta) {
          pdf.setTextColor(...palette.muted);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.text(String(kpi.meta), x + 6, y + 23);
        }
      });

      cursorY += gridHeight + 4;
    };

    const addMiniTable = (rows, options = {}) => {
      if (!Array.isArray(rows) || !rows.length) return;
      const rowHeight = options.rowHeight || 8;
      const labelWidth = options.labelWidth || 82;
      const valueWidth = options.valueWidth || 24;
      const tableWidth = labelWidth + valueWidth;
      ensureSpace(rows.length * rowHeight + 6);

      rows.forEach((row, index) => {
        const y = cursorY + index * rowHeight;
        const isEven = index % 2 === 0;

        pdf.setFillColor(isEven ? 249 : 255, isEven ? 250 : 255, isEven ? 251 : 255);
        pdf.setDrawColor(229, 231, 235);
        pdf.rect(margin, y, tableWidth, rowHeight, "F");

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...palette.text);
        pdf.text(String(row.label || ""), margin + 4, y + 5.5);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...palette.dark);
        pdf.text(String(row.value || "--"), margin + tableWidth - 4, y + 5.5, { align: "right" });
      });

      pdf.setDrawColor(229, 231, 235);
      pdf.rect(margin, cursorY, tableWidth, rows.length * rowHeight, "S");
      cursorY += rows.length * rowHeight + 4;
    };

    const estimateMiniTableHeight = (rows, options = {}) => {
      if (!Array.isArray(rows) || !rows.length) return 0;
      const rowHeight = options.rowHeight || 8;
      return rows.length * rowHeight + 4;
    };

    const formatValue = (value, suffix = "") =>
      value === null || value === undefined || value === "" ? "--" : `${value}${suffix}`;
    const getActiveReportKey = () => {
      const activeSection = Array.from(reportSections).find(
        (section) => !section.classList.contains("d-none")
      );
      return activeSection?.dataset.reportSection || "dashboard";
    };

    const getChartImage = (chart) => {
      if (!chart || !chart.canvas) return null;
      const originalRatio =
        chart.options?.devicePixelRatio ||
        chart.config?.options?.devicePixelRatio ||
        window.devicePixelRatio ||
        1;
      const exportRatio = Math.max(3, originalRatio);
      if (chart.options) {
        chart.options.devicePixelRatio = exportRatio;
      }
      if (chart.config?.options) {
        chart.config.options.devicePixelRatio = exportRatio;
      }
      chart.resize();
      chart.update("none");
      const dataUrl =
        typeof chart.toBase64Image === "function"
          ? chart.toBase64Image()
          : chart.canvas.toDataURL("image/png", 1.0);
      if (chart.options) {
        chart.options.devicePixelRatio = originalRatio;
      }
      if (chart.config?.options) {
        chart.config.options.devicePixelRatio = originalRatio;
      }
      chart.resize();
      chart.update("none");
      return dataUrl && dataUrl.startsWith("data:image") ? dataUrl : null;
    };

    const addChartImage = (chart, title) => {
      if (!chart || !chart.canvas) return false;
      const dataUrl = getChartImage(chart);
      if (!dataUrl) {
        return false;
      }
      const canvas = chart.canvas;
      const maxWidth = pageWidth - margin * 2;
      const aspect = canvas.width ? canvas.height / canvas.width : 0.6;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth * aspect;
      const maxHeight = 95;
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = aspect ? imgHeight / aspect : maxWidth;
      }
      ensureSpace(imgHeight + 12);
      addLine(title, 11, 6, true, 0, palette.dark);
      pdf.addImage(dataUrl, "PNG", margin, cursorY, imgWidth, imgHeight);
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, cursorY, imgWidth, imgHeight, 2, 2, "S");
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
    const metaLines = [];
    if (ongProfile?.cuit) {
      metaLines.push(`CUIT: ${ongProfile.cuit}`);
    }
    if (ongProfile) {
      const addressParts = [ongProfile.road, ongProfile.house_number]
        .filter(Boolean)
        .join(" ");
      const areaParts = [ongProfile.suburb, ongProfile.city].filter(Boolean).join(", ");
      const address = [addressParts, areaParts].filter(Boolean).join(" • ");
      if (address) {
        metaLines.push(`Dirección: ${address}`);
      }
    }

    addHeader(
      `Reporte ${ongName}`,
      reportSnapshot.personalizado && reportSnapshot.personalizadoRango
        ? "Reporte personalizado"
        : "Reporte general",
      `Fecha: ${date.toLocaleDateString("es-AR")}`,
      metaLines
    );

    if (reportSnapshot.personalizado && reportSnapshot.personalizadoRango) {
      const inicio = reportSnapshot.personalizadoRango.inicio;
      const fin = reportSnapshot.personalizadoRango.fin;
      const inicioLabel = new Date(`${inicio}T00:00:00`).toLocaleDateString("es-AR");
      const finLabel = new Date(`${fin}T00:00:00`).toLocaleDateString("es-AR");
      addLine(`Período: ${inicioLabel} → ${finLabel}`, 10, 6, true, 0, palette.muted);
    } else {
      addLine("Últimos 30 y 60 días", 10, 6, true, 0, palette.muted);
    }

    addSection("KPIs (últimos 30 días)");
    const totalPublicadas = sumCantidad(publicaciones30.por_dia);
    addKpiCards([
      {
        label: "Postulaciones iniciadas",
        value: formatValue(adopciones30.iniciadas),
        meta: `Actualizadas: ${adopciones30.actualizadas ?? 0}`,
      },
      {
        label: "Tiempo promedio de adopción",
        value: formatValue(promedioTiempo, " días"),
        meta: `Perros ${formatValue(perro, " días")} · Gatos ${formatValue(gato, " días")}`,
      },
      {
        label: "Tasa de aprobación",
        value: formatValue(porcentajeAprobadas, "%"),
        meta: `Aprobadas ${tasa.aprobadas ?? 0} · Rechazadas ${tasa.rechazadas ?? 0}`,
      },
      {
        label: "Publicaciones con adopción",
        value: formatValue(publicaciones30.con_adopcion_aprobada),
        meta: `Publicadas: ${totalPublicadas}`,
      },
    ]);

    addSection("Tasa de éxito (últimos 60 días)");
    addMiniTable([
      { label: "Aprobadas", value: formatValue(tasa.aprobadas) },
      { label: "Rechazadas", value: formatValue(tasa.rechazadas) },
      { label: "Porcentaje aprobación", value: formatValue(porcentajeAprobadas, "%") },
    ]);

    if (reportSnapshot.adopcionEdad) {
      addSection("Adopción por edad (últimos 60 días)");
      const { perros, gatos } = reportSnapshot.adopcionEdad;
      if (perros) {
        addLine("Perros", 11, 6, true, 0, palette.dark);
        addMiniTable([
          { label: "Cachorros", value: formatValue(perros.cachorros, " días") },
          { label: "Jóvenes", value: formatValue(perros.jovenes, " días") },
          { label: "Adultos", value: formatValue(perros.adultos, " días") },
          { label: "Seniors", value: formatValue(perros.seniors, " días") },
        ]);
      }
      if (gatos) {
        cursorY += 2;
        addLine("Gatos", 11, 6, true, 0, palette.dark);
        addMiniTable([
          { label: "Cachorros", value: formatValue(gatos.cachorros, " días") },
          { label: "Jóvenes", value: formatValue(gatos.jovenes, " días") },
          { label: "Adultos", value: formatValue(gatos.adultos, " días") },
          { label: "Seniors", value: formatValue(gatos.seniors, " días") },
        ]);
      }
    }

    if (Array.isArray(reportSnapshot.adopcionZona) && reportSnapshot.adopcionZona.length) {
      const zonasRows = reportSnapshot.adopcionZona.slice(0, 5).map((zona, index) => ({
          label: `${index + 1}. ${zona.barrio || "Sin barrio"}, ${zona.ciudad || "Sin ciudad"}`,
          value: formatValue(zona.total_adopciones),
      }));
      const zonasTableHeight = estimateMiniTableHeight(zonasRows, { labelWidth: 90, valueWidth: 18 });
      ensureSpace(zonasTableHeight + 16);
      addSection("Top zonas de adopción");
      addMiniTable(zonasRows, { labelWidth: 90, valueWidth: 18 });
    }

    if (Array.isArray(reportSnapshot.mascotasEspera) && reportSnapshot.mascotasEspera.length) {
      const esperaRows = reportSnapshot.mascotasEspera.slice(0, 5).map((mascota, index) => ({
          label: `${index + 1}. ${mascota.nombre || "Mascota"}`,
          value: formatValue(mascota.dias_en_espera, " días"),
      }));
      const esperaTableHeight = estimateMiniTableHeight(esperaRows, { labelWidth: 90, valueWidth: 18 });
      ensureSpace(esperaTableHeight + 16);
      addSection("Mascotas con más tiempo en espera");
      addMiniTable(esperaRows, { labelWidth: 90, valueWidth: 18 });
    }

    if (reportSnapshot.personalizado && reportSnapshot.personalizadoRango) {
      const { inicio, fin } = reportSnapshot.personalizadoRango;
      const customData = reportSnapshot.personalizado;
      const stats = customData.adopciones || {};
      const perfil = customData.perfil_adopcion || {};
      addSection("Reporte personalizado");
      addMiniTable([
        { label: "Iniciadas", value: formatValue(stats.iniciadas) },
        { label: "Aprobadas", value: formatValue(stats.aprobadas) },
        { label: "Canceladas", value: formatValue(stats.canceladas) },
      ]);
      if (Array.isArray(perfil.por_tipo_mascota)) {
        addLine("Perfil de adopción · Tipo de mascota", 11, 6, true, 0, palette.dark);
        addMiniTable(
          perfil.por_tipo_mascota.map((item) => ({
            label: item.tipo_mascota,
            value: formatValue(item.cantidad),
          })),
          { labelWidth: 90, valueWidth: 18 }
        );
      }
      if (Array.isArray(perfil.por_vivienda)) {
        addLine("Perfil de adopción · Tipo de vivienda", 11, 6, true, 0, palette.dark);
        addMiniTable(
          perfil.por_vivienda.map((item) => ({
            label: item.tipo_vivienda,
            value: formatValue(item.cantidad),
          })),
          { labelWidth: 90, valueWidth: 18 }
        );
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
    const totalPages = pdf.getNumberOfPages();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...palette.muted);
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      pdf.text(
        `Página ${page} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: "right" }
      );
    }

      pdf.save(
        `reporte-${reportSnapshot.personalizado ? "personalizado" : "dashboard"}-${fileStamp}.pdf`
      );
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      if (typeof showToast === "function") {
        showToast("No se pudo generar el PDF.", "danger");
      }
    } finally {
      if (exportButton) {
        exportButton.classList.remove("is-loading");
        exportButton.disabled = false;
      }
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

  const buildPredictPayload = (mascota) => {
    const animaltype = String(mascota.tipo || "").toLowerCase() === "perro" ? 1 : 0;
    const gender = String(mascota.sexo || "").toLowerCase() === "macho" ? 1 : 0;
    const sizeMap = {
      cachorro: 0,
      miniatura: 0,
      pequeño: 1,
      pequeno: 1,
      mediano: 2,
      grande: 3,
      "muy grande": 4,
    };
    const rawSize = String(mascota["tamaño"] ?? mascota.tamano ?? "").toLowerCase();
    const petsize = sizeMap[rawSize] ?? 2;

    const allowedBreeds = [
      "DOMESTIC SH",
      "PIT BULL",
      "LABRADOR RETR",
      "GERM SHEPHERD",
      "DOMESTIC MH",
      "BEAGLE",
      "BOXER",
      "DOMESTIC LH",
      "CHIHUAHUA SH",
      "SHIH TZU",
      "SIBERIAN HUSKY",
      "ALASKAN HUSKY",
    ];
    const allowedColors = [
      "BLACK",
      "TABBY",
      "WHITE",
      "BROWN",
      "GRAY",
      "TAN",
      "BRINDLE",
      "TORTIE",
      "ORANGE",
      "CALICO",
    ];
    const normalizeValue = (value) =>
      value ? String(value).trim().toUpperCase() : "";

    const rawBreed = normalizeValue(mascota.breed);
    const breed = allowedBreeds.includes(rawBreed) ? rawBreed : "Others";
    const rawColor = normalizeValue(mascota.color);
    const color = allowedColors.includes(rawColor) ? rawColor : "Others";

    return { animaltype, gender, petsize, breed, color };
  };

  const renderProbabilisticaCharts = (items) => {
    if (!probTopCanvas || !probBottomCanvas || !probDistributionCanvas) return;
    const sorted = [...items].sort((a, b) => (b.probLess30 || 0) - (a.probLess30 || 0));
    const topItems = sorted.slice(0, 5);
    const bottomItems = sorted.slice(-5).reverse();

    const buildBar = (canvas, dataItems, label, color) => {
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const labels = dataItems.map((item) => item.nombre || "Mascota");
      const values = dataItems.map((item) => item.probLess30 || 0);
      return new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: color,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.y}%`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (value) => `${value}%` },
            },
          },
        },
      });
    };

    if (probTopChart) probTopChart.destroy();
    if (probBottomChart) probBottomChart.destroy();
    if (probDistributionChart) probDistributionChart.destroy();

    probTopChart = buildBar(probTopCanvas, topItems, "Probabilidad <30", "#16a34a");
    probBottomChart = buildBar(probBottomCanvas, bottomItems, "Probabilidad <30", "#ef4444");

    const totals = items.reduce(
      (acc, item) => {
        if (item.probLess30 !== null) {
          acc.less30 += item.probLess30;
          acc.count += 1;
        }
        if (item.prob30_60 !== null) {
          acc.mid += item.prob30_60;
          acc.countMid += 1;
        }
        if (item.prob60 !== null) {
          acc.more += item.prob60;
          acc.countMore += 1;
        }
        return acc;
      },
      { less30: 0, mid: 0, more: 0, count: 0, countMid: 0, countMore: 0 }
    );

    const avgLess30 = totals.count ? Math.round(totals.less30 / totals.count) : 0;
    const avgMid = totals.countMid ? Math.round(totals.mid / totals.countMid) : 0;
    const avgMore = totals.countMore ? Math.round(totals.more / totals.countMore) : 0;

    const distCtx = probDistributionCanvas.getContext("2d");
    probDistributionChart = new Chart(distCtx, {
      type: "doughnut",
      data: {
        labels: ["<30 días", "30-60 días", ">60 días"],
        datasets: [
          {
            data: [avgLess30, avgMid, avgMore],
            backgroundColor: ["#16a34a", "#f59e0b", "#ef4444"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`,
            },
          },
        },
      },
    });
  };

  const renderProbabilisticaTable = (items) => {
    if (!probabilisticaTableBody) return;
    probabilisticaTableBody.innerHTML = "";
    if (!items.length) {
      if (probabilisticaEmpty) {
        probabilisticaEmpty.classList.remove("d-none");
      }
      return;
    }
    if (probabilisticaEmpty) {
      probabilisticaEmpty.classList.add("d-none");
    }

    const sorted = [...items].sort((a, b) => (b.probLess30 || 0) - (a.probLess30 || 0)).slice(0, 10);
    sorted.forEach((item) => {
      const row = `
        <tr>
          <td>${escapeHtml(item.nombre || "Mascota")}</td>
          <td>${escapeHtml(item.tipo || "")}</td>
          <td>${escapeHtml(formatEdad(item.edad))}</td>
          <td>${escapeHtml(item.tamano || "")}</td>
          <td>${item.dias_estimados ?? "--"}</td>
          <td>${escapeHtml(item.rango_estimado || "--")}</td>
          <td>${escapeHtml(item.confianza_modelo || "--")}</td>
          <td>${item.probLess30 !== null ? `${item.probLess30}%` : "--"}</td>
          <td>${item.prob30_60 !== null ? `${item.prob30_60}%` : "--"}</td>
          <td>${item.prob60 !== null ? `${item.prob60}%` : "--"}</td>
        </tr>
      `;
      probabilisticaTableBody.insertAdjacentHTML("beforeend", row);
    });
  };

  const fetchProbabilistica = async () => {
    if (!probabilisticaContainer || !probabilisticaLoading) return;
    if (reportSnapshot.probabilistica) {
      setProbabilisticaLoading(false);
      renderProbabilisticaTable(reportSnapshot.probabilistica);
      renderProbabilisticaCharts(reportSnapshot.probabilistica);
      return;
    }

    setProbabilisticaLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      if (typeof showToast === "function") {
        showToast("Debes iniciar sesión para ver este reporte.", "danger");
      }
      setProbabilisticaLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/get_mascota.php?include_adoptadas=1&include_archivadas=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "No se pudieron cargar las mascotas.");
      }
      const mascotas = await response.json();
      const list = Array.isArray(mascotas) ? mascotas : [];
      const activas = list.filter((mascota) => {
        const estado = parseInt(mascota.estado, 10);
        return estado === 1 || estado === 0;
      });

      if (!activas.length) {
        reportSnapshot.probabilistica = [];
        renderProbabilisticaTable([]);
        renderProbabilisticaCharts([]);
        setProbabilisticaLoading(false);
        return;
      }

      const results = await Promise.all(
        activas.map(async (mascota) => {
          const payload = buildPredictPayload(mascota);
          const prediction = await safePredict(payload);
          const probs = prediction.probabilidades_temporales || {};
          const probLess30 = formatPercentage(probs.adopcion_en_menos_de_30_dias);
          const prob30_60 = formatPercentage(probs.adopcion_en_30_a_60_dias);
          const prob60 = formatPercentage(probs.adopcion_en_mas_de_60_dias);
          return {
            id: mascota.id,
            nombre: mascota.nombre || "Mascota",
            tipo: mascota.tipo || "",
            edad: mascota.edad,
            tamano: mascota["tamaño"] ?? mascota.tamano ?? "",
            dias_estimados: prediction.dias_estimados ?? null,
            rango_estimado: prediction.rango_estimado ?? null,
            confianza_modelo: prediction.confianza_modelo ?? null,
            probLess30,
            prob30_60,
            prob60,
          };
        })
      );

      reportSnapshot.probabilistica = results;
      renderProbabilisticaTable(results);
      renderProbabilisticaCharts(results);
    } catch (error) {
      console.error("Error al cargar probabilística:", error);
      if (typeof showToast === "function") {
        showToast(error.message || "No se pudo generar el reporte.", "danger");
      }
      if (probabilisticaEmpty) {
        probabilisticaEmpty.classList.remove("d-none");
      }
    } finally {
      setProbabilisticaLoading(false);
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
