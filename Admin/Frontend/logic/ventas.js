/**
 * @file ventas.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
console.log("!!! VENTAS MODULE LOADED !!!");

let itemsVenta = [];

function agregarItemVentaNew() {
    console.log('🔵 DEBUG: agregarItemVentaNew() LLAMADA');
    const selProd = document.getElementById('producto-select');
    const idProd = selProd.value;
    const nombreProd = selProd.options[selProd.selectedIndex]?.text;
    const cant = parseInt(document.getElementById('cantidad-venta').value);
    const precio = parseFloat(document.getElementById('precio-unitario').value);
    const descuento = parseFloat(document.getElementById('descuento-unitario').value) || 0;
    const garantiaDesc = document.getElementById('garantia-input').value;
    const garantiaId = document.getElementById('garantia-id').value;

    const stockDisponible = parseInt(selProd.options[selProd.selectedIndex]?.getAttribute('data-stock') || 0);

    console.log('📦 Producto:', idProd, nombreProd, 'Cant:', cant, 'Stock:', stockDisponible);

    if (!idProd || !cant || cant <= 0 || isNaN(precio) || precio < 0) {
        return alert('Por favor seleccione un producto y cantidades válidas.');
    }

    const existingItem = itemsVenta.find(i => i.id_producto === idProd);
    let cantidadTotalSolicitada = cant;

    if (existingItem) {
        cantidadTotalSolicitada += existingItem.cantidad;
    }

    if (cantidadTotalSolicitada > stockDisponible) {
        return alert(`❌ Error: No hay suficiente stock. Stock disponible: ${stockDisponible}. Intentas vender: ${cantidadTotalSolicitada}`);
    }

    if (existingItem) {
        existingItem.cantidad += cant;
        existingItem.subtotal = (existingItem.cantidad * existingItem.precio_unitario) - (existingItem.descuento * existingItem.cantidad);
    } else {
        const imagenUrl = selProd.options[selProd.selectedIndex]?.getAttribute('data-imagen') || '';
        itemsVenta.push({
            id_producto: idProd,
            nombre: nombreProd,
            cantidad: cant,
            precio_unitario: precio,
            descuento: descuento,
            garantia_desc: garantiaDesc,
            garantia_id: garantiaId,
            stock: stockDisponible,
            imagen_url: imagenUrl,
            subtotal: (cant * precio) - (cant * descuento)
        });
    }

    console.log('📊 Items en venta:', itemsVenta);
    renderizarItemsVentaNew();

    document.getElementById('cantidad-venta').value = '1';
    document.getElementById('descuento-unitario').value = '0.00';
    selProd.value = '';
    document.getElementById('precio-unitario').value = '0.00';
    document.getElementById('garantia-input').value = '';
}

function renderizarItemsVentaNew() {
    const container = document.getElementById('cart-table-body');
    const subtotalDisplay = document.getElementById('subtotal-venta-display');
    const ivaDisplay = document.getElementById('iva-venta-display');
    const totalDisplay = document.getElementById('total-venta-display');
    if (!container) return;

    container.innerHTML = '';
    let subtotal = 0;

    if (itemsVenta.length === 0) {
        container.innerHTML = '<div class="cart-empty-message"><i class="fas fa-shopping-cart"></i><p>No hay productos en el detalle de la venta.</p></div>';
    } else {
        itemsVenta.forEach((item, index) => {
            subtotal += item.subtotal;
            const imgUrl = item.imagen_url || '';

            const card = document.createElement('div');
            card.className = 'cart-item-card';
            const imgPath = imgUrl && imgUrl.startsWith('http') ? imgUrl : `${SERVER_URL}/${imgUrl}`;
            card.innerHTML = `
                ${imgUrl
                    ? `<img src="${imgPath}" class="cart-item-img" alt="">`
                    : `<div class="cart-item-img-placeholder"><i class="fas fa-box-open"></i></div>`
                }
                <div class="cart-item-details">
                    <p class="cart-item-name" title="${item.nombre}">${item.nombre}</p>
                    <div class="cart-item-price-row">
                        C$${item.precio_unitario.toFixed(2)} × ${item.cantidad} = <span class="price-highlight">C$${item.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-item-controls">
                            <button class="qty-btn" onclick="actualizarCantidadVenta(${index}, ${item.cantidad - 1})">−</button>
                            <input class="qty-input" type="number" min="1" value="${item.cantidad}" onchange="actualizarCantidadVenta(${index}, this.value)">
                            <button class="qty-btn" onclick="actualizarCantidadVenta(${index}, ${item.cantidad + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="eliminarItemVenta(${index})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    if (subtotalDisplay) subtotalDisplay.textContent = `C$${subtotal.toFixed(2)}`;
    if (ivaDisplay) ivaDisplay.textContent = `C$${iva.toFixed(2)}`;
    if (totalDisplay) totalDisplay.textContent = `C$${total.toFixed(2)}`;
}

// =========================================
// VENTAS POS - Product Grid + Click-to-Add
// =========================================
function renderVentasPOSGrid() {
    // Empieza la magia ✨

    const grid = document.getElementById('ventas-products-grid');
    if (!grid) return;

    fetch(`${API_BASE}/productos`)
        .then(r => r.json())
        .then(productos => {
            grid.innerHTML = '';
            if (!productos || productos.length === 0) {
                grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-box-open"></i><p>No hay productos disponibles.</p></div>';
                return;
            }

            window._ventasPOSProductos = productos;

            productos.forEach(p => {
                const nombre = p.NOMBRE_PRODUCTO ?? p.nombre ?? 'Sin nombre';
                const precioVenta = parseFloat(p.PRECIO_VENTA ?? p.precio_venta ?? 0);
                const stock = Number(p.stock ?? p.STOCK ?? 0) || 0;
                const imagenUrl = p.imagen_url || p.IMAGEN_URL || '';
                const garantiaDesc = p.garantia_desc ?? p.GARANTIA_DESC ?? '';
                const garantiaId = p.ID_GARANTIA_TIPO ?? p.id_garantia_tipo ?? '';
                const idProducto = p.ID_PRODUCTO ?? p.id_producto ?? '';

                const card = document.createElement('div');
                card.className = 'ventas-pos-product-card';
                card.dataset.searchText = nombre.toLowerCase();
                const imgPath = imagenUrl && imagenUrl.startsWith('http') ? imagenUrl : `${SERVER_URL}/${imagenUrl}`;
                card.innerHTML = `
                    ${imagenUrl
                        ? `<img src="${imgPath}" alt="${nombre}">`
                        : `<div class="pos-card-placeholder"><i class="fas fa-box-open"></i></div>`
                    }
                    <div class="pos-card-body">
                        <p class="pos-card-name" title="${nombre}">${nombre}</p>
                        <span class="pos-card-price">C$${precioVenta.toFixed(2)}</span>
                        <span class="pos-card-stock ${stock === 0 ? 'stock-zero' : ''}"><i class="fas fa-cube"></i> ${stock}</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    if (stock <= 0) {
                        alert('Este producto no tiene stock disponible.');
                        return;
                    }
                    agregarDesdeCardVenta({
                        id_producto: idProducto,
                        nombre: nombre,
                        precio_unitario: precioVenta,
                        descuento: 0,
                        imagen_url: imagenUrl,
                        garantia_desc: garantiaDesc,
                        garantia_id: garantiaId
                    });
                });

                grid.appendChild(card);
            });

            initVentasPOSSearch();
        })
        .catch(err => {
            console.error('Error loading POS products:', err);
            grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar productos.</p></div>';
        });
}

function agregarDesdeCardVenta(producto) {
    const existingIdx = itemsVenta.findIndex(i => i.id_producto == producto.id_producto);
    if (existingIdx >= 0) {
        itemsVenta[existingIdx].cantidad += 1;
        itemsVenta[existingIdx].subtotal = itemsVenta[existingIdx].cantidad * (itemsVenta[existingIdx].precio_unitario - itemsVenta[existingIdx].descuento);
    } else {
        itemsVenta.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            cantidad: 1,
            precio_unitario: producto.precio_unitario,
            descuento: producto.descuento || 0,
            imagen_url: producto.imagen_url || '',
            garantia_desc: producto.garantia_desc || '',
            garantia_id: producto.garantia_id || '',
            subtotal: producto.precio_unitario - (producto.descuento || 0)
        });
    }

    renderizarItemsVentaNew();

    const badge = document.getElementById('ventas-cart-badge');
    if (badge) {
        badge.textContent = itemsVenta.length;
        badge.style.display = itemsVenta.length > 0 ? 'inline' : 'none';
    }
}

function initVentasPOSSearch() {
    const searchInput = document.getElementById('ventas-pos-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.ventas-pos-product-card');
        cards.forEach(card => {
            const match = !query || (card.dataset.searchText && card.dataset.searchText.includes(query));
            card.style.display = match ? '' : 'none';
        });
    });
}

function actualizarCantidadVenta(index, nuevaCantidad) {
    const cant = parseInt(nuevaCantidad);
    if (cant <= 0) {
        alert("La cantidad debe ser mayor a 0");
        renderizarItemsVentaNew();
        return;
    }

    const item = itemsVenta[index];
    if (item.stock !== undefined && cant > item.stock) {
        alert(`❌ Error: No hay suficiente stock. Stock disponible: ${item.stock}.`);
        renderizarItemsVentaNew();
        return;
    }

    itemsVenta[index].cantidad = cant;
    itemsVenta[index].subtotal = (itemsVenta[index].cantidad * itemsVenta[index].precio_unitario) - (itemsVenta[index].cantidad * itemsVenta[index].descuento);
    renderizarItemsVentaNew();
}

function eliminarItemVenta(index) {
    if (confirm("¿Eliminar este producto de la venta?")) {
        itemsVenta.splice(index, 1);
        renderizarItemsVentaNew();
    }
}

// ============================================================================
// HACER FUNCIONES GLOBALES
// ============================================================================
window.agregarItemVentaNew = agregarItemVentaNew;
window.actualizarCantidadVenta = actualizarCantidadVenta;
window.eliminarItemVenta = eliminarItemVenta;
window.guardarVenta = guardarVenta;
console.log('✅ Funciones de ventas registradas globalmente');

window.inicializarBotonVentas = function () {
    console.log('🔧 Intentando inicializar botón de ventas...');
    const btnAdd = document.getElementById('btn-add-line');
    if (btnAdd) {
        console.log('✅ Botón encontrado, asignando evento...');
        btnAdd.onclick = function (e) {
            e.preventDefault();
            console.log('🎯 Click capturado en botón +');
            window.agregarItemVentaNew();
        };
        console.log('✅ Evento onclick asignado correctamente');
    } else {
        console.warn('⚠️ Botón btn-add-line no encontrado');
    }
};

window.inicializarFechaVenta = function () {
    console.log('📅 Inicializando campo de fecha de venta automáticamente...');

    const fechaDisplay = document.getElementById('fecha-venta-display');
    const fechaHidden = document.getElementById('fecha-venta');

    if (fechaDisplay && fechaHidden) {
        const fechaActual = new Date();
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const anio = fechaActual.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${anio}`;
        const fechaISO = fechaActual.toISOString().split('T')[0];

        fechaDisplay.value = fechaFormateada;
        fechaHidden.value = fechaISO;

        console.log('✅ Fecha configurada automáticamente:', fechaFormateada, '(Backend:', fechaISO, ')');
    } else {
        console.warn('⚠️ Campos de fecha no encontrados');
    }
};

function guardarVenta() {
    const idCliente = document.getElementById('cliente-select').value;

    let idVendedor = document.getElementById('vendedor-id')?.value;
    if (!idVendedor) {
        const session = Auth.getSession();
        idVendedor = session?.id_vendedor;
    }

    const fecha = document.getElementById('fecha-venta').value;
    const factura = document.getElementById('factura-input').value;

    if (!idCliente || !idVendedor || !fecha) return alert('Complete los datos de la venta.');
    if (itemsVenta.length === 0) return alert('Agregue al menos un producto.');

    const fechaActual = new Date();
    const fechaActualStr = fechaActual.toISOString().split('T')[0];

    if (fecha !== fechaActualStr) {
        return alert('❌ Error: Solo se pueden realizar ventas en la fecha actual. La fecha debe ser: ' + new Date(fechaActualStr).toLocaleDateString());
    }

    const payload = {
        id_cliente: idCliente,
        id_vendedor: idVendedor,
        fecha: fecha,
        factura: factura,
        items: itemsVenta.map(item => ({
            idProducto: item.id_producto,
            cantidad: item.cantidad,
            precioUnitario: item.precio_unitario,
            subtotal: item.subtotal
        }))
    };

    fetch(`${API_BASE}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar venta');
            return data;
        })
        .then(data => {
            alert('✅ Venta registrada con éxito ID: ' + data.id_venta);
            itemsVenta = [];
            document.getElementById('sale-form').reset();
            const fecha = new Date();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            document.getElementById('factura-input').value = `FAC-${fecha.getFullYear()}${random}`;
            if (typeof window.inicializarFechaVenta === 'function') {
                window.inicializarFechaVenta();
            }
            renderizarItemsVentaNew();
            cargarVentas();
        })
        .catch(err => {
            console.error(err);
            alert('❌ Error: ' + err.message);
        });
}

// Eventos para Ventas
document.addEventListener('DOMContentLoaded', () => {
    const inputFacturaVenta = document.getElementById('factura-input');
    if (inputFacturaVenta) {
        const fecha = new Date();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        inputFacturaVenta.value = `FAC-${fecha.getFullYear()}${random}`;
    }

    const selectProducto = document.getElementById('producto-select');
    if (selectProducto) {
        selectProducto.addEventListener('change', function () {
            const option = this.options[this.selectedIndex];
            const precio = option.getAttribute('data-precio');
            const garantiaDesc = option.getAttribute('data-garantia-desc');
            const garantiaId = option.getAttribute('data-garantia-id');

            document.getElementById('precio-unitario').value = precio || '0.00';
            document.getElementById('garantia-input').value = garantiaDesc || '';
            document.getElementById('garantia-id').value = garantiaId || '';
        });
    }
});

// Función para cargar el historial de ventas
function cargarVentas() {
    fetch(`${API_BASE}/ventas`)
        .then(res => res.json())
        .then(ventas => {
            const tbody = document.getElementById("sales-record-table");
            if (!tbody) return;
            tbody.innerHTML = "";

            if (ventas.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay ventas registradas.</td></tr>`;
                return;
            }

            ventas.forEach(venta => {
                const fila = document.createElement("tr");
                const fechaFormateada = new Date(venta.FECHA).toLocaleDateString();
                const total = parseFloat(venta.TOTAL).toFixed(2);

                fila.innerHTML = `
                    <td class="font-medium primary-color">#${venta.ID_VENTA}</td>
                    <td>${venta.FACTURA}</td>
                    <td>${fechaFormateada}</td>
                    <td>${venta.NOMBRE_CLIENTE}</td>
                    <td>${venta.NOMBRE_VENDEDOR}</td>
                    <td class="text-right font-bold text-green-600">$${total}</td>
                    <td class="text-center">
                        <button type="button" class="btn-icon btn-view" style="width: auto; padding: 0 12px; font-weight: 500;" title="Ver Factura" onclick="window.open('views/factura_venta.html?id=${venta.ID_VENTA}', '_blank')">
                            Ver Factura
                        </button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(err => {
            console.error('Error al cargar ventas:', err);
            const tbody = document.getElementById("sales-record-table");
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">Error de conexión: ${err.message}</td></tr>`;
        });
}

// ========================================================================================================
// POBLAR SELECTS VENTAS
// ========================================================================================================

function poblarSelectClientes() {
    fetch(`${API_BASE}/clientes`)
        .then(res => res.json())
        .then(clientes => {
            const select = document.getElementById('cliente-select');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione un Cliente</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.ID_CLIENTE;
                option.textContent = `${cliente.NOMBRE} ${cliente.APELLIDO} - ${cliente.NOMBRE_EMPRESA || ''}`.trim().replace(/ - $/, '');
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar clientes:', err));
}

function poblarSelectVendedores() {
    fetch(`${API_BASE}/vendedores`)
        .then(res => res.json())
        .then(vendedores => {
            const select = document.getElementById('vendedor-select');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione un Vendedor</option>';
            vendedores.forEach(vendedor => {
                const option = document.createElement('option');
                option.value = vendedor.ID_VENDEDOR;
                option.textContent = `${vendedor.NOMBRE} ${vendedor.APELLIDO}`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar vendedores:', err));
}

function poblarSelectProductos() {
    fetch(`${API_BASE}/productos`)
        .then(res => res.json())
        .then(productos => {
            const select = document.getElementById('producto-select');
            if (!select) return;
            select.innerHTML = '<option value="" selected>Seleccione</option>';
            productos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.ID_PRODUCTO || p.id_producto;
                option.textContent = `${p.nombre} - ${p.modelo}`;
                option.setAttribute('data-precio', p.precio_venta);
                const garantiaDesc = p.garantia_meses || "Sin Garantía";
                const garantiaId = (p._raw && (p._raw.ID_GARANTIAS || p._raw.id_garantias)) || "";
                option.setAttribute('data-garantia-desc', garantiaDesc);
                option.setAttribute('data-garantia-id', garantiaId);
                const stock = Number(p.stock ?? p.stock_actual_calculado ?? p.STOCK ?? 0) || 0;
                option.setAttribute('data-stock', stock);
                option.setAttribute('data-imagen', p.imagen_url || '');
                option.textContent = `${p.nombre} - ${p.modelo} (Stock: ${stock})`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar productos:', err));
}

function poblarSelectGarantias() {
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const select = document.getElementById('garantia-select');
            if (!select) return;
            select.innerHTML = '<option value="" selected>Por Defecto</option>';
            garantias.forEach(g => {
                const option = document.createElement('option');
                option.value = g.ID_GARANTIA;
                option.textContent = `${g.NOMBRE_TIPO} - ${g.DURACION_MESES} Meses`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar garantías:', err));
}
