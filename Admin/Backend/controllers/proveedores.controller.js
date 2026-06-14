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
const AuditoriaModel = require('../models/auditoria.model');

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
    const { nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email } = req.body;

    // Validación básica
    if (!nombre_empresa) {
      return res.status(400).json({ error: 'El Nombre de la Empresa es obligatorio.' });
    }

    try {
      const id_empleado = req.userId || 11;
      const resultado = await Proveedor.agregar({
        nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email, id_empleado
      });
      res.status(201).json({ mensaje: 'Proveedor creado exitosamente', id: resultado.insertId });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'CREAR',
        tabla: 'PROVEEDORES',
        descripcion: `Se agregó el proveedor "${nombre_empresa}" (ID: ${resultado.insertId})`
      }).catch(e => console.error('Audit log error:', e));
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

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'MODIFICAR',
        tabla: 'PROVEEDORES',
        descripcion: `Se actualizó el proveedor "${nombre_empresa}" (ID: ${id})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
      res.status(500).json({ error: 'Error al actualizar el proveedor' });
    }
  },

  // Dar de baja proveedor
  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Proveedor.eliminar(id);
      res.json({ mensaje: 'Proveedor dado de baja exitosamente' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'DAR_DE_BAJA',
        tabla: 'PROVEEDORES',
        descripcion: `Se dio de baja al proveedor con ID: ${id}`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al dar de baja proveedor:', err);
      res.status(500).json({ error: 'Error al dar de baja el proveedor' });
    }
  },

  // Dar de alta proveedor
  activar: async (req, res) => {
    const { id } = req.params;
    try {
      await Proveedor.activar(id);
      res.json({ mensaje: 'Proveedor dado de alta exitosamente' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'DAR_DE_ALTA',
        tabla: 'PROVEEDORES',
        descripcion: `Se dio de alta al proveedor con ID: ${id}`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al dar de alta proveedor:', err);
      res.status(500).json({ error: 'Error al dar de alta el proveedor' });
    }
  }
};

module.exports = proveedoresController;