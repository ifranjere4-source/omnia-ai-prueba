
const $ = id => document.getElementById(id);

const homePage = $("homePage");
const chatPage = $("chatPage");
const composer = $("composer");
const messagesBox = $("messages");
const input = $("messageInput");

const modelNames = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  supreme: "OMNIA SUPREMO"
};

let selectedModel = "chatgpt";
let currentMode = null;
let currentChat = null;

let chats = [];

try {
  chats = JSON.parse(localStorage.getItem("omnia_chats") || "[]");
  if (!Array.isArray(chats)) chats = [];
} catch {
  chats = [];
}

let instructions =
  localStorage.getItem("omnia_instructions") || "";

$("instructions").value = instructions;

function saveChats() {
  localStorage.setItem("omnia_chats", JSON.stringify(chats));
}

function showHome() {
  homePage.style.display = "block";
  chatPage.style.display = "none";
  composer.style.display = "none";
  currentChat = null;
  currentMode = null;
}

function createChat(mode) {
  const chat = {
    id: Date.now(),
    title: "Nueva conversación",
    mode,
    messages: []
  };

  chats.unshift(chat);
  currentChat = chat;
  currentMode = mode;

  saveChats();

  const titles = {
    individual: "Chat individual",
    triple: "Triple Chat",
    room: "Sala de IA",
    supreme: "OMNIA Supremo"
  };

  $("chatTitle").textContent = titles[mode];

  messagesBox.innerHTML = "";
  homePage.style.display = "none";
  chatPage.style.display = "block";
  composer.style.display = "flex";

  $("status").textContent = "";

  renderHistory();
}

function openChat(id) {
  const chat = chats.find(c => c.id === id);
  if (!chat) return;

  currentChat = chat;
  currentMode = chat.mode;

  homePage.style.display = "none";
  chatPage.style.display = "block";
  composer.style.display = "flex";

  $("chatTitle").textContent = chat.title;
  messagesBox.innerHTML = "";

  chat.messages.forEach(message => {
    if (message.role === "user") {
      addBubble("Vos", message.content, "user");
    } else {
      addBubble(
        modelNames[message.model] || message.model,
        message.content,
        "ai"
      );
    }
  });

  $("sidebar").style.display = "none";
}

function addBubble(sender, content, type) {
  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;

  const label = document.createElement("span");
  label.className = "sender";
  label.textContent = sender;

  const text = document.createElement("div");
  text.textContent = content;

  bubble.append(label, text);
  messagesBox.appendChild(bubble);

  window.scrollTo(0, document.body.scrollHeight);
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";

  chats.forEach(chat => {
    const row = document.createElement("div");
    row.className = "sideItem";

    const title = document.createElement("span");
    title.className = "sideTitle";
    title.textContent = chat.title;

    title.onclick = () => openChat(chat.id);

    const actions = document.createElement("div");
    actions.className = "sideActions";

    const rename = document.createElement("button");
    rename.textContent = "✎";
    rename.title = "Cambiar nombre";

    rename.onclick = () => {
      const name = prompt("Nuevo nombre:", chat.title);

      if (name && name.trim()) {
        chat.title = name.trim();
        saveChats();
        renderHistory();

        if (currentChat && currentChat.id === chat.id) {
          $("chatTitle").textContent = chat.title;
        }
      }
    };

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.title = "Eliminar conversación";

    remove.onclick = () => {
      if (!confirm("¿Eliminar esta conversación?")) return;

      chats = chats.filter(c => c.id !== chat.id);

      if (currentChat && currentChat.id === chat.id) {
        showHome();
      }

      saveChats();
      renderHistory();
    };

    actions.append(rename, remove);
    row.append(title, actions);
    list.appendChild(row);
  });
}

