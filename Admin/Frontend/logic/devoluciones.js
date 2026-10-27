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

window._todasDevClientes = [];

function cargarDevoluciones() {
    fetch(`${API_BASE}/devoluciones`)
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Error al obtener devoluciones del servidor');
            }
            return data;
        })
        .then(devoluciones => {
            window._todasDevClientes = Array.isArray(devoluciones) ? devoluciones : [];
            renderizarTablaDevolucionesClientes(window._todasDevClientes);
        })
        .catch(err => {
            console.error('Error al cargar devoluciones:', err);
            const tbody = document.getElementById('devolutions-table-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="text-center text-red-500" style="padding: 20px;">⚠️ ${err.message}</td></tr>`;
        });
}

function filtrarDevolucionesClientes(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderizarTablaDevolucionesClientes(window._todasDevClientes);
        return;
    }
    const filtradas = window._todasDevClientes.filter(d => 
        (d.FACTURA && d.FACTURA.toLowerCase().includes(q)) ||
        (d.NOMBRE_PRODUCTO && d.NOMBRE_PRODUCTO.toLowerCase().includes(q)) ||
        (d.NUMERO_SERIE && d.NUMERO_SERIE.toLowerCase().includes(q)) ||
        (d.MOTIVO && d.MOTIVO.toLowerCase().includes(q)) ||
        (d.ESTADO_SOLICITUD && d.ESTADO_SOLICITUD.toLowerCase().includes(q))
    );
    renderizarTablaDevolucionesClientes(filtradas);
}
window.filtrarDevolucionesClientes = filtrarDevolucionesClientes;

