/*
 * ==========================================
 * MÓDULO: devoluciones.js
 * PROPÓSITO: Lógica para gestionar Devoluciones de Clientes y Devoluciones a Proveedores (REQ-FR-31, UR-03, UR-11).
 * FECHA: 8 de abril de 2026
 * ==========================================
 */

// ============================================================================
// PESTAÑAS Y NAVEGACIÓN
// ============================================================================
function cambiarTabDevolucion(tab) {
    const btnClientes = document.getElementById('tab-btn-clientes');
    const btnProveedores = document.getElementById('tab-btn-proveedores');
    const panelClientes = document.getElementById('panel-devoluciones-clientes');
    const panelProveedores = document.getElementById('panel-devoluciones-proveedores');

    if (tab === 'clientes') {
        if (btnClientes) {
            btnClientes.style.background = '#2563eb';
            btnClientes.style.color = 'white';
            btnClientes.style.borderColor = 'transparent';
        }
        if (btnProveedores) {
            btnProveedores.style.background = 'var(--bg-card, #ffffff)';
            btnProveedores.style.color = 'var(--text-color, #475569)';
            btnProveedores.style.borderColor = 'var(--border-color, #cbd5e1)';
        }
        if (panelClientes) panelClientes.style.display = 'block';
        if (panelProveedores) panelProveedores.style.display = 'none';
        cargarDevoluciones();
    } else {
        if (btnProveedores) {
            btnProveedores.style.background = '#0284c7';
            btnProveedores.style.color = 'white';
            btnProveedores.style.borderColor = 'transparent';
        }
        if (btnClientes) {
            btnClientes.style.background = 'var(--bg-card, #ffffff)';
            btnClientes.style.color = 'var(--text-color, #475569)';
            btnClientes.style.borderColor = 'var(--border-color, #cbd5e1)';
        }
        if (panelClientes) panelClientes.style.display = 'none';
        if (panelProveedores) panelProveedores.style.display = 'block';
        cargarDevolucionesProveedores();
        poblarSelectProveedoresDev();
        poblarSelectProductosProvDev();
    }
}
window.cambiarTabDevolucion = cambiarTabDevolucion;

// ============================================================================
// 1. DEVOLUCIONES DE CLIENTES (EXISTENTE Y MEJORADO)
// ============================================================================

