export const CONFIG = {
    
    NOMBRE_EMPRESA: "Frankos Chicken",       
    // Nombre visible principal (ej. en el Header).

    COLOR_PRIMARIO: "#ea580c",              
    // Color de acento (header, botones, burbujas del usuario).

    ICONO_HEADER: "FC",                     
    // Texto o Emoji en header (fallback a LOGO_URL).

    FAVICON_EMOJI: "🐔",                    
    // Ícono de la pestaña del navegador.

    LOGO_URL: "https://i.ibb.co/W4m7vxxn/logo-frankos-chicken.jpg",                           
    // URL del logo (si está, oculta ICONO_HEADER). Debe ser circular.

    WHATSAPP_NUMERO: "51949973277",         
    // Número de WhatsApp para CTA.

    SALUDO_INICIAL: "¡Hola! Bienvenido a Frankos Chicken. ¿En qué puedo ayudarte hoy?",
    // Mensaje de bienvenida del bot.

    PLACEHOLDER_INPUT: "Escribe tu consulta...",
    // Texto de ayuda en la caja de texto.

    SHOW_REMAINING_MESSAGES: true,          
    // Muestra cuántos mensajes de demo quedan.

    WARNING_THRESHOLD: 1,                   
    // Mensajes restantes para mostrar alerta.

    URL_PROXY: "https://deepseek-chat-proxy.precios-com-pe.workers.dev",
    // URL del proxy que llama al modelo de IA.

    MODELO: "deepseek-chat",                
    // Modelo de DeepSeek a utilizar.

    TEMPERATURA: 0.1,                       
    // Creatividad de la IA (0.0: Preciso, 1.0: Creativo).

    TIMEOUT_MS: 15000,                      
    // Tiempo máximo de espera para la API (milisegundos).

    MAX_TOKENS_RESPONSE: 150,               
    // Máximo de tokens que puede generar la IA (Control de Costos).

    MAX_HISTORIAL_MESSAGES: 4,              
    // Cuántos mensajes previos se envían como contexto (memoria).

    RETRY_LIMIT: 3,                         
    // Número de reintentos en caso de fallo de API.

    RETRY_DELAY_MS: 1000,                   
    // Delay inicial para reintentos.

    CLAVE_ACCESO: "",                       
    // Clave de acceso requerida. Dejar "" para bypass.

    CLAVE_EXPIRACION: "2025-12-15T06:00:00Z", 
    // Fecha y hora (ISO 8601) de expiración de la CLAVE_ACCESO.

    MIN_LENGTH_INPUT: 4,                    
    // Longitud mínima para un mensaje válido.

    MAX_LENGTH_INPUT: 150,                  
    // Longitud máxima del mensaje.

    MAX_DEMO_MESSAGES: 5,                   
    // Límite de mensajes para la demo por sesión.

    RATE_LIMIT_MAX_REQUESTS: 5,             
    // Máximo de requests permitidas en la ventana.

    RATE_LIMIT_WINDOW_SECONDS: 60,          
    // Ventana de tiempo (en segundos) para el Rate Limit.
};
