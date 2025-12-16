import { CONFIG } from './config.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// --- Estado Global ---
let systemInstruction = "", conversationHistory = [], messageCount = 0, requestTimestamps = [], longWaitTimeoutId; 
const userInput = document.getElementById('userInput'), sendBtn = document.getElementById('sendBtn'), chatContainer = document.getElementById('chat-container');
const chatInterface = document.getElementById('chat-interface'), feedbackDemoText = document.getElementById('feedback-demo-text'), WA_LINK = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}`;

// --- Gestión de Interfaz (Adaptación de Alertas) ---
function handleScroll() {
    const observer = new MutationObserver(() => { observer.disconnect(); chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); });
    observer.observe(chatContainer, { childList: true });
}

function updateDemoFeedback(count) {
    if (!CONFIG.SHOW_REMAINING_MESSAGES || !feedbackDemoText) return;
    const remaining = CONFIG.MAX_DEMO_MESSAGES - count;

    if (remaining <= 0) {
        feedbackDemoText.innerText = `🛑 Límite de ${CONFIG.MAX_DEMO_MESSAGES} mensajes alcanzado. Contáctanos para continuar.`;
        feedbackDemoText.style.color = 'red';
        feedbackDemoText.style.fontWeight = 'bold';
    } else if (remaining <= CONFIG.WARNING_THRESHOLD) {
        feedbackDemoText.innerText = `⚠️ Atención: Te quedan ${remaining} mensaje(s) de demostración.`;
        feedbackDemoText.style.color = CONFIG.COLOR_PRIMARIO;
    }
}

function aplicarConfiguracionGlobal() {
    document.title = CONFIG.NOMBRE_EMPRESA;
    document.documentElement.style.setProperty('--chat-color', CONFIG.COLOR_PRIMARIO);
    const headerIcon = document.getElementById('header-icon-initials');
    if (CONFIG.LOGO_URL && headerIcon) {
        headerIcon.innerHTML = `<img src="${CONFIG.LOGO_URL}" alt="${CONFIG.NOMBRE_EMPRESA}" class="w-full h-full object-contain rounded-full">`;
    } else if (headerIcon) { headerIcon.innerText = CONFIG.ICONO_HEADER; }
    document.getElementById('header-title').innerText = CONFIG.NOMBRE_EMPRESA;
    
    const linkIcon = document.querySelector("link[rel*='icon']");
    if (linkIcon) {
        linkIcon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.FAVICON_EMOJI}</text></svg>`;
    }
}

