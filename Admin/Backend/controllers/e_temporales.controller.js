/**
 * @file e_temporales.controller.js
 * @description Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const ETemporal = require('../models/e_temporales.model.js');

const eTemporalesController = {
    listar: async (req, res) => {
        try {
            const resultados = await ETemporal.obtenerTodos();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar empleados temporales' });
        }
    },

    buscar: async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json([]);
        try {
            const resultados = await ETemporal.buscar(q);
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al buscar empleados temporales' });
        }
    },

    agregar: async (req, res) => {
        const { nombre, apellido, telefono, direccion, email, id_administrador } = req.body;

        // Validación básica
        if (!nombre || !apellido) {
            return res.status(400).json({ error: 'El Nombre y Apellido son obligatorios' });
        }

        try {
            const result = await ETemporal.agregar([nombre, apellido, telefono, direccion, email, id_administrador]);
            res.json({ mensaje: 'Empleado temporal creado', id: result.insertId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear empleado temporal' });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { nombre, apellido, telefono, direccion, email, id_administrador } = req.body;
        try {
            await ETemporal.actualizar([nombre, apellido, telefono, direccion, email, id_administrador, id]);
            res.json({ mensaje: 'Empleado temporal actualizado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar empleado temporal' });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            await ETemporal.eliminar(id);
            res.json({ mensaje: 'Empleado temporal eliminado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al eliminar empleado temporal' });
        }
    }
};

module.exports = eTemporalesController;
