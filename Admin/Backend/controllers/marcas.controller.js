/**
 * @file marcas.controller.js
 * @description Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const Marca = require('../models/marcas.model.js');

const marcasController = {
  listar: async (req, res) => {
    try {
      const marcas = await Marca.obtenerTodas();
      res.json(marcas);
    } catch (err) {
      console.error('Error al listar marcas:', err.message);
      res.status(500).json({ error: 'No se pudieron obtener las marcas.' });
    }
  },

  agregar: async (req, res) => {
    const { nombre_marca } = req.body;
    try {
      const result = await Marca.agregar([nombre_marca]);
      res.status(201).json({ mensaje: 'Marca creada', id: result.insertId });
    } catch (err) {
      console.error('Error al crear marca:', err.message);
      res.status(500).json({ error: 'Error al crear la marca' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre_marca } = req.body;
    try {
      await Marca.actualizar([nombre_marca, id]);
      res.json({ mensaje: 'Marca actualizada' });
    } catch (err) {
      console.error('Error al actualizar marca:', err.message);
      res.status(500).json({ error: 'Error al actualizar la marca' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Marca.eliminar(id);
      res.json({ mensaje: 'Marca eliminada' });
    } catch (err) {
      console.error('Error al eliminar marca:', err.message);
      res.status(500).json({ error: 'Error al eliminar la marca' });
    }
  }
};

module.exports = marcasController;
