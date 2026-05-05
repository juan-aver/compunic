/**
 * @file proveedores.controller.js
 * @description Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// controllers/proveedores.controller.js
const Proveedor = require('../models/proveedores.model.js');

const proveedoresController = {

  // Obtener todos los proveedores
  listar: async (req, res) => {
    try {
      const proveedores = await Proveedor.obtenerTodos();
      res.json(proveedores);
    } catch (err) {
      console.error('Error al listar proveedores:', err);
      res.status(500).json({ error: 'No se pudieron obtener los proveedores.' });
    }
  },

  buscar: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const resultados = await Proveedor.buscar(q);
      res.json(resultados);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al buscar proveedores' });
    }
  },

  // Crear un proveedor nuevo
  crear: async (req, res) => {
    // Desestructuramos los datos nuevos que vienen del HTML
    const { id_proveedor, nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email } = req.body;

    // Validación básica
    if (!id_proveedor || !nombre_empresa) {
      return res.status(400).json({ error: 'El ID y el Nombre de la Empresa son obligatorios.' });
    }

    try {
      const resultado = await Proveedor.agregar({
        id_proveedor, nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email
      });
      res.status(201).json({ mensaje: 'Proveedor creado exitosamente', id: id_proveedor });
    } catch (err) {
      console.error('Error al crear proveedor:', err);
      res.status(500).json({ error: 'Error al crear el proveedor: ' + err.message });
    }
  },

  // Actualizar proveedor existente
  actualizar: async (req, res) => {
    const { id } = req.params; // ID original que viene en la URL
    // Desestructuramos los datos nuevos
    const { nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email } = req.body;

    try {
      await Proveedor.actualizar({
        id_proveedor: id, nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email
      });
      res.json({ mensaje: 'Proveedor actualizado correctamente' });
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
      res.status(500).json({ error: 'Error al actualizar el proveedor' });
    }
  },

  // Eliminar proveedor
  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Proveedor.eliminar(id);
      res.json({ mensaje: 'Proveedor eliminado exitosamente' });
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      res.status(500).json({ error: 'Error al eliminar el proveedor' });
    }
  }
};

module.exports = proveedoresController;