function cargarDevoluciones() {
    fetch(`${API_BASE}/devoluciones`)
        .then(res => res.json())
        .then(devoluciones => {
            const tbody = document.getElementById('devolutions-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (!devoluciones || devoluciones.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center italic text-gray">No hay devoluciones registradas.</td></tr>`;
                return;
            }

            devoluciones.forEach(dev => {
                const fila = document.createElement('tr');
                const fechaFormateada = new Date(dev.FECHA_DEVOLUCION).toLocaleDateString();

                let accionCell;
                if (dev.ACCION === 'reingreso') {
                    if (dev.REINGRESO_CONFIRMADO) {
                        accionCell = `<span class="badge badge-reingreso confirmado" title="Reingreso ya aplicado al stock">✓ REINGRESADO</span>`;
                    } else {
                        const nombreEsc = (dev.NOMBRE_PRODUCTO || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        const motivoEsc = (dev.MOTIVO || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        accionCell = `
                            <button
                                type="button"
                                class="badge badge-reingreso"
                                onclick="abrirModalReingreso(${dev.ID_DEVOLUCION}, '${nombreEsc}', ${dev.CANTIDAD}, '${dev.FACTURA}', '${fechaFormateada}', '${motivoEsc}')"
                                title="Haz clic para confirmar el reingreso al stock"
                            >
                                🔄 REINGRESO
                            </button>`;
                    }
                } else {
                    let badgeClass = 'badge ';
                    if (dev.ACCION === 'garantia') badgeClass += 'badge-garantia';
                    else if (dev.ACCION === 'desecho') badgeClass += 'badge-desecho';
                    accionCell = `<span class="${badgeClass}">${dev.ACCION}</span>`;
                }

                fila.innerHTML = `
                    <td class="text-left font-bold primary-color">#${dev.ID_DEVOLUCION}</td>
                    <td class="text-left font-semibold">${dev.FACTURA}</td>
                    <td class="text-left">${dev.NOMBRE_PRODUCTO}</td>
                    <td class="text-center font-bold">${dev.CANTIDAD}</td>
                    <td class="text-left">${dev.MOTIVO || 'N/A'}</td>
                    <td class="text-center">${accionCell}</td>
                    <td class="text-left">${fechaFormateada}</td>
                    <td class="text-center">
                        <button type="button" class="btn-danger" style="padding: 4px 10px; font-size: 12px; border-radius: 4px;" onclick="eliminarDevolucion(${dev.ID_DEVOLUCION})" title="Eliminar">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(err => {
            console.error('Error al cargar devoluciones:', err);
            const tbody = document.getElementById('devolutions-table-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Error al cargar devoluciones: ${err.message}</td></tr>`;
        });
}

function abrirModalReingreso(id, nombreProducto, cantidad, factura, fecha, motivo) {
    const prevModal = document.getElementById('reingreso-modal-overlay');
    if (prevModal) prevModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reingreso-modal-overlay';
    overlay.className = 'reingreso-modal-overlay';

    overlay.innerHTML = `
        <div class="reingreso-modal" role="dialog" aria-modal="true" style="max-width: 500px;">
            <h3>🔄 Confirmar Reingreso al Stock</h3>
            <p class="modal-subtitle">Este producto reingresará como <b>Seminuevo</b> en una tarjeta independiente.</p>

            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Producto Original</div>
                    <div class="detail-value">${nombreProducto}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Cantidad</div>
                    <div class="detail-value">${cantidad} unidad(es)</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Factura Venta</div>
                    <div class="detail-value">${factura}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fecha Devolución</div>
                    <div class="detail-value">${fecha}</div>
                </div>
                <div class="detail-item col-span-2">
                    <div class="detail-label">Motivo</div>
                    <div class="detail-value">${motivo || 'Sin motivo registrado'}</div>
                </div>
            </div>

            <div class="reingreso-info-box">
                ℹ️ Al confirmar, el producto quedará habilitado en el inventario como <b>Seminuevo</b> con precio ajustable.
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="cerrarModalReingreso()">Cancelar</button>
                <button type="button" class="btn btn-success" id="btn-confirmar-reingreso-action" onclick="ejecutarConfirmacionReingreso(${id})">
                    ✓ Confirmar Reingreso
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function cerrarModalReingreso() {
    const overlay = document.getElementById('reingreso-modal-overlay');
    if (overlay) overlay.remove();
}

function ejecutarConfirmacionReingreso(idDevolucion) {
    const btn = document.getElementById('btn-confirmar-reingreso-action');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando...';
    }

    fetch(`${API_BASE}/devoluciones/${idDevolucion}/confirmar-reingreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            cerrarModalReingreso();
            if (data.error) {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: '¡Reingreso Confirmado!',
                    text: data.mensaje || 'El producto reingresó correctamente al inventario.',
                    confirmButtonColor: '#28a745'
                });
                cargarDevoluciones();
            }
        })
        .catch(err => {
            console.error('Error al confirmar reingreso:', err);
            cerrarModalReingreso();
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al conectar con el servidor: ' + err.message });
        });
}

