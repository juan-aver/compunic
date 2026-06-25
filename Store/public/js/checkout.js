/* ============================================
   COMPUNIC STORE — CHECKOUT MEJORADO CON PAGOS
   ============================================ */

// ============================================
// ESTADO GLOBAL
// ============================================
let cart = [];
let maxPoints = 0;
let pointsUsed = 0;
let selectedMethod = null;

// Resolver CHECKOUT_API_ROOT de forma dinámica según el entorno
const CHECKOUT_API_ROOT = (() => {
    if (window.location.origin && window.location.origin.startsWith('http')) {
        return window.location.origin;
    }
    return 'http://localhost:3001';
})();

// Helpers seguros para localStorage (evitan que excepciones de seguridad tiren el script)
function safeGetItem(key, fallback = null) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch (e) {
        console.warn('localStorage no está disponible:', e);
        return fallback;
    }
}
function safeSetItem(key, val) {
    try {
        localStorage.setItem(key, val);
    } catch (e) {
        console.warn('localStorage no está disponible para guardar:', e);
    }
}
function safeRemoveItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('localStorage no está disponible para borrar:', e);
    }
}
// Datos bancarios por método de pago
const PAYMENT_DATA = {
    'Transferencia Bancaria': {
        icon: 'exchange-alt',
        banco: 'BANPRO',
        cuenta: '1001-020-502133-2',
        titular: 'COMPUNIC S.A.',
        tipo: 'Cuenta Corriente en Córdobas',
        nota: 'En el campo "concepto / referencia" escribe tu número de pedido.'
    },
    'Pago en Efectivo': {
        icon: 'money-bill-wave',
        nota: 'Nos contactaremos contigo para coordinar el horario de entrega o retiro en tienda. Paga en efectivo al retirar tu pedido.',
        isCod: true
    }
};

// ============================================
// SELECCIÓN DE MÉTODO DE PAGO
// ============================================

function selectPayment(element) {
    // Quitar selección previa
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;

    selectedMethod = element.dataset.method;
    renderPaymentInstructions(selectedMethod);

    // Formulario interactivo según método
    const dirGroup = document.getElementById('direccionGroup');
    const dirInput = document.getElementById('direccion');
    const refGroup = document.getElementById('referenciaGroup');
    const refInput = document.getElementById('referencia');

    if (selectedMethod === 'Pago en Efectivo') {
        if (dirGroup) dirGroup.style.display = 'none';
        if (dirInput) dirInput.value = '';
        if (refGroup) refGroup.style.display = 'none';
        if (refInput) {
            refInput.value = '';
            refInput.required = false;
        }
    } else {
        if (dirGroup) dirGroup.style.display = 'block';
        if (refGroup) refGroup.style.display = 'block';
        if (refInput) {
            refInput.required = true;
        }
    }
}

function renderPaymentInstructions(method) {
    const container = document.getElementById('paymentInstructions');
    const data = PAYMENT_DATA[method];
    if (!data) { container.classList.remove('visible'); return; }

    if (data.isCod) {
        container.innerHTML = `
            <div class="pi-header">
                <i class="fas fa-info-circle" style="color:#f97316; font-size:1.2rem;"></i>
                <h4>Información de entrega</h4>
            </div>
            <div class="pi-note">
                <i class="fas fa-truck"></i>
                <span>${data.nota}</span>
            </div>`;
    } else {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total    = Math.max(0, subtotal - pointsUsed);
        const deposito = total * 0.5;

        container.innerHTML = `
            <div class="pi-header">
                <span class="badge">Datos de pago</span>
                <h4>${method}</h4>
            </div>
            <div class="pay-deposit-info" style="background:#eff6ff; border:1px solid #bfdbfe; padding:12px; border-radius:8px; margin-bottom:12px; font-weight:700; color:#1e40af; display:flex; justify-content:space-between; align-items:center;">
                <span>Monto del depósito (50%):</span>
                <span style="font-size:1.2rem; color:#1d4ed8;">C$ ${deposito.toFixed(2)}</span>
            </div>
            <div class="pi-rows">
                <div class="pi-row">
                    <span class="pi-label">🏦 Banco</span>
                    <span class="pi-value">${data.banco}</span>
                </div>
                <div class="pi-row">
                    <span class="pi-label">📁 Tipo</span>
                    <span class="pi-value">${data.tipo}</span>
                </div>
                <div class="pi-row">
                    <span class="pi-label">👤 Titular</span>
                    <span class="pi-value">${data.titular}</span>
                </div>
                <div class="pi-row">
                    <span class="pi-label">💳 Número de cuenta</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="pi-value account" id="accountNumber">${data.cuenta}</span>
                        <button class="copy-btn" onclick="copyAccount()" title="Copiar número">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
            </div>
            <div class="pi-note">
                <i class="fas fa-info-circle" style="color:#92400e; margin-top:2px;"></i>
                <span>${data.nota}</span>
            </div>`;
    }
    container.classList.add('visible');
}

