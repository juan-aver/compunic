/**
 * @file dashboard-enhanced.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================

const DashboardEnhanced = {
    charts: {},
    sparklines: {},
    counters: {},

    // Colores del tema
    colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },

    // Inicializar todo
    init() {
        this.setupThemeListener();
        this.initializeCounters();
        this.initializeSparklines();
        this.initializeMainCharts();
    },

    // Escuchar cambios de tema
    setupThemeListener() {
        window.addEventListener('themechange', (e) => {
            this.updateChartsTheme(e.detail.theme);
        });
    },

    // Obtener tema actual
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    // ==========================================
    // NÚMEROS ANIMADOS (CountUp)
    // ==========================================

    initializeCounters() {
        // Esperar a que los datos se carguen
        setTimeout(() => {
            this.animateCounter('ingresos-total', 'currency');
            this.animateCounter('servicios-total', 'number');
            this.animateCounter('stock-total', 'number');
            this.animateCounter('clientes-total', 'number');
        }, 500);
    },

    animateCounter(elementId, type = 'number') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const text = element.textContent;
        let endValue = 0;
        let suffix = '';

        if (type === 'currency') {
            // Extraer número de formato "1,234.56 C$"
            const match = text.match(/[\d,]+\.?\d*/);
            if (match) {
                endValue = parseFloat(match[0].replace(/,/g, ''));
                suffix = ' C$';
            }
        } else if (type === 'number') {
            // Extraer número de formato "123 Tickets" o "45 Productos"
            const match = text.match(/\d+/);
            if (match) {
                endValue = parseInt(match[0]);
                const parts = text.split(' ');
                if (parts.length > 1) {
                    suffix = ' ' + parts.slice(1).join(' ');
                }
            }
        }

        if (endValue === 0) return;

        // Animar desde 0 hasta el valor final
        let startValue = 0;
        const duration = 2000; // 2 segundos
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easeOut;

            if (type === 'currency') {
                element.textContent = currentValue.toLocaleString('es-NI', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + suffix;
            } else {
                element.textContent = Math.floor(currentValue) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    },

    // ==========================================
    // SPARKLINES (Mini Gráficos)
    // ==========================================

    initializeSparklines() {
        // Datos de ejemplo - en producción vendrían del backend
        const sparklineData = {
            ingresos: [4500, 5200, 4800, 6100, 5500, 6800, 7200],
            servicios: [12, 15, 13, 18, 16, 20, 16],
            stock: [8, 7, 9, 6, 8, 7, 5],
            clientes: [3, 5, 4, 6, 7, 5, 8]
        };

        this.createSparkline('sparkline-ingresos', sparklineData.ingresos, this.colors.info);
        this.createSparkline('sparkline-servicios', sparklineData.servicios, this.colors.error);
        this.createSparkline('sparkline-stock', sparklineData.stock, this.colors.warning);
        this.createSparkline('sparkline-clientes', sparklineData.clientes, this.colors.success);
    },

    createSparkline(elementId, data, color) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const isDark = this.getCurrentTheme() === 'dark';

        const options = {
            series: [{
                data: data
            }],
            chart: {
                type: 'line',
                width: '100%',
                height: 50,
                sparkline: {
                    enabled: true
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            colors: [color],
            tooltip: {
                enabled: true,
                theme: isDark ? 'dark' : 'light',
                x: {
                    show: false
                },
                y: {
                    title: {
                        formatter: () => ''
                    }
                }
            }
        };

        this.sparklines[elementId] = new ApexCharts(element, options);
        this.sparklines[elementId].render();
    },

    // ==========================================
    // GRÁFICOS PRINCIPALES
    // ==========================================

    initializeMainCharts() {
        // Esperar a que los datos se carguen del backend
        setTimeout(() => {
            this.createVentasCostosChart();
            this.createStockCategoriaChart();
        }, 1000);
    },

    createVentasCostosChart() {
        const element = document.getElementById('chart-ventas-costos');
        if (!element) return;

        // Obtener datos del backend (simulado aquí)
        const ventasData = window.ventasCostosData || {
            meses: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Dic'],
            ventas: [0, 0, 0, 38295, 381840, 0],
            costos: [122100, 338550, 144300, 185000, 86025, 1725]
        };

        const isDark = this.getCurrentTheme() === 'dark';

        const options = {
            series: [{
                name: 'Ventas',
                data: ventasData.ventas
            }, {
                name: 'Costos',
                data: ventasData.costos
            }],
            chart: {
                type: 'area',
                height: 350,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                },
                background: 'transparent',
                foreColor: isDark ? '#cbd5e1' : '#64748b',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: [this.colors.success, this.colors.error],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.3,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: ventasData.meses,
                labels: {
                    style: {
                        colors: isDark ? '#cbd5e1' : '#64748b'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: isDark ? '#cbd5e1' : '#64748b'
                    },
                    formatter: (value) => {
                        return 'C$ ' + value.toLocaleString('es-NI');
                    }
                }
            },
            grid: {
                borderColor: isDark ? '#334155' : '#e2e8f0',
                strokeDashArray: 4
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                labels: {
                    colors: isDark ? '#f1f5f9' : '#1e293b'
                }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (value) => {
                        return 'C$ ' + value.toLocaleString('es-NI', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                }
            }
        };

        this.charts.ventasCostos = new ApexCharts(element, options);
        this.charts.ventasCostos.render();
    },

    createStockCategoriaChart() {
        const element = document.getElementById('chart-stock-categoria');
        if (!element) return;

        // Datos de ejemplo
        const stockData = {
            categorias: ['Laptops', 'Periféricos', 'Componentes', 'Accesorios', 'Software'],
            cantidades: [45, 120, 78, 95, 32]
        };

        const isDark = this.getCurrentTheme() === 'dark';

        const options = {
            series: [{
                name: 'Stock',
                data: stockData.cantidades
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: true
                },
                background: 'transparent',
                foreColor: isDark ? '#cbd5e1' : '#64748b',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 8,
                    distributed: true,
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            colors: [
                this.colors.primary,
                this.colors.success,
                this.colors.warning,
                this.colors.info,
                this.colors.secondary
            ],
            dataLabels: {
                enabled: true,
                style: {
                    colors: ['#fff']
                },
                offsetX: 30
            },
            xaxis: {
                categories: stockData.categorias,
                labels: {
                    style: {
                        colors: isDark ? '#cbd5e1' : '#64748b'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: isDark ? '#cbd5e1' : '#64748b'
                    }
                }
            },
            grid: {
                borderColor: isDark ? '#334155' : '#e2e8f0',
                strokeDashArray: 4
            },
            legend: {
                show: false
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (value) => {
                        return value + ' productos';
                    }
                }
            }
        };

        this.charts.stockCategoria = new ApexCharts(element, options);
        this.charts.stockCategoria.render();
    },

    // ==========================================
    // ACTUALIZAR TEMA DE GRÁFICOS
    // ==========================================

    updateChartsTheme(theme) {
        const isDark = theme === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        // Actualizar gráficos principales
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.updateOptions) {
                chart.updateOptions({
                    xaxis: {
                        labels: {
                            style: { colors: textColor }
                        }
                    },
                    yaxis: {
                        labels: {
                            style: { colors: textColor }
                        }
                    },
                    grid: {
                        borderColor: gridColor
                    },
                    legend: {
                        labels: {
                            colors: isDark ? '#f1f5f9' : '#1e293b'
                        }
                    },
                    tooltip: {
                        theme: isDark ? 'dark' : 'light'
                    }
                });
            }
        });

        // Actualizar sparklines
        Object.values(this.sparklines).forEach(sparkline => {
            if (sparkline && sparkline.updateOptions) {
                sparkline.updateOptions({
                    tooltip: {
                        theme: isDark ? 'dark' : 'light'
                    }
                });
            }
        });
    }
};

// Inicializar cuando el DOM esté listo Y ApexCharts esté disponible
function initWhenReady() {
    // Si esto falla, probablemente sea la base de datos caída 💀

    if (typeof ApexCharts !== 'undefined') {
        console.log('✅ ApexCharts disponible, inicializando dashboard...');
        DashboardEnhanced.init();
    } else {
        console.log('⏳ Esperando a que ApexCharts se cargue...');
        setTimeout(initWhenReady, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
} else {
    initWhenReady();
}

// Exponer globalmente
window.DashboardEnhanced = DashboardEnhanced;
