/*
 * ==========================================
 * MÓDULO: router.js
 * PROPÓSITO: Lógica de enrutamiento, transiciones fluidas,
 * Skeleton Screens y caché optimizada de vistas.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */

// ========================
// CACHÉ Y ESTADO GLOBAL DE RUTAS (ZERO-FOUC ENGINE)
// ========================
const _vistaHtmlCache = new Map();
const _vistaCssCache = new Map();
let _initialDashboardHtml = null;
let _vistaCargandoActualmente = null;

// Capturar el HTML inicial del dashboard una vez que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    if (content && !_initialDashboardHtml) {
        _initialDashboardHtml = content.innerHTML;
        _vistaHtmlCache.set('inicio', _initialDashboardHtml);
    }

    // Pre-cargar en segundo plano vistas y estilos de forma silenciosa
    setTimeout(() => {
        precargarVistasYEstilos();
    }, 600);
});

/**
 * Pre-carga en memoria todos los estilos y plantillas para navegación instantánea (0ms)
 */
function precargarVistasYEstilos() {
    const hojasCss = [
        'css/views/G_Productos.css',
        'css/views/G_ventas.css',
        'css/views/G_Clientes.css',
        'css/views/G_Compras.css',
        'css/views/G_Servicios.css',
        'css/views/G_Categorias.css',
        'css/views/G_Lista_Ventas.css',
        'css/views/G_Lista_Compras.css',
        'css/views/G_Proveedores.css',
        'css/views/G_Empleados.css',
        'css/views/S_Garantias.css',
        'css/views/G_Devoluciones.css',
        'css/views/G_Caja.css',
        'css/views/G_Auditorias.css',
        'css/views/G_Reportes.css',
        'css/views/H_Stock.css'
    ];

    hojasCss.forEach(url => {
        if (!_vistaCssCache.has(url)) {
            fetch(url)
                .then(r => r.ok ? r.text() : '')
                .then(css => { if (css) _vistaCssCache.set(url, css); })
                .catch(() => {});
        }
    });

    const vistasHtml = [
        'views/G_Productos.html',
        'views/G_ventas.html',
        'views/G_Clientes.html',
        'views/G_Servicios.html',
        'views/G_Compras.html',
        'views/G_Categorias.html'
    ];

    vistasHtml.forEach(url => {
        if (!_vistaHtmlCache.has(url)) {
            fetch(url)
                .then(r => r.ok ? r.text() : '')
                .then(html => { if (html) _vistaHtmlCache.set(url, html); })
                .catch(() => {});
        }
    });
}

