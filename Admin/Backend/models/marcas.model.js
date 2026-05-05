/**
 * @file marcas.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const db = require('../config/db.js');

const Marca = {
  obtenerTodas: async () => {
    try {
      const [resultados] = await db.query('SELECT * FROM MARCAS');
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener las marcas: ' + err.message);
    }
  },

  agregar: async (datos) => {
    const sql = 'INSERT INTO MARCAS (NOMBRE_MARCA) VALUES (?)';
    try {
      const [result] = await db.query(sql, datos);
      return result;
    } catch (err) {
      throw new Error('Error al agregar la marca: ' + err.message);
    }
  },

  actualizar: async (datos) => {
    const sql = 'UPDATE MARCAS SET NOMBRE_MARCA=? WHERE ID_MARCA=?';
    try {
      await db.query(sql, datos);
    } catch (err) {
      throw new Error('Error al actualizar la marca: ' + err.message);
    }
  },

  eliminar: async (id) => {
    const sql = 'DELETE FROM MARCAS WHERE ID_MARCA=?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al eliminar la marca: ' + err.message);
    }
  }
};

module.exports = Marca;
