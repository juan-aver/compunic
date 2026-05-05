/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: clientes.controller.js
 * Descripción: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const Cliente = require('../models/clientes.model.js');

const clientesController = {
  listar: async (req, res) => {
    try {
      const resultados = await Cliente.obtenerTodos();
      res.json(resultados);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al listar clientes' });
    }
  },

  buscar: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const resultados = await Cliente.buscar(q);
      res.json(resultados);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al buscar clientes' });
    }
  },

  agregar: async (req, res) => {
    const { nombre, apellido, telefono, email } = req.body;
    try {
      const result = await Cliente.agregar([nombre, apellido, telefono, email]);
      res.json({ mensaje: 'Cliente creado', id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, email } = req.body;
    try {
      await Cliente.actualizar([nombre, apellido, telefono, email, id]);
      res.json({ mensaje: 'Cliente actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Cliente.eliminar(id);
      res.json({ mensaje: 'Cliente eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }
};

module.exports = clientesController;