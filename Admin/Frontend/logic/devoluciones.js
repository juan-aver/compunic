/*
 * ==========================================
 * MÓDULO: devoluciones.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */

function cargarDevoluciones() {
    fetch(`${API_BASE}/devoluciones`)
        .then(res => res.json())
        .then(devoluciones => {
            const tbody = document.getElementById('devolutions-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (devoluciones.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center italic text-gray">No hay devoluciones registradas.</td></tr>`;
                return;
            }

            devoluciones.forEach(dev => {
                const fila = document.createElement('tr');
                const fechaFormateada = new Date(dev.FECHA_DEVOLUCION).toLocaleDateString();

                // Columna ACCIÓN: reingreso puede estar pendiente o confirmado
                let accionCell;
                if (dev.ACCION === 'reingreso') {
                    if (dev.REINGRESO_CONFIRMADO) {
                        // Ya fue confirmado: badge informativo azul no clickeable
                        accionCell = `<span class="badge badge-reingreso confirmado" title="Reingreso ya aplicado al stock">✓ REINGRESADO</span>`;
                    } else {
                        // Pendiente: botón verde clickeable
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
                    <td class="text-left">#${dev.ID_DEVOLUCION}</td>
                    <td class="text-left">${dev.FACTURA}</td>
                    <td class="text-left">${dev.NOMBRE_PRODUCTO}</td>
                    <td class="text-center">${dev.CANTIDAD}</td>
                    <td class="text-left">${dev.MOTIVO || 'N/A'}</td>
                    <td class="text-center">${accionCell}</td>
                    <td class="text-left">${fechaFormateada}</td>
                    <td class="text-center">
                        <button type="button" class="btn-danger" onclick="eliminarDevolucion(${dev.ID_DEVOLUCION})" title="Eliminar">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(err => {
            console.error('Error al cargar devoluciones:', err);
            const tbody = document.getElementById('devolutions-table-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Error al cargar devoluciones</td></tr>`;
        });
}

// -------------------------------------------------------
// MODAL DE CONFIRMACIÓN DE REINGRESO
// -------------------------------------------------------
function abrirModalReingreso(id, nombreProducto, cantidad, factura, fecha, motivo) {
    // Eliminar modal previo si existe
    const prevModal = document.getElementById('reingreso-modal-overlay');
    if (prevModal) prevModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reingreso-modal-overlay';
    overlay.className = 'reingreso-modal-overlay';

    overlay.innerHTML = `
        <div class="reingreso-modal" role="dialog" aria-modal="true">
            <h3>🔄 Confirmar Reingreso al Stock</h3>
            <p class="modal-subtitle">¿El producto fue reparado y está listo para reingresar al inventario?</p>

            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Producto</div>
                    <div class="detail-value">${nombreProducto}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Cantidad</div>
                    <div class="detail-value">${cantidad} unidad${cantidad > 1 ? 'es' : ''}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Factura</div>
                    <div class="detail-value">${factura}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fecha devolución</div>
                    <div class="detail-value">${fecha}</div>
                </div>
                ${motivo ? `<div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Motivo</div>
                    <div class="detail-value">${motivo}</div>
                </div>` : ''}
            </div>

            <div id="reingreso-resultado" style="display:none; padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-weight: 600;"></div>

            <div class="modal-actions">
                <button type="button" class="btn-cancel-reingreso" onclick="cerrarModalReingreso()">Cancelar</button>
                <button type="button" class="btn-confirm-reingreso" id="btn-confirmar-reingreso"
                    onclick="ejecutarReingreso(${id}, this)">
                    ✅ Confirmar Reingreso
                </button>
            </div>
        </div>
    `;

    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalReingreso();
    });

    document.body.appendChild(overlay);
}

function cerrarModalReingreso() {
    const overlay = document.getElementById('reingreso-modal-overlay');
    if (overlay) overlay.remove();
}

function ejecutarReingreso(idDevolucion, btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = 'Procesando...';

    const resultadoDiv = document.getElementById('reingreso-resultado');

    fetch(`${API_BASE}/devoluciones/${idDevolucion}/confirmar-reingreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al confirmar reingreso');
            return data;
        })
        .then(data => {
            // Mostrar resultado en el modal
            if (resultadoDiv) {
                resultadoDiv.style.display = 'block';
                resultadoDiv.style.background = 'rgba(40, 167, 69, 0.15)';
                resultadoDiv.style.border = '1px solid rgba(40, 167, 69, 0.4)';
                resultadoDiv.style.color = '#28a745';
                resultadoDiv.innerHTML = `✅ ${data.message}<br><small>Stock actualizado: <strong>${data.stock_nuevo} unidades</strong> disponibles.</small>`;
            }
            btnEl.textContent = '✓ Reingresado';
            btnEl.style.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';

            // Recargar tabla para mostrar estado persistente desde servidor
            setTimeout(() => {
                cerrarModalReingreso();
                cargarDevoluciones();
            }, 2000);
        })
        .catch(err => {
            console.error('Error al confirmar reingreso:', err);
            if (resultadoDiv) {
                resultadoDiv.style.display = 'block';
                resultadoDiv.style.background = 'rgba(220, 53, 69, 0.15)';
                resultadoDiv.style.border = '1px solid rgba(220, 53, 69, 0.4)';
                resultadoDiv.style.color = '#dc3545';
                resultadoDiv.innerHTML = `❌ Error: ${err.message}`;
            }
            btnEl.disabled = false;
            btnEl.textContent = '✅ Confirmar Reingreso';
        });
}

// -------------------------------------------------------
// FORMULARIO - CARGAR VENTAS
// -------------------------------------------------------
function poblarSelectVentas() {
    fetch(`${API_BASE}/ventas`)
        .then(res => res.json())
        .then(ventas => {
            const select = document.getElementById('venta-select');
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Seleccione una Venta</option>';

            ventas.forEach(venta => {
                const option = document.createElement('option');
                option.value = venta.ID_VENTA;
                option.textContent = `${venta.FACTURA} - ${venta.NOMBRE_CLIENTE} (${new Date(venta.FECHA).toLocaleDateString()})`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar ventas:', err));
}

// -------------------------------------------------------
// FORMULARIO - CARGAR PRODUCTOS DE UNA VENTA
// -------------------------------------------------------
function cargarProductosDeVenta(idVenta) {
    const productoSelect = document.getElementById('producto-devolucion-select');
    const cantidadInput = document.getElementById('cantidad-devolucion');
    const infoText = document.getElementById('cantidad-disponible-info');

    if (!productoSelect) return;

    // Eliminar listener previo para evitar acumulación
    if (productoSelect._changeHandler) {
        productoSelect.removeEventListener('change', productoSelect._changeHandler);
        productoSelect._changeHandler = null;
    }

    if (!idVenta) {
        productoSelect.innerHTML = '<option value="" disabled selected>Seleccione una venta primero</option>';
        productoSelect.disabled = true;
        if (infoText) infoText.textContent = '';
        return;
    }

    // Estado de carga
    productoSelect.innerHTML = '<option value="" disabled selected>Cargando productos...</option>';
    productoSelect.disabled = true;
    if (infoText) infoText.textContent = '';

    fetch(`${API_BASE}/devoluciones/venta/${idVenta}/productos`)
        .then(res => res.json())
        .then(productos => {
            productoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Producto</option>';

            if (productos.length === 0) {
                productoSelect.innerHTML = '<option value="" disabled selected>Sin productos disponibles para devolver</option>';
                productoSelect.disabled = true;
                if (infoText) {
                    infoText.textContent = '⚠ Esta venta no tiene productos disponibles. Seleccione otra venta.';
                    infoText.style.color = '#e67e22';
                }
                return;
            }

            productoSelect.disabled = false;
            if (infoText) {
                infoText.textContent = '';
                infoText.style.color = '';
            }

            productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.ID_PRODUCTO;
                option.textContent = `${prod.NOMBRE_PRODUCTO} (Disponible: ${prod.CANTIDAD_DISPONIBLE})`;
                option.dataset.cantidadDisponible = prod.CANTIDAD_DISPONIBLE;
                productoSelect.appendChild(option);
            });

            // Listener con referencia para limpieza posterior
            productoSelect._changeHandler = function () {
                const selectedOption = this.options[this.selectedIndex];
                const cantidadDisponible = selectedOption ? selectedOption.dataset.cantidadDisponible : null;

                if (cantidadDisponible && infoText) {
                    infoText.textContent = `Cantidad disponible para devolución: ${cantidadDisponible}`;
                    infoText.style.color = '';
                }

                if (cantidadInput && cantidadDisponible) {
                    cantidadInput.max = cantidadDisponible;
                    cantidadInput.value = Math.min(1, parseInt(cantidadDisponible));
                }
            };
            productoSelect.addEventListener('change', productoSelect._changeHandler);
        })
        .catch(err => {
            console.error('Error al cargar productos de venta:', err);
            productoSelect.innerHTML = '<option value="" disabled selected>Error al cargar productos</option>';
            productoSelect.disabled = true;
        });
}

// -------------------------------------------------------
// FORMULARIO - REGISTRAR DEVOLUCIÓN
// -------------------------------------------------------
function agregarDevolucion(event) {
    event.preventDefault();

    const idVenta = document.getElementById('venta-select').value;
    const idProducto = document.getElementById('producto-devolucion-select').value;
    const cantidad = parseInt(document.getElementById('cantidad-devolucion').value);
    const motivo = document.getElementById('motivo-devolucion').value;
    const accion = document.getElementById('accion-select').value;

    if (!idVenta) {
        return alert('Debe seleccionar una venta.');
    }

    if (!idProducto) {
        return alert('Debe seleccionar un producto.\n\nSi la venta no muestra productos, todos ya fueron devueltos. Seleccione otra venta.');
    }

    if (!cantidad || cantidad <= 0) {
        return alert('La cantidad debe ser mayor a 0');
    }

    if (!accion) {
        return alert('Debe seleccionar una acción');
    }

    // Deshabilitar botón mientras procesa
    const submitBtn = document.querySelector('#devolution-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
    }

    const devolucion = {
        id_venta: parseInt(idVenta),
        id_producto: parseInt(idProducto),
        cantidad: cantidad,
        motivo: motivo,
        accion: accion
    };

    fetch(`${API_BASE}/devoluciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devolucion)
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al registrar devolución');
            return data;
        })
        .then(data => {
            const msg = accion === 'reingreso'
                ? `✅ Devolución registrada (ID: ${data.id_devolucion}).\n\nAhora ve al historial y haz clic en el botón verde "REINGRESO" para confirmar que el producto fue reparado y está listo para el stock.`
                : `✅ Devolución registrada exitosamente. ID: ${data.id_devolucion}`;
            alert(msg);
            limpiarFormularioDevolucion();
            cargarDevoluciones();
        })
        .catch(err => {
            console.error('Error al registrar devolución:', err);
            alert(`❌ Error: ${err.message}`);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar Devolución';
            }
        });
}

// -------------------------------------------------------
// ELIMINAR DEVOLUCIÓN
// -------------------------------------------------------
function eliminarDevolucion(id) {
    if (!confirm('¿Está seguro de eliminar esta devolución?')) return;

    fetch(`${API_BASE}/devoluciones/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            alert('Devolución eliminada exitosamente');
            cargarDevoluciones();
        })
        .catch(err => {
            console.error('Error al eliminar devolución:', err);
            alert('Error al eliminar devolución');
        });
}

// -------------------------------------------------------
// LIMPIAR FORMULARIO
// -------------------------------------------------------
function limpiarFormularioDevolucion() {
    const form = document.getElementById('devolution-form');
    if (form) {
        form.reset();
        const productoSelect = document.getElementById('producto-devolucion-select');
        if (productoSelect) {
            if (productoSelect._changeHandler) {
                productoSelect.removeEventListener('change', productoSelect._changeHandler);
                productoSelect._changeHandler = null;
            }
            productoSelect.innerHTML = '<option value="" disabled selected>Seleccione una venta primero</option>';
            productoSelect.disabled = true;
        }
        const infoText = document.getElementById('cantidad-disponible-info');
        if (infoText) {
            infoText.textContent = '';
            infoText.style.color = '';
        }
    }
}
