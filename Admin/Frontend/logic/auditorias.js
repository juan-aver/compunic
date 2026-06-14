// logic/auditorias.js
console.log("!!! AUDITORIAS MODULE LOADED !!!");

let chartAuditorias = null;

function cargarAuditorias() {
    console.log("🔍 Cargando registros de auditoría...");
    
    // 1. Cargar KPIs y Gráfico
    fetch(`${API_BASE}/auditorias/kpis`)
        .then(res => res.json())
        .then(data => {
            // Rellenar KPIs
            document.getElementById('kpi-acciones-hoy').textContent = data.kpis?.acciones_hoy || 0;
            document.getElementById('kpi-logins-fallidos').textContent = data.kpis?.logins_fallidos_hoy || 0;
            document.getElementById('kpi-modificaciones').textContent = data.kpis?.modificaciones_hoy || 0;

            // Renderizar Gráfico
            renderizarGraficoActividad(data.actividad_semanal || []);
        })
        .catch(err => {
            console.error("❌ Error al obtener KPIs de auditoría:", err);
        });

    // 2. Cargar tabla
    filtrarAuditorias();
}

function filtrarAuditorias() {
    const usuario = document.getElementById('buscar_auditoria')?.value || '';
    const accion = document.getElementById('filtro_accion')?.value || '';
    const tabla = document.getElementById('filtro_tabla')?.value || '';
    const desde = document.getElementById('filtro_fecha_desde')?.value || '';
    const hasta = document.getElementById('filtro_fecha_hasta')?.value || '';

    const tbody = document.getElementById('cuerpoAuditorias');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Filtrando registros...</td></tr>';
    }

    let url = `${API_BASE}/auditorias?limite=100`;
    if (usuario) url += `&usuario=${encodeURIComponent(usuario)}`;
    if (accion) url += `&accion=${encodeURIComponent(accion)}`;
    if (tabla) url += `&tabla=${encodeURIComponent(tabla)}`;
    if (desde) url += `&desde=${encodeURIComponent(desde)}`;
    if (hasta) url += `&hasta=${encodeURIComponent(hasta)}`;

    fetch(url)
        .then(res => res.json())
        .then(audits => {
            if (!tbody) return;
            tbody.innerHTML = '';

            if (audits.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No se encontraron registros de auditoría que coincidan con los filtros.</td></tr>';
                return;
            }

            audits.forEach(a => {
                const tr = document.createElement('tr');
                const fecha = new Date(a.FECHA_HORA).toLocaleString();
                const userName = a.USUARIO || (a.NOMBRE ? `${a.NOMBRE} ${a.APELLIDO}` : 'Sistema');
                
                // Formatear badge
                const accionClase = a.ACCION.toLowerCase();
                const accionBadge = `<span class="badge-audit badge-${accionClase}">${a.ACCION.replace(/_/g, ' ')}</span>`;
                
                // Formatear tabla
                const tablaAfectada = a.TABLA ? `<span style="font-weight: 600;">${a.TABLA}</span>` : '<span style="color:#7f8c8d;">N/A</span>';
                
                // Formatear ID Registro
                const registroId = a.ID_REGISTRO ? `#${a.ID_REGISTRO}` : '<span style="color:#7f8c8d;">N/A</span>';
                
                // Detalle expandible o con estilo código
                let detalleHtml = '';
                if (a.DETALLE) {
                    detalleHtml = `<div class="text-detail-code">${a.DETALLE}</div>`;
                } else {
                    detalleHtml = '<span style="color:#7f8c8d; font-style: italic;">Sin detalles</span>';
                }

                tr.innerHTML = `
                    <td class="font-medium primary-color">#${a.ID_AUDITORIA}</td>
                    <td style="font-size: 0.9rem; white-space: nowrap;">${fecha}</td>
                    <td style="font-weight: 600; white-space: nowrap;">${userName}</td>
                    <td>${accionBadge}</td>
                    <td>${tablaAfectada}</td>
                    <td>${registroId}</td>
                    <td>${detalleHtml}</td>
                    <td class="table-ip-cell">${a.IP || '127.0.0.1'}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("❌ Error al cargar listado de auditoría:", err);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Error al conectar con el servidor.</td></tr>';
            }
        });
}

function limpiarFiltrosAuditoria() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('buscar_auditoria', '');
    setVal('filtro_accion', '');
    setVal('filtro_tabla', '');
    setVal('filtro_fecha_desde', '');
    setVal('filtro_fecha_hasta', '');
    filtrarAuditorias();
}

function renderizarGraficoActividad(semanalData) {
    const container = document.getElementById('chart-auditoria-actividad');
    if (!container) return;
    container.innerHTML = '';

    // Si ya existe un gráfico, destruirlo
    if (chartAuditorias) {
        chartAuditorias.destroy();
        chartAuditorias = null;
    }

    // Preparar datos
    const fechas = [];
    const cantidades = [];

    // Llenar datos de últimos 7 días
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoFecha = d.toISOString().split('T')[0];
        
        // Formatear para mostrar
        const diaMes = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        fechas.push(diaMes);

        // Buscar si hay cantidad para este día
        const matching = semanalData.find(item => {
            const itemFecha = new Date(item.fecha).toISOString().split('T')[0];
            return itemFecha === isoFecha;
        });
        cantidades.push(matching ? matching.cantidad : 0);
    }

    const opciones = {
        series: [{
            name: 'Acciones de Auditoría',
            data: cantidades
        }],
        chart: {
            height: 250,
            type: 'area',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3,
            colors: ['#3498db']
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 90, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: '#3498db',
                        opacity: 0.4
                    },
                    {
                        offset: 100,
                        color: '#3498db',
                        opacity: 0.01
                    }
                ]
            }
        },
        colors: ['#3498db'],
        xaxis: {
            categories: fechas,
            labels: {
                style: {
                    colors: '#7f8c8d',
                    fontFamily: 'Inter, sans-serif'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#7f8c8d'
                }
            }
        },
        tooltip: {
            x: {
                format: 'dd/MM'
            }
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.05)'
        }
    };

    chartAuditorias = new ApexCharts(container, opciones);
    chartAuditorias.render();
}

// Hacer globales
window.cargarAuditorias = cargarAuditorias;
window.filtrarAuditorias = filtrarAuditorias;
window.limpiarFiltrosAuditoria = limpiarFiltrosAuditoria;
