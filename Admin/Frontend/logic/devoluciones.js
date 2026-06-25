/*
 * ==========================================
 * MÓDULO: devoluciones.js
 * PROPÓSITO: Lógica para gestionar las devoluciones.
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
                    <div class="detail-value">${cantidad} unidad${cantidad > 1 ? 'es' : ''}</div>
                </div>
                ${motivo ? `<div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Motivo de Devolución</div>
                    <div class="detail-value">${motivo}</div>
                </div>` : ''}
            </div>
            
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;" />
            <h4 style="margin-bottom: 10px; color: #2c3e50;">Datos del Producto Seminuevo</h4>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Precio de Venta (Seminuevo)</label>
                <input type="number" id="reingreso-precio" class="input-form" placeholder="Ej: 50000" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Garantía (Seminuevo)</label>
                <select id="reingreso-garantia" class="input-form" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="" disabled selected>Cargando garantías...</option>
                </select>
            </div>

            <div id="reingreso-resultado" style="display:none; padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-weight: 600;"></div>

            <div class="modal-actions">
                <button type="button" class="btn-cancel-reingreso" onclick="cerrarModalReingreso()">Cancelar</button>
                <button type="button" class="btn-confirm-reingreso" id="btn-confirmar-reingreso"
                    onclick="ejecutarReingreso(${id}, this)">
                    ✅ Crear/Actualizar Seminuevo
                </button>
            </div>
        </div>
    `;

    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cerrarModalReingreso();
    });

    document.body.appendChild(overlay);

    // Cargar garantías
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const select = document.getElementById('reingreso-garantia');
            if (!select) return;
            select.innerHTML = '<option value="">Sin garantía específica</option>';
            garantias.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.ID_GARANTIA;
                opt.textContent = `${g.DURACION_MESES} meses - ${g.NOMBRE_TIPO || 'Estándar'}`;
                select.appendChild(opt);
            });
        })
        .catch(console.error);
}

function cerrarModalReingreso() {
    const overlay = document.getElementById('reingreso-modal-overlay');
    if (overlay) overlay.remove();
}

function ejecutarReingreso(idDevolucion, btnEl) {
    const precioInput = document.getElementById('reingreso-precio');
    const garantiaSelect = document.getElementById('reingreso-garantia');
    
    if (precioInput && !precioInput.value) {
        alert('Por favor ingrese el precio de venta para el producto seminuevo.');
        return;
    }

    const payload = {
        precio_seminuevo: precioInput ? parseFloat(precioInput.value) : null,
        id_garantia: garantiaSelect ? garantiaSelect.value : null
    };

    btnEl.disabled = true;
    btnEl.textContent = 'Procesando...';

    const resultadoDiv = document.getElementById('reingreso-resultado');

    fetch(`${API_BASE}/devoluciones/${idDevolucion}/confirmar-reingreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
                resultadoDiv.innerHTML = `✅ ${data.message}<br><small>Nuevo Stock: <strong>${data.stock_nuevo} unidades</strong> disponibles de Seminuevo.</small>`;
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
            btnEl.textContent = '✅ Crear/Actualizar Seminuevo';
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
// FORMULARIO - CARGAR PRODUCTOS DE REEMPLAZO
// -------------------------------------------------------
function poblarSelectProductosReemplazo() {
    fetch(`${API_BASE}/productos`)
        .then(res => res.json())
        .then(productos => {
            const select = document.getElementById('producto-reemplazo-select');
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Seleccione Equipo de Reemplazo</option>';

            productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id_producto;
                // Si el stock actual es mayor a 0, mostramos el stock
                const stock = parseInt(prod.stock || 0);
                if (stock > 0) {
                    option.textContent = `${prod.nombre} (Stock: ${stock})`;
                    select.appendChild(option);
                }
            });
            
            // Listener para cargar series cuando se selecciona un producto de reemplazo
            select.addEventListener('change', function() {
                cargarSeriesDeReemplazo(this.value);
            });
        })
        .catch(err => console.error('Error al cargar productos de reemplazo:', err));
}

function cargarSeriesDeReemplazo(idProducto) {
    const container = document.getElementById('series-reemplazo-list');
    if (!container) return;

    container.innerHTML = '<span class="text-muted text-sm">Cargando series...</span>';

    fetch(`${API_BASE}/series/${idProducto}/disponibles`)
        .then(res => res.json())
        .then(series => {
            if (!series || series.length === 0) {
                container.innerHTML = '<span class="text-muted text-sm">El producto seleccionado no tiene series en stock (no requiere serie).</span>';
                return;
            }

            let html = '';
            series.forEach(s => {
                const condicionStyle = s.CONDICION === 'Nuevo' ? 'color: #27ae60;' : 'color: #e67e22;';
                html += `<label style="display: block; margin-bottom: 5px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" value="${s.NUMERO_SERIE}" class="cb-serie-reemplazo" onchange="verificarSeleccionSeriesReemplazo()">
                            ${s.NUMERO_SERIE} <span style="font-size: 11px; ${condicionStyle}">(${s.CONDICION})</span>
                         </label>`;
            });
            container.innerHTML = html;
            verificarSeleccionSeriesReemplazo(); // Ejecutar para inicializar validaciones
        })
        .catch(err => {
            console.error('Error al cargar series de reemplazo:', err);
            container.innerHTML = '<span class="text-muted text-sm" style="color:red;">Error al cargar series.</span>';
        });
}

function verificarSeleccionSeriesReemplazo() {
    const cantInput = document.getElementById('cantidad-devolucion');
    const requeridas = cantInput ? parseInt(cantInput.value || 1) : 1;
    
    // Actualizar el texto del span
    const spanReq = document.getElementById('cant-req-reemplazo');
    if (spanReq) spanReq.textContent = requeridas;

    const checkboxes = document.querySelectorAll('.cb-serie-reemplazo');
    const marcadas = document.querySelectorAll('.cb-serie-reemplazo:checked').length;

    checkboxes.forEach(cb => {
        if (!cb.checked && marcadas >= requeridas) {
            cb.disabled = true;
        } else {
            cb.disabled = false;
        }
    });
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
                    verificarSeleccionSeriesReemplazo();
                }
                
                // Pre-seleccionar automáticamente el mismo producto en "Equipo de Reemplazo"
                const reemplazoSelect = document.getElementById('producto-reemplazo-select');
                if (reemplazoSelect) {
                    const idProd = this.value;
                    const exists = Array.from(reemplazoSelect.options).some(opt => opt.value === idProd);
                    if (exists) {
                        reemplazoSelect.value = idProd;
                        cargarSeriesDeReemplazo(idProd);
                    }
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
    const serie = document.getElementById('serie-devolucion')?.value?.trim() || '';

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

    // Datos del producto de reemplazo
    const idProductoReemplazo = document.getElementById('producto-reemplazo-select').value;
    if (!idProductoReemplazo) {
        return alert('Debe seleccionar un equipo de reemplazo.');
    }

    const cbSeries = document.querySelectorAll('.cb-serie-reemplazo');
    const seriesReemplazoArray = Array.from(document.querySelectorAll('.cb-serie-reemplazo:checked')).map(cb => cb.value);
    
    // Si el producto seleccionado tiene series disponibles (la lista de checkboxes no está vacía)
    if (cbSeries.length > 0) {
        if (seriesReemplazoArray.length !== cantidad) {
            return alert(`Debe seleccionar exactamente ${cantidad} serie(s) del equipo de reemplazo.`);
        }
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
        accion: accion,
        numero_serie: serie,
        id_producto_reemplazo: parseInt(idProductoReemplazo),
        series_reemplazo: seriesReemplazoArray.join(',')
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
        
        // Limpiar sección de reemplazo
        const reemplazoSelect = document.getElementById('producto-reemplazo-select');
        if (reemplazoSelect) reemplazoSelect.value = "";
        
        const seriesList = document.getElementById('series-reemplazo-list');
        if (seriesList) seriesList.innerHTML = '<span class="text-muted text-sm">Seleccione un producto para ver sus series disponibles...</span>';
    }
}

// -------------------------------------------------------
// EVENT LISTENERS DE INICIO
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    cargarDevoluciones();
    poblarSelectVentas();
    poblarSelectProductosReemplazo();

    // Actualizar span de cantidad requerida cuando cambie el input
    const cantInput = document.getElementById('cantidad-devolucion');
    if (cantInput) {
        cantInput.addEventListener('input', verificarSeleccionSeriesReemplazo);
    }
});
