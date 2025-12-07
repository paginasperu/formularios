// main.js - VERSIÓN FINAL (UI AVATARS)

// 1. CONFIGURACIÓN
const SHEET_ID = '1ew2qtysq4rwWkL7VU2MTaOv2O3tmD28kFYN5eVHCiUY'; 
const SHEET_NAME = 'negocios'; 
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

const rewardsList = document.getElementById('rewardsList');

// --- FUNCIÓN PRINCIPAL: CARGAR NEGOCIOS ---
async function cargarNegocios() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        rewardsList.innerHTML = ''; 

        data.forEach(negocio => {
            // LÓGICA DE LOGO INTELIGENTE:
            // 1. Si hay logo en Excel, úsalo.
            // 2. Si NO hay logo, genera uno automático con UI Avatars usando el nombre del negocio.
            let urlLogo;
            if (negocio.logo && negocio.logo.trim() !== '') {
                urlLogo = negocio.logo;
            } else {
                urlLogo = generarAvatar(negocio.nombre);
            }

            // URL de respaldo por si la imagen del Excel falla (404)
            const backupLogo = generarAvatar(negocio.nombre);

            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')">
                    
                    <div class="reward-image">
                        <img src="${urlLogo}" 
                             alt="${negocio.nombre}" 
                             onerror="this.onerror=null; this.src='${backupLogo}'">
                    </div>

                    <div class="reward-content">
                        <div class="reward-vendor">${negocio.categoria}</div>
                        <h3 class="reward-title">${negocio.nombre}</h3>
                        
                        <p class="reward-desc">
                            ${negocio.distrito} - ${negocio.provincia} - ${negocio.departamento}
                        </p>

                        <span class="reward-points">
                            Ver premios
                        </span>
                    </div>
                </article>
            `;
            rewardsList.innerHTML += cardHTML;
        });

        llenarFiltroDinamico(data, 'categoria', 'categoryFilter');

    } catch (error) {
        console.error('Error:', error);
        rewardsList.innerHTML = '<p style="text-align:center; color:red;">Error cargando negocios.</p>';
    }
}

// --- GENERADOR DE AVATARES (UI AVATARS) ---
function generarAvatar(nombre) {
    // Limpiamos el nombre y reemplazamos espacios con '+' para la URL
    const nombreLimpio = nombre ? nombre.replace(/\s+/g, '+') : 'Negocio';
    // Generamos un color aleatorio suave para el fondo, o dejamos que la API lo haga
    return `https://ui-avatars.com/api/?name=${nombreLimpio}&background=random&color=fff&size=150&bold=true`;
}

// --- FUNCIÓN INTELIGENTE PARA LLENAR SELECTS ---
function llenarFiltroDinamico(datos, columnaExcel, idSelectHTML) {
    const select = document.getElementById(idSelectHTML);
    if (!select) return;

    const todosLosValores = datos.map(item => item[columnaExcel]);
    const valoresUnicos = [...new Set(todosLosValores)].filter(val => val);
    valoresUnicos.sort();

    valoresUnicos.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
}

// --- FUNCIÓN DE FILTRADO ---
function filtrarNegocios() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const depaFilter = document.getElementById('depaFilter');

    if (!searchInput) return;

    const texto = searchInput.value.toLowerCase();
    const catSeleccionada = categoryFilter.value;
    const depaSeleccionado = depaFilter ? depaFilter.value : 'all';
    
    const cards = document.querySelectorAll('.business-card');

    cards.forEach(card => {
        const nombre = card.getAttribute('data-name').toLowerCase();
        const distrito = card.getAttribute('data-distrito').toLowerCase();
        const categoria = card.getAttribute('data-category'); 
        const departamento = card.getAttribute('data-depa');

        const matchTexto = nombre.includes(texto) || distrito.includes(texto);
        const matchCat = catSeleccionada === 'all' || categoria === catSeleccionada;
        const matchDepa = depaSeleccionado === 'all' || departamento === depaSeleccionado;

        card.style.display = (matchTexto && matchCat && matchDepa) ? 'flex' : 'none';
    });
}

// --- NAVEGACIÓN ---
function irANegocio(usuario) {
    window.location.hash = `/${usuario}`;
}

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    if (typeof cargarFiltros === "function") cargarFiltros();
    cargarNegocios();
});
