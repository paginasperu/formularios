window.CHAT_CONFIG = {
    // === FUENTE DE DATOS EXTERNA ===
    // INSTRUCCIÓN CRÍTICA: Reemplaza esta URL por la URL de tu Google Sheet (Archivo > Compartir > Publicar en la web > Seleccionar CSV o TSV).
    data_source_url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_Q-X_G_U-A_B_C_D_E_F_G/pub?gid=0&single=true&output=csv", 

    // === IDENTIDAD ===
    titulo: "Frankos Chicken & Grill 🍗",
    colorPrincipal: "#ea580c", 
    saludoInicial: "¡Hola! Bienvenido a Frankos Chicken. Soy Fedeliza. ¿Qué se te antoja hoy? 🍗",
    placeholder: "Escribe 'carta', 'precio' o selecciona una opción...",
    whatsapp: "51999999999", // CAMBIAR POR TU NÚMERO REAL

    // === SUGERENCIAS RÁPIDAS (Botones que activan las reglas de la hoja de cálculo) ===
    sugerencias_rapidas: [
        { texto: "Ver Carta", accion: "carta" },
        { texto: "Precios de Pollo", accion: "precio" },
        { texto: "Delivery", accion: "delivery" },
        { texto: "Horario", accion: "horario" }
    ],

    // === PERSONALIDAD ALEATORIA (Frases de relleno para simular IA) ===
    personalidad: {
        saludos: [
            "¡Claro que sí! 🍗", "Buena elección. 😎", "A ver, te comento. 🧐",
            "¡Esa es una pregunta frecuente! Mira:", "Franco, franco... te explico: 🐔"
        ],
        cierres: [
            "¿Te provoco algo más?", "¡Avisa para confirmar! 🔥",
            "Cualquier duda, aquí sigo.", "¡Sale caliente! 🥔"
        ],
        sin_entender: [
            "Uy, esa no me la sé, pero podemos verlo por WhatsApp. 👇",
            "Me corchaste con esa pregunta 😅. Mejor habla con un humano aquí:",
            "Para detalles tan específicos, escríbenos al WhatsApp oficial. 📲"
        ]
    }
};