function simulatedAnswer(model, text) {
  const custom = instructions
    ? `\n\nInstrucciones configuradas: ${instructions}`
    : "";

  const responses = {
    chatgpt:
      `Esta es una respuesta de demostración de ChatGPT.\n\nTu mensaje fue: "${text}"${custom}`,

    claude:
      `Esta es una respuesta de demostración de Claude.\n\nEstoy analizando tu mensaje: "${text}"${custom}`,

    gemini:
      `Esta es una respuesta de demostración de Gemini.\n\nSobre lo que escribiste: "${text}"${custom}`
  };

  return responses[model];
}

async function sendMessage() {
  const content = input.value.trim();

  if (!content || !currentChat) return;

  input.value = "";

  currentChat.messages.push({
    role: "user",
    content
  });

  addBubble("Vos", content, "user");

  if (currentChat.title === "Nueva conversación") {
    currentChat.title = content.slice(0, 35);
    $("chatTitle").textContent = currentChat.title;
  }

  saveChats();
  renderHistory();

  $("status").textContent = "OMNIA está pensando...";

  await new Promise(resolve => setTimeout(resolve, 500));

  let results = [];

  if (currentMode === "individual") {
    results.push({
      model: selectedModel,
      answer: simulatedAnswer(selectedModel, content)
    });
  }

  if (currentMode === "triple" || currentMode === "room") {
    results = ["chatgpt", "claude", "gemini"].map(model => ({
      model,
      answer: simulatedAnswer(model, content)
    }));
  }

  if (currentMode === "supreme") {
    results.push({
      model: "supreme",
      answer:
        "Esta sería la respuesta unificada de las tres IA.\n\n" +
        simulatedAnswer("chatgpt", content) +
        "\n\n" +
        simulatedAnswer("claude", content) +
        "\n\n" +
        simulatedAnswer("gemini", content)
    });
  }

  results.forEach(result => {
    currentChat.messages.push({
      role: "assistant",
      model: result.model,
      content: result.answer
    });

    addBubble(
      modelNames[result.model],
      result.answer,
      "ai"
    );
  });

  saveChats();
  renderHistory();

  $("status").textContent = "";
}

document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    createChat(button.dataset.mode);
  });
});

document.querySelectorAll("[data-model]").forEach(button => {
  button.addEventListener("click", () => {
    selectedModel = button.dataset.model;

    document.querySelectorAll("[data-model]").forEach(b => {
      b.classList.toggle("active", b === button);
    });
  });
});

$("sendBtn").addEventListener("click", sendMessage);

input.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

$("historyBtn").onclick = () => {
  renderHistory();
  $("sidebar").style.display = "block";
};

$("closeHistory").onclick = () => {
  $("sidebar").style.display = "none";
};

$("newChatBtn").onclick = () => {
  $("sidebar").style.display = "none";
  showHome();
};

$("settingsBtn").onclick = () => {
  $("settings").style.display = "block";
};

$("closeSettings").onclick = () => {
  $("settings").style.display = "none";
};

$("saveSettings").onclick = () => {
  instructions = $("instructions").value.trim();

  localStorage.setItem(
    "omnia_instructions",
    instructions
  );

  $("settings").style.display = "none";
};

$("backBtn").onclick = () => {
  if ($("settings").style.display === "block") {
    $("settings").style.display = "none";
    return;
  }

  if ($("sidebar").style.display === "block") {
    $("sidebar").style.display = "none";
    return;
  }

  if (chatPage.style.display === "block") {
    showHome();
    return;
  }

  renderHistory();
  $("sidebar").style.display = "block";
};

// Abrir historial deslizando hacia la derecha.
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", event => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", event => {
  const endX = event.changedTouches[0].clientX;
  const endY = event.changedTouches[0].clientY;

  const differenceX = endX - touchStartX;
  const differenceY = Math.abs(endY - touchStartY);

  if (
    differenceX > 90 &&
    differenceY < 80 &&
    touchStartX < 45 &&
    $("settings").style.display !== "block"
  ) {
    renderHistory();
    $("sidebar").style.display = "block";
  }
}, { passive: true });

renderHistory();
