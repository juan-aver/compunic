/*
 * Módulo: reportes.js
 * Descripción: Lógica de cliente para la generación interactiva de reportes, renderizado de gráficos ApexCharts y exportación a Excel y PDF.
 */

// Variables de Estado Global del Módulo
let _reportesRangoActual = 'mes';
let _reportesPestanaActual = 'financiero';
let _datosReportes = {
    financiero: null,
    ventas: null,
    stock: null,
    servicios: null
};

// Instancias de Gráficos ApexCharts
const _charts = {};

function destruirGrafico(id) {
    if (_charts[id]) {
        try {
            _charts[id].destroy();
        } catch (e) {
            console.warn(`Error al destruir gráfico ${id}:`, e);
        }
        delete _charts[id];
    }
}

// ==========================================================================
// CONTROL DE FECHAS Y FILTROS
// ==========================================================================
function obtenerRangoFechas() {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    if (_reportesRangoActual === 'hoy') {
        fechaInicio = hoy.toISOString().split('T')[0];
        fechaFin = hoy.toISOString().split('T')[0];
    } else if (_reportesRangoActual === '7d') {
        const hace7Dias = new Date();
        hace7Dias.setDate(hoy.getDate() - 7);
        fechaInicio = hace7Dias.toISOString().split('T')[0];
        fechaFin = hoy.toISOString().split('T')[0];
    } else if (_reportesRangoActual === 'anio') {
        fechaInicio = `${hoy.getFullYear()}-01-01`;
        fechaFin = hoy.toISOString().split('T')[0];
    } else if (_reportesRangoActual === 'custom') {
        fechaInicio = document.getElementById('reporte_fecha_inicio')?.value || '';
        fechaFin = document.getElementById('reporte_fecha_fin')?.value || '';
    } else {
        // Por defecto: 'mes'
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaInicio = primerDiaMes.toISOString().split('T')[0];
        fechaFin = hoy.toISOString().split('T')[0];
    }

    return { fechaInicio, fechaFin };
}

function aplicarRangoPreset(rango) {
    _reportesRangoActual = rango;

    document.querySelectorAll('.btn-date-preset').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-range') === rango);
    });

    const customPanel = document.getElementById('custom-date-panel');
    if (customPanel) {
        customPanel.style.display = (rango === 'custom') ? 'block' : 'none';
    }

    if (rango !== 'custom') {
        consultarReportes();
    }
}
window.aplicarRangoPreset = aplicarRangoPreset;

function toggleCustomDates() {
    aplicarRangoPreset('custom');
}
window.toggleCustomDates = toggleCustomDates;

