/*
 * Módulo: clientes.controller.js
 * Descripción: Controlador para gestionar los datos de clientes.
 */
const Cliente = require('../models/clientes.model.js');
const AuditoriaModel = require('../models/auditoria.model');

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
    const { nombre, apellido, telefono, email, cedula } = req.body;
    try {
      const result = await Cliente.agregar([nombre, apellido, telefono, email, cedula]);
      res.json({ mensaje: 'Cliente creado', id: result.insertId });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'CREAR',
        tabla: 'CLIENTES',
        descripcion: `Se agregó el cliente "${nombre} ${apellido}" (ID: ${result.insertId})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, email, cedula } = req.body;
    try {
      await Cliente.actualizar([nombre, apellido, telefono, email, cedula, id]);
      res.json({ mensaje: 'Cliente actualizado' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'MODIFICAR',
        tabla: 'CLIENTES',
        descripcion: `Se actualizó la información del cliente "${nombre} ${apellido}" (ID: ${id})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Cliente.eliminar(id);
      res.json({ mensaje: 'Cliente dado de baja exitosamente' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'DAR_DE_BAJA',
        tabla: 'CLIENTES',
        descripcion: `Se dio de baja al cliente con ID: ${id}`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al dar de baja al cliente' });
    }
  },

  activar: async (req, res) => {
    const { id } = req.params;
    try {
      await Cliente.activar(id);
      res.json({ mensaje: 'Cliente dado de alta exitosamente' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'DAR_DE_ALTA',
        tabla: 'CLIENTES',
        descripcion: `Se dio de alta al cliente con ID: ${id}`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al dar de alta al cliente' });
    }
  },

  // LLAMADO A PROCEDIMIENTO ALMACENADO sp_NuevoCliente
  agregarRapido: async (req, res) => {
    const { nombre, apellido, telefono, email, id_empleado, cedula } = req.body;
    
    // Validación básica
    if (!nombre || !apellido || !id_empleado) {
      return res.status(400).json({ error: 'Nombre, apellido y ID de empleado son obligatorios' });
    }

    try {
      const result = await Cliente.agregarRapido(nombre, apellido, telefono, email, id_empleado, cedula);
      res.json({ mensaje: 'Cliente registrado rápidamente', result });
    } catch (err) {
      console.error('Error en registro rápido:', err);
      res.status(500).json({ error: 'Error al registrar cliente rápido', detail: err.message });
    }
  }
};

module.exports = clientesController;