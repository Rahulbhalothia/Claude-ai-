// ---------- State ----------
let conversations = JSON.parse(localStorage.getItem("cc_conversations") || "[]");
let activeId = null;

const chatScroll = document.getElementById("chatScroll");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const promptInput = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const chatHistoryList = document.getElementById("chatHistoryList");
const sidebar = document.getElementById("sidebar");

marked.setOptions({ breaks: true });

// ---------- Init ----------
function init() {
  if (conversations.length === 0) {
    createNewConversation();
  } else {
    activeId = conversations[0].id;
  }
  renderHistoryList();
  renderConversation();
}

function createNewConversation() {
  const conv = { id: Date.now().toString(), title: "New chat", messages: [] };
  conversations.unshift(conv);
  activeId = conv.id;
  saveConversations();
}

function saveConversations() {
  localStorage.setItem("cc_conversations", JSON.stringify(conversations));
}

function getActiveConv() {
  return conversations.find((c) => c.id === activeId);
}

// ---------- Rendering ----------
function renderHistoryList() {
  chatHistoryList.innerHTML = "";
  conversations.forEach((conv) => {
    const div = document.createElement("div");
    div.className = "history-item" + (conv.id === activeId ? " active" : "");
    div.textContent = conv.title;
    div.onclick = () => {
      activeId = conv.id;
      renderHistoryList();
      renderConversation();
    };
    chatHistoryList.appendChild(div);
  });
}

function renderConversation() {
  const conv = getActiveConv();
  messagesEl.innerHTML = "";
  if (!conv || conv.messages.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
    conv.messages.forEach((m) => appendMessageToDOM(m.role, m.content));
  }
  chatScroll.scrollTop = chatScroll.scrollHeight;
}

function appendMessageToDOM(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    wrap.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (role === "assistant") {
    bubble.innerHTML = marked.parse(content || "");
  } else {
    bubble.textContent = content;
  }
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return bubble;
}

// ---------- Sending ----------
async function sendMessage() {
  const text = promptInput.value.trim();
  if (!text) return;

  const conv = getActiveConv();
  emptyState.style.display = "none";

  conv.messages.push({ role: "user", content: text });
  if (conv.messages.length === 1) {
    conv.title = text.slice(0, 40);
    renderHistoryList();
  }
  appendMessageToDOM("user", text);
  saveConversations();

  promptInput.value = "";
  autoResize();
  sendBtn.disabled = true;

  const assistantBubble = appendMessageToDOM("assistant", "");
  assistantBubble.classList.add("cursor-blink");
  let fullText = "";

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: conv.messages.map((m) => ({ role: m.role, content: m.content })),
        system: "You are a helpful, friendly AI assistant similar to Claude.",
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Server error: " + resp.status);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.startsWith("data:")) continue;
        const raw = part.slice(5).trim();
        if (raw === "[DONE]") continue;
        try {
          const json = JSON.parse(raw);
          if (json.error) {
            fullText += `\n\n**Error:** ${json.error}`;
          } else if (json.text) {
            fullText += json.text;
          }
          assistantBubble.innerHTML = marked.parse(fullText);
          chatScroll.scrollTop = chatScroll.scrollHeight;
        } catch (e) { /* ignore parse errors on partial chunks */ }
      }
    }
  } catch (err) {
    fullText = `**Error:** Could not reach server. ${err.message}`;
    assistantBubble.innerHTML = marked.parse(fullText);
  }

  assistantBubble.classList.remove("cursor-blink");
  conv.messages.push({ role: "assistant", content: fullText });
  saveConversations();

  document.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));

  sendBtn.disabled = false;
}

// ---------- Events ----------
sendBtn.addEventListener("click", sendMessage);

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

promptInput.addEventListener("input", autoResize);
function autoResize() {
  promptInput.style.height = "auto";
  promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + "px";
}

document.getElementById("newChatBtn").addEventListener("click", () => {
  createNewConversation();
  renderHistoryList();
  renderConversation();
});

document.getElementById("hamburgerBtn").addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

init();
