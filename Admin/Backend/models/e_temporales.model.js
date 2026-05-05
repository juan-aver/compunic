/*
 * ==========================================
 * MÓDULO: e_temporales.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const db = require('../config/db.js');

const ETemporal = {
    obtenerTodos: async () => {
        try {
            const [resultados] = await db.query('SELECT * FROM E_TEMPORALES');
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener empleados temporales: ' + err.message);
        }
    },

    buscar: async (termino) => {
        const sql = `
      SELECT * FROM E_TEMPORALES 
      WHERE NOMBRE LIKE ? OR APELLIDO LIKE ? OR EMAIL LIKE ?
    `;
        const likeTerm = `%${termino}%`;
        try {
            const [resultados] = await db.query(sql, [likeTerm, likeTerm, likeTerm]);
            return resultados;
        } catch (err) {
            throw new Error('Error al buscar empleados temporales: ' + err.message);
        }
    },

    agregar: async (datos) => {
        const sql = 'INSERT INTO E_TEMPORALES (NOMBRE, APELLIDO, TELEFONO, DIRECCION, EMAIL, ID_ADMINISTRADOR) VALUES (?, ?, ?, ?, ?, ?)';
        try {
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar empleado temporal: ' + err.message);
        }
    },

    actualizar: async (datos) => {
        const sql = 'UPDATE E_TEMPORALES SET NOMBRE=?, APELLIDO=?, TELEFONO=?, DIRECCION=?, EMAIL=?, ID_ADMINISTRADOR=? WHERE ID=?';
        try {
            await db.query(sql, datos);
        } catch (err) {
            throw new Error('Error al actualizar empleado temporal: ' + err.message);
        }
    },

    eliminar: async (id) => {
        const sql = 'DELETE FROM E_TEMPORALES WHERE ID=?';
        try {
            await db.query(sql, [id]);
        } catch (err) {
            throw new Error('Error al eliminar empleado temporal: ' + err.message);
        }
    }
};

module.exports = ETemporal;
