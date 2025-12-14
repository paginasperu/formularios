// funciones.js - Lógica de Negocio, Seguridad y Conexión

// IMPORTACIONES MODULARES
import { APP_CONFIG, UI_CONFIG, AI_CONFIG, SEGURIDAD_CONFIG } from './ajustes.js'; 
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js'; 

// === VARIABLES GLOBALES ===
let systemInstruction = ""; 
let conversationHistory = []; // Almacena el historial para el contexto
// Elementos del Chat
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chat-container'); 
const chatInterface = document.getElementById('chat-interface'); 
// Elementos del Acceso
const accessGate = document.getElementById('access-gate'); 
const keyInput = document.getElementById('keyInput');     
const keySubmit = document.getElementById('keySubmit');   
const keyPrompt = document.getElementById('key-prompt');  
const keyError = document.getElementById('keyError');     

const WA_LINK = `https://wa.me/${UI_CONFIG.WHATSAPP_NUMERO}`;
const requestTimestamps = []; 
let messageCount = 0;         

// === SISTEMA DE SEGURIDAD: RATE LIMITING (Sliding Window - Frontend) ===
function checkRateLimit() {
    const now = Date.now();
    const windowMs = SEGURIDAD_CONFIG.RATE_LIMIT_WINDOW_SECONDS * 1000;
    
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - windowMs) {
        requestTimestamps.shift();
    }

    if (requestTimestamps.length >= SEGURIDAD_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        if (AI_CONFIG.ENABLE_LOGGING) console.warn("Rate limit activado por IP.");
        return { 
            limitReached: true, 
            retryAfter: Math.ceil((requestTimestamps[0] + windowMs - now) / 1000) 
        };
    }
    
    requestTimestamps.push(now);
    return { limitReached: false };
}

// === CARGA DE CONTEXTO ===
async function cargarYAnalizarContexto() {
    try {
        document.getElementById('status-text').innerText = "Cargando sistema...";

        const [resInst, resData] = await Promise.all([
            fetch('./instrucciones.txt'),
            fetch('./datos.txt')
        ]);

        if (!resInst.ok || !resData.ok) throw new Error("Error cargando archivos base");

        const textoInstruccion = await resInst.text();
        const textoData = await resData.text();
        
        // El textoInstruccion ahora es solo el prompt.
        let instruccionPrompt = textoInstruccion;
        
        // Reemplazo de Placeholders
        instruccionPrompt = instruccionPrompt
            .replace(/\[whatsapp\]/g, UI_CONFIG.WHATSAPP_NUMERO)
            .replace(/\[nombre_empresa\]/g, APP_CONFIG.NOMBRE_EMPRESA || 'Empresa');

        // Adjuntar Data
        instruccionPrompt += `\n\n--- BASE DE CONOCIMIENTO (USAR SOLO ESTO) ---\n${textoData}`;

        return instruccionPrompt;

    } catch (error) {
        if (AI_CONFIG.ENABLE_LOGGING) console.error("Error crítico en carga de contexto:", error);
        return "Error de sistema. Contacte a soporte.";
    }
}


// === LÓGICA DE ACCESO ===
function setupAccessGate() {
    keyPrompt.innerText = UI_CONFIG.TEXTO_CLAVE_ACCESO;
    keySubmit.style.backgroundColor = UI_CONFIG.COLOR_PRIMARIO;
    
    const checkKey = () => {
        const input = keyInput.value.trim().toLowerCase();
        const realKey = SEGURIDAD_CONFIG.CLAVE_ACCESO.toLowerCase();

        // Lógica de Bypass: Si la clave está VACÍA ("") en ajustes, entra directamente.
        const isBypassEnabled = realKey === "";
        const isCorrectKey = input === realKey;
        
        if (isCorrectKey || isBypassEnabled) {
            keyError.classList.add('hidden');
            accessGate.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            cargarIA(); 
        } else {
            keyError.classList.remove('hidden');
            keyInput.value = '';
            keyInput.focus();
        }
    };
    
    keySubmit.addEventListener('click', checkKey);
    keyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            checkKey(); 
        }
    });
}

// === INICIO DEL CHAT ===
async function cargarIA() {
    systemInstruction = await cargarYAnalizarContexto();
    
    // UI Setup
    document.documentElement.style.setProperty('--chat-color', UI_CONFIG.COLOR_PRIMARIO);
    document.getElementById('header-title').innerText = APP_CONFIG.NOMBRE_EMPRESA || "Chat";
    document.getElementById('bot-welcome-text').innerText = UI_CONFIG.SALUDO_INICIAL || "Hola.";
    document.getElementById('status-text').innerText = "En línea 🟢";
    
    document.getElementById('header-icon-initials').innerText = UI_CONFIG.ICONO_HEADER; 
    
    // Input Security Setup
    userInput.setAttribute('maxlength', SEGURIDAD_CONFIG.MAX_LENGTH_INPUT);
    userInput.setAttribute('placeholder', UI_CONFIG.PLACEHOLDER_INPUT);
    
    toggleInput(true);

    sendBtn.addEventListener('click', procesarMensaje);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); procesarMensaje(); }
    });
}


// === FUNCIÓN PRINCIPAL DE INICIO ===
async function iniciarSistema() {
    document.documentElement.style.setProperty('--chat-color', UI_CONFIG.COLOR_PRIMARIO);
    
    if (SEGURIDAD_CONFIG.CLAVE_ACCESO) {
        setupAccessGate();
    } else {
        accessGate.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        cargarIA();
    }
}


