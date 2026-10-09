/**
 * @file aurum-tutorial.js
 * @description Motor interactivo del tutorial paso a paso guiado por AURUM para Compunic.
 * Soporta dos roles: Administrador y Vendedor.
 * Versión final: Resalta y abre los menús desplegables del navbar (dropdowns) para señalar los sub-botones exactos.
 */

(function () {
    const STORAGE_KEY = 'aurum_tutorial_completed';
    let currentStepIndex = 0;
    let activeSteps = [];
    let resizeAndScrollHandler = null;

    // Elementos del DOM del tutorial
    let backdropEl = null;
    let blockerEl = null;
    let popoverEl = null;
    let globalSkipEl = null;

    // Definición de Pasos para Administradores
    const adminSteps = [
        {
            title: "¡Bienvenido Administrador! 👑",
            subtitle: "Introducción al Reino Comercial",
            body: "<p>Hola, soy <strong>AURUM</strong>, tu asistente de Inteligencia Artificial. Te daré un recorrido rápido para que aprendas a gestionar el sistema de Compunic de manera de eficiente.</p><p>¿Empezamos el recorrido?</p>",
            target: null,
            placement: "center"
        },
        {
            title: "Módulo de Indicadores 📊",
            subtitle: "Monitoreo en Tiempo Real",
            body: "<p>Estas son tus <strong>Tarjetas Estadísticas</strong>. Aquí verás de un vistazo los ingresos mensuales, clientes nuevos y tickets de soporte técnico pendientes.</p><div class='aurum-tutorial-task-box'>⚠️ Presta especial atención al <strong>Stock Crítico</strong>: te indicará de inmediato si algún producto se está agotando.</div>",
            target: ".dashboard-grid",
            placement: "bottom"
        },
        {
            title: "Destacados y Gráficos 📈",
            subtitle: "Análisis y Desempeño",
            body: "<p>Esta sección es exclusiva para ti. Aquí el sistema te destacará a tu <strong>Cliente Top</strong>, el <strong>Producto Más Vendido</strong> y el producto con menor demanda para ayudarte a planificar ofertas.</p>",
            target: ".dashboard-highlights",
            placement: "top"
        },
        {
            title: "Paso 1: Abrir Inventario 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Para gestionar tu catálogo de artículos, debes ir al menú superior y abrir el menú desplegable **Inventario**.</p>",
            target: "#nav-inventario",
            placement: "bottom"
        },
        {
            title: "Registrar Productos 📦",
            subtitle: "Submenú del Inventario",
            body: "<p>Dentro de este menú, debes hacer clic en el sub-botón **Producto** para registrar nuevos productos o el de **Listado** para ver las existencias actuales.</p>",
            target: '#nav-inventario a[onclick="cargarVista(\'gestion-productos\', false)"]',
            placement: "bottom"
        },
        {
            title: "Catálogo e Inventario 📦",
            subtitle: "Catálogo de Artículos",
            body: "<p>¡He cambiado tu vista a <strong>Productos</strong>! En esta pantalla puedes gestionar tu inventario: registrar nuevos productos, editar precios, subir fotos y controlar las existencias actuales.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-productos', true);
            }
        },
        {
            title: "Paso 2: Menú de Compras 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Cuando necesites abastecer tu stock o registrar nuevos distribuidores, dirígete al menú superior y abre el desplegable **Compras**.</p>",
            target: "#nav-compras",
            placement: "bottom"
        },
        {
            title: "Generar Nueva Compra 🛒",
            subtitle: "Submenú de Compras",
            body: "<p>Haz clic en el sub-botón **Nueva compra** para iniciar el registro de abastecimiento y sumarlo al inventario.</p>",
            target: '#nav-compras a[onclick="cargarVista(\'gestion-compra\')"]',
            placement: "bottom"
        },
        {
            title: "Registro de Compras 🛒",
            subtitle: "Abastecimiento e Inventario",
            body: "<p>En el módulo de <strong>Compras</strong> puedes registrar el reabastecimiento de tu stock adquiriendo productos de tus proveedores. Las existencias se sumarán de manera automática al guardar la compra.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-compra');
            }
        },
        {
            title: "Paso 3: Menú Administración 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Para dar de alta nuevos empleados, asignar permisos, registrar clientes o revisar los pagos web, abre la pestaña **Administración**.</p>",
            target: "#nav-administracion",
            placement: "bottom"
        },
        {
            title: "Gestionar Personal 👥",
            subtitle: "Submenú de Administración",
            body: "<p>Haz clic en el sub-botón **Personal / Empleados** para dar de alta trabajadores y asignar sus credenciales.</p>",
            target: '#nav-administracion a[onclick="cargarVista(\'gestion-empleados\')"]',
            placement: "bottom"
        },
        {
            title: "Administración de Personal 👥",
            subtitle: "Gestión de Accesos",
            body: "<p>Desde el módulo de <strong>Personal / Empleados</strong> das de alta a tus trabajadores y les asignas su correspondiente **Rol** (<code>admin</code> o <code>vendedor</code>) para controlar lo que pueden ver en el sistema.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-empleados');
            }
        },
        {
            title: "Consultas Inteligentes con AURUM 🧠✨",
            subtitle: "Tu Asistente Virtual IA",
            body: "<p>¡Esta es mi herramienta favorita! Al hacer clic en este widget flotante, puedes **conversar conmigo en lenguaje natural**.</p><div class='aurum-tutorial-task-box'>Pruébalo preguntándome: <em>\"¿Qué productos tienen bajo stock hoy?\"</em> o <em>\"Resumen de ingresos del mes\"</em>.</div>",
            target: "#aurum-fab",
            placement: "left"
        },
        {
            title: "¡Inducción Completada! 🎉",
            subtitle: "Control Total en tus Manos",
            body: "<p>Has finalizado el tutorial de Administrador. Ahora tienes todas las herramientas para llevar a Compunic al siguiente nivel.</p><p>Estaré siempre disponible en el chat si tienes dudas.</p>",
            target: null,
            placement: "center"
        }
    ];

    // Definición de Pasos para Vendedores
    const vendorSteps = [
        {
            title: "¡Bienvenido al Equipo de Ventas! 💼",
            subtitle: "Introducción para Vendedores",
            body: "<p>Hola, soy <strong>AURUM</strong>, tu asistente del sistema. Te guiaré en este tutorial rápido para que aprendas a realizar ventas y dar soporte técnico en Compunic.</p><p>¿Iniciamos la guía?</p>",
            target: null,
            placement: "center"
        },
        {
            title: "Tu Panel Resumido 📊",
            subtitle: "Monitoreo Diario",
            body: "<p>Como vendedor, aquí verás tus métricas personales: ingresos del mes, cantidad de ventas que has realizado y los tickets de soporte técnico pendientes.</p>",
            target: ".dashboard-grid",
            placement: "bottom"
        },
        {
            title: "Paso 1: Módulo de Servicios 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Como vendedor, la mayoría de tus herramientas diarias (Ventas, Reparaciones y Garantías) están agrupadas dentro del menú desplegable **Servicios** en la barra superior.</p>",
            target: "#nav-servicios",
            placement: "bottom"
        },
        {
            title: "Generar una Venta 💰",
            subtitle: "Submenú de Servicios",
            body: "<p>Haz clic en el sub-botón **Generar Venta** para entrar al panel de facturación de artículos.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-ventas\')"]',
            placement: "bottom"
        },
        {
            title: "Generar Ventas (Punto de Venta POS) 💰",
            subtitle: "Facturación al Cliente",
            body: "<p>Te he redirigido al módulo <strong>Generar Venta</strong>. Aquí harás la facturación. El número de factura se autogenera y el sistema te asigna como el vendedor activo de forma automática.</p>",
            target: "#seccion-formulario-venta",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-ventas');
            }
        },
        {
            title: "Seleccionar Artículos 📦",
            subtitle: "Tu Lista de Inventario",
            body: "<p>En esta sección de la izquierda puedes buscar productos por nombre o código. Haz clic sobre cualquier producto para añadirlo al carrito de compras.</p>",
            target: ".ventas-product-list",
            placement: "right",
            action: () => {
                window.cargarVista('gestion-ventas');
            }
        },
        {
            title: "Confirmar y Cobrar 💳",
            subtitle: "Detalle de Factura",
            body: "<p>En esta columna verás el desglose del subtotal, IVA (15%) y total de la factura. Haz clic en el botón <strong>Guardar Venta</strong> para finalizar el cobro.</p>",
            target: ".ventas-cart-section",
            placement: "left",
            action: () => {
                window.cargarVista('gestion-ventas');
            }
        },
        {
            title: "Abrir Servicios Técnicos 🔧",
            subtitle: "Submenú de Servicios",
            body: "<p>Para registrar el ingreso de un dispositivo a mantenimiento o reparación técnica, abre el menú de **Servicios** y haz clic en el sub-botón **Servicios**.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-servicios\')"]',
            placement: "bottom"
        },
        {
            title: "Registro de Servicios Técnicos 🔧",
            subtitle: "Atención y Soporte",
            body: "<p>Cuando un cliente traiga un equipo para reparación, ve al módulo de **Servicios** y presiona **+ Nuevo Servicio**. Registra el cliente, tipo de reparación y pon el estado en <em>En Diagnóstico</em>.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-servicios');
            }
        },
        {
            title: "Abrir Garantías 🛡️",
            subtitle: "Submenú de Servicios",
            body: "<p>Para procesar el cambio o revisión de artículos defectuosos bajo cobertura de fábrica, abre el menú de **Servicios** y haz clic en **Garantías**.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-garantias\')"]',
            placement: "bottom"
        },
        {
            title: "Garantías de Clientes 🛡️",
            subtitle: "Resguardo de Compras",
            body: "<p>Desde el módulo de <strong>Garantías</strong> registras los tickets de productos que presentan fallas de fábrica y que requieren reemplazo o reparación gratuita.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-garantias');
            }
        },
        {
            title: "¡Listo para Vender! 🚀",
            subtitle: "Operaciones Diarias Completas",
            body: "<p>Has completado el onboarding de Ventas. Ya puedes iniciar tus labores cotidianas.</p><p>¡Mucho éxito con tus ventas de hoy!</p>",
            target: null,
            placement: "center"
        }
    ];

    // Definición de Pasos para Cajeros
    const cajeroSteps = [
        {
            title: "¡Bienvenido al Control de Caja! 💵",
            subtitle: "Gestión de Turnos y Cobros",
            body: "<p>Hola, soy <strong>AURUM</strong>, tu asistente del sistema. Te acompañaré en este tutorial rápido para que aprendas a abrir tu turno de caja, cobrar en punto de venta, validar pagos web y realizar arqueos.</p><p>¿Iniciamos la guía?</p>",
            target: null,
            placement: "center"
        },
        {
            title: "Tu Centro de Cobros 📊",
            subtitle: "Accesos Rápidos del Cajero",
            body: "<p>Este es tu panel principal como cajero. Tienes acceso inmediato a 5 operaciones clave: <strong>Caja & Turnos</strong>, <strong>Punto de Venta POS</strong>, <strong>Comprobantes Web</strong>, <strong>Facturas del Día</strong> y <strong>Devoluciones</strong>.</p>",
            target: ".cajero-only .dashboard-grid",
            placement: "bottom"
        },
        {
            title: "Paso 1: Módulo de Caja 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Para gestionar aperturas de turno, fondos de cambio y arqueos de efectivo, abre el menú **Administración** en la barra superior.</p>",
            target: "#nav-administracion",
            placement: "bottom"
        },
        {
            title: "Control de Caja y Arqueo 💵",
            subtitle: "Submenú de Administración",
            body: "<p>Haz clic en el sub-botón **Control de Caja y Arqueo** para entrar al módulo financiero de turnos y movimientos.</p>",
            target: '#nav-administracion a[onclick="cargarVista(\'gestion-caja\')"]',
            placement: "bottom"
        },
        {
            title: "Apertura de Turno y Cuadre de Caja 🪙",
            subtitle: "Arqueo Diario",
            body: "<p>¡He abierto el módulo de <strong>Caja</strong>! Aquí debes iniciar turno declarando tu **Fondo Inicial** (fondo de cambio). Durante el día verás el balance en vivo de ventas en efectivo vs transferencias, y al finalizar podrás registrar tu **Cierre de Caja** con el conteo físico de dinero.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-caja');
            }
        },
        {
            title: "Paso 2: Cobros y Facturación 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Cuando un cliente se acerque a pagar sus compras, dirígete al menú superior **Servicios**.</p>",
            target: "#nav-servicios",
            placement: "bottom"
        },
        {
            title: "Punto de Venta POS 💰",
            subtitle: "Submenú de Servicios",
            body: "<p>Haz clic en el sub-botón **Generar Venta** para ingresar al punto de cobro y emitir facturas.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-ventas\')"]',
            placement: "bottom"
        },
        {
            title: "Cobro y Facturación Rápida 💳",
            subtitle: "Punto de Venta POS",
            body: "<p>En esta pantalla agregas los artículos del cliente, seleccionas el método de pago (Efectivo o Transferencia) y confirmas el cobro. Cada venta impactará de forma inmediata en tu turno de caja activo.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-ventas');
            }
        },
        {
            title: "Paso 3: Validar Pagos Tienda Web 🌐",
            subtitle: "Submenú de Administración",
            body: "<p>Los pedidos realizados por clientes desde la tienda en línea requieren tu verificación. Abre **Administración** y haz clic en **💳 Pagos Tienda Web**.</p>",
            target: '#nav-administracion a[onclick="cargarVista(\'gestion-pagos-web\')"]',
            placement: "bottom"
        },
        {
            title: "Aprobación de Transferencias Online 📱",
            subtitle: "Tienda en Línea",
            body: "<p>En el módulo de <strong>Pagos Web</strong> puedes inspeccionar el comprobante bancario subido por el cliente, cotejar la transacción con la cuenta bancaria y aprobar o rechazar la compra.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-pagos-web');
            }
        },
        {
            title: "Paso 4: Devoluciones y Reversiones 🔄",
            subtitle: "Submenú de Servicios",
            body: "<p>Si un cliente solicita una devolución o cambio con nota de crédito, accede a **Devoluciones** dentro del menú Servicios para procesar el reintegro.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-devoluciones\')"]',
            placement: "bottom"
        },
        {
            title: "¡Turno Listo para Operar! 🎉",
            subtitle: "Control Financiero Impecable",
            body: "<p>Has completado el tutorial de Cajero. Recuerda siempre abrir tu turno con el fondo de cambio exacto y registrar los arqueos antes de salir.</p><p>¡Mucho éxito en tus cobros!</p>",
            target: null,
            placement: "center"
        }
    ];

    // Definición de Pasos para Técnicos
    const tecnicoSteps = [
        {
            title: "¡Bienvenido al Taller Técnico! 🛠️",
            subtitle: "Mesa de Soporte, Diagnóstico y Reparaciones",
            body: "<p>Hola, soy <strong>AURUM</strong>, tu asistente de Inteligencia Artificial. Te daré un recorrido guiado por tu mesa de trabajo para que aprendas a gestionar diagnósticos, tickets de reparación, garantías y evidencias fotográficas.</p><p>¿Empezamos el recorrido?</p>",
            target: null,
            placement: "center"
        },
        {
            title: "Tu Mesa de Trabajo 📊",
            subtitle: "Panel del Taller",
            body: "<p>Este es tu panel especializado como técnico. Desde aquí tienes acceso directo a tus <strong>Tickets de Servicio</strong>, <strong>Garantías de Clientes</strong>, <strong>Consulta de Repuestos</strong> y atención a <strong>Urgencias</strong>.</p>",
            target: ".tecnico-only .dashboard-grid",
            placement: "bottom"
        },
        {
            title: "Paso 1: Módulo de Servicios 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Tus trabajos asignados y equipos en reparación se encuentran dentro del menú desplegable **Servicios** en la barra superior.</p>",
            target: "#nav-servicios",
            placement: "bottom"
        },
        {
            title: "Tickets de Soporte Técnico 🔧",
            subtitle: "Submenú de Servicios",
            body: "<p>Haz clic en el sub-botón **Servicios** para ver y gestionar la lista de equipos en taller.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-servicios\')"]',
            placement: "bottom"
        },
        {
            title: "Gestión de Servicios y Diagnósticos 🔧",
            subtitle: "Mesa de Reparaciones",
            body: "<p>¡He abierto la vista de <strong>Servicios Técnicos</strong>! Aquí visualizas los equipos asignados a tu nombre. Puedes registrar nuevos equipos con **+ Nuevo Servicio**, actualizar el estado (<em>En Diagnóstico</em>, <em>En Reparación</em>, <em>En Espera de Repuesto</em>) y añadir notas técnicas.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-servicios');
            }
        },
        {
            title: "Evidencia Fotográfica Obligatoria 📸",
            subtitle: "Garantía de Calidad Compunic",
            body: "<p>⚠️ <strong>Regla de calidad:</strong> Al finalizar un trabajo y cambiar su estado a <strong>Realizada</strong>, el sistema te solicitará obligatoriamente adjuntar la <strong>foto de evidencia</strong> (JPG o PNG) del equipo funcionando antes de que el cliente pueda retirarlo.</p>",
            target: "#content",
            placement: "top"
        },
        {
            title: "Paso 2: Garantías de Clientes 🛡️",
            subtitle: "Submenú de Servicios",
            body: "<p>Para validar si un equipo con fallas califica para reparación o sustitución bajo garantía de fábrica, abre el menú **Servicios** y selecciona **Garantías**.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-garantias\')"]',
            placement: "bottom"
        },
        {
            title: "Pólizas y Reclamos de Garantía 🛡️",
            subtitle: "Inspección de Hardware",
            body: "<p>En el módulo de <strong>Garantías</strong> puedes comprobar la cobertura de un producto mediante su factura o serie, y vincular la póliza al ticket de reparación para que se procese con descuento o sin costo.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-garantias');
            }
        },
        {
            title: "Paso 3: Consulta de Repuestos 🧭",
            subtitle: "Menú Inventario",
            body: "<p>Como técnico tienes acceso a consultar el stock disponible de piezas y componentes. Abre el menú **Inventario** en la barra superior.</p>",
            target: "#nav-inventario",
            placement: "bottom"
        },
        {
            title: "Historial y Trazabilidad de Stock 📦",
            subtitle: "Submenú de Inventario",
            body: "<p>Haz clic en el sub-botón **Historial de stock** para revisar la existencia y movimientos de repuestos y componentes.</p>",
            target: '#nav-inventario a[onclick="cargarVista(\'historial-stock\')"]',
            placement: "bottom"
        },
        {
            title: "Disponibilidad de Componentes 🔍",
            subtitle: "Control de Repuestos",
            body: "<p>En el <strong>Historial de Stock</strong> puedes verificar existencias de pantallas, memorias, fuentes o accesorios antes de comprometerte con un plazo de entrega con el cliente.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('historial-stock');
            }
        },
        {
            title: "¡Taller Operativo! 🎉",
            subtitle: "Soporte Técnico de Primera",
            body: "<p>Has finalizado el tutorial de Técnico. Ya cuentas con todas las herramientas para recibir equipos, registrar diagnósticos, subir evidencias y dar el mejor servicio.</p><p>¡Mucho éxito en el taller!</p>",
            target: null,
            placement: "center"
        }
    ];

    // Definición de Pasos para Personal Temporal (Técnicos Temporales)
    const temporalSteps = [
        {
            title: "¡Bienvenido Técnico Temporal! 🛠️⏱️",
            subtitle: "Mesa de Soporte, Diagnóstico y Taller",
            body: "<p>Hola, soy <strong>AURUM</strong>, tu asistente de Inteligencia Artificial. Te daré un recorrido guiado por tu mesa de trabajo de taller técnico para que aprendas a gestionar diagnósticos, tickets de reparación, garantías y evidencias fotográficas.</p><p>¿Empezamos el recorrido?</p>",
            target: null,
            placement: "center"
        },
        {
            title: "Tu Mesa de Taller 📊",
            subtitle: "Panel de Reparaciones",
            body: "<p>Este es tu panel técnico de soporte. Desde aquí tienes acceso directo a tus <strong>Tickets Asignados</strong>, <strong>Garantías de Clientes</strong>, <strong>Consulta de Repuestos</strong> y <strong>Urgencias</strong>.</p>",
            target: ".temporal-only .dashboard-grid",
            placement: "bottom"
        },
        {
            title: "Paso 1: Módulo de Servicios 🧭",
            subtitle: "Menú de Navegación",
            body: "<p>Tus trabajos técnicos asignados y equipos en reparación se encuentran dentro del menú desplegable **Servicios** en la barra superior.</p>",
            target: "#nav-servicios",
            placement: "bottom"
        },
        {
            title: "Tickets de Soporte Técnico 🔧",
            subtitle: "Submenú de Servicios",
            body: "<p>Haz clic en el sub-botón **Servicios** para ver y gestionar la lista de equipos en taller.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-servicios\')"]',
            placement: "bottom"
        },
        {
            title: "Gestión de Servicios y Diagnósticos 🔧",
            subtitle: "Mesa de Reparaciones",
            body: "<p>¡He abierto la vista de <strong>Servicios Técnicos</strong>! Aquí visualizas los equipos asignados a tu nombre. Puedes registrar nuevos equipos con **+ Nuevo Servicio**, actualizar el estado (<em>En Diagnóstico</em>, <em>En Reparación</em>, <em>En Espera de Repuesto</em>) y documentar notas técnicas.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-servicios');
            }
        },
        {
            title: "Evidencia Fotográfica Obligatoria 📸",
            subtitle: "Garantía de Calidad Compunic",
            body: "<p>⚠️ <strong>Regla de calidad:</strong> Al finalizar un trabajo y cambiar su estado a <strong>Realizada</strong>, el sistema te solicitará obligatoriamente adjuntar la <strong>foto de evidencia</strong> (JPG o PNG) del equipo funcionando antes de que pueda ser entregado al cliente.</p>",
            target: "#content",
            placement: "top"
        },
        {
            title: "Paso 2: Garantías y Tipos de Cobertura 🛡️",
            subtitle: "Submenú de Servicios",
            body: "<p>Para validar si un equipo califica para reparación o sustitución, abre el menú **Servicios** y selecciona **Garantías**.</p>",
            target: '#nav-servicios a[onclick="cargarVista(\'gestion-garantias\')"]',
            placement: "bottom"
        },
        {
            title: "Pólizas y Tipos de Garantías 🛡️",
            subtitle: "Inspección de Coberturas",
            body: "<p>En Compunic manejamos 6 tipos de garantías: <strong>Estándar</strong> (12 meses), <strong>Extendida</strong>, <strong>Fabricante</strong>, <strong>Limitada</strong>, <strong>Nula</strong> y <strong>Premium</strong>. Puedes consultar el detalle de cada tipo pulsando el botón <em>'Ver Tipos de Garantías'</em>.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-garantias');
            }
        },
        {
            title: "Paso 3: Catálogo de Inventario y Repuestos 📦",
            subtitle: "Menú Inventario",
            body: "<p>Para consultar repuestos, piezas y componentes disponibles en almacén, abre el menú **Inventario** en la barra superior.</p>",
            target: "#nav-inventario",
            placement: "bottom"
        },
        {
            title: "Catálogo de Productos 🔍",
            subtitle: "Submenú de Inventario",
            body: "<p>Haz clic en **Productos** para explorar el catálogo completo de componentes y refacciones antes de asignar una reparación.</p>",
            target: '#nav-inventario a[onclick="cargarVista(\'gestion-productos\')"]',
            placement: "bottom"
        },
        {
            title: "Disponibilidad de Piezas y Componentes 💻",
            subtitle: "Catálogo en Tiempo Real",
            body: "<p>En el <strong>Catálogo de Productos</strong> puedes verificar stock, precios y especificaciones de componentes para cualquier trabajo del taller.</p>",
            target: "#content",
            placement: "top",
            action: () => {
                window.cargarVista('gestion-productos');
            }
        },
        {
            title: "¡Taller Operativo! 🎉",
            subtitle: "Soporte Técnico Especializado",
            body: "<p>Has finalizado tu inducción de Técnico Temporal. Ya cuentas con tus credenciales activas y todas las herramientas para diagnosticar, reparar y brindar el mejor servicio técnico.</p><p>¡Mucho éxito en el taller!</p>",
            target: null,
            placement: "center"
        }
    ];
    function waitForElement(selector, callback, maxTries = 20) {
        let tries = 0;
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            tries++;
            if (el && el.getBoundingClientRect().width > 0) {
                clearInterval(interval);
                callback(el);
            } else if (tries >= maxTries) {
                clearInterval(interval);
                // Si falla el selector específico por retardo de render, apuntar al contenedor principal
                const fallback = document.getElementById('content');
                if (fallback) callback(fallback);
            }
        }, 100);
    }

    // Inicializar el DOM necesario para el tutorial
    function initDOM() {
        if (document.getElementById('aurum-tutorial-container')) return;

        const container = document.createElement('div');
        container.id = 'aurum-tutorial-container';

        // 1. Backdrop
        backdropEl = document.createElement('div');
        backdropEl.className = 'aurum-tutorial-backdrop';
        container.appendChild(backdropEl);

        // 2. Blocker de clics
        blockerEl = document.createElement('div');
        blockerEl.className = 'aurum-tutorial-blocker';
        container.appendChild(blockerEl);

        // 3. Botón flotante global "Saltar" siempre activo en todo momento
        globalSkipEl = document.createElement('button');
        globalSkipEl.className = 'aurum-tutorial-global-skip';
        globalSkipEl.id = 'tut-global-skip';
        globalSkipEl.innerHTML = 'Saltar Tutorial <i class="fas fa-times"></i>';
        globalSkipEl.onclick = () => AurumTutorial.skip();
        container.appendChild(globalSkipEl);

        // 4. Popover
        popoverEl = document.createElement('div');
        popoverEl.className = 'aurum-tutorial-popover';
        popoverEl.innerHTML = `
            <div class="aurum-tutorial-arrow"></div>
            <div class="aurum-tutorial-header">
                <div class="aurum-tutorial-avatar">🧠</div>
                <div class="aurum-tutorial-title-area">
                    <h3 class="aurum-tutorial-title" id="tut-title"></h3>
                    <span class="aurum-tutorial-subtitle" id="tut-subtitle"></span>
                </div>
                <button class="aurum-tutorial-close-btn" id="tut-close-x" title="Saltar tutorial">✕</button>
            </div>
            <div class="aurum-tutorial-body" id="tut-body"></div>
            <div class="aurum-tutorial-progress-container">
                <div class="aurum-tutorial-progress-bar">
                    <div class="aurum-tutorial-progress-fill" id="tut-progress-fill"></div>
                </div>
                <span class="aurum-tutorial-step-text" id="tut-step-text"></span>
            </div>
            <div class="aurum-tutorial-footer">
                <button class="aurum-tutorial-btn aurum-tutorial-btn-skip" id="tut-btn-skip">Saltar</button>
                <div style="display: flex; gap: 8px;">
                    <button class="aurum-tutorial-btn aurum-tutorial-btn-prev" id="tut-btn-prev">
                        <i class="fas fa-arrow-left"></i> Atrás
                    </button>
                    <button class="aurum-tutorial-btn aurum-tutorial-btn-next" id="tut-btn-next">
                        Siguiente <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(popoverEl);
        document.body.appendChild(container);

        // Eventos de botones
        document.getElementById('tut-close-x').onclick = () => AurumTutorial.skip();
        document.getElementById('tut-btn-skip').onclick = () => AurumTutorial.skip();
        document.getElementById('tut-btn-prev').onclick = () => AurumTutorial.prev();
        document.getElementById('tut-btn-next').onclick = () => AurumTutorial.next();
    }

    // Limpiar clases de resalte activas
    function clearFocus() {
        document.querySelectorAll('.aurum-tutorial-focus').forEach(el => {
            el.classList.remove('aurum-tutorial-focus');
        });
        document.querySelectorAll('.aurum-force-dropdown-open').forEach(el => {
            el.classList.remove('aurum-force-dropdown-open');
        });
    }

    // Posicionamiento dinámico del popover (Corregido para Fixed, sin sumar scrollY/scrollX)
    function positionPopover(targetEl, placement) {
        if (!popoverEl) return;

        if (!targetEl || placement === 'center') {
            popoverEl.classList.add('modal-center');
            popoverEl.style.top = '';
            popoverEl.style.left = '';
            popoverEl.setAttribute('data-placement', '');
            return;
        }

        popoverEl.classList.remove('modal-center');

        const targetRect = targetEl.getBoundingClientRect();
        // Usar offsetWidth/offsetHeight para evitar transformaciones CSS transitorias
        const popoverWidth = popoverEl.offsetWidth || 380;
        const popoverHeight = popoverEl.offsetHeight || 230;
        const margin = 15;

        // Si la pantalla es muy pequeña, forzar centrado como modal
        if (window.innerWidth < 600) {
            popoverEl.classList.add('modal-center');
            popoverEl.style.top = '';
            popoverEl.style.left = '';
            popoverEl.setAttribute('data-placement', '');
            return;
        }

        let top = 0;
        let left = 0;

        if (placement === 'bottom') {
            top = targetRect.bottom + margin;
            left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'top') {
            top = targetRect.top - popoverHeight - margin;
            left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'left') {
            top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
            left = targetRect.left - popoverWidth - margin;
        } else if (placement === 'right') {
            top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
            left = targetRect.right + margin;
        }

        // Límites de pantalla para evitar desbordes en el viewport
        if (left < 10) left = 10;
        if (left + popoverWidth > window.innerWidth - 10) {
            left = window.innerWidth - popoverWidth - 10;
        }
        if (top < 10) top = 10;
        if (top + popoverHeight > window.innerHeight - 10) {
            top = window.innerHeight - popoverHeight - 10;
        }

        popoverEl.style.top = `${top}px`;
        popoverEl.style.left = `${left}px`;
        popoverEl.setAttribute('data-placement', placement);
    }

    // Renderizar el paso actual en pantalla
    function renderStep() {
        clearFocus();
        if (currentStepIndex < 0 || currentStepIndex >= activeSteps.length) {
            AurumTutorial.finish();
            return;
        }

        const step = activeSteps[currentStepIndex];

        // Ejecutar acción del paso (ej: cambiar de vista sin recargar la página entera)
        if (typeof step.action === 'function') {
            step.action();
        }

        // Llenar contenido
        document.getElementById('tut-title').innerText = step.title;
        document.getElementById('tut-subtitle').innerText = step.subtitle;
        document.getElementById('tut-body').innerHTML = step.body;

        // Configurar botones de navegación
        const btnPrev = document.getElementById('tut-btn-prev');
        const btnNext = document.getElementById('tut-btn-next');

        btnPrev.style.display = currentStepIndex === 0 ? 'none' : 'flex';
        
        if (currentStepIndex === activeSteps.length - 1) {
            btnNext.innerHTML = 'Finalizar <i class="fas fa-check-circle"></i>';
            btnNext.className = 'aurum-tutorial-btn aurum-tutorial-btn-next';
            btnNext.style.background = 'var(--success-500, #10b981)';
        } else {
            btnNext.innerHTML = 'Siguiente <i class="fas fa-arrow-right"></i>';
            btnNext.className = 'aurum-tutorial-btn aurum-tutorial-btn-next';
            btnNext.style.background = 'var(--primary-500, #388acb)';
        }

        // Progreso
        const progressPercentage = ((currentStepIndex + 1) / activeSteps.length) * 100;
        document.getElementById('tut-progress-fill').style.width = `${progressPercentage}%`;
        document.getElementById('tut-step-text').innerText = `${currentStepIndex + 1} de ${activeSteps.length}`;

        // Resaltar elemento objetivo
        if (step.target) {
            backdropEl.classList.remove('active'); // Ocultar el backdrop central difuso
            
            // Esperar que cargue el elemento y posicionar
            waitForElement(step.target, (targetEl) => {
                targetEl.classList.add('aurum-tutorial-focus');
                
                // Si el elemento está dentro de un dropdown del menú, forzar su visibilidad
                const dropdownParent = targetEl.closest('.nav-item-dropdown');
                if (dropdownParent) {
                    dropdownParent.classList.add('aurum-force-dropdown-open');
                }
                
                // Mostrar y posicionar el Popover
                popoverEl.classList.add('active');
                positionPopover(targetEl, step.placement);

                // Forzar scroll suave para centrar visualmente el elemento
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        } else {
            // Pasos sin objetivo (introducción / cierre) se comportan como modals centrados
            backdropEl.classList.add('active');
            popoverEl.classList.add('active');
            positionPopover(null, 'center');
        }
    }

    // API Global de AurumTutorial
    window.AurumTutorial = {
        /**
         * Inicia el tutorial interactivo de AURUM
         * @param {boolean} autoLaunch - true si es disparado automáticamente en la carga inicial
         */
        start: function (autoLaunch = false) {
            const role = Auth.getRole();
            const user = Auth.getUser();

            if (!role || !user) {
                console.warn('[AurumTutorial] No hay sesión activa para iniciar el tutorial.');
                return;
            }

            // Evitar inicio automático si ya fue completado
            if (autoLaunch && localStorage.getItem(STORAGE_KEY + '_' + user) === 'completed') {
                return;
            }

            // Si no estamos en el Dashboard de inicio, redirigir recargando la página una única vez.
            const isOnDashboard = document.querySelector('.dashboard-grid') !== null;
            if (!isOnDashboard) {
                sessionStorage.setItem('aurum_tutorial_start_on_load', 'true');
                console.log('[AurumTutorial] Redirigiendo al inicio para comenzar el tutorial...');
                window.location.reload();
                return;
            }

            console.log(`✨ [AurumTutorial] Iniciando tutorial para el rol: ${role}`);

            // Seleccionar pasos correspondientes según el rol
            const roleNorm = (role || '').toLowerCase();
            if (roleNorm === 'admin') {
                activeSteps = adminSteps;
            } else if (roleNorm === 'cajero') {
                activeSteps = cajeroSteps;
            } else if (roleNorm === 'tecnico') {
                activeSteps = tecnicoSteps;
            } else if (roleNorm === 'temporal') {
                activeSteps = temporalSteps;
            } else {
                activeSteps = vendorSteps;
            }
            currentStepIndex = 0;

            // Inicializar elementos de UI
            initDOM();

            // Activar clase tutorial en el body
            document.body.classList.add('aurum-tutorial-active');

            // Registrar manejador de resize/scroll para re-posicionar
            if (!resizeAndScrollHandler) {
                resizeAndScrollHandler = () => {
                    if (currentStepIndex >= 0 && currentStepIndex < activeSteps.length) {
                        const step = activeSteps[currentStepIndex];
                        if (step.target) {
                            const targetEl = document.querySelector(step.target);
                            positionPopover(targetEl, step.placement);
                        } else {
                            positionPopover(null, 'center');
                        }
                    }
                };
                window.addEventListener('resize', resizeAndScrollHandler);
                window.addEventListener('scroll', resizeAndScrollHandler);
            }

            // Renderizar paso 1
            renderStep();
        },

        next: function () {
            if (currentStepIndex < activeSteps.length - 1) {
                currentStepIndex++;
                renderStep();
            } else {
                this.finish();
            }
        },

        prev: function () {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                renderStep();
            }
        },

        skip: async function () {
            const ok = typeof Alerta !== 'undefined'
                ? await Alerta.confirmar('¿Deseas saltar el tutorial? Puedes volver a iniciarlo en cualquier momento con el botón ✨ Guía Aurum.', { titulo: 'Saltar Guía', confirmText: 'Sí, saltar', cancelText: 'Continuar guía', peligroso: false, icono: 'question' })
                : confirm('¿Deseas saltar el tutorial? Puedes volver a iniciarlo en cualquier momento con el botón ✨ Guía Aurum.');
            if (ok) {
                this.finish();
            }
        },

        finish: function () {
            console.log('✨ [AurumTutorial] Finalizando y guardando preferencia.');
            
            const user = Auth.getUser();
            if (user) {
                localStorage.setItem(STORAGE_KEY + '_' + user, 'completed');
            }

            this.cleanup();

            // Recargar para volver al dashboard en estado limpio e inicial
            console.log('[AurumTutorial] Recargando dashboard finalizado...');
            window.location.reload();
        },

        cleanup: function () {
            clearFocus();
            document.body.classList.remove('aurum-tutorial-active');

            if (popoverEl) popoverEl.classList.remove('active');
            if (backdropEl) backdropEl.classList.remove('active');

            // Desvincular eventos
            if (resizeAndScrollHandler) {
                window.removeEventListener('resize', resizeAndScrollHandler);
                window.removeEventListener('scroll', resizeAndScrollHandler);
                resizeAndScrollHandler = null;
            }

            // Remover del DOM
            const container = document.getElementById('aurum-tutorial-container');
            if (container) {
                container.remove();
            }

            backdropEl = null;
            blockerEl = null;
            popoverEl = null;
            globalSkipEl = null;
        }
    };
})();