function cambiarPestanaReporte(pestana) {
    _reportesPestanaActual = pestana;

    document.querySelectorAll('.reportes-tabs-nav .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === pestana);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });

    const activePane = document.getElementById(`tab-${pestana}`);
    if (activePane) {
        activePane.style.display = 'block';
    }

    consultarReportes();
}
window.cambiarPestanaReporte = cambiarPestanaReporte;

// ==========================================================================
// CONSULTA Y DISTRIBUCIÓN DE REPORTES
// ==========================================================================
function consultarReportes() {
    const { fechaInicio, fechaFin } = obtenerRangoFechas();

    if (_reportesPestanaActual === 'financiero') {
        cargarReporteFinanciero(fechaInicio, fechaFin);
    } else if (_reportesPestanaActual === 'ventas') {
        cargarReporteVentas(fechaInicio, fechaFin);
    } else if (_reportesPestanaActual === 'stock') {
        cargarReporteStock();
    } else if (_reportesPestanaActual === 'servicios') {
        cargarReporteServicios(fechaInicio, fechaFin);
    }
}
window.consultarReportes = consultarReportes;

// ==========================================================================
// 1. REPORTE FINANCIERO
// ==========================================================================
function cargarReporteFinanciero(fechaInicio, fechaFin) {
    let url = `${API_BASE}/reportes/financiero`;
    if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            _datosReportes.financiero = data;
            const k = data.kpis;

            // KPIs
            document.getElementById('kpi-fin-ingresos').textContent = `C$ ${k.total_ingresos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-fin-ingresos-desglose').textContent = `Ventas: C$ ${k.total_ventas.toFixed(2)} | Servicios: C$ ${k.total_servicios.toFixed(2)}`;
            document.getElementById('kpi-fin-egresos').textContent = `C$ ${k.total_egresos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-fin-compras-count').textContent = `${k.ordenes_compras} compras a proveedores`;
            document.getElementById('kpi-fin-ganancia').textContent = `C$ ${k.ganancia_bruta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-fin-margen').textContent = `${k.margen_ganancia_porcentaje}%`;

            // Gráfico 1: Flujo Financiero
            destruirGrafico('chart-flujo-financiero');
            const fechas = Array.from(new Set([
                ...(data.series.ventas || []).map(v => v.fecha),
                ...(data.series.compras || []).map(c => c.fecha)
            ])).sort();

            const ventasMap = {};
            (data.series.ventas || []).forEach(v => { ventasMap[v.fecha] = parseFloat(v.total_ventas); });
            const comprasMap = {};
            (data.series.compras || []).forEach(c => { comprasMap[c.fecha] = parseFloat(c.total_compras); });

            const optionsFlujo = {
                chart: {
                    type: 'area',
                    height: 320,
                    toolbar: { show: false },
                    fontFamily: 'Inter, sans-serif'
                },
                series: [
                    { name: 'Ingresos por Ventas', data: fechas.map(f => ventasMap[f] || 0) },
                    { name: 'Egresos por Compras', data: fechas.map(f => comprasMap[f] || 0) }
                ],
                xaxis: { categories: fechas.length ? fechas : ['Sin datos'] },
                colors: ['#10b981', '#ef4444'],
                stroke: { curve: 'smooth', width: 3 },
                dataLabels: { enabled: false },
                fill: {
                    type: 'gradient',
                    gradient: { opacityFrom: 0.5, opacityTo: 0.05 }
                },
                tooltip: {
                    y: { formatter: val => `C$ ${val.toFixed(2)}` }
                }
            };
            _charts['chart-flujo-financiero'] = new ApexCharts(document.querySelector("#chart-flujo-financiero"), optionsFlujo);
            _charts['chart-flujo-financiero'].render();

            // Gráfico 2: Fuentes de Ingreso
            destruirGrafico('chart-fuentes-ingresos');
            const totalV = k.total_ventas;
            const totalS = k.total_servicios;

            const optionsFuentes = {
                chart: { type: 'donut', height: 320, fontFamily: 'Inter, sans-serif' },
                series: (totalV === 0 && totalS === 0) ? [1] : [totalV, totalS],
                labels: (totalV === 0 && totalS === 0) ? ['Sin Ingresos'] : ['Venta de Productos', 'Servicios Técnicos'],
                colors: (totalV === 0 && totalS === 0) ? ['#cbd5e1'] : ['#0284c7', '#8b5cf6'],
                legend: { position: 'bottom' },
                tooltip: {
                    y: { formatter: val => `C$ ${val.toFixed(2)}` }
                }
            };
            _charts['chart-fuentes-ingresos'] = new ApexCharts(document.querySelector("#chart-fuentes-ingresos"), optionsFuentes);
            _charts['chart-fuentes-ingresos'].render();
        })
        .catch(err => console.error('Error cargando reporte financiero:', err));
}

// ==========================================================================
// 2. REPORTE DE VENTAS
// ==========================================================================
function cargarReporteVentas(fechaInicio, fechaFin) {
    let url = `${API_BASE}/reportes/ventas`;
    if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            _datosReportes.ventas = data;
            const listado = data.listado || [];

            let totalVentas = 0;
            let totalPOS = 0;
            let countPOS = 0;
            let totalWeb = 0;
            let countWeb = 0;

            listado.forEach(v => {
                const total = parseFloat(v.TOTAL || 0);
                totalVentas += total;
                if ((v.TIPO_CANAL || '').toUpperCase() === 'WEB') {
                    totalWeb += total;
                    countWeb++;
                } else {
                    totalPOS += total;
                    countPOS++;
                }
            });

            const ticketPromedio = listado.length > 0 ? (totalVentas / listado.length) : 0;

            // KPIs
            document.getElementById('kpi-vta-total').textContent = `C$ ${totalVentas.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-vta-count').textContent = `${listado.length} transacciones registradas`;
            document.getElementById('kpi-vta-ticket').textContent = `C$ ${ticketPromedio.toFixed(2)}`;
            document.getElementById('kpi-vta-pos').textContent = `C$ ${totalPOS.toFixed(2)}`;
            document.getElementById('kpi-vta-pos-count').textContent = `${countPOS} ventas en mostrador`;
            document.getElementById('kpi-vta-web').textContent = `C$ ${totalWeb.toFixed(2)}`;
            document.getElementById('kpi-vta-web-count').textContent = `${countWeb} pedidos en línea`;

            // Gráfico 1: Top 10 Productos
            destruirGrafico('chart-top-productos');
            const topProd = data.topProductos || [];
            const optionsTop = {
                chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                plotOptions: { bar: { horizontal: true, borderRadius: 6, dataLabels: { position: 'top' } } },
                series: [{ name: 'Unidades Vendidas', data: topProd.map(p => parseInt(p.total_unidades)) }],
                xaxis: { categories: topProd.map(p => p.NOMBRE_PRODUCTO.substring(0, 22)) },
                colors: ['#0284c7'],
                dataLabels: { enabled: true, style: { colors: ['#fff'] } }
            };
            _charts['chart-top-productos'] = new ApexCharts(document.querySelector("#chart-top-productos"), optionsTop);
            _charts['chart-top-productos'].render();

            // Gráfico 2: Canales de Venta
            destruirGrafico('chart-canales-ventas');
            const optionsCanales = {
                chart: { type: 'pie', height: 320, fontFamily: 'Inter, sans-serif' },
                series: (totalPOS === 0 && totalWeb === 0) ? [1] : [totalPOS, totalWeb],
                labels: (totalPOS === 0 && totalWeb === 0) ? ['Sin Ventas'] : ['Tienda Física (POS)', 'Tienda Web (E-Commerce)'],
                colors: (totalPOS === 0 && totalWeb === 0) ? ['#cbd5e1'] : ['#0284c7', '#f97316'],
                legend: { position: 'bottom' }
            };
            _charts['chart-canales-ventas'] = new ApexCharts(document.querySelector("#chart-canales-ventas"), optionsCanales);
            _charts['chart-canales-ventas'].render();

            // Tabla Detallada
            renderizarTablaVentas(listado);
        })
        .catch(err => console.error('Error cargando reporte de ventas:', err));
}

function renderizarTablaVentas(listado) {
    const tbody = document.querySelector("#tabla-reporte-ventas tbody");
    if (!tbody) return;

    if (!listado || listado.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No hay ventas registradas en el período.</td></tr>';
        return;
    }

    tbody.innerHTML = listado.map(v => {
        const canalBadge = (v.TIPO_CANAL || 'FISICO').toUpperCase() === 'WEB'
            ? '<span class="badge" style="background:#f97316;"><i class="fas fa-globe"></i> Web</span>'
            : '<span class="badge" style="background:#0284c7;"><i class="fas fa-store"></i> POS</span>';

        return `
            <tr>
                <td><strong>${v.FACTURA || ('#V' + v.ID_VENTA)}</strong></td>
                <td>${v.FECHA ? new Date(v.FECHA).toLocaleDateString('es-NI') : '-'}</td>
                <td>${canalBadge}</td>
                <td>${v.NOMBRE_CLIENTE}</td>
                <td>${v.NOMBRE_VENDEDOR}</td>
                <td><span class="badge badge-success">${v.ESTADO}</span></td>
                <td><strong>C$ ${parseFloat(v.TOTAL || 0).toFixed(2)}</strong></td>
            </tr>
        `;
    }).join('');
}

function filtrarTablaVentas() {
    const q = (document.getElementById('buscar_filtro_ventas')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('#tabla-reporte-ventas tbody tr');
    rows.forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}
window.filtrarTablaVentas = filtrarTablaVentas;

// ==========================================================================
// 3. REPORTE DE STOCK E INVENTARIO
// ==========================================================================
function cargarReporteStock() {
    fetch(`${API_BASE}/reportes/stock`)
        .then(res => res.json())
        .then(data => {
            _datosReportes.stock = data;
            const r = data.resumen;

            // KPIs
            document.getElementById('kpi-stk-costo').textContent = `C$ ${r.valoracion_costo_total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-stk-venta').textContent = `C$ ${r.valoracion_venta_total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-stk-unidades').textContent = `${r.total_unidades_inventario} unidades totales en stock`;
            document.getElementById('kpi-stk-ganancia').textContent = `C$ ${r.ganancia_potencial_total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-stk-margen-potencial').textContent = `Margen potencial estimado: ${r.margen_potencial_porcentaje}%`;
            document.getElementById('kpi-stk-alertas').textContent = `${r.productos_stock_bajo} Bajos / ${r.productos_agotados} Agotados`;

            // Gráfico 1: Categorías
            destruirGrafico('chart-stock-categorias');
            const cats = data.categorias || [];
            const optionsCats = {
                chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                series: [{ name: 'Valoración en Ventas (C$)', data: cats.map(c => c.valor_venta) }],
                xaxis: { categories: cats.map(c => c.categoria.substring(0, 18)) },
                colors: ['#8b5cf6'],
                plotOptions: { bar: { borderRadius: 6 } },
                tooltip: { y: { formatter: val => `C$ ${val.toFixed(2)}` } }
            };
            _charts['chart-stock-categorias'] = new ApexCharts(document.querySelector("#chart-stock-categorias"), optionsCats);
            _charts['chart-stock-categorias'].render();

            // Gráfico 2: Salud del Inventario
            destruirGrafico('chart-salud-inventario');
            const optionsSalud = {
                chart: { type: 'donut', height: 320, fontFamily: 'Inter, sans-serif' },
                series: [r.productos_stock_normal, r.productos_stock_bajo, r.productos_agotados],
                labels: ['Stock Saludable (>5)', 'Stock Bajo (1-5)', 'Agotados (0)'],
                colors: ['#10b981', '#f59e0b', '#ef4444'],
                legend: { position: 'bottom' }
            };
            _charts['chart-salud-inventario'] = new ApexCharts(document.querySelector("#chart-salud-inventario"), optionsSalud);
            _charts['chart-salud-inventario'].render();

            // Tabla
            renderizarTablaStock(data.listado || []);
        })
        .catch(err => console.error('Error cargando reporte de stock:', err));
}

function renderizarTablaStock(listado) {
    const tbody = document.querySelector("#tabla-reporte-stock tbody");
    if (!tbody) return;

    if (!listado || listado.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #64748b;">No hay productos registrados en el inventario.</td></tr>';
        return;
    }

    tbody.innerHTML = listado.map(p => {
        let badgeEstado = '<span class="badge badge-success">Saludable</span>';
        if (p.ESTADO_STOCK === 'Agotado') {
            badgeEstado = '<span class="badge badge-danger">Agotado</span>';
        } else if (p.ESTADO_STOCK === 'Bajo') {
            badgeEstado = '<span class="badge badge-warning">Stock Bajo</span>';
        }

        return `
            <tr>
                <td><strong>${p.NOMBRE_PRODUCTO}</strong></td>
                <td>${p.NOMBRE_MARCA}</td>
                <td>${p.NOMBRE_CATEGORIA}</td>
                <td><strong>${p.STOCK_ACTUAL}</strong></td>
                <td>C$ ${parseFloat(p.PRECIO_COMPRA || 0).toFixed(2)}</td>
                <td>C$ ${parseFloat(p.PRECIO_VENTA || 0).toFixed(2)}</td>
                <td>C$ ${p.VALOR_COSTO.toFixed(2)}</td>
                <td>C$ ${p.VALOR_VENTA.toFixed(2)}</td>
                <td>${badgeEstado}</td>
            </tr>
        `;
    }).join('');
}

function filtrarTablaStock() {
    const q = (document.getElementById('buscar_filtro_stock')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('#tabla-reporte-stock tbody tr');
    rows.forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}
window.filtrarTablaStock = filtrarTablaStock;

// ==========================================================================
// 4. REPORTE DE SERVICIOS TÉCNICOS
// ==========================================================================
function cargarReporteServicios(fechaInicio, fechaFin) {
    let url = `${API_BASE}/reportes/servicios`;
    if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            _datosReportes.servicios = data;
            const r = data.resumen;
            const totalSrv = parseInt(r.total_servicios) || 0;
            const completados = parseInt(r.total_completados) || 0;
            const tasa = totalSrv > 0 ? ((completados / totalSrv) * 100).toFixed(1) : '0.0';

            // KPIs
            document.getElementById('kpi-srv-total').textContent = `${totalSrv}`;
            document.getElementById('kpi-srv-completados').textContent = `${completados} completados / ${r.total_en_progreso || 0} pendientes`;
            document.getElementById('kpi-srv-recaudado').textContent = `C$ ${parseFloat(r.total_recaudado || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-srv-satisfaccion').textContent = `${parseFloat(r.promedio_estrellas || 0).toFixed(1)} / 5.0 ⭐`;
            document.getElementById('kpi-srv-calificados').textContent = `${r.total_calificados || 0} calificaciones registradas`;
            document.getElementById('kpi-srv-tasa').textContent = `${tasa}%`;

            // Gráfico 1: Desempeño por Técnico
            destruirGrafico('chart-tecnicos-desempeno');
            const tecs = data.tecnicos || [];
            const optionsTec = {
                chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                series: [{ name: 'Recaudación en Servicios (C$)', data: tecs.map(t => parseFloat(t.total_recaudado)) }],
                xaxis: { categories: tecs.map(t => t.tecnico) },
                colors: ['#0d9488'],
                plotOptions: { bar: { borderRadius: 6 } },
                tooltip: { y: { formatter: val => `C$ ${val.toFixed(2)}` } }
            };
            _charts['chart-tecnicos-desempeno'] = new ApexCharts(document.querySelector("#chart-tecnicos-desempeno"), optionsTec);
            _charts['chart-tecnicos-desempeno'].render();

            // Gráfico 2: Calificaciones
            destruirGrafico('chart-calificaciones-distribucion');
            const califs = data.calificaciones || [];
            const starsCategories = ['5 Estrellas', '4 Estrellas', '3 Estrellas', '2 Estrellas', '1 Estrella'];
            const califMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            califs.forEach(c => { califMap[c.estrellas] = parseInt(c.cantidad); });

            const optionsCalifs = {
                chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                series: [{ name: 'Cantidad de Reseñas', data: [califMap[5], califMap[4], califMap[3], califMap[2], califMap[1]] }],
                xaxis: { categories: starsCategories },
                colors: ['#f59e0b'],
                plotOptions: { bar: { horizontal: true, borderRadius: 6 } }
            };
            _charts['chart-calificaciones-distribucion'] = new ApexCharts(document.querySelector("#chart-calificaciones-distribucion"), optionsCalifs);
            _charts['chart-calificaciones-distribucion'].render();

            // Tabla de Técnicos
            const tbody = document.querySelector("#tabla-reporte-tecnicos tbody");
            if (tbody) {
                if (tecs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No hay registros de técnicos para este período.</td></tr>';
                } else {
                    tbody.innerHTML = tecs.map(t => `
                        <tr>
                            <td><strong>${t.tecnico}</strong></td>
                            <td>${t.total_asignados}</td>
                            <td><span class="badge badge-success">${t.completados}</span></td>
                            <td><strong>C$ ${parseFloat(t.total_recaudado || 0).toFixed(2)}</strong></td>
                            <td>${parseFloat(t.promedio_estrellas || 0).toFixed(1)} / 5 ⭐</td>
                        </tr>
                    `).join('');
                }
            }
        })
        .catch(err => console.error('Error cargando reporte de servicios:', err));
}

// ==========================================================================
// 5. MOTOR DE EXPORTACIÓN (EXCEL Y PDF)
// ==========================================================================
function exportarReporteActual(tipoFormato) {
    const { fechaInicio, fechaFin } = obtenerRangoFechas();

    if (tipoFormato === 'excel') {
        exportarAExcel();
    } else if (tipoFormato === 'pdf') {
        exportarAPdf(fechaInicio, fechaFin);
    }
}
window.exportarReporteActual = exportarReporteActual;

function exportarAExcel() {
    if (typeof XLSX === 'undefined') {
        alert('La librería SheetJS (XLSX) aún no se ha cargado. Por favor recarga la página.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];

    if (_reportesPestanaActual === 'ventas' && _datosReportes.ventas) {
        const datos = (_datosReportes.ventas.listado || []).map(v => ({
            'Factura': v.FACTURA || ('#V' + v.ID_VENTA),
            'Fecha': v.FECHA ? new Date(v.FECHA).toLocaleDateString('es-NI') : '',
            'Canal': v.TIPO_CANAL || 'FISICO',
            'Cliente': v.NOMBRE_CLIENTE,
            'Vendedor': v.NOMBRE_VENDEDOR,
            'Estado': v.ESTADO,
            'Total (C$)': parseFloat(v.TOTAL || 0)
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
        XLSX.writeFile(wb, `Reporte_Ventas_Compunic_${timestamp}.xlsx`);
    } else if (_reportesPestanaActual === 'stock' && _datosReportes.stock) {
        const datos = (_datosReportes.stock.listado || []).map(p => ({
            'Producto': p.NOMBRE_PRODUCTO,
            'Marca': p.NOMBRE_MARCA,
            'Categoría': p.NOMBRE_CATEGORIA,
            'Stock Actual': p.STOCK_ACTUAL,
            'Precio Compra (C$)': parseFloat(p.PRECIO_COMPRA || 0),
            'Precio Venta (C$)': parseFloat(p.PRECIO_VENTA || 0),
            'Valor Costo Total (C$)': p.VALOR_COSTO,
            'Valor Venta Total (C$)': p.VALOR_VENTA,
            'Estado Stock': p.ESTADO_STOCK
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, "Valoración de Inventario");
        XLSX.writeFile(wb, `Reporte_Stock_Compunic_${timestamp}.xlsx`);
    } else if (_reportesPestanaActual === 'servicios' && _datosReportes.servicios) {
        const datos = (_datosReportes.servicios.listado || []).map(s => ({
            'ID Servicio': s.ID_SERVICIO,
            'Descripción': s.DESCRIPCION,
            'Cliente': s.NOMBRE_CLIENTE,
            'Técnico Asignado': s.NOMBRE_TECNICO,
            'Tipo Servicio': s.TIPO_SERVICIO,
            'Estado': s.ESTADO_SERVICIO,
            'Costo (C$)': parseFloat(s.COSTO || 0),
            'Calificación (1-5)': s.CALIFICACION || 'Sin calificar',
            'Opinión Cliente': s.OPINION_CLIENTE || ''
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, "Servicios Técnicos");
        XLSX.writeFile(wb, `Reporte_Servicios_Compunic_${timestamp}.xlsx`);
    } else {
        // Financiero
        const k = _datosReportes.financiero?.kpis || {};
        const datosFin = [
            { 'Concepto': 'Ingresos Totales (Ventas + Servicios)', 'Monto (C$)': k.total_ingresos || 0 },
            { 'Concepto': 'Ingresos por Ventas de Productos', 'Monto (C$)': k.total_ventas || 0 },
            { 'Concepto': 'Ingresos por Servicios Técnicos', 'Monto (C$)': k.total_servicios || 0 },
            { 'Concepto': 'Egresos por Compras a Proveedores', 'Monto (C$)': k.total_egresos || 0 },
            { 'Concepto': 'Costo de Mercancía Vendida (COGS)', 'Monto (C$)': k.costo_mercancia || 0 },
            { 'Concepto': 'Utilidad Bruta Estimada', 'Monto (C$)': k.ganancia_bruta || 0 },
            { 'Concepto': 'Margen de Rentabilidad (%)', 'Monto (C$)': `${k.margen_ganancia_porcentaje || 0}%` }
        ];
        const ws = XLSX.utils.json_to_sheet(datosFin);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Financiero");
        XLSX.writeFile(wb, `Reporte_Financiero_Compunic_${timestamp}.xlsx`);
    }

    if (window.Swal) {
        Swal.fire({
            icon: 'success',
            title: '¡Excel Generado!',
            text: 'El archivo de reporte ha sido descargado satisfactoriamente.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

function exportarAPdf(fechaInicio, fechaFin) {
    // Redirigir al endpoint de descarga PDF del backend con membrete oficial
    let url = `${API_BASE}/reportes/exportar/pdf?tipo=${_reportesPestanaActual}`;
    if (fechaInicio && fechaFin) {
        url += `&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    window.open(url, '_blank');
}

// Inicialización del Módulo de Reportes
function cargarModuloReportes() {
    aplicarRangoPreset('mes');
}
window.cargarModuloReportes = cargarModuloReportes;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tab-financiero')) {
        cargarModuloReportes();
    }
});
