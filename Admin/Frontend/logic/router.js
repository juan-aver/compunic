/*
 * ==========================================
 * MÓDULO: router.js
 * PROPÓSITO: Lógica de enrutamiento y vistas de la aplicación.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
// URL base del API (usar puerto 3001, coincide con `Admin/Backend/server.js`)
// const API_BASE = 'http://localhost:3001/api'; // COMENTADO: Ya definido en auth.js

// ========================
// FUNCIÓN PARA AUTO-ASIGNAR VENDEDOR
// ========================

/**
 * Función para inicializar el vendedor automáticamente desde la sesión
 * Se ejecuta cuando se carga la vista de ventas
 */
function inicializarVendedorAutomatico() {
    console.log('🔧 Inicializando vendedor automático...');

    const session = Auth.getSession();

    if (!session) {
        console.error('❌ No hay sesión activa');
        Alerta.error('No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.', 'Sesión Requerida');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        return;
    }

    // Verificar que tenga ID_VENDEDOR
    if (!session.id_vendedor) {
        console.error('❌ El usuario no tiene ID_VENDEDOR asignado');
        Alerta.advertencia('Su usuario no está configurado como vendedor. Contacte al administrador.', 'Atención');
        return;
    }

    // Obtener elementos del DOM
    const vendedorDisplay = document.getElementById('vendedor-display');
    const vendedorId = document.getElementById('vendedor-id');

    // Si existen los inputs, asignar valores
    if (vendedorDisplay && vendedorId) {
        vendedorDisplay.value = `${session.nombre} ${session.apellido}`;
        vendedorId.value = session.id_vendedor;
        console.log('✅ Vendedor auto-asignado:', `${session.nombre} ${session.apellido}`, 'ID:', session.id_vendedor);
    } else {
        console.warn('⚠️ No se encontraron los elementos del vendedor en el DOM');
    }
}

// Exportar para uso global
window.inicializarVendedorAutomatico = inicializarVendedorAutomatico;


// ========================
// CONTROL DE PERMISOS POR ROL
// ========================

/**
 * Retorna las vistas permitidas según el rol del usuario
 * @param {string} role - 'admin', 'vendedor', 'cajero', 'tecnico'
 * @returns {Array<string>} Lista de identificadores de vistas permitidas
 */
function obtenerVistasPermitidasPorRol(role) {
    const rolNormalizado = (role || '').toLowerCase();
    const matrizPermisos = {
        'admin': ['*'],
        'vendedor': [
            'gestion-ventas',
            'gestion-lista-ventas',
            'gestion-clientes',
            'gestion-garantias',
            'gestion-devoluciones'
        ],
        'cajero': [
            'gestion-caja',
            'gestion-ventas',
            'gestion-lista-ventas',
            'gestion-devoluciones',
            'gestion-pagos-web',
            'gestion-clientes'
        ],
        'tecnico': [
            'gestion-servicios',
            'gestion-garantias',
            'historial-stock',
            'gestion-productos'
        ],
        'temporal': [
            'gestion-servicios',
            'gestion-garantias',
            'gestion-productos'
        ]
    };
    return matrizPermisos[rolNormalizado] || [];
}

window.obtenerVistasPermitidasPorRol = obtenerVistasPermitidasPorRol;

