/*
 * ==========================================
 * MÓDULO: empleados.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const db = require('../config/db.js');

const Empleado = {
    obtenerTodos: async () => {
        try {
            const [resultados] = await db.query('SELECT * FROM EMPLEADOS');
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener empleados: ' + err.message);
        }
    },

    buscar: async (termino) => {
        const sql = `
            SELECT * FROM EMPLEADOS 
            WHERE NOMBRE LIKE ?
        `;
        const likeTerm = `%${termino}%`;
        try {
            const [resultados] = await db.query(sql, [likeTerm]);
            return resultados;
        } catch (err) {
            throw new Error('Error al buscar empleados: ' + err.message);
        }
    },

    agregar: async (datos) => {
        const sql = 'INSERT INTO EMPLEADOS (NOMBRE, APELLIDO, SEXO, F_NACIMIENTO) VALUES (?, ?, ?, ?)';
        try {
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar empleado: ' + err.message);
        }
    },

    actualizar: async (datos) => {
        const sql = 'UPDATE EMPLEADOS SET NOMBRE=?, APELLIDO=?, SEXO=?, F_NACIMIENTO=? WHERE ID=?';
        try {
            await db.query(sql, datos);
        } catch (err) {
            throw new Error('Error al actualizar empleado: ' + err.message);
        }
    },

    eliminar: async (id) => {
        const sql = 'DELETE FROM EMPLEADOS WHERE ID=?';
        try {
            await db.query(sql, [id]);
        } catch (err) {
            throw new Error('Error al eliminar empleado: ' + err.message);
        }
    }
};

module.exports = Empleado;
