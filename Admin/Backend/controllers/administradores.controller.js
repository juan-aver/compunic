/**
 * @file administradores.controller.js
 * @description Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const Administrador = require('../models/administradores.model.js');

const administradoresController = {
    listar: async (req, res) => {
        try {
            const resultados = await Administrador.obtenerTodos();
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar administradores' });
        }
    },

    buscar: async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json([]);
        try {
            const resultados = await Administrador.buscar(q);
            res.json(resultados);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al buscar administradores' });
        }
    },

    agregar: async (req, res) => {
        const { telefono, email, id_empleado } = req.body;

        if (!id_empleado) {
            return res.status(400).json({ error: 'El ID del empleado es obligatorio' });
        }

        try {
            await Administrador.agregar([telefono, email, id_empleado]);
            res.json({ mensaje: 'Administrador creado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear administrador' });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { telefono, email, id_empleado } = req.body;
        try {
            await Administrador.actualizar([telefono, email, id_empleado, id]);
            res.json({ mensaje: 'Administrador actualizado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar administrador' });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            await Administrador.eliminar(id);
            res.json({ mensaje: 'Administrador eliminado' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al eliminar administrador' });
        }
    }
};

module.exports = administradoresController;
