/* ============================================
   COMPUNIC STORE - CATÁLOGO (VERSIÓN MEJORADA)
   ============================================ */

let allProducts = [];
let categories = [];
let brands = [];
let cart = JSON.parse(localStorage.getItem('compunic_cart')) || [];
let currentFilter = {
    category: '',
    brand: '',
    tag: 'all',
    search: '',
    sort: 'newest',
    maxPrice: Infinity
};
let isGridView = true;

// ============================================
// UTILIDADES
// ============================================
function getGradientForProduct(id) {
    const gradients = [
        'linear-gradient(135deg, #162427 0%, #145D90 100%)',
        'linear-gradient(135deg, #162427 0%, #1a6fa8 100%)',
        'linear-gradient(135deg, #0f456e 0%, #56A5DD 100%)',
        'linear-gradient(135deg, #162427 0%, #3b8ac2 100%)',
        'linear-gradient(135deg, #11181a 0%, #145D90 100%)',
        'linear-gradient(135deg, #162427 0%, #4887b8 100%)',
        'linear-gradient(135deg, #0a0e10 0%, #56A5DD 100%)',
        'linear-gradient(135deg, #162427 0%, #56A5DD 100%)'
    ];
    return gradients[id % gradients.length];
}

function formatPrice(price) { return `$${parseFloat(price).toFixed(2)}`; }

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Agotado', class: 'out-of-stock', icon: 'times-circle', color: '#ef4444' };
    if (stock < 10) return { text: `Solo ${stock} disponibles`, class: 'low-stock', icon: 'exclamation-circle', color: '#f59e0b' };
    return { text: 'En Stock', class: 'in-stock', icon: 'check-circle', color: '#10b981' };
}

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarProductos() {
    try {
        const productos = await StoreAPI.obtenerProductos();
        allProducts = productos.map(p => ({
            id: p.ID_PRODUCTO || p.id_producto,
            name: p.NOMBRE_PRODUCTO || p.nombre,
            model: p.MODELO || p.modelo,
            description: p.DESCRIPCION || p.descripcion || '',
            price: parseFloat(p.PRECIO_VENTA || p.precio_venta),
            stock: parseInt(p.stock_disponible || p.stock),
            brand: p.NOMBRE_MARCA || p.nombre_marca,
            brandId: p.ID_MARCA || p.id_marca,
            categories: Array.isArray(p.categorias) ? p.categorias.join(', ') : (p.categorias || 'General'),
            categoryIds: Array.isArray(p.categoria_ids) ? p.categoria_ids : [],
            warranty: p.garantia_meses,
            imageUrl: p.imagen_url || p.IMAGEN_URL || null
        }));
        return allProducts;
    } catch (error) {
        showNotification('Error al cargar productos', 'error');
        return [];
    }
}

async function cargarCategorias() {
    try {
        categories = await StoreAPI.obtenerCategorias();
        return categories;
    } catch (error) { return []; }
}

async function cargarMarcas() {
    try {
        brands = await StoreAPI.obtenerMarcas();
        return brands;
    } catch (error) { return []; }
}

