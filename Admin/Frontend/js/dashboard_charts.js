/*
 * ==========================================
 * MÓDULO: dashboard_charts.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// dashboard_charts.js - Implementación de gráficos con Chart.js

let chartVentasCostos = null;
let chartStockCategoria = null;

// Función para cargar el gráfico de Ventas vs Costos
async function cargarGraficoVentasCostos() {
    try {
        console.log('📊 Cargando gráfico de ventas vs costos...');
        const response = await fetch(`${API_BASE_DASHBOARD}/ventas-vs-costos`);
        const data = await response.json();

        if (data.error || data.length === 0) {
            document.getElementById('chart-ventas-costos').innerHTML =
                '<p style="color: #868e96;">No hay datos suficientes para mostrar el gráfico</p>';
            return;
        }

        console.log('✅ Datos de ventas vs costos:', data);

        // Preparar datos para el gráfico
        const meses = data.map(item => item.mes);
        const ventas = data.map(item => parseFloat(item.ventas || 0));
        const costos = data.map(item => parseFloat(item.costos || 0));

        // Crear canvas si no existe
        const container = document.getElementById('chart-ventas-costos');
        container.innerHTML = '<canvas id="canvasVentasCostos"></canvas>';

        const ctx = document.getElementById('canvasVentasCostos').getContext('2d');

        // Destruir gráfico anterior si existe
        if (chartVentasCostos) {
            chartVentasCostos.destroy();
        }

        // Crear nuevo gráfico
        chartVentasCostos = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Ventas',
                        data: ventas,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Costos',
                        data: costos,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': C$' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al cargar gráfico ventas/costos:', error);
        document.getElementById('chart-ventas-costos').innerHTML =
            '<p style="color: #dc3545;">Error al cargar gráfico</p>';
    }
}

// Función para cargar el gráfico de Stock por Categoría
async function cargarGraficoStockCategoria() {
    try {
        console.log('📊 Cargando gráfico de stock por categoría...');
        const response = await fetch(`${API_BASE_DASHBOARD}/stock-por-categoria`);
        const data = await response.json();

        if (data.error || data.length === 0) {
            document.getElementById('chart-stock-categoria').innerHTML =
                '<p style="color: #868e96;">No hay datos suficientes para mostrar el gráfico</p>';
            return;
        }

        console.log('✅ Datos de stock por categoría:', data);

        // Filtrar para excluir la categoría "componente"
        const dataFiltrada = data.filter(item =>
            item.NOMBRE_CATEGORIA.toLowerCase() !== 'componente'
        );

        // Preparar datos para el gráfico
        const categorias = dataFiltrada.map(item => item.NOMBRE_CATEGORIA);
        const stocks = dataFiltrada.map(item => parseInt(item.stock_total || 0));

        // Colores para las barras
        const colores = [
            '#007bff', '#28a745', '#ffc107', '#dc3545',
            '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'
        ];

        // Crear canvas si no existe
        const container = document.getElementById('chart-stock-categoria');
        container.innerHTML = '<canvas id="canvasStockCategoria"></canvas>';

        const ctx = document.getElementById('canvasStockCategoria').getContext('2d');

        // Destruir gráfico anterior si existe
        if (chartStockCategoria) {
            chartStockCategoria.destroy();
        }

        // Crear nuevo gráfico
        chartStockCategoria = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categorias,
                datasets: [{
                    label: 'Stock Total',
                    data: stocks,
                    backgroundColor: colores.slice(0, categorias.length),
                    borderWidth: 0,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Stock: ' + context.parsed.y + ' unidades';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al cargar gráfico stock/categoría:', error);
        document.getElementById('chart-stock-categoria').innerHTML =
            '<p style="color: #dc3545;">Error al cargar gráfico</p>';
    }
}

// Llamar a cargar gráficos después de que se carguen las estadísticas
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        cargarGraficoVentasCostos();
        cargarGraficoStockCategoria();
    }, 1000); // Esperar 1 segundo para que Chart.js esté disponible
});