function renderizarTablaDevolucionesClientes(lista) {
    const tbody = document.getElementById('devolutions-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center italic text-gray" style="padding: 20px;">No se encontraron solicitudes de devolución.</td></tr>`;
        return;
    }

    lista.forEach(dev => {
        const fila = document.createElement('tr');
        const fechaFormateada = dev.FECHA_DEVOLUCION ? new Date(dev.FECHA_DEVOLUCION).toLocaleDateString() : '—';
        const estado = dev.ESTADO_SOLICITUD || 'Pendiente';

        let badgeEstado = '';
        if (estado === 'Pendiente') {
            badgeEstado = `<span class="badge" style="background: #f59e0b; color: white;"><i class="fas fa-clock"></i> Pendiente</span>`;
        } else if (estado === 'Aprobada') {
            badgeEstado = `<span class="badge" style="background: #10b981; color: white;"><i class="fas fa-check-circle"></i> Aprobada</span>`;
        } else if (estado === 'Completada') {
            badgeEstado = `<span class="badge" style="background: #6366f1; color: white;" title="Reemplazo entregado"><i class="fas fa-box-check"></i> Completada</span>`;
        } else if (estado === 'Rechazada') {
            const motivoEsc = (dev.MOTIVO_RECHAZO || 'Sin motivo especificado').replace(/"/g, '&quot;');
            badgeEstado = `<span class="badge" style="background: #ef4444; color: white;" title="Motivo: ${motivoEsc}"><i class="fas fa-times-circle"></i> Rechazada</span>`;
        }

        let botonesAccion = '';
        if (estado === 'Pendiente') {
            botonesAccion = `
                <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                    <button type="button" class="btn btn-success" style="padding: 5px 10px; font-size: 12px; border-radius: 5px; display: inline-flex; align-items: center; gap: 4px;" onclick="autorizarDevolucion(${dev.ID_DEVOLUCION})">
                        <i class="fas fa-check"></i> Autorizar
                    </button>
                    <button type="button" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px; border-radius: 5px; display: inline-flex; align-items: center; gap: 4px;" onclick="mostrarModalRechazoDevolucion(${dev.ID_DEVOLUCION})">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            `;
        } else if (estado === 'Aprobada') {
            const prodEsc = (dev.NOMBRE_PRODUCTO || '').replace(/'/g, "\\'");
            const facEsc = (dev.FACTURA || '').replace(/'/g, "\\'");
            botonesAccion = `
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="btn btn-primary" style="padding: 5px 10px; font-size: 12px; border-radius: 5px; background: #2563eb; color: white; display: inline-flex; align-items: center; gap: 5px; border: none; font-weight: 600;" onclick="abrirModalEntregaReemplazo(${dev.ID_DEVOLUCION}, '${facEsc}', '${prodEsc}', ${dev.CANTIDAD}, '${(dev.NUMERO_SERIE || '').replace(/'/g, "\\'")}', ${dev.ID_PRODUCTO})">
                        <i class="fas fa-box"></i> Entregar Reemplazo
                    </button>
                </div>
            `;
        } else if (estado === 'Completada') {
            const reemplazoInfo = dev.NOMBRE_PRODUCTO_REEMPLAZO ? `Reemplazo: ${dev.NOMBRE_PRODUCTO_REEMPLAZO}` : 'Reemplazo entregado';
            botonesAccion = `
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                    <span style="font-size: 12px; color: #4f46e5; font-weight: 600;" title="${reemplazoInfo}"><i class="fas fa-check-double"></i> Entregado</span>
                </div>
            `;
        } else {
            botonesAccion = `
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                    <button type="button" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; border-radius: 4px;" onclick="verMotivoRechazo('${(dev.MOTIVO_RECHAZO || '').replace(/'/g, "\\'")}')" title="Ver motivo">
                        <i class="fas fa-eye"></i> Motivo
                    </button>
                </div>
            `;
        }

        fila.innerHTML = `
            <td class="text-left font-bold primary-color">#${dev.ID_DEVOLUCION}</td>
            <td class="text-left font-semibold">${dev.FACTURA}</td>
            <td class="text-left">${dev.NOMBRE_PRODUCTO}</td>
            <td class="text-center font-bold">${dev.CANTIDAD}</td>
            <td class="text-left"><small class="text-muted">${dev.NUMERO_SERIE || 'N/A'}</small></td>
            <td class="text-left" style="max-width: 250px;">
                <span title="${(dev.MOTIVO || '').replace(/"/g, '&quot;')}">${dev.MOTIVO || 'Sin motivo'}</span>
            </td>
            <td class="text-center">${fechaFormateada}</td>
            <td class="text-center">${badgeEstado}</td>
            <td class="text-center">${botonesAccion}</td>
        `;
        tbody.appendChild(fila);
    });
}

function autorizarDevolucion(id) {
    Swal.fire({
        title: '¿Autorizar Devolución?',
        text: `¿Desea aprobar la solicitud de devolución #${id}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Autorizar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Autorizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_BASE}/devoluciones/${id}/autorizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({ icon: 'success', title: '¡Autorizada!', text: data.message, confirmButtonColor: '#10b981' });
                    cargarDevoluciones();
                    if (typeof cargarSeguimientoSolicitudesVentas === 'function') {
                        cargarSeguimientoSolicitudesVentas();
                    }
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo autorizar' });
                }
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Error de Red', text: err.message });
            });
        }
    });
}
window.autorizarDevolucion = autorizarDevolucion;

function mostrarModalRechazoDevolucion(id) {
    Swal.fire({
        title: 'Rechazar Solicitud de Devolución',
        html: `
            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 10px;">
                Ingrese detalladamente el motivo del rechazo para la solicitud #${id}:
            </p>
            <textarea id="swal-motivo-rechazo" class="swal2-textarea" style="width: 100%; height: 90px; margin: 0; font-size: 14px;" placeholder="Ej: Producto presenta daño físico no atribuible a falla de fábrica / Período de garantía vencido..."></textarea>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Confirmar Rechazo',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const motivo = document.getElementById('swal-motivo-rechazo').value;
            if (!motivo || !motivo.trim()) {
                Swal.showValidationMessage('Debe ingresar un motivo para el rechazo.');
                return false;
            }
            return motivo.trim();
        }
    }).then(result => {
        if (result.isConfirmed) {
            const motivo = result.value;
            Swal.fire({ title: 'Rechazando solicitud...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            fetch(`${API_BASE}/devoluciones/${id}/rechazar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo_rechazo: motivo })
            })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({ icon: 'success', title: 'Rechazada', text: data.message, confirmButtonColor: '#ef4444' });
                    cargarDevoluciones();
                    if (typeof cargarSeguimientoSolicitudesVentas === 'function') {
                        cargarSeguimientoSolicitudesVentas();
                    }
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo rechazar' });
                }
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Error de Red', text: err.message });
            });
        }
    });
}
window.mostrarModalRechazoDevolucion = mostrarModalRechazoDevolucion;

