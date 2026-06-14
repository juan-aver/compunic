// models/proveedores.model.js
const db = require('../config/db.js');

const Proveedor = {
  // Obtener todos los proveedores
  obtenerTodos: async () => {
    try {
      const [resultados] = await db.query('SELECT *, COALESCE(ACTIVO, 1) AS ACTIVO FROM PROVEEDORES order by ID_PROVEEDOR desc');
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener los proveedores: ' + err.message);
    }
  },

  buscar: async (termino) => {
    const sql = `
      SELECT *, COALESCE(ACTIVO, 1) AS ACTIVO FROM PROVEEDORES 
      WHERE NOMBRE_EMPRESA LIKE ? OR PERSONA_CONTACTO LIKE ? OR TELEFONO LIKE ? OR EMAIL LIKE ?
    `;
    const likeTerm = `%${termino}%`;
    try {
      const [resultados] = await db.query(sql, [likeTerm, likeTerm, likeTerm, likeTerm]);
      return resultados;
    } catch (err) {
      throw new Error('Error al buscar proveedores: ' + err.message);
    }
  },

  // Agregar un proveedor nuevo
  // Nota: Se usa el id_empleado del administrador logueado o 11 (Axel Ruiz) por defecto
  agregar: async ({ nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email, id_empleado }) => {
    const sql = `
      INSERT INTO PROVEEDORES 
      (NOMBRE_EMPRESA, PERSONA_CONTACTO, TELEFONO, DIRECCION, PAGINA_WEB, EMAIL, ID_EMPLEADO)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await db.query(sql, [
        nombre_empresa,
        persona_contacto,
        telefono,
        direccion,
        pagina_web,
        email,
        id_empleado || 11
      ]);
      return result;
    } catch (err) {
      throw new Error('Error al agregar el proveedor: ' + err.message);
    }
  },

  // Actualizar proveedor existente
  actualizar: async ({ id_proveedor, nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email }) => {
    const sql = `
      UPDATE PROVEEDORES 
      SET NOMBRE_EMPRESA = ?, PERSONA_CONTACTO = ?, TELEFONO = ?, DIRECCION = ?, PAGINA_WEB = ?, EMAIL = ?
      WHERE ID_PROVEEDOR = ?
    `;
    try {
      await db.query(sql, [
        nombre_empresa,
        persona_contacto,
        telefono,
        direccion,
        pagina_web,
        email,
        id_proveedor
      ]);
    } catch (err) {
      throw new Error('Error al actualizar el proveedor: ' + err.message);
    }
  },

  // Dar de baja proveedor por ID (soft delete)
  eliminar: async (id) => {
    const sql = 'UPDATE PROVEEDORES SET ACTIVO = 0 WHERE ID_PROVEEDOR = ?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al dar de baja el proveedor: ' + err.message);
    }
  },

  // Dar de alta proveedor por ID (reactivar)
  activar: async (id) => {
    const sql = 'UPDATE PROVEEDORES SET ACTIVO = 1 WHERE ID_PROVEEDOR = ?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al dar de alta el proveedor: ' + err.message);
    }
  }
};

module.exports = Proveedor;