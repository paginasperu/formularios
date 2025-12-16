import { CONFIG } from './config.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

let systemInstruction = "", conversationHistory = [], messageCount = 0, requestTimestamps = [], longWaitTimeoutId;
const userInput = document.getElementById('userInput'), sendBtn = document.getElementById('sendBtn'), chatContainer = document.getElementById('chat-container');
const chatInterface = document.getElementById('chat-interface'), feedbackDemoText = document.getElementById('feedback-demo-text'), WA_LINK = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}`;

function handleScroll() {
    const observer = new MutationObserver(() => { observer.disconnect(); chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); });
    observer.observe(chatContainer, { childList: true });
}

function updateDemoFeedback(count) {
    if (!CONFIG.SHOW_REMAINING_MESSAGES) return;
    const remaining = CONFIG.MAX_DEMO_MESSAGES - count;
    if (remaining <= 0) { feedbackDemoText.innerText = `🛑 Límite de ${CONFIG.MAX_DEMO_MESSAGES} mensajes alcanzado.`; feedbackDemoText.style.color = 'red'; }
    else if (remaining <= CONFIG.WARNING_THRESHOLD) { feedbackDemoText.innerText = `⚠️ Te quedan ${remaining} mensaje(s).`; feedbackDemoText.style.color = CONFIG.COLOR_PRIMARIO; }
}

function aplicarConfiguracionGlobal() {
    document.title = CONFIG.NOMBRE_EMPRESA;
    document.documentElement.style.setProperty('--chat-color', CONFIG.COLOR_PRIMARIO);
    const linkIcon = document.querySelector("link[rel*='icon']"), headerIcon = document.getElementById('header-icon-initials'), headerTitle = document.getElementById('header-title');
    if (linkIcon) linkIcon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.FAVICON_EMOJI}</text></svg>`;
    if (CONFIG.LOGO_URL && headerIcon) { headerIcon.innerHTML = `<img src="${CONFIG.LOGO_URL}" alt="${CONFIG.NOMBRE_EMPRESA}" class="w-full h-full object-contain rounded-full">`; }
    else if (headerIcon) { headerIcon.innerText = CONFIG.ICONO_HEADER; }
    headerTitle.innerText = CONFIG.NOMBRE_EMPRESA;
}

async function cargarYAnalizarContexto() {
    try {
        const res = await fetch('./prompt.txt');
        if (!res.ok) throw new Error();
        return await res.text();
    } catch (e) { return "Error de sistema."; }
}

function checkRateLimit() {
    const now = Date.now(), windowMs = CONFIG.RATE_LIMIT_WINDOW_SECONDS * 1000;
    requestTimestamps = requestTimestamps.filter(t => t > now - windowMs);
    if (requestTimestamps.length >= CONFIG.RATE_LIMIT_MAX_REQUESTS) return { limitReached: true, retryAfter: Math.ceil((requestTimestamps[0] + windowMs - now) / 1000) };
    requestTimestamps.push(now); return { limitReached: false };
}

