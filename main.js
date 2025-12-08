// main.js - VERSIÓN RUTAS LIMPIAS (premios.pe/negocio)

// 1. CONFIGURACIÓN
const SHEET_ID = '1ew2qtysq4rwWkL7VU2MTaOv2O3tmD28kFYN5eVHCiUY'; 
const SHEET_NAME = 'negocios'; 
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

// Imágenes por defecto
const IMAGEN_DEFECTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b'%3ESin Logo%3C/text%3E%3C/svg%3E";

const container = document.getElementById('rewardsList');
const filtrosContainer = document.getElementById('shortcode-filtros');
const welcomeMsg = document.getElementById('welcomeMessage');

// --- 1. SISTEMA DE RUTAS (ROUTER) ---
function manejarRuta() {
    const ruta = window.location.pathname;
    // Quitamos la barra inicial (ej: "/nike" -> "nike")
    const usuarioNegocio = ruta.replace(/^\//, '').toLowerCase();

    if (usuarioNegocio && usuarioNegocio !== 'index.html') {
        // MODO PERFIL: Estamos en premios.pe/nike
        cargarPerfilNegocio(usuarioNegocio);
    } else {
        // MODO DIRECTORIO: Estamos en premios.pe
        cargarDirectorio();
    }
}

// Navegación sin recargar (se usa al hacer clic en una tarjeta)
function irANegocio(usuario) {
    history.pushState(null, null, `/${usuario}`);
    manejarRuta();
}

// Detectar botones Atrás/Adelante del navegador
window.addEventListener('popstate', manejarRuta);


// --- 2. MODO DIRECTORIO (HOME) ---
async function cargarDirectorio() {
    // Mostrar filtros y limpiar contenedor
    if (filtrosContainer) filtrosContainer.style.display = 'block';
    if (welcomeMsg) welcomeMsg.style.display = 'none';
    
    container.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:20px;">Cargando negocios...</p>';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        container.innerHTML = ''; 

        data.forEach(negocio => {
            let urlLogo = (negocio.logo && negocio.logo.trim() !== '') ? negocio.logo : generarAvatar(negocio.nombre);

            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')">
                    
                    <div class="reward-image">
                        <img src="${urlLogo}" alt="${negocio.nombre}" onerror="this.onerror=null; this.src='${generarAvatar(negocio.nombre)}'">
                    </div>
                    <div class="reward-content">
                        <div class="reward-vendor">${negocio.categoria}</div>
                        <h3 class="reward-title">${negocio.nombre}</h3>
                        <p class="reward-desc">${negocio.distrito} - ${negocio.provincia} - ${negocio.departamento}</p>
                        <span class="reward-points">Ver premios</span>
                    </div>
                </article>
            `;
            container.innerHTML += cardHTML;
        });

        // Llenar filtros si existen
        if(typeof llenarFiltroDinamico === 'function') {
            llenarFiltroDinamico(data, 'categoria', 'categoryFilter');
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:red;">Error cargando directorio.</p>';
    }
}


// --- 3. MODO PERFIL NEGOCIO (DETALLE) ---
async function cargarPerfilNegocio(usuarioSlug) {
    // Ocultar filtros del home
    if (filtrosContainer) filtrosContainer.style.display = 'none';
    
    container.innerHTML = '<p style="text-align:center; margin-top:20px;">Cargando perfil...</p>';

    try {
        // A. Buscamos los datos del negocio en la tabla maestra
        const response = await fetch(API_URL);
        const negocios = await response.json();
        const negocio = negocios.find(n => n.usuario && n.usuario.toLowerCase() === usuarioSlug);

        if (!negocio) {
            container.innerHTML = '<h2 style="text-align:center; margin-top:50px;">Negocio no encontrado 😢</h2><div style="text-align:center"><button onclick="irANegocio(\'\')" style="padding:10px 20px; margin-top:20px; cursor:pointer;">Volver al Inicio</button></div>';
            return;
        }

        // B. Extraemos el ID de su hoja de puntos
        // NOTA: Usamos corchetes porque tu columna tiene espacios: "tabla de puntos"
        const idHojaExterna = negocio['tabla de puntos']; 

        if (!idHojaExterna) {
            container.innerHTML = `<h2 style="text-align:center;">${negocio.nombre}</h2><p style="text-align:center;">Este negocio aún no ha configurado sus premios.</p>`;
            return;
        }

        // C. Dibujamos la Cabecera del Negocio
        let urlLogo = negocio.logo || generarAvatar(negocio.nombre);
        
        let headerHTML = `
            <div style="text-align:center; margin-bottom:30px; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
                <img src="${urlLogo}" style="width:100px; height:100px; border-radius:12px; object-fit:cover; margin-bottom:10px;">
                <h1 style="margin:0; font-size:1.8rem; color:var(--text-dark);">${negocio.nombre}</h1>
                <p style="color:var(--text-gray); margin:5px 0;">${negocio.distrito}, ${negocio.departamento}</p>
                
                <div style="max-width:400px; margin:20px auto; display:flex; gap:10px;">
                    <input type="number" id="inputDNI" placeholder="Ingresa tu DNI" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                    <button onclick="consultarPuntos('${idHojaExterna}')" style="background:var(--primary); color:white; border:none; padding:0 20px; border-radius:8px; cursor:pointer; font-weight:600;">Consultar</button>
                </div>
                <div id="resultadoPuntos" style="margin-top:10px; font-weight:bold; color:var(--primary);"></div>
            </div>
            
            <h3 style="margin-bottom:15px; padding-left:10px; border-left: 4px solid var(--primary);">Catálogo de Premios</h3>
            <div id="listaPremiosNegocio" class="rewards-container">
                <p style="text-align:center; width:100%">Cargando premios...</p>
            </div>
        `;

        container.innerHTML = headerHTML;

        // D. Cargamos los PREMIOS de ese negocio (Pestaña 'premios')
        cargarPremiosDeNegocio(idHojaExterna);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:red;">Error cargando el perfil.</p>';
    }
}

// --- 4. CARGAR PREMIOS EXTERNOS ---
async function cargarPremiosDeNegocio(sheetId) {
    const urlPremios = `https://opensheet.elk.sh/${sheetId}/premios`;
    const divLista = document.getElementById('listaPremiosNegocio');

    try {
        const res = await fetch(urlPremios);
        const premios = await res.json();

        divLista.innerHTML = ''; // Limpiar mensaje de carga

        if(premios.length === 0) {
            divLista.innerHTML = '<p>No hay premios disponibles por ahora.</p>';
            return;
        }

        premios.forEach(premio => {
            // Usamos el mismo diseño de tarjeta pero adaptado a premios
            const card = `
                <article class="reward-card" style="cursor:default;">
                    <div class="reward-image">
                        <img src="${premio.imagen}" onerror="this.src='${IMAGEN_DEFECTO}'">
                    </div>
                    <div class="reward-content">
                        <div class="reward-vendor">${premio.categoria || 'General'}</div>
                        <h3 class="reward-title">${premio.nombre}</h3>
                        <span class="reward-points">${premio.puntos} Puntos</span>
                        <p class="reward-desc">${premio['descripcion corta'] || premio.descripcion_corta || ''}</p>
                    </div>
                </article>
            `;
            divLista.innerHTML += card;
        });

    } catch (e) {
        divLista.innerHTML = '<p style="color:red">Error cargando lista de premios.</p>';
    }
}

// --- 5. CONSULTAR PUNTOS (Pestaña 'clientes') ---
async function consultarPuntos(sheetId) {
    const dniInput = document.getElementById('inputDNI');
    const resultadoDiv = document.getElementById('resultadoPuntos');
    const dni = dniInput.value.trim();

    if(!dni) {
        resultadoDiv.innerHTML = '<span style="color:red">Escribe tu DNI</span>';
        return;
    }

    resultadoDiv.innerHTML = 'Buscando...';
    
    // Conectar a la pestaña 'clientes'
    const urlClientes = `https://opensheet.elk.sh/${sheetId}/clientes`;

    try {
        const res = await fetch(urlClientes);
        const clientes = await res.json();

        // Buscamos coincidencia exacta de DNI
        const cliente = clientes.find(c => String(c.dni) === String(dni));

        if(cliente) {
            resultadoDiv.innerHTML = `✅ Tienes <b>${cliente.puntos}</b> Puntos acumulados.`;
        } else {
            resultadoDiv.innerHTML = `<span style="color:#64748b">El DNI ${dni} no tiene puntos registrados aquí.</span>`;
        }

    } catch (e) {
        resultadoDiv.innerHTML = 'Error de conexión.';
    }
}

// --- ÚTILES ---
function generarAvatar(nombre) {
    const n = nombre ? nombre.replace(/\s+/g, '+') : 'Negocio';
    return `https://ui-avatars.com/api/?name=${n}&background=random&color=fff&size=150&bold=true`;
}

// Funciones de Filtros (Iguales que antes)
function llenarFiltroDinamico(datos, col, idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const vals = datos.map(i => i[col]);
    const unicos = [...new Set(vals)].filter(v => v).sort();
    // Limpiamos opciones anteriores (menos la primera)
    while (select.options.length > 1) { select.remove(1); }
    unicos.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        select.appendChild(opt);
    });
}

function filtrarNegocios() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.business-card').forEach(c => {
        const nombre = c.getAttribute('data-name').toLowerCase();
        const dist = c.getAttribute('data-distrito').toLowerCase();
        const categ = c.getAttribute('data-category');
        const show = (nombre.includes(texto) || dist.includes(texto)) && (cat === 'all' || categ === cat);
        c.style.display = show ? 'flex' : 'none';
    });
}

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    // Cargar filtros primero
    if (typeof cargarFiltros === "function") cargarFiltros();
    // Iniciar Router
    manejarRuta();
});
