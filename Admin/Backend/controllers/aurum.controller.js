/**
 * @file aurum.controller.js
 * @description Controlador de AURUM — Maneja las peticiones del chatbot IA.
 * Solo accesible para administradores.
 */

const aurumService = require('../services/aurum.service');

// GET /api/aurum/status — Verificar estado del servicio
exports.getStatus = (req, res) => {
    const status = aurumService.getStatus();
    res.json({
        success: true,
        aurum: status
    });
};

// POST /api/aurum/chat — Chat interactivo con AURUM
exports.chat = async (req, res) => {
    try {
        const { mensaje, historial } = req.body;

        if (!mensaje || mensaje.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El mensaje no puede estar vacío.'
            });
        }

        const status = aurumService.getStatus();
        if (!status.disponible) {
            return res.status(503).json({
                success: false,
                error: 'El servicio de Inteligencia Artificial (AURUM) no está disponible en este momento. Verifica la API Key de Gemini en el archivo .env.'
            });
        }

        console.log(`[AURUM Chat] Procesando mensaje: "${mensaje.substring(0, 50)}..."`);

        const resultado = await aurumService.chatConAurum(mensaje, historial || []);

        res.json({
            success: true,
            respuesta: resultado.respuesta,
            nuevoHistorial: resultado.historial
        });

    } catch (error) {
        console.error('[AURUM Chat] Error:', error.message || error);

        // Manejo de límites de cuota (Free Tier de Gemini)
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({
                success: false,
                error: 'He procesado demasiadas consultas en este minuto. ¡Vuelve a intentarlo en un momento!',
                detalle: error.message
            });
        }

        if (error.message === 'AURUM_NO_DISPONIBLE') {
            return res.status(503).json({
                success: false,
                error: 'AURUM no está configurado. Agrega GEMINI_API_KEY al archivo .env del servidor.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Hubo un error interno al procesar tu consulta con AURUM.',
            detalle: error.message
        });
    }
};

// POST /api/aurum/analizar — Análisis automático de datos
exports.analizar = async (req, res) => {
    try {
        const { tipoNegocio, datosCrudos } = req.body;

        if (!tipoNegocio || !datosCrudos) {
            return res.status(400).json({
                error: 'Faltan parámetros: tipoNegocio y datosCrudos son requeridos.'
            });
        }

        const reporte = await aurumService.analizarDatos(tipoNegocio, datosCrudos);

        res.json({
            success: true,
            reporte
        });

    } catch (error) {
        console.error('[AURUM Análisis] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al generar el análisis con AURUM.',
            detalle: error.message
        });
    }
};
