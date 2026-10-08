/*
 * Módulo: dashboard_stats.js
 * Descripción: Lógica para calcular y mostrar las estadísticas del panel.
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
        safeSetText('temporal-servicios-total', `${data.total_pendientes} Tickets`);
        safeSetText('temporal-servicios-diagnostico', `${data.en_diagnostico} en Diagnóstico`);
        safeSetText('tecnico-servicios-total', `${data.total_pendientes} Tickets`);
        safeSetText('tecnico-servicios-diagnostico', `${data.en_diagnostico} en Diagnóstico`);

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

/**
 * Abre el modal informativo de Tipos de Garantías disponibles en Compunic
 */
async function abrirModalTiposGarantia() {
    const modal = document.getElementById('tipos-garantias-modal');
    const body = document.getElementById('tipos-garantias-body');
    if (!modal) return;
    
    modal.style.display = 'flex';
    if (!body) return;

    // Si ya tiene contenido cargado previamente, no recargar
    if (body.children.length > 0 && !body.innerHTML.includes('Cargando...')) return;

    body.innerHTML = `
        <div style="text-align: center; padding: 25px; color: var(--text-muted);">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <p style="margin: 0;">Consultando catálogo de garantías...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/garantias/tipos`);
        const tipos = await res.json();

        const descripciones = {
            'Estándar': {
                icon: 'fas fa-shield-alt',
                color: '#3b82f6',
                duracion: '12 meses (base)',
                desc: 'Cubre fallas de fábrica y defectos de fabricación en hardware y componentes nuevos adquiridos en Compunic. Reparación o sustitución sin costo adicional.'
            },
            'Extendida': {
                icon: 'fas fa-clock',
                color: '#8b5cf6',
                duracion: '24 a 36 meses',
                desc: 'Ampliación voluntaria del periodo de cobertura más allá del plazo estándar, recomendada para servidores, estaciones de trabajo y equipos críticos.'
            },
            'Fabricante': {
                icon: 'fas fa-industry',
                color: '#10b981',
                duracion: '1 a 5 años según marca',
                desc: 'Garantía oficial tramitada directamente con distribuidores autorizados de marcas líderes (Dell, HP, ASUS, Kingston, Intel, AMD).'
            },
            'Limitada': {
                icon: 'fas fa-exclamation-circle',
                color: '#f59e0b',
                duracion: '3 a 6 meses',
                desc: 'Cubre componentes específicos o mano de obra técnica de reparación. Excluye piezas consumibles sujetas a desgaste (baterías, cables, ventiladores).'
            },
            'Nula': {
                icon: 'fas fa-ban',
                color: '#ef4444',
                duracion: 'Sin cobertura',
                desc: 'Equipos fuera del periodo legal o que presentan rotura física, sellos violados, daño por humedad, sobretensión o manipulación no autorizada.'
            },
            'Premium': {
                icon: 'fas fa-crown',
                color: '#ec4899',
                duracion: '12 a 24 meses VIP',
                desc: 'Cobertura preferencial con diagnóstico express en menos de 24 horas, equipo de respaldo temporal durante la reparación y atención técnica VIP.'
            }
        };

        const html = Array.isArray(tipos) ? tipos.map(t => {
            const nombre = t.TIPO || 'Garantía';
            const nombreNormal = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const info = descripciones[nombre] || descripciones[nombreNormal] || {
                icon: 'fas fa-certificate',
                color: '#3b82f6',
                duracion: 'Según póliza',
                desc: 'Póliza de garantía registrada en el catálogo oficial de Compunic.'
            };

            return `
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-left: 5px solid ${info.color}; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; transition: transform 0.2s, box-shadow 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${info.color}20; display: flex; align-items: center; justify-content: center;">
                            <i class="${info.icon}" style="color: ${info.color}; font-size: 1.1rem;"></i>
                        </div>
                        <strong style="font-size: 1.05rem; color: var(--text-color);">Garantía ${nombre}</strong>
                    </div>
                    <span style="font-size: 0.8rem; background: ${info.color}15; color: ${info.color}; border: 1px solid ${info.color}40; padding: 3px 10px; border-radius: 12px; font-weight: 600;">
                        ⏱️ ${info.duracion}
                    </span>
                </div>
                <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted); line-height: 1.45; padding-left: 42px;">
                    ${info.desc}
                </p>
            </div>
            `;
        }).join('') : '';

        body.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">
                A continuación se detallan las pólizas y tipos de garantías reconocidas por el taller técnico y sistema de soporte de Compunic:
            </div>
            <div style="display: flex; flex-direction: column;">
                ${html}
            </div>
        `;
    } catch (err) {
        console.error('Error al cargar tipos de garantías:', err);
        body.innerHTML = `
            <div style="color: #ef4444; padding: 15px; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i> No fue posible consultar los tipos de garantía.
            </div>
        `;
    }
}
window.abrirModalTiposGarantia = abrirModalTiposGarantia;

