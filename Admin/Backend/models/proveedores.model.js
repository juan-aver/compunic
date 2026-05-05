/*
 * ==========================================
 * MÓDULO: proveedores.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// models/proveedores.model.js
const db = require('../config/db.js');

const Proveedor = {
  // Obtener todos los proveedores
  obtenerTodos: async () => {
    try {
      const [resultados] = await db.query('SELECT * FROM PROVEEDORES order by ID_PROVEEDOR desc');
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener los proveedores: ' + err.message);
    }
  },

  buscar: async (termino) => {
    const sql = `
      SELECT * FROM PROVEEDORES 
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
  // Nota: Se usa ID_ADMINISTRADOR = 401 por defecto (Miguel Jimenez)
  agregar: async ({ id_proveedor, nombre_empresa, persona_contacto, telefono, direccion, pagina_web, email }) => {
    const sql = `
      INSERT INTO PROVEEDORES 
      (ID_PROVEEDOR, NOMBRE_EMPRESA, PERSONA_CONTACTO, TELEFONO, DIRECCION, PAGINA_WEB, EMAIL, ID_ADMINISTRADOR)
      VALUES (?, ?, ?, ?, ?, ?, ?, 401)
    `;
    try {
      const [result] = await db.query(sql, [
        id_proveedor,
        nombre_empresa,
        persona_contacto,
        telefono,
        direccion,
        pagina_web,
        email
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

  // Eliminar proveedor por ID
  eliminar: async (id) => {
    const sql = 'DELETE FROM PROVEEDORES WHERE ID_PROVEEDOR = ?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al eliminar el proveedor: ' + err.message);
    }
  }
};

module.exports = Proveedor;