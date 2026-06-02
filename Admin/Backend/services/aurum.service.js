/**
 * @file aurum.service.js
 * @description AURUM IA Service — Motor de Inteligencia Artificial del sistema Compunic_.
 * Configura Gemini con Function Calling para consultar datos reales de MySQL.
 */

const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const db = require('../config/db');

// --- CONFIGURACIÓN DE GEMINI ---
let genAI = null;
let activeModelName = null;

const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
].filter(Boolean);

/**
 * Inicializa la conexión con Gemini AI.
 * Intenta múltiples modelos en orden de preferencia.
 */
function inicializarGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PON_AQUI_TU_API_KEY') {
        console.warn('⚠️ [AURUM] Falta GEMINI_API_KEY en el archivo .env');
        return;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        for (const candidate of CANDIDATE_MODELS) {
            try {
                genAI.getGenerativeModel({ model: candidate });
                activeModelName = candidate;
                console.log(`🤖 [AURUM] Gemini configurado (modelo activo: ${candidate})`);
                break;
            } catch (mErr) {
                console.warn(`⚠️ [AURUM] Modelo ${candidate} no disponible.`);
            }
        }
        if (!activeModelName) {
            console.warn('⚠️ [AURUM] No se pudo inicializar ningún modelo generativo.');
        }
    } catch (e) {
        console.warn('⚠️ [AURUM] Error al conectar con Gemini:', e.message);
    }
}

// --- DEFINICIÓN DE HERRAMIENTAS (Function Calling) ---
const aurumTools = [
    {
        functionDeclarations: [
            {
                name: "obtener_resumen_dashboard",
                description: "Obtiene los KPIs principales del negocio: ingresos del mes, número de ventas, servicios pendientes, stock crítico y clientes totales. Úsala siempre que pregunten por un resumen general, estado del negocio o dashboard.",
            },
            {
                name: "obtener_ventas_hoy",
                description: "Obtiene las ventas realizadas hoy con detalle de cliente, vendedor y monto total.",
            },
            {
                name: "obtener_productos_mas_vendidos",
                description: "Obtiene el ranking de los 10 productos más vendidos de todos los tiempos con cantidades e ingresos generados.",
            },
            {
                name: "consultar_catalogo_productos",
                description: "Consulta el catálogo completo de productos con nombre, modelo, precio de venta, precio de compra, marca, categoría y stock actual. Úsala cuando pregunten por productos, precios, stock de un artículo específico o el inventario completo.",
            },
            {
                name: "obtener_stock_critico",
                description: "Obtiene los productos que tienen stock igual o menor a 5 unidades y requieren reabastecimiento urgente.",
            },
            {
                name: "obtener_ventas_periodo",
                description: "Genera un reporte de ventas dentro de un rango de fechas. Úsala cuando pregunten por ventas en un mes, año o periodo específico.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        desde: {
                            type: SchemaType.STRING,
                            description: "Fecha de inicio en formato YYYY-MM-DD",
                        },
                        hasta: {
                            type: SchemaType.STRING,
                            description: "Fecha de fin en formato YYYY-MM-DD",
                        },
                    },
                    required: ["desde", "hasta"],
                },
            },
            {
                name: "obtener_top_clientes",
                description: "Obtiene el ranking de los mejores clientes por número de compras y monto total gastado.",
            },
            {
                name: "obtener_servicios_pendientes",
                description: "Obtiene la lista de servicios técnicos pendientes (en diagnóstico, en reparación, esperando repuestos, etc.).",
            },
        ],
    },
];

