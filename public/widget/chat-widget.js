/**
 * IS ChatBot — Branded Embeddable Widget
 *
 * Usage (paste on any website):
 * <script src="https://YOUR-VERCEL-APP.vercel.app/widget/chat-widget.js"
 *   data-api-key="isk_your_key_here"
 *   data-api-url="https://YOUR-BACKEND.railway.app">
 * </script>
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-api-key]');
  const API_KEY = (script && script.dataset.apiKey) || '';
  const API_URL = (script && script.dataset.apiUrl) || 'http://localhost:8000';

  if (!API_KEY) { console.warn('[IS ChatBot] No data-api-key set.'); return; }

  // ── Inject CSS with CSS variables ───────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #isc-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #isc-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--isc-primary, #2563eb); color: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #isc-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.45); }
    #isc-bubble svg { width: 26px; height: 26px; }
    #isc-panel {
      position: fixed; bottom: 94px; right: 24px; z-index: 9998;
      width: 370px; height: 560px; max-height: calc(100vh - 110px);
      background: #111827; border-radius: 18px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.55);
      display: flex; flex-direction: column;
      transition: opacity 0.2s, transform 0.2s;
    }
    #isc-panel.isc-hidden { opacity: 0; pointer-events: none; transform: translateY(14px) scale(0.97); }
    #isc-header {
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      background: var(--isc-primary, #2563eb);
    }
    #isc-logo { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: #fff; flex-shrink: 0; overflow: hidden; }
    #isc-logo img { width: 100%; height: 100%; object-fit: cover; }
    #isc-header-info { flex: 1; }
    #isc-bot-name { color: #fff; font-weight: 700; font-size: 14px; line-height: 1.2; }
    #isc-company { color: rgba(255,255,255,0.75); font-size: 11px; }
    #isc-close { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 22px; line-height: 1; padding: 2px 6px; border-radius: 6px; }
    #isc-close:hover { background: rgba(255,255,255,0.15); }
    #isc-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; scrollbar-color: #374151 transparent; }
    #isc-messages::-webkit-scrollbar { width: 4px; }
    #isc-messages::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    .isc-msg { max-width: 84%; font-size: 13px; line-height: 1.55; padding: 9px 13px; border-radius: 16px; }
    .isc-msg.isc-user { align-self: flex-end; background: var(--isc-primary, #2563eb); color: #fff; border-bottom-right-radius: 4px; }
    .isc-msg.isc-bot { align-self: flex-start; background: #1f2937; color: #e5e7eb; border-bottom-left-radius: 4px; }
    .isc-msg.isc-typing { color: #6b7280; font-style: italic; }
    .isc-cursor { display: inline-block; width: 2px; height: 14px; background: var(--isc-primary, #2563eb); margin-left: 2px; border-radius: 1px; animation: isc-blink 0.8s infinite; vertical-align: middle; }
    @keyframes isc-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .isc-sources { margin-top: 6px; padding-top: 6px; border-top: 1px solid #374151; font-size: 11px; color: #6b7280; }
    #isc-footer { padding: 10px 12px; border-top: 1px solid #1f2937; display: flex; gap: 8px; flex-shrink: 0; }
    #isc-input { flex: 1; padding: 9px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; color: #f9fafb; font-size: 13px; outline: none; }
    #isc-input:focus { border-color: var(--isc-primary, #2563eb); }
    #isc-send { padding: 9px 14px; background: var(--isc-primary, #2563eb); color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; transition: opacity 0.15s; }
    #isc-send:hover { opacity: 0.88; }
    #isc-send:disabled { opacity: 0.4; cursor: default; }
    #isc-powered { text-align: center; font-size: 10px; color: #4b5563; padding: 4px 0 8px; flex-shrink: 0; }
    #isc-powered a { color: #6b7280; text-decoration: none; }
    @media (max-width: 480px) { #isc-panel { width: calc(100vw - 16px); right: 8px; } }
  `;
  document.head.appendChild(style);

  // ── Build DOM ────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'isc-widget';

  const bubble = document.createElement('button');
  bubble.id = 'isc-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`;

  const panel = document.createElement('div');
  panel.id = 'isc-panel';
  panel.className = 'isc-hidden';
  panel.innerHTML = `
    <div id="isc-header">
      <div id="isc-logo"><span id="isc-logo-letter">?</span></div>
      <div id="isc-header-info">
        <div id="isc-bot-name">Loading...</div>
        <div id="isc-company"></div>
      </div>
      <button id="isc-close" aria-label="Close">&times;</button>
    </div>
    <div id="isc-messages"></div>
    <div id="isc-footer">
      <input id="isc-input" type="text" placeholder="Ask about insurance..." autocomplete="off" />
      <button id="isc-send">Send</button>
    </div>
    <div id="isc-powered">Powered by <a href="#" target="_blank">IS ChatBot</a></div>
  `;

  wrap.appendChild(panel);
  wrap.appendChild(bubble);
  document.body.appendChild(wrap);

  // ── State ────────────────────────────────────────────────────────────────────
  let sessionId = null;
  let sending = false;
  let config = { bot_name: 'InsurBot', company_name: '', primary_color: '#2563eb', secondary_color: '#1e40af', welcome_message: 'Hello! How can I help you today?', logo_url: null };

  const msgs = document.getElementById('isc-messages');
  const input = document.getElementById('isc-input');
  const sendBtn = document.getElementById('isc-send');

  // ── Load branding ─────────────────────────────────────────────────────────
  async function loadConfig() {
    try {
      const res = await fetch(`${API_URL}/widget/config?key=${encodeURIComponent(API_KEY)}`);
      if (!res.ok) return;
      config = await res.json();
    } catch (_) {}
    applyBranding();
  }

  function applyBranding() {
    const root = document.documentElement;
    root.style.setProperty('--isc-primary', config.primary_color);
    root.style.setProperty('--isc-secondary', config.secondary_color);

    document.getElementById('isc-bot-name').textContent = config.bot_name;
    document.getElementById('isc-company').textContent = config.company_name || '';

    const logoEl = document.getElementById('isc-logo');
    if (config.logo_url) {
      logoEl.innerHTML = `<img src="${config.logo_url}" alt="" onerror="this.style.display='none'">`;
    } else {
      const letter = (config.company_name || config.bot_name || 'I').charAt(0).toUpperCase();
      logoEl.innerHTML = `<span id="isc-logo-letter">${letter}</span>`;
    }

    // Update bubble color too
    bubble.style.background = config.primary_color;

    // Show welcome message
    if (msgs.children.length === 0) {
      addMsg('bot', config.welcome_message);
    }
  }

  // ── Message helpers ────────────────────────────────────────────────────────
  function addMsg(role, text, streaming) {
    const div = document.createElement('div');
    div.className = `isc-msg isc-${role}${streaming ? ' isc-typing' : ''}`;
    if (streaming) {
      div.innerHTML = '<span class="isc-text"></span><span class="isc-cursor"></span>';
    } else {
      div.textContent = text || '';
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function appendToken(div, token) {
    const textEl = div.querySelector('.isc-text');
    if (textEl) textEl.textContent += token;
    msgs.scrollTop = msgs.scrollHeight;
  }

  function finalizeMsg(div, sources) {
    const cursor = div.querySelector('.isc-cursor');
    if (cursor) cursor.remove();
    div.classList.remove('isc-typing');
    if (sources && sources.length) {
      const src = document.createElement('div');
      src.className = 'isc-sources';
      src.textContent = 'Sources: ' + sources.join(', ');
      div.appendChild(src);
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || sending) return;
    input.value = '';
    sending = true;
    sendBtn.disabled = true;

    addMsg('user', text);
    const botDiv = addMsg('bot', '', true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ message: text, session_id: sessionId, stream: true }),
      });
      if (!res.ok) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'session') sessionId = d.session_id;
            else if (d.type === 'token') appendToken(botDiv, d.content);
            else if (d.type === 'sources') sources = d.sources;
          } catch (_) {}
        }
        msgs.scrollTop = msgs.scrollHeight;
      }
      finalizeMsg(botDiv, sources);
    } catch (err) {
      const textEl = botDiv.querySelector('.isc-text');
      if (textEl) textEl.textContent = 'Sorry, something went wrong. Please try again.';
      finalizeMsg(botDiv, []);
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  bubble.addEventListener('click', () => {
    panel.classList.toggle('isc-hidden');
    if (!panel.classList.contains('isc-hidden')) {
      input.focus();
      if (msgs.children.length === 0) applyBranding();
    }
  });
  document.getElementById('isc-close').addEventListener('click', () => panel.classList.add('isc-hidden'));
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

  // ── Init ───────────────────────────────────────────────────────────────────
  loadConfig();
})();
