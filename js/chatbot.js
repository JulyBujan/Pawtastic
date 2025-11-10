document.addEventListener("DOMContentLoaded", () => {
  const chatbotToggler = document.querySelector(".chatbot-toggler");
  const chatbot = document.querySelector(".chatbot");
  const closeBtn = document.querySelector(".close-btn");
  const chatbox = document.querySelector(".chatbox");
  const chatInput = document.querySelector(".chat-input textarea");
  const sendChatBtn = document.querySelector(".chat-input span");

  // Datos extraídos de faq.html
  const faqs = [
    {
      question: "¿Cómo puedo adoptar una mascota desde Pawtastic?",
      answer:
        "Primero debés crear tu perfil de usuario. Luego, ingresá a la sección “Catálogo”, elegí la que te enamore 🐶💖 y hacé clic en “Postularme” para adoptar. Una ONG revisará tu solicitud y te contactará para coordinar el proceso.",
      keywords: ["adoptar", "adoptar", "proceso", "catalogo", "postularme"],
    },
    {
      question: "¿Tiene costo adoptar?",
      answer:
        "No, la adopción es gratuita. Sin embargo, algunas ONGs pueden solicitar una contribución voluntaria o cubrir parte del costo de vacunación o castración. Siempre será informado antes de avanzar.",
      keywords: ["costo", "gratis", "precio", "contribucion", "pagar"],
    },
    {
      question: "¿Qué requisitos debo cumplir para adoptar?",
      answer:
        "Los requisitos pueden variar según la ONG, pero en general se solicita ser mayor de edad, contar con espacio adecuado y condiciones seguras, y el compromiso de cuidado, alimentación y seguimiento veterinario. Algunas ONGs realizan entrevistas o visitas.",
      keywords: [
        "requisitos",
        "condiciones",
        "adoptar",
        "necesito",
        "mayor de edad",
      ],
    },
    {
      question: "¿Qué pasa después de adoptar?",
      answer:
        "Luego de la adopción, la ONG realizará un seguimiento para acompañarte en el proceso de adaptación y garantizar el bienestar del animal. Podrás consultar siempre que lo necesites: ¡no estás solo/a! ❤️",
      keywords: ["despues", "seguimiento", "proceso", "adaptacion"],
    },
    {
      question: "¿Cómo puede registrarse una ONG en Pawtastic?",
      answer:
        "Las ONGs interesadas deben enviar un correo a pawtasticarg@gmail.com con el nombre de la organización, descripción y datos de contacto. El equipo de Pawtastic verificará los datos y activará la cuenta.",
      keywords: ["ong", "registrar", "refugio", "organizacion", "inscribir"],
    },
    {
      question: "¿Qué beneficios tiene usar Pawtastic como ONG?",
      answer:
        "Tendrás más visibilidad para tus mascotas, comunicación directa con postulantes, control del proceso de adopción y estadísticas de tu actividad.",
      keywords: ["beneficios", "ventajas", "ong", "usar pawtastic"],
    },
    {
      question: "Hola",
      answer:
        "¡Hola! 👋 Soy Pawtastic-Bot. Estoy aquí para ayudarte con tus dudas sobre adopciones. ¿En qué puedo ayudarte?",
      keywords: ["hola", "buenos dias", "buenas tardes"],
    },
  ];

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
    userMessage = userMessage.toLowerCase();
    let bestMatch = {
      score: 0,
      answer:
        "Mmm... no estoy seguro de haber entendido tu pregunta. 🤔<br>Recordá que puedo ayudarte con dudas sobre adopciones, requisitos y el proceso para ONGs. Si necesitás algo más específico, podés contactar al equipo en <strong>pawtasticarg@gmail.com</strong>.",
    };

    faqs.forEach((faq) => {
      let score = 0;
      faq.keywords.forEach((keyword) => {
        if (userMessage.includes(keyword)) {
          score++;
        }
      });

      if (score > bestMatch.score) {
        bestMatch = { score: score, answer: faq.answer };
      }
    });

    return bestMatch.answer;
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
