/**
 * @file caja.js
 * @description Lógica interactiva para el Módulo de Caja (CU-27, CU-28, CU-29).
 */

const CajaApp = {
    sesionActual: null,
    apiBase: ((typeof API_BASE !== 'undefined' ? API_BASE : (window.API_BASE_URL || '/api')).replace(/\/+$/, '')) + '/caja',

    /**
     * Inicialización del módulo
     */
    init: async function() {
        console.log('💵 Inicializando Módulo de Caja...');
        await this.cargarDatosCaja();
    },

    /**
     * Consulta el estado de la caja y actualiza la interfaz
     */
    cargarDatosCaja: async function() {
        try {
            const user = (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession() : null;
            const res = await fetch(`${this.apiBase}/estado`);
            if (!res.ok) throw new Error('Error al consultar el estado de la caja.');

            const data = await res.json();
            this.sesionActual = data.sesion;

            this.renderizarEstado(data.abierta, data.sesion);
        } catch (err) {
            console.error('Error al cargar datos de caja:', err);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: 'No se pudo conectar con el servidor para consultar el estado de la caja.'
                });
            }
        }
    },

    /**
     * Renderiza la vista según si la caja está abierta o cerrada
     */
    renderizarEstado: function(estaAbierta, sesion) {
        const statusIndicator = document.getElementById('caja-status-indicator');
        const statusText = document.getElementById('caja-status-text');
        const btnHeader = document.getElementById('btn-header-accion-caja');
        const viewCerrada = document.getElementById('caja-cerrada-view');
        const viewAbierta = document.getElementById('caja-abierta-view');

        if (estaAbierta && sesion) {
            // Estado ABIERTA
            if (statusIndicator) {
                statusIndicator.className = 'caja-status-pill status-abierta';
            }
            if (statusText) {
                statusText.textContent = `Turno #${sesion.ID_CAJA_SESION} Abierto (${sesion.NOMBRE_CAJERO || 'Cajero'})`;
            }
            if (btnHeader) {
                btnHeader.className = 'btn-caja btn-caja-arqueo';
                btnHeader.innerHTML = '<i class="fas fa-calculator"></i> Arqueo & Cerrar';
                btnHeader.onclick = () => this.mostrarModalArqueo();
            }

            if (viewCerrada) viewCerrada.style.display = 'none';
            if (viewAbierta) viewAbierta.style.display = 'block';

            // Actualizar KPIs
            document.getElementById('kpi-monto-inicial').textContent = `C$ ${parseFloat(sesion.monto_inicial || 0).toFixed(2)}`;
            document.getElementById('kpi-ventas-efectivo').textContent = `C$ ${parseFloat(sesion.total_ventas_efectivo || 0).toFixed(2)}`;
            if (document.getElementById('kpi-count-efectivo')) {
                document.getElementById('kpi-count-efectivo').textContent = `${sesion.cantidad_efectivo || 0} ventas`;
            }
            if (document.getElementById('kpi-ventas-transferencia')) {
                document.getElementById('kpi-ventas-transferencia').textContent = `C$ ${parseFloat(sesion.total_ventas_transferencia || 0).toFixed(2)}`;
            }
            if (document.getElementById('kpi-count-transferencias')) {
                document.getElementById('kpi-count-transferencias').textContent = `${sesion.cantidad_transferencias || 0} transferencias`;
            }
            document.getElementById('kpi-otros-ingresos').textContent = `C$ ${parseFloat(sesion.total_ingresos_manuales || 0).toFixed(2)}`;
            document.getElementById('kpi-salidas-gastos').textContent = `C$ ${parseFloat(sesion.total_egresos_manuales || 0).toFixed(2)}`;
            document.getElementById('kpi-saldo-teorico').textContent = `C$ ${parseFloat(sesion.saldo_esperado_efectivo || 0).toFixed(2)}`;
            if (document.getElementById('kpi-total-global-turno')) {
                const totalGlobal = parseFloat(sesion.total_esperado_turno !== undefined ? sesion.total_esperado_turno : (parseFloat(sesion.saldo_esperado_efectivo || 0) + parseFloat(sesion.total_ventas_transferencia || 0)));
                document.getElementById('kpi-total-global-turno').textContent = `C$ ${totalGlobal.toFixed(2)}`;
            }

            // Actualizar contadores en botones de filtro
            if (document.getElementById('pill-count-todas')) {
                document.getElementById('pill-count-todas').textContent = (sesion.ventas || []).length;
            }
            if (document.getElementById('pill-count-efectivo')) {
                document.getElementById('pill-count-efectivo').textContent = sesion.cantidad_efectivo || 0;
            }
            if (document.getElementById('pill-count-transferencia')) {
                document.getElementById('pill-count-transferencia').textContent = sesion.cantidad_transferencias || 0;
            }

            // Actualizar contadores pestañas
            document.getElementById('count-movimientos').textContent = (sesion.movimientos || []).length;
            document.getElementById('count-ventas').textContent = (sesion.ventas || []).length;

            // Renderizar tablas
            this.renderizarMovimientos(sesion.movimientos || []);
            this.renderizarVentas(sesion.ventas || []);
        } else {
            // Estado CERRADA
            if (statusIndicator) {
                statusIndicator.className = 'caja-status-pill status-cerrada';
            }
            if (statusText) {
                statusText.textContent = 'Caja Cerrada';
            }
            if (btnHeader) {
                btnHeader.className = 'btn-caja btn-caja-abrir';
                btnHeader.innerHTML = '<i class="fas fa-key"></i> Abrir Caja';
                btnHeader.onclick = () => this.mostrarModalApertura();
            }

            if (viewCerrada) viewCerrada.style.display = 'block';
            if (viewAbierta) viewAbierta.style.display = 'none';

            // Mostrar automáticamente el historial de turnos cuando la caja está cerrada
            const tabHistorial = document.getElementById('tab-historial-content');
            if (tabHistorial) {
                tabHistorial.style.display = 'block';
                this.cargarHistorial();
            }
        }
    },

    /**
     * Filtra las ventas del turno actual por método de pago
     */
    filtrarVentasTurno: function(tipo, btn) {
        document.querySelectorAll('.caja-filter-pill').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        if (!this.sesionActual || !this.sesionActual.ventas) return;
        const ventas = this.sesionActual.ventas;

        let filtradas = ventas;
        if (tipo === 'EFECTIVO') {
            filtradas = ventas.filter(v => {
                const m = (v.METODO_PAGO_TEXT || '').toLowerCase();
                const tieneRef = v.REFERENCIA_BANCARIA && v.REFERENCIA_BANCARIA.trim() !== '';
                return !m.includes('transferencia') && !tieneRef && !m.includes('tarjeta');
            });
        } else if (tipo === 'TRANSFERENCIA') {
            filtradas = ventas.filter(v => {
                const m = (v.METODO_PAGO_TEXT || '').toLowerCase();
                const tieneRef = v.REFERENCIA_BANCARIA && v.REFERENCIA_BANCARIA.trim() !== '';
                return m.includes('transferencia') || tieneRef;
            });
        }
        this.renderizarVentas(filtradas);
    },

    /**
     * Renderiza la tabla de movimientos manuales
     */
    renderizarMovimientos: function(movimientos) {
        const tbody = document.getElementById('tabla-movimientos-body');
        if (!tbody) return;

        if (movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No hay ingresos ni salidas manuales registradas en este turno.</td></tr>`;
            return;
        }

        tbody.innerHTML = movimientos.map(m => {
            const fecha = new Date(m.FECHA_HORA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const esIngreso = m.TIPO_MOVIMIENTO === 'INGRESO';
            const badgeClass = esIngreso ? 'badge-tipo badge-ingreso' : 'badge-tipo badge-egreso';
            const signo = esIngreso ? '+' : '-';
            const colorMonto = esIngreso ? '#16a34a' : '#dc2626';

            return `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    <td><span class="${badgeClass}">${m.TIPO_MOVIMIENTO}</span></td>
                    <td>${m.CONCEPTO}</td>
                    <td style="font-weight: 700; color: ${colorMonto};">${signo} C$ ${parseFloat(m.MONTO).toFixed(2)}</td>
                    <td>${m.NOMBRE_EMPLEADO || 'Usuario'}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Renderiza la tabla de ventas cobradas en el turno
     */
    renderizarVentas: function(ventas) {
        const tbody = document.getElementById('tabla-ventas-body');
        if (!tbody) return;

        if (ventas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No hay ventas registradas con el filtro seleccionado.</td></tr>`;
            return;
        }

        tbody.innerHTML = ventas.map(v => {
            const fecha = new Date(v.FECHA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const metodoLower = (v.METODO_PAGO_TEXT || '').toLowerCase();
            const tieneRef = v.REFERENCIA_BANCARIA && v.REFERENCIA_BANCARIA.trim() !== '';
            let badgeHtml = '';

            if (metodoLower.includes('transferencia') || tieneRef) {
                const refText = v.REFERENCIA_BANCARIA ? ` <span style="font-weight: 600; opacity: 0.9;">(${v.REFERENCIA_BANCARIA})</span>` : '';
                badgeHtml = `<span class="badge-tipo badge-transferencia" title="Cobrado por Transferencia Bancaria"><i class="fas fa-university"></i> Transferencia${refText}</span>`;
            } else if (metodoLower.includes('tarjeta')) {
                badgeHtml = `<span class="badge-tipo badge-tarjeta"><i class="fas fa-credit-card"></i> Tarjeta</span>`;
            } else {
                badgeHtml = `<span class="badge-tipo badge-efectivo"><i class="fas fa-money-bill-wave"></i> Efectivo</span>`;
            }

            return `
                <tr>
                    <td><strong style="color: #0284c7;">${v.FACTURA}</strong></td>
                    <td>${fecha}</td>
                    <td>${v.CLIENTE}</td>
                    <td>${badgeHtml}</td>
                    <td>${v.VENDEDOR}</td>
                    <td style="font-weight: 800; color: #0f172a;">C$ ${parseFloat(v.TOTAL).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * CU-27: Modal para abrir turno de caja declarando fondo inicial
     */
    mostrarModalApertura: async function() {

        const { value: formValues } = await Swal.fire({
            title: '💵 Apertura de Turno de Caja',
            html: `
                <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 16px;">
                    Declara el fondo inicial en efectivo (caja chica / cambio) que tienes en la gaveta física:
                </p>
                <div style="text-align: left; margin-bottom: 12px;">
                    <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Fondo Inicial en Efectivo (C$):</label>
                    <input id="swal-monto-inicial" type="number" step="0.50" min="0" value="1000.00" class="swal2-input" style="width: 100%; margin: 6px 0;" placeholder="Ej: 1000.00">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> Confirmar Apertura',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981',
            preConfirm: () => {
                const monto = document.getElementById('swal-monto-inicial').value;
                if (!monto || isNaN(monto) || parseFloat(monto) < 0) {
                    Swal.showValidationMessage('Debe ingresar un monto numérico válido mayor o igual a 0.');
                    return false;
                }
                return monto;
            }
        });

        if (formValues !== undefined) {
            await this.procesarApertura(formValues);
        }
    },

    procesarApertura: async function(montoInicial) {
        try {
            const user = (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession() : null;
            const idEmpleado = (user && (user.id_empleado || user.id_vendedor || user.id)) || 1;

            const res = await fetch(`${this.apiBase}/abrir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_empleado: idEmpleado,
                    monto_inicial: montoInicial
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al abrir la caja.');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Caja Abierta!',
                    text: `El turno #${data.sesion.id_caja_sesion} ha sido habilitado con un fondo inicial de C$ ${parseFloat(montoInicial).toFixed(2)}.`,
                    confirmButtonColor: '#10b981'
                });
            }

            await this.cargarDatosCaja();
        } catch (err) {
            Alerta.error(err.message, 'Error al abrir caja');
        }
    },

    /**
     * CU-28: Modal para registrar entrada o salida de efectivo
     */
    mostrarModalMovimiento: async function(tipo) {
        if (!this.sesionActual) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'No hay ninguna sesión de caja abierta.' });
            return;
        }

        const esIngreso = tipo === 'INGRESO';
        const titulo = esIngreso ? '➕ Entrada de Efectivo' : '➖ Salida / Retiro de Efectivo';
        const colorBoton = esIngreso ? '#0284c7' : '#ef4444';
        const saldoDisponible = parseFloat(this.sesionActual.saldo_esperado_efectivo || 0);

        const { value: formValues } = await Swal.fire({
            title: titulo,
            html: `
                <div style="text-align: left; margin-bottom: 12px;">
                    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">
                        ${esIngreso 
                            ? 'Registra dinero adicional inyectado a la caja (ej: aumento de fondo de cambio enviado por gerencia).' 
                            : `Registra una salida de dinero en efectivo (ej: compra de papelería, delivery o retiro). <br><strong style="color: #dc2626;">Disponible en gaveta: C$ ${saldoDisponible.toFixed(2)}</strong>`}
                    </p>
                    <label style="font-weight: 700; font-size: 0.85rem; color: #334155;">Monto (C$):</label>
                    <input id="swal-mov-monto" type="number" step="0.50" min="0.01" class="swal2-input" style="width: 100%; margin: 6px 0;" placeholder="0.00">
                    
                    <label style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-top: 10px; display: block;">Concepto / Justificación obligatoria:</label>
                    <textarea id="swal-mov-concepto" class="swal2-textarea" style="width: 100%; margin: 6px 0; height: 80px;" placeholder="Ej: ${esIngreso ? 'Cambio enviado por administración' : 'Pago de delivery de emergencia'}"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Movimiento',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: colorBoton,
            preConfirm: () => {
                const monto = parseFloat(document.getElementById('swal-mov-monto').value);
                const concepto = document.getElementById('swal-mov-concepto').value.trim();

                if (isNaN(monto) || monto <= 0) {
                    Swal.showValidationMessage('Debe ingresar un monto numérico mayor a cero.');
                    return false;
                }
                if (!esIngreso && monto > saldoDisponible) {
                    Swal.showValidationMessage(`Fondos insuficientes. El efectivo disponible en caja es de C$ ${saldoDisponible.toFixed(2)}.`);
                    return false;
                }
                if (!concepto) {
                    Swal.showValidationMessage('Debe ingresar una justificación o concepto obligatorio.');
                    return false;
                }
                return { monto, concepto };
            }
        });

        if (formValues) {
            try {
                const user = (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession() : null;
                const idEmpleado = (user && (user.id_empleado || user.id_vendedor || user.id)) || (this.sesionActual ? this.sesionActual.ID_EMPLEADO : 1);

                const res = await fetch(`${this.apiBase}/movimiento`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_caja_sesion: this.sesionActual.ID_CAJA_SESION,
                        id_empleado: idEmpleado,
                        tipo_movimiento: tipo,
                        monto: formValues.monto,
                        concepto: formValues.concepto
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error al guardar movimiento.');

                Swal.fire({
                    icon: 'success',
                    title: '¡Movimiento Registrado!',
                    text: data.mensaje,
                    confirmButtonColor: '#10b981'
                });

                await this.cargarDatosCaja();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            }
        }
    },

    /**
     * CU-29: Modal de Arqueo, Conciliación y Cierre de Caja
     */
    mostrarModalArqueo: async function() {
        if (!this.sesionActual) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'No hay ninguna sesión de caja activa para cerrar.' });
            return;
        }

        const sesion = this.sesionActual;
        const esperadoEfectivo = parseFloat(sesion.saldo_esperado_efectivo || 0);
        const totalTransferencias = parseFloat(sesion.total_ventas_transferencia || 0);
        const cantTransferencias = parseInt(sesion.cantidad_transferencias || 0);
        const totalTurno = parseFloat(sesion.total_esperado_turno !== undefined ? sesion.total_esperado_turno : (esperadoEfectivo + totalTransferencias));
        const montoInicial = parseFloat(sesion.monto_inicial || 0);
        const totalVentasEfectivo = parseFloat(sesion.total_ventas_efectivo || 0);
        const totalIngresosManuales = parseFloat(sesion.total_ingresos_manuales || 0);
        const totalEgresosManuales = parseFloat(sesion.total_egresos_manuales || 0);

        const { value: formValues } = await Swal.fire({
            title: '🔒 Arqueo y Cierre de Caja',
            width: '680px',
            html: `
                <div style="text-align: left;">
                    <!-- RESUMEN DEL SISTEMA -->
                    <div class="arqueo-summary-box">
                        <!-- SECCIÓN 1: EFECTIVO FÍSICO (GAVETA) -->
                        <div style="font-weight: 800; font-size: 0.85rem; color: #059669; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                            <i class="fas fa-vault"></i> 1. Control de Efectivo Físico (Gaveta)
                        </div>
                        <div class="arqueo-row"><span>(+) Fondo Inicial de Turno:</span> <strong>C$ ${montoInicial.toFixed(2)}</strong></div>
                        <div class="arqueo-row"><span>(+) Ventas Cobradas en Efectivo:</span> <strong style="color: #16a34a;">C$ ${totalVentasEfectivo.toFixed(2)}</strong></div>
                        <div class="arqueo-row"><span>(+) Entradas Directas de Efectivo:</span> <strong>C$ ${totalIngresosManuales.toFixed(2)}</strong></div>
                        <div class="arqueo-row"><span>(-) Salidas / Retiros de Efectivo:</span> <strong style="color: #dc2626;">C$ ${totalEgresosManuales.toFixed(2)}</strong></div>
                        <div class="arqueo-row highlight">
                            <span>(=) Efectivo Teórico a Cuadrar en Gaveta:</span>
                            <span style="color: #059669;" id="modal-saldo-teorico">C$ ${esperadoEfectivo.toFixed(2)}</span>
                        </div>

                        <!-- SECCIÓN 2: TRANSFERENCIAS BANCARIAS -->
                        <div style="font-weight: 800; font-size: 0.85rem; color: #1d4ed8; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                            <i class="fas fa-university"></i> 2. Ventas por Transferencia (Bancos)
                        </div>
                        <div class="arqueo-row">
                            <span>(+) Total Transferencias Bancarias:</span>
                            <strong style="color: #1d4ed8;">C$ ${totalTransferencias.toFixed(2)} (${cantTransferencias} transacciones)</strong>
                        </div>

                        <!-- SECCIÓN 3: TOTAL GENERAL DEL TURNO -->
                        <div class="arqueo-row" style="background: #f1f5f9; padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: 800; color: #0f172a;">
                            <span><i class="fas fa-chart-pie" style="color: #7c3aed;"></i> Total Global del Turno (Efectivo + Bancos):</span>
                            <strong style="color: #7c3aed; font-size: 1.15rem;">C$ ${totalTurno.toFixed(2)}</strong>
                        </div>
                    </div>

                    <!-- DECLARACIÓN FÍSICA -->
                    <div style="margin-bottom: 16px;">
                        <label style="font-weight: 700; font-size: 0.95rem; color: #0f172a; display: block;">
                            1. Digite el Efectivo Físico Contado en la Gaveta (C$):
                        </label>
                        <input id="swal-arqueo-contado" type="number" step="0.50" min="0" value="${esperadoEfectivo.toFixed(2)}" class="swal2-input" style="width: 100%; margin: 8px 0;" placeholder="0.00">
                    </div>

                    <!-- INDICADOR DE DIFERENCIA (CUADRE / FALTANTE / SOBRANTE) -->
                    <div id="swal-arqueo-diferencia-box" class="diferencia-box diferencia-cuadre">
                        <i class="fas fa-check-circle"></i> Cuadre Exacto de Efectivo: C$ 0.00
                    </div>

                    <!-- OBSERVACIONES O JUSTIFICACIÓN -->
                    <div style="margin-top: 16px;">
                        <label style="font-weight: 700; font-size: 0.9rem; color: #334155; display: block;">
                            Observaciones de Cierre / Justificación de Descuadre:
                        </label>
                        <textarea id="swal-arqueo-obs" class="swal2-textarea" style="width: 100%; margin: 6px 0; height: 70px;" placeholder="Ej: Arqueo conforme / Comprobantes bancarios verificados..."></textarea>
                    </div>
                </div>
            `,
            didOpen: () => {
                const inputContado = document.getElementById('swal-arqueo-contado');
                const diffBox = document.getElementById('swal-arqueo-diferencia-box');

                const actualizarDiferencia = () => {
                    const contado = parseFloat(inputContado.value) || 0;
                    const diff = contado - esperadoEfectivo;

                    if (Math.abs(diff) < 0.01) {
                        diffBox.className = 'diferencia-box diferencia-cuadre';
                        diffBox.innerHTML = '<i class="fas fa-check-circle"></i> Cuadre Perfecto de Efectivo: C$ 0.00';
                    } else if (diff < 0) {
                        diffBox.className = 'diferencia-box diferencia-faltante';
                        diffBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Faltante en Gaveta: C$ ${Math.abs(diff).toFixed(2)}`;
                    } else {
                        diffBox.className = 'diferencia-box diferencia-sobrante';
                        diffBox.innerHTML = `<i class="fas fa-info-circle"></i> Sobrante en Gaveta: +C$ ${diff.toFixed(2)}`;
                    }
                };

                inputContado.addEventListener('input', actualizarDiferencia);
            },
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-lock"></i> Confirmar y Cerrar Caja',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#8b5cf6',
            preConfirm: () => {
                const inputContado = document.getElementById('swal-arqueo-contado').value;
                const contado = parseFloat(inputContado);
                const observaciones = document.getElementById('swal-arqueo-obs').value.trim();

                if (isNaN(contado) || contado < 0) {
                    Swal.showValidationMessage('Debe ingresar un monto válido de efectivo físico contado.');
                    return false;
                }

                const diff = contado - esperadoEfectivo;
                if (Math.abs(diff) >= 0.01 && !observaciones) {
                    Swal.showValidationMessage(`Hay una diferencia en efectivo de C$ ${diff.toFixed(2)}. Debe ingresar una justificación u observación obligatoria.`);
                    return false;
                }

                return { monto_real: contado, observaciones };
            }
        });

        if (formValues) {
            try {
                const user = (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession() : null;
                const idEmpleado = (user && (user.id_empleado || user.id_vendedor || user.id)) || (this.sesionActual ? this.sesionActual.ID_EMPLEADO : 1);

                const res = await fetch(`${this.apiBase}/cerrar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_caja_sesion: this.sesionActual.ID_CAJA_SESION,
                        id_empleado: idEmpleado,
                        monto_real: formValues.monto_real,
                        observaciones: formValues.observaciones
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error al cerrar caja.');

                const cierre = data.cierre;
                Swal.fire({
                    icon: 'success',
                    title: '¡Caja Cerrada Correctamente!',
                    html: `
                        <div style="text-align: left; font-size: 0.95rem;">
                            <p><strong>Turno #${cierre.id_caja_sesion}</strong> finalizado con éxito.</p>
                            <hr style="margin: 10px 0;">
                            <div>Efectivo Esperado (Gaveta): <strong>C$ ${parseFloat(cierre.monto_esperado).toFixed(2)}</strong></div>
                            <div>Efectivo Físico Contado: <strong>C$ ${parseFloat(cierre.monto_real).toFixed(2)}</strong></div>
                            <div>Diferencia en Gaveta: <strong style="color: ${cierre.diferencia === 0 ? '#16a34a' : (cierre.diferencia < 0 ? '#dc2626' : '#d97706')};">C$ ${parseFloat(cierre.diferencia).toFixed(2)}</strong></div>
                            <div style="margin-top: 6px;">Transferencias en Banco: <strong style="color: #1d4ed8;">C$ ${parseFloat(cierre.total_ventas_transferencia || totalTransferencias).toFixed(2)} (${cierre.cantidad_transferencias || cantTransferencias} comprobantes)</strong></div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">Total Global del Turno: <strong style="color: #7c3aed; font-size: 1.05rem;">C$ ${parseFloat(cierre.total_esperado_turno || totalTurno).toFixed(2)}</strong></div>
                            ${cierre.observaciones ? `<p style="margin-top: 8px; font-style: italic; color: #64748b;">"${cierre.observaciones}"</p>` : ''}
                        </div>
                    `,
                    confirmButtonColor: '#10b981'
                });

                await this.cargarDatosCaja();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            }
        }
    },

    /**
     * Carga el historial de turnos cerrados
     */
    cargarHistorial: async function() {
        const tbody = document.getElementById('tabla-historial-body');
        if (!tbody) return;

        try {
            const res = await fetch(`${this.apiBase}/historial?limite=30`);
            if (!res.ok) throw new Error('Error al obtener historial.');

            const historial = await res.json();
            if (historial.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 24px;">No hay turnos registrados en el historial.</td></tr>`;
                return;
            }

            tbody.innerHTML = historial.map(h => {
                const fApertura = new Date(h.FECHA_APERTURA).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                const fCierre = h.FECHA_CIERRE ? new Date(h.FECHA_CIERRE).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Activo';
                const esAbierta = h.ESTADO === 'ABIERTA';
                const badgeEstado = esAbierta ? 'badge-tipo badge-abierta' : 'badge-tipo badge-cerrada';

                const diff = h.DIFERENCIA !== null ? parseFloat(h.DIFERENCIA) : null;
                let diffText = '-';
                if (diff !== null) {
                    const color = diff === 0 ? '#16a34a' : (diff < 0 ? '#dc2626' : '#d97706');
                    diffText = `<strong style="color: ${color};">C$ ${diff.toFixed(2)}</strong>`;
                }

                return `
                    <tr>
                        <td><strong>#${h.ID_CAJA_SESION}</strong></td>
                        <td>${h.NOMBRE_CAJERO || 'Cajero'}</td>
                        <td>${fApertura}</td>
                        <td>${fCierre}</td>
                        <td>C$ ${parseFloat(h.MONTO_INICIAL).toFixed(2)}</td>
                        <td>${h.MONTO_ESPERADO !== null ? `C$ ${parseFloat(h.MONTO_ESPERADO).toFixed(2)}` : '-'}</td>
                        <td>${h.MONTO_REAL !== null ? `C$ ${parseFloat(h.MONTO_REAL).toFixed(2)}` : '-'}</td>
                        <td>${diffText}</td>
                        <td><span class="${badgeEstado}">${h.ESTADO}</span></td>
                        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${h.OBSERVACIONES || ''}">${h.OBSERVACIONES || '-'}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626; padding: 16px;">Error al cargar historial: ${err.message}</td></tr>`;
        }
    },

    /**
     * Alterna las pestañas de contenido
     */
    cambiarPestana: function(pestana, btn) {
        document.querySelectorAll('.caja-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const tabMovimientos = document.getElementById('tab-movimientos-content');
        const tabVentas = document.getElementById('tab-ventas-content');
        const tabHistorial = document.getElementById('tab-historial-content');

        if (tabMovimientos) tabMovimientos.style.display = pestana === 'movimientos' ? 'block' : 'none';
        if (tabVentas) tabVentas.style.display = pestana === 'ventas' ? 'block' : 'none';
        if (tabHistorial) {
            tabHistorial.style.display = pestana === 'historial' ? 'block' : 'none';
            if (pestana === 'historial') this.cargarHistorial();
        }
    }
};

// Exportar función global para el router
window.inicializarModuloCaja = function() {
    CajaApp.init();
};

window.CajaApp = CajaApp;
