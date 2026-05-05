/**
 * @file garantias.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const db = require('../config/db');

const Garantia = {
    obtenerTodas: async () => {
        try {
            const sql = `
        SELECT g.*, gt.TIPO as NOMBRE_TIPO, ge.ESTADO as NOMBRE_ESTADO 
        FROM GARANTIAS g
        LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
        LEFT JOIN GARANTIA_ESTADOS ge ON g.ID_GARANTIA_ESTADO = ge.ID_GARANTIA_ESTADO
        order by g.ID_GARANTIA desc
      `;
            const [resultados] = await db.query(sql);
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener garantías: ' + err.message);
        }
    },

    obtenerTipos: async () => {
        try {
            const [resultados] = await db.query('SELECT * FROM GARANTIA_TIPOS');
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener tipos de garantía: ' + err.message);
        }
    },

    obtenerEstados: async () => {
        try {
            const [resultados] = await db.query('SELECT * FROM GARANTIA_ESTADOS');
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener estados de garantía: ' + err.message);
        }
    },

    buscar: async (tipo, estado, duracion) => {
        try {
            let sql = `
                SELECT g.*, gt.TIPO as NOMBRE_TIPO, ge.ESTADO as NOMBRE_ESTADO 
                FROM GARANTIAS g
                LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
                LEFT JOIN GARANTIA_ESTADOS ge ON g.ID_GARANTIA_ESTADO = ge.ID_GARANTIA_ESTADO
                WHERE 1=1
                order by g.ID_GARANTIA desc
            `;
            const params = [];

            if (tipo) {
                sql += ' AND g.ID_GARANTIA_TIPO = ?';
                params.push(tipo);
            }
            if (estado) {
                sql += ' AND g.ID_GARANTIA_ESTADO = ?';
                params.push(estado);
            }
            if (duracion) {
                sql += ' AND g.DURACION_MESES = ?';
                params.push(duracion);
            }

            const [resultados] = await db.query(sql, params);
            return resultados;
        } catch (err) {
            throw new Error('Error al buscar garantías: ' + err.message);
        }
    },

    agregar: async (datos) => {
        const sql = 'INSERT INTO GARANTIAS (ID_GARANTIA, FECHA, CONDICION, EXCLUSIONES, HORA, DURACION_MESES, ID_GARANTIA_TIPO, ID_GARANTIA_ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        try {
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar garantía: ' + err.message);
        }
    },

    actualizar: async (datos) => {
        const sql = 'UPDATE GARANTIAS SET FECHA=?, CONDICION=?, EXCLUSIONES=?, HORA=?, DURACION_MESES=?, ID_GARANTIA_TIPO=?, ID_GARANTIA_ESTADO=? WHERE ID_GARANTIA=?';
        try {
            await db.query(sql, datos);
        } catch (err) {
            throw new Error('Error al actualizar garantía: ' + err.message);
        }
    },

    eliminar: async (id) => {
        const sql = 'DELETE FROM GARANTIAS WHERE ID_GARANTIA=?';
        try {
            await db.query(sql, [id]);
        } catch (err) {
            throw new Error('Error al eliminar garantía: ' + err.message);
        }
    }
};

module.exports = Garantia;
