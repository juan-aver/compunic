/* ============================================
   COMPUNIC STORE - CARRITO DE COMPRAS
   ============================================ */

// ============================================
// ESTADO DEL CARRITO
// ============================================
let cart = [];

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function getGradientForProduct(id) {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    return gradients[id % gradients.length];
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================

function loadCart() {
    const savedCart = localStorage.getItem('compunic_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
    renderCart();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('compunic_cart', JSON.stringify(cart));
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    // Validar cantidad
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > item.stock) {
        showNotification(`Solo hay ${item.stock} unidades disponibles`, 'warning');
        return;
    }

    item.quantity = newQuantity;
    saveCart();
    renderCart();
    updateCartCount();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    updateCartCount();
    showNotification('Producto eliminado del carrito', 'info');
}

function clearCart() {
    if (cart.length === 0) return;

    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
        showNotification('Carrito vaciado', 'info');
    }
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
        subtotal: subtotal,
        shipping: 0, // Envío gratis
        total: subtotal
    };
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

// ============================================
// RENDERIZADO
// ============================================

function renderCart() {
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const cartItemsList = document.getElementById('cartItemsList');

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartContent.style.display = 'grid';

    // Renderizar items
    cartItemsList.innerHTML = cart.map(item => {
        const gradient = getGradientForProduct(item.id);
        const stockWarning = item.stock < 10 ? 'low-stock' : '';

        // Determinar si mostrar imagen o placeholder
        let imageContent;
        if (item.imageUrl) {
            imageContent = `<img src="http://localhost:3001/${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`;
        } else {
            imageContent = `<i class="fas fa-laptop"></i>`;
        }

        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-image" style="background: ${item.imageUrl ? '#f0f0f0' : gradient};">
                    ${imageContent}
                </div>
                
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>Modelo: ${item.model || 'N/A'}</p>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-stock ${stockWarning}">
                        ${item.stock > 0 ? `Stock: ${item.stock} disponibles` : 'Sin stock'}
                    </div>
                </div>
                
                <div class="cart-item-quantity">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">
                        Subtotal: ${formatPrice(item.price * item.quantity)}
                    </div>
                </div>
                
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    // Actualizar resumen
    const totals = calculateTotals();
    document.getElementById('itemCount').textContent = cart.length;
    document.getElementById('subtotal').textContent = formatPrice(totals.subtotal);
    document.getElementById('total').textContent = formatPrice(totals.total);
}

// ============================================
// NOTIFICACIONES
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success)' :
        type === 'error' ? 'var(--error)' :
            type === 'warning' ? 'var(--warning)' :
                'var(--info)';

    const icon = type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
            type === 'warning' ? 'exclamation-triangle' :
                'info-circle';

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
    `;

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    // Botón de vaciar carrito
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);

    // Botón de checkout
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'warning');
            return;
        }
        window.location.href = 'checkout.html';
    });

    // Botón del carrito en navbar
    document.getElementById('cartButton').addEventListener('click', () => {
        // Ya estamos en el carrito, no hacer nada
    });
});

// Animación adicional
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(20px); }
    }
`;
document.head.appendChild(style);
