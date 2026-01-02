document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    let filteredProducts = [];
    let currentCategory = 'Todos';
    let searchQuery = '';
    let currentPage = 1;
    const itemsPerPage = 25;

    let cart = JSON.parse(localStorage.getItem(CONFIG.CART_PREFIX + 'cart') || '[]');
    let lastScrollTop = 0;

    // Elements
    const header = document.getElementById('main-header');
    const productList = document.getElementById('product-list');
    const categoriesContainer = document.getElementById('categories-container');
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    const searchInput = document.getElementById('search-input');
    const cartCount = document.getElementById('cart-count');
    const storeLogoContainer = document.getElementById('store-logo-container');
    const footerStoreName = document.getElementById('footer-store-name');
    const socialLinksContainer = document.getElementById('social-links');
    const modal = document.getElementById('product-modal');
    const closeModal = document.getElementById('close-modal');
    const modalBody = document.getElementById('modal-body');

    // Initialize UI
    function initUI() {
        storeLogoContainer.innerHTML = `<img src="${CONFIG.LOGO_URL}" alt="${CONFIG.STORE_NAME}">`;
        footerStoreName.textContent = CONFIG.STORE_NAME;
        document.documentElement.style.setProperty('--config-primary', CONFIG.PRIMARY_COLOR);

        const socials = [
            { icon: 'fab fa-whatsapp', link: `https://wa.me/${CONFIG.WHATSAPP_NUMBER}` },
            { icon: 'fab fa-instagram', link: CONFIG.INSTAGRAM },
            { icon: 'fab fa-facebook', link: CONFIG.FACEBOOK },
            { icon: 'fab fa-tiktok', link: CONFIG.TIKTOK },
            { icon: 'fab fa-youtube', link: CONFIG.YOUTUBE }
        ];

        socialLinksContainer.innerHTML = socials.map(s => `<a href="${s.link}" target="_blank"><i class="${s.icon}"></i></a>`).join('');
        updateCartCount();
    }

    // Header behaviors
    window.addEventListener('scroll', () => {
        let st = window.pageYOffset || document.documentElement.scrollTop;
        if (st > lastScrollTop && st > CONFIG.HEADER_HEIGHT) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }, false);

    searchToggle.addEventListener('click', () => {
        searchBar.style.display = searchBar.style.display === 'none' ? 'block' : 'none';
        if (searchBar.style.display === 'block') searchInput.focus();
    });

    // Data handling
    async function loadData() {
        renderSkeletons();
        allProducts = await DataManager.fetchData();
        renderCategories();
        filterAndRender();
    }

    function renderSkeletons() {
        productList.innerHTML = Array(8).fill(0).map(() => `
            <div class="product-card glass">
                <div class="product-image-container skeleton"></div>
                <div class="product-info">
                    <div class="skeleton" style="height: 16px; width: 80%; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 16px; width: 40%;"></div>
                </div>
            </div>
        `).join('');
    }

    function renderCategories() {
        const categories = ['Todos', ...new Set(allProducts.map(p => p.category))];
        categoriesContainer.innerHTML = categories.map(cat => `
            <div class="category-tab ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </div>
        `).join('');

        categoriesContainer.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentCategory = tab.dataset.category;
                currentPage = 1;
                renderCategories();
                filterAndRender();
            });
        });
    }

    function filterAndRender() {
        const query = normalizeText(searchQuery);
        filteredProducts = allProducts.filter(p => {
            const matchesCategory = currentCategory === 'Todos' || p.category === currentCategory;
            const matchesSearch = normalizeText(p.name).includes(query) || normalizeText(p.description).includes(query);
            return matchesCategory && matchesSearch;
        });

        renderProducts();
    }

    function renderProducts() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredProducts.slice(start, end);

        if (pageItems.length === 0) {
            productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron productos.</div>`;
            return;
        }

        productList.innerHTML = pageItems.map(p => `
            <div class="product-card glass" onclick="window.showProductDetail('${p.id}')">
                <div class="product-image-container">
                    <img src="${p.image}" class="product-image" loading="lazy" alt="${p.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price-container">
                        <span class="price">${CONFIG.CURRENCY}${p.salePrice || p.price}</span>
                        ${p.salePrice && p.salePrice < p.price ? `<span class="price-regular">${CONFIG.CURRENCY}${p.price}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Modal and Cart Logic
    window.showProductDetail = (id) => {
        const p = allProducts.find(x => x.id === id);
        if (!p) return;

        modalBody.innerHTML = `
            <img src="${p.image}" style="width:100%; border-radius:12px; margin-bottom:20px;">
            <h2>${p.name}</h2>
            <p style="color:var(--text-muted); margin: 10px 0;">${p.category}</p>
            <div class="product-price-container" style="font-size: 1.5rem; margin-bottom: 20px;">
                <span class="price">${CONFIG.CURRENCY}${p.salePrice || p.price}</span>
            </div>
            <p>${p.description}</p>
            <button class="btn-add" onclick="window.addToCart('${p.id}')" style="margin-top:30px; font-size:1.1rem; padding:15px;">
                Agregar al carrito
            </button>
        `;
        modal.classList.add('active');
    };

    closeModal.onclick = () => modal.classList.remove('active');

    window.addToCart = (id) => {
        const p = allProducts.find(x => x.id === id);
        if (!p) return;

        const cartItem = cart.find(item => item.id === id);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...p, quantity: 1 });
        }

        saveCart();
        updateCartCount();
        modal.classList.remove('active');
        // Simple visual feedback could go here
    };

    function saveCart() {
        localStorage.setItem(CONFIG.CART_PREFIX + 'cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        currentPage = 1;
        filterAndRender();
    });

    const cartSidebar = document.getElementById('cart-sidebar');
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const whatsappCheckout = document.getElementById('whatsapp-checkout');

    cartToggle.addEventListener('click', () => {
        renderCart();
        cartSidebar.classList.add('active');
    });

    closeCart.addEventListener('click', () => cartSidebar.classList.remove('active'));

    function renderCart() {
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p style="text-align:center; margin-top:50px; color:var(--text-muted);">Tu carrito está vacío</p>';
            cartTotalAmount.textContent = CONFIG.CURRENCY + '0.00';
            return;
        }

        cartItemsList.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
                <div class="cart-item-info">
                    <div style="font-weight:600; font-size:0.9rem;">${item.name}</div>
                    <div style="color:var(--primary); font-size:0.85rem;">${CONFIG.CURRENCY}${(item.salePrice || item.price).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="btn-qty" onclick="window.updateQty('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty" onclick="window.updateQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0);
        cartTotalAmount.textContent = CONFIG.CURRENCY + total.toFixed(2);
    }

    window.updateQty = (id, change) => {
        const item = cart.find(x => x.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(x => x.id !== id);
            }
        }
        saveCart();
        updateCartCount();
        renderCart();
    };

    whatsappCheckout.addEventListener('click', () => {
        if (cart.length === 0) return;

        let message = `*Pedido de ${CONFIG.STORE_NAME}*\n\n`;
        message += cart.map(item => `- ${item.name} (x${item.quantity}): ${CONFIG.CURRENCY}${((item.salePrice || item.price) * item.quantity).toFixed(2)}`).join('\n');

        const total = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0);
        message += `\n\n*Total: ${CONFIG.CURRENCY}${total.toFixed(2)}*`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
    });

    const viewToggle = document.getElementById('view-toggle');

    viewToggle.addEventListener('click', () => {
        productList.classList.toggle('list');
        const icon = viewToggle.querySelector('i');
        if (productList.classList.contains('list')) {
            icon.classList.replace('fa-th-list', 'fa-th-large');
        } else {
            icon.classList.replace('fa-th-large', 'fa-th-list');
        }
    });

    initUI();
    loadData();
});