// === LÓGICA PRINCIPAL ===
async function procesarMensaje() {
    const textoUsuario = userInput.value.trim();
    
    // 1. BLOQUEO DE DEMO Y UX DE ALERTA
    if (messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
        const demoEndMsg = `🛑 ¡Demo finalizado! Has alcanzado el límite de ${SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES} mensajes. Por favor, contáctanos para continuar.`;
        if (messageCount === SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
             agregarBurbuja(demoEndMsg, 'bot');
             messageCount++;
        }
        userInput.value = '';
        toggleInput(false);
        return;
    }
    
    // Alerta de límite próximo
    if (UI_CONFIG.SHOW_REMAINING_MESSAGES && 
        messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES - UI_CONFIG.WARNING_THRESHOLD &&
        messageCount < SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
        
        const remaining = SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES - messageCount;
        agregarBurbuja(`⚠️ Atención: Te quedan ${remaining} mensaje(s) de demostración.`, 'bot');
    }


    // 2. Validación de Input
    if (!textoUsuario) return;
    if (textoUsuario.length < SEGURIDAD_CONFIG.MIN_LENGTH_INPUT || textoUsuario.length > SEGURIDAD_CONFIG.MAX_LENGTH_INPUT) {
        if (AI_CONFIG.ENABLE_LOGGING) console.warn("Input no válido por longitud.");
        userInput.value = ''; 
        return; 
    }

    // 3. Rate Limiting (Frontend)
    const limit = checkRateLimit();
    if (limit.limitReached) {
        agregarBurbuja(`⚠️ Demasiadas consultas. Espera ${limit.retryAfter}s.`, 'bot');
        userInput.value = '';
        return;
    }

    agregarBurbuja(textoUsuario, 'user');
    
    // Agregar mensaje del usuario al historial
    conversationHistory.push({ role: "user", content: textoUsuario });
    
    userInput.value = '';
    toggleInput(false);
    const loadingId = mostrarLoading();
    
    try {
        const respuesta = await llamarIA(); // Ya no necesita textoUsuario como argumento
        document.getElementById(loadingId)?.remove();
        
        // Agregar respuesta del bot al historial
        conversationHistory.push({ role: "assistant", content: respuesta });

        // Procesar respuesta
        const whatsappCheck = `[whatsapp_link]`;
        let htmlFinal = "";

        if (respuesta.includes(whatsappCheck)) {
            const cleanText = respuesta.replace(whatsappCheck, '');
            const btnLink = `<a href="${WA_LINK}?text=${encodeURIComponent('Ayuda con: ' + textoUsuario)}" target="_blank" class="chat-btn">${UI_CONFIG.WHATSAPP_NUMERO}</a>`;
            htmlFinal = marked.parse(cleanText) + btnLink;
        } else {
            htmlFinal = marked.parse(respuesta);
        }
        
        agregarBurbuja(htmlFinal, 'bot');
        messageCount++;

    } catch (e) {
        document.getElementById(loadingId)?.remove();
        if (AI_CONFIG.ENABLE_LOGGING) console.error("Error en llamada IA:", e);
        agregarBurbuja(`Error de conexión o timeout. <a href="${WA_LINK}" class="chat-btn">WhatsApp</a>`, 'bot');
    } finally {
        if (messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
            toggleInput(false);
        } else {
            toggleInput(true);
            userInput.focus();
        }
    }
}

// === API CALL ===
async function llamarIA() {
    const { MODELO, TEMPERATURA, RETRY_LIMIT, RETRY_DELAY_MS, URL_PROXY, TIMEOUT_MS, MAX_TOKENS_RESPONSE, MAX_CONTEXT_MESSAGES } = AI_CONFIG; 
    let delay = RETRY_DELAY_MS;
    
    // Construir la lista de mensajes con el historial
    let messages = [
        { role: "system", content: systemInstruction }
    ];

    // Añadir el historial limitado (para RAG y contexto)
    const contextStart = Math.max(0, conversationHistory.length - MAX_CONTEXT_MESSAGES);
    messages = messages.concat(conversationHistory.slice(contextStart));


    for (let i = 0; i < RETRY_LIMIT; i++) {
        try {
            // Configurar el fetch con AbortController para el timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const res = await fetch(URL_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODELO, 
                    messages: messages, 
                    temperature: TEMPERATURA,
                    max_tokens: MAX_TOKENS_RESPONSE, // Límite de tokens de salida (Costo)
                    stream: false
                }),
                signal: controller.signal // Aplicar el timeout
            });

            clearTimeout(timeoutId); // Limpiar timeout si la respuesta llega a tiempo

            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            
            return data.choices?.[0]?.message?.content || "No entendí, ¿puedes repetir?";

        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error("API Timeout");
            }
            if (i === RETRY_LIMIT - 1) throw err;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; // Backoff exponencial
        }
    }
}

// === UI UTILS ===
function toggleInput(state) {
    userInput.disabled = !state;
    sendBtn.disabled = !state;
}

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    if (tipo === 'user') {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto";
        div.style.backgroundColor = UI_CONFIG.COLOR_PRIMARIO;
        div.textContent = html; 
    } else {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none self-start mr-auto bot-bubble";
        div.innerHTML = html; 
    }
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function mostrarLoading() {
    const id = 'load-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1";
    div.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight; 
    return id;
}

window.onload = iniciarSistema;