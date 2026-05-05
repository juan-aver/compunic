/*
 * ==========================================
 * MÓDULO: empleados.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const Empleado = require('../models/empleados.model.js');

const empleadosController = {
    listar: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar empleados' });
        }
    },

    buscar: async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json([]);
        try {
            const resultados = await Empleado.buscar(q);
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al buscar empleados' });
        }
    },

    agregar: async (req, res) => {
        const { nombre, apellido, sexo, f_nacimiento } = req.body;

        if (!nombre || !apellido) {
            return res.status(400).json({ error: 'Nombre y Apellido son obligatorios' });
        }

        try {
            const result = await Empleado.agregar([nombre, apellido, sexo, f_nacimiento]);
            res.json({ mensaje: 'Empleado creado', id: result.insertId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear empleado' });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { nombre, apellido, sexo, f_nacimiento } = req.body;
        try {
            await Empleado.actualizar([nombre, apellido, sexo, f_nacimiento, id]);
            res.json({ mensaje: 'Empleado actualizado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar empleado' });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            await Empleado.eliminar(id);
            res.json({ mensaje: 'Empleado eliminado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al eliminar empleado' });
        }
    }
};

module.exports = empleadosController;
