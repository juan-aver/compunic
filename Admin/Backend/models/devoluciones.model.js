/*
 * ==========================================
 * MÓDULO: devoluciones.model.js
 * PROPÓSITO: Consultas SQL de devoluciones.
 * FECHA: 8 de abril de 2026

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
          d.ACCION,
          d.REINGRESO_CONFIRMADO,
          d.NUMERO_SERIE,
          d.FECHA_DEVOLUCION,
          COALESCE(v.FACTURA, CONCAT('FAC-V', LPAD(v.ID_VENTA, 3, '0'))) AS FACTURA,
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
          COALESCE(v.FACTURA, CONCAT('FAC-V', LPAD(v.ID_VENTA, 3, '0'))) AS FACTURA,
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

            const { id_venta, id_producto, cantidad, motivo, accion, numero_serie, id_producto_reemplazo, series_reemplazo } = datos;

            // 0. Validar números de serie ingresados
            if (numero_serie) {
                const seriesArray = numero_serie.split(',').map(s => s.trim()).filter(s => s);
                if (seriesArray.length > cantidad) {
                    throw new Error(`Se ingresaron más series (${seriesArray.length}) que la cantidad a devolver (${cantidad}).`);
                }
                if (seriesArray.length > 0) {
                    const placeholders = seriesArray.map(() => '?').join(',');
                    const [rows] = await connection.query(
                        `SELECT NUMERO_SERIE FROM PRODUCTO_SERIES WHERE ID_PRODUCTO = ? AND NUMERO_SERIE IN (${placeholders}) AND ESTADO = 'vendido'`,
                        [id_producto, ...seriesArray]
                    );
                    const foundSeries = rows.map(r => r.NUMERO_SERIE);
                    const notFound = seriesArray.filter(s => !foundSeries.includes(s));
                    if (notFound.length > 0) {
                        throw new Error(`Las siguientes series no existen o no están marcadas como vendidas para este producto: ${notFound.join(', ')}`);
                    }
                }
            }

            // 1. Insertar la devolución
            const sqlInsert = `
        INSERT INTO DEVOLUCIONES(ID_VENTA, ID_PRODUCTO, CANTIDAD, MOTIVO, ACCION, NUMERO_SERIE, ID_PRODUCTO_REEMPLAZO, SERIES_REEMPLAZO)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `;
            const [result] = await connection.query(sqlInsert, [
                id_venta,
                id_producto,
                cantidad,
                motivo,
                accion,
                numero_serie || null,
                id_producto_reemplazo,
                series_reemplazo || null
            ]);

            const idDevolucion = result.insertId;

            // 1.5 Actualizar PRODUCTO_SERIES del equipo devuelto si se proporcionó un número de serie
            if (numero_serie) {
                const seriesArray = numero_serie.split(',').map(s => s.trim()).filter(s => s);
                if (seriesArray.length > 0) {
                    const placeholders = seriesArray.map(() => '?').join(',');
                    await connection.query(
                        `UPDATE PRODUCTO_SERIES 
                         SET ESTADO = 'devuelto', ID_DEVOLUCION = ?, CONDICION = 'Seminuevo' 
                         WHERE ID_PRODUCTO = ? AND NUMERO_SERIE IN (${placeholders})`,
                        [idDevolucion, id_producto, ...seriesArray]
                    );
                }
            }

            // 1.8 Actualizar PRODUCTO_SERIES del equipo de reemplazo entregado
            if (series_reemplazo) {
                const sReemplazoArray = series_reemplazo.split(',').map(s => s.trim()).filter(s => s);
                if (sReemplazoArray.length > 0) {
                    const placeholdersR = sReemplazoArray.map(() => '?').join(',');
                    await connection.query(
                        `UPDATE PRODUCTO_SERIES 
                         SET ESTADO = 'vendido', ID_VENTA = ?, NOTAS = CONCAT(COALESCE(NOTAS, ''), ' | Entregado como reemplazo de garantía') 
                         WHERE ID_PRODUCTO = ? AND NUMERO_SERIE IN (${placeholdersR})`,
                        [id_venta, id_producto_reemplazo, ...sReemplazoArray]
                    );
                }
            }

            // 2. Obtener información del producto de reemplazo para el registro
            const [prodInfo] = await connection.query(
                'SELECT NOMBRE_PRODUCTO FROM PRODUCTOS WHERE ID_PRODUCTO = ?',
                [id_producto_reemplazo]
            );
            const nombreProductoReemplazo = prodInfo[0]?.NOMBRE_PRODUCTO || 'Producto de Reemplazo';

            // 3. Obtener factura de la venta
            const [ventaInfo] = await connection.query(
                "SELECT FACTURA FROM VENTAS WHERE ID_VENTA = ?",
                [id_venta]
            );
            const factura = ventaInfo[0]?.FACTURA || `FAC-V${String(id_venta).padStart(3, '0')}`;

            // 4. Obtener stock actual del producto de reemplazo (calculado)
            const [stockInfo] = await connection.query(
                `SELECT (
                    COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
                    COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0) -
                    COALESCE((SELECT SUM(d.CANTIDAD) FROM DEVOLUCIONES d WHERE d.ID_PRODUCTO_REEMPLAZO = ?), 0)
                ) AS stock_actual`,
                [id_producto_reemplazo, id_producto_reemplazo, id_producto_reemplazo]
            );
            const stockActual = stockInfo[0]?.stock_actual || 0;

            // 5. Registrar movimiento de salida (producto de reemplazo)
            const stockDespuesSalida = stockActual; // Ya está descontado por la consulta dinámica anterior si asume el INSERT previo, PERO espera, la consulta anterior se ejecuta DESPUES del insert?
            // El INSERT a DEVOLUCIONES ya ocurrió, así que la suma de devoluciones ya incluye esta cantidad.
            // Por lo tanto, stock_actual YA TIENE la resta hecha!
            
            await connection.query(
                `INSERT INTO MOVIMIENTOS_STOCK 
         (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE)
         VALUES (?, ?, 'salida', ?, ?, ?)`,
                [
                    id_producto_reemplazo,
                    nombreProductoReemplazo,
                    `Devolución ${factura} - Equipo de reemplazo entregado al cliente`,
                    cantidad,
                    stockDespuesSalida
                ]
            );

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

    // Confirmar reingreso al stock (clonando producto como Seminuevo)
    confirmarReingreso: async (id, precio_seminuevo, id_garantia) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener datos de la devolución y del producto original
            const [devRows] = await connection.query(
                `SELECT d.ID_PRODUCTO, d.CANTIDAD, d.REINGRESO_CONFIRMADO, d.NUMERO_SERIE,
                        p.NOMBRE_PRODUCTO, p.MODELO, p.DESCRIPCION, p.PRECIO_COMPRA, p.IMAGEN_URL, p.ID_MARCA, p.ID_PROVEEDOR, p.ACTIVO,
                        COALESCE(v.FACTURA, CONCAT('FAC-V', LPAD(v.ID_VENTA, 3, '0'))) AS FACTURA
                 FROM DEVOLUCIONES d
                 INNER JOIN PRODUCTOS p ON d.ID_PRODUCTO = p.ID_PRODUCTO
                 INNER JOIN VENTAS v ON d.ID_VENTA = v.ID_VENTA
                 WHERE d.ID_DEVOLUCION = ? AND d.ACCION = 'reingreso'`,
                [id]
            );

            if (devRows.length === 0) {
                throw new Error('Devolución no encontrada o no es de tipo reingreso');
            }

            if (devRows[0].REINGRESO_CONFIRMADO === 1) {
                throw new Error('Este reingreso ya fue confirmado anteriormente');
            }

            const devolucion = devRows[0];
            const nombreSeminuevo = `${devolucion.NOMBRE_PRODUCTO} (Seminuevo)`;

            // 2. Verificar/Crear Categoría "Seminuevos"
            let idCategoriaSeminuevo = null;
            const [catRows] = await connection.query("SELECT ID_CATEGORIA FROM CATEGORIAS WHERE NOMBRE_CATEGORIA = 'Seminuevos' LIMIT 1");
            if (catRows.length > 0) {
                idCategoriaSeminuevo = catRows[0].ID_CATEGORIA;
            } else {
                const [newCat] = await connection.query("INSERT INTO CATEGORIAS (NOMBRE_CATEGORIA) VALUES ('Seminuevos')");
                idCategoriaSeminuevo = newCat.insertId;
            }

            // 3. Buscar si el producto Seminuevo ya existe
            const [prodSeminuevoRows] = await connection.query(
                "SELECT ID_PRODUCTO FROM PRODUCTOS WHERE NOMBRE_PRODUCTO = ? LIMIT 1",
                [nombreSeminuevo]
            );

            let targetProductId = null;

            if (prodSeminuevoRows.length > 0) {
                // Actualizar producto existente
                targetProductId = prodSeminuevoRows[0].ID_PRODUCTO;
                const updateQueries = [];
                const updateParams = [];
                if (precio_seminuevo) {
                    updateQueries.push("PRECIO_VENTA = ?");
                    updateParams.push(precio_seminuevo);
                }
                if (id_garantia) {
                    updateQueries.push("ID_GARANTIAS = ?");
                    updateParams.push(id_garantia);
                }
                if (updateQueries.length > 0) {
                    updateParams.push(targetProductId);
                    await connection.query(`UPDATE PRODUCTOS SET ${updateQueries.join(', ')} WHERE ID_PRODUCTO = ?`, updateParams);
                }
            } else {
                // Crear nuevo producto Seminuevo clonado
                const [newProd] = await connection.query(
                    `INSERT INTO PRODUCTOS (NOMBRE_PRODUCTO, MODELO, DESCRIPCION, PRECIO_COMPRA, PRECIO_VENTA, ID_MARCA, ID_GARANTIAS, ID_PROVEEDOR, IMAGEN_URL, ACTIVO)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        nombreSeminuevo, 
                        devolucion.MODELO, 
                        devolucion.DESCRIPCION, 
                        devolucion.PRECIO_COMPRA, 
                        precio_seminuevo || 0, 
                        devolucion.ID_MARCA, 
                        id_garantia || null, 
                        devolucion.ID_PROVEEDOR, 
                        devolucion.IMAGEN_URL, 
                        devolucion.ACTIVO
                    ]
                );
                targetProductId = newProd.insertId;

                // Asignar a la categoría Seminuevos
                await connection.query(
                    "INSERT INTO PRODUCTO_CATEGORIA (ID_PRODUCTO, ID_CATEGORIA) VALUES (?, ?)",
                    [targetProductId, idCategoriaSeminuevo]
                );
            }

            // Calcular nuevo stock resultante para el targetProductId
            const [stockInfo] = await connection.query(
                `SELECT (
                    COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) -
                    COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0) +
                    COALESCE((SELECT SUM(d2.CANTIDAD) FROM DEVOLUCIONES d2 WHERE d2.ID_PRODUCTO = ? AND d2.ACCION = 'reingreso' AND d2.REINGRESO_CONFIRMADO = 1), 0) +
                    COALESCE((SELECT SUM(CANTIDAD) FROM MOVIMIENTOS_STOCK ms WHERE ms.ID_PRODUCTO = ? AND TIPO_MOVIMIENTO='entrada'), 0) -
                    COALESCE((SELECT SUM(CANTIDAD) FROM MOVIMIENTOS_STOCK ms WHERE ms.ID_PRODUCTO = ? AND TIPO_MOVIMIENTO='salida'), 0)
                ) AS stock_actual`,
                [targetProductId, targetProductId, targetProductId, targetProductId, targetProductId]
            );
            // Esto es complicado porque el clon no tiene compras ni ventas. 
            // Mejor calculamos basándonos en movimientos previos puros, o lo evitamos y simplemente forzamos el registro del movimiento de stock.
            // Para mantener compatibilidad, el stock_actual será lo que devuelva más la cantidad.
            const stockActual = stockInfo[0]?.stock_actual ?? 0;
            const stockNuevo = Number(stockActual) + Number(devolucion.CANTIDAD);

            // 4. Registrar entrada en MOVIMIENTOS_STOCK (auditoría) hacia el NUEVO producto
            await connection.query(
                `INSERT INTO MOVIMIENTOS_STOCK
                 (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE)
                 VALUES (?, ?, 'entrada', ?, ?, ?)`,
                [
                    targetProductId,
                    nombreSeminuevo,
                    `Reingreso confirmado - Dev #${id} - ${devolucion.FACTURA} - Producto reparado/seminuevo`,
                    devolucion.CANTIDAD,
                    stockNuevo
                ]
            );

            // 5. Marcar como confirmado en DEVOLUCIONES y enlazar al producto clonado
            await connection.query(
                'UPDATE DEVOLUCIONES SET REINGRESO_CONFIRMADO = 1, ID_PRODUCTO_SEMINUEVO = ? WHERE ID_DEVOLUCION = ?',
                [targetProductId, id]
            );

            // 6. Cambiar el estado de las series devueltas hacia el nuevo producto "Seminuevo"
            if (devolucion.NUMERO_SERIE) {
                const seriesArray = devolucion.NUMERO_SERIE.split(',').map(s => s.trim()).filter(s => s);
                if (seriesArray.length > 0) {
                    const placeholders = seriesArray.map(() => '?').join(',');
                    // Mueve la serie al nuevo producto, actualiza estado a 'en_stock' y CONDICION a 'Seminuevo'
                    await connection.query(
                        `UPDATE PRODUCTO_SERIES 
                         SET ESTADO = 'en_stock', CONDICION = 'Seminuevo', ID_PRODUCTO = ? 
                         WHERE ID_DEVOLUCION = ? AND NUMERO_SERIE IN (${placeholders})`,
                        [targetProductId, id, ...seriesArray]
                    );
                }
            } else {
                // Si no hay series específicas ingresadas en la devolución, intentamos mover todas las de ese ID_DEVOLUCION (como fallback)
                await connection.query(
                    `UPDATE PRODUCTO_SERIES 
                     SET ESTADO = 'en_stock', CONDICION = 'Seminuevo', ID_PRODUCTO = ? 
                     WHERE ID_DEVOLUCION = ?`,
                    [targetProductId, id]
                );
            }

            await connection.commit();
            return { id_producto: targetProductId, nombre: nombreSeminuevo, cantidad: devolucion.CANTIDAD, stock_nuevo: stockNuevo };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
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
