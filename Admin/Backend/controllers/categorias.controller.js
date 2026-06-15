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
const AuditoriaModel = require('../models/auditoria.model.js');

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
    const { nombre_categoria } = req.body;
    try {
      const result = await Categoria.agregar([nombre_categoria]);
      res.json({ mensaje: 'Categoría creada', id: result.insertId });

      // Registrar auditoría
      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'CREAR',
        tabla: 'CATEGORIAS',
        id_registro: result.insertId,
        detalle: `Se creó la categoría: "${nombre_categoria}" (ID: ${result.insertId})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al crear categoría:', err.message);
      res.status(500).json({ error: 'Error al crear la categoría' });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre_categoria, activo } = req.body;
    try {
      // Si se pasa 'activo', se actualiza el estado (dar de baja / reactivar)
      if (activo !== undefined) {
        const valActivo = Number(activo);
        await Categoria.actualizarEstado([valActivo, id]);
        res.json({ mensaje: valActivo === 0 ? 'Categoría dada de baja' : 'Categoría reactivada' });

        const accionAuditoria = valActivo === 0 ? 'DAR DE BAJA' : 'REACTIVAR';
        AuditoriaModel.registrar({
          id_empleado: req.userId || null,
          username: req.username || 'Sistema',
          accion: accionAuditoria,
          tabla: 'CATEGORIAS',
          id_registro: id,
          detalle: `Se cambió el estado de la categoría ID: ${id} a ${valActivo === 0 ? 'Inactivo (Dada de Baja)' : 'Activo'}`
        }).catch(e => console.error('Audit log error:', e));
        return;
      }

      await Categoria.actualizar([nombre_categoria, id]);
      res.json({ mensaje: 'Categoría actualizada' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'MODIFICAR',
        tabla: 'CATEGORIAS',
        id_registro: id,
        detalle: `Se modificó la categoría ID: ${id} - Nuevo nombre: "${nombre_categoria}"`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al actualizar categoría:', err.message);
      res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      await Categoria.darDeBaja(id);
      res.json({ mensaje: 'Categoría dada de baja' });

      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'DAR DE BAJA',
        tabla: 'CATEGORIAS',
        id_registro: id,
        detalle: `Se dio de baja la categoría ID: ${id}`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      console.error('Error al eliminar categoría:', err.message);
      res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
  }
};

module.exports = categoriasController;