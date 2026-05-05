/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: servicios.model.js
 * Descripción: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const db = require('../config/db.js');

const Servicio = {
    obtenerTodos: async () => {
        try {
            const sql = `
        SELECT 
          s.ID_SERVICIO,
          s.DESCRIPCION,
          s.FECHA_SOLICITUD,
          s.FECHA_EJECUCION,
          s.COSTO,
          s.ID_TEMPORAL,
          s.ID_CLIENTE,
          s.ID_GARANTIA,
          s.ID_SERVICIO_TIPO,
          s.ID_SERVICIO_ESTADO,
          c.NOMBRE AS NOMBRE_CLIENTE,
          c.APELLIDO AS APELLIDO_CLIENTE,
          st.TIPO AS TIPO_SERVICIO,
          se.ESTADO AS ESTADO_SERVICIO,
          gt.TIPO AS NOMBRE_GARANTIA,
          g.DURACION_MESES
        FROM SERVICIOS s
        LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
        LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO
        LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
        LEFT JOIN GARANTIAS g ON s.ID_GARANTIA = g.ID_GARANTIA
        LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
        ORDER BY s.ID_SERVICIO DESC
      `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener servicios: ' + err.message);
        }
    },

    obtenerPorId: async (id) => {
        try {
            const sql = `SELECT * FROM SERVICIOS WHERE ID_SERVICIO = ?`;
            const [rows] = await db.query(sql, [id]);
            return rows[0];
        } catch (err) {
            throw new Error('Error al obtener servicio por ID: ' + err.message);
        }
    },

    agregar: async (datos) => {
        try {
            // datos: [descripcion, fecha_solicitud, fecha_ejecucion, costo, id_temporal, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado]
            const sql = `
        INSERT INTO SERVICIOS (DESCRIPCION, FECHA_SOLICITUD, FECHA_EJECUCION, COSTO, ID_TEMPORAL, ID_CLIENTE, ID_GARANTIA, ID_SERVICIO_TIPO, ID_SERVICIO_ESTADO)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar servicio: ' + err.message);
        }
    },

    actualizar: async (id, datos) => {
        try {
            const sql = `
        UPDATE SERVICIOS 
        SET DESCRIPCION = ?, FECHA_SOLICITUD = ?, FECHA_EJECUCION = ?, COSTO = ?, ID_TEMPORAL = ?, ID_CLIENTE = ?, ID_GARANTIA = ?, ID_SERVICIO_TIPO = ?, ID_SERVICIO_ESTADO = ?
        WHERE ID_SERVICIO = ?
      `;
            // datos debe incluir los campos en orden y al final el ID
            const [result] = await db.query(sql, [...datos, id]);
            return result;
        } catch (err) {
            throw new Error('Error al actualizar servicio: ' + err.message);
        }
    },

    eliminar: async (id) => {
        try {
            const sql = `DELETE FROM SERVICIOS WHERE ID_SERVICIO = ?`;
            const [result] = await db.query(sql, [id]);
            return result;
        } catch (err) {
            throw new Error('Error al eliminar servicio: ' + err.message);
        }
    },

    obtenerTipos: async () => {
        try {
            const sql = `SELECT * FROM SERVICIO_TIPOS`;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener tipos de servicio: ' + err.message);
        }
    },

    obtenerEstados: async () => {
        try {
            const sql = `SELECT * FROM SERVICIO_ESTADOS`;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener estados de servicio: ' + err.message);
        }
    }
};

module.exports = Servicio;