function poblarSelectVentas() {
    fetch(`${API_BASE}/ventas`)
        .then(res => res.json())
        .then(ventas => {
            const select = document.getElementById('venta-select');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione una Venta</option>';

            ventas.forEach(v => {
                if (v.ESTADO === 'Rechazado') return;
                const opt = document.createElement('option');
                opt.value = v.ID_VENTA;
                const factura = v.FACTURA || `FAC-V${String(v.ID_VENTA).padStart(3, '0')}`;
                const cliente = v.NOMBRE_CLIENTE || 'Cliente';
                const fecha = new Date(v.FECHA).toLocaleDateString();
                opt.textContent = `${factura} — ${cliente} (${fecha})`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error('Error al cargar ventas:', err));
}

function cargarProductosDeVenta(idVenta) {
    const productoSelect = document.getElementById('producto-devolucion-select');
    if (!productoSelect) return;

    productoSelect.innerHTML = '<option value="" disabled selected>Cargando productos...</option>';
    productoSelect.disabled = true;

    fetch(`${API_BASE}/devoluciones/venta/${idVenta}/productos`)
        .then(res => res.json())
        .then(productos => {
            productoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Producto</option>';
            productoSelect.disabled = false;

            if (productos.length === 0) {
                productoSelect.innerHTML = '<option value="" disabled selected>Esta venta no tiene productos disponibles para devolver</option>';
                productoSelect.disabled = true;
                return;
            }

            productos.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.ID_PRODUCTO;
                opt.dataset.cantidadVendida = p.CANTIDAD_VENDIDA;
                opt.dataset.cantidadDevuelta = p.CANTIDAD_DEVUELTA || 0;
                opt.dataset.disponible = p.CANTIDAD_DISPONIBLE;
                opt.textContent = `${p.NOMBRE_PRODUCTO} (Vendidos: ${p.CANTIDAD_VENDIDA}, Ya devueltos: ${p.CANTIDAD_DEVUELTA || 0}, Disponibles: ${p.CANTIDAD_DISPONIBLE})`;
                productoSelect.appendChild(opt);
            });

            productoSelect.onchange = function () {
                const selectedOpt = this.options[this.selectedIndex];
                const disponible = parseInt(selectedOpt.dataset.disponible || 0);
                const infoText = document.getElementById('cantidad-disponible-info');
                const cantInput = document.getElementById('cantidad-devolucion');

                if (infoText) {
                    infoText.textContent = `Cantidad máxima a devolver: ${disponible}`;
                }
                if (cantInput) {
                    cantInput.max = disponible;
                    cantInput.value = Math.min(1, disponible);
                }
            };
        })
        .catch(err => {
            console.error('Error al cargar productos de venta:', err);
            productoSelect.innerHTML = '<option value="" disabled selected>Error al cargar productos</option>';
        });
}

function poblarSelectProductosReemplazo() {
    fetch(`${API_BASE}/productos`)
        .then(res => res.json())
        .then(productos => {
            const select = document.getElementById('producto-reemplazo-select');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione equipo de reemplazo...</option>';

            productos.forEach(p => {
                const activo = p.activo !== undefined ? Number(p.activo) : 1;
                if (activo === 0) return;

                const stock = Number(p.stock ?? p.stock_actual_calculado ?? 0);
                const opt = document.createElement('option');
                opt.value = p.ID_PRODUCTO || p.id_producto;
                opt.textContent = `${p.nombre || p.NOMBRE_PRODUCTO} — Stock: ${stock}`;
                opt.dataset.stock = stock;
                select.appendChild(opt);
            });

            select.onchange = function () {
                cargarSeriesReemplazo(this.value);
            };
        })
        .catch(err => console.error('Error al cargar productos de reemplazo:', err));
}

function cargarSeriesReemplazo(idProducto) {
    const listContainer = document.getElementById('series-reemplazo-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<span class="text-muted text-sm">Cargando series disponibles...</span>';

    fetch(`${API_BASE}/series/${idProducto}/disponibles`)
        .then(res => res.json())
        .then(series => {
            listContainer.innerHTML = '';
            if (!series || series.length === 0) {
                listContainer.innerHTML = '<span class="text-muted text-sm" style="color:#e67e22;">⚠️ Este producto no tiene números de serie individuales registrados.</span>';
                return;
            }

            series.forEach(s => {
                const label = document.createElement('label');
                label.style.cssText = 'display: block; margin-bottom: 4px; font-size: 13px; cursor: pointer;';
                label.innerHTML = `
                    <input type="checkbox" value="${s.NUMERO_SERIE}" class="cb-serie-reemplazo" onchange="verificarSeleccionSeriesReemplazo()">
                    ${s.NUMERO_SERIE} <span style="font-size: 11px; color: ${s.CONDICION === 'Nuevo' ? '#28a745' : '#e67e22'};">(${s.CONDICION})</span>
                `;
                listContainer.appendChild(label);
            });
        })
        .catch(err => {
            listContainer.innerHTML = '<span class="text-muted text-sm text-red-500">Error al cargar series</span>';
        });
}

function verificarSeleccionSeriesReemplazo() {
    const cantInput = document.getElementById('cantidad-devolucion');
    const reqCount = parseInt(cantInput ? cantInput.value : 1) || 1;
    const countSpan = document.getElementById('cant-req-reemplazo');
    if (countSpan) countSpan.textContent = reqCount;
}

function limpiarFormularioDevolucion() {
    const form = document.getElementById('devolution-form');
    if (form) {
        form.reset();
        const prodSelect = document.getElementById('producto-devolucion-select');
        if (prodSelect) {
            prodSelect.innerHTML = '<option value="" disabled selected>Seleccione una venta primero</option>';
            prodSelect.disabled = true;
        }
        const info = document.getElementById('cantidad-disponible-info');
        if (info) info.textContent = '';
    }
}
window.limpiarFormularioDevolucion = limpiarFormularioDevolucion;

function eliminarDevolucion(id) {
    Swal.fire({
        title: '¿Eliminar Devolución?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_BASE}/devoluciones/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Devolución eliminada con éxito.' });
                    cargarDevoluciones();
                })
                .catch(err => {
                    Swal.fire({ icon: 'error', title: 'Error', text: err.message });
                });
        }
    });
}
window.eliminarDevolucion = eliminarDevolucion;

