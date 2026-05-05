/* ============================================
   COMPUNIC STORE - CHECKOUT
   ============================================ */

// ============================================
// ESTADO
// ============================================
let cart = [];

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

// ============================================
// CARGAR DATOS
// ============================================

function loadCart() {
    const savedCart = localStorage.getItem('compunic_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    renderSummary();
    updateCartCount();
}

function renderSummary() {
    const summaryItems = document.getElementById('summaryItems');

    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div class="summary-item-info">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-qty">Cantidad: ${item.quantity}</div>
            </div>
            <div class="summary-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Sin envío por ahora

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total').textContent = formatPrice(total);
}

// ============================================
// VALIDACIÓN DEL FORMULARIO
// ============================================

function validateForm(formData) {
    const errors = [];

    // Validar nombre
    if (!formData.nombre || formData.nombre.trim().length < 3) {
        errors.push('El nombre debe tener al menos 3 caracteres');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push('Email inválido');
    }

    // Validar teléfono (8 dígitos)
    const telefonoRegex = /^[0-9]{8}$/;
    if (!formData.telefono || !telefonoRegex.test(formData.telefono)) {
        errors.push('El teléfono debe tener 8 dígitos');
    }

    return errors;
}

// ============================================
// PROCESAR PEDIDO
// ============================================

async function procesarPedido(datosCliente) {
    try {
        // Preparar datos de productos para el backend
        const productos = cart.map(item => ({
            id_producto: item.id,
            cantidad: item.quantity,
            precio_unitario: item.price
        }));

        // Calcular total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Enviar pedido al backend
        const resultado = await StoreAPI.crearPedido(datosCliente, productos, total);

        return resultado;

    } catch (error) {
        console.error('Error al procesar pedido:', error);
        throw error;
    }
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
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        max-width: 400px;
    `;

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    const form = document.getElementById('checkoutForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener datos del formulario
        const datosCliente = {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            direccion: document.getElementById('direccion').value.trim()
        };

        // Validar formulario
        const errors = validateForm(datosCliente);
        if (errors.length > 0) {
            showNotification(errors.join('. '), 'error');
            return;
        }

        // Deshabilitar botón y mostrar loading
        submitBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        try {
            // Procesar pedido
            const resultado = await procesarPedido(datosCliente);

            if (resultado.success) {
                // Guardar ID de venta para la página de confirmación
                localStorage.setItem('last_order_id', resultado.id_venta);
                localStorage.setItem('last_order_number', resultado.numero_pedido);

                // Limpiar carrito
                localStorage.removeItem('compunic_cart');

                // Redirigir a confirmación
                window.location.href = `order-confirmation.html?order=${resultado.id_venta}`;
            } else {
                throw new Error(resultado.error || 'Error al procesar el pedido');
            }

        } catch (error) {
            console.error('Error:', error);
            loadingOverlay.style.display = 'none';
            submitBtn.disabled = false;

            let errorMessage = 'Error al procesar el pedido. ';
            if (error.message.includes('Stock insuficiente')) {
                errorMessage += error.message;
            } else if (error.message.includes('Email')) {
                errorMessage += 'Verifica tu email.';
            } else {
                errorMessage += 'Por favor, intenta nuevamente.';
            }

            showNotification(errorMessage, 'error');
        }
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
