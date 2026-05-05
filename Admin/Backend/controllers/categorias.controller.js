/*
 * ==========================================
 * MÓDULO: categorias.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const Categoria = require('../models/categorias.model.js');

const categoriasController = {
  listar: async (req, res) => {
    try {
      const resultados = await Categoria.obtenerTodas();
      res.json(resultados);
    } catch (err) {
      console.error('Error al listar categorías:', err.message);
      res.status(500).json({ error: 'No se pudieron obtener las categorías.' });
    }
  },

  agregar: async (req, res) => {
    // Solo extraemos nombre_categoria
    const { nombre_categoria } = req.body;
    try {
      // Enviamos solo el nombre en el array
      const result = await Categoria.agregar([nombre_categoria]);
      res.json({ mensaje: 'Categoría creada', id: result.insertId });
    } catch (err) {
      console.error('Error al crear categoría:', err.message);
      res.status(500).json({ error: 'Error al crear la categoría' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre_categoria } = req.body; // Sin descripción
    try {
      // El orden es importante: Nombre primero, ID al final (según el query del modelo)
      await Categoria.actualizar([nombre_categoria, id]);
      res.json({ mensaje: 'Categoría actualizada' });
    } catch (err) {
      console.error('Error al actualizar categoría:', err.message);
      res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Categoria.eliminar(id);
      res.json({ mensaje: 'Categoría eliminada' });
    } catch (err) {
      console.error('Error al eliminar categoría:', err.message);
      res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
  }
};

module.exports = categoriasController;