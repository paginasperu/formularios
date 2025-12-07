// --- FUNCIÓN PRINCIPAL: CARGAR NEGOCIOS ---
async function cargarNegocios() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        rewardsList.innerHTML = ''; 

        data.forEach(negocio => {
            let urlLogo = (negocio.logo && negocio.logo.trim() !== '') ? negocio.logo : IMAGEN_DEFECTO;

            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')"
                    style="align-items: flex-start; padding: 15px;"> 
                    
                    <div class="reward-image" style="width: 110px; height: 110px;">
                        <img src="${urlLogo}" 
                             alt="${negocio.nombre}" 
                             onerror="this.onerror=null; this.src='${IMAGEN_DEFECTO}'"
                             style="border-radius: 8px;">
                    </div>

                    <div class="reward-content" style="padding: 0 0 0 15px; justify-content: space-between;">
                        
                        <h3 class="reward-title" style="font-size: 1.3rem; margin: 0 0 4px 0; line-height: 1.1;">
                            ${negocio.nombre}
                        </h3>

                        <div class="reward-vendor" style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: normal;">
                            ${negocio.categoria}
                        </div>

                        <p class="reward-desc" style="margin-bottom: 12px; font-size: 0.9rem;">
                            ${negocio.distrito} - ${negocio.provincia} - ${negocio.departamento}
                        </p>

                        <div style="
                            background-color: var(--primary); 
                            color: white; 
                            text-align: center; 
                            padding: 8px 12px; 
                            border-radius: 6px; 
                            font-weight: 600; 
                            font-size: 1.1rem;
                            width: 100%;
                            cursor: pointer;
                            transition: background 0.2s;
                        ">
                            Ver premios
                        </div>

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
