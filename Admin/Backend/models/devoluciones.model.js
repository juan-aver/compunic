/*
 * ==========================================
 * MÓDULO: devoluciones.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const db = require('../config/db');

const Devoluciones = {
    // Obtener todas las devoluciones con información de venta y producto
    obtenerTodas: async () => {
        try {
            const sql = `
        SELECT 
          d.ID_DEVOLUCION,
          d.ID_VENTA,
          d.ID_PRODUCTO,
          d.CANTIDAD,
          d.MOTIVO,
          d.ACCION,
          d.FECHA_DEVOLUCION,
          CONCAT('FAC-V', LPAD(v.ID_VENTA, 3, '0')) AS FACTURA,
          p.NOMBRE_PRODUCTO,
          vp.cantidad_neta AS CANTIDAD_VENDIDA
        FROM DEVOLUCIONES d
        INNER JOIN VENTAS v ON d.ID_VENTA = v.ID_VENTA
        INNER JOIN PRODUCTOS p ON d.ID_PRODUCTO = p.ID_PRODUCTO
        LEFT JOIN VENTAS_PRODUCTOS vp ON d.ID_VENTA = vp.ID_VENTA AND d.ID_PRODUCTO = vp.ID_PRODUCTO
        ORDER BY d.FECHA_DEVOLUCION DESC
      `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener devoluciones: ' + err.message);
        }
    },

    // Obtener una devolución por ID
    obtenerPorId: async (id) => {
        try {
            const sql = `
        SELECT 
          d.*,
          CONCAT('FAC-V', LPAD(v.ID_VENTA, 3, '0')) AS FACTURA,
          p.NOMBRE_PRODUCTO
        FROM DEVOLUCIONES d
        INNER JOIN VENTAS v ON d.ID_VENTA = v.ID_VENTA
        INNER JOIN PRODUCTOS p ON d.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE d.ID_DEVOLUCION = ?
      `;
            const [rows] = await db.query(sql, [id]);
            return rows[0];
        } catch (err) {
            throw new Error('Error al obtener devolución por ID: ' + err.message);
        }
    },

    // Obtener productos de una venta específica
    obtenerProductosDeVenta: async (idVenta) => {
        try {
            const sql = `
        SELECT
            vp.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                vp.cantidad_neta AS CANTIDAD_VENDIDA,
                    COALESCE(SUM(d.CANTIDAD), 0) AS CANTIDAD_DEVUELTA,
                        (vp.cantidad_neta - COALESCE(SUM(d.CANTIDAD), 0)) AS CANTIDAD_DISPONIBLE
        FROM VENTAS_PRODUCTOS vp
        INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
        LEFT JOIN DEVOLUCIONES d ON vp.ID_VENTA = d.ID_VENTA AND vp.ID_PRODUCTO = d.ID_PRODUCTO
        WHERE vp.ID_VENTA = ?
                GROUP BY vp.ID_PRODUCTO, p.NOMBRE_PRODUCTO, vp.cantidad_neta
        HAVING CANTIDAD_DISPONIBLE > 0
                `;
            const [rows] = await db.query(sql, [idVenta]);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener productos de venta: ' + err.message);
        }
    },

    // Validar que la cantidad a devolver no exceda lo vendido
    validarCantidadDevolucion: async (idVenta, idProducto, cantidadDevolver) => {
        try {
            const sql = `
            SELECT
            vp.cantidad_neta AS CANTIDAD_VENDIDA,
                COALESCE(SUM(d.CANTIDAD), 0) AS CANTIDAD_YA_DEVUELTA
        FROM VENTAS_PRODUCTOS vp
        LEFT JOIN DEVOLUCIONES d ON vp.ID_VENTA = d.ID_VENTA AND vp.ID_PRODUCTO = d.ID_PRODUCTO
        WHERE vp.ID_VENTA = ? AND vp.ID_PRODUCTO = ?
                GROUP BY vp.cantidad_neta
      `;
            const [rows] = await db.query(sql, [idVenta, idProducto]);

            if (rows.length === 0) {
                return { valido: false, mensaje: 'Producto no encontrado en esta venta' };
            }

            const cantidadVendida = rows[0].CANTIDAD_VENDIDA;
            const cantidadYaDevuelta = rows[0].CANTIDAD_YA_DEVUELTA;
            const cantidadDisponible = cantidadVendida - cantidadYaDevuelta;

            if (cantidadDevolver > cantidadDisponible) {
                return {
                    valido: false,
                    mensaje: `Cantidad excede lo disponible.Vendido: ${cantidadVendida}, Ya devuelto: ${cantidadYaDevuelta}, Disponible: ${cantidadDisponible} `
                };
            }

            return { valido: true, cantidadDisponible };
        } catch (err) {
            throw new Error('Error al validar cantidad: ' + err.message);
        }
    },

    // Crear una nueva devolución
    crear: async (datos) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id_venta, id_producto, cantidad, motivo, accion } = datos;

            // 1. Insertar la devolución
            const sqlInsert = `
        INSERT INTO DEVOLUCIONES(ID_VENTA, ID_PRODUCTO, CANTIDAD, MOTIVO, ACCION)
            VALUES(?, ?, ?, ?, ?)
      `;
            const [result] = await connection.query(sqlInsert, [
                id_venta,
                id_producto,
                cantidad,
                motivo,
                accion
            ]);

            const idDevolucion = result.insertId;

            // 2. Obtener información del producto para el registro
            const [prodInfo] = await connection.query(
                'SELECT NOMBRE_PRODUCTO FROM PRODUCTOS WHERE ID_PRODUCTO = ?',
                [id_producto]
            );
            const nombreProducto = prodInfo[0]?.NOMBRE_PRODUCTO || 'Producto';

            // 3. Obtener factura de la venta
            const [ventaInfo] = await connection.query(
                "SELECT CONCAT('FAC-V', LPAD(ID_VENTA, 3, '0')) AS FACTURA FROM VENTAS WHERE ID_VENTA = ?",
                [id_venta]
            );
            const factura = ventaInfo[0]?.FACTURA || `FAC-V${String(id_venta).padStart(3, '0')}`;

            // 4. Obtener stock actual del producto (calculado)
            const [stockInfo] = await connection.query(
                `SELECT (
                    COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
                    COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = ?), 0)
                ) AS stock_actual`,
                [id_producto, id_producto]
            );
            const stockActual = stockInfo[0]?.stock_actual || 0;

            // 5. Registrar movimiento de salida (producto de reemplazo)
            const stockDespuesSalida = stockActual - cantidad;
            await connection.query(
                `INSERT INTO MOVIMIENTOS_STOCK 
         (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE)
         VALUES (?, ?, 'salida', ?, ?, ?)`,
                [
                    id_producto,
                    nombreProducto,
                    `Devolución ${factura} - Producto de reemplazo. Motivo: ${motivo}`,
                    cantidad,
                    stockDespuesSalida
                ]
            );

            // 6. Si es reingreso, registrar entrada (producto reparado vuelve al stock)
            if (accion === 'reingreso') {
                // Calcular stock después de la entrada (usamos stockDespuesSalida + cantidad)
                const stockDespuesEntrada = stockDespuesSalida + cantidad;

                // Registrar movimiento de entrada (producto reparado)
                await connection.query(
                    `INSERT INTO MOVIMIENTOS_STOCK 
           (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE)
           VALUES (?, ?, 'entrada', ?, ?, ?)`,
                    [
                        id_producto,
                        nombreProducto,
                        `Devolución ${factura} - Producto reparado reingresa al stock`,
                        cantidad,
                        stockDespuesEntrada
                    ]
                );
            }

            await connection.commit();
            return idDevolucion;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    // Actualizar una devolución
    actualizar: async (id, datos) => {
        try {
            const { motivo, accion } = datos;
            const sql = `
        UPDATE DEVOLUCIONES 
        SET MOTIVO = ?, ACCION = ?
                WHERE ID_DEVOLUCION = ?
                    `;
            const [result] = await db.query(sql, [motivo, accion, id]);
            return result;
        } catch (err) {
            throw new Error('Error al actualizar devolución: ' + err.message);
        }
    },

    // Eliminar una devolución
    eliminar: async (id) => {
        try {
            const sql = 'DELETE FROM DEVOLUCIONES WHERE ID_DEVOLUCION = ?';
            const [result] = await db.query(sql, [id]);
            return result;
        } catch (err) {
            throw new Error('Error al eliminar devolución: ' + err.message);
        }
    }
};

module.exports = Devoluciones;