// --- DICCIONARIO DE EJECUCIÓN (Queries directas a MySQL) ---
const functionExecutors = {
    obtener_resumen_dashboard: async () => {
        try {
            // Ingresos del mes
            const [ingresos] = await db.query(`
                SELECT 
                    COALESCE(SUM(TOTAL), 0) as total_mes,
                    COUNT(*) as num_ventas
                FROM VENTAS
                WHERE MONTH(FECHA) = MONTH(CURRENT_DATE)
                AND YEAR(FECHA) = YEAR(CURRENT_DATE)
            `);

            // Servicios pendientes
            const [servicios] = await db.query(`
                SELECT 
                    COUNT(*) as total_pendientes,
                    SUM(CASE WHEN ID_SERVICIO_ESTADO = 1 THEN 1 ELSE 0 END) as en_diagnostico
                FROM SERVICIOS
                WHERE ID_SERVICIO_ESTADO != 3
            `);

            // Stock crítico
            const [stockCritico] = await db.query(`
                SELECT COUNT(*) as total FROM (
                    SELECT p.ID_PRODUCTO,
                        COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) -
                        COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0) as stock_actual
                    FROM PRODUCTOS p
                    HAVING stock_actual <= 5 AND stock_actual >= 0
                ) AS bajo_stock
            `);

            // Total clientes
            const [clientes] = await db.query(`SELECT COUNT(*) as total FROM CLIENTES`);

            return {
                ingresos_mes: parseFloat(ingresos[0].total_mes || 0),
                ventas_mes: ingresos[0].num_ventas || 0,
                servicios_pendientes: servicios[0].total_pendientes || 0,
                servicios_en_diagnostico: servicios[0].en_diagnostico || 0,
                productos_stock_critico: stockCritico[0].total || 0,
                total_clientes: clientes[0].total || 0
            };
        } catch (err) {
            return { error: `Error al obtener resumen: ${err.message}` };
        }
    },

    obtener_ventas_hoy: async () => {
        try {
            const [ventas] = await db.query(`
                SELECT 
                    v.ID_VENTA,
                    v.FACTURA,
                    v.FECHA,
                    v.TOTAL,
                    CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS cliente,
                    CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS vendedor
                FROM VENTAS v
                INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
                WHERE DATE(v.FECHA) = CURDATE()
                ORDER BY v.ID_VENTA DESC
            `);

            const totalHoy = ventas.reduce((sum, v) => sum + parseFloat(v.TOTAL || 0), 0);

            return {
                cantidad_ventas: ventas.length,
                total_ingresos_hoy: totalHoy,
                detalle: ventas.map(v => ({
                    factura: v.FACTURA,
                    cliente: v.cliente,
                    vendedor: v.vendedor,
                    total: parseFloat(v.TOTAL)
                }))
            };
        } catch (err) {
            return { error: `Error al obtener ventas de hoy: ${err.message}` };
        }
    },

    obtener_productos_mas_vendidos: async () => {
        try {
            const [productos] = await db.query(`
                SELECT 
                    p.NOMBRE_PRODUCTO as nombre,
                    p.MODELO as modelo,
                    SUM(vp.cantidad_neta) as total_vendido,
                    COALESCE(SUM(vp.sub_total), 0) as ingresos_generados
                FROM VENTAS_PRODUCTOS vp
                INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
                GROUP BY p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.MODELO
                ORDER BY total_vendido DESC
                LIMIT 10
            `);
            return productos;
        } catch (err) {
            return { error: `Error al obtener productos más vendidos: ${err.message}` };
        }
    },

    consultar_catalogo_productos: async () => {
        try {
            const [productos] = await db.query(`
                SELECT 
                    p.ID_PRODUCTO as id,
                    p.NOMBRE_PRODUCTO AS nombre,
                    p.MODELO as modelo,
                    p.DESCRIPCION as descripcion,
                    p.PRECIO_COMPRA as precio_compra,
                    p.PRECIO_VENTA as precio_venta,
                    m.NOMBRE_MARCA AS marca,
                    GROUP_CONCAT(DISTINCT c.NOMBRE_CATEGORIA SEPARATOR ', ') AS categorias,
                    (
                        COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
                        COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
                    ) AS stock_actual
                FROM PRODUCTOS p
                LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
                LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
                LEFT JOIN CATEGORIAS c ON pc.ID_CATEGORIA = c.ID_CATEGORIA
                GROUP BY p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.MODELO, p.DESCRIPCION,
                         p.PRECIO_COMPRA, p.PRECIO_VENTA, m.NOMBRE_MARCA
                ORDER BY p.NOMBRE_PRODUCTO ASC
            `);
            return { total_productos: productos.length, productos };
        } catch (err) {
            return { error: `Error al consultar catálogo: ${err.message}` };
        }
    },

    obtener_stock_critico: async () => {
        try {
            const [productos] = await db.query(`
                SELECT 
                    p.ID_PRODUCTO as id,
                    p.NOMBRE_PRODUCTO as nombre,
                    p.MODELO as modelo,
                    COALESCE(
                        (SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0
                    ) - 
                    COALESCE(
                        (SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0
                    ) as stock_actual
                FROM PRODUCTOS p
                HAVING stock_actual <= 5 AND stock_actual >= 0
                ORDER BY stock_actual ASC
            `);
            return {
                total_en_riesgo: productos.length,
                productos: productos.map(p => ({
                    nombre: p.nombre,
                    modelo: p.modelo,
                    stock: p.stock_actual
                }))
            };
        } catch (err) {
            return { error: `Error al obtener stock crítico: ${err.message}` };
        }
    },

    obtener_ventas_periodo: async (args) => {
        try {
            const { desde, hasta } = args;
            const [ventas] = await db.query(`
                SELECT 
                    v.ID_VENTA,
                    v.FACTURA,
                    v.FECHA,
                    v.TOTAL,
                    CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS cliente,
                    CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS vendedor
                FROM VENTAS v
                INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
                WHERE DATE(v.FECHA) BETWEEN ? AND ?
                ORDER BY v.FECHA DESC
            `, [desde, hasta]);

            const totalPeriodo = ventas.reduce((sum, v) => sum + parseFloat(v.TOTAL || 0), 0);

            return {
                periodo: { desde, hasta },
                cantidad_ventas: ventas.length,
                total_ingresos: totalPeriodo,
                detalle: ventas.slice(0, 50).map(v => ({
                    factura: v.FACTURA,
                    fecha: v.FECHA,
                    cliente: v.cliente,
                    vendedor: v.vendedor,
                    total: parseFloat(v.TOTAL)
                }))
            };
        } catch (err) {
            return { error: `Error al obtener ventas del periodo: ${err.message}` };
        }
    },

    obtener_top_clientes: async () => {
        try {
            const [clientes] = await db.query(`
                SELECT 
                    c.NOMBRE,
                    c.APELLIDO,
                    c.TELEFONO,
                    COUNT(v.ID_VENTA) as total_compras,
                    COALESCE(SUM(v.TOTAL), 0) as monto_total
                FROM CLIENTES c
                INNER JOIN VENTAS v ON c.ID_CLIENTE = v.ID_CLIENTE
                GROUP BY c.ID_CLIENTE, c.NOMBRE, c.APELLIDO, c.TELEFONO
                ORDER BY total_compras DESC, monto_total DESC
                LIMIT 10
            `);
            return clientes.map(c => ({
                nombre: `${c.NOMBRE} ${c.APELLIDO}`,
                telefono: c.TELEFONO || 'N/A',
                compras: c.total_compras,
                monto_total: parseFloat(c.monto_total)
            }));
        } catch (err) {
            return { error: `Error al obtener top clientes: ${err.message}` };
        }
    },

    obtener_servicios_pendientes: async () => {
        try {
            const [servicios] = await db.query(`
                SELECT 
                    s.ID_SERVICIO as id,
                    s.DESCRIPCION as descripcion,
                    s.FECHA_INGRESO as fecha_ingreso,
                    CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS cliente,
                    se.ESTADO as estado
                FROM SERVICIOS s
                LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
                WHERE s.ID_SERVICIO_ESTADO != 3
                ORDER BY s.FECHA_INGRESO DESC
            `);
            return {
                total_pendientes: servicios.length,
                servicios: servicios.map(s => ({
                    id: s.id,
                    descripcion: s.descripcion,
                    cliente: s.cliente,
                    estado: s.estado,
                    fecha_ingreso: s.fecha_ingreso
                }))
            };
        } catch (err) {
            return { error: `Error al obtener servicios pendientes: ${err.message}` };
        }
    }
};