// ============================================
// SKELETON LOADERS
// ============================================
function renderSkeletons(count = 8) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line w-40"></div>
                <div class="skeleton-line w-80 h-20"></div>
                <div class="skeleton-line w-60"></div>
                <div class="skeleton-line w-full" style="margin-top:1rem; height:36px; border-radius:8px;"></div>
            </div>
        </div>`).join('');
}

// ============================================
// HERO STATS
// ============================================
function updateHeroStats() {
    const statProductos = document.getElementById('statProductos');
    const statMarcas = document.getElementById('statMarcas');
    const statCategorias = document.getElementById('statCategorias');
    if (statProductos) animateCount(statProductos, allProducts.length);
    if (statMarcas) animateCount(statMarcas, brands.length);
    if (statCategorias) animateCount(statCategorias, categories.length);
}

function animateCount(el, target) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 40);
}

// ============================================
// CATEGORIES GRID
// ============================================
const CATEGORY_ICONS = {
    'laptop': 'fa-laptop', 'computadora': 'fa-desktop', 'impresora': 'fa-print',
    'tablet': 'fa-tablet-alt', 'smartphone': 'fa-mobile-alt', 'celular': 'fa-mobile-alt',
    'monitor': 'fa-desktop', 'teclado': 'fa-keyboard', 'mouse': 'fa-mouse',
    'audio': 'fa-headphones', 'camara': 'fa-camera', 'almacenamiento': 'fa-hdd',
    'red': 'fa-network-wired', 'gaming': 'fa-gamepad', 'accesorio': 'fa-plug'
};

function getCategoryIcon(name) {
    const lower = (name || '').toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return 'fa-box';
}

function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid || categories.length === 0) {
        if (grid) grid.closest('.categories-section').style.display = 'none';
        return;
    }
    grid.innerHTML = categories.map((cat, i) => {
        const count = allProducts.filter(p => p.categoryIds.includes(cat.ID_CATEGORIA)).length;
        return `
            <div class="category-card" style="animation: fadeInUp 0.4s ease-out ${i * 0.05}s both" onclick="filterByCategory('${cat.ID_CATEGORIA}')">
                <div class="category-card-icon">
                    <i class="fas ${getCategoryIcon(cat.NOMBRE_CATEGORIA)}"></i>
                </div>
                <span class="category-card-name">${cat.NOMBRE_CATEGORIA}</span>
                <span class="category-card-count">${count} productos</span>
            </div>`;
    }).join('');
}

function filterByCategory(catId) {
    currentFilter.category = catId;
    document.getElementById('categoryFilter').value = catId;
    filterProducts();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// PRICE RANGE
// ============================================
function initPriceRange() {
    const prices = allProducts.map(p => p.price).filter(Boolean);
    if (prices.length === 0) return;
    const maxPrice = Math.ceil(Math.max(...prices) / 100) * 100;
    const slider = document.getElementById('priceRange');
    if (!slider) return;
    slider.max = maxPrice;
    slider.value = maxPrice;
    currentFilter.maxPrice = Infinity;
    updatePriceLabel(maxPrice, maxPrice);

    // Visual fill update
    slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) ${pct}%, rgba(86,165,221,0.2) ${pct}%)`;
        updatePriceLabel(val, maxPrice);
        currentFilter.maxPrice = val >= maxPrice ? Infinity : val;
        filterProducts();
    });
}

function updatePriceLabel(val, max) {
    const label = document.getElementById('priceRangeLabel');
    if (!label) return;
    label.textContent = val >= max ? 'Todos' : `$${parseFloat(val).toFixed(0)}`;
}

// ============================================
// SEARCH SUGGESTIONS
// ============================================
function initSearchSuggestions() {
    const input = document.getElementById('searchInput');
    const suggestionsEl = document.getElementById('searchSuggestions');
    if (!input || !suggestionsEl) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { suggestionsEl.classList.remove('active'); return; }
        const matches = allProducts.filter(p =>
            p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))
        ).slice(0, 6);

        if (matches.length === 0) { suggestionsEl.classList.remove('active'); return; }
        suggestionsEl.innerHTML = matches.map(p => `
            <div class="suggestion-item" onclick="selectSuggestion('${p.name.replace(/'/g, "\\'")}')">
                <i class="fas fa-search"></i>
                <span><strong>${highlight(p.name, q)}</strong> ${p.brand ? `<small style="color:var(--text-muted)">— ${p.brand}</small>` : ''}</span>
            </div>`).join('');
        suggestionsEl.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsEl.contains(e.target)) {
            suggestionsEl.classList.remove('active');
        }
    });
}

function highlight(text, query) {
    const re = new RegExp(`(${query})`, 'gi');
    return text.replace(re, '<mark style="background:rgba(86,165,221,0.3);border-radius:2px;color:inherit;">$1</mark>');
}

function selectSuggestion(name) {
    const input = document.getElementById('searchInput');
    const suggestionsEl = document.getElementById('searchSuggestions');
    input.value = name;
    suggestionsEl.classList.remove('active');
    currentFilter.search = name;
    filterProducts();
}