function verMotivoRechazo(motivo) {
    Swal.fire({
        title: 'Motivo del Rechazo',
        text: motivo || 'No se registró un motivo detallado.',
        icon: 'info',
        confirmButtonColor: '#2563eb'
    });
}
window.verMotivoRechazo = verMotivoRechazo;

// ============================================================================
// SEGUIMIENTO DE SOLICITUDES EN VISTA DE VENTAS (SOLICITAR DEVOLUCIÓN)
// ============================================================================
window._filtroSolVentasEstado = 'Pendiente';
window._busquedaSolVentasQuery = '';

function cargarSeguimientoSolicitudesVentas() {
    fetch(`${API_BASE}/devoluciones`)
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Error al obtener solicitudes del servidor');
            }
            return data;
        })
        .then(devoluciones => {
            window._todasDevClientes = Array.isArray(devoluciones) ? devoluciones : [];
            renderizarTablaSeguimientoVentas();
        })
        .catch(err => {
            console.error('Error al cargar seguimiento de solicitudes:', err);
            const tbody = document.getElementById('tabla-solicitudes-ventas-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500" style="padding: 20px;">⚠️ ${err.message}</td></tr>`;
        });
}
window.cargarSeguimientoSolicitudesVentas = cargarSeguimientoSolicitudesVentas;

function filtrarSolicitudesVentas(estado) {
    window._filtroSolVentasEstado = estado;

    const btnPendientes = document.getElementById('filtro-sol-pendientes');
    const btnTodas = document.getElementById('filtro-sol-todas');

    if (estado === 'Pendiente') {
        if (btnPendientes) {
            btnPendientes.style.background = '#2563eb';
            btnPendientes.style.color = 'white';
        }
        if (btnTodas) {
            btnTodas.style.background = 'transparent';
            btnTodas.style.color = 'var(--text-color, #475569)';
        }
    } else {
        if (btnTodas) {
            btnTodas.style.background = '#2563eb';
            btnTodas.style.color = 'white';
        }
        if (btnPendientes) {
            btnPendientes.style.background = 'transparent';
            btnPendientes.style.color = 'var(--text-color, #475569)';
        }
    }

    renderizarTablaSeguimientoVentas();
}
window.filtrarSolicitudesVentas = filtrarSolicitudesVentas;

function buscarEnSolicitudesVentas(query) {
    window._busquedaSolVentasQuery = (query || '').toLowerCase().trim();
    renderizarTablaSeguimientoVentas();
}
window.buscarEnSolicitudesVentas = buscarEnSolicitudesVentas;

