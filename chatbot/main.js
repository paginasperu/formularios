import { CONFIG } from './config.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// --- Variables de Estado y Referencias al DOM ---
let systemInstruction = "";
let conversationHistory = [];
let messageCount = 0;
let requestTimestamps = [];
let longWaitTimeoutId; 

const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chat-container');
const chatInterface = document.getElementById('chat-interface');
const feedbackDemoText = document.getElementById('feedback-demo-text');
const WA_LINK = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}`;

// --- Gestión de Interfaz y Scroll ---
function handleScroll() {
    const observer = new MutationObserver(() => {
        observer.disconnect();
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    });
    observer.observe(chatContainer, { childList: true });
}

function updateDemoFeedback(count) {
    if (!CONFIG.SHOW_REMAINING_MESSAGES) return;

    const remaining = CONFIG.MAX_DEMO_MESSAGES - count;
    if (remaining <= 0) {
        feedbackDemoText.innerText = `🛑 Límite de ${CONFIG.MAX_DEMO_MESSAGES} mensajes alcanzado.`;
        feedbackDemoText.style.color = 'red';
    } else if (remaining <= CONFIG.WARNING_THRESHOLD) {
        feedbackDemoText.innerText = `⚠️ Te quedan ${remaining} mensaje(s).`;
        feedbackDemoText.style.color = CONFIG.COLOR_PRIMARIO;
    }
}

// --- Configuración Inicial del Sistema ---
function aplicarConfiguracionGlobal() {
    document.title = CONFIG.NOMBRE_EMPRESA;
    document.documentElement.style.setProperty('--chat-color', CONFIG.COLOR_PRIMARIO);

    const linkIcon = document.querySelector("link[rel*='icon']");
    if (linkIcon) {
        linkIcon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.FAVICON_EMOJI}</text></svg>`;
    }

    const headerIcon = document.getElementById('header-icon-initials');
    if (CONFIG.LOGO_URL && headerIcon) {
        headerIcon.innerHTML = `<img src="${CONFIG.LOGO_URL}" alt="${CONFIG.NOMBRE_EMPRESA}" class="w-full h-full object-contain rounded-full">`;
    } else if (headerIcon) {
        headerIcon.innerText = CONFIG.ICONO_HEADER;
    }

    const headerTitle = document.getElementById('header-title');
    headerTitle.innerText = CONFIG.NOMBRE_EMPRESA;
}

async function cargarYAnalizarContexto() {
    try {
        const res = await fetch('./prompt.txt');
        if (!res.ok) throw new Error("No se pudo cargar prompt.txt");
        return await res.text();
    } catch (e) {
        console.error(e);
        return "Error de sistema. Contacte a soporte.";
    }
}

// --- Seguridad y Control de Acceso ---
function checkRateLimit() {
    const now = Date.now();
    const windowMs = CONFIG.RATE_LIMIT_WINDOW_SECONDS * 1000;
    requestTimestamps = requestTimestamps.filter(t => t > now - windowMs);

    if (requestTimestamps.length >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        return { 
            limitReached: true, 
            retryAfter: Math.ceil((requestTimestamps[0] + windowMs - now) / 1000) 
        };
    }
    requestTimestamps.push(now);
    return { limitReached: false };
}