// 🧭 Esta función inyecta el HTML de la vista y carga el módulo JS correspondiente en el momento exacto
function cargarVista(nombreVista, Lista_de_productos = false, Lista_de_proveedores = false, Lista_de_usuario = false) {

    // Validar permisos del rol actual
    const currentRole = (typeof Auth !== 'undefined' && typeof Auth.getRole === 'function') ? Auth.getRole() : 'admin';
    const permitidas = obtenerVistasPermitidasPorRol(currentRole);
    
    if (!permitidas.includes('*') && !permitidas.includes(nombreVista)) {
        console.warn(`⛔ Acceso denegado a la vista "${nombreVista}" para el rol "${currentRole}".`);
        Alerta.advertencia(`El rol de ${(currentRole || '').toUpperCase()} no tiene permisos para acceder a esta sección.`, 'Acceso Restringido');
        return;
    }

    const rutas = {
        'gestion-productos': { html: 'views/G_Productos.html', css: 'css/views/G_Productos.css' },
        'gestion-ventas': { html: 'views/G_ventas.html', css: 'css/views/G_ventas.css' },
        'gestion-lista-ventas': { html: 'views/G_Lista_Ventas.html', css: '' },
        'gestion-categorias': { html: 'views/G_Categorias.html', css: 'css/views/G_Categorias.css' },
        'historial-stock': { html: 'views/H_Stock.html', css: 'css/views/H_Stock.css' },
        'gestion-compra': { html: 'views/G_Compras.html', css: 'css/views/G_Compras.css' },
        'gestion-lista-compras': { html: 'views/G_Lista_Compras.html', css: '' },
        'gestion-proveedores': { html: 'views/G_Proveedores.html', css: 'css/views/G_Proveedores.css' },
        'gestion-empleados': { html: 'views/G_Empleados.html', css: 'css/views/G_Empleados.css' },
        'gestion-clientes': { html: 'views/G_Clientes.html', css: 'css/views/G_Clientes.css' },
        'gestion-garantias': { html: 'views/S_Garantias.html', css: 'css/views/S_Garantias.css' },
        'gestion-servicios': { html: 'views/G_Servicios.html', css: 'css/views/G_Servicios.css' },
        'gestion-devoluciones': { html: 'views/G_Devoluciones.html', css: 'css/views/G_Devoluciones.css' },
        'gestion-pagos-web':     { html: 'views/G_Pagos_Web.html',  css: '' },
        'gestion-caja':          { html: 'views/G_Caja.html',       css: 'css/views/G_Caja.css' },
        'gestion-auditoria':     { html: 'views/G_Auditorias.html', css: 'css/views/G_Auditorias.css' },
        'gestion-reportes':      { html: 'views/G_Reportes.html',   css: 'css/views/G_Reportes.css' },
        'gestion-temporales':    { html: 'views/G_Temporales.html', css: 'css/views/G_Empleados.css' }
    };

    const vista = rutas[nombreVista];

    if (vista) {
        fetch(vista.html)
            .then(response => {
                if (!response.ok) throw new Error('No se pudo cargar la vista');
                return response.text();
            })
            .then(html => {
                document.getElementById('content').innerHTML = html;

                if (typeof inicializarEventos === 'function') inicializarEventos();

                const head = document.getElementsByTagName('head')[0];
                const existingLink = document.getElementById('vista-css');
                if (existingLink) existingLink.remove();

                const link = document.createElement('link');
                link.id = 'vista-css';
                link.rel = 'stylesheet';
                link.href = vista.css;
                head.appendChild(link);

                requestAnimationFrame(() => {

                    if (nombreVista === 'historial-stock') {
                        if (typeof cargarHistorialStock === 'function') cargarHistorialStock();
                    } else if (nombreVista === 'gestion-productos') {
                        // Inicializar preview de imagen y modal
                        initProductosImagen();

                        // Restore saved view preference
                        // Restore saved view preference
                        const savedView = localStorage.getItem('compunic_product_view') || 'cards';
                        if (typeof switchProductView === 'function') switchProductView(savedView, true);

                        // Cargar datos y poblar selects
                        if (typeof cargarProductos === 'function') cargarProductos();
                        if (typeof poblarSelectCategorias === 'function') poblarSelectCategorias();
                        if (typeof poblarSelectMarcas === 'function') poblarSelectMarcas();
                        if (typeof poblarSelectProveedores === 'function') poblarSelectProveedores();
                        if (typeof poblarSelectGarantiaTipos === 'function') poblarSelectGarantiaTipos();

                        // Card search filter (now handles both cards and table views)
                        if (typeof initCardSearch === 'function') initCardSearch();
                    }
                    else if (nombreVista === 'gestion-proveedores') {
                        // Ensure they are visible
                        const formSection = document.getElementById('seccion-formulario');
                        const searchSection = document.getElementById('seccion-busqueda');
                        if (formSection) formSection.style.display = '';
                        if (searchSection) searchSection.style.display = '';

                        if (typeof cargarProveedores === 'function') {
                            cargarProveedores();
                            asignarEventosProveedores();
                        }

                    } else if (nombreVista === 'gestion-categorias') {
                        if (typeof cargarCategorias === 'function') cargarCategorias();

                        const btnAgregar = document.getElementById('btn-agregar-categoria');
                        if (btnAgregar) {
                            btnAgregar.onclick = agregarCategoria;
                        }
                        // Exponer funciones inline de la tabla globalmente
                        window.iniciarEdicionCategoria = iniciarEdicionCategoria;
                        window.eliminarCategoriaPorId = eliminarCategoriaPorId;

                    } else if (nombreVista === 'gestion-clientes') {
                        if (typeof cargarClientes === 'function') cargarClientes();

                        const btnAdd = document.getElementById('btn_agregar_cliente');
                        const btnMod = document.getElementById('btn_modificar_cliente');
                        const btnDel = document.getElementById('btn_eliminar_cliente');
                        const btnSearch = document.getElementById('btn_buscar_cliente');

                        if (btnAdd) btnAdd.onclick = agregarCliente;
                        if (btnMod) btnMod.onclick = modificarCliente;
                        if (btnDel) btnDel.onclick = eliminarCliente;
                        if (btnSearch) btnSearch.onclick = buscarCliente;

                    } else if (nombreVista === 'gestion-garantias') {
                        // Ensure they are visible
                        const formSection = document.getElementById('seccion-formulario');
                        const searchSection = document.getElementById('seccion-busqueda');
                        if (formSection) formSection.style.display = '';
                        if (searchSection) searchSection.style.display = '';
                        if (typeof cargarGarantias === 'function') cargarGarantias();
                        if (typeof cargarTiposGarantia === 'function') cargarTiposGarantia();
                        if (typeof cargarEstadosGarantia === 'function') cargarEstadosGarantia();
                        if (typeof initGarantiasRol === 'function') initGarantiasRol();

                        // Exponer funciones inline globalmente
                        window.seleccionarGarantiaEditar = seleccionarGarantiaEditar;
                        window.toggleEstadoGarantia = toggleEstadoGarantia;

                        const btnAdd = document.getElementById('btn_agregar_garantia');
                        const btnMod = document.getElementById('btn_modificar_garantia');
                        const btnClean = document.getElementById('btn_limpiar_garantia');
                        const btnSearch = document.getElementById('btn_buscar_garantia');

                        if (btnAdd) btnAdd.onclick = agregarGarantia;
                        if (btnMod) btnMod.onclick = modificarGarantia;
                        if (btnClean) btnClean.onclick = limpiarFormularioGarantia;
                        if (btnSearch) btnSearch.onclick = buscarGarantia;

                    } else if (nombreVista === 'gestion-empleados') {
                        if (typeof initEmpleadosEventos === 'function') initEmpleadosEventos();
                        if (typeof cargarEmpleados === 'function') cargarEmpleados();
                        const btnAdd = document.getElementById('btn_agregar_empleado');
                        const btnMod = document.getElementById('btn_modificar_empleado');
                        const btnClean = document.getElementById('btn_limpiar_formulario');
                        const btnSearch = document.getElementById('btn_buscar_empleado');

                        if (btnAdd) btnAdd.onclick = agregarEmpleado;
                        if (btnMod) btnMod.onclick = modificarEmpleado;
                        if (btnClean) btnClean.onclick = limpiarFormularioEmpleado;
                        if (btnSearch) btnSearch.onclick = buscarEmpleado;

                    }/*cargar vista servicios*/else if (nombreVista === 'gestion-servicios') {
                        const searchSection = document.getElementById('seccion-busqueda');
                        if (searchSection) searchSection.style.display = '';

                        // 1. Cargar el Historial y Servicios Activos
                        if (typeof cargarServicios === 'function') cargarServicios();

                        // 2. Llenar los selects del formulario modal (clientes, técnicos, garantías, etc.)
                        if (typeof poblarSelectsServicios === 'function') poblarSelectsServicios();

                        // 3. Inicializar listener de imagen de evidencia
                        if (typeof setupEvidenciaInput === 'function') setupEvidenciaInput();
                    } else if (nombreVista === 'gestion-reportes') {
                        if (typeof cargarModuloReportes === 'function') cargarModuloReportes();
                    } /*ventas pos*/else if (nombreVista === 'gestion-ventas') {
                        console.log('📋 Cargando vista de Ventas (POS)...');

                        // 1. Llenar los Selects del formulario
                        if (typeof poblarSelectClientes === 'function') poblarSelectClientes();
                        if (typeof poblarSelectProductos === 'function') poblarSelectProductos();
                        if (typeof poblarSelectGarantias === 'function') poblarSelectGarantias();

                        // 2. Listener para cambio de producto (actualizar precio y garantía)
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

                                if (precioInput) {
                                    precioInput.value = precio ? parseFloat(precio).toFixed(2) : "0.00";
                                }
                                if (garantiaInput) {
                                    garantiaInput.value = garantiaDesc || "";
                                }
                                if (garantiaIdInput) {
                                    garantiaIdInput.value = garantiaId || "";
                                }
                            });
                        }

                        // 3. Inicializar botón de agregar productos
                        if (typeof window.inicializarBotonVentas === 'function') {
                            window.inicializarBotonVentas();
                        }

                        // 4. Inicializar campo de fecha (solo permitir fecha actual)

                        if (typeof window.inicializarFechaVenta === 'function') {
                            window.inicializarFechaVenta();
                        }

                        // ⭐ 6. Inicializar vendedor automáticamente desde la sesión
                        if (typeof window.inicializarVendedorAutomatico === 'function') {
                            window.inicializarVendedorAutomatico();
                        }

                        // 7. Renderizar grid POS de productos directamente
                        if (typeof renderVentasPOSGrid === 'function') renderVentasPOSGrid();

                        console.log('✅ Vista de Ventas cargada completamente');

                        // SEARCH LOGIC FOR SALES
                        // Columns: 1 (No. Factura), 3 (Cliente), 4 (Vendedor)
                        // Table structure in G_ventas.html:
                        // 0: ID Venta, 1: No. Factura, 2: Fecha, 3: Cliente, 4: Vendedor, ...
                        if (typeof initVentasSearch === 'function') {
                            initVentasSearch();
                        }
                    } /*compras*/else if (nombreVista === 'gestion-compra') {
                        // POS initialization
                        if (typeof generarFacturaAutomatica === 'function') generarFacturaAutomatica();
                        if (typeof poblarSelectProveedoresCompra === 'function') poblarSelectProveedoresCompra();
                        // Renderizar grid POS de productos directamente
                        if (typeof renderComprasPOSGrid === 'function') renderComprasPOSGrid();
                    } /*lista compras*/else if (nombreVista === 'gestion-lista-compras') {
                        if (typeof cargarCompras === 'function') cargarCompras();

                        // SEARCH LOGIC FOR PURCHASES
                        if (typeof filtrarTabla === 'function') {
                            filtrarTabla('buscar_compra', 'tablaCompras', [1, 2]);
                        }
                    } /*lista ventas*/else if (nombreVista === 'gestion-lista-ventas') {
                        if (typeof cargarVentas === 'function') cargarVentas();

                        // SEARCH LOGIC FOR SALES
                        if (typeof initVentasSearch === 'function') {
                            initVentasSearch();
                        }
                    } else if (nombreVista === 'gestion-devoluciones') {
                        // Inicializar módulo de devoluciones
                        if (typeof cargarDevoluciones === 'function') cargarDevoluciones();
                        if (typeof poblarSelectVentas === 'function') poblarSelectVentas();

                        // Event listener para cambio de venta  
                        const ventaSelect = document.getElementById('venta-select');
                        if (ventaSelect) {
                            ventaSelect.addEventListener('change', function () {
                                if (typeof cargarProductosDeVenta === 'function') {
                                    cargarProductosDeVenta(this.value);
                                }
                            });
                        }

                        // Inicializar reemplazos
                        if (typeof poblarSelectProductosReemplazo === 'function') {
                            poblarSelectProductosReemplazo();
                        }
                        const cantInput = document.getElementById('cantidad-devolucion');
                        if (cantInput) {
                            cantInput.addEventListener('input', function() {
                                if (typeof verificarSeleccionSeriesReemplazo === 'function') {
                                    verificarSeleccionSeriesReemplazo();
                                }
                            });
                        }

                        // Event listener para submit del formulario
                        const devolutionForm = document.getElementById('devolution-form');
                        if (devolutionForm) {
                            devolutionForm.addEventListener('submit', function (e) {
                                if (typeof agregarDevolucion === 'function') {
                                    agregarDevolucion(e);
                                }
                            });
                        }
                    } else if (nombreVista === 'gestion-pagos-web') {
                        // Pagos de la tienda web — la lógica se carga desde logic/pagos_web.js
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
                        if (typeof window.initTemporalesEventos === 'function') {
                            window.initTemporalesEventos();
                        }
                        if (typeof window.cargarETemporales === 'function') {
                            window.cargarETemporales();
                        }
                    }
                });
            })
            .catch(error => console.error('Error al cargar la vista:', error));
    } else {
        console.error('Vista no encontrada:', nombreVista);
    }
}

// Hacer la función globalmente accesible
window.cargarVista = cargarVista;