function setupAccessGate() {
    const keySubmit = document.getElementById('keySubmit'), keyInput = document.getElementById('keyInput'), keyError = document.getElementById('keyError');
    keySubmit.style.backgroundColor = CONFIG.COLOR_PRIMARIO;
    keySubmit.onclick = async () => {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`);
        const text = await res.text(), json = JSON.parse(text.replace(/.*google.visualization.Query.setResponse\((.*)\);/s, '$1'));
        const row = json.table.rows[1]?.c || json.table.rows[0]?.c || [];
        if (keyInput.value.trim().toLowerCase() === String(row[0]?.v || "").trim().toLowerCase()) { 
            document.getElementById('access-gate').classList.add('hidden'); chatInterface.classList.remove('hidden'); cargarIA(); 
        } else { keyError.classList.remove('hidden'); }
    };
}

async function cargarIA() {
    systemInstruction = await cargarYAnalizarContexto();
    document.getElementById('bot-welcome-text').innerText = CONFIG.SALUDO_INICIAL;
    userInput.placeholder = CONFIG.PLACEHOLDER_INPUT;
    userInput.maxLength = CONFIG.MAX_LENGTH_INPUT;
    toggleInput(true); updateDemoFeedback(0);
    sendBtn.onclick = procesarMensaje;
    userInput.onkeydown = (e) => { if (e.key === 'Enter') procesarMensaje(); };
}

async function procesarMensaje() {
    const text = userInput.value.trim();
    if (messageCount >= CONFIG.MAX_DEMO_MESSAGES || text.length < CONFIG.MIN_LENGTH_INPUT) return;
    const limit = checkRateLimit();
    if (limit.limitReached) { agregarBurbuja(`⚠️ Espera ${limit.retryAfter}s.`, 'bot'); return; }

    agregarBurbuja(text, 'user'); conversationHistory.push({ role: "user", content: text });
    userInput.value = ''; toggleInput(false);
    const loadingId = mostrarLoading();

    try {
        const respuesta = await llamarIA(loadingId);
        clearTimeout(longWaitTimeoutId); document.getElementById(loadingId)?.remove();
        conversationHistory.push({ role: "assistant", content: respuesta });
        const clean = respuesta.replace('[whatsapp]', 'Comunícate por WhatsApp.');
        const btn = respuesta.includes('[whatsapp]') ? `<a href="${WA_LINK}?text=Ayuda: ${text}" target="_blank" class="chat-btn">Contáctanos</a>` : "";
        agregarBurbuja(marked.parse(clean) + btn, 'bot');
        messageCount++; updateDemoFeedback(messageCount);
    } catch (e) {
        clearTimeout(longWaitTimeoutId); document.getElementById(loadingId)?.remove();
        agregarBurbuja(marked.parse(`Error de conexión.`) + `<a href="${WA_LINK}" class="chat-btn">WhatsApp</a>`, 'bot');
    } finally { toggleInput(messageCount < CONFIG.MAX_DEMO_MESSAGES); if (messageCount < CONFIG.MAX_DEMO_MESSAGES) userInput.focus(); }
}

async function llamarIA(loadingId) {
    let delay = CONFIG.RETRY_DELAY_MS;
    const messages = [{ role: "system", content: systemInstruction }, ...conversationHistory.slice(-CONFIG.MAX_HISTORIAL_MESSAGES)];
    for (let i = 0; i < CONFIG.RETRY_LIMIT; i++) {
        try {
            const ctrl = new AbortController(), tId = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
            const res = await fetch(CONFIG.URL_PROXY, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: CONFIG.MODELO, messages, temperature: CONFIG.TEMPERATURA, top_p: CONFIG.TOP_P, frequency_penalty: CONFIG.FREQUENCY_PENALTY, presence_penalty: CONFIG.PRESENCE_PENALTY, max_tokens: CONFIG.MAX_TOKENS_RESPONSE })
            });
            clearTimeout(tId); if (!res.ok) throw new Error();
            const data = await res.json(); return data.choices[0].message.content;
        } catch (err) {
            if (i === CONFIG.RETRY_LIMIT - 1) throw err;
            if (i > 0) {
                const el = document.getElementById(loadingId);
                if (el) el.innerHTML = `<span style="color:#d97706">Reintentando... ${Math.round(delay/1000)}s</span>`;
                await new Promise(r => setTimeout(r, delay)); delay *= 2;
                if (el) el.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div>`;
            }
        }
    }
}

function toggleInput(s) { userInput.disabled = !s; sendBtn.disabled = !s; }
function agregarBurbuja(h, t) {
    const d = document.createElement('div');
    d.className = t === 'user' ? "p-3 max-w-[85%] text-sm text-white rounded-2xl self-end ml-auto" : "p-3 max-w-[85%] text-sm bg-white border rounded-2xl self-start bot-bubble";
    if (t === 'user') d.style.backgroundColor = CONFIG.COLOR_PRIMARIO;
    d.innerHTML = t === 'user' ? h : h; // marked ya viene parseado
    if (t === 'user') d.textContent = h; else d.innerHTML = h;
    chatContainer.appendChild(d); handleScroll();
}

function mostrarLoading() {
    const id = 'load-' + Date.now(), d = document.createElement('div');
    d.id = id; d.className = "p-3 max-w-[85%] bg-white border rounded-2xl self-start flex gap-1";
    d.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div>`;
    chatContainer.appendChild(d); handleScroll();
    longWaitTimeoutId = setTimeout(() => { const el = document.getElementById(id); if (el) el.innerHTML = `<span style="color:#d97706">⚠️ Alta demanda, espera un momento...</span>`; }, 10000);
    return id;
}

window.onload = () => { aplicarConfiguracionGlobal(); if (CONFIG.SHEET_ID) setupAccessGate(); else { chatInterface.classList.remove('hidden'); cargarIA(); } };
