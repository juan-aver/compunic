/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: dashboard_stats.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// dashboard_stats.js - Funciones para cargar estadísticas del dashboard

const API_BASE_DASHBOARD = `${API_BASE}/dashboard`;

// Helper function to safely set textContent if element exists
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Función principal para cargar todas las estadísticas
async function cargarEstadisticasDashboard() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    try {
        await Promise.all([
            cargarIngresosMes(),
            cargarServiciosPendientes(),
            cargarStockCritico(),
            cargarClientesNuevos(),
            cargarTopCliente(),
            cargarProductoMasVendido(),
            cargarProductoMenosVendido()
        ]);
    } catch (error) {
        console.error('Error al cargar estadísticas del dashboard:', error);
    }
}

// Cargar ingresos del mes
async function cargarIngresosMes() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/ingresos-mes`);
        const data = await response.json();

        // Actualizar elementos del DOM
        safeSetText('ingresos-total', `${data.total.toFixed(2)} C$`);
        safeSetText('ingresos-porcentaje', `+${data.cambio_porcentaje}%`);
        safeSetText('ingresos-ventas', `${data.num_ventas} ventas este mes`);

    } catch (error) {
        console.error('Error al cargar ingresos:', error);
        safeSetText('ingresos-total', 'Error al cargar');
    }
}

// Cargar servicios pendientes
async function cargarServiciosPendientes() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/servicios-pendientes`);
        const data = await response.json();

        safeSetText('servicios-total', `${data.total_pendientes} Tickets`);
        safeSetText('servicios-diagnostico', `${data.en_diagnostico} en Diagnóstico`);

    } catch (error) {
        console.error('Error al cargar servicios:', error);
        safeSetText('servicios-total', 'Error al cargar');
    }
}

// Cargar stock crítico
async function cargarStockCritico() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/stock-critico`);
        const data = await response.json();

        safeSetText('stock-total', `${data.total} Productos`);

        // Mostrar primeros 3 productos
        const stockListaEl = document.getElementById('stock-lista');
        if (stockListaEl) {
            if (data.productos && data.productos.length > 0) {
                const nombresProductos = data.productos
                    .slice(0, 3)
                    .map(p => `${p.nombre} (${p.stock})`)
                    .join(', ');
                stockListaEl.textContent = nombresProductos;
            } else {
                stockListaEl.textContent = 'Todo bien ✓';
            }
        }

    } catch (error) {
        console.error('Error al cargar stock crítico:', error);
        safeSetText('stock-total', 'Error al cargar');
    }
}

// Cargar clientes nuevos
async function cargarClientesNuevos() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/clientes-nuevos`);
        const data = await response.json();

        safeSetText('clientes-total', `${data.total_nuevos} Clientes`);

    } catch (error) {
        console.error('Error al cargar clientes nuevos:', error);
        safeSetText('clientes-total', 'Error al cargar');
    }
}

// Cargar Cliente Top
async function cargarTopCliente() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/top-cliente`);
        const data = await response.json();
        
        if(data.encontrado && data.cliente) {
            safeSetText('top-cliente-nombre', data.cliente.nombre);
            safeSetText('top-cliente-compras', data.cliente.total_compras);
            safeSetText('top-cliente-monto', `${data.cliente.monto_total.toLocaleString('es-NI', {minimumFractionDigits: 2})} C$`);
        } else {
            safeSetText('top-cliente-nombre', 'No hay datos');
        }
    } catch (error) {
        console.error('Error al cargar top cliente:', error);
        safeSetText('top-cliente-nombre', 'Error');
    }
}

// Cargar Producto Más Vendido
async function cargarProductoMasVendido() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/producto-mas-vendido`);
        const data = await response.json();
        
        if(data.encontrado && data.producto) {
            safeSetText('best-product-nombre', data.producto.nombre);
            safeSetText('best-product-unidades', data.producto.total_vendido);
            safeSetText('best-product-monto', `${data.producto.ingresos.toLocaleString('es-NI', {minimumFractionDigits: 2})} C$ generados`);
        } else {
            safeSetText('best-product-nombre', 'No hay datos');
        }
    } catch (error) {
        console.error('Error al cargar producto más vendido:', error);
        safeSetText('best-product-nombre', 'Error');
    }
}

