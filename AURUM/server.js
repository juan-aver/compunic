const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../Admin/Backend/.env') });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // <-- Añadido para hacer peticiones al backend C#
const { GoogleGenerativeAI, FunctionDeclaration, SchemaType } = require('@google/generative-ai'); // <-- Añadido soporte Function Calling

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permitir que cualquier cliente se conecte
app.use(express.json()); // Poder parsear JSON en el body

// --- CONFIGURACIÓN DE LA IA (GEMINI) ---
let genAI, activeModelName;
const REQUESTED_MODEL = process.env.GEMINI_MODEL;
const CANDIDATE_MODELS = [
    REQUESTED_MODEL,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
].filter(Boolean);

if (process.env.GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        for (const candidate of CANDIDATE_MODELS) {
            try {
                // Prueba rápida de disponibilidad
                const testModel = genAI.getGenerativeModel({ model: candidate });
                activeModelName = candidate;
                console.log(`🤖 Gemini configurado exitosamente (modelo activo: ${candidate})`);
                break;
            } catch (mErr) {
                console.warn(`⚠️ Modelo ${candidate} no disponible.`);
            }
        }
        if (!activeModelName) console.warn('⚠️ No se pudo inicializar ningún modelo generativo.');
    } catch (e) {
        console.warn('⚠️ Error al conectar con Gemini:', e);
    }
} else {
    console.warn('⚠️ Falta GEMINI_API_KEY en el archivo .env');
}

// ==========================================
// 🚀 FASE 5: MODULE FUNCTION CALLING (NOXTRUM)
// ==========================================

// 1. Definir las herramientas (Lo que Gemini puede pedirle a Node que haga)
const noxtrumTools = [
    {
        functionDeclarations: [
            {
                name: "obtener_kpis_dashboard",
                description: "Obtiene los KPIs financieros y operativos del día actual en Noxtrum (Ventas totales, Tickets, Crecimiento). ¡Úsala siempre que pregunten por ventas del día!",
            },
            {
                name: "obtener_top_productos",
                description: "Obtiene la lista de los productos más vendidos del día actual.",
            },
            {
                name: "consultar_catalogo_productos",
                description: "Consulta el catálogo maestro de todos los productos del negocio. Úsala SIEMPRE que el usuario pregunte por el catálogo, menú, lista de productos, precios, stock actual de un ítem, fechas de vencimiento, o características generales de cualquier producto.",
            },
            {
                name: "obtener_top_productos_periodo",
                description: "Obtiene la lista de los productos más vendidos en un rango de fechas. Úsala siempre que pregunten por los productos más vendidos, artículos más populares o platillos favoritos en un mes, un año, o cualquier periodo distinto al día de hoy.",
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
                name: "obtener_stock_bajo",
                description: "Obtiene los productos que están por debajo de su stock mínimo en inventario y requieren reabastecimiento.",
            },
            {
                name: "obtener_auditoria",
                description: "Obtiene las acciones recientes de auditoría realizadas por los usuarios en el sistema (apertura o cierre de cajas, eliminaciones o actualizaciones rápidas).",
            },
            {
                name: "obtener_tasa_cambio",
                description: "Obtiene la tasa de cambio oficial (dólares/córdobas) configurada hoy en el sistema.",
            },
            {
                name: "obtener_ventas_periodo",
                description: "Genera un reporte de ventas y órdenes completadas dentro de un rango de fechas. Úsala siempre que el usuario pregunte por ventas en un mes específico, un año específico o cualquier periodo distinto al día de hoy.",
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
            }
        ],
    },
];

