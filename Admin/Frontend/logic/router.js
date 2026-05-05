/*
 * ==========================================
 * MÓDULO: router.js
 * PROPÓSITO: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
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
        alert('Error: No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.');
        window.location.href = 'index.html';
        return;
    }

    // Verificar que tenga ID_VENDEDOR
    if (!session.id_vendedor) {
        console.error('❌ El usuario no tiene ID_VENDEDOR asignado');
        alert('Error: Su usuario no está configurado como vendedor. Contacte al administrador.');
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


// 🧭 Esta función inyecta el HTML de la vista y carga el módulo JS correspondiente en el momento exacto
function cargarVista(nombreVista, Lista_de_productos = false, Lista_de_proveedores = false, Lista_de_usuario = false) {
    // Empieza la magia ✨

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
        'gestion-vendedores': { html: 'views/G_Vendedores.html', css: 'css/views/G_Vendedores.css' },
        'gestion-clientes': { html: 'views/G_Clientes.html', css: 'css/views/G_Clientes.css' },
        'gestion-garantias': { html: 'views/S_Garantias.html', css: 'css/views/S_Garantias.css' },
        'gestion-administradores': { html: 'views/G_Administradores.html', css: 'css/views/G_Administradores.css' },
        'gestion-servicios': { html: 'views/G_Servicios.html', css: 'css/views/G_Servicios.css' },
        'gestion-empleados-temporales': { html: 'views/G_ETemporales.html', css: 'css/views/G_ETemporales.css' },
        'gestion-devoluciones': { html: 'views/G_Devoluciones.html', css: 'css/views/G_Devoluciones.css' }
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

                        if (Lista_de_productos) {
                            const formulario = document.getElementById('seccion-formulario');
                            if (formulario) formulario.style.display = 'none';
                        }
                        // Restore saved view preference
                        const savedView = localStorage.getItem('compunic_product_view') || 'cards';
                        if (typeof switchProductView === 'function') switchProductView(savedView, true);

                        // Cargar datos y poblar selects
                        if (typeof cargarProductos === 'function') cargarProductos();
                        if (typeof poblarSelectCategorias === 'function') poblarSelectCategorias();
                        if (typeof poblarSelectMarcas === 'function') poblarSelectMarcas();
                        if (typeof poblarSelectProveedores === 'function') poblarSelectProveedores();
                        if (typeof poblarSelectGarantiaTipos === 'function') poblarSelectGarantiaTipos();

                        // SEARCH LOGIC FOR PRODUCTS (table + cards)
                        if (typeof filtrarTabla === 'function') {
                            filtrarTabla('buscar_tabla', 'tablaProductos', [1, 2, 3, 5]);
                        }
                        // Card search filter
                        if (typeof initCardSearch === 'function') initCardSearch();
                    }
                    else if (nombreVista === 'gestion-proveedores') {
                        // Logic to hide form and search if in list mode
                        // Note: Lista_de_productos is the 2nd arg, used as generic 'list mode' flag by dashboard
                        if (Lista_de_productos || Lista_de_proveedores) {
                            const formSection = document.getElementById('seccion-formulario');
                            const searchSection = document.getElementById('seccion-busqueda');
                            if (formSection) formSection.style.display = 'none';
                            if (searchSection) searchSection.style.display = 'none';
                        } else {
                            // Ensure they are visible if not in list mode (optional but safe)
                            const formSection = document.getElementById('seccion-formulario');
                            const searchSection = document.getElementById('seccion-busqueda');
                            if (formSection) formSection.style.display = 'block';
                            if (searchSection) searchSection.style.display = 'block';
                        }

                        if (typeof cargarProveedores === 'function') {
                            cargarProveedores();
                            asignarEventosProveedores();
                        }

                    } else if (nombreVista === 'gestion-vendedores') {
                        if (Lista_de_proveedores === true) {
                            const formulario = document.getElementById('seccion-formulario');
                            if (formulario) formulario.style.display = 'none';
                        }
                        if (typeof cargarVendedores === 'function') cargarVendedores();

                        const btnAdd = document.getElementById('btn_agregar_vendedor');
                        const btnMod = document.getElementById('btn_modificar_vendedor');
                        const btnDel = document.getElementById('btn_eliminar_vendedor');
                        const btnSearch = document.getElementById('btn_buscar_vendedor');

                        if (btnAdd) btnAdd.onclick = agregarVendedor;
                        if (btnMod) btnMod.onclick = modificarVendedor;
                        if (btnDel) btnDel.onclick = eliminarVendedor;
                        if (btnSearch) btnSearch.onclick = buscarVendedor;

                    } else if (nombreVista === 'gestion-categorias') {
                        if (typeof cargarCategorias === 'function') cargarCategorias();

                        const btnAgregar = document.getElementById('btn-agregar-categoria');
                        const btnModificar = document.getElementById('btn-modificar-categoria');
                        const btnEliminar = document.getElementById('btn-eliminar-categoria');

                        if (btnAgregar) btnAgregar.onclick = agregarCategoria;
                        if (btnModificar) btnModificar.onclick = modificarCategoria;
                        if (btnEliminar) btnEliminar.onclick = eliminarCategoria;

                    } else if (nombreVista === 'gestion-administradores') {
                        // cargarAdministradores(); // TODO: Función no definida
                        // cargarEmpleadosParaAdmin(); // TODO: Función no definida

                        const btnAdd = document.getElementById('btn_agregar_administrador');
                        const btnMod = document.getElementById('btn_modificar_administrador');
                        const btnDel = document.getElementById('btn_eliminar_administrador');
                        const btnClean = document.getElementById('btn_limpiar_administrador');
                        const btnSearch = document.getElementById('btn_buscar_administrador'); // Asumiendo ID estándar

                        if (btnAdd) btnAdd.onclick = agregarAdministrador;
                        if (btnMod) btnMod.onclick = modificarAdministrador;
                        if (btnDel) btnDel.onclick = eliminarAdministrador;
                        if (btnClean) btnClean.onclick = limpiarFormularioAdministrador;
                        if (btnSearch) btnSearch.onclick = buscarAdministrador;

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
                        // Logic to hide form and search if in list mode
                        if (Lista_de_productos) {
                            const formSection = document.getElementById('seccion-formulario');
                            const searchSection = document.getElementById('seccion-busqueda');
                            if (formSection) formSection.style.display = 'none';
                            if (searchSection) searchSection.style.display = 'none';
                        }
                        if (typeof cargarGarantias === 'function') cargarGarantias();
                        if (typeof cargarTiposGarantia === 'function') cargarTiposGarantia();
                        if (typeof cargarEstadosGarantia === 'function') cargarEstadosGarantia();

                        const btnAdd = document.getElementById('btn_agregar_garantia');
                        const btnMod = document.getElementById('btn_modificar_garantia');
                        const btnDel = document.getElementById('btn_eliminar_garantia');
                        const btnClean = document.getElementById('btn_limpiar_garantia');
                        const btnSearch = document.getElementById('btn_buscar_garantia');

                        if (btnAdd) btnAdd.onclick = agregarGarantia;
                        if (btnMod) btnMod.onclick = modificarGarantia;
                        if (btnDel) btnDel.onclick = eliminarGarantia;
                        if (btnClean) btnClean.onclick = limpiarFormularioGarantia;
                        if (btnSearch) btnSearch.onclick = buscarGarantia;

                    } else if (nombreVista === 'gestion-empleados') {
                        if (typeof cargarEmpleados === 'function') cargarEmpleados();
                        const btnAdd = document.getElementById('btn_agregar_empleado');
                        const btnMod = document.getElementById('btn_modificar_empleado');
                        const btnDel = document.getElementById('btn_eliminar_empleado');
                        const btnSearch = document.getElementById('btn_buscar_empleado');

                        if (btnAdd) btnAdd.onclick = agregarEmpleado;
                        if (btnMod) btnMod.onclick = modificarEmpleado;
                        if (btnDel) btnDel.onclick = eliminarEmpleado;
                        if (btnSearch) btnSearch.onclick = buscarEmpleado;

                    }/*cargar vista servicios*/else if (nombreVista === 'gestion-servicios') {
                        // Logic to hide catalog, form and search if in list mode
                        if (Lista_de_productos) {
                            const catalogSection = document.querySelector('.catalogo-section');
                            const formSection = document.querySelector('.formulario');
                            const searchSection = document.getElementById('seccion-busqueda');

                            if (catalogSection) catalogSection.style.display = 'none';
                            if (formSection) formSection.style.display = 'none';
                            if (searchSection) searchSection.style.display = 'none';
                        }
                        // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---

                        // 1. Cargar el Catálogo (Tabla de arriba)
                        if (typeof cargarCatalogo === 'function') cargarCatalogo();

                        // 2. Cargar el Historial (Tabla de abajo)
                        if (typeof cargarServicios === 'function') cargarServicios();

                        // 3. Llenar los selects del formulario
                        if (typeof poblarSelectsServicios === 'function') poblarSelectsServicios();

                        // SEARCH LOGIC FOR SERVICES
                        // Columns: 1 (Descripción), 2 (Cliente), 3 (Tipo)
                        // Table structure in G_Servicios.html:
                        // 0: ID, 1: Descripción, 2: Cliente, 3: Tipo, ...
                        if (typeof filtrarTabla === 'function') {
                            filtrarTabla('buscar_servicio', 'tabla-servicios', [1, 2, 3]);
                        }

                        // 4. Asignar eventos a los botones del formulario
                        const btnAdd = document.getElementById('btn-agregar');
                        const btnMod = document.getElementById('btn-modificar');
                        const btnDel = document.getElementById('btn-eliminar');
                        const btnClean = document.getElementById('btn-limpiar');

                        if (btnAdd) btnAdd.onclick = (e) => { e.preventDefault(); agregarServicio(); };
                        if (btnMod) btnMod.onclick = (e) => { e.preventDefault(); modificarServicio(); };
                        if (btnDel) btnDel.onclick = (e) => { e.preventDefault(); eliminarServicio(); };
                        if (btnClean) btnClean.onclick = (e) => { e.preventDefault(); limpiarFormularioServicio(); };
                        if (btnClean) btnClean.onclick = (e) => { e.preventDefault(); limpiarFormularioServicio(); };
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
                        if (typeof filtrarTabla === 'function') {
                            filtrarTabla('buscar_venta', 'sales-record-table', [1, 3, 4]);
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
                        if (typeof filtrarTabla === 'function') {
                            filtrarTabla('buscar_venta', 'sales-record-table', [1, 3, 4]);
                        }
                    } else if (nombreVista === 'gestion-empleados-temporales') {
                        if (typeof cargarETemporales === 'function') cargarETemporales();
                        if (typeof poblarSelectAdministradores === 'function') poblarSelectAdministradores();

                        const btnAdd = document.getElementById('btn-agregar-et');
                        const btnMod = document.getElementById('btn-modificar-et');
                        const btnDel = document.getElementById('btn-eliminar-et');
                        const btnClean = document.getElementById('btn-limpiar-et');

                        if (btnAdd) btnAdd.onclick = (e) => { e.preventDefault(); agregarETemporal(); };
                        if (btnMod) btnMod.onclick = (e) => { e.preventDefault(); modificarETemporal(); };
                        if (btnDel) btnDel.onclick = (e) => { e.preventDefault(); eliminarETemporal(); };
                        if (btnClean) btnClean.onclick = (e) => { e.preventDefault(); limpiarFormularioETemporal(); };
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

                        // Event listener para submit del formulario
                        const devolutionForm = document.getElementById('devolution-form');
                        if (devolutionForm) {
                            devolutionForm.addEventListener('submit', function (e) {
                                if (typeof agregarDevolucion === 'function') {
                                    agregarDevolucion(e);
                                }
                            });
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
