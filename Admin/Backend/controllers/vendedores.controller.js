/*
 * ==========================================
 * MÓDULO: vendedores.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const Vendedor = require('../models/vendedores.model.js');

const vendedoresController = {
  listar: async (req, res) => {
    try {
      const resultados = await Vendedor.obtenerTodos();
      res.json(resultados);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al listar vendedores' });
    }
  },

  buscar: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const resultados = await Vendedor.buscar(q);
      res.json(resultados);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al buscar vendedores' });
    }
  },

  agregar: async (req, res) => {
    const { area, horario, telefono, email, id_empleado } = req.body;

    // Validación básica
    if (!area || !id_empleado) {
      return res.status(400).json({ error: 'El Área y el ID de Empleado son obligatorios' });
    }

    try {
      const result = await Vendedor.agregar([area, horario, telefono, email, id_empleado]);
      res.json({ mensaje: 'Vendedor creado', id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear vendedor. Verifica que el ID_EMPLEADO exista.' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { area, horario, telefono, email, id_empleado } = req.body;
    try {
      await Vendedor.actualizar([area, horario, telefono, email, id_empleado, id]);
      res.json({ mensaje: 'Vendedor actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar vendedor' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Vendedor.eliminar(id);
      res.json({ mensaje: 'Vendedor eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar vendedor (Posiblemente tenga clientes asociados)' });
    }
  }
};

module.exports = vendedoresController;