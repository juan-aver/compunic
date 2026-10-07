/*
 * ==================================================================================
 * MÓDULO: mermas.model.js
 * PROPÓSITO: Modelo para gestión de mermas y pérdidas de inventario (REQ-FR-05)
 * ==================================================================================
 */
const db = require('../config/db');

const MermasModel = {
    // 1. Obtener todas las mermas registradas
    obtenerTodas: async () => {
        const sql = `
            SELECT 
                m.ID_MERMA,
                m.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                p.MODELO,
                m.CANTIDAD,
                m.MOTIVO,
                m.JUSTIFICACION,
                m.COSTO_UNITARIO,
                m.COSTO_TOTAL,
                m.ID_EMPLEADO,
                CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS REGISTRADO_POR,
                m.FECHA_REGISTRO
            FROM MERMAS m
            JOIN PRODUCTOS p ON m.ID_PRODUCTO = p.ID_PRODUCTO
            LEFT JOIN EMPLEADOS e ON m.ID_EMPLEADO = e.ID_EMPLEADO
            ORDER BY m.FECHA_REGISTRO DESC, m.ID_MERMA DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Obtener una merma por ID
    obtenerPorId: async (id) => {
        const sql = `
            SELECT 
                m.ID_MERMA,
                m.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                p.MODELO,
                m.CANTIDAD,
                m.MOTIVO,
                m.JUSTIFICACION,
                m.COSTO_UNITARIO,
                m.COSTO_TOTAL,
                m.ID_EMPLEADO,
                CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS REGISTRADO_POR,
                m.FECHA_REGISTRO
            FROM MERMAS m
            JOIN PRODUCTOS p ON m.ID_PRODUCTO = p.ID_PRODUCTO
            LEFT JOIN EMPLEADOS e ON m.ID_EMPLEADO = e.ID_EMPLEADO
            WHERE m.ID_MERMA = ?
        `;
        const [rows] = await db.query(sql, [id]);
        return rows[0] || null;
    },

    // 3. Obtener mermas de un producto específico
    obtenerPorProducto: async (idProducto) => {
        const sql = `
            SELECT 
                m.*,
                CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS REGISTRADO_POR
            FROM MERMAS m
            LEFT JOIN EMPLEADOS e ON m.ID_EMPLEADO = e.ID_EMPLEADO
            WHERE m.ID_PRODUCTO = ?
            ORDER BY m.FECHA_REGISTRO DESC
        `;
        const [rows] = await db.query(sql, [idProducto]);
        return rows;
    },

    // 4. Registrar una nueva merma con transacción atómica
    registrar: async ({ id_producto, cantidad, motivo, justificacion, id_empleado, series }) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // A. Verificar existencia del producto y obtener precio de compra
            const [prodRows] = await connection.query(
                `SELECT ID_PRODUCTO, NOMBRE_PRODUCTO, PRECIO_COMPRA, ACTIVO FROM PRODUCTOS WHERE ID_PRODUCTO = ?`,
                [id_producto]
            );

            if (prodRows.length === 0) {
                throw new Error('El producto no existe.');
            }

            const producto = prodRows[0];
            const costoUnitario = parseFloat(producto.PRECIO_COMPRA) || 0;
            const cant = parseInt(cantidad, 10);

            if (isNaN(cant) || cant <= 0) {
                throw new Error('La cantidad de merma debe ser un número entero positivo.');
            }

            // B. Obtener el stock actual del producto desde el historial
            const [stockRows] = await connection.query(
                `SELECT STOCK_RESULTANTE FROM MOVIMIENTOS_STOCK WHERE ID_PRODUCTO = ? ORDER BY FECHA_MOVIMIENTO DESC, ID_MOVIMIENTO DESC LIMIT 1`,
                [id_producto]
            );

            const stockActual = stockRows.length > 0 ? stockRows[0].STOCK_RESULTANTE : 0;

            if (stockActual < cant) {
                throw new Error(`Stock insuficiente para registrar la merma. Stock disponible: ${stockActual}, solicitado: ${cant}.`);
            }

            const stockResultante = stockActual - cant;
            const costoTotal = (costoUnitario * cant).toFixed(2);

            // C. Insertar en la tabla MERMAS
            const sqlMerma = `
                INSERT INTO MERMAS 
                    (ID_PRODUCTO, CANTIDAD, MOTIVO, JUSTIFICACION, COSTO_UNITARIO, COSTO_TOTAL, ID_EMPLEADO)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [mermaResult] = await connection.query(sqlMerma, [
                id_producto,
                cant,
                motivo,
                justificacion,
                costoUnitario,
                costoTotal,
                id_empleado || 11
            ]);

            const idMerma = mermaResult.insertId;

            // D. Si se especificaron series de producto, actualizarlas a 'desechado'
            if (series && Array.isArray(series) && series.length > 0) {
                const placeholders = series.map(() => '?').join(',');
                await connection.query(
                    `UPDATE PRODUCTO_SERIES 
                     SET ESTADO = 'desechado', NOTAS = CONCAT(COALESCE(NOTAS, ''), ' [Merma #', ?, ' - ', ?, ']')
                     WHERE ID_PRODUCTO = ? AND NUMERO_SERIE IN (${placeholders})`,
                    [idMerma, motivo, id_producto, ...series]
                );
            }

            // E. Registrar salida en MOVIMIENTOS_STOCK
            const motivoStock = `Merma #${idMerma} (${motivo}): ${justificacion.substring(0, 150)}`;
            const sqlStock = `
                INSERT INTO MOVIMIENTOS_STOCK 
                    (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE, ID_EMPLEADO)
                VALUES (?, ?, 'salida', ?, ?, ?, ?)
            `;
            await connection.query(sqlStock, [
                id_producto,
                producto.NOMBRE_PRODUCTO,
                motivoStock,
                cant,
                stockResultante,
                id_empleado || 11
            ]);

            await connection.commit();
            return {
                id_merma: idMerma,
                id_producto,
                nombre_producto: producto.NOMBRE_PRODUCTO,
                cantidad: cant,
                costo_total: costoTotal,
                stock_resultante: stockResultante
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = MermasModel;
