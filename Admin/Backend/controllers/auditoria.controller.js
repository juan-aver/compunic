const AuditoriaModel = require('../models/auditoria.model');

const AuditoriaController = {
    async listar(req, res) {
        try {
            const { usuario, tabla, accion, desde, hasta, limite, top } = req.query;
            const limitVal = limite || top;
            const auditorias = await AuditoriaModel.obtenerTodas({
                usuario,
                tabla,
                accion,
                desde,
                hasta,
                limite: limitVal ? parseInt(limitVal) : 100
            });
            res.json(auditorias);
        } catch (error) {
            console.error('❌ Error en AuditoriaController.listar:', error);
            res.status(500).json({ error: 'Error al obtener registros de auditoría' });
        }
    },

    async obtenerKpis(req, res) {
        try {
            const resumen = await AuditoriaModel.obtenerResumenKpis();
            res.json(resumen);
        } catch (error) {
            console.error('❌ Error en AuditoriaController.obtenerKpis:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
        }
    }
};

module.exports = AuditoriaController;