function setupAccessGate() {
    const keySubmit = document.getElementById('keySubmit');
    const keyInput = document.getElementById('keyInput');
    const keyError = document.getElementById('keyError');

    keySubmit.style.backgroundColor = CONFIG.COLOR_PRIMARIO;

    keySubmit.onclick = async () => {
        try {
            const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`);
            const text = await res.text();
            const json = JSON.parse(text.replace(/.*google.visualization.Query.setResponse\((.*)\);/s, '$1'));
            const row = json.table.rows[1]?.c || json.table.rows[0]?.c || [];
            
            const realKey = String(row[0]?.v || "").trim().toLowerCase();
            const inputKey = keyInput.value.trim().toLowerCase();

            if (inputKey === realKey) { 
                document.getElementById('access-gate').classList.add('hidden');
                chatInterface.classList.remove('hidden');
                cargarIA(); 
            } else {
                keyError.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error validando acceso:", error);
        }
    };
}

// --- Lógica Principal del Chat ---
async function cargarIA() {
    systemInstruction = await cargarYAnalizarContexto();
    document.getElementById('bot-welcome-text').innerText = CONFIG.SALUDO_INICIAL;
    
    userInput.placeholder = CONFIG.PLACEHOLDER_INPUT;
    userInput.maxLength = CONFIG.MAX_LENGTH_INPUT;
    
    toggleInput(true);
    updateDemoFeedback(0);

    sendBtn.onclick = procesarMensaje;
    userInput.onkeydown = (e) => { if (e.key === 'Enter') procesarMensaje(); };
}

async function procesarMensaje() {
    const text = userInput.value.trim();
    
    // Validaciones previas
    if (messageCount >= CONFIG.MAX_DEMO_MESSAGES || text.length < CONFIG.MIN_LENGTH_INPUT) return;
    
    const limit = checkRateLimit();
    if (limit.limitReached) {
        agregarBurbuja(`⚠️ Demasiadas consultas. Espera ${limit.retryAfter}s.`, 'bot');
        return;
    }

    // UI: Mensaje de usuario y carga
    agregarBurbuja(text, 'user');
    conversationHistory.push({ role: "user", content: text });
    
    userInput.value = '';
    toggleInput(false);
    const loadingId = mostrarLoading();

    try {
        const respuesta = await llamarIA(loadingId);
        
        clearTimeout(longWaitTimeoutId);
        document.getElementById(loadingId)?.remove();
        
        conversationHistory.push({ role: "assistant", content: respuesta });

        // Lógica de WhatsApp
        const clean = respuesta.replace('[whatsapp]', 'Por favor, comunícate con nosotros por WhatsApp para ayudarte mejor.');
        const btn = respuesta.includes('[whatsapp]') 
            ? `<a href="${WA_LINK}?text=Hola, necesito ayuda con: ${encodeURIComponent(text)}" target="_blank" class="chat-btn">Contáctanos aquí</a>` 
            : "";
        
        agregarBurbuja(marked.parse(clean) + btn, 'bot');
        
        messageCount++;
        updateDemoFeedback(messageCount);

    } catch (e) {
        clearTimeout(longWaitTimeoutId);
        document.getElementById(loadingId)?.remove();
        agregarBurbuja(marked.parse(`¡Disculpa! Tenemos un problema de conexión temporal.`) + `<a href="${WA_LINK}" class="chat-btn">WhatsApp</a>`, 'bot');
    } finally {
        const canContinue = messageCount < CONFIG.MAX_DEMO_MESSAGES;
        toggleInput(canContinue);
        if (canContinue) userInput.focus();
    }
}

// --- Función de Red Estándar AWS/Google ---
async function llamarIA(loadingId) {
    let delay = CONFIG.RETRY_DELAY_MS;
    const messages = [
        { role: "system", content: systemInstruction },
        ...conversationHistory.slice(-CONFIG.MAX_HISTORIAL_MESSAGES)
    ];

    // Bucle con lógica i <= RETRY_LIMIT (Intento inicial + Reintentos reales)
    for (let i = 0; i <= CONFIG.RETRY_LIMIT; i++) {
        try {
            const ctrl = new AbortController();
            const tId = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);

            const res = await fetch(CONFIG.URL_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    model: CONFIG.MODELO, 
                    messages: messages, 
                    temperature: CONFIG.TEMPERATURA, 
                    top_p: CONFIG.TOP_P, 
                    frequency_penalty: CONFIG.FREQUENCY_PENALTY, 
                    presence_penalty: CONFIG.PRESENCE_PENALTY, 
                    max_tokens: CONFIG.MAX_TOKENS_RESPONSE 
                }),
                signal: ctrl.signal
            });

            clearTimeout(tId);
            if (!res.ok) throw new Error("Error en API");
            
            const data = await res.json();
            return data.choices[0].message.content;

        } catch (err) {
            // Si es el último reintento permitido, lanzamos el error
            if (i === CONFIG.RETRY_LIMIT) throw err;

            // UX Inteligente: El feedback visual y delay solo ocurren DESPUÉS del primer fallo
            if (i >= 0) { 
                const el = document.getElementById(loadingId);
                
                // Solo mostramos "Reintentando" si no fue el primer micro-corte instantáneo
                if (i > 0 && el) {
                    el.innerHTML = `<span style="color:#d97706; font-weight: 500;">Reintentando conexión... ${Math.round(delay/1000)}s</span>`;
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2; // Backoff exponencial
                    
                    if (el) el.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>`;
                }
            }
        }
    }
}

// --- Utilidades de UI ---
function toggleInput(state) {
    userInput.disabled = !state;
    sendBtn.disabled = !state;
}

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    if (tipo === 'user') {
        div.className = "p-3 max-w-[85%] text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto shadow-sm";
        div.style.backgroundColor = CONFIG.COLOR_PRIMARIO;
        div.textContent = html;
    } else {
        div.className = "p-3 max-w-[85%] text-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start bot-bubble shadow-sm";
        div.innerHTML = html;
    }
    chatContainer.appendChild(div);
    handleScroll();
}

function mostrarLoading() {
    const id = 'load-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1 shadow-sm";
    div.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>`;
    
    chatContainer.appendChild(div);
    handleScroll();

    // Alerta de espera prolongada (10 segundos)
    longWaitTimeoutId = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
            el.style.backgroundColor = '#fef3c7';
            el.innerHTML = `<span style="color:#d97706; font-weight: 500;">⚠️ Alta demanda, tu solicitud está tardando más de lo normal...</span>`;
        }
    }, 10000);

    return id;
}

// --- Inicio de la Aplicación ---
window.onload = () => {
    aplicarConfiguracionGlobal();
    if (CONFIG.SHEET_ID) {
        setupAccessGate();
    } else {
        document.getElementById('access-gate').classList.add('hidden');
        chatInterface.classList.remove('hidden');
        cargarIA();
    }
};