// --- FUNCIÓN PRINCIPAL: Chat con AURUM ---
async function chatConAurum(mensaje, historial = []) {
    if (!genAI || !activeModelName) {
        throw new Error('AURUM_NO_DISPONIBLE');
    }

    const model = genAI.getGenerativeModel({
        model: activeModelName,
        tools: aurumTools,
        systemInstruction: `Eres AURUM, el asistente de Inteligencia Artificial del sistema de gestión comercial Compunic. Hoy es ${new Date().toISOString().split('T')[0]}. Tu objetivo es ayudar a los administradores consultando la base de datos real del negocio.

REGLAS:
- Utiliza las herramientas (tools) disponibles para consultar datos reales de ventas, productos, stock, clientes y servicios.
- SIEMPRE usa la herramienta correspondiente antes de responder con datos numéricos. Nunca inventes cifras.
- Sé cordial, ejecutivo y preciso.
- Al mostrar listas, usa un formato visualmente limpio con viñetas o numeración.
- Formatea valores monetarios con 2 decimales y la moneda "C$" (Córdobas).
- Si te preguntan algo fuera del alcance del sistema (como clima, noticias, etc.), responde amablemente que solo puedes ayudar con temas del negocio.
- Responde en español siempre.`
    });

    const chat = model.startChat({ history: historial });

    // Enviar mensaje a Gemini
    let result = await chat.sendMessage(mensaje);
    let functionCalls = result.response.functionCalls();

    // Bucle de Function Calling (puede haber múltiples llamadas encadenadas)
    let iterations = 0;
    const MAX_ITERATIONS = 5; // Seguridad anti-loop

    while (functionCalls && iterations < MAX_ITERATIONS) {
        iterations++;
        console.log(`[AURUM] Gemini solicitó herramienta: ${functionCalls[0].name}`);

        const functionName = functionCalls[0].name;
        const functionArgs = functionCalls[0].args || {};

        const executor = functionExecutors[functionName];
        let apiResponse;

        if (executor) {
            apiResponse = await executor(functionArgs);
        } else {
            apiResponse = { error: `Herramienta "${functionName}" no encontrada.` };
        }

        // Devolver resultado de la función a Gemini
        result = await chat.sendMessage([{
            functionResponse: {
                name: functionName,
                response: { resultado: apiResponse }
            }
        }]);

        functionCalls = result.response.functionCalls();
    }

    const respuestaFinal = result.response.text();
    const nuevoHistorial = await chat.getHistory();

    return { respuesta: respuestaFinal, historial: nuevoHistorial };
}

