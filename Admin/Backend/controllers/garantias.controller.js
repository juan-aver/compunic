/**
 * @file garantias.controller.js
 * @description Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const Garantia = require('../models/garantias.model.js');
const AuditoriaModel = require('../models/auditoria.model');

const garantiasController = {
    listar: async (req, res) => {
        try {
            const resultados = await Garantia.obtenerTodas();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar garantías' });
        }
    },

    buscar: async (req, res) => {
        const { tipo, estado, duracion } = req.query;
        try {
            const resultados = await Garantia.buscar(tipo, estado, duracion);
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al buscar garantías' });
        }
    },

    listarTipos: async (req, res) => {
        try {
            const resultados = await Garantia.obtenerTipos();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar tipos de garantía' });
        }
    },

    listarEstados: async (req, res) => {
        try {
            const resultados = await Garantia.obtenerEstados();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar estados de garantía' });
        }
    },

    agregar: async (req, res) => {
        let { id_garantia, fecha, hora, duracion_meses, id_garantia_tipo, id_garantia_estado, condicion, exclusiones } = req.body;

        // Auto-generar ID si no se proporciona
        if (!id_garantia) {
            id_garantia = Date.now() % 1000000 + Math.floor(Math.random() * 100);
        }
        // Auto-generar fecha si no se proporciona
        if (!fecha) {
            fecha = new Date().toISOString().split('T')[0];
        }
        if (!hora) {
            hora = new Date().toTimeString().split(' ')[0];
        }

        if (!id_garantia_tipo || !id_garantia_estado) {
            return res.status(400).json({ error: 'Tipo y Estado son obligatorios' });
        }

        try {
            // Orden: ID_GARANTIA, FECHA, CONDICION, EXCLUSIONES, HORA, DURACION_MESES, ID_GARANTIA_TIPO, ID_GARANTIA_ESTADO
            const result = await Garantia.agregar([
                id_garantia,
                fecha,
                condicion,
                exclusiones,
                hora,
                duracion_meses,
                id_garantia_tipo,
                id_garantia_estado
            ]);
            res.json({ mensaje: 'Garantía creada', id: id_garantia });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'CREAR',
                tabla: 'GARANTIAS',
                descripcion: `Se registró la garantía ID: ${id_garantia} | Tipo ID: ${id_garantia_tipo} | Duración: ${duracion_meses} meses`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear garantía: ' + err.message });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { fecha, hora, duracion_meses, id_garantia_tipo, id_garantia_estado, condicion, exclusiones } = req.body;

        try {
            // Orden: FECHA, CONDICION, EXCLUSIONES, HORA, DURACION_MESES, ID_GARANTIA_TIPO, ID_GARANTIA_ESTADO, ID_GARANTIA
            await Garantia.actualizar([
                fecha,
                condicion,
                exclusiones,
                hora,
                duracion_meses,
                id_garantia_tipo,
                id_garantia_estado,
                id
            ]);
            res.json({ mensaje: 'Garantía actualizada' });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'GARANTIAS',
                descripcion: `Se actualizó la garantía ID: ${id}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar garantía: ' + err.message });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            await Garantia.eliminar(id);
            res.json({ mensaje: 'Garantía eliminada' });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'ELIMINAR',
                tabla: 'GARANTIAS',
                descripcion: `Se eliminó la garantía ID: ${id}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al eliminar garantía' });
        }
    }
};

module.exports = garantiasController;
