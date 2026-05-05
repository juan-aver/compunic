/**
 * @file compras.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
let itemsCompra = [];

function cargarCompras() {
    fetch(`${API_BASE}/compras`)
        .then(r => r.json())
        .then(compras => {
            const tbody = document.getElementById('tablaCompras');
            if (!tbody) return;
            tbody.innerHTML = '';

            compras.forEach(c => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: black; font-weight: bold;">${c.NUMERO_FACTURA_PROVEEDOR}</span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: bold;">${c.proveedor}</td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="padding: 3px 8px; border-radius: 4px; background-color: ${c.meses_garantia > 0 ? 'rgba(40, 167, 69, 0.2)' : 'rgba(108, 117, 125, 0.2)'}; color: ${c.meses_garantia > 0 ? '#28a745' : '#6c757d'}; font-weight: bold;">
                            ${c.meses_garantia > 0 ? c.meses_garantia + ' Meses' : 'Sin Garantía'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">${new Date(c.FECHA_COMPRA).toLocaleDateString()}</td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">${c.items_count}</td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); color: black; font-weight: bold;">C$${parseFloat(c.TOTAL_COMPRA).toFixed(2)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <button class="btn btn-sm" style="background-color: rgba(23, 162, 184, 0.8); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; backdrop-filter: blur(4px); margin-right: 5px;" onclick="verDetalleCompra(${c.ID_COMPRA})">Ver Detalle</button>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <button class="btn btn-sm" style="background-color: rgba(40, 167, 69, 0.8); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; backdrop-filter: blur(4px);" onclick="verFactura(${c.ID_COMPRA})">Ver Factura</button>
                    </td>
                `;
                tbody.appendChild(fila);
            });

            if (document.getElementById('proveedor_compra')) {
                poblarSelectProveedoresCompra();
                poblarSelectProductosCompra();
                generarFacturaAutomatica();
            }
        })
        .catch(err => console.error('Error al cargar compras:', err));
}

function poblarSelectProveedoresCompra() {
    fetch(`${API_BASE}/proveedores`)
        .then(r => r.json())
        .then(arr => {
            const sel = document.getElementById('proveedor_compra');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])').forEach(o => o.remove());
            arr.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.ID_PROVEEDOR;
                opt.textContent = p.NOMBRE_EMPRESA;
                sel.appendChild(opt);
            });
        });
}

function poblarSelectProductosCompra() {
    // Si esto falla, probablemente sea la base de datos caída 💀

    fetch(`${API_BASE}/productos`)
        .then(r => r.json())
        .then(arr => {
            const sel = document.getElementById('producto_compra');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])').forEach(o => o.remove());
            arr.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.ID_PRODUCTO ?? p.id_producto;
                opt.dataset.nombre = p.NOMBRE_PRODUCTO ?? p.nombre;
                opt.dataset.imagen = p.imagen_url || p.IMAGEN_URL || '';
                opt.textContent = `${p.NOMBRE_PRODUCTO ?? p.nombre} (Stock: ${p.stock ?? 0})`;
                sel.appendChild(opt);
            });
        });
}

function agregarItemCompra() {
    const selProd = document.getElementById('producto_compra');
    const idProd = selProd.value;
    const nombreProd = selProd.options[selProd.selectedIndex]?.dataset.nombre;
    const cant = parseInt(document.getElementById('cantidad_compra').value);
    const precio = parseFloat(document.getElementById('precio_unitario_compra').value);
    const garantia = parseInt(document.getElementById('garantia_compra').value) || 0;

    if (!idProd || !cant || cant <= 0 || isNaN(precio) || precio < 0) {
        return alert('Por favor seleccione un producto y cantidades válidas.');
    }

    const existingItem = itemsCompra.find(i => i.id_producto === idProd);
    if (existingItem) {
        existingItem.cantidad += cant;
        existingItem.subtotal = existingItem.cantidad * existingItem.precio_unitario;
    } else {
        const imagenUrl = selProd.options[selProd.selectedIndex]?.dataset.imagen || '';
        itemsCompra.push({
            id_producto: idProd,
            nombre: nombreProd,
            cantidad: cant,
            precio_unitario: precio,
            meses_garantia: garantia,
            imagen_url: imagenUrl,
            subtotal: cant * precio
        });
    }

    renderizarItemsCompra();

    document.getElementById('cantidad_compra').value = '1';
    document.getElementById('precio_unitario_compra').value = '';
    document.getElementById('garantia_compra').value = '';
    selProd.value = '';
}

function renderizarItemsCompra() {
    const container = document.getElementById('tablaItemsCompra');
    const subtotalDisplay = document.getElementById('subtotalCompraDisplay');
    const ivaDisplay = document.getElementById('ivaCompraDisplay');
    const totalDisplay = document.getElementById('totalCompraDisplay');
    if (!container) return;

    container.innerHTML = '';
    let subtotal = 0;

    if (itemsCompra.length === 0) {
        container.innerHTML = '<div class="cart-empty-message"><i class="fas fa-shopping-cart"></i><p>No hay productos en el detalle de compra.</p></div>';
    } else {
        itemsCompra.forEach((item, index) => {
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
                            <button class="qty-btn" onclick="actualizarCantidadCompra(${index}, ${item.cantidad - 1})">−</button>
                            <input class="qty-input" type="number" min="1" value="${item.cantidad}" onchange="actualizarCantidadCompra(${index}, this.value)">
                            <button class="qty-btn" onclick="actualizarCantidadCompra(${index}, ${item.cantidad + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="eliminarItemCompra(${index})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <!-- Subtotal se removió para ganar espacio en diseño card -->
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
// COMPRAS POS - Product Grid + Popup + Cart
// =========================================
function renderComprasPOSGrid() {
    const grid = document.getElementById('compras-products-grid');
    if (!grid) return;

    fetch(`${API_BASE}/productos`)
        .then(r => r.json())
        .then(productos => {
            grid.innerHTML = '';
            if (!productos || productos.length === 0) {
                grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-box-open"></i><p>No hay productos disponibles.</p></div>';
                return;
            }

            productos.forEach(p => {
                const nombre = p.NOMBRE_PRODUCTO ?? p.nombre ?? 'Sin nombre';
                const precioCompra = parseFloat(p.PRECIO_COMPRA ?? p.precio_compra ?? 0);
                const stock = Number(p.stock ?? p.STOCK ?? 0) || 0;
                const imagenUrl = p.imagen_url || p.IMAGEN_URL || '';
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
                        <span class="pos-card-price">C$${precioCompra.toFixed(2)}</span>
                        <span class="pos-card-stock"><i class="fas fa-cube"></i> ${stock}</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    mostrarPopupCosto(idProducto, nombre, imagenUrl, precioCompra);
                });

                grid.appendChild(card);
            });

            initComprasPOSSearch();
        })
        .catch(err => {
            console.error('Error loading Compras POS products:', err);
            grid.innerHTML = '<div class="cart-empty-message"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar productos.</p></div>';
        });
}

function mostrarPopupCosto(idProducto, nombre, imagenUrl, precioCompra) {
    document.getElementById('popup_id_producto').value = idProducto;
    document.getElementById('popup_nombre_producto').value = nombre;
    document.getElementById('popup_imagen_producto').value = imagenUrl;
    document.getElementById('popup_cantidad').value = 1;
    document.getElementById('popup_costo').value = precioCompra > 0 ? precioCompra.toFixed(2) : '';
    document.getElementById('popup_garantia').value = 0;

    const title = document.getElementById('compraPopupTitle');
    if (title) title.innerHTML = `<i class="fas fa-box"></i> ${nombre}`;

    const popup = document.getElementById('compraPopupCosto');
    if (popup) popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
window.mostrarPopupCosto = mostrarPopupCosto;

function cerrarPopupCosto() {
    const popup = document.getElementById('compraPopupCosto');
    if (popup) popup.style.display = 'none';
    document.body.style.overflow = '';
}
window.cerrarPopupCosto = cerrarPopupCosto;

function confirmarAgregarCompra() {
    const idProducto = document.getElementById('popup_id_producto').value;
    const nombre = document.getElementById('popup_nombre_producto').value;
    const imagenUrl = document.getElementById('popup_imagen_producto').value;
    const cantidad = parseInt(document.getElementById('popup_cantidad').value) || 1;
    const precio = parseFloat(document.getElementById('popup_costo').value);
    const garantia = parseInt(document.getElementById('popup_garantia').value) || 0;

    if (isNaN(precio) || precio < 0) {
        return alert('Por favor ingrese un costo válido.');
    }

    const existing = itemsCompra.find(i => i.id_producto == idProducto);
    if (existing) {
        existing.cantidad += cantidad;
        existing.subtotal = existing.cantidad * existing.precio_unitario;
    } else {
        itemsCompra.push({
            id_producto: idProducto,
            nombre: nombre,
            cantidad: cantidad,
            precio_unitario: precio,
            meses_garantia: garantia,
            imagen_url: imagenUrl,
            subtotal: cantidad * precio
        });
    }

    renderizarItemsCompra();
    cerrarPopupCosto();

    const badge = document.getElementById('compras-cart-badge');
    if (badge) {
        badge.textContent = itemsCompra.length;
        badge.style.display = itemsCompra.length > 0 ? 'inline' : 'none';
    }
}
window.confirmarAgregarCompra = confirmarAgregarCompra;

function initComprasPOSSearch() {
    const searchInput = document.getElementById('compras-pos-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#compras-products-grid .ventas-pos-product-card');
        cards.forEach(card => {
            const match = !query || (card.dataset.searchText && card.dataset.searchText.includes(query));
            card.style.display = match ? '' : 'none';
        });
    });
}

function actualizarCantidadCompra(index, nuevaCantidad) {
    const cant = parseInt(nuevaCantidad);
    if (cant <= 0) {
        alert("La cantidad debe ser mayor a 0");
        renderizarItemsCompra();
        return;
    }
    itemsCompra[index].cantidad = cant;
    itemsCompra[index].subtotal = itemsCompra[index].cantidad * itemsCompra[index].precio_unitario;
    renderizarItemsCompra();
}

function eliminarItemCompra(index) {
    if (confirm("¿Eliminar este producto de la compra?")) {
        itemsCompra.splice(index, 1);
        renderizarItemsCompra();
    }
}

function guardarCompra() {
    const idProveedor = document.getElementById('proveedor_compra').value;
    const numeroFactura = document.getElementById('numero_factura').value.trim();

    if (!idProveedor) return alert('Seleccione un proveedor.');
    if (!numeroFactura) return alert('Ingrese el número de factura del proveedor.');
    if (itemsCompra.length === 0) return alert('Agregue al menos un producto.');

    const payload = {
        id_proveedor: idProveedor,
        numero_factura: numeroFactura,
        items: itemsCompra
    };

    fetch(`${API_BASE}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar compra');
            return data;
        })
        .then(data => {
            alert('✅ Compra registrada con éxito ID: ' + data.id_compra);
            itemsCompra = [];
            document.getElementById('formularioCompra').reset();
            generarFacturaAutomatica();
            renderizarItemsCompra();
            cargarCompras();
        })
        .catch(err => {
            console.error(err);
            alert('❌ Error: ' + err.message);
        });
}

function generarFacturaAutomatica() {
    const fecha = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const factura = `FAC-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}`;
    const inputFactura = document.getElementById('numero_factura');
    if (inputFactura) inputFactura.value = factura;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('numero_factura')) generarFacturaAutomatica();
});

// ========================================================================================================
// DETALLE Y FACTURA DE COMPRA
// ========================================================================================================

function verDetalleCompra(id) {
    fetch(`${API_BASE}/compras/${id}/detalles`)
        .then(r => r.json())
        .then(detalles => {
            const modal = document.getElementById('modalDetalleCompra');
            const contenido = document.getElementById('contenidoDetalleCompra');

            let html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f8f9fa;"><th style="padding: 8px;">Producto</th><th style="padding: 8px;">Cant</th><th style="padding: 8px;">Garantía</th><th style="padding: 8px;">Precio Unit.</th><th style="padding: 8px;">Subtotal</th></tr></thead><tbody>';
            detalles.forEach(d => {
                html += `<tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.NOMBRE_PRODUCTO}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.CANTIDAD}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.MESES_GARANTIA || 0} Meses</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">C$${parseFloat(d.PRECIO_UNITARIO).toFixed(2)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">C$${parseFloat(d.SUBTOTAL).toFixed(2)}</td>
                </tr>`;
            });
            html += '</tbody></table>';

            contenido.innerHTML = html;
            modal.style.display = 'flex';
        });
}

function verFactura(id) {
    fetch(`${API_BASE}/compras/${id}/detalles`)
        .then(r => r.json())
        .then(detalles => {
            fetch(`${API_BASE}/compras`)
                .then(r => r.json())
                .then(compras => {
                    const compra = compras.find(c => c.ID_COMPRA == id);
                    if (!compra) return alert('No se encontró la información de la compra.');
                    generarVistaFactura(compra, detalles);
                });
        })
        .catch(err => console.error('Error al obtener datos para factura:', err));
}

function generarVistaFactura(compra, detalles) {
    const ventana = window.open('', '_blank');
    const fecha = new Date(compra.FECHA_COMPRA).toLocaleDateString();

    let itemsHtml = '';
    detalles.forEach(d => {
        itemsHtml += `
               <tr>
                   <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.CANTIDAD}</td>
                   <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.NOMBRE_PRODUCTO}</td>
                   <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.MESES_GARANTIA || 0} Meses</td>
                   <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">C$${parseFloat(d.PRECIO_UNITARIO).toFixed(2)}</td>
                   <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">C$${parseFloat(d.SUBTOTAL).toFixed(2)}</td>
               </tr>
           `;
    });

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura #${compra.NUMERO_FACTURA_PROVEEDOR}</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background: #fff; margin: 0; padding: 20px; font-size: 12px; }
        .invoice-box { max-width: 21cm; margin: auto; padding: 10px 30px; position: relative; min-height: 28cm; }
        .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .logo-section { width: 20%; text-align: center; }
        .logo-placeholder { font-weight: bold; font-size: 24px; color: #1a4d8c; letter-spacing: 1px; }
        .company-info { width: 55%; text-align: center; }
        .company-info h1 { margin: 0; color: #2c3e50; font-size: 22px; text-transform: uppercase; }
        .company-info .ruc { font-weight: bold; font-size: 16px; margin: 5px 0; display: block; }
        .company-info p { margin: 2px 0; font-size: 11px; color: #555; }
        .factura-box { width: 20%; border: 1px solid #ccc; }
        .factura-box-header { background-color: #1a4d8c; color: white; text-align: center; font-weight: bold; padding: 5px; text-transform: uppercase; }
        .factura-box-number { color: #c0392b; font-size: 18px; font-weight: bold; text-align: center; padding: 10px; }
        .yellow-bar { background-color: #e3c038; color: #000; font-weight: bold; padding: 5px 10px; text-transform: uppercase; font-size: 11px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
        .client-section { display: flex; margin-bottom: 20px; border-bottom: 1px solid #ddd; }
        .client-data { flex: 3; padding-right: 10px; }
        .client-row { display: flex; margin: 8px 0; border-bottom: 1px solid #eee; }
        .client-label { width: 120px; font-weight: bold; }
        .date-box { flex: 1; border: 1px solid #000; }
        .date-header { background-color: #000; color: white; padding: 2px; font-weight: bold; text-align: center; font-size: 10px; }
        .date-grid { display: flex; text-align: center; }
        .date-col { flex: 1; border-right: 1px solid #000; padding: 2px; }
        .date-col:last-child { border-right: none; }
        .date-val { height: 25px; display: flex; align-items: center; justify-content: center; }
        .date-title { border-bottom: 1px solid #000; font-size: 9px; background: #eee; }
        .table-items { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ccc; }
        .table-items th { background: #e3c038; color: #000; text-align: center; padding: 6px; border: 1px solid #aaa; text-transform: uppercase; font-size: 11px; }
        .table-items td { padding: 8px; border-right: 1px solid #ccc; vertical-align: top; font-size: 12px; }
        .table-items tbody tr { min-height: 20px; }
        .footer-section { display: flex; margin-top: 0; }
        .signatures { width: 65%; padding-top: 60px; display: flex; justify-content: space-around; }
        .signature-line { text-align: center; width: 40%; border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: bold; }
        .totals-box { width: 35%; border-left: 1px solid #ccc; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; }
        .total-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; }
        .total-label { background-color: #e3c038; width: 40%; padding: 5px; font-weight: bold; font-size: 11px; }
        .total-value { padding: 5px; text-align: right; flex: 1; }
        .btn-print { background: #1a4d8c; color: white; border: none; padding: 10px 20px; cursor: pointer; font-size: 16px; border-radius: 5px; margin-top: 20px; display: block; margin: 20px auto; }
        .btn-print:hover { background: #143a6c; }
        .page-footer { margin-top: 30px; border-top: 5px solid #1a4d8c; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #fff; background-color: #1a4d8c; padding: 10px 20px; }
        @media print { .btn-print { display: none; } .invoice-box { border: none; box-shadow: none; padding: 0; } body { -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header-container">
            <div class="logo-section">
                <div class="logo-placeholder">COMPUNIC FACTURA DE PROVEEDORES</div>
                <div style="font-size:9px; letter-spacing: 2px;">SOLUCIONES INFORMÁTICAS</div>
            </div>
            <div class="company-info">
                <h1>COMPUNIC FACTURA DE PROVEEDORES</h1>
                <span class="ruc">RUC: 0012705760036G</span>
                <p>Colonia Maestro Gabriel, semáforos del colonial 25 vrs. Oeste, 15 vrs. Sur.</p>
                <p>Distrito IV. Managua, Nicaragua | Telf: 8568 0614</p>
                <p>Email: Proveedoresventas@gmail.com</p>
                <p><strong>Venta de equipos informáticos para oficina</strong></p>
            </div>
            <div class="factura-box">
                <div class="factura-box-header">FACTURA</div>
                <div class="factura-box-number">N° ${compra.NUMERO_FACTURA_PROVEEDOR}</div>
            </div>
        </div>
        <div class="yellow-bar">PROVEEDOR</div>
        <div class="client-section">
            <div class="client-data">
                <div class="client-row"><span class="client-label">Nombre:</span><span>${compra.proveedor}</span></div>
                <div class="client-row"><span class="client-label">N° Identificación:</span><span> - </span></div>
                <div class="client-row"><span class="client-label">N° Contacto:</span><span> - </span></div>
            </div>
            <div class="date-box">
                <div class="date-header">FECHA</div>
                <div class="date-grid">
                    <div class="date-col"><div class="date-title">DIA</div><div class="date-val">${new Date(fecha).getDate()}</div></div>
                    <div class="date-col"><div class="date-title">MES</div><div class="date-val">${new Date(fecha).getMonth() + 1}</div></div>
                    <div class="date-col"><div class="date-title">AÑO</div><div class="date-val">${new Date(fecha).getFullYear()}</div></div>
                </div>
            </div>
        </div>
        <table class="table-items">
            <thead><tr><th style="width: 10%;">CANTIDAD</th><th style="width: 40%;">DESCRIPCIÓN</th><th style="width: 15%;">GARANTÍA</th><th style="width: 15%;">VALOR UNITARIO</th><th style="width: 10%;">IMPORTE</th></tr></thead>
            <tbody>${itemsHtml}<tr style="height: 200px;"><td></td><td></td><td></td><td></td></tr></tbody>
        </table>
        <div class="footer-section">
            <div class="signatures">
                <div class="signature-line">FIRMA DEL PROVEEDOR</div>
                <div class="signature-line">RECIBIDO CONFORME</div>
            </div>
            <div class="totals-box">
                <div class="total-row"><div class="total-label">SUBTOTAL</div><div class="total-value">C$${(parseFloat(compra.TOTAL_COMPRA) / 1.15).toFixed(2)}</div></div>
                <div class="total-row"><div class="total-label">IVA (15%)</div><div class="total-value">C$${(parseFloat(compra.TOTAL_COMPRA) - (parseFloat(compra.TOTAL_COMPRA) / 1.15)).toFixed(2)}</div></div>
                <div class="total-row" style="border:none;"><div class="total-label" style="background:none;">TOTAL</div><div class="total-value"><strong>C$${parseFloat(compra.TOTAL_COMPRA).toFixed(2)}</strong></div></div>
                <div class="total-row" style="border:none; font-size: 10px; color: #666;"><div class="total-value">T/C: - </div></div>
            </div>
        </div>
        <div class="page-footer">
            <div>Colonia Maestro Gabriel, semáforos del colonial 25 vrs. Oeste, 15 vrs. Sur</div>
            <div style="font-weight:bold; font-size: 14px;">COMPUNIC</div>
        </div>
        <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
</body>
</html>
`;

    ventana.document.write(html);
    ventana.document.close();
}
