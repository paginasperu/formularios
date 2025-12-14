// ajustes.js - Configuraciones Globales PROFESIONALES Y MODULARES

// ═══════════════════════════════════════════════════════════════
// 1. CONFIGURACIÓN DE LA APLICACIÓN (APP_CONFIG)
// ═══════════════════════════════════════════════════════════════
export const APP_CONFIG = {
    NOMBRE_EMPRESA: "Frankos Chicken", 
    VERSION: "1.0.0",
    MODO_ENTORNO: "development", // 'development' (para Bypass de clave) | 'production'
};

// ═══════════════════════════════════════════════════════════════
// 2. CONFIGURACIÓN DE LA INTERFAZ (UI_CONFIG)
// ═══════════════════════════════════════════════════════════════
export const UI_CONFIG = {
    // Branding
    COLOR_PRIMARIO: "#ea580c",          // Color de acento principal.
    ICONO_HEADER: "FC",
    
    // Textos Estáticos
    SALUDO_INICIAL: "¡Hola! Bienvenido a Frankos Chicken. ¿En qué puedo ayudarte hoy?",
    TEXTO_CLAVE_ACCESO: "Ingresa la clave de acceso para continuar:",
    PLACEHOLDER_INPUT: "Escribe tu consulta...",
    
    // Integración
    WHATSAPP_NUMERO: "51949973277",
    
    // UX Avanzada (para el modo Demo)
    SHOW_REMAINING_MESSAGES: true,  // Muestra cuántos mensajes de demo quedan
    WARNING_THRESHOLD: 1,           // Avisar cuando quede 1 mensaje
};


// ═══════════════════════════════════════════════════════════════
// 3. CONFIGURACIÓN DEL MODELO DE IA Y CONEXIÓN (AI_CONFIG)
// ═══════════════════════════════════════════════════════════════
export const AI_CONFIG = {
    URL_PROXY: "https://deepseek-chat-proxy.precios-com-pe.workers.dev",
    MODELO: "deepseek-chat",
    TEMPERATURA: 0.5,
    
    // Control de Robustez y Costos
    TIMEOUT_MS: 15000,                  // Timeout de la API (15 segundos)
    MAX_TOKENS_RESPONSE: 300,           // Límite de longitud de la respuesta (Costo)
    MAX_CONTEXT_MESSAGES: 4,            // Cuántos mensajes anteriores se envían como contexto
    
    // Manejo de Reintentos
    RETRY_LIMIT: 3,                     
    RETRY_DELAY_MS: 1000,               // Primer delay (se dobla en cada reintento)
    ENABLE_LOGGING: true,               // Activar/desactivar logs de consola
};


// ═══════════════════════════════════════════════════════════════
// 4. CONFIGURACIÓN DE SEGURIDAD Y LÍMITES (SEGURIDAD_CONFIG)
// ═══════════════════════════════════════════════════════════════
export const SEGURIDAD_CONFIG = {
    // Acceso
    // Dejar "" para desarrollo (bypass). Usar "1511" o tu clave real para producción.
    CLAVE_ACCESO: "",                   
    
    // Validación de Input
    MIN_LENGTH_INPUT: 4,
    MAX_LENGTH_INPUT: 200,              
    
    // Límite de Demo (Frontend)
    MAX_DEMO_MESSAGES: 5,               
    
    // Rate Limiting (Frontend - Complementa al Worker)
    RATE_LIMIT_MAX_REQUESTS: 5,         
    RATE_LIMIT_WINDOW_SECONDS: 60,      
};