/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: servicios.controller.js
 * Descripción: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const Servicio = require('../models/servicios.model');

const serviciosController = {
    getAll: async (req, res) => {
        try {
            const servicios = await Servicio.obtenerTodos();
            res.json(servicios);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getById: async (req, res) => {
        try {
            const servicio = await Servicio.obtenerPorId(req.params.id);
            if (!servicio) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json(servicio);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const { descripcion, fecha_solicitud, fecha_ejecucion, costo, id_temporal, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado } = req.body;
            const datos = [descripcion, fecha_solicitud, fecha_ejecucion, costo, id_temporal, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado];
            const result = await Servicio.agregar(datos);
            res.status(201).json({ message: 'Servicio creado', id: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { descripcion, fecha_solicitud, fecha_ejecucion, costo, id_temporal, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado } = req.body;
            const datos = [descripcion, fecha_solicitud, fecha_ejecucion, costo, id_temporal, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado];
            const result = await Servicio.actualizar(req.params.id, datos);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio actualizado' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await Servicio.eliminar(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio eliminado' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getTipos: async (req, res) => {
        try {
            const tipos = await Servicio.obtenerTipos();
            res.json(tipos);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getEstados: async (req, res) => {
        try {
            const estados = await Servicio.obtenerEstados();
            res.json(estados);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = serviciosController;
