/**
 * @file vendedores.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const db = require('../config/db.js');

const Vendedor = {
  obtenerTodos: async () => {
    try {
      const sql = `
        SELECT V.*, E.NOMBRE, E.APELLIDO 
        FROM VENDEDOR V
        JOIN EMPLEADOS E ON V.ID_EMPLEADO = E.ID
      `;
      const [resultados] = await db.query(sql);
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener vendedores: ' + err.message);
    }
  },

  buscar: async (termino) => {
    const sql = `
      SELECT * FROM VENDEDOR 
      WHERE AREA LIKE ? OR TELEFONO LIKE ? OR EMAIL LIKE ?
    `;
    const likeTerm = `%${termino}%`;
    try {
      const [resultados] = await db.query(sql, [likeTerm, likeTerm, likeTerm]);
      return resultados;
    } catch (err) {
      throw new Error('Error al buscar vendedores: ' + err.message);
    }
  },

  agregar: async (datos) => {
    const sql = 'INSERT INTO VENDEDOR (AREA, HORARIO, TELEFONO, EMAIL, ID_EMPLEADO) VALUES (?, ?, ?, ?, ?)';
    try {
      const [result] = await db.query(sql, datos);
      return result;
    } catch (err) {
      throw new Error('Error al agregar vendedor: ' + err.message);
    }
  },

  actualizar: async (datos) => {
    const sql = 'UPDATE VENDEDOR SET AREA=?, HORARIO=?, TELEFONO=?, EMAIL=?, ID_EMPLEADO=? WHERE ID_VENDEDOR=?';
    try {
      await db.query(sql, datos);
    } catch (err) {
      throw new Error('Error al actualizar vendedor: ' + err.message);
    }
  },

  eliminar: async (id) => {
    const sql = 'DELETE FROM VENDEDOR WHERE ID_VENDEDOR=?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al eliminar vendedor: ' + err.message);
    }
  }
};

module.exports = Vendedor;