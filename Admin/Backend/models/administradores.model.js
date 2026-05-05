/*
 * ==========================================
 * MÓDULO: administradores.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const db = require('../config/db');

const Administrador = {
    obtenerTodos: async () => {
        try {
            const sql = `
                SELECT a.*, e.NOMBRE, e.APELLIDO 
                FROM ADMINISTRADOR a
                LEFT JOIN EMPLEADOS e ON a.ID_EMPLEADO = e.ID
            `;
            const [resultados] = await db.query(sql);
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener administradores: ' + err.message);
        }
    },

    buscar: async (termino) => {
        const sql = `
            SELECT a.*, e.NOMBRE, e.APELLIDO 
            FROM ADMINISTRADOR a
            LEFT JOIN EMPLEADOS e ON a.ID_EMPLEADO = e.ID
            WHERE e.NOMBRE LIKE ? OR e.APELLIDO LIKE ? OR a.TELEFONO LIKE ? OR a.EMAIL LIKE ?
        `;
        const likeTerm = `%${termino}%`;
        try {
            const [resultados] = await db.query(sql, [likeTerm, likeTerm, likeTerm, likeTerm]);
            return resultados;
        } catch (err) {
            throw new Error('Error al buscar administradores: ' + err.message);
        }
    },

    agregar: async (datos) => {
        const sql = 'INSERT INTO ADMINISTRADOR (TELEFONO, EMAIL, ID_EMPLEADO) VALUES (?, ?, ?)';
        try {
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar administrador: ' + err.message);
        }
    },

    actualizar: async (datos) => {
        const sql = 'UPDATE ADMINISTRADOR SET TELEFONO=?, EMAIL=?, ID_EMPLEADO=? WHERE ID_ADMINISTRADOR=?';
        try {
            await db.query(sql, datos);
        } catch (err) {
            throw new Error('Error al actualizar administrador: ' + err.message);
        }
    },

    eliminar: async (id) => {
        const sql = 'DELETE FROM ADMINISTRADOR WHERE ID_ADMINISTRADOR=?';
        try {
            await db.query(sql, [id]);
        } catch (err) {
            throw new Error('Error al eliminar administrador: ' + err.message);
        }
    }
};

module.exports = Administrador;
