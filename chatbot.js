(function () {
  const HISTORY_KEY = 'mishah_chat_history';
  const WELCOME = "Hi! I'm here to help with questions about hiring a domestic helper, finding a placement, or anything else about Mishah. What can I help with?";

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveHistory(messages) {
    // keep it small
    const trimmed = messages.slice(-30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }

  function buildWidget() {
    const root = document.createElement('div');
    root.id = 'mishah-chat-root';
    root.innerHTML = `
      <button id="mishah-chat-toggle" aria-label="Open chat" aria-expanded="false">
        <span class="mishah-chat-toggle-icon">💬</span>
      </button>
      <div id="mishah-chat-panel" class="mishah-chat-panel" hidden>
        <div class="mishah-chat-header">
          <div>
            <div class="mishah-chat-title">Mishah Assistant</div>
            <div class="mishah-chat-subtitle">Usually replies in a few seconds</div>
          </div>
          <button id="mishah-chat-close" aria-label="Close chat">&times;</button>
        </div>
        <div id="mishah-chat-messages" class="mishah-chat-messages"></div>
        <form id="mishah-chat-form" class="mishah-chat-form">
          <input type="text" id="mishah-chat-input" placeholder="Type a message..." autocomplete="off" maxlength="1000">
          <button type="submit" class="mishah-chat-send" aria-label="Send">➤</button>
        </form>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderMessages(messages) {
    const box = document.getElementById('mishah-chat-messages');
    box.innerHTML = messages.map(m => `
      <div class="mishah-chat-bubble mishah-chat-bubble-${m.role}">${escapeHtml(m.content)}</div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  function showTyping(show) {
    let el = document.getElementById('mishah-chat-typing');
    const box = document.getElementById('mishah-chat-messages');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'mishah-chat-typing';
        el.className = 'mishah-chat-bubble mishah-chat-bubble-assistant mishah-chat-typing';
        el.innerHTML = '<span></span><span></span><span></span>';
        box.appendChild(el);
      }
      box.scrollTop = box.scrollHeight;
    } else if (el) {
      el.remove();
    }
  }

  async function sendMessage(messages, text) {
    messages.push({ role: 'user', content: text });
    renderMessages(messages);
    saveHistory(messages);
    showTyping(true);

    try {
      // API_BASE / apiFetch come from auth-client.js, loaded before this script.
      const data = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });
      showTyping(false);
      messages.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      showTyping(false);
      messages.push({ role: 'assistant', content: `Sorry, something went wrong: ${err.message}` });
    }
    renderMessages(messages);
    saveHistory(messages);
  }

  function init() {
    const root = buildWidget();
    const toggle = document.getElementById('mishah-chat-toggle');
    const panel = document.getElementById('mishah-chat-panel');
    const closeBtn = document.getElementById('mishah-chat-close');
    const form = document.getElementById('mishah-chat-form');
    const input = document.getElementById('mishah-chat-input');

    let messages = loadHistory();
    if (messages.length === 0) {
      messages = [{ role: 'assistant', content: WELCOME }];
      saveHistory(messages);
    }
    renderMessages(messages);

    function open() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('is-open');
      input.focus();
    }
    function close() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('is-open');
    }

    toggle.addEventListener('click', () => {
      panel.hidden ? open() : close();
    });
    closeBtn.addEventListener('click', close);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendMessage(messages, text);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
