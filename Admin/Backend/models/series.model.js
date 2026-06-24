const db = require('../config/db');

const Series = {
    // Registrar una o varias series nuevas
    registrar: async (id_producto, seriales) => {
        // seriales es un array de objetos [{numero_serie, condicion, notas}]
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const values = seriales.map(s => [
                id_producto,
                s.numero_serie,
                s.condicion || 'Nuevo',
                'en_stock',
                s.notas || null
            ]);

            const sql = `
                INSERT INTO PRODUCTO_SERIES 
                (ID_PRODUCTO, NUMERO_SERIE, CONDICION, ESTADO, NOTAS) 
                VALUES ?
                ON DUPLICATE KEY UPDATE 
                CONDICION = VALUES(CONDICION), 
                ESTADO = VALUES(ESTADO),
                NOTAS = VALUES(NOTAS)
            `;

            const [result] = await connection.query(sql, [values]);
            
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw new Error('Error al registrar series: ' + error.message);
        } finally {
            connection.release();
        }
    },

    // Obtener todas las series de un producto
    obtenerPorProducto: async (id_producto) => {
        try {
            const sql = `
                SELECT 
                    ID_SERIE, NUMERO_SERIE, CONDICION, ESTADO, 
                    FECHA_REGISTRO, NOTAS, ID_VENTA, ID_DEVOLUCION
                FROM PRODUCTO_SERIES
                WHERE ID_PRODUCTO = ?
                ORDER BY FECHA_REGISTRO DESC
            `;
            const [rows] = await db.query(sql, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error('Error al obtener series: ' + error.message);
        }
    },

    // Obtener solo las series disponibles (en_stock) de un producto
    obtenerDisponibles: async (id_producto) => {
        try {
            const sql = `
                SELECT ID_SERIE, NUMERO_SERIE, CONDICION 
                FROM PRODUCTO_SERIES
                WHERE ID_PRODUCTO = ? AND ESTADO = 'en_stock'
                ORDER BY FECHA_REGISTRO ASC
            `;
            const [rows] = await db.query(sql, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error('Error al obtener series disponibles: ' + error.message);
        }
    },

    // Eliminar una serie específica si está en stock (por si se equivocaron al ingresarla)
    eliminar: async (id_serie) => {
        try {
            const sql = `DELETE FROM PRODUCTO_SERIES WHERE ID_SERIE = ? AND ESTADO = 'en_stock'`;
            const [result] = await db.query(sql, [id_serie]);
            return result;
        } catch (error) {
            throw new Error('Error al eliminar serie: ' + error.message);
        }
    }
};

module.exports = Series;