// --- Seguridad y Acceso ---
function setupAccessGate() {
    const keySubmit = document.getElementById('keySubmit'), keyInput = document.getElementById('keyInput'), keyError = document.getElementById('keyError');
    keySubmit.style.backgroundColor = CONFIG.COLOR_PRIMARIO;
    keyInput.setAttribute('autocomplete', 'one-time-code'); 
    keyInput.setAttribute('name', 'access_token_' + Math.random().toString(36).substring(7));

    const validarAcceso = async () => {
        const inputKey = keyInput.value.trim(); 
        if (!inputKey) { keyError.innerText = "Ingresa una clave."; keyError.classList.remove('hidden'); return; }
        try {
            const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`);
            const text = await res.text(), json = JSON.parse(text.replace(/.*google.visualization.Query.setResponse\((.*)\);/s, '$1'));
            const row = json.table.rows[1]?.c || json.table.rows[0]?.c || [];
            const realKey = String(row[0]?.v || "").trim(), expRaw = row[1]?.f || row[1]?.v || "";
            if (expRaw) {
                const p = expRaw.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
                if (p && (new Date() > new Date(p[3], p[2]-1, p[1], p[4], p[5], p[6]))) {
                    keyError.innerText = "Clave caducada."; keyError.classList.remove('hidden'); return;
                }
            }
            if (inputKey === realKey) {
                document.getElementById('access-gate').classList.add('hidden');
                chatInterface.classList.remove('hidden'); cargarIA();
            } else { keyError.innerText = "Clave incorrecta."; keyError.classList.remove('hidden'); }
        } catch (e) { keyError.innerText = "Error de conexión."; keyError.classList.remove('hidden'); }
    };
    keySubmit.onclick = validarAcceso;
    keyInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); validarAcceso(); } };
}

// --- Lógica de IA ---
async function cargarIA() {
    try {
        const res = await fetch('./prompt.txt');
        systemInstruction = res.ok ? await res.text() : "";
        document.getElementById('bot-welcome-text').innerText = CONFIG.SALUDO_INICIAL;
        userInput.setAttribute('autocomplete', 'off');
        userInput.setAttribute('name', 'chat_query_' + Date.now());
        userInput.placeholder = CONFIG.PLACEHOLDER_INPUT;
        userInput.maxLength = CONFIG.MAX_LENGTH_INPUT;
        toggleInput(true); updateDemoFeedback(0);
        sendBtn.onclick = procesarMensaje;
        userInput.onkeydown = (e) => { if (e.key === 'Enter') procesarMensaje(); };
    } catch (e) { console.error("Error inicializando IA"); }
}

async function procesarMensaje() {
    const text = userInput.value.trim();
    
    // BLOQUEO BASE (Muro): Si ya llegó al límite, no procesamos nada
    if (messageCount >= CONFIG.MAX_DEMO_MESSAGES) {
        updateDemoFeedback(messageCount);
        toggleInput(false);
        userInput.value = '';
        return;
    }

    if (text.length < CONFIG.MIN_LENGTH_INPUT) return;

    // Rate Limit
    const now = Date.now(), windowMs = CONFIG.RATE_LIMIT_WINDOW_SECONDS * 1000;
    requestTimestamps = requestTimestamps.filter(t => t > now - windowMs);
    if (requestTimestamps.length >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        agregarBurbuja(`⚠️ Espera ${Math.ceil((requestTimestamps[0] + windowMs - now) / 1000)}s.`, 'bot');
        return;
    }
    requestTimestamps.push(now);

    agregarBurbuja(text, 'user');
    conversationHistory.push({ role: "user", content: text });
    userInput.value = ''; toggleInput(false);
    const loadingId = mostrarLoading();

    try {
        const respuesta = await llamarIA(loadingId);
        clearTimeout(longWaitTimeoutId);
        document.getElementById(loadingId)?.remove();
        
        conversationHistory.push({ role: "assistant", content: respuesta });
        const clean = respuesta.replace('[whatsapp]', 'Escríbenos por WhatsApp.');
        const btn = respuesta.includes('[whatsapp]') ? `<a href="${WA_LINK}?text=Ayuda: ${encodeURIComponent(text)}" target="_blank" class="chat-btn">WhatsApp</a>` : "";
        
        agregarBurbuja(marked.parse(clean) + btn, 'bot');
        messageCount++;
        updateDemoFeedback(messageCount);
    } catch (e) {
        clearTimeout(longWaitTimeoutId);
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();
        
        // FILTRADO DE ERROR: Solo mostramos error de red si es un problema real y no de límite
        if (messageCount < CONFIG.MAX_DEMO_MESSAGES) {
            agregarBurbuja(marked.parse("¡Ups! Hubo un problema de conexión."), 'bot');
        }
    } finally {
        const active = messageCount < CONFIG.MAX_DEMO_MESSAGES;
        toggleInput(active);
        if (active) userInput.focus();
    }
}

async function llamarIA(loadingId) {
    let delay = CONFIG.RETRY_DELAY_MS;
    const messages = [{ role: "system", content: systemInstruction }, ...conversationHistory.slice(-CONFIG.MAX_HISTORIAL_MESSAGES)];
    for (let i = 0; i <= CONFIG.RETRY_LIMIT; i++) {
        try {
            const ctrl = new AbortController(), tId = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
            const res = await fetch(CONFIG.URL_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: CONFIG.MODELO, messages, temperature: CONFIG.TEMPERATURA,
                    top_p: CONFIG.TOP_P, frequency_penalty: CONFIG.FREQUENCY_PENALTY,
                    presence_penalty: CONFIG.PRESENCE_PENALTY, max_tokens: CONFIG.MAX_TOKENS_RESPONSE
                }),
                signal: ctrl.signal
            });
            clearTimeout(tId); if (!res.ok) throw new Error();
            const data = await res.json(); return data.choices[0].message.content;
        } catch (err) {
            if (i === CONFIG.RETRY_LIMIT) throw err;
            if (i >= 0) {
                const el = document.getElementById(loadingId);
                if (i > 0 && el) { 
                    el.innerHTML = `<span style="color:#d97706">Reintentando... ${Math.round(delay/1000)}s</span>`;
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                    if (el) el.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div>`;
                }
            }
        }
    }
}

function toggleInput(s) { userInput.disabled = !s; sendBtn.disabled = !s; }

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    div.className = tipo === 'user' ? "p-3 max-w-[85%] text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto shadow-sm" : "p-3 max-w-[85%] text-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start bot-bubble shadow-sm";
    if (tipo === 'user') { div.style.backgroundColor = CONFIG.COLOR_PRIMARIO; div.textContent = html; }
    else { div.innerHTML = html; }
    chatContainer.appendChild(div); handleScroll();
}

function mostrarLoading() {
    const id = 'load-' + Date.now(), div = document.createElement('div');
    div.id = id; div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1 shadow-sm";
    div.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>`;
    chatContainer.appendChild(div); handleScroll();
    longWaitTimeoutId = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<span style="color:#d97706; font-weight: 500;">⚠️ Alta demanda, procesando...</span>`;
    }, 10000);
    return id;
}

window.onload = () => {
    aplicarConfiguracionGlobal();
    if (CONFIG.SHEET_ID) setupAccessGate();
    else { document.getElementById('access-gate').classList.add('hidden'); chatInterface.classList.remove('hidden'); cargarIA(); }
};
