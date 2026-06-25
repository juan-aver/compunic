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
        Swal.fire({icon: 'warning', title: 'Datos Inválidos', text: 'Por favor seleccione un producto y cantidades válidas.'});
        return;
    }

    const existingItem = itemsVenta.find(i => i.id_producto === idProd);
    let cantidadTotalSolicitada = cant;

    if (existingItem) {
        cantidadTotalSolicitada += existingItem.cantidad;
    }

    if (cantidadTotalSolicitada > stockDisponible) {
        Swal.fire({icon: 'error', title: 'Stock Insuficiente', text: `No hay suficiente stock. Stock disponible: ${stockDisponible}. Intentas vender: ${cantidadTotalSolicitada}`});
        return;
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

    // Re-render POS grid (uses cache) to keep card badges and overlays updated
    if (typeof renderVentasPOSGrid === 'function') {
        renderVentasPOSGrid(false);
    }
}

// =========================================
// VENTAS POS - Product Grid + Click-to-Add
// =========================================
function renderVentasPOSGrid(forceFetch = false) {
    const grid = document.getElementById('ventas-products-grid');
    if (!grid) return;

    if (!forceFetch && window._ventasPOSProductos && window._ventasPOSProductos.length > 0) {
        renderGridHTML(window._ventasPOSProductos);
        return;
    }

    fetch(`${API_BASE}/productos`)
        .then(r => r.json())
        .then(productos => {
            window._ventasPOSProductos = productos;
            renderGridHTML(productos);
        })
        .catch(err => {
            console.error('Error loading POS products:', err);
            grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar productos.</p></div>';
        });
}

function renderGridHTML(productos) {
    const grid = document.getElementById('ventas-products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (!productos || productos.length === 0) {
        grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-box-open"></i><p>No hay productos disponibles.</p></div>';
        return;
    }

    productos.forEach(p => {
        const activo = p.activo !== undefined ? Number(p.activo) : (p.ACTIVO !== undefined ? Number(p.ACTIVO) : 1);
        if (activo === 0) return; // Skip deactivated products
        
        const nombre = p.NOMBRE_PRODUCTO ?? p.nombre ?? 'Sin nombre';
        const precioVenta = parseFloat(p.PRECIO_VENTA ?? p.precio_venta ?? 0);
        const stock = Number(p.stock ?? p.STOCK ?? 0) || 0;
        const imagenUrl = p.imagen_url || p.IMAGEN_URL || '';
        const garantiaDesc = p.garantia_desc ?? p.GARANTIA_DESC ?? '';
        const garantiaId = p.ID_GARANTIA_TIPO ?? p.id_garantia_tipo ?? '';
        const idProducto = p.ID_PRODUCTO ?? p.id_producto ?? '';

        // Check if this item is in the cart
        const cartItem = itemsVenta.find(i => i.id_producto == idProducto);
        const qtyInCart = cartItem ? cartItem.cantidad : 0;

        const card = document.createElement('div');
        card.className = 'ventas-pos-product-card';
        if (qtyInCart > 0) {
            card.classList.add('in-cart');
        }
        card.dataset.searchText = nombre.toLowerCase();
        const imgPath = imagenUrl && imagenUrl.startsWith('http') ? imagenUrl : `${SERVER_URL}/${imagenUrl}`;
        
        let badgeHtml = '';
        let overlayHtml = '';
        
        if (qtyInCart > 0) {
            badgeHtml = `<div class="pos-card-cart-badge">${qtyInCart}</div>`;
            overlayHtml = `
                <div class="pos-card-qty-overlay" onclick="event.stopPropagation()">
                    <button class="pos-card-qty-btn btn-dec" onclick="decrementarDesdeCard(event, ${idProducto})">−</button>
                    <span class="pos-card-qty-val">${qtyInCart}</span>
                    <button class="pos-card-qty-btn btn-inc" onclick="incrementarDesdeCard(event, ${idProducto}, ${stock})">+</button>
                </div>
            `;
        }

        card.innerHTML = `
            ${badgeHtml}
            ${imagenUrl
                ? `<img src="${imgPath}" alt="${nombre}">`
                : `<div class="pos-card-placeholder"><i class="fas fa-box-open"></i></div>`
            }
            <div class="pos-card-body">
                <p class="pos-card-name" title="${nombre}">${nombre}</p>
                <span class="pos-card-price">C$${precioVenta.toFixed(2)}</span>
                <span class="pos-card-stock ${stock === 0 ? 'stock-zero' : ''}"><i class="fas fa-cube"></i> ${stock}</span>
            </div>
            ${overlayHtml}
        `;

        if (qtyInCart === 0) {
            card.addEventListener('click', () => {
                if (stock <= 0) {
                    Swal.fire({icon: 'warning', title: 'Agotado', text: 'Este producto no tiene stock disponible.'});
                    return;
                }
                agregarDesdeCardVenta({
                    id_producto: idProducto,
                    nombre: nombre,
                    precio_unitario: precioVenta,
                    descuento: 0,
                    imagen_url: imagenUrl,
                    garantia_desc: garantiaDesc,
                    garantia_id: garantiaId,
                    stock: stock
                });
            });
        }

        grid.appendChild(card);
    });

    initVentasPOSSearch();
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
            stock: producto.stock,
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

function decrementarDesdeCard(e, idProducto) {
    if (e) e.stopPropagation();
    const existingIdx = itemsVenta.findIndex(i => i.id_producto == idProducto);
    if (existingIdx >= 0) {
        const currentQty = itemsVenta[existingIdx].cantidad;
        if (currentQty <= 1) {
            Swal.fire({
                title: '¿Remover producto?',
                text: '¿Deseas remover este producto del carrito?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, remover',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    itemsVenta.splice(existingIdx, 1);
                    renderizarItemsVentaNew();
                    const badge = document.getElementById('ventas-cart-badge');
                    if (badge) {
                        badge.textContent = itemsVenta.length;
                        badge.style.display = itemsVenta.length > 0 ? 'inline' : 'none';
                    }
                }
            });
            return;
        } else {
            itemsVenta[existingIdx].cantidad -= 1;
            itemsVenta[existingIdx].subtotal = itemsVenta[existingIdx].cantidad * (itemsVenta[existingIdx].precio_unitario - itemsVenta[existingIdx].descuento);
        }
        renderizarItemsVentaNew();
        
        const badge = document.getElementById('ventas-cart-badge');
        if (badge) {
            badge.textContent = itemsVenta.length;
            badge.style.display = itemsVenta.length > 0 ? 'inline' : 'none';
        }
    }
}