// ========================
// FUNCIÓN PARA AUTO-ASIGNAR VENDEDOR
// ========================
function inicializarVendedorAutomatico() {
    console.log('🔧 Inicializando vendedor automático...');
    const session = typeof Auth !== 'undefined' ? Auth.getSession() : null;

    if (!session) {
        console.error('❌ No hay sesión activa');
        if (typeof Alerta !== 'undefined') {
            Alerta.error('No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.', 'Sesión Requerida');
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        return;
    }

    if (!session.id_vendedor) {
        console.error('❌ El usuario no tiene ID_VENDEDOR asignado');
        if (typeof Alerta !== 'undefined') {
            Alerta.advertencia('Su usuario no está configurado como vendedor. Contacte al administrador.', 'Atención');
        }
        return;
    }

    const vendedorDisplay = document.getElementById('vendedor-display');
    const vendedorId = document.getElementById('vendedor-id');

    if (vendedorDisplay && vendedorId) {
        vendedorDisplay.value = `${session.nombre} ${session.apellido}`;
        vendedorId.value = session.id_vendedor;
        console.log('✅ Vendedor auto-asignado:', `${session.nombre} ${session.apellido}`, 'ID:', session.id_vendedor);
    }
}

window.inicializarVendedorAutomatico = inicializarVendedorAutomatico;

// ========================
// CONTROL DE PERMISOS POR ROL
// ========================
function obtenerVistasPermitidasPorRol(role) {
    const rolNormalizado = (role || '').toLowerCase();
    const matrizPermisos = {
        'admin': ['*'],
        'vendedor': [
            'gestion-ventas',
            'gestion-lista-ventas',
            'gestion-devoluciones'
        ],
        'cajero': [
            'gestion-caja'
        ],
        'tecnico': [
            'inicio',
            'gestion-servicios',
            'gestion-garantias',
            'historial-stock',
            'gestion-productos'
        ],
        'temporal': [
            'inicio',
            'gestion-servicios',
            'gestion-garantias',
            'gestion-productos'
        ]
    };
    return matrizPermisos[rolNormalizado] || [];
}

window.obtenerVistasPermitidasPorRol = obtenerVistasPermitidasPorRol;

// ========================
// GESTOR DE HOJAS DE ESTILOS SÍNCRONAS Y TRANSICIÓN (ZERO-FOUC TOTAL)
// ========================

function showTopLoader() {
    let loader = document.getElementById('view-top-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'view-top-loader';
        document.body.appendChild(loader);
    }
    loader.className = 'loading';
}

function finishTopLoader() {
    const loader = document.getElementById('view-top-loader');
    if (loader) {
        loader.className = 'finished';
        setTimeout(() => {
            loader.className = '';
        }, 300);
    }
}

/**
 * Obtiene el texto CSS puro (desde caché o fetch)
 */
async function obtenerCssVista(cssPath) {
    if (!cssPath) return '';
    if (_vistaCssCache.has(cssPath)) {
        return _vistaCssCache.get(cssPath);
    }
    try {
        const res = await fetch(cssPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const css = await res.text();
        _vistaCssCache.set(cssPath, css);
        return css;
    } catch (e) {
        console.warn(`[Router] No se pudo cargar CSS: ${cssPath}`, e);
        return '';
    }
}

/**
 * Obtiene el HTML de la vista (desde caché o fetch)
 */
async function obtenerHtmlVista(htmlPath, nombreVista) {
    if (nombreVista === 'inicio') {
        return _initialDashboardHtml || _vistaHtmlCache.get('inicio') || '';
    }
    if (_vistaHtmlCache.has(htmlPath)) {
        return _vistaHtmlCache.get(htmlPath);
    }
    const res = await fetch(htmlPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}: No se pudo cargar ${htmlPath}`);
    const html = await res.text();
    _vistaHtmlCache.set(htmlPath, html);
    return html;
}

/**
 * Sanitiza fragmentos HTML para evitar inyectar doctypes, html o scripts duplicados
 */
function limpiarHtmlVista(rawHtml) {
    if (!rawHtml) return '';
    return rawHtml
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<\/?html[^>]*>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<\/?body[^>]*>/gi, '')
        .replace(/<link\s+rel=["']stylesheet["'][^>]*>/gi, '')
        .trim();
}

// ========================
// ACTUALIZADOR DE ESTADO ACTIVO DEL MENÚ
// ========================
function actualizarNavActivo(nombreVista) {
    // 1. Desktop Nav
    document.querySelectorAll('.nav-menu a, .dropdown-menu a').forEach(a => {
        a.classList.remove('active');
    });

    if (nombreVista === 'inicio') {
        const navInicio = document.querySelector('#nav-inicio a');
        if (navInicio) navInicio.classList.add('active');
    } else {
        const matchingLink = document.querySelector(`[onclick*="'${nombreVista}'"]`);
        if (matchingLink) {
            matchingLink.classList.add('active');
            const parentDropdown = matchingLink.closest('.nav-item-dropdown');
            if (parentDropdown) {
                const parentLink = parentDropdown.querySelector('.nav-link');
                if (parentLink) parentLink.classList.add('active');
            }
        }
    }

    // 2. Mobile Menu
    document.querySelectorAll('.mobile-menu-item').forEach(item => {
        const dataVista = item.getAttribute('data-vista');
        if (dataVista === nombreVista) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ========================
// ENRUTADOR PRINCIPAL (ZERO-FOUC SÍNCRONO)
// ========================
async function cargarVista(nombreVista, Lista_de_productos = false, Lista_de_proveedores = false, Lista_de_usuario = false) {
    const currentRole = (typeof Auth !== 'undefined' && typeof Auth.getRole === 'function') ? Auth.getRole() : 'admin';
    const permitidas = obtenerVistasPermitidasPorRol(currentRole);

    if (nombreVista !== 'inicio' && !permitidas.includes('*') && !permitidas.includes(nombreVista)) {
        console.warn(`⛔ Acceso denegado a la vista "${nombreVista}" para el rol "${currentRole}".`);
        if (typeof Alerta !== 'undefined') {
            Alerta.advertencia(`El rol de ${(currentRole || '').toUpperCase()} no tiene permisos para acceder a esta sección.`, 'Acceso Restringido');
        }
        return;
    }

    const content = document.getElementById('content');
    if (!content) {
        console.error('Elemento #content no encontrado en el DOM.');
        return;
    }

    const rutas = {
        'inicio': { html: 'inicio', css: '' },
        'gestion-productos': { html: 'views/G_Productos.html', css: 'css/views/G_Productos.css' },
        'gestion-ventas': { html: 'views/G_ventas.html', css: 'css/views/G_ventas.css' },
        'gestion-lista-ventas': { html: 'views/G_Lista_Ventas.html', css: 'css/views/G_Lista_Ventas.css' },
        'gestion-categorias': { html: 'views/G_Categorias.html', css: 'css/views/G_Categorias.css' },
        'historial-stock': { html: 'views/H_Stock.html', css: 'css/views/H_Stock.css' },
        'gestion-compra': { html: 'views/G_Compras.html', css: 'css/views/G_Compras.css' },
        'gestion-lista-compras': { html: 'views/G_Lista_Compras.html', css: 'css/views/G_Compras.css' },
        'gestion-proveedores': { html: 'views/G_Proveedores.html', css: 'css/views/G_Proveedores.css' },
        'gestion-empleados': { html: 'views/G_Empleados.html', css: 'css/views/G_Empleados.css' },
        'gestion-clientes': { html: 'views/G_Clientes.html', css: 'css/views/G_Clientes.css' },
        'gestion-garantias': { html: 'views/S_Garantias.html', css: 'css/views/S_Garantias.css' },
        'gestion-servicios': { html: 'views/G_Servicios.html', css: 'css/views/G_Servicios.css' },
        'gestion-devoluciones': { html: 'views/G_Devoluciones.html', css: 'css/views/G_Devoluciones.css' },
        'devoluciones-clientes': { html: 'views/G_Devoluciones_Clientes.html', css: 'css/views/G_Devoluciones.css' },
        'devoluciones-proveedores': { html: 'views/G_Devoluciones_Proveedores.html', css: 'css/views/G_Devoluciones.css' },
        'gestion-pagos-web': { html: 'views/G_Pagos_Web.html', css: '' },
        'gestion-caja': { html: 'views/G_Caja.html', css: 'css/views/G_Caja.css' },
        'gestion-auditoria': { html: 'views/G_Auditorias.html', css: 'css/views/G_Auditorias.css' },
        'gestion-reportes': { html: 'views/G_Reportes.html', css: 'css/views/G_Reportes.css' },
        'gestion-temporales': { html: 'views/G_Temporales.html', css: 'css/views/G_Empleados.css' }
    };

    const vista = rutas[nombreVista];
    if (!vista) {
        console.error('Vista no encontrada:', nombreVista);
        return;
    }

    if (_vistaCargandoActualmente === nombreVista) return;
    _vistaCargandoActualmente = nombreVista;

    // 1. Resaltar menú de navegación de inmediato
    actualizarNavActivo(nombreVista);

    // 2. Activar barra superior de progreso (NO vaciar #content aún: la pantalla actual permanece en su sitio)
    showTopLoader();

    try {
        // 3. Descargar o recuperar simultáneamente el CSS y el HTML de la vista
        const [cssText, rawHtml] = await Promise.all([
            obtenerCssVista(vista.css),
            obtenerHtmlVista(vista.html, nombreVista)
        ]);

        // 4. PASO CRÍTICO ANTI-FOUC:
        // APLICAR LOS ESTILOS EN UN TAG <style> DE FORMA SÍNCRONA ANTES DE INSERTAR EL HTML
        let styleTag = document.getElementById('current-view-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'current-view-style';
            document.head.appendChild(styleTag);
        }
        // Inyectar el CSS de inmediato en el CSSOM
        styleTag.textContent = cssText || '';

        // 5. Limpiar y sanitizar el fragmento HTML
        const cleanHtml = limpiarHtmlVista(rawHtml);

        // 6. INYECTAR EL HTML DIRECTAMENTE ESTILIZADO
        // Las reglas CSS ya existen en styleTag; el navegador parsea los elementos ya vestidos.
        content.innerHTML = `<div class="view-fade-in">${cleanHtml}</div>`;
        content.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });

        finishTopLoader();

        // 7. Eventos comunes
        if (typeof inicializarEventos === 'function') {
            try { inicializarEventos(); } catch (e) { console.warn(e); }
        }

        // 8. Inicializar controlador de la vista de forma no bloqueante
        requestAnimationFrame(() => {
            setTimeout(() => {
                try {
                    inicializarControladorVista(nombreVista);
                } catch (err) {
                    console.error(`Error al inicializar controlador de vista ${nombreVista}:`, err);
                } finally {
                    _vistaCargandoActualmente = null;
                }
            }, 8);
        });

    } catch (err) {
        finishTopLoader();
        _vistaCargandoActualmente = null;
        console.error('Error al cargar la vista:', err);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--error-color, #ef4444);">
                <i class="fas fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h2>Error al cargar la sección</h2>
                <p>Ocurrió un inconveniente al cargar esta pantalla. Por favor verifique su conexión o intente nuevamente.</p>
                <button onclick="cargarVista('${nombreVista}')" style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-rotate"></i> Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Despachador de inicializaciones específicas de cada vista
 */
function inicializarControladorVista(nombreVista) {
    if (nombreVista === 'inicio') {
        if (typeof cargarEstadisticasDashboard === 'function') {
            cargarEstadisticasDashboard();
        }
        if (typeof inicializarGraficos === 'function') {
            inicializarGraficos();
        }
        return;
    }

    if (nombreVista === 'historial-stock') {
        if (typeof cargarHistorialStock === 'function') cargarHistorialStock();
    } else if (nombreVista === 'gestion-productos') {
        if (typeof initProductosImagen === 'function') initProductosImagen();
        const savedView = localStorage.getItem('compunic_product_view') || 'cards';
        if (typeof switchProductView === 'function') switchProductView(savedView, true);

        if (typeof cargarProductos === 'function') cargarProductos();
        if (typeof poblarSelectCategorias === 'function') poblarSelectCategorias();
        if (typeof poblarSelectMarcas === 'function') poblarSelectMarcas();
        if (typeof poblarSelectProveedores === 'function') poblarSelectProveedores();
        if (typeof poblarSelectGarantiaTipos === 'function') poblarSelectGarantiaTipos();
        if (typeof initCardSearch === 'function') initCardSearch();

    } else if (nombreVista === 'gestion-proveedores') {
        const formSection = document.getElementById('seccion-formulario');
        const searchSection = document.getElementById('seccion-busqueda');
        if (formSection) formSection.style.display = '';
        if (searchSection) searchSection.style.display = '';

        if (typeof cargarProveedores === 'function') {
            cargarProveedores();
            if (typeof asignarEventosProveedores === 'function') asignarEventosProveedores();
        }

    } else if (nombreVista === 'gestion-categorias') {
        if (typeof cargarCategorias === 'function') cargarCategorias();
        const btnAgregar = document.getElementById('btn-agregar-categoria');
        if (btnAgregar && typeof agregarCategoria === 'function') {
            btnAgregar.onclick = agregarCategoria;
        }
        if (typeof iniciarEdicionCategoria === 'function') window.iniciarEdicionCategoria = iniciarEdicionCategoria;
        if (typeof eliminarCategoriaPorId === 'function') window.eliminarCategoriaPorId = eliminarCategoriaPorId;

    } else if (nombreVista === 'gestion-clientes') {
        if (typeof cargarClientes === 'function') cargarClientes();
        const btnAdd = document.getElementById('btn_agregar_cliente');
        const btnMod = document.getElementById('btn_modificar_cliente');
        const btnDel = document.getElementById('btn_eliminar_cliente');
        const btnSearch = document.getElementById('btn_buscar_cliente');

        if (btnAdd && typeof agregarCliente === 'function') btnAdd.onclick = agregarCliente;
        if (btnMod && typeof modificarCliente === 'function') btnMod.onclick = modificarCliente;
        if (btnDel && typeof eliminarCliente === 'function') btnDel.onclick = eliminarCliente;
        if (btnSearch && typeof buscarCliente === 'function') btnSearch.onclick = buscarCliente;

    } else if (nombreVista === 'gestion-garantias') {
        const formSection = document.getElementById('seccion-formulario');
        const searchSection = document.getElementById('seccion-busqueda');
        if (formSection) formSection.style.display = '';
        if (searchSection) searchSection.style.display = '';

        if (typeof cargarGarantias === 'function') cargarGarantias();
        if (typeof cargarTiposGarantia === 'function') cargarTiposGarantia();
        if (typeof cargarEstadosGarantia === 'function') cargarEstadosGarantia();
        if (typeof initGarantiasRol === 'function') initGarantiasRol();

        if (typeof seleccionarGarantiaEditar === 'function') window.seleccionarGarantiaEditar = seleccionarGarantiaEditar;
        if (typeof toggleEstadoGarantia === 'function') window.toggleEstadoGarantia = toggleEstadoGarantia;

        const btnAdd = document.getElementById('btn_agregar_garantia');
        const btnMod = document.getElementById('btn_modificar_garantia');
        const btnClean = document.getElementById('btn_limpiar_garantia');
        const btnSearch = document.getElementById('btn_buscar_garantia');

        if (btnAdd && typeof agregarGarantia === 'function') btnAdd.onclick = agregarGarantia;
        if (btnMod && typeof modificarGarantia === 'function') btnMod.onclick = modificarGarantia;
        if (btnClean && typeof limpiarFormularioGarantia === 'function') btnClean.onclick = limpiarFormularioGarantia;
        if (btnSearch && typeof buscarGarantia === 'function') btnSearch.onclick = buscarGarantia;

    } else if (nombreVista === 'gestion-empleados') {
        if (typeof initEmpleadosEventos === 'function') initEmpleadosEventos();
        if (typeof cargarEmpleados === 'function') cargarEmpleados();
        const btnAdd = document.getElementById('btn_agregar_empleado');
        const btnMod = document.getElementById('btn_modificar_empleado');
        const btnClean = document.getElementById('btn_limpiar_formulario');
        const btnSearch = document.getElementById('btn_buscar_empleado');

        if (btnAdd && typeof agregarEmpleado === 'function') btnAdd.onclick = agregarEmpleado;
        if (btnMod && typeof modificarEmpleado === 'function') btnMod.onclick = modificarEmpleado;
        if (btnClean && typeof limpiarFormularioEmpleado === 'function') btnClean.onclick = limpiarFormularioEmpleado;
        if (btnSearch && typeof buscarEmpleado === 'function') btnSearch.onclick = buscarEmpleado;

    } else if (nombreVista === 'gestion-servicios') {
        const searchSection = document.getElementById('seccion-busqueda');
        if (searchSection) searchSection.style.display = '';
        if (typeof cargarServicios === 'function') cargarServicios();
        if (typeof poblarSelectsServicios === 'function') poblarSelectsServicios();
        if (typeof setupEvidenciaInput === 'function') setupEvidenciaInput();

    } else if (nombreVista === 'gestion-reportes') {
        if (typeof cargarModuloReportes === 'function') cargarModuloReportes();

    } else if (nombreVista === 'gestion-ventas') {
        console.log('📋 Cargando vista de Ventas (POS)...');
        if (typeof poblarSelectClientes === 'function') poblarSelectClientes();
        if (typeof poblarSelectProductos === 'function') poblarSelectProductos();
        if (typeof poblarSelectGarantias === 'function') poblarSelectGarantias();

        const productoSelect = document.getElementById('producto-select');
        if (productoSelect) {
            productoSelect.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];
                const precio = selectedOption.getAttribute('data-precio');
                const garantiaDesc = selectedOption.getAttribute('data-garantia-desc');
                const garantiaId = selectedOption.getAttribute('data-garantia-id');

                const precioInput = document.getElementById('precio-unitario');
                const garantiaInput = document.getElementById('garantia-input');
                const garantiaIdInput = document.getElementById('garantia-id');

                if (precioInput) precioInput.value = precio ? parseFloat(precio).toFixed(2) : "0.00";
                if (garantiaInput) garantiaInput.value = garantiaDesc || "";
                if (garantiaIdInput) garantiaIdInput.value = garantiaId || "";
            });
        }

        if (typeof window.inicializarBotonVentas === 'function') window.inicializarBotonVentas();
        if (typeof window.inicializarFechaVenta === 'function') window.inicializarFechaVenta();
        if (typeof window.inicializarVendedorAutomatico === 'function') window.inicializarVendedorAutomatico();
        if (typeof renderVentasPOSGrid === 'function') renderVentasPOSGrid();
        if (typeof Divisas !== 'undefined') Divisas.actualizarWidgetsEnPantalla();
        if (typeof initVentasSearch === 'function') initVentasSearch();
        console.log('✅ Vista de Ventas cargada completamente');

    } else if (nombreVista === 'gestion-compra') {
        if (typeof generarFacturaAutomatica === 'function') generarFacturaAutomatica();
        if (typeof poblarSelectProveedoresCompra === 'function') poblarSelectProveedoresCompra();
        if (typeof renderComprasPOSGrid === 'function') renderComprasPOSGrid();

    } else if (nombreVista === 'gestion-lista-compras') {
        if (typeof cargarCompras === 'function') cargarCompras();
        if (typeof filtrarTabla === 'function') {
            filtrarTabla('buscar_compra', 'tablaCompras', [1, 2]);
        }

    } else if (nombreVista === 'gestion-lista-ventas') {
        if (typeof cargarVentas === 'function') cargarVentas();
        if (typeof initVentasSearch === 'function') initVentasSearch();

    } else if (nombreVista === 'gestion-devoluciones') {
        if (typeof cargarDevoluciones === 'function') cargarDevoluciones();
        if (typeof poblarSelectVentas === 'function') poblarSelectVentas();
        if (typeof cargarSeguimientoSolicitudesVentas === 'function') cargarSeguimientoSolicitudesVentas();

        const ventaSelect = document.getElementById('venta-select');
        if (ventaSelect) {
            ventaSelect.addEventListener('change', function () {
                if (typeof cargarProductosDeVenta === 'function') cargarProductosDeVenta(this.value);
            });
        }

        const devolutionForm = document.getElementById('devolution-form');
        if (devolutionForm) {
            devolutionForm.addEventListener('submit', function (e) {
                if (typeof agregarDevolucion === 'function') agregarDevolucion(e);
            });
        }

    } else if (nombreVista === 'devoluciones-clientes') {
        if (typeof cargarDevoluciones === 'function') cargarDevoluciones();

    } else if (nombreVista === 'devoluciones-proveedores') {
        if (typeof cargarDevolucionesProveedores === 'function') cargarDevolucionesProveedores();
        if (typeof poblarSelectProveedoresDev === 'function') poblarSelectProveedoresDev();
        if (typeof poblarSelectProductosProvDev === 'function') poblarSelectProductosProvDev();

    } else if (nombreVista === 'gestion-pagos-web') {
        if (typeof window.initPagos === 'function') window.initPagos();

    } else if (nombreVista === 'gestion-auditoria') {
        if (typeof cargarAuditorias === 'function') cargarAuditorias();
        if (typeof filtrarTabla === 'function') {
            filtrarTabla('buscar_auditoria', 'tablaAuditorias', [2, 3, 4, 5]);
        }

    } else if (nombreVista === 'gestion-caja') {
        if (typeof window.inicializarModuloCaja === 'function') {
            window.inicializarModuloCaja();
        }

    } else if (nombreVista === 'gestion-temporales') {
        if (typeof window.initTemporalesEventos === 'function') window.initTemporalesEventos();
        if (typeof window.cargarETemporales === 'function') window.cargarETemporales();
    }
}

// Hacer la función globalmente accesible
window.cargarVista = cargarVista;