// ============================================
// RENDERIZADO DE PRODUCTOS
// ============================================
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem; display:block;"></i>
                <h3 style="color: var(--text-secondary);">No se encontraron productos</h3>
                <p style="color: var(--text-muted);">Intenta con otros filtros de búsqueda</p>
            </div>`;
        return;
    }

    grid.innerHTML = products.map(product => {
        const stockStatus = getStockStatus(product.stock);
        const gradient = getGradientForProduct(product.id);
        const imageContent = product.imageUrl
            ? `<img src="http://localhost:3001/${product.imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain; padding: 1.5rem;" loading="lazy" />`
            : `<div style="font-size: 4rem; color: rgba(255,255,255,0.2);"><i class="fas fa-laptop"></i></div>`;

        return `
            <div class="product-card animate-fade-in-up" data-product-id="${product.id}" onclick="openProductModal(${product.id})">
                <div class="product-card-image" style="background: ${product.imageUrl ? 'rgba(255,255,255,0.05)' : gradient};">
                    ${imageContent}
                    <div class="product-card-stock ${stockStatus.class}">
                        <i class="fas fa-${stockStatus.icon}"></i>
                        ${stockStatus.text}
                    </div>
                </div>
                
                <div class="product-card-content">
                    <div class="product-card-category">
                        <i class="fas fa-tag"></i> ${product.categories || 'General'}
                    </div>
                    <h3 class="product-card-title">${product.name}</h3>
                    <p class="product-card-model">Modelo: ${product.model}</p>
                    
                    <div class="product-card-footer" style="flex-direction: column; align-items: flex-start; gap: 0.75rem; border-top: none; padding-top: 0; margin-top: 0.5rem;">
                        <div class="product-card-price">
                            <span class="product-card-price-current">${formatPrice(product.price)}</span>
                        </div>
                        <div class="product-card-actions" style="display: flex; gap: 0.5rem; width: 100%;">
                            <button class="btn btn-outline btn-sm" style="flex: 1; border: 1px solid rgba(86,165,221,0.4); color: var(--primary);" onclick="event.stopPropagation(); openProductModal(${product.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <button class="btn btn-primary btn-sm" style="flex: 1; background: linear-gradient(135deg, #56A5DD, #145D90); color: white; border: none; box-shadow: none;" onclick="event.stopPropagation(); addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i> Comprar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    document.getElementById('productCount').innerHTML = `Mostrando <strong>${products.length}</strong> productos`;
}

// ============================================
// PRODUCT DETAIL MODAL
// ============================================
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const stockStatus = getStockStatus(product.stock);

    document.getElementById('modalCategory').textContent = product.categories || 'General';
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalModel').textContent = `Modelo: ${product.model}`;
    document.getElementById('modalPrice').textContent = formatPrice(product.price);
    const descEl = document.getElementById('modalDescription');
    descEl.textContent = product.description || 'Sin descripción disponible.';
    const warrantyEl = document.getElementById('modalWarranty');
    warrantyEl.innerHTML = product.warranty
        ? `<i class="fas fa-shield-alt"></i> Garantía: ${product.warranty} meses`
        : '';
    document.getElementById('modalStock').innerHTML = `<span style="color:${stockStatus.color}"><i class='fas fa-${stockStatus.icon}'></i> ${stockStatus.text}</span>`;

    const imageWrap = document.getElementById('modalImageWrap');
    imageWrap.innerHTML = product.imageUrl
        ? `<img src="http://localhost:3001/${product.imageUrl}" alt="${product.name}" />`
        : `<div class="modal-image-placeholder"><i class="fas fa-laptop"></i></div>`;

    const buyBtn = document.getElementById('modalBuyBtn');
    buyBtn.onclick = () => { addToCart(product.id); closeProductModal(); };
    buyBtn.disabled = product.stock === 0;

    const waBtn = document.getElementById('modalWhatsapp');
    waBtn.href = `https://wa.me/50588888888?text=Hola! Estoy interesado en el producto: ${encodeURIComponent(product.name)} - Precio: ${formatPrice(product.price)}`;

    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// VIEW TOGGLE (GRID / LIST)