function copyAccount() {
    const el = document.getElementById('accountNumber');
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
        showNotification('¡Número de cuenta copiado! 📋', 'success');
    });
}

// Hacer la función global para que el HTML pueda accederla
window.selectPayment = selectPayment;
window.copyAccount   = copyAccount;

// ============================================
// CARGA DE DATOS
// ============================================

function formatPrice(price) {
    return 'C$' + parseFloat(price).toFixed(2);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = totalItems;
}

function loadCart() {
    const savedCart = safeGetItem('compunic_cart');
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

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = pointsUsed * 0.10;
    const total    = Math.max(0, subtotal - discount);

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total').textContent    = formatPrice(total);

    if (pointsUsed > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountAmount').textContent = `-${formatPrice(discount)}`;
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
}

async function loadUserData() {
    if (typeof StoreAuth !== 'undefined' && StoreAuth.isLoggedIn()) {
        try {
            const res  = await StoreAuth.fetchProtected(`${CHECKOUT_API_ROOT}/api/store/auth/me`);
            const data = await res.json();

            if (data.success && data.cliente) {
                document.getElementById('nombre').value   = `${data.cliente.NOMBRE} ${data.cliente.APELLIDO || ''}`.trim();
                document.getElementById('email').value    = data.cliente.EMAIL;
                document.getElementById('telefono').value = data.cliente.TELEFONO;

                // Actualizar datos locales para asegurar que tenemos la cédula
                safeSetItem('compunic_store_user', JSON.stringify({
                    id: data.cliente.ID_CLIENTE,
                    nombre: data.cliente.NOMBRE,
                    apellido: data.cliente.APELLIDO,
                    email: data.cliente.EMAIL,
                    cedula: data.cliente.CEDULA,
                    puntos: data.cliente.PUNTOS
                }));

                maxPoints = parseInt(data.cliente.PUNTOS) || 0;
                if (maxPoints > 0) {
                    document.getElementById('pointsSection').style.display = 'block';
                    document.getElementById('availablePoints').textContent      = maxPoints;
                    document.getElementById('availablePointsMoney').textContent  = (maxPoints * 0.10).toFixed(2);

                    document.getElementById('usePoints').addEventListener('change', e => {
                        if (e.target.checked) {
                            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            pointsUsed = Math.min(maxPoints, subtotal * 10);
                        } else {
                            pointsUsed = 0;
                        }
                        renderSummary();
                    });
                }
            }
        } catch (e) {
            console.error('Error cargando datos de usuario:', e);
        }
    }
}

// ============================================
// VALIDACIÓN
// ============================================

function validateForm(formData) {
    const errors = [];

    if (!formData.nombre || formData.nombre.trim().length < 3)
        errors.push('El nombre debe tener al menos 3 caracteres');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email))
        errors.push('Email inválido');

    const telRegex = /^[0-9]{8}$/;
    if (!formData.telefono || !telRegex.test(formData.telefono))
        errors.push('El teléfono debe tener 8 dígitos');

    if (!selectedMethod) {
        errors.push('Selecciona un método de pago');
    } else if (selectedMethod === 'Transferencia Bancaria') {
        const refInput = document.getElementById('referencia');
        if (!refInput || !refInput.value.trim()) {
            errors.push('El número de comprobante o referencia bancaria es obligatorio');
        }
    }

    return errors;
}

// ============================================
// PROCESAR PEDIDO
// ============================================

async function procesarPedido(datosCliente, referencia) {
    const productos = cart.map(item => ({
        id_producto: item.id,
        cantidad:    item.quantity,
        precio_unitario: item.price
    }));

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total    = Math.max(0, subtotal - pointsUsed);

    const headers = { 'Content-Type': 'application/json' };
    if (typeof StoreAuth !== 'undefined' && StoreAuth.isLoggedIn()) {
        headers['Authorization'] = `Bearer ${StoreAuth.getToken()}`;
    }

    const payload = {
        cliente:      datosCliente,
        productos,
        total,
        puntos_usados: pointsUsed,
        metodo_pago:   selectedMethod,
        referencia:    referencia
    };

    const response = await fetch(`${CHECKOUT_API_ROOT}/api/store/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    return await response.json();
}

// ============================================
// NOTIFICACIONES
// ============================================

function showNotification(message, type = 'info') {
    const colors = {
        success: '#22c55e', error: '#ef4444',
        warning: '#f97316', info: '#6366f1'
    };
    const icons = {
        success: 'check-circle', error: 'exclamation-circle',
        warning: 'exclamation-triangle', info: 'info-circle'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position:fixed; top:90px; right:20px;
        background:${colors[type] || colors.info};
        color:white; padding:1rem 1.5rem;
        border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15);
        z-index:10001; animation:slideInRight 0.3s ease-out;
        display:flex; align-items:center; gap:0.75rem;
        font-weight:600; max-width:400px; font-size:0.9rem;
    `;
    notification.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i>${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        notification.style.transition = 'all 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadUserData();

    // Seleccionar primer método por defecto
    const firstMethod = document.querySelector('.payment-method');
    if (firstMethod) selectPayment(firstMethod);

    const form          = document.getElementById('checkoutForm');
    const submitBtn     = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const user = typeof StoreAuth !== 'undefined' ? StoreAuth.getUser() : null;

        const datosCliente = {
            nombre:    document.getElementById('nombre').value.trim(),
            email:     document.getElementById('email').value.trim(),
            telefono:  document.getElementById('telefono').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            cedula:    user ? user.cedula : null
        };

        const errors = validateForm(datosCliente);
        if (errors.length > 0) {
            showNotification(errors.join('. '), 'error');
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = Math.max(0, subtotal - pointsUsed);
        if (total > 10000) {
            const user = typeof StoreAuth !== 'undefined' ? StoreAuth.getUser() : null;
            if (!user || !user.cedula) {
                showNotification("Para compras mayores a C$ 10,000 es obligatorio tener la Cédula registrada en su perfil.", 'error');
                return;
            }
        }

        submitBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        const refVal = document.getElementById('referencia')?.value.trim() || null;

        try {
            const resultado = await procesarPedido(datosCliente, refVal);

            if (resultado.success) {
                // Guardar datos para página de confirmación
                safeSetItem('last_order_id',     resultado.id_venta);
                safeSetItem('last_order_number', resultado.numero_pedido);
                safeSetItem('last_order_method', selectedMethod);
                safeSetItem('last_order_total',  resultado.total);

                // Limpiar carrito
                safeRemoveItem('compunic_cart');

                // Ir a confirmación
                window.location.href = `order-confirmation.html?order=${resultado.id_venta}`;
            } else {
                throw new Error(resultado.error || 'Error al procesar el pedido');
            }
        } catch (error) {
            loadingOverlay.style.display = 'none';
            submitBtn.disabled = false;

            let msg = 'Error al procesar el pedido. ';
            if (error.message.includes('Stock insuficiente')) msg += error.message;
            else if (error.message.includes('Email'))        msg += 'Verifica tu email.';
            else msg += 'Por favor, intenta nuevamente.';

            showNotification(msg, 'error');
        }
    });
});