function incrementarDesdeCard(e, idProducto, stock) {
    if (e) e.stopPropagation();
    const existingIdx = itemsVenta.findIndex(i => i.id_producto == idProducto);
    if (existingIdx >= 0) {
        const currentQty = itemsVenta[existingIdx].cantidad;
        if (currentQty >= stock) {
            Swal.fire({icon: 'error', title: 'Límite de Stock', text: `No hay suficiente stock. Stock disponible: ${stock}.`});
            return;
        }
        itemsVenta[existingIdx].cantidad += 1;
        itemsVenta[existingIdx].subtotal = itemsVenta[existingIdx].cantidad * (itemsVenta[existingIdx].precio_unitario - itemsVenta[existingIdx].descuento);
        renderizarItemsVentaNew();
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

function cancelarVenta() {
    if (itemsVenta.length === 0) {
        document.getElementById('sale-form').reset();
        return;
    }
    
    if (confirm("¿Estás seguro de que deseas cancelar la venta actual? Se perderán todos los productos agregados.")) {
        itemsVenta = [];
        renderizarItemsVentaNew();
        document.getElementById('sale-form').reset();
        
        // Resetear badge
        const badge = document.getElementById('ventas-cart-badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

// ============================================================================
// HACER FUNCIONES GLOBALES
// ============================================================================
window.agregarItemVentaNew = agregarItemVentaNew;
window.actualizarCantidadVenta = actualizarCantidadVenta;
window.eliminarItemVenta = eliminarItemVenta;
window.cancelarVenta = cancelarVenta;
window.guardarVenta = guardarVenta;
window.decrementarDesdeCard = decrementarDesdeCard;
window.incrementarDesdeCard = incrementarDesdeCard;
window.renderVentasPOSGrid = renderVentasPOSGrid;
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
    const clienteSelectVal = document.getElementById('cliente-select').value;
    const esOcasional = clienteSelectVal === '__ocasional__';
    const idCliente = esOcasional ? null : clienteSelectVal;
    const nombreClienteOcasional = esOcasional
        ? (document.getElementById('cliente-ocasional-nombre')?.value?.trim() || 'Cliente Ocasional')
        : null;

    if (!esOcasional && !idCliente) {
        Swal.fire({icon: 'warning', title: 'Atención', text: 'Seleccione un cliente o elija Cliente Ocasional.'});
        return;
    }

    let idVendedor = document.getElementById('vendedor-id')?.value;
    if (!idVendedor) {
        const session = Auth.getSession();
        idVendedor = session?.id_empleado;
    }

    const fecha = document.getElementById('fecha-venta').value;
    const factura = document.getElementById('factura-input').value;

    if (!idVendedor || !fecha) {
        Swal.fire({icon: 'warning', title: 'Faltan datos', text: 'Complete los datos de la venta.'});
        return;
    }
    if (itemsVenta.length === 0) {
        Swal.fire({icon: 'warning', title: 'Carrito vacío', text: 'Agregue al menos un producto.'});
        return;
    }

    const fechaActual = new Date();
    const fechaActualStr = fechaActual.toISOString().split('T')[0];

    if (fecha !== fechaActualStr) {
        Swal.fire({icon: 'error', title: 'Fecha Inválida', text: 'Solo se pueden realizar ventas en la fecha actual. La fecha debe ser: ' + new Date(fechaActualStr).toLocaleDateString()});
        return;
    }

    // Validación de > 10,000
    const subtotalVenta = itemsVenta.reduce((acc, it) => acc + it.subtotal, 0);
    const totalVenta = subtotalVenta * 1.15;
    if (totalVenta > 10000 && esOcasional) {
        Swal.fire({icon: 'warning', title: 'Límite de venta excedido', text: "Para ventas mayores a C$ 10,000 debe seleccionar un cliente registrado (que tenga Cédula y Teléfono)."});
        return;
    }

    // 1. Fetch available serials for all items before showing modal
    Promise.all(itemsVenta.map(item => 
        fetch(`${API_BASE}/series/${item.id_producto}/disponibles`, {
            headers: { 'x-user-id': localStorage.getItem('compunic_admin_id') }
        }).then(r => r.json()).catch(() => [])
    )).then(results => {
        let formHtml = '<div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">';
        
        itemsVenta.forEach((item, idx) => {
            const seriesDisponibles = results[idx];
            let selectHtml = '';
            
            if (seriesDisponibles.length > 0) {
                selectHtml = `<div style="font-size: 11px; margin-bottom: 5px;">Seleccione hasta ${item.cantidad} serie(s):</div>`;
                selectHtml += `<div class="series-checkbox-list" id="series_list_${idx}" style="max-height: 100px; overflow-y: auto; border: 1px solid var(--border-color, #ddd); padding: 5px; border-radius: 4px; margin-bottom: 5px; background: var(--bg-input, #fff);">`;
                
                seriesDisponibles.forEach(s => {
                    const condicionStyle = s.CONDICION === 'Nuevo' ? 'color: #27ae60;' : 'color: #e67e22;';
                    selectHtml += `<label style="display: block; margin-bottom: 3px; font-size: 12px; cursor: pointer;">
                        <input type="checkbox" value="${s.NUMERO_SERIE}" class="cb-serie-${idx}" onchange="checkMaxSeries(this, ${item.cantidad}, ${idx})">
                        ${s.NUMERO_SERIE} <span style="font-size: 10px; ${condicionStyle}">(${s.CONDICION})</span>
                    </label>`;
                });
                
                selectHtml += `</div>`;
            } else {
                selectHtml = `<div style="font-size: 11px; color: #e67e22; margin-bottom: 5px;">⚠️ No hay series registradas para este producto.</div>`;
            }
            
            formHtml += `<div style="margin-bottom: 15px; padding: 10px; background: var(--bg-card-alt, #f8f9fa); border-radius: 5px;">
                <label style="font-size:13px; display:block; margin-bottom:5px; font-weight: bold; color: var(--text-color, #333);">
                    ${item.nombre} <span style="color: #666; font-weight: normal;">(Cant: ${item.cantidad})</span>
                </label>
                ${selectHtml}
                <div style="font-size: 11px; margin-bottom: 3px;">O escriba manualmente (separados por coma):</div>
                <input type="text" id="serial_manual_${idx}" class="form-input" style="width:100%; font-size: 12px;" placeholder="Ej: SN123, SN124...">
            </div>`;
        });
        formHtml += '</div>';

        const overlay = document.createElement('div');
        overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
        
        const modal = document.createElement('div');
        modal.style = 'background:var(--bg-card, white);padding:20px;border-radius:8px;width:450px;max-width:90%;color:var(--text-color, black); box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
        modal.innerHTML = `
            <h3 style="margin-top:0; margin-bottom: 15px; color: var(--text-color, #333);"><i class="fas fa-barcode"></i> Asignar Series a la Venta</h3>
            ${formHtml}
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
                <button id="btnCancelSerial" class="btn-cancel" style="padding:8px 15px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;">Cancelar</button>
                <button id="btnSaveSerial" class="btn-register" style="padding:8px 15px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;"><i class="fas fa-save"></i> Confirmar y Guardar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('btnCancelSerial').onclick = () => {
            document.body.removeChild(overlay);
        };

        document.getElementById('btnSaveSerial').onclick = () => {
            itemsVenta.forEach((item, idx) => {
                // Get checked checkboxes
                const checkboxes = document.querySelectorAll(`.cb-serie-${idx}:checked`);
                const selectedSeries = Array.from(checkboxes).map(cb => cb.value);
                
                // Get manual input
                const manualInput = document.getElementById('serial_manual_' + idx).value.trim();
                const manualSeries = manualInput ? manualInput.split(',').map(s => s.trim()).filter(s => s) : [];
                
                // Combine and remove duplicates
                const allSeries = [...new Set([...selectedSeries, ...manualSeries])].join(', ');
                
                item.numeros_serie = allSeries;
            });
            document.body.removeChild(overlay);
            
            const payload = {
                id_cliente: idCliente,
                nombre_cliente_ocasional: nombreClienteOcasional,
                id_empleado: idVendedor,
                fecha: fecha,
                factura: factura,
                items: itemsVenta.map(item => ({
                    idProducto: item.id_producto,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio_unitario,
                    subtotal: item.subtotal,
                    numeros_serie: item.numeros_serie
                }))
            };

            fetch(`${API_BASE}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || data.error || 'Error al guardar venta');
                    return data;
                })
                .then(data => {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Venta completada!',
                        text: 'Venta registrada con éxito ID: ' + data.id_venta,
                        confirmButtonText: 'Genial'
                    });
                    itemsVenta = [];
                    document.getElementById('sale-form').reset();
                    const fecha = new Date();
                    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    document.getElementById('factura-input').value = `FAC-${fecha.getFullYear()}${random}`;
                    if (typeof window.inicializarFechaVenta === 'function') {
                        window.inicializarFechaVenta();
                    }
                    // Reset cliente ocasional
                    const wrapper = document.getElementById('cliente-ocasional-wrapper');
                    if (wrapper) wrapper.style.display = 'none';
                    renderizarItemsVentaNew();
                    cargarVentas();
                    if (typeof window.renderVentasPOSGrid === 'function') {
                        window.renderVentasPOSGrid(true);
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire({icon: 'error', title: 'Error al procesar', text: err.message});
                });
        };
    }).catch(err => {
        console.error("Error fetching series", err);
        Swal.fire({icon: 'error', title: 'Error', text: "Ocurrió un error al preparar el registro de series."});
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

window._allVentas = [];
window._filteredVentas = [];
window._ventasCurrentPage = 1;
window._ventasPerPage = 15;

// Función para cargar el historial de ventas
function cargarVentas() {
    fetch(`${API_BASE}/ventas`)
        .then(res => res.json())
        .then(ventas => {
            window._allVentas = ventas;
            window._filteredVentas = ventas;
            renderVentasPaginated();
        })
        .catch(err => {
            console.error('Error al cargar ventas:', err);
            const tbody = document.getElementById("sales-record-table");
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">Error de conexión: ${err.message}</td></tr>`;
        });
}

function renderVentasPaginated() {
    const tbody = document.getElementById("sales-record-table");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (window._filteredVentas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay ventas registradas.</td></tr>`;
        renderVentasPaginationControls(0);
        return;
    }

    const startIndex = (window._ventasCurrentPage - 1) * window._ventasPerPage;
    const endIndex = startIndex + window._ventasPerPage;
    const paginatedData = window._filteredVentas.slice(startIndex, endIndex);

    paginatedData.forEach(venta => {
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

    renderVentasPaginationControls(window._filteredVentas.length);
}

function renderVentasPaginationControls(totalItems) {
    const controlsContainer = document.getElementById('ventas-pagination');
    if (!controlsContainer) return;
    
    const totalPages = Math.ceil(totalItems / window._ventasPerPage);
    let html = '';
    
    if (totalPages > 1) {
        html += `<button onclick="window.changeVentasPage(${window._ventasCurrentPage - 1})" ${window._ventasCurrentPage === 1 ? 'disabled' : ''} class="btn-card-detail" style="margin-right: 10px;">&laquo; Anterior</button>`;
        html += `<span style="margin: 0 10px; font-weight: bold;">Página ${window._ventasCurrentPage} de ${totalPages}</span>`;
        html += `<button onclick="window.changeVentasPage(${window._ventasCurrentPage + 1})" ${window._ventasCurrentPage === totalPages ? 'disabled' : ''} class="btn-card-detail" style="margin-left: 10px;">Siguiente &raquo;</button>`;
    } else if (totalItems > 0) {
        html += `<span style="margin: 0 10px; color: #666;">Mostrando todas las ${totalItems} ventas</span>`;
    }
    controlsContainer.innerHTML = html;
}

window.changeVentasPage = function(page) {
    window._ventasCurrentPage = page;
    renderVentasPaginated();
};

function initVentasSearch() {
    const searchInput = document.getElementById('buscar_venta');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        window._ventasCurrentPage = 1;
        
        if (!term) {
            window._filteredVentas = [...window._allVentas];
        } else {
            window._filteredVentas = window._allVentas.filter(venta => {
                const searchStr = `${venta.FACTURA || ''} ${venta.NOMBRE_CLIENTE || ''} ${venta.ID_VENTA || ''}`.toLowerCase();
                return searchStr.includes(term);
            });
        }
        renderVentasPaginated();
    });
}

function clearVentasFilters() {
    const searchInput = document.getElementById('buscar_venta');
    if (searchInput) searchInput.value = '';
    window._filteredVentas = [...window._allVentas];
    window._ventasCurrentPage = 1;
    renderVentasPaginated();
}
window.clearVentasFilters = clearVentasFilters;

// ========================================================================================================
// POBLAR SELECTS VENTAS
// ========================================================================================================

// Mostrar/ocultar campo de nombre para cliente ocasional
function toggleClienteOcasional(valor) {
    const wrapper = document.getElementById('cliente-ocasional-wrapper');
    if (wrapper) {
        wrapper.style.display = valor === '__ocasional__' ? '' : 'none';
    }
}
window.toggleClienteOcasional = toggleClienteOcasional;

function poblarSelectClientes() {
    fetch(`${API_BASE}/clientes`)
        .then(res => res.json())
        .then(clientes => {
            const select = document.getElementById('cliente-select');
            if (!select) return;
            // Mantener opción inicial y opción ocasional
            select.innerHTML = '<option value="" disabled selected>Seleccione un Cliente</option><option value="__ocasional__">👤 Cliente Ocasional / Sin Registro</option>';
            clientes.forEach(cliente => {
                const isBaja = (cliente.ACTIVO === 0 || cliente.activo === 0 || cliente.ACTIVO === '0' || cliente.activo === '0');
                if (isBaja) return;
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
                const activo = p.activo !== undefined ? Number(p.activo) : (p.ACTIVO !== undefined ? Number(p.ACTIVO) : 1);
                if (activo === 0) return; // Skip deactivated products
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
                const activo = g.ACTIVO !== undefined ? g.ACTIVO : (g.activo !== undefined ? g.activo : 1);
                if (Number(activo) === 0) return;

                const option = document.createElement('option');
                option.value = g.ID_GARANTIA;
                option.textContent = `${g.NOMBRE_TIPO} - ${g.DURACION_MESES} Meses`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar garantías:', err));
}
