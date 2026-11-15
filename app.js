
const homePage = document.getElementById("homePage");
const chatPage = document.getElementById("chatPage");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");
const sidebar = document.getElementById("sidebar");
const historyList = document.getElementById("historyList");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const attachmentsBox = document.getElementById("attachments");

let currentMode = "individual";
let currentModel = "ChatGPT";
let currentChatId = null;
let attachedFiles = [];
let chats = JSON.parse(localStorage.getItem("omnia_chats") || "[]");

const modelNames = ["ChatGPT", "Claude", "Gemini"];

const modeNames = {
  individual: "Individual",
  triple: "Triple Chat",
  room: "Sala de IA",
  supreme: "Supremo"
};

function saveChats() {
  localStorage.setItem("omnia_chats", JSON.stringify(chats));
}

function showHome() {
  homePage.classList.remove("hidden");
  chatPage.classList.add("hidden");
  currentChatId = null;
}

function showChat() {
  homePage.classList.add("hidden");
  chatPage.classList.remove("hidden");
  messageInput.focus();
}

function createChat(mode, model = "ChatGPT") {
  currentMode = mode;
  currentModel = model;

  const chat = {
    id: Date.now().toString(),
    title: "Nuevo chat",
    mode,
    model,
    messages: [],
    created: new Date().toISOString()
  };

  chats.unshift(chat);
  currentChatId = chat.id;

  chatTitle.textContent = modeNames[mode];
  updateSubtitle();
  renderMessages();
  saveChats();
  showChat();
  renderHistory();
}

function getCurrentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function updateSubtitle() {
  if (currentMode === "individual") {
    chatSubtitle.textContent = currentModel;
  } else {
    chatSubtitle.textContent = "ChatGPT · Claude · Gemini";
  }
}

function renderMessages() {
  messages.innerHTML = "";

  const chat = getCurrentChat();

  if (!chat || chat.messages.length === 0) {
    messages.innerHTML = `
      <div class="empty-chat">
        <h2>¿Qué querés explorar?</h2>
        Escribí tu mensaje para comenzar.
      </div>`;
    return;
  }

  chat.messages.forEach(message => {
    const element = document.createElement("div");
    element.className = "message " + message.type;

    if (message.type === "ai") {
      const speaker = document.createElement("div");
      speaker.className = "speaker";
      speaker.textContent = message.speaker || "OMNIA";
      element.appendChild(speaker);
    }

    const content = document.createElement("div");
    content.textContent = message.text;
    element.appendChild(content);

    messages.appendChild(element);
  });

  messages.scrollTop = messages.scrollHeight;
}

function addMessage(type, text, speaker = "") {
  const chat = getCurrentChat();
  if (!chat) return;

  chat.messages.push({ type, text, speaker });

  if (chat.title === "Nuevo chat" && type === "user") {
    chat.title = text.slice(0, 35);
  }

  saveChats();
  renderMessages();
  renderHistory();
}

// RESPUESTAS DE DEMOSTRACIÓN
// Estas respuestas no vienen de las APIs reales todavía.

function demoReply(model, question) {
  const responses = {
    ChatGPT:
      "Soy ChatGPT dentro de OMNIA. Recibí tu mensaje: \"" +
      question +
      "\". Esta es una respuesta de demostración. Cuando conectemos la API podré analizarlo y responder realmente.",

    Claude:
      "Soy Claude dentro de OMNIA. Voy a observar tu planteamiento desde otro punto de vista. Esta respuesta es de demostración; la conexión real se agregará después.",

    Gemini:
      "Soy Gemini dentro de OMNIA. Puedo aportar una perspectiva diferente sobre tu pregunta. Esta respuesta es provisional hasta conectar el servicio real."
  };

  return responses[model];
}

function sendMessage() {
  const text = messageInput.value.trim();

  if (!text && attachedFiles.length === 0) return;

  const question = text || "Revisá los archivos adjuntos.";

  addMessage("user", question);

  if (attachedFiles.length > 0) {
    const names = attachedFiles.map(file => file.name).join(", ");
    addMessage("user", "Archivos adjuntos: " + names);
  }

  messageInput.value = "";
  messageInput.style.height = "auto";

  attachedFiles = [];
  attachmentsBox.innerHTML = "";

  if (currentMode === "individual") {
    addMessage("ai", demoReply(currentModel, question), currentModel);
  }

  if (currentMode === "triple") {
    modelNames.forEach(model => {
      addMessage("ai", demoReply(model, question), model);
    });
  }

  if (currentMode === "supreme") {
    addMessage(
      "ai",
      "Las tres IAs deberían analizar tu mensaje y preparar una respuesta conjunta. Esta es una vista de demostración: todavía falta conectar los modelos reales.",
      "OMNIA SUPREMO"
    );
  }

  if (currentMode === "room") {
    addMessage(
      "ai",
      "La Sala de IA está preparada para funcionar. Cuando conectemos los modelos, podrán conversar entre sí por turnos, debatir y responderte. Esta es una vista de demostración.",
      "OMNIA · SALA DE IA"
    );
  }

  renderMessages();
}

// MODOS

document.querySelectorAll(".mode-card").forEach(button => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    if (mode === "individual") {
      openModelPicker();
    } else {
      createChat(mode);
    }
  });
});

function openModelPicker() {
  modalContent.innerHTML = `
    <h2>Elegí una IA</h2>
    <p>¿Con cuál querés conversar?</p>
    <div class="settings-list">
      <button data-choice="ChatGPT">ChatGPT</button>
      <button data-choice="Claude">Claude</button>
      <button data-choice="Gemini">Gemini</button>
    </div>
    <div class="modal-actions">
      <button id="cancelModal">Cancelar</button>
    </div>
  `;

  modal.classList.remove("hidden");

  modalContent.querySelectorAll("[data-choice]").forEach(button => {
    button.addEventListener("click", () => {
      modal.classList.add("hidden");
      createChat("individual", button.dataset.choice);
    });
  });

  document.getElementById("cancelModal").onclick = closeModal;
}