// ============================================
function initViewToggle() {
    const grid = document.getElementById('productsGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    if (!gridBtn || !listBtn) return;

    gridBtn.addEventListener('click', () => {
        isGridView = true;
        grid.classList.remove('list-view');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    });

    listBtn.addEventListener('click', () => {
        isGridView = false;
        grid.classList.add('list-view');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    });
}

// ============================================
// FILTRADO
// ============================================
function filterProducts() {
    let filtered = [...allProducts];
    if (currentFilter.category) filtered = filtered.filter(p => p.categoryIds.includes(parseInt(currentFilter.category)));
    if (currentFilter.brand) filtered = filtered.filter(p => p.brandId == currentFilter.brand);
    if (currentFilter.tag === 'stock') filtered = filtered.filter(p => p.stock > 0);
    if (currentFilter.maxPrice !== Infinity) filtered = filtered.filter(p => p.price <= currentFilter.maxPrice);
    if (currentFilter.search) {
        const search = currentFilter.search.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) || p.model.toLowerCase().includes(search) || (p.brand && p.brand.toLowerCase().includes(search))
        );
    }

    switch (currentFilter.sort) {
        case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
        case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'newest': default: filtered.sort((a, b) => b.id - a.id);
    }
    renderProducts(filtered);
}

// ============================================
// CARRITO
// ============================================
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) existingItem.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    updateCart();
    showNotification(`${product.name} agregado al carrito`, 'success');
    // Bounce animation
    const cartEl = document.getElementById('cartButton');
    if (cartEl) {
        cartEl.classList.remove('bounce');
        void cartEl.offsetWidth;
        cartEl.classList.add('bounce');
    }
}

function updateCart() {
    localStorage.setItem('compunic_cart', JSON.stringify(cart));
    document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function showNotification(message, type = 'info') {
    const el = document.createElement('div');
    const bg = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)';
    el.style.cssText = `position:fixed;top:100px;right:20px;background:${bg};color:white;padding:1rem 1.5rem;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10000;animation:slideInRight 0.3s ease-out;display:flex;align-items:center;gap:.75rem;font-weight:600;max-width:320px;`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ============================================
// BACK TO TOP
// ============================================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Skeleton loaders while loading
    renderSkeletons(8);

    try {
        await Promise.all([cargarProductos(), cargarCategorias(), cargarMarcas()]);

        // Populate filters
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.ID_CATEGORIA; option.textContent = cat.NOMBRE_CATEGORIA;
            document.getElementById('categoryFilter').appendChild(option);
        });
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.ID_MARCA; option.textContent = brand.NOMBRE_MARCA;
            document.getElementById('brandFilter').appendChild(option);
        });

        // Render
        renderProducts(allProducts);
        renderCategoriesGrid();
        updateHeroStats();
        updateCart();
        initPriceRange();
        initSearchSuggestions();
        initViewToggle();
        initBackToTop();

    } catch (error) {
        document.getElementById('productsGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--error); margin-bottom: 1rem; display:block;"></i>
                <h3 style="color: var(--text-secondary);">Error al cargar productos</h3>
                <p style="color: var(--text-muted);">Por favor, intenta recargar la página</p>
            </div>`;
    }

    // Event listeners
    document.getElementById('categoryFilter').addEventListener('change', (e) => { currentFilter.category = e.target.value; filterProducts(); });
    document.getElementById('brandFilter').addEventListener('change', (e) => { currentFilter.brand = e.target.value; filterProducts(); });
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter.tag = e.currentTarget.dataset.filter;
            filterProducts();
        });
    });

    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { currentFilter.search = e.target.value; filterProducts(); }, 300);
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => { currentFilter.sort = e.target.value; filterProducts(); });
    document.getElementById('cartButton').addEventListener('click', () => { window.location.href = 'cart.html'; });

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeProductModal);
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeProductModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProductModal(); });
});

// Extra animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: translateX(20px); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
`;
document.head.appendChild(style);
