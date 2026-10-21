/**
 * @file divisas.controller.js
 * @description Controlador para endpoints de conversión de divisas.
 */

const DivisasService = require('../services/divisas.service');

const DivisasController = {
    /**
     * GET /api/divisas/tasa
     * Devuelve la tasa de cambio vigente USD -> NIO
     */
    async getTasa(req, res) {
        try {
            const data = await DivisasService.getTasaCambio();
            return res.json({
                success: true,
                ...data
            });
        } catch (error) {
            console.error('Error al obtener tasa de cambio:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al consultar la tasa de cambio'
            });
        }
    },

    /**
     * POST /api/divisas/convertir
     * Convierte un monto de NIO a USD o viceversa
     * Body: { monto: 1000, de: 'NIO', a: 'USD' }
     */
    async convertir(req, res) {
        try {
            const { monto, de = 'NIO', a = 'USD' } = req.body;
            if (monto === undefined || monto === null || isNaN(parseFloat(monto))) {
                return res.status(400).json({
                    success: false,
                    error: 'El campo "monto" es obligatorio y debe ser numérico.'
                });
            }

            const resultado = await DivisasService.convertir(monto, de, a);
            return res.json({
                success: true,
                ...resultado
            });
        } catch (error) {
            console.error('Error al convertir divisas:', error);
            return res.status(400).json({
                success: false,
                error: error.message || 'Error en la conversión de divisas'
            });
        }
    },

    /**
     * PUT /api/divisas/tasa
     * Actualiza manualmente la tasa de cambio
     * Body: { tasa: 36.65 }
     */
    async setTasa(req, res) {
        try {
            const { tasa } = req.body;
            if (!tasa || isNaN(parseFloat(tasa)) || parseFloat(tasa) <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe ingresar una tasa válida mayor a 0.'
                });
            }

            const nuevaTasa = DivisasService.setTasaManual(tasa);
            return res.json({
                success: true,
                mensaje: 'Tasa de cambio actualizada con éxito.',
                ...nuevaTasa
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = DivisasController;
