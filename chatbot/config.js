window.CHAT_CONFIG = {
    // === DISEÑO VISUAL ===
    titulo: "Asistente Dra. Ana",
    colorPrincipal: "#2563eb",
    saludoInicial: "¡Hola! Soy Ana. ¿En qué puedo ayudarte? 🦷",
    placeholder: "Pregunta precios o horarios...",

    // === LÍMITE DE USO (FILTRO DE CORTESÍA DEL CLIENTE) ===
    spamLimit: 30,
    spamDurationMinutes: 60,

    // === LISTA DE CEREBROS (Estrategia: Estabilidad y Cuota Alta) ===
    proveedores: [
        {
            // PROVEEDOR PRINCIPAL: Gemini 1.5 Flash
            nombre: "Gemini 1.5 Flash (Alta Disponibilidad)",
            tipo: "google",
            // 👇 ¡PEGA TU CLAVE AQUÍ ABAJO! (Borra el texto de ejemplo y pon tu AIza...)
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-1.5-flash"
        },
        {
            // RESPALDO: Gemini 1.5 Pro
            nombre: "Gemini 1.5 Pro (Respaldo)",
            tipo: "google",
            // 👇 ¡PEGA TU MISMA CLAVE AQUÍ TAMBIÉN!
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-1.5-pro"
        },
        {
            // ÚLTIMO RECURSO: DeepSeek (Solo si tienes proxy configurado)
            nombre: "DeepSeek (Emergencia)",
            tipo: "openai-compatible",
            modelo: "deepseek-chat",
            apiKey: "CLAVE_DEEPSEEK_PENDIENTE", 
            proxies: [
                "https://tu-proxy-1.workers.dev/chat/completions"
            ]
        }
    ]
};
