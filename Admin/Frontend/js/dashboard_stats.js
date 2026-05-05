/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: dashboard_stats.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// dashboard_stats.js - Funciones para cargar estadísticas del dashboard

const API_BASE_DASHBOARD = `${API_BASE}/dashboard`;

// Función principal para cargar todas las estadísticas
async function cargarEstadisticasDashboard() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    try {
        await Promise.all([
            cargarIngresosMes(),
            cargarServiciosPendientes(),
            cargarStockCritico(),
            cargarClientesNuevos()
        ]);

        // Cargar gráficos (opcional, puedes implementarlos después)
        // await cargarGraficoVentasCostos();
        // await cargarGraficoStockCategoria();
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
        document.getElementById('ingresos-total').textContent =
            `${data.total.toFixed(2)} C$`;
        document.getElementById('ingresos-porcentaje').textContent =
            `+${data.cambio_porcentaje}%`;
        document.getElementById('ingresos-ventas').textContent =
            `${data.num_ventas} ventas este mes`;

    } catch (error) {
        console.error('Error al cargar ingresos:', error);
        document.getElementById('ingresos-total').textContent = 'Error al cargar';
    }
}

// Cargar servicios pendientes
async function cargarServiciosPendientes() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/servicios-pendientes`);
        const data = await response.json();

        document.getElementById('servicios-total').textContent =
            `${data.total_pendientes} Tickets`;
        document.getElementById('servicios-diagnostico').textContent =
            `${data.en_diagnostico} en Diagnóstico`;

    } catch (error) {
        console.error('Error al cargar servicios:', error);
        document.getElementById('servicios-total').textContent = 'Error al cargar';
    }
}

// Cargar stock crítico
async function cargarStockCritico() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/stock-critico`);
        const data = await response.json();

        document.getElementById('stock-total').textContent =
            `${data.total} Productos`;

        // Mostrar primeros 3 productos
        if (data.productos && data.productos.length > 0) {
            const nombresProductos = data.productos
                .slice(0, 3)
                .map(p => `${p.nombre} (${p.stock})`)
                .join(', ');
            document.getElementById('stock-lista').textContent = nombresProductos;
        } else {
            document.getElementById('stock-lista').textContent = 'Todo bien ✓';
        }

    } catch (error) {
        console.error('Error al cargar stock crítico:', error);
        document.getElementById('stock-total').textContent = 'Error al cargar';
    }
}

// Cargar clientes nuevos
async function cargarClientesNuevos() {
    try {
        const response = await fetch(`${API_BASE_DASHBOARD}/clientes-nuevos`);
        const data = await response.json();

        document.getElementById('clientes-total').textContent =
            `${data.total_nuevos} Clientes`;

    } catch (error) {
        console.error('Error al cargar clientes nuevos:', error);
        document.getElementById('clientes-total').textContent = 'Error al cargar';
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
        document.getElementById('chart-ventas-costos').innerHTML =
            '<p>Gráfico disponible - Integrar con Chart.js</p>';

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
        document.getElementById('chart-stock-categoria').innerHTML =
            '<p>Gráfico disponible - Integrar con Chart.js</p>';

    } catch (error) {
        console.error('Error al cargar gráfico stock/categoría:', error);
    }
}