// Cargar Producto Menos Vendido
async function cargarProductoMenosVendido() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/producto-menos-vendido`);
        const data = await response.json();
        
        if(data.encontrado && data.producto) {
            safeSetText('worst-product-nombre', data.producto.nombre);
            safeSetText('worst-product-unidades', data.producto.total_vendido);
            safeSetText('worst-product-monto', `${data.producto.ingresos.toLocaleString('es-NI', {minimumFractionDigits: 2})} C$ generados`);
        } else {
            safeSetText('worst-product-nombre', 'No hay datos');
        }
    } catch (error) {
        console.error('Error al cargar producto menos vendido:', error);
        safeSetText('worst-product-nombre', 'Error');
    }
}

// Función para refrescar el dashboard (puedes llamarla cada X minutos)
function refrescarDashboard() {
    cargarEstadisticasDashboard();
}

// Auto-refrescar cada 5 minutos (opcional)
setInterval(refrescarDashboard, 5 * 60 * 1000); // 5 minutos

// Funciones para gráficos (puedes implementarlas después con Chart.js)
async function cargarGraficoVentasCostos() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/ventas-vs-costos`);
        const data = await response.json();

        // Aquí puedes usar Chart.js o cualquier librería de gráficos
        console.log('Datos de ventas vs costos:', data);
        const chartEl = document.getElementById('chart-ventas-costos');
        if (chartEl) chartEl.innerHTML = '<p>Gráfico disponible - Integrar con Chart.js</p>';

    } catch (error) {
        console.error('Error al cargar gráfico ventas/costos:', error);
    }
}

async function cargarGraficoStockCategoria() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/stock-por-categoria`);
        const data = await response.json();

        // Aquí puedes usar Chart.js o cualquier librería de gráficos
        console.log('Datos de stock por categoría:', data);
        const chartEl = document.getElementById('chart-stock-categoria');
        if (chartEl) chartEl.innerHTML = '<p>Gráfico disponible - Integrar con Chart.js</p>';

    } catch (error) {
        console.error('Error al cargar gráfico stock/categoría:', error);
    }
}

// ==========================================
// NUEVAS FUNCIONES PARA MODALES (Pop-ups)
// ==========================================

// Abrir modal de Stock Crítico
async function abrirModalStockCritico() {
    const modal = document.getElementById('stock-critico-modal');
    const body = document.getElementById('stock-critico-body');
    
    if (!modal || !body) return;

    body.innerHTML = '<tr><td colspan="2" style="text-align: center;">Cargando...</td></tr>';
    modal.style.display = 'flex';

    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/stock-critico`);
        const data = await response.json();

        if (!data.productos || data.productos.length === 0) {
            body.innerHTML = '<tr><td colspan="2" style="text-align: center;">No hay productos con stock crítico.</td></tr>';
            return;
        }

        body.innerHTML = data.productos.map(p => `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 10px;">${p.nombre}</td>
                <td style="padding: 10px; color: var(--error-color); font-weight: bold;">${p.stock}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error fetching stock critico:', e);
        body.innerHTML = '<tr><td colspan="2" style="text-align: center; color: red;">Error al cargar datos.</td></tr>';
    }
}

// Abrir modal de Servicios Pendientes
async function abrirModalServiciosPendientes() {
    const modal = document.getElementById('servicios-pendientes-modal');
    const body = document.getElementById('servicios-pendientes-body');
    
    if (!modal || !body) return;

    body.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando...</td></tr>';
    modal.style.display = 'flex';

    try {
        const res = await fetch(`${API_BASE}/servicios`);
        const servicios = await res.json();
        
        // Filtrar pendientes y en progreso (excluir 'Completado' o similares)
        let pendientes = servicios.filter(s => {
            const estado = s.ESTADO_SERVICIO ? s.ESTADO_SERVICIO.toLowerCase() : '';
            return !estado.includes('completado') && !estado.includes('entregado');
        });
        
        // Ordenar por antigüedad (los más antiguos primero = menor fecha)
        pendientes.sort((a, b) => new Date(a.FECHA_SOLICITUD) - new Date(b.FECHA_SOLICITUD));

        if (pendientes.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay servicios pendientes.</td></tr>';
            return;
        }

        body.innerHTML = pendientes.map((s, index) => {
            // Calcular días desde la solicitud para ver si es urgente (ej. > 2 días)
            const dias = Math.floor((new Date() - new Date(s.FECHA_SOLICITUD)) / (1000 * 60 * 60 * 24));
            
            // Los primeros (más antiguos) o los de > 2 días son urgentes
            const isUrgente = dias >= 2 || index < 3; 
            
            const rowStyle = isUrgente ? 'color: #ef4444; font-weight: 600; background-color: rgba(239, 68, 68, 0.05);' : '';
            const tagUrgente = isUrgente ? ' <span style="background: #ef4444; color: white; font-size: 10px; padding: 2px 5px; border-radius: 4px; margin-left: 5px;">URGENTE</span>' : '';

            return `
            <tr style="border-bottom: 1px solid var(--border-color); ${rowStyle}">
                <td style="padding: 10px;">#${s.ID_SERVICIO}</td>
                <td style="padding: 10px;">${s.DESCRIPCION || 'Sin descripción'}${tagUrgente}</td>
                <td style="padding: 10px;">${new Date(s.FECHA_SOLICITUD).toLocaleDateString()}</td>
                <td style="padding: 10px;">${s.ESTADO_SERVICIO || 'Desconocido'}</td>
            </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Error fetching servicios pendientes:', e);
        body.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error al cargar datos.</td></tr>';
    }
}
