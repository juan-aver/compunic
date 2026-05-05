/* ============================================
   COMPUNIC STORE - CONFIRMACIÓN DE PEDIDO
   ============================================ */

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatPrice(price) {
    return `$${parseFloat(price).toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-NI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// CARGAR DETALLES DEL PEDIDO
// ============================================

async function loadOrderDetails() {
    try {
        // Obtener ID del pedido de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');

        if (!orderId) {
            // Intentar obtener del localStorage
            const lastOrderId = localStorage.getItem('last_order_id');
            const lastOrderNumber = localStorage.getItem('last_order_number');

            if (lastOrderId && lastOrderNumber) {
                document.getElementById('orderNumber').textContent = lastOrderNumber;
                // Limpiar localStorage
                localStorage.removeItem('last_order_id');
                localStorage.removeItem('last_order_number');
                return;
            }

            // Si no hay datos, redirigir a la tienda
            window.location.href = 'index.html';
            return;
        }

        // Obtener detalles del pedido desde la API
        const pedido = await StoreAPI.obtenerPedido(orderId);

        if (!pedido) {
            throw new Error('Pedido no encontrado');
        }

        // Generar número de pedido
        const numeroPedido = `PED-${new Date(pedido.FECHA_VENTA).toISOString().slice(0, 10).replace(/-/g, '')}-${String(pedido.ID_VENTA).padStart(4, '0')}`;

        // Mostrar número de pedido
        document.getElementById('orderNumber').textContent = numeroPedido;

        // Renderizar detalles
        renderOrderDetails(pedido);

    } catch (error) {
        console.error('Error al cargar detalles del pedido:', error);

        // Mostrar número de pedido del localStorage si está disponible
        const lastOrderNumber = localStorage.getItem('last_order_number');
        if (lastOrderNumber) {
            document.getElementById('orderNumber').textContent = lastOrderNumber;
            localStorage.removeItem('last_order_number');
        }
    }
}

function renderOrderDetails(pedido) {
    const detailsContainer = document.getElementById('orderDetails');

    let html = `
        <div class="detail-row">
            <span class="label">Fecha:</span>
            <span class="value">${formatDate(pedido.FECHA_VENTA)}</span>
        </div>
        <div class="detail-row">
            <span class="label">Cliente:</span>
            <span class="value">${pedido.NOMBRE_CLIENTE}</span>
        </div>
        <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">${pedido.EMAIL}</span>
        </div>
        <div class="detail-row">
            <span class="label">Teléfono:</span>
            <span class="value">${pedido.TELEFONO}</span>
        </div>
    `;

    if (pedido.DIRECCION) {
        html += `
            <div class="detail-row">
                <span class="label">Dirección:</span>
                <span class="value">${pedido.DIRECCION}</span>
            </div>
        `;
    }

    // Productos
    if (pedido.productos && pedido.productos.length > 0) {
        html += `
            <div class="detail-section">
                <h3>Productos</h3>
        `;

        pedido.productos.forEach(producto => {
            html += `
                <div class="product-item">
                    <span class="name">${producto.NOMBRE_PRODUCTO}</span>
                    <span class="qty">x${producto.cantidad}</span>
                    <span class="price">${formatPrice(producto.subtotal)}</span>
                </div>
            `;
        });

        html += `
            </div>
            <div class="detail-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <span class="label" style="font-size: 1.1rem; font-weight: 600;">Total:</span>
                <span class="value" style="font-size: 1.25rem; color: var(--primary); font-weight: 700;">${formatPrice(pedido.TOTAL)}</span>
            </div>
        `;
    } else {
        html += `
            <div class="detail-row" style="margin-top: 1rem;">
                <span class="label" style="font-size: 1.1rem; font-weight: 600;">Total:</span>
                <span class="value" style="font-size: 1.25rem; color: var(--primary); font-weight: 700;">${formatPrice(pedido.TOTAL)}</span>
            </div>
        `;
    }

    detailsContainer.innerHTML = html;
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadOrderDetails();
});
