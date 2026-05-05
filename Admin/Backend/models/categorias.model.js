/**
 * @file categorias.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const db = require('../config/db.js');

const Categoria = {
  obtenerTodas: async () => {
    try {
      const [resultados] = await db.query('SELECT * FROM CATEGORIAS');
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener las categorías: ' + err.message);
    }
  },

  agregar: async (datos) => {
    // Ya no pedimos descripción, solo nombre
    const sql = 'INSERT INTO CATEGORIAS (NOMBRE_CATEGORIA) VALUES (?)';
    try {
      const [result] = await db.query(sql, datos);
      return result;
    } catch (err) {
      throw new Error('Error al agregar la categoría: ' + err.message);
    }
  },

  actualizar: async (datos) => {
    const sql = 'UPDATE CATEGORIAS SET NOMBRE_CATEGORIA=? WHERE ID_CATEGORIA=?';
    try {
      await db.query(sql, datos);
    } catch (err) {
      throw new Error('Error al actualizar la categoría: ' + err.message);
    }
  },

  eliminar: async (id) => {
    const sql = 'DELETE FROM CATEGORIAS WHERE ID_CATEGORIA=?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al eliminar la categoría: ' + err.message);
    }
  }
};

module.exports = Categoria;