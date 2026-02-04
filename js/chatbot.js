document.addEventListener("DOMContentLoaded", () => {
  const chatbotToggler = document.querySelector(".chatbot-toggler");
  const chatbot = document.querySelector(".chatbot");
  const closeBtn = document.querySelector(".close-btn");
  const chatbox = document.querySelector(".chatbox");
  const chatInput = document.querySelector(".chat-input textarea");
  const sendChatBtn = document.querySelector(".chat-input span");
  const userType = localStorage.getItem("tipo");

  const stopWords = new Set([
    "que",
    "como",
    "cual",
    "cuales",
    "donde",
    "cuando",
    "quien",
    "quienes",
    "por",
    "para",
    "con",
    "sin",
    "sobre",
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "mi",
    "mis",
    "tu",
    "tus",
    "su",
    "sus",
    "yo",
    "vos",
    "usted",
    "ustedes",
    "nos",
    "nosotros",
    "me",
    "se",
    "al",
    "y",
    "o",
    "es",
    "son",
    "ser",
    "estar",
    "esta",
    "estan",
    "hay",
    "puedo",
    "puede",
    "pueden",
    "tengo",
    "tenes",
    "tienes",
    "quiero",
    "gustaria",
    "mas",
    "menos",
  ]);

  const synonymMap = {
    adoptar: ["adopcion", "adoptar", "adoptante", "postularme", "postulacion"],
    adopcion: ["adoptar", "adoptante", "postulacion", "postularme"],
    postularme: ["postulacion", "adopcion", "adoptar"],
    mascota: ["mascotas", "perro", "gato", "animal", "animales"],
    ong: ["ongs", "refugio", "organizacion", "institucion"],
    cerca: ["cercania", "zona", "ubicacion", "cercanas"],
    tamano: ["tamaño", "pequeno", "pequeño", "mediano", "grande", "chico"],
    energia: ["energia", "energía"],
    publicar: ["publicar", "cargar", "subir", "crear", "nueva", "agregar"],
    editar: ["editar", "modificar", "actualizar"],
    postulaciones: ["postulacion", "solicitudes", "aplicaciones"],
    reportes: ["reporte", "reportes", "estadisticas", "metricas"],
    estado: ["estado", "activa", "adoptada", "revision", "archivada"],
  };

  const faqLink = "/pages/faq.html";

  const normalizeText = (text) => {
    if (!text) {
      return "";
    }
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const tokenize = (text) => {
    const normalized = normalizeText(text);
    if (!normalized) {
      return [];
    }
    return normalized
      .split(" ")
      .filter((token) => token && !stopWords.has(token));
  };

  const expandTokens = (tokens) => {
    const expanded = new Set(tokens);
    tokens.forEach((token) => {
      const related = synonymMap[token];
      if (related) {
        related.forEach((item) => expanded.add(normalizeText(item)));
      }
    });
    return expanded;
  };

  const fallbackFaqs = [
    {
      question: "Hola",
      answer:
        "¡Hola! 👋 Soy Pawtastic-Bot. Estoy aquí para ayudarte con tus dudas sobre adopciones.",
      keywords: ["hola", "buenos dias", "buenas tardes", "buenas noches"],
    },
    {
      question: "Ayuda",
      answer:
        `Podés hacer preguntas sobre adopciones, filtros del catálogo, requisitos o el proceso para ONGs. También podés visitar nuestras <a href="${faqLink}">Preguntas Frecuentes</a>.`,
      keywords: ["ayuda", "faq", "preguntas", "informacion"],
    },
  ];

  let faqs = [];
  let enrichedFaqs = [];

  const buildFaqIndex = (items) => {
    faqs = Array.isArray(items) ? items : [];
    enrichedFaqs = faqs.map((faq) => {
      const keywordPhrases = (faq.keywords || [])
        .map((keyword) => normalizeText(keyword))
        .filter(Boolean);
      const tokens = new Set([
        ...tokenize(faq.question),
        ...keywordPhrases.flatMap((phrase) => tokenize(phrase)),
      ]);
      return { ...faq, keywordPhrases, tokens };
    });
  };

  const loadFaqs = async () => {
    try {
      const faqPath = window.location.pathname.includes("/pages/")
        ? "../js/chatbot-faqs.json"
        : "./js/chatbot-faqs.json";
      const response = await fetch(faqPath, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo de FAQs.");
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de FAQs inválido.");
      }
      buildFaqIndex(data);
    } catch (error) {
      console.warn("No se pudieron cargar las FAQs externas.", error);
      buildFaqIndex(fallbackFaqs);
    }
  };

  const faqsPromise = loadFaqs();

  const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent =
      className === "outgoing"
        ? `<p>${message}</p>`
        : `<span class="material-symbols-outlined">smart_toy</span><p>${message}</p>`;
    chatLi.innerHTML = chatContent;
    return chatLi;
  };

  const createTypingLi = () => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", "incoming", "typing");
    chatLi.innerHTML = `
      <span class="material-symbols-outlined">smart_toy</span>
      <p>
        <span class="typing-text">Escribiendo</span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </p>
    `;
    return chatLi;
  };

  const wait = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const findAnswer = (userMessage) => {
    const normalizedMessage = normalizeText(userMessage);
    const userTokens = expandTokens(tokenize(userMessage));
    const fallbackAnswer =
      `Mmm... no estoy seguro de haber entendido tu pregunta. 🤔<br>Podés preguntarme sobre adopciones, filtros del catálogo, requisitos o el proceso para ONGs. Si querés, podés visitar nuestras <a href="${faqLink}">Preguntas Frecuentes</a>. Si necesitás ayuda específica, escribinos a <strong>pawtasticarg@gmail.com</strong>.`;
    let bestMatch = {
      score: 0,
      answer: fallbackAnswer,
    };

    enrichedFaqs.forEach((faq) => {
      let score = 0;

      faq.keywordPhrases.forEach((phrase) => {
        if (phrase && normalizedMessage.includes(phrase)) {
          score += 2;
        }
      });

      let overlap = 0;
      faq.tokens.forEach((token) => {
        if (userTokens.has(token)) {
          overlap += 1;
        }
      });

      const union = faq.tokens.size + userTokens.size - overlap;
      const jaccard = union ? overlap / union : 0;
      score += jaccard * 2;

      if (userType && faq.audience) {
        if (faq.audience === userType) {
          score += 0.4;
        } else {
          score -= 0.15;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { score, answer: faq.answer };
      }
    });

    return bestMatch.score >= 0.6 ? bestMatch.answer : fallbackAnswer;
  };

  const handleChat = async () => {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Limpiar el input inmediatamente y añadir el mensaje del usuario al chatbox
    chatInput.value = "";
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    const typingIndicator = createTypingLi();
    chatbox.appendChild(typingIndicator);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    await faqsPromise;
    await wait(600);

    const botResponse = findAnswer(userMessage);
    typingIndicator.remove();
    chatbox.appendChild(createChatLi(botResponse, "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
  };

  // Event Listeners
  chatbotToggler.addEventListener("click", () =>
    document.body.classList.toggle("show-chatbot")
  );
  closeBtn.addEventListener("click", () =>
    document.body.classList.remove("show-chatbot")
  );
  sendChatBtn.addEventListener("click", handleChat);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  });
});