// CONFIGURACIÓN DE MODELOS

document.querySelectorAll(".model-chip").forEach(button => {
  button.addEventListener("click", () => {
    const model = button.dataset.model;
    openModelSettings(model);
  });
});

function openModelSettings(model) {
  modalContent.innerHTML = `
    <h2>Configuración · ${model}</h2>
    <p>Preferencias de conversación para este modelo.</p>

    <label>Estilo de respuesta</label>
    <select id="modelStyle">
      <option>Equilibrado</option>
      <option>Creativo</option>
      <option>Preciso</option>
      <option>Detallado</option>
    </select>

    <label>Instrucciones personalizadas</label>
    <input id="modelInstructions"
      placeholder="Escribí tus preferencias...">

    <div class="modal-actions">
      <button id="cancelModal">Cancelar</button>
      <button class="primary" id="saveModel">Guardar</button>
    </div>
  `;

  modal.classList.remove("hidden");

  const key = "omnia_settings_" + model;
  const saved = JSON.parse(localStorage.getItem(key) || "{}");

  document.getElementById("modelStyle").value =
    saved.style || "Equilibrado";

  document.getElementById("modelInstructions").value =
    saved.instructions || "";

  document.getElementById("cancelModal").onclick = closeModal;

  document.getElementById("saveModel").onclick = () => {
    localStorage.setItem(key, JSON.stringify({
      style: document.getElementById("modelStyle").value,
      instructions: document.getElementById("modelInstructions").value
    }));

    closeModal();
  };
}

// CONFIGURACIÓN GENERAL

document.getElementById("settingsBtn").onclick = () => {
  modalContent.innerHTML = `
    <h2>Configuración</h2>
    <div class="settings-list">
      <button id="configChatGPT">Configurar ChatGPT</button>
      <button id="configClaude">Configurar Claude</button>
      <button id="configGemini">Configurar Gemini</button>
    </div>
    <div class="modal-actions">
      <button id="cancelModal">Cerrar</button>
    </div>
  `;

  modal.classList.remove("hidden");

  document.getElementById("cancelModal").onclick = closeModal;

  modelNames.forEach(model => {
    document.getElementById("config" + model).onclick = () => {
      openModelSettings(model);
    };
  });
};

function closeModal() {
  modal.classList.add("hidden");
}

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

// HISTORIAL

function renderHistory() {
  historyList.innerHTML = "";

  if (chats.length === 0) {
    historyList.innerHTML =
      '<p class="muted">Todavía no hay conversaciones.</p>';
    return;
  }

  chats.forEach(chat => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = chat.title;

    button.onclick = () => {
      currentChatId = chat.id;
      currentMode = chat.mode;
      currentModel = chat.model;

      chatTitle.textContent = modeNames[chat.mode];
      updateSubtitle();
      renderMessages();

      sidebar.classList.remove("open");
      showChat();
    };

    historyList.appendChild(button);
  });
}

document.getElementById("historyBtn").onclick = () => {
  renderHistory();
  sidebar.classList.add("open");
};

document.getElementById("closeSidebar").onclick = () => {
  sidebar.classList.remove("open");
};

sidebar.addEventListener("click", event => {
  if (event.target === sidebar) {
    sidebar.classList.remove("open");
  }
});

document.getElementById("newChatBtn").onclick = () => {
  sidebar.classList.remove("open");
  showHome();
};

// VOLVER ATRÁS

document.getElementById("backBtn").onclick = () => {
  if (sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    return;
  }

  if (!chatPage.classList.contains("hidden")) {
    showHome();
    return;
  }

  sidebar.classList.add("open");
};

// ARCHIVOS

document.getElementById("attachBtn").onclick = () => {
  document.getElementById("fileInput").click();
};

document.getElementById("fileInput").addEventListener("change", event => {
  const files = Array.from(event.target.files);

  attachedFiles.push(...files);
  attachmentsBox.innerHTML = "";

  attachedFiles.forEach((file, index) => {
    const item = document.createElement("span");
    item.className = "attachment";
    item.textContent = "📎 " + file.name + " ×";

    item.onclick = () => {
      attachedFiles.splice(index, 1);
      updateAttachments();
    };

    attachmentsBox.appendChild(item);
  });

  event.target.value = "";
});

function updateAttachments() {
  attachmentsBox.innerHTML = "";

  attachedFiles.forEach((file, index) => {
    const item = document.createElement("span");
    item.className = "attachment";
    item.textContent = "📎 " + file.name + " ×";

    item.onclick = () => {
      attachedFiles.splice(index, 1);
      updateAttachments();
    };

    attachmentsBox.appendChild(item);
  });
}

// MICRÓFONO

document.getElementById("micBtn").onclick = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("El reconocimiento de voz no está disponible en este navegador.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "es-UY";
  recognition.interimResults = false;

  recognition.onresult = event => {
    const spokenText = event.results[0][0].transcript;
    messageInput.value +=
      (messageInput.value ? " " : "") + spokenText;
  };

  recognition.onerror = () => {
    alert("No se pudo reconocer el audio. Probá nuevamente.");
  };

  recognition.start();
};

// ENVIAR MENSAJES

document.getElementById("sendBtn").onclick = sendMessage;

messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 110) + "px";
});

// INICIO

renderHistory();
showHome();