// ============================================================================
// 2. DEVOLUCIONES A PROVEEDORES (REQ-FR-31)
// ============================================================================

window._todasDevProveedores = [];
window._filtradasDevProveedores = [];

function poblarSelectProveedoresDev() {
    fetch(`${API_BASE}/proveedores`)
        .then(res => res.json())
        .then(proveedores => {
            const select = document.getElementById('prov-select-dev');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione un Proveedor</option>';

            proveedores.forEach(p => {
                const activo = p.ACTIVO !== undefined ? Number(p.ACTIVO) : 1;
                if (activo === 0) return;
                const opt = document.createElement('option');
                opt.value = p.ID_PROVEEDOR;
                opt.textContent = `${p.NOMBRE_EMPRESA} (${p.PERSONA_CONTACTO || 'Contacto'})`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error('Error al cargar proveedores:', err));
}

function poblarSelectProductosProvDev() {
    fetch(`${API_BASE}/productos`)
        .then(res => res.json())
        .then(productos => {
            const select = document.getElementById('prod-prov-dev-select');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccione un Producto</option>';

            productos.forEach(p => {
                const activo = p.activo !== undefined ? Number(p.activo) : 1;
                if (activo === 0) return;

                const stock = Number(p.stock ?? p.stock_actual_calculado ?? 0);
                const opt = document.createElement('option');
                opt.value = p.ID_PRODUCTO || p.id_producto;
                opt.dataset.stock = stock;
                opt.textContent = `${p.nombre || p.NOMBRE_PRODUCTO} (Stock: ${stock})`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error('Error al cargar productos para devolución a proveedor:', err));
}

function cargarComprasDeProveedor(idProveedor) {
    const selectCompra = document.getElementById('compra-prov-select');
    if (!selectCompra) return;

    selectCompra.innerHTML = '<option value="">Cargando compras del proveedor...</option>';

    fetch(`${API_BASE}/devoluciones-proveedores/compras/${idProveedor}`)
        .then(res => res.json())
        .then(compras => {
            selectCompra.innerHTML = '<option value="">Sin vincular a factura específica</option>';
            if (!compras || compras.length === 0) {
                return;
            }

            const comprasUnicas = {};
            compras.forEach(c => {
                if (!comprasUnicas[c.ID_COMPRA]) {
                    comprasUnicas[c.ID_COMPRA] = c;
                    const opt = document.createElement('option');
                    opt.value = c.ID_COMPRA;
                    const fecha = new Date(c.FECHA_COMPRA).toLocaleDateString();
                    opt.textContent = `Factura #${c.NUMERO_FACTURA_PROVEEDOR} (${fecha}) — C$ ${parseFloat(c.TOTAL_COMPRA).toFixed(2)}`;
                    selectCompra.appendChild(opt);
                }
            });
        })
        .catch(err => {
            console.error('Error al cargar compras de proveedor:', err);
            selectCompra.innerHTML = '<option value="">Sin vincular a factura específica</option>';
        });
}
window.cargarComprasDeProveedor = cargarComprasDeProveedor;

function actualizarStockDisponibleProv(selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    const stock = opt ? parseInt(opt.dataset.stock || 0) : 0;
    const info = document.getElementById('stock-disp-prov-info');
    const inputCant = document.getElementById('cant-prov-dev');

    if (info) {
        info.textContent = `Stock disponible en bodega: ${stock}`;
        info.style.color = stock > 0 ? '#10b981' : '#ef4444';
    }
    if (inputCant) {
        inputCant.max = stock;
    }
}
window.actualizarStockDisponibleProv = actualizarStockDisponibleProv;

async function guardarDevolucionProveedor(e) {
    e.preventDefault();

    const idProveedor = document.getElementById('prov-select-dev').value;
    const idCompra = document.getElementById('compra-prov-select').value || null;
    const idProducto = document.getElementById('prod-prov-dev-select').value;
    const cantidad = parseInt(document.getElementById('cant-prov-dev').value);
    const motivo = document.getElementById('motivo-prov-dev').value.trim();
    const estado = document.getElementById('estado-prov-dev').value;

    if (!idProveedor || !idProducto || !cantidad || cantidad <= 0 || !motivo) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Incompletos',
            text: 'Por favor complete todos los campos requeridos con datos válidos.',
            confirmButtonColor: '#0284c7'
        });
        return;
    }

    const prodSelect = document.getElementById('prod-prov-dev-select');
    const stockDisp = parseInt(prodSelect.options[prodSelect.selectedIndex]?.dataset.stock || 0);

    if (cantidad > stockDisp) {
        Swal.fire({
            icon: 'error',
            title: 'Stock Insuficiente',
            text: `No hay suficiente stock en bodega. Stock actual: ${stockDisp}, intentas devolver: ${cantidad}.`,
            confirmButtonColor: '#0284c7'
        });
        return;
    }

    Swal.fire({
        title: 'Registrando Devolución...',
        text: 'Descontando inventario y notificando al sistema.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        let idEmpleado = 11;
        if (typeof Auth !== 'undefined') {
            const session = Auth.getSession();
            idEmpleado = session?.id_empleado || 11;
        }

        const response = await fetch(`${API_BASE}/devoluciones-proveedores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': idEmpleado
            },
            body: JSON.stringify({
                id_proveedor: parseInt(idProveedor),
                id_compra: idCompra ? parseInt(idCompra) : null,
                id_producto: parseInt(idProducto),
                cantidad: cantidad,
                motivo: motivo,
                estado: estado,
                id_empleado: idEmpleado
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al procesar la devolución a proveedor.');
        }

        Swal.fire({
            icon: 'success',
            title: '¡Devolución a Proveedor Registrada!',
            html: `
                <div style="font-size: 14px; text-align: left; padding: 10px; background: #f8fafc; border-radius: 6px;">
                    <p style="margin: 4px 0;"><strong>ID Devolución:</strong> <span style="color:#0284c7; font-weight:bold;">#${data.id_devolucion}</span></p>
                    <p style="margin: 4px 0;"><strong>Cantidad descontada:</strong> ${cantidad} unidad(es)</p>
                    <p style="margin: 4px 0;"><strong>Estado:</strong> ${estado}</p>
                    <p style="margin: 8px 0 0; font-size: 11px; color:#64748b;">El inventario fue actualizado automáticamente en la bitácora de stock.</p>
                </div>
            `,
            confirmButtonColor: '#0284c7'
        });

        limpiarFormularioDevolucionProveedor();
        cargarDevolucionesProveedores();
        poblarSelectProductosProvDev();

    } catch (err) {
        console.error('Error al registrar devolución a proveedor:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
}
window.guardarDevolucionProveedor = guardarDevolucionProveedor;

function limpiarFormularioDevolucionProveedor() {
    const form = document.getElementById('form-devolucion-proveedor');
    if (form) form.reset();
    const stockInfo = document.getElementById('stock-disp-prov-info');
    if (stockInfo) stockInfo.textContent = '';
    const compraSelect = document.getElementById('compra-prov-select');
    if (compraSelect) compraSelect.innerHTML = '<option value="">Sin vincular a factura específica</option>';
}
window.limpiarFormularioDevolucionProveedor = limpiarFormularioDevolucionProveedor;

function cargarDevolucionesProveedores() {
    const tbody = document.getElementById('devoluciones-prov-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="text-center italic text-gray">⏳ Cargando devoluciones a proveedores...</td></tr>';

    fetch(`${API_BASE}/devoluciones-proveedores`)
        .then(res => res.json())
        .then(data => {
            window._todasDevProveedores = data || [];
            window._filtradasDevProveedores = [...window._todasDevProveedores];
            renderDevolucionesProveedores();
        })
        .catch(err => {
            console.error('Error al cargar devoluciones a proveedores:', err);
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-red-500">Error al cargar: ${err.message}</td></tr>`;
        });
}
window.cargarDevolucionesProveedores = cargarDevolucionesProveedores;

function filtrarDevolucionesProveedores(term) {
    const t = (term || '').toLowerCase().trim();
    if (!t) {
        window._filtradasDevProveedores = [...window._todasDevProveedores];
    } else {
        window._filtradasDevProveedores = window._todasDevProveedores.filter(d => {
            const prov = (d.NOMBRE_PROVEEDOR || '').toLowerCase();
            const prod = (d.NOMBRE_PRODUCTO || '').toLowerCase();
            const mot = (d.MOTIVO || '').toLowerCase();
            const est = (d.ESTADO || '').toLowerCase();
            const fac = (d.NUMERO_FACTURA_PROVEEDOR || '').toLowerCase();
            return prov.includes(t) || prod.includes(t) || mot.includes(t) || est.includes(t) || fac.includes(t);
        });
    }
    renderDevolucionesProveedores();
}
window.filtrarDevolucionesProveedores = filtrarDevolucionesProveedores;

function renderDevolucionesProveedores() {
    const tbody = document.getElementById('devoluciones-prov-table-body');
    if (!tbody) return;

    if (window._filtradasDevProveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center italic text-gray">No hay devoluciones a proveedores registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    window._filtradasDevProveedores.forEach(d => {
        const tr = document.createElement('tr');
        const fecha = new Date(d.FECHA).toLocaleDateString();

        let badgeBg = '#f59e0b'; // Pendiente
        if (d.ESTADO === 'Aprobada') badgeBg = '#2563eb';
        else if (d.ESTADO === 'Reemplazo_Recibido') badgeBg = '#10b981';
        else if (d.ESTADO === 'Reembolso_Recibido') badgeBg = '#8b5cf6';
        else if (d.ESTADO === 'Rechazada') badgeBg = '#ef4444';

        const estadoBadge = `<span style="display:inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; background: ${badgeBg};">
            ${d.ESTADO.replace('_', ' ')}
        </span>`;

        tr.innerHTML = `
            <td class="text-left font-bold" style="color: #0284c7;">#${d.ID_DEVOLUCION_PROV}</td>
            <td class="text-left">
                <strong>${d.NOMBRE_PROVEEDOR}</strong>
                ${d.TELEFONO_PROVEEDOR ? `<br><small class="text-muted">Tel: ${d.TELEFONO_PROVEEDOR}</small>` : ''}
            </td>
            <td class="text-left">${d.NUMERO_FACTURA_PROVEEDOR ? `#${d.NUMERO_FACTURA_PROVEEDOR}` : '<span class="text-muted">N/A</span>'}</td>
            <td class="text-left">
                <strong>${d.NOMBRE_PRODUCTO}</strong>
                ${d.MODELO_PRODUCTO ? `<br><small class="text-muted">${d.MODELO_PRODUCTO}</small>` : ''}
            </td>
            <td class="text-center font-bold" style="font-size: 15px;">${d.CANTIDAD}</td>
            <td class="text-left" style="max-width: 200px;">${d.MOTIVO}</td>
            <td class="text-left">${fecha}</td>
            <td class="text-center">${estadoBadge}</td>
            <td class="text-center" style="white-space: nowrap;">
                <button type="button" class="btn-icon" style="padding: 4px 10px; background: #0284c7; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;" title="Actualizar Estado de Resolución" onclick="abrirModalCambiarEstadoDevProv(${d.ID_DEVOLUCION_PROV}, '${d.ESTADO}', '${(d.NOMBRE_PRODUCTO || '').replace(/'/g, "\\'")}', ${d.CANTIDAD}, '${(d.NOMBRE_PROVEEDOR || '').replace(/'/g, "\\'")}')">
                    <i class="fas fa-edit"></i> Estado
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal para cambiar estado de resolución de devolución a proveedor (REQ-FR-31)
async function abrirModalCambiarEstadoDevProv(id, estadoActual, nombreProd, cantidad, proveedor) {
    const { value: nuevoEstado } = await Swal.fire({
        title: `🔄 Estado de Devolución #${id}`,
        html: `
            <div style="text-align: left; font-size: 13px;">
                <p><strong>Producto:</strong> ${nombreProd} (${cantidad} und.)</p>
                <p><strong>Proveedor:</strong> ${proveedor}</p>
                <label style="display:block; margin: 10px 0 4px; font-weight: bold;">Nuevo Estado de Resolución:</label>
                <select id="swal-select-estado-prov" class="swal2-input" style="width: 100%; margin: 0; font-size: 14px;">
                    <option value="Pendiente" ${estadoActual === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente (En trámite)</option>
                    <option value="Aprobada" ${estadoActual === 'Aprobada' ? 'selected' : ''}>✅ Aprobada por Proveedor</option>
                    <option value="Reemplazo_Recibido" ${estadoActual === 'Reemplazo_Recibido' ? 'selected' : ''}>📦 Reemplazo Recibido (Reingresa al stock)</option>
                    <option value="Reembolso_Recibido" ${estadoActual === 'Reembolso_Recibido' ? 'selected' : ''}>💰 Reembolso / Nota de Crédito Recibida</option>
                    <option value="Rechazada" ${estadoActual === 'Rechazada' ? 'selected' : ''}>❌ Rechazada (Reingresa al stock)</option>
                </select>
                <div style="margin-top: 12px; font-size: 11px; color: #64748b; background: #f0f9ff; padding: 8px; border-radius: 4px;">
                    ℹ️ Si selecciona <strong>Reemplazo Recibido</strong> o <strong>Rechazada</strong>, el sistema sumará automáticamente las ${cantidad} unidades de vuelta al stock.
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '💾 Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
        preConfirm: () => {
            return document.getElementById('swal-select-estado-prov').value;
        }
    });

    if (nuevoEstado && nuevoEstado !== estadoActual) {
        Swal.fire({
            title: 'Actualizando resolución...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            let idEmpleado = 11;
            if (typeof Auth !== 'undefined') {
                const session = Auth.getSession();
                idEmpleado = session?.id_empleado || 11;
            }

            const res = await fetch(`${API_BASE}/devoluciones-proveedores/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': idEmpleado
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const resData = await res.json();
            if (!res.ok || !resData.success) {
                throw new Error(resData.message || 'Error al actualizar estado.');
            }

            Swal.fire({
                icon: 'success',
                title: '¡Estado Actualizado!',
                text: resData.message,
                confirmButtonColor: '#0284c7'
            });

            cargarDevolucionesProveedores();
            poblarSelectProductosProvDev();

        } catch (err) {
            console.error('Error al actualizar estado de devolución a proveedor:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        }
    }
}
window.abrirModalCambiarEstadoDevProv = abrirModalCambiarEstadoDevProv;

function agregarDevolucion(e) {
    if (e) e.preventDefault();
    const idVenta = document.getElementById('venta-select').value;
    const idProducto = document.getElementById('producto-devolucion-select').value;
    const cantidad = parseInt(document.getElementById('cantidad-devolucion').value);
    const motivo = document.getElementById('motivo-devolucion').value.trim();
    const serieDevuelta = document.getElementById('serie-devolucion').value.trim();
    const accion = document.getElementById('accion-select').value;
    const idProductoReemplazo = document.getElementById('producto-reemplazo-select').value;

    const checkboxes = document.querySelectorAll('.cb-serie-reemplazo:checked');
    const seriesReemplazo = Array.from(checkboxes).map(cb => cb.value).join(', ');

    if (!idVenta || !idProducto || !cantidad || !accion || !idProductoReemplazo) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor complete todos los campos obligatorios.' });
        return;
    }

    Swal.fire({ title: 'Registrando Devolución...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(`${API_BASE}/devoluciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_venta: parseInt(idVenta),
            id_producto: parseInt(idProducto),
            cantidad: cantidad,
            motivo: motivo,
            numero_serie: serieDevuelta,
            accion: accion,
            id_producto_reemplazo: parseInt(idProductoReemplazo),
            series_reemplazo: seriesReemplazo
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: '¡Devolución Registrada!',
                    text: data.message || 'La devolución del cliente fue registrada exitosamente.',
                    confirmButtonColor: '#28a745'
                });
                limpiarFormularioDevolucion();
                cargarDevoluciones();
            }
        })
        .catch(err => {
            console.error('Error al registrar devolución de cliente:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        });
}
window.agregarDevolucion = agregarDevolucion;

// ============================================================================
// INICIALIZACIÓN GLOBAL
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDevoluciones();
    poblarSelectVentas();
    poblarSelectProductosReemplazo();
    poblarSelectProveedoresDev();
    poblarSelectProductosProvDev();

    const cantInput = document.getElementById('cantidad-devolucion');
    if (cantInput) {
        cantInput.addEventListener('input', verificarSeleccionSeriesReemplazo);
    }
});

// Listener para envío del formulario de cliente
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'devolution-form') {
        agregarDevolucion(e);
    }
});
