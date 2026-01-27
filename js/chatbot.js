document.addEventListener("DOMContentLoaded", () => {
  const chatbotToggler = document.querySelector(".chatbot-toggler");
  const chatbot = document.querySelector(".chatbot");
  const closeBtn = document.querySelector(".close-btn");
  const chatbox = document.querySelector(".chatbox");
  const chatInput = document.querySelector(".chat-input textarea");
  const sendChatBtn = document.querySelector(".chat-input span");

  // Datos extraídos y ampliados desde faq.html
  const faqs = [
    {
      question: "¿Cómo puedo adoptar una mascota desde Pawtastic?",
      answer:
        "Primero creás tu perfil de usuario. Luego ingresás a “Catálogo”, elegís la mascota que te enamore y hacés clic en “Postularme”. La ONG revisa tu solicitud y te contacta para coordinar el proceso.",
      keywords: ["adoptar", "postularme", "catalogo", "proceso adopcion"],
    },
    {
      question: "¿Cómo funciona el proceso de adopción?",
      answer:
        "Creás tu cuenta, completás tu perfil, buscás en el catálogo y te postulás. La ONG revisa la solicitud, te contacta y acompaña el proceso hasta la adopción.",
      keywords: ["proceso", "adopcion", "pasos", "postulacion"],
    },
    {
      question: "¿Tiene costo adoptar?",
      answer:
        "La adopción es gratuita. Algunas ONGs pueden solicitar una contribución voluntaria o cubrir parte del costo de vacunación o castración. Siempre se informa antes de avanzar.",
      keywords: ["costo", "gratis", "precio", "pagar", "contribucion"],
    },
    {
      question: "¿Qué requisitos debo cumplir para adoptar?",
      answer:
        "Los requisitos pueden variar según la ONG, pero en general se solicita ser mayor de edad, contar con un espacio adecuado y el compromiso de cuidado y seguimiento veterinario.",
      keywords: ["requisitos", "condiciones", "mayor de edad"],
    },
    {
      question: "¿Cuánto tiempo tarda la revisión de una postulación?",
      answer:
        "Depende de cada ONG. En general responden en pocos días. Podés ver el estado en “Mis postulaciones”.",
      keywords: ["tiempo", "tarda", "revision", "postulacion", "estado"],
    },
    {
      question: "¿Qué pasa después de adoptar?",
      answer:
        "Luego de la adopción, la ONG realiza un seguimiento para acompañarte en la adaptación y garantizar el bienestar del animal. Podés consultar siempre que lo necesites.",
      keywords: ["despues", "seguimiento", "adaptacion"],
    },
    {
      question: "¿Puedo adoptar si tengo otros animales en casa?",
      answer:
        "Sí, muchas mascotas son aptas con otras mascotas. Revisá el perfil y comentá tu situación a la ONG.",
      keywords: ["otros animales", "otras mascotas", "convivencia"],
    },
    {
      question: "¿Qué pasa si después de adoptarla no me adapto?",
      answer:
        "Contactá a la ONG. El seguimiento está pensado para acompañarte y buscar la mejor solución para vos y la mascota.",
      keywords: ["no me adapto", "devolver", "seguimiento", "problemas"],
    },
    {
      question: "¿Qué mascotas hay disponibles para adoptar?",
      answer:
        "En el catálogo se listan todas las mascotas publicadas por las ONGs. La lista se actualiza cuando se agregan nuevos perfiles o se adopta una mascota.",
      keywords: ["mascotas disponibles", "lista", "catalogo", "disponibles"],
    },
    {
      question: "¿Puedo buscar solo perros o gatos?",
      answer:
        "Sí. En el catálogo podés filtrar por especie y ver solo perros o solo gatos.",
      keywords: ["perros", "gatos", "especie", "filtro"],
    },
    {
      question: "¿Tienen cachorros o animales mayores?",
      answer:
        "Sí. Hay cachorros, adultos y seniors. Usá el filtro de edad para encontrar el que buscás.",
      keywords: ["cachorros", "adultos", "senior", "mayores", "edad"],
    },
    {
      question: "¿Qué mascota recomiendan si vivo en un departamento?",
      answer:
        "En general se recomiendan mascotas de tamaño pequeño o mediano y energía baja o media. Revisá el perfil y consultá a la ONG para confirmar compatibilidad.",
      keywords: ["departamento", "tamaño pequeño", "energia baja", "recomiendan"],
    },
    {
      question: "¿Cuáles están vacunados o castrados?",
      answer:
        "En el perfil de cada mascota se indica si está vacunada o castrada. Si no figura, consultalo con la ONG responsable.",
      keywords: ["vacunados", "castrados", "esterilizados", "vacuna", "castracion"],
    },
    {
      question: "¿Hay mascotas de tamaño pequeño?",
      answer:
        "Sí, podés filtrar por tamaño pequeño desde el catálogo.",
      keywords: ["tamaño pequeño", "pequeño", "chico", "tamano"],
    },
    {
      question: "¿Qué mascotas están disponibles cerca de mi zona?",
      answer:
        "Si estás logueado y validaste tu dirección, podés usar el botón “Por cercanía” en el catálogo.",
      keywords: ["cerca", "zona", "cercania", "ubicacion"],
    },
    {
      question: "¿Puedo buscar mascotas por edad, tamaño o raza?",
      answer:
        "Podés filtrar por edad y tamaño. La raza aparece en el perfil detallado de cada mascota.",
      keywords: ["edad", "tamaño", "tamano", "raza", "filtros"],
    },
    {
      question: "¿Hay alguna ONG cerca de mí?",
      answer:
        "No hay un buscador directo de ONGs, pero en el perfil de cada mascota podés ver la ONG responsable y su ubicación.",
      keywords: ["ong cerca", "refugio cerca", "organizacion cercana"],
    },
    {
      question: "¿Cómo puedo contactar a la ONG?",
      answer:
        "Al postularte, la ONG se pondrá en contacto para coordinar. En algunos perfiles también se muestran datos de contacto.",
      keywords: ["contactar ong", "contacto", "telefono", "email"],
    },
    {
      question: "¿Puedo postularme a más de una mascota?",
      answer:
        "Sí, podés hacerlo. Se recomienda postularse responsablemente y responder a las ONGs a tiempo.",
      keywords: ["postularme mas de una", "varias mascotas", "multiple"],
    },
    {
      question: "¿Cómo sé si mi postulación fue aceptada?",
      answer:
        "En la sección “Mis postulaciones” podés ver el estado (pendiente, aprobada o rechazada).",
      keywords: ["aceptada", "estado", "resultado", "postulacion"],
    },
    {
      question: "¿Puedo ser hogar de tránsito?",
      answer:
        "Depende de cada ONG. Podés ofrecerte y te indicarán requisitos y tiempos.",
      keywords: ["hogar de transito", "transitorio", "transito"],
    },
    {
      question: "¿Cómo puedo colaborar si no puedo adoptar?",
      answer:
        "Podés colaborar difundiendo, donando, ofreciendo hogar de tránsito o haciendo voluntariado en una ONG.",
      keywords: ["colaborar", "ayudar", "donar", "voluntario", "difundir"],
    },
    {
      question: "¿Qué mascota se adapta mejor a mi estilo de vida?",
      answer:
        "Completá tu perfil y usá la función “Ver mi Match” para ver compatibilidad. También revisá energía, tamaño y aptitudes.",
      keywords: ["estilo de vida", "match", "compatibilidad", "recomiendan"],
    },
    {
      question: "¿Me podés contar más sobre la personalidad de una mascota?",
      answer:
        "En el perfil de la mascota vas a encontrar su personalidad, nivel de energía y aptitudes. Si falta información, consultá a la ONG.",
      keywords: ["personalidad", "caracter", "energia", "aptitudes"],
    },
    {
      question: "¿Qué significan etiquetas como “especial”, “urgente” o “transitorio”?",
      answer:
        "“Especial” suele indicar que necesita cuidados particulares. “Urgente” que requiere hogar pronto. “Transitorio” que se busca un hogar temporal. Puede variar según la ONG.",
      keywords: ["especial", "urgente", "transitorio", "etiquetas"],
    },
    {
      question: "¿Cómo puede registrarse una ONG en Pawtastic?",
      answer:
        "Las ONGs interesadas deben enviar un correo a pawtasticarg@gmail.com con nombre, descripción y datos de contacto. El equipo verifica los datos y activa la cuenta.",
      keywords: ["ong", "registrar", "refugio", "organizacion", "inscribir"],
    },
    {
      question: "¿Qué beneficios tiene usar Pawtastic como ONG?",
      answer:
        "Más visibilidad para las mascotas, comunicación directa con postulantes, control del proceso y estadísticas de adopciones.",
      keywords: ["beneficios", "ventajas", "ong", "usar pawtastic"],
    },
    {
      question: "Hola",
      answer:
        "¡Hola! 👋 Soy Pawtastic-Bot. Estoy aquí para ayudarte con tus dudas sobre adopciones. ¿En qué puedo ayudarte?",
      keywords: ["hola", "buenos dias", "buenas tardes", "buenas noches"],
    },
  ];

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
  };

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

  const enrichedFaqs = faqs.map((faq) => {
    const keywordPhrases = (faq.keywords || [])
      .map((keyword) => normalizeText(keyword))
      .filter(Boolean);
    const tokens = new Set([
      ...tokenize(faq.question),
      ...keywordPhrases.flatMap((phrase) => tokenize(phrase)),
    ]);
    return { ...faq, keywordPhrases, tokens };
  });

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

  const findAnswer = (userMessage) => {
    const normalizedMessage = normalizeText(userMessage);
    const userTokens = expandTokens(tokenize(userMessage));
    const fallbackAnswer =
      "Mmm... no estoy seguro de haber entendido tu pregunta. 🤔<br>Podés preguntarme sobre adopciones, filtros del catálogo, requisitos o el proceso para ONGs. Si querés, podés visitar nuestras <a href=\"./pages/faq.html\">Preguntas Frecuentes</a>. Si necesitás ayuda específica, escribinos a <strong>pawtasticarg@gmail.com</strong>.";
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

      if (score > bestMatch.score) {
        bestMatch = { score, answer: faq.answer };
      }
    });

    return bestMatch.score >= 0.6 ? bestMatch.answer : fallbackAnswer;
  };

  const handleChat = () => {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Limpiar el input inmediatamente y añadir el mensaje del usuario al chatbox
    chatInput.value = "";
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
      const botResponse = findAnswer(userMessage);
      chatbox.appendChild(createChatLi(botResponse, "incoming"));
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }, 600);
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