// 2. Diccionario de Ejecución (Node.js -> C# Noxtrum API)
const functionExecutors = {
    obtener_kpis_dashboard: async (token) => {
        const res = await fetch('http://localhost:5000/api/reportes/kpis-admin', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_top_productos: async (token) => {
        const res = await fetch('http://localhost:5000/api/reportes/diario', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        const data = await res.json();
        return data.productosMasVendidos; // Solo enviamos esa parte para no saturar a la IA
    },
    consultar_catalogo_productos: async (token) => {
        const res = await fetch('http://localhost:5000/api/productos', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_top_productos_periodo: async (token, args) => {
        const { desde, hasta } = args;
        const res = await fetch(`http://localhost:5000/api/reportes/top-productos?desde=${desde}&hasta=${hasta}&top=10`, { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_stock_bajo: async (token) => {
        const res = await fetch('http://localhost:5000/api/productos/stock-bajo', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_auditoria: async (token) => {
        const res = await fetch('http://localhost:5000/api/reportes/auditoria?top=15', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_tasa_cambio: async (token) => {
        const res = await fetch('http://localhost:5000/api/tasa-cambio/hoy', { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    },
    obtener_ventas_periodo: async (token, args) => {
        const { desde, hasta } = args;
        const res = await fetch(`http://localhost:5000/api/reportes/periodo?desde=${desde}&hasta=${hasta}`, { headers: { 'Authorization': token } });
        if (!res.ok) return { error: `La API de Noxtrum respondió con error: ${res.status}` };
        return await res.json();
    }
};

// 3. Nuevo Endpoint Interactivo (Chat Noxtrum)
app.post('/api/aurum/chat', async (req, res) => {
    try {
        const { mensaje, historial, tokenNoxtrum } = req.body;

        if (!tokenNoxtrum) {
            return res.status(401).json({ error: "No se proporcionó token de autenticación de Noxtrum." });
        }

        if (!activeModelName) {
            return res.status(503).json({ error: "El servicio de Inteligencia Artificial (AURUM) no está disponible en este momento." });
        }

        const model = genAI.getGenerativeModel({
            model: activeModelName,
            tools: noxtrumTools,
            systemInstruction: `Eres AURUM. Eres el asistente IA oficial del sistema de gestión comercial NOXTRUM. Hoy es ${new Date().toISOString().split('T')[0]}. Tu objetivo es ayudar a los administradores leyendo su base de datos. Utiliza las herramientas (tools) disponibles para consultar datos reales de ventas, finanzas, stock, auditoría o tasa de cambio. Si el usuario te pregunta por estos temas, SIEMPRE utiliza la herramienta correspondiente para obtener el dato matemático exacto antes de responder. Nunca inventes números ni acciones. Sé cordial, ejecutivo y muy preciso. Al mostrar listas, usa un formato visualmente limpio, separando cada elemento en un nuevo renglón. Nota crucial: Si el usuario pregunta por fechas de vencimiento, TIENES la capacidad de ver la propiedad 'FechaVencimiento' en el catálogo de productos y debes ordenar la lista tú mismo analizando esas fechas para decirle cuáles caducan primero o si ya caducaron.`
        });

        const chat = model.startChat({
            history: historial || []
        });

        // Enviar el mensaje del usuario a Gemini
        let result = await chat.sendMessage(mensaje);
        let responsecall = result.response.functionCalls();

        // 4. Bucle de interceptación (Si Gemini pide llamar a una función)
        if (responsecall) {
            console.log(`[AURUM ToolCalling] Gemini solicitó usar la herramienta: ${responsecall[0].name}`);

            const functionName = responsecall[0].name;
            const functionArgs = responsecall[0].args; // Argumentos dinámicos
            const apiResponse = await functionExecutors[functionName](`Bearer ${tokenNoxtrum}`, functionArgs); // Llamamos al backend C# real

            // Devolvemos el JSON de la base de datos de vuelta a Gemini para que termine de redactar
            result = await chat.sendMessage([{
                functionResponse: {
                    name: functionName,
                    response: { resultado: apiResponse }
                }
            }]);
        }

        // Respuesta final de texto
        const finalAnswer = result.response.text();

        res.json({
            success: true,
            respuesta: finalAnswer,
            nuevoHistorial: await chat.getHistory()
        });

    } catch (error) {
        console.error('[AURUM Chat] Error:', error.message || error);

        // Manejo específico para límites de cuota de Gemini (Free Tier)
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({
                success: false,
                error: 'He procesado demasiadas consultas en este minuto y necesito "respirar" unos segundos. ¡Vuelve a intentarlo en un momento!',
                detalle: error.message
            });
        }

        res.status(500).json({ success: false, error: 'Hubo un error en Node con Gemini', detalle: error.message });
    }
});


// ==========================================
// ENDPOINTS DEL PROTOTIPO ANTERIOR (Fases 1-4)
// ==========================================

// Prompts base (La Personalidad de AURUM según el negocio)
const PROMPTS_BASE = {
    restaurante: `Eres AURUM, el gerente experto en finanzas y operaciones de un restaurante. 
Analiza los datos de ventas e inventario proporcionados.
Redacta un reporte ejecutivo de máximo 3 párrafos concisos.
Felicita al equipo por lo bueno y da áreas de oportunidad claras (ej. alertas de stock o platillos más vendidos).
Usa un tono elegante, profesional y motivador.
Devuelve el reporte en formato HTML usando viñetas (<ul><li>) o negritas (<strong>) para resaltar datos clave, pero NO uses etiquetas <html>, <body> ni markdown (\`\`\`), solo el contenido HTML directo.`,

    farmacia: `Eres AURUM, el gerente experto de una farmacia. 
Analiza los datos de ventas e inventario de medicamentos proporcionados.
Redacta un reporte ejecutivo de máximo 3 párrafos concisos.
Presta especial atención a los vencimientos de medicamentos y los productos más demandados. Da recomendaciones de abastecimiento.
Usa un tono riguroso, profesional y enfocado en la salud y el negocio.
Devuelve el reporte en formato HTML usando viñetas (<ul><li>) o negritas (<strong>) para resaltar datos clave, pero NO uses etiquetas <html>, <body> ni markdown (\`\`\`), solo el contenido HTML directo.`
};

// Endpoint Central de AURUM
app.post('/api/aurum/analizar', async (req, res) => {
    try {
        const { tipoNegocio, datosCrudos } = req.body;

        if (!tipoNegocio || !datosCrudos) {
            return res.status(400).json({ error: 'Faltan parámetros: tipoNegocio y datosCrudos son requeridos.' });
        }

        if (!PROMPTS_BASE[tipoNegocio]) {
            return res.status(400).json({ error: `Tipo de negocio no soportado. Opciones válidas: ${Object.keys(PROMPTS_BASE).join(', ')}` });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PON_AQUI_TU_API_KEY') {
            return res.status(500).json({ error: 'La API Key de Gemini no está configurada en el servidor (archivo .env).' });
        }

        console.log(`[AURUM Core] Recibiendo petición de la sucursal: ${tipoNegocio}`);

        if (!activeModelName) {
            return res.status(503).json({ error: "El servicio de Inteligencia Artificial (AURUM) no está disponible en este momento." });
        }

        // 1. Obtener el modelo
        const model = genAI.getGenerativeModel({ model: activeModelName });

        // 2. Construir el Prompt Final (Personalidad + Datos)
        const promptCompleto = `
      ${PROMPTS_BASE[tipoNegocio]}

      A continuación se presentan los datos del día:
      ${JSON.stringify(datosCrudos, null, 2)}
    `;

        // 3. Consultar a Gemini
        const result = await model.generateContent(promptCompleto);
        const responseText = result.response.text();

        console.log(`[AURUM Core] Análisis completado exitosamente para ${tipoNegocio}`);

        // 4. Responder al cliente
        res.json({
            success: true,
            reporte: responseText
        });

    } catch (error) {
        console.error('[AURUM Core] Error:', error);
        res.status(500).json({ success: false, error: 'Hubo un error al procesar el análisis con AURUM.', detalle: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`====================================`);
    console.log(`✨ AURUM Core Server Iniciado      `);
    console.log(`📡 Escuchando en el puerto ${PORT}  `);
    console.log(`====================================`);
});