function renderizarTablaSeguimientoVentas() {
    const tbody = document.getElementById('tabla-solicitudes-ventas-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let lista = window._todasDevClientes || [];

    // 1. Filtrar por estado si aplica
    if (window._filtroSolVentasEstado === 'Pendiente') {
        lista = lista.filter(d => (d.ESTADO_SOLICITUD || 'Pendiente') === 'Pendiente');
    }

    // 2. Filtrar por término de búsqueda
    if (window._busquedaSolVentasQuery) {
        const q = window._busquedaSolVentasQuery;
        lista = lista.filter(d => 
            (d.FACTURA && d.FACTURA.toLowerCase().includes(q)) ||
            (d.NOMBRE_PRODUCTO && d.NOMBRE_PRODUCTO.toLowerCase().includes(q)) ||
            (d.NUMERO_SERIE && d.NUMERO_SERIE.toLowerCase().includes(q)) ||
            (d.MOTIVO && d.MOTIVO.toLowerCase().includes(q))
        );
    }

    if (lista.length === 0) {
        const mensaje = window._filtroSolVentasEstado === 'Pendiente'
            ? 'No hay solicitudes de devolución pendientes por gestionar.'
            : 'No se encontraron solicitudes de devolución.';
        tbody.innerHTML = `<tr><td colspan="8" class="text-center italic text-gray" style="padding: 20px;">${mensaje}</td></tr>`;
        return;
    }

    lista.forEach(dev => {
        const fila = document.createElement('tr');
        const fechaFormateada = dev.FECHA_DEVOLUCION ? new Date(dev.FECHA_DEVOLUCION).toLocaleDateString() : '—';
        const estado = dev.ESTADO_SOLICITUD || 'Pendiente';

        let badgeEstado = '';
        if (estado === 'Pendiente') {
            badgeEstado = `<span class="badge" style="background: #f59e0b; color: white;"><i class="fas fa-clock"></i> Pendiente</span>`;
        } else if (estado === 'Aprobada') {
            badgeEstado = `<span class="badge" style="background: #10b981; color: white;"><i class="fas fa-check-circle"></i> Aprobada</span>`;
        } else if (estado === 'Completada') {
            badgeEstado = `<span class="badge" style="background: #6366f1; color: white;" title="Reemplazo entregado"><i class="fas fa-box-check"></i> Completada</span>`;
        } else if (estado === 'Rechazada') {
            const motivoEsc = (dev.MOTIVO_RECHAZO || '').replace(/'/g, "\\'");
            badgeEstado = `
                <div style="display: inline-flex; align-items: center; gap: 6px;">
                    <span class="badge" style="background: #ef4444; color: white;"><i class="fas fa-times-circle"></i> Rechazada</span>
                    <button type="button" class="btn-secondary" style="padding: 2px 7px; font-size: 11px; border-radius: 4px;" onclick="verMotivoRechazo('${motivoEsc}')" title="Ver motivo de rechazo">
                        <i class="fas fa-question-circle"></i>
                    </button>
                </div>
            `;
        }

        let columnaAccion = '<span class="text-muted text-sm">—</span>';
        if (estado === 'Aprobada') {
            const prodEsc = (dev.NOMBRE_PRODUCTO || '').replace(/'/g, "\\'");
            const facEsc = (dev.FACTURA || '').replace(/'/g, "\\'");
            columnaAccion = `
                <button type="button" class="btn btn-primary" style="padding: 5px 10px; font-size: 12px; border-radius: 5px; background: #2563eb; color: white; display: inline-flex; align-items: center; gap: 5px; border: none; font-weight: 600;" onclick="abrirModalEntregaReemplazo(${dev.ID_DEVOLUCION}, '${facEsc}', '${prodEsc}', ${dev.CANTIDAD}, '${(dev.NUMERO_SERIE || '').replace(/'/g, "\\'")}', ${dev.ID_PRODUCTO})">
                    <i class="fas fa-box"></i> Entregar Reemplazo
                </button>
            `;
        } else if (estado === 'Completada') {
            const reemplazoInfo = dev.NOMBRE_PRODUCTO_REEMPLAZO ? `Reemplazo: ${dev.NOMBRE_PRODUCTO_REEMPLAZO}` : 'Reemplazo entregado';
            columnaAccion = `<span style="font-size: 12px; color: #4f46e5; font-weight: 600;" title="${reemplazoInfo}"><i class="fas fa-check-double"></i> Entregado</span>`;
        }

        fila.innerHTML = `
            <td class="text-left font-bold primary-color">#${dev.ID_DEVOLUCION}</td>
            <td class="text-left font-semibold">${dev.FACTURA}</td>
            <td class="text-left">${dev.NOMBRE_PRODUCTO}</td>
            <td class="text-center font-bold">${dev.CANTIDAD}</td>
            <td class="text-left"><small class="text-muted">${dev.NUMERO_SERIE || 'N/A'}</small></td>
            <td class="text-left" style="max-width: 250px;">
                <span title="${(dev.MOTIVO || '').replace(/"/g, '&quot;')}">${dev.MOTIVO || 'Sin motivo'}</span>
            </td>
            <td class="text-center">${fechaFormateada}</td>
            <td class="text-center">${badgeEstado}</td>
            <td class="text-center">${columnaAccion}</td>
        `;
        tbody.appendChild(fila);
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

// ============================================================================
// MODAL DE ENTREGA DE PRODUCTO DE REEMPLAZO (COMPLETAR DEVOLUCIÓN)
// ============================================================================
window._entregaReemplazoState = {
    idDevolucion: null,
    cantidadRequerida: 1,
    idProductoActual: null
};

function abrirModalEntregaReemplazo(idDevolucion, factura, productoDevuelto, cantidad, serieDevuelta, idProductoOriginal) {
    const prevModal = document.getElementById('entrega-modal-overlay');
    if (prevModal) prevModal.remove();

    window._entregaReemplazoState = {
        idDevolucion: idDevolucion,
        cantidadRequerida: cantidad || 1,
        idProductoActual: idProductoOriginal
    };

    const overlay = document.createElement('div');
    overlay.id = 'entrega-modal-overlay';
    overlay.className = 'entrega-modal-overlay';

    overlay.innerHTML = `
        <div class="entrega-modal" role="dialog" aria-modal="true">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <h3>📦 Entregar Equipo de Reemplazo</h3>
                    <p class="modal-subtitle">Asigne el producto nuevo para completar la devolución #${idDevolucion}.</p>
                </div>
                <button type="button" onclick="cerrarModalEntregaReemplazo()" style="background: none; border: none; font-size: 1.3rem; color: #64748b; cursor: pointer; padding: 0 5px;">&times;</button>
            </div>

            <!-- Resumen de la Solicitud Aprobada -->
            <div class="entrega-summary-card">
                <div class="entrega-summary-item">
                    <label>Factura de Venta</label>
                    <div>${factura || 'N/A'}</div>
                </div>
                <div class="entrega-summary-item">
                    <label>Cantidad a Entregar</label>
                    <div style="color: #2563eb; font-size: 1rem;">${cantidad} unidad(es)</div>
                </div>
                <div class="entrega-summary-item" style="grid-column: span 2;">
                    <label>Producto Devuelto</label>
                    <div>${productoDevuelto || 'Producto'}</div>
                </div>
                ${serieDevuelta ? `
                <div class="entrega-summary-item" style="grid-column: span 2;">
                    <label>Serie(s) del equipo devuelto</label>
                    <div style="font-family: monospace; font-size: 0.82rem; color: #475569;">${serieDevuelta}</div>
                </div>` : ''}
            </div>

            <!-- Formulario de Reemplazo -->
            <form id="form-completar-reemplazo" onsubmit="ejecutarCompletarDevolucion(event)">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="modal-reemplazo-producto-select" style="font-weight: 600; margin-bottom: 6px; display: block;">
                        Seleccionar Producto de Reemplazo a Entregar <span style="color: #ef4444;">*</span>
                    </label>
                    <select id="modal-reemplazo-producto-select" required style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color, #cbd5e1); font-size: 14px;" onchange="cargarSeriesModalReemplazo(this.value)">
                        <option value="" disabled selected>Cargando catálogo de productos...</option>
                    </select>
                </div>

                <div class="form-group" id="modal-series-reemplazo-container" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <label style="font-weight: 600; margin: 0;">Número(s) de Serie del equipo a entregar</label>
                        <span style="font-size: 12px; color: #64748b;">Requeridas: <strong id="modal-series-req-count" style="color: #2563eb;">${cantidad}</strong></span>
                    </div>
                    <div id="modal-series-reemplazo-list" style="max-height: 120px; overflow-y: auto; border: 1px solid var(--border-color, #cbd5e1); border-radius: 6px; padding: 10px; background: var(--bg-card-alt, #f8fafc);">
                        <span class="text-muted text-sm">Seleccione un producto primero para consultar sus series en stock.</span>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalEntregaReemplazo()" style="padding: 7px 16px; border-radius: 6px;">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-success" id="btn-finalizar-reemplazo" style="padding: 7px 18px; border-radius: 6px; font-weight: 600; background: #10b981; color: white; border: none; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-check-circle"></i> Finalizar y Completar Devolución
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    // Cargar productos en el select del modal
    poblarSelectModalReemplazo(idProductoOriginal);
}
window.abrirModalEntregaReemplazo = abrirModalEntregaReemplazo;

function cerrarModalEntregaReemplazo() {
    const overlay = document.getElementById('entrega-modal-overlay');
    if (overlay) overlay.remove();
}
window.cerrarModalEntregaReemplazo = cerrarModalEntregaReemplazo;

function poblarSelectModalReemplazo(idPreseleccionado) {
    const select = document.getElementById('modal-reemplazo-producto-select');
    if (!select) return;

    fetch(`${API_BASE}/productos`)
        .then(res => res.json())
        .then(productos => {
            select.innerHTML = '<option value="" disabled selected>Seleccione el producto de reemplazo...</option>';

            productos.forEach(p => {
                const activo = p.activo !== undefined ? Number(p.activo) : 1;
                if (activo === 0) return;

                const stock = Number(p.stock ?? p.stock_actual_calculado ?? 0);
                const idProd = p.ID_PRODUCTO || p.id_producto;
                const opt = document.createElement('option');
                opt.value = idProd;
                opt.textContent = `${p.nombre || p.NOMBRE_PRODUCTO} — Stock disponible: ${stock}`;
                opt.dataset.stock = stock;

                if (idPreseleccionado && idProd === idPreseleccionado) {
                    opt.selected = true;
                }

                select.appendChild(opt);
            });

            if (select.value) {
                cargarSeriesModalReemplazo(select.value);
            }
        })
        .catch(err => {
            console.error('Error al cargar productos para reemplazo:', err);
            select.innerHTML = '<option value="" disabled selected>Error al cargar productos</option>';
        });
}

function cargarSeriesModalReemplazo(idProducto) {
    const listContainer = document.getElementById('modal-series-reemplazo-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<span class="text-muted text-sm"><i class="fas fa-spinner fa-spin"></i> Cargando series en inventario...</span>';

    fetch(`${API_BASE}/series/${idProducto}/disponibles`)
        .then(res => res.json())
        .then(series => {
            listContainer.innerHTML = '';
            if (!series || series.length === 0) {
                listContainer.innerHTML = '<span class="text-muted text-sm" style="color:#e67e22;">ℹ️ Este producto no maneja números de serie individuales o no tiene series disponibles en stock. Se descontará directamente por cantidad.</span>';
                return;
            }

            series.forEach(s => {
                const label = document.createElement('label');
                label.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; cursor: pointer; padding: 4px; border-radius: 4px;';
                label.innerHTML = `
                    <input type="checkbox" value="${s.NUMERO_SERIE}" class="cb-modal-serie-reemplazo" onchange="validarLimiteSeriesModal()">
                    <span style="font-family: monospace; font-weight: 600;">${s.NUMERO_SERIE}</span>
                    <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${s.CONDICION === 'Nuevo' ? '#dcfce7; color: #166534' : '#fef3c7; color: #92400e'};">${s.CONDICION}</span>
                `;
                listContainer.appendChild(label);
            });
        })
        .catch(err => {
            console.error('Error al cargar series:', err);
            listContainer.innerHTML = '<span class="text-muted text-sm text-red-500">Error al cargar series de este producto.</span>';
        });
}
window.cargarSeriesModalReemplazo = cargarSeriesModalReemplazo;

function validarLimiteSeriesModal() {
    const max = window._entregaReemplazoState.cantidadRequerida || 1;
    const marcadas = document.querySelectorAll('.cb-modal-serie-reemplazo:checked');

    if (marcadas.length > max) {
        Swal.fire({
            icon: 'warning',
            title: 'Límite alcanzado',
            text: `Solo debe seleccionar ${max} número(s) de serie correspondiente(s) a la cantidad de reemplazo.`
        });
        // Desmarcar el último
        event.target.checked = false;
    }
}
window.validarLimiteSeriesModal = validarLimiteSeriesModal;

function ejecutarCompletarDevolucion(e) {
    if (e) e.preventDefault();

    const idDevolucion = window._entregaReemplazoState.idDevolucion;
    const cantRequerida = window._entregaReemplazoState.cantidadRequerida || 1;
    const selectProd = document.getElementById('modal-reemplazo-producto-select');
    const idProductoReemplazo = selectProd ? selectProd.value : null;

    if (!idProductoReemplazo) {
        Swal.fire({ icon: 'warning', title: 'Producto requerido', text: 'Por favor seleccione el producto que entregará como reemplazo.' });
        return;
    }

    const checkboxes = document.querySelectorAll('.cb-modal-serie-reemplazo:checked');
    const allCheckboxes = document.querySelectorAll('.cb-modal-serie-reemplazo');
    
    // Si el producto maneja series, verificar que se haya seleccionado la cantidad exacta
    if (allCheckboxes.length > 0 && checkboxes.length !== cantRequerida) {
        Swal.fire({
            icon: 'warning',
            title: 'Series incompletas',
            text: `Debe seleccionar exactamente ${cantRequerida} número(s) de serie. Ha seleccionado ${checkboxes.length}.`
        });
        return;
    }

    const seriesReemplazo = Array.from(checkboxes).map(cb => cb.value).join(', ');

    const btnSubmit = document.getElementById('btn-finalizar-reemplazo');
    if (btnSubmit) btnSubmit.disabled = true;

    Swal.fire({
        title: 'Completando devolución...',
        text: 'Descontando inventario y cerrando solicitud...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    fetch(`${API_BASE}/devoluciones/${idDevolucion}/completar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_producto_reemplazo: parseInt(idProductoReemplazo),
            series_reemplazo: seriesReemplazo || null
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                cerrarModalEntregaReemplazo();
                Swal.fire({
                    icon: 'success',
                    title: '¡Devolución Completada!',
                    text: data.message,
                    confirmButtonColor: '#10b981'
                });
                cargarDevoluciones();
                if (typeof cargarSeguimientoSolicitudesVentas === 'function') {
                    cargarSeguimientoSolicitudesVentas();
                }
            } else {
                if (btnSubmit) btnSubmit.disabled = false;
                Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo completar la devolución' });
            }
        })
        .catch(err => {
            if (btnSubmit) btnSubmit.disabled = false;
            console.error('Error al completar devolución:', err);
            Swal.fire({ icon: 'error', title: 'Error de Red', text: err.message });
        });
}
window.ejecutarCompletarDevolucion = ejecutarCompletarDevolucion;

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

let _enviandoSolicitudDevolucion = false;

function agregarDevolucion(e) {
    if (e) e.preventDefault();

    if (_enviandoSolicitudDevolucion) {
        console.warn('Ya se está procesando una solicitud de devolución.');
        return;
    }

    const idVenta = document.getElementById('venta-select')?.value;
    const idProducto = document.getElementById('producto-devolucion-select')?.value;
    const cantidad = parseInt(document.getElementById('cantidad-devolucion')?.value);
    const motivo = document.getElementById('motivo-devolucion')?.value.trim();
    const serieDevuelta = document.getElementById('serie-devolucion')?.value.trim();
    const accion = document.getElementById('accion-select')?.value || 'garantia';

    if (!idVenta || !idProducto || !cantidad || !motivo) {
        Swal.fire({ icon: 'warning', title: 'Campos Incompletos', text: 'Por favor seleccione la factura, el producto, la cantidad y el motivo de la devolución.' });
        return;
    }

    // Al solicitar devolución, el producto de reemplazo está bloqueado y pendiente de asignación
    const prodReemplazoEl = document.getElementById('producto-reemplazo-select');
    const idProductoReemplazo = (prodReemplazoEl && prodReemplazoEl.value && prodReemplazoEl.value !== '') 
        ? parseInt(prodReemplazoEl.value) 
        : parseInt(idProducto);

    const checkboxes = document.querySelectorAll('.cb-serie-reemplazo:checked');
    const seriesReemplazo = Array.from(checkboxes).map(cb => cb.value).join(', ');

    _enviandoSolicitudDevolucion = true;
    const btnSubmit = document.getElementById('btn-solicitar-devolucion');
    if (btnSubmit) btnSubmit.disabled = true;

    Swal.fire({ title: 'Enviando Solicitud de Devolución...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

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
            id_producto_reemplazo: idProductoReemplazo,
            series_reemplazo: seriesReemplazo || null
        })
    })
        .then(res => res.json())
        .then(data => {
            _enviandoSolicitudDevolucion = false;
            if (btnSubmit) btnSubmit.disabled = false;

            if (data.error) {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: '¡Solicitud Registrada!',
                    text: data.message || 'La solicitud de devolución fue enviada a administración.',
                    confirmButtonColor: '#28a745'
                });
                limpiarFormularioDevolucion();
                cargarDevoluciones();
                if (typeof cargarSeguimientoSolicitudesVentas === 'function') {
                    cargarSeguimientoSolicitudesVentas();
                }
            }
        })
        .catch(err => {
            _enviandoSolicitudDevolucion = false;
            if (btnSubmit) btnSubmit.disabled = false;
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
    poblarSelectProveedoresDev();
    poblarSelectProductosProvDev();
});


