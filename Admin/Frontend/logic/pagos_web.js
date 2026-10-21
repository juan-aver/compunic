/**
 * @file pagos_web.js
 * @description Lógica del módulo de gestión de pagos de la tienda web (G_Pagos_Web.html).
 * Se encarga de cargar los pedidos pendientes de verificación, mostrar comprobantes
 * y realizar las acciones de aprobación o rechazo de ventas.
 */

(function() {
    const getApiBase = () => {
        if (typeof API_BASE !== 'undefined') {
            return API_BASE.replace(/\/api\/?$/, '');
        }
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '' && window.location.port !== '3001';
        if (isLocal) {
            return 'http://localhost:3001';
        }
        return window.location.origin || '';
    };
    const API = getApiBase();
    let currentEstado = 'PENDIENTE';
    let pedidoParaRechazar = null;
    let pedidoParaEfectivo = null;

    // Inicializar al cargar la vista
    window.initPagos = function() {
        console.log('💳 Inicializando Gestión de Pagos Tienda Web...');
        cargarResumen();
        cargarPedidos('PENDIENTE');
    };

    // Cargar contadores de resumen
    async function cargarResumen() {
        try {
            const res  = await fetch(`${API}/api/admin/pagos/resumen`);
            const data = await res.json();
            if (!data.success) return;
            const r = data.resumen;
            
            const numPendiente = document.getElementById('num-pendiente');
            const numVerificando = document.getElementById('num-verificando');
            const numConfirmado = document.getElementById('num-confirmado');
            const numRechazado = document.getElementById('num-rechazado');
            const numTodos = document.getElementById('num-todos');

            if (numPendiente) numPendiente.textContent   = r.PENDIENTE   || 0;
            if (numVerificando) numVerificando.textContent = r.VERIFICANDO  || 0;
            if (numConfirmado) numConfirmado.textContent  = r.CONFIRMADO   || 0;
            if (numRechazado) numRechazado.textContent   = r.RECHAZADO    || 0;
            if (numTodos) {
                numTodos.textContent = Object.values(r).reduce((a,b)=>a+b,0);
            }
        } catch(e) { console.error('Error cargando resumen:', e); }
    }

    // -------------------------------------------------------
    // Detectar si el método de pago es en físico/efectivo
    // -------------------------------------------------------
    function esMetodoFisico(metodoPago) {
        if (!metodoPago) return false;
        const m = metodoPago.toLowerCase();
        return m.includes('efectivo') || m.includes('cash') || m.includes('físico') ||
               m.includes('fisico') || m.includes('en tienda') || m.includes('presencial');
    }

    function badgeMetodoPago(metodoPago) {
        if (!metodoPago) return '<span style="color:#94a3b8; font-size:0.8rem;">—</span>';
        const fisico = esMetodoFisico(metodoPago);
        if (fisico) {
            return `<span style="background:#ecfdf5; border:1px solid #6ee7b7; color:#047857;
                        padding:3px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;
                        white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
                        💵 ${metodoPago}
                    </span>`;
        }
        return `<span style="background:#eff6ff; border:1px solid #93c5fd; color:#1d4ed8;
                    padding:3px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;
                    white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
                    🏦 ${metodoPago}
                </span>`;
    }

    async function cargarPedidos(estado) {
        currentEstado = estado;
        const filtro = document.getElementById('filtro-estado');
        if (filtro) filtro.value = estado;

        const loading = document.getElementById('pagos-loading');
        const empty   = document.getElementById('pagos-empty');
        const tbody   = document.getElementById('tbody-pagos');

        if (loading) loading.style.display = 'block';
        if (empty) empty.style.display   = 'none';
        if (tbody) tbody.innerHTML       = '';

        try {
            console.log(`🔍 Cargando pedidos con estado: ${estado}...`);
            const res  = await fetch(`${API}/api/admin/pagos?estado=${estado}&limit=100`);
            const data = await res.json();
            if (loading) loading.style.display = 'none';

            if (!data.success || !data.pedidos.length) {
                if (empty) empty.style.display = 'block';
                return;
            }

            if (!tbody) return;

            tbody.innerHTML = data.pedidos.map(p => {
                const pendienteOVerificando = p.ESTADO_PAGO !== 'CONFIRMADO' && p.ESTADO_PAGO !== 'RECHAZADO';

                // Sección de comprobante: mostrar el código digitado directamente
                let comprobanteCell = '';
                if (p.REFERENCIA_BANCARIA && p.REFERENCIA_BANCARIA.trim() !== '') {
                    comprobanteCell = `<strong style="font-family:monospace; font-size:0.9rem; color:#1e293b;">${p.REFERENCIA_BANCARIA}</strong>`;
                } else {
                    comprobanteCell = `<span style="color:#047857; font-size:0.78rem; font-weight:600;
                        background:#ecfdf5; padding:4px 10px; border-radius:8px; border:1px solid #a7f3d0;">
                        💵 Efectivo
                    </span>`;
                }

                // Imagen del comprobante: botón para ver la imagen si se subió una
                let imagenCell = '';
                if (p.RUTA_IMAGEN && p.RUTA_IMAGEN.trim() !== '') {
                    imagenCell = `<button onclick="verComprobante('${API}/${p.RUTA_IMAGEN}', '${(p.NOTAS_CLIENTE||'').replace(/'/g,"\\'")}', ${p.ID_VENTA})"
                         style="background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; padding:6px 12px;
                                border-radius:8px; cursor:pointer; font-size:0.8rem; font-weight:600;">
                         🖼️ Ver Imagen
                       </button>`;
                } else {
                    imagenCell = `<span style="color:#64748b; font-size:0.78rem;">No subida</span>`;
                }

                // Botones de acción: exactamente dos botones para aprobar y rechazar
                let botonesAccion = '';
                if (pendienteOVerificando) {
                    botonesAccion += `
                        <button onclick="aprobarPago(${p.ID_VENTA})"
                            style="background:#10b981; color:white; padding:6px 12px;
                                   border-radius:8px; border:none; cursor:pointer; font-size:0.8rem; font-weight:700; transition: background 0.2s;">
                            Aprobar Venta
                        </button>
                        <button onclick="abrirModalRechazo(${p.ID_VENTA})"
                            style="background:#ef4444; color:white; padding:6px 12px;
                                   border-radius:8px; border:none; cursor:pointer; font-size:0.8rem; font-weight:700; transition: background 0.2s;">
                            Rechazar Venta
                        </button>`;
                }

                return `
                <tr id="row-${p.ID_VENTA}">
                    <td><strong>${p.FACTURA || p.ID_VENTA}</strong></td>
                    <td>${new Date(p.FECHA).toLocaleDateString('es-NI', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                    <td>
                        <div style="font-weight:600;">${p.nombre_cliente}</div>
                        <div style="font-size:0.75rem; color:#64748b;">${p.email_cliente}</div>
                        <div style="font-size:0.75rem; color:#64748b;">📞 ${p.telefono_cliente || '—'}</div>
                    </td>
                    <td><strong style="color:#0f172a;">C$ ${parseFloat(p.MONTO_ADELANTO || (p.TOTAL * 0.5)).toFixed(2)}</strong></td>
                    <td style="text-align:center;">${comprobanteCell}</td>
                    <td style="text-align:center;">${imagenCell}</td>
                    <td>${badgeEstado(p.ESTADO_PAGO)}</td>
                    <td>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            ${botonesAccion || '<span style="color:#94a3b8; font-size:0.8rem;">—</span>'}
                        </div>
                    </td>
                </tr>`;
            }).join('');

        } catch(e) {
            if (loading) loading.style.display = 'none';
            console.error('Error cargando pedidos:', e);
        }
    }

    function badgeEstado(estado) {
        const map = {
            PENDIENTE:   { bg:'#fff7ed', border:'#fed7aa', color:'#c2410c', label:'⏳ Pendiente' },
            VERIFICANDO: { bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8', label:'🔍 Verificando' },
            CONFIRMADO:  { bg:'#f0fdf4', border:'#bbf7d0', color:'#166534', label:'✅ Confirmado' },
            RECHAZADO:   { bg:'#fef2f2', border:'#fecaca', color:'#991b1b', label:'❌ Rechazado' }
        };
        const s = map[estado] || map.PENDIENTE;
        return `<span style="background:${s.bg}; border:1px solid ${s.border}; color:${s.color};
            padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; white-space:nowrap;">${s.label}</span>`;
    }

    window.filtrarPagos    = (estado) => cargarPedidos(estado);
    window.recargarPagos   = () => { cargarResumen(); cargarPedidos(currentEstado); };

    // -------------------------------------------------------
    // Modal: Ver comprobante (Transferencia)
    // -------------------------------------------------------
    window.verComprobante = function(url, notas, idVenta) {
        const modal   = document.getElementById('modal-comprobante');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

        content.innerHTML = isImage
            ? `<img src="${url}" style="width:100%; border-radius:8px;" alt="Comprobante" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
               <div style="display:none; text-align:center; padding:20px; color:#ef4444;">⚠️ No se pudo cargar la imagen</div>
               ${notesHtml(notas)}`
            : `<a href="${url}" target="_blank" style="display:block; text-align:center; padding:20px; background:#f8fafc; border-radius:8px; color:#6366f1; font-weight:700;">
                 📄 Ver PDF
               </a>`;

        modal.style.cssText = "display:flex; position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:9999; align-items:center; justify-content:center; padding:20px;";
    };

    function notesHtml(notas) {
        if (!notas || notas === 'undefined' || notas.trim() === '') return '';
        return `<p style="margin-top:10px; font-size:0.85rem; color:#64748b;"><strong>Nota del cliente:</strong> ${notas}</p>`;
    }

    window.cerrarModal = () => {
        const el = document.getElementById('modal-comprobante');
        if (el) el.style.display = 'none';
    };

    // -------------------------------------------------------
    // Aprobar pago (transferencia / general)
    // -------------------------------------------------------
    window.checkMaxSeriesWeb = function(checkbox, maxAllowed, index) {
        const checkedBoxes = document.querySelectorAll(`.cb-serie-web-${index}:checked`);
        if (checkedBoxes.length > maxAllowed) {
            checkbox.checked = false;
            Swal.showValidationMessage(`Solo puede seleccionar ${maxAllowed} serie(s) para este producto`);
            setTimeout(() => Swal.resetValidationMessage(), 3000);
        }
    };

    window.aprobarPago = async function(id) {
        try {
            // 1. Fetch venta items
            const ventaRes = await fetch(`${API}/api/ventas/${id}`);
            const ventaData = await ventaRes.json();
            if (!ventaRes.ok || !ventaData.items) throw new Error("No se pudo obtener detalles del pedido");

            const itemsVenta = ventaData.items;

            // 2. Fetch available series for each item
            const seriesResults = await Promise.all(itemsVenta.map(item => 
                fetch(`${API}/api/series/${item.ID_PRODUCTO}/disponibles`, {
                    headers: { 'x-user-id': localStorage.getItem('compunic_admin_id') }
                }).then(r => r.json()).catch(() => [])
            ));

            // 3. Build modal HTML
            let formHtml = '<div style="max-height: 400px; overflow-y: auto; padding-right: 10px; text-align: left;">';
            let requiereSeries = false;

            itemsVenta.forEach((item, idx) => {
                const seriesDisponibles = seriesResults[idx];
                if (seriesDisponibles && seriesDisponibles.length > 0) {
                    requiereSeries = true;
                    let selectHtml = `<div style="font-size: 11px; margin-bottom: 5px;">Seleccione hasta ${item.CANTIDAD} serie(s):</div>`;
                    selectHtml += `<div class="series-checkbox-list" id="series_list_web_${idx}" style="max-height: 100px; overflow-y: auto; border: 1px solid var(--border-color, #ddd); padding: 5px; border-radius: 4px; margin-bottom: 5px; background: var(--bg-input, #fff);">`;
                    
                    seriesDisponibles.forEach(s => {
                        const condicionStyle = s.CONDICION === 'Nuevo' ? 'color: #27ae60;' : 'color: #e67e22;';
                        selectHtml += `<label style="display: block; margin-bottom: 3px; font-size: 12px; cursor: pointer;">
                            <input type="checkbox" value="${s.NUMERO_SERIE}" class="cb-serie-web-${idx}" onchange="checkMaxSeriesWeb(this, ${item.CANTIDAD}, ${idx})">
                            ${s.NUMERO_SERIE} <span style="font-size: 10px; ${condicionStyle}">(${s.CONDICION})</span>
                        </label>`;
                    });
                    selectHtml += `</div>`;
                    
                    formHtml += `<div style="margin-bottom: 15px; padding: 10px; background: var(--bg-card-alt, #f8f9fa); border-radius: 5px;">
                        <label style="font-size:13px; display:block; margin-bottom:5px; font-weight: bold; color: var(--text-color, #333);">
                            ${item.NOMBRE_PRODUCTO} <span style="color: #666; font-weight: normal;">(Cant: ${item.CANTIDAD})</span>
                        </label>
                        ${selectHtml}
                    </div>`;
                }
            });
            formHtml += '</div>';

            if (requiereSeries) {
                Swal.fire({
                    title: 'Asignar Series y Aprobar',
                    html: formHtml,
                    showCancelButton: true,
                    confirmButtonText: 'Aprobar Venta',
                    cancelButtonText: 'Cancelar',
                    customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-outline' },
                    preConfirm: () => {
                        const seriesData = {};
                        for (let idx = 0; idx < itemsVenta.length; idx++) {
                            const item = itemsVenta[idx];
                            const seriesDisponibles = seriesResults[idx];
                            if (seriesDisponibles && seriesDisponibles.length > 0) {
                                const checked = document.querySelectorAll(`.cb-serie-web-${idx}:checked`);
                                if (checked.length !== item.CANTIDAD) {
                                    Swal.showValidationMessage(`Debe seleccionar exactamente ${item.CANTIDAD} serie(s) para ${item.NOMBRE_PRODUCTO}`);
                                    return false;
                                }
                                seriesData[item.ID_PRODUCTO] = Array.from(checked).map(cb => cb.value).join(',');
                            }
                        }
                        return seriesData;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        enviarAprobacion(id, result.value);
                    }
                });
            } else {
                Swal.fire({
                    title: '¿Confirmar aprobación?',
                    text: 'Se notificará al cliente por email.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Aprobar Venta',
                    cancelButtonText: 'Cancelar',
                    customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-outline' }
                }).then((result) => {
                    if (result.isConfirmed) {
                        enviarAprobacion(id, null);
                    }
                });
            }
        } catch (error) {
            console.error(error);
            showToast('Error al verificar detalles del pedido', 'error');
        }
    };

    async function enviarAprobacion(id, seriesData) {
        try {
            const bodyData = seriesData ? { series: seriesData } : {};
            const res  = await fetch(`${API}/api/admin/pagos/${id}/aprobar`, { 
                method:'POST', 
                headers:{'Content-Type':'application/json'}, 
                body: JSON.stringify(bodyData) 
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({icon: 'success', title: 'Aprobado', text: 'Pago aprobado. Cliente notificado.', timer: 2000, showConfirmButton: false});
                window.recargarPagos();
            } else {
                Swal.fire({icon: 'error', title: 'Error', text: data.error || 'Error al aprobar'});
            }
        } catch(e) { 
            Swal.fire({icon: 'error', title: 'Error', text: 'Error de conexión'});
        }
    }

    // -------------------------------------------------------
    // Marcar en verificación (solo transferencias)
    // -------------------------------------------------------
    window.marcarVerificando = async function(id) {
        try {
            const res  = await fetch(`${API}/api/admin/pagos/${id}/verificando`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
            const data = await res.json();
            if (data.success) { showToast('🔍 Marcado como en verificación', 'info'); window.recargarPagos(); }
        } catch(e) { showToast('Error de conexión', 'error'); }
    };

    // -------------------------------------------------------
    // Modal: Rechazar pago
    // -------------------------------------------------------
    window.abrirModalRechazo = function(id) {
        pedidoParaRechazar = id;
        const motivo = document.getElementById('motivo-rechazo');
        const modal = document.getElementById('modal-rechazar');
        if (motivo) motivo.value = '';
        if (modal) modal.style.cssText = "display:flex; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:9999; align-items:center; justify-content:center; padding:20px;";
    };
    window.cerrarModalRechazo = () => {
        const modal = document.getElementById('modal-rechazar');
        if (modal) modal.style.display = 'none';
        pedidoParaRechazar = null;
    };

    window.confirmarRechazo = async function() {
        const el = document.getElementById('motivo-rechazo');
        const motivo = el ? el.value.trim() : '';
        if (!motivo || motivo.length < 5) { Alerta.advertencia('Escribe un motivo de al menos 5 caracteres'); return; }
        if (!pedidoParaRechazar) return;

        try {
            const res  = await fetch(`${API}/api/admin/pagos/${pedidoParaRechazar}/rechazar`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ motivo })
            });
            const data = await res.json();
            if (data.success) {
                window.cerrarModalRechazo();
                showToast('❌ Pago rechazado. Cliente notificado.', 'error');
                window.recargarPagos();
            } else {
                showToast(data.error || 'Error al rechazar', 'error');
            }
        } catch(e) { showToast('Error de conexión', 'error'); }
    };

    // -------------------------------------------------------
    // Modal: Confirmar pago en efectivo / físico
    // -------------------------------------------------------
    window.abrirModalEfectivo = function(id, factura, cliente, total) {
        pedidoParaEfectivo = id;
        const notas = document.getElementById('notas-efectivo');
        const info = document.getElementById('efectivo-pedido-info');
        const modal = document.getElementById('modal-efectivo');
        if (notas) notas.value = '';
        if (info) {
            info.innerHTML =
                `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    <div><span style="opacity:.7;">Pedido:</span> <strong>${factura}</strong></div>
                    <div><span style="opacity:.7;">Total:</span> <strong>C$ ${parseFloat(total).toFixed(2)}</strong></div>
                    <div style="grid-column:1/-1;"><span style="opacity:.7;">Cliente:</span> <strong>${cliente}</strong></div>
                 </div>`;
        }
        if (modal) modal.style.cssText = "display:flex; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:9999; align-items:center; justify-content:center; padding:20px;";
    };

    window.cerrarModalEfectivo = () => {
        const modal = document.getElementById('modal-efectivo');
        if (modal) modal.style.display = 'none';
        pedidoParaEfectivo = null;
    };

    window.confirmarPagoEfectivo = async function() {
        if (!pedidoParaEfectivo) return;
        const el = document.getElementById('notas-efectivo');
        const notas = el ? el.value.trim() : '';

        try {
            const res = await fetch(`${API}/api/admin/pagos/${pedidoParaEfectivo}/confirmar-fisico`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ notas: notas || 'Pago recibido en efectivo en tienda física.' })
            });
            const data = await res.json();
            if (data.success) {
                window.cerrarModalEfectivo();
                showToast('💵 Pago en efectivo confirmado. Cliente notificado.', 'success');
                window.recargarPagos();
            } else {
                showToast(data.error || 'Error al confirmar', 'error');
            }
        } catch(e) { showToast('Error de conexión', 'error'); }
    };

    // -------------------------------------------------------
    // Toast notifications
    // -------------------------------------------------------
    function showToast(msg, type) {
        const colors = { success:'#22c55e', error:'#ef4444', info:'#6366f1' };
        const t = document.createElement('div');
        t.style.cssText = `position:fixed; top:80px; right:20px; background:${colors[type]||colors.info};
            color:white; padding:12px 20px; border-radius:10px; font-weight:700; z-index:99999; font-size:.875rem;
            box-shadow:0 8px 24px rgba(0,0,0,.15); animation:slideIn .3s ease;`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 4000);
    }
})();