// --- ANÁLISIS AUTOMÁTICO (Endpoint legacy) ---
const PROMPTS_BASE = {
    computadoras: `Eres AURUM, el gerente experto en finanzas y operaciones de una tienda de tecnología y computadoras (Compunic). 
Analiza los datos de ventas e inventario proporcionados.
Redacta un reporte ejecutivo de máximo 3 párrafos concisos.
Felicita al equipo por lo bueno y da áreas de oportunidad claras (ej. alertas de stock o productos más vendidos).
Usa un tono profesional y motivador.
Devuelve el reporte en formato HTML usando viñetas (<ul><li>) o negritas (<strong>) para resaltar datos clave, pero NO uses etiquetas <html>, <body> ni markdown, solo el contenido HTML directo.`,

    general: `Eres AURUM, el gerente experto en finanzas y operaciones de un negocio comercial. 
Analiza los datos de ventas e inventario proporcionados.
Redacta un reporte ejecutivo de máximo 3 párrafos concisos.
Usa un tono profesional y motivador.
Devuelve el reporte en formato HTML usando viñetas (<ul><li>) o negritas (<strong>) para resaltar datos clave, pero NO uses etiquetas <html>, <body> ni markdown, solo el contenido HTML directo.`
};

async function analizarDatos(tipoNegocio, datosCrudos) {
    if (!genAI || !activeModelName) {
        throw new Error('AURUM_NO_DISPONIBLE');
    }

    const prompt = PROMPTS_BASE[tipoNegocio] || PROMPTS_BASE.general;
    const model = genAI.getGenerativeModel({ model: activeModelName });

    const promptCompleto = `${prompt}\n\nA continuación se presentan los datos del día:\n${JSON.stringify(datosCrudos, null, 2)}`;
    const result = await model.generateContent(promptCompleto);

    return result.response.text();
}

// --- EXPORTS ---
module.exports = {
    inicializarGemini,
    chatConAurum,
    analizarDatos,
    getStatus: () => ({
        disponible: !!activeModelName,
        modelo: activeModelName || 'ninguno',
        tieneApiKey: !!process.env.GEMINI_API_KEY
    })
};
