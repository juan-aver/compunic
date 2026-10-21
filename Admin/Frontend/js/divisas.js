/**
 * @file divisas.js
 * @description Módulo global de conversión automática de divisas (Córdobas C$ <-> Dólares USD).
 * Obtiene la tasa oficial de cambio en tiempo real y permite conversiones instantáneas en todo el sistema.
 */

const Divisas = (function() {
    // Tasa oficial base en Nicaragua (BCN: 36.6243 C$/USD)
    const TASA_DEFAULT = 36.6243;
    let tasaActual = parseFloat(sessionStorage.getItem('compunic_tasa_usd')) || TASA_DEFAULT;
    let fechaTasa = sessionStorage.getItem('compunic_tasa_fecha') || null;
    let fuenteTasa = sessionStorage.getItem('compunic_tasa_fuente') || 'Oficial BCN';
    let isInitialized = false;

    const getApiUrl = () => {
        const base = typeof API_BASE !== 'undefined' ? API_BASE : (window.API_BASE_URL || '/api');
        return base.replace(/\/+$/, '') + '/divisas';
    };

    /**
     * Inicializar módulo y sincronizar tasa desde backend
     */
    async function init() {
        try {
            const res = await fetch(`${getApiUrl()}/tasa`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.tasa) {
                    tasaActual = parseFloat(data.tasa);
                    fechaTasa = data.fecha;
                    fuenteTasa = data.fuente || 'Oficial';
                    sessionStorage.setItem('compunic_tasa_usd', tasaActual.toString());
                    sessionStorage.setItem('compunic_tasa_fecha', fechaTasa);
                    sessionStorage.setItem('compunic_tasa_fuente', fuenteTasa);
                }
            }
        } catch (e) {
            console.warn('ℹ️ [Divisas] Usando tasa oficial en caché:', tasaActual);
        }

        isInitialized = true;
        actualizarWidgetsEnPantalla();
        return tasaActual;
    }

    /**
     * Obtener la tasa actual
     */
    function getTasa() {
        return tasaActual;
    }

    /**
     * Convertir Córdobas a Dólares
     * @param {number} cordobas 
     * @returns {number} Monto en USD con 2 decimales
     */
    function toUSD(cordobas) {
        const val = parseFloat(cordobas) || 0;
        return Math.round((val / tasaActual) * 100) / 100;
    }

    /**
     * Convertir Dólares a Córdobas
     * @param {number} dolares 
     * @returns {number} Monto en NIO con 2 decimales
     */
    function toNIO(dolares) {
        const val = parseFloat(dolares) || 0;
        return Math.round((val * tasaActual) * 100) / 100;
    }

    /**
     * Formatear monto en Dólares
     */
    function formatUSD(dolares) {
        const val = parseFloat(dolares) || 0;
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }

    /**
     * Formatear monto en Córdobas
     */
    function formatNIO(cordobas) {
        const val = parseFloat(cordobas) || 0;
        return `C$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Retorna HTML con etiqueta de conversión automática
     */
    function renderBadge(cordobas) {
        const usd = toUSD(cordobas);
        return `<span class="divisa-badge-usd" style="display:inline-flex; align-items:center; gap:4px; font-size:0.85em; font-weight:600; color:#0284c7; background:rgba(2,132,199,0.1); padding:2px 8px; border-radius:999px; margin-left:6px;" title="Conversión automática (T/C: ${tasaActual.toFixed(2)})"><i class="fas fa-dollar-sign" style="font-size:0.8em;"></i>${formatUSD(usd)}</span>`;
    }

    /**
     * Actualizar los elementos visuales que muestran la tasa en el sistema
     */
    function actualizarWidgetsEnPantalla() {
        // Actualizar textos de tasa en POS o widgets
        document.querySelectorAll('[data-divisas-tasa]').forEach(el => {
            el.textContent = tasaActual.toFixed(4);
        });

        const tcWidget = document.getElementById('topbar-tc-widget');
        if (tcWidget) {
            tcWidget.innerHTML = `
                <div class="tc-pill" title="Tasa de cambio oficial del día (${fuenteTasa}). Haz clic para abrir conversor rápido." onclick="Divisas.abrirModalConversor()">
                    <span class="tc-icon">💵</span>
                    <span class="tc-label">T/C:</span>
                    <strong class="tc-val">C$ ${tasaActual.toFixed(2)}</strong>
                    <span class="tc-unit">/ $1 USD</span>
                </div>
            `;
        }
    }

    /**
     * Modal interactivo de calculadora rápida de divisas para vendedores y administradores
     */
    function abrirModalConversor() {
        const modalId = 'modal-calculadora-divisas';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.style = 'display:flex; position:fixed; inset:0; background:rgba(10,22,40,0.7); z-index:999999; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
            modal.innerHTML = `
                <div style="background:var(--bg-card, #ffffff); border-radius:14px; width:420px; max-width:92%; box-shadow:0 20px 40px rgba(0,0,0,0.3); border:1px solid rgba(86,165,221,0.3); overflow:hidden; font-family:inherit;">
                    <div style="padding:16px 20px; background:linear-gradient(135deg, #0284c7 0%, #1e40af 100%); color:#ffffff; display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-calculator"></i> Conversor de Divisas
                        </h4>
                        <button onclick="document.getElementById('${modalId}').style.display='none'" style="background:transparent; border:none; color:#ffffff; font-size:1.4rem; cursor:pointer; line-height:1;">&times;</button>
                    </div>
                    <div style="padding:20px;">
                        <div style="background:rgba(2,132,199,0.08); border:1px solid rgba(2,132,199,0.25); border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:0.85rem; color:var(--text-color, #1e293b); display:flex; justify-content:space-between; align-items:center;">
                            <span>Tasa oficial del día:</span>
                            <strong style="color:#0284c7; font-size:1rem;">1 USD = C$ ${tasaActual.toFixed(4)}</strong>
                        </div>
                        
                        <div style="margin-bottom:14px;">
                            <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:6px; color:var(--text-color, #334155);">Monto en Córdobas (C$):</label>
                            <div style="position:relative;">
                                <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:bold; color:#64748b;">C$</span>
                                <input type="number" id="calc-input-nio" step="any" placeholder="0.00" style="width:100%; box-sizing:border-box; padding:10px 12px 10px 38px; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem; font-weight:600;">
                            </div>
                        </div>

                        <div style="text-align:center; margin:8px 0;">
                            <i class="fas fa-arrows-alt-v" style="color:#94a3b8; font-size:1.1rem;"></i>
                        </div>

                        <div style="margin-bottom:18px;">
                            <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:6px; color:var(--text-color, #334155);">Monto en Dólares ($ USD):</label>
                            <div style="position:relative;">
                                <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:bold; color:#059669;">$</span>
                                <input type="number" id="calc-input-usd" step="any" placeholder="0.00" style="width:100%; box-sizing:border-box; padding:10px 12px 10px 32px; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem; font-weight:600; color:#059669;">
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                            <button onclick="document.getElementById('${modalId}').style.display='none'" style="padding:8px 16px; border-radius:6px; border:1px solid #cbd5e1; background:transparent; cursor:pointer; font-size:0.9rem;">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const inNIO = document.getElementById('calc-input-nio');
            const inUSD = document.getElementById('calc-input-usd');

            inNIO.addEventListener('input', () => {
                const nio = parseFloat(inNIO.value);
                if (!isNaN(nio)) {
                    inUSD.value = (nio / tasaActual).toFixed(2);
                } else {
                    inUSD.value = '';
                }
            });

            inUSD.addEventListener('input', () => {
                const usd = parseFloat(inUSD.value);
                if (!isNaN(usd)) {
                    inNIO.value = (usd * tasaActual).toFixed(2);
                } else {
                    inNIO.value = '';
                }
            });
        }

        modal.style.display = 'flex';
        const inNIO = document.getElementById('calc-input-nio');
        if (inNIO) {
            inNIO.focus();
        }
    }

    // Inicializar automáticamente cuando el DOM esté listo
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    return {
        init,
        getTasa,
        toUSD,
        toNIO,
        formatUSD,
        formatNIO,
        renderBadge,
        abrirModalConversor,
        actualizarWidgetsEnPantalla
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.Divisas = Divisas;
}
