
const path = require('path');
const fs   = require('fs');
const db   = require('../config/db');
const movimientosStockModel = require('./movimientos_stock.model');
const invoiceService = require('../services/invoice.service');
const emailService   = require('../services/email.service');
const AuditoriaModel = require('./auditoria.model');

const Pedidos = {
    /**
     * Crear un nuevo pedido desde la tienda web
     * @param {Object} datosCliente  - Información del cliente
     * @param {Array}  productos     - Lista de productos del pedido
     * @param {number} puntosUsados  - Puntos de fidelidad a descontar
     * @param {string} metodoPago    - Método de pago elegido por el cliente
     * @returns {Object} Datos del pedido creado
     */
    crearPedido: async (datosCliente, productos, puntosUsados = 0, metodoPago = 'Transferencia Bancaria', referencia = null) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Verificar stock disponible para todos los productos
            for (const item of productos) {
                const [stockResult] = await connection.query(`
          SELECT 
            (
              COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
              COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0)
            ) AS stock_disponible
        `, [item.id_producto, item.id_producto]);

                const stockDisponible = stockResult[0].stock_disponible;

                if (stockDisponible < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ID ${item.id_producto}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`);
                }
            }

            // 2. Obtener o crear empleado "Tienda Web"
            let idEmpleadoVenta;

            // Buscar empleado "Tienda Web"
            const [empleadoWeb] = await connection.query(`
                SELECT ID_EMPLEADO 
                FROM EMPLEADOS
                WHERE NOMBRE = 'Tienda' AND APELLIDO = 'Web'
            `);

            if (empleadoWeb.length > 0) {
                idEmpleadoVenta = empleadoWeb[0].ID_EMPLEADO;
            } else {
                // Crear empleado "Tienda Web" como VENDEDOR
                const [resultEmpleado] = await connection.query(`
                    INSERT INTO EMPLEADOS (NOMBRE, APELLIDO, SEXO, F_NACIMIENTO, AREA, HORARIO, ROL, ESTADO, USERNAME)
                    VALUES ('Tienda', 'Web', 'M', '2000-01-01', 'Tienda Web', '24/7', 'VENDEDOR', 1, 'tienda.web')
                `);

                idEmpleadoVenta = resultEmpleado.insertId;
            }

            // 3. Buscar o crear cliente
            let idCliente;

            // Buscar cliente por email
            const [clienteExistente] = await connection.query(
                'SELECT ID_CLIENTE FROM CLIENTES WHERE EMAIL = ?',
                [datosCliente.email]
            );

            if (clienteExistente.length > 0) {
                // Cliente existe, usar su ID
                idCliente = clienteExistente[0].ID_CLIENTE;

                // Actualizar datos del cliente (separar nombre en NOMBRE y APELLIDO)
                const nombreParts = datosCliente.nombre.trim().split(' ');
                const nombre = nombreParts[0] || '';
                const apellido = nombreParts.slice(1).join(' ') || '';

                await connection.query(`
                    UPDATE CLIENTES 
                    SET NOMBRE = ?, APELLIDO = ?, TELEFONO = ?
                    WHERE ID_CLIENTE = ?
                `, [nombre, apellido, datosCliente.telefono, idCliente]);
            } else {
                // Crear nuevo cliente (separar nombre en NOMBRE y APELLIDO)
                const nombreParts = datosCliente.nombre.trim().split(' ');
                const nombre = nombreParts[0] || '';
                const apellido = nombreParts.slice(1).join(' ') || '';

                const [resultCliente] = await connection.query(`
                    INSERT INTO CLIENTES (NOMBRE, APELLIDO, EMAIL, TELEFONO)
                    VALUES (?, ?, ?, ?)
                `, [nombre, apellido, datosCliente.email, datosCliente.telefono]);

                idCliente = resultCliente.insertId;
            }

            // 4. Calcular total y manejar puntos
            const subtotalCompra = productos.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
            const descuentoPuntos = puntosUsados * 0.10;
            const total = Math.max(0, subtotalCompra - descuentoPuntos);

            // Validar que el cliente tenga suficientes puntos si está usando
            if (puntosUsados > 0) {
                const [clienteData] = await connection.query('SELECT PUNTOS FROM CLIENTES WHERE ID_CLIENTE = ?', [idCliente]);
                const puntosActuales = clienteData[0]?.PUNTOS || 0;
                if (puntosUsados > puntosActuales) {
                    throw new Error('El cliente no tiene suficientes puntos para este descuento.');
                }
                
                // Descontar puntos
                await connection.query('UPDATE CLIENTES SET PUNTOS = PUNTOS - ? WHERE ID_CLIENTE = ?', [puntosUsados, idCliente]);
            }

            // Calcular puntos ganados (1 punto por cada 10 C$ del total pagado)
            const puntosGanados = Math.floor(total / 10);
            if (puntosGanados > 0) {
                await connection.query('UPDATE CLIENTES SET PUNTOS = PUNTOS + ? WHERE ID_CLIENTE = ?', [puntosGanados, idCliente]);
            }

            // 5. Crear venta con vendedor "Tienda Web" — estado Pendiente de Verificacion
            const [resultVenta] = await connection.query(`
                INSERT INTO VENTAS (FECHA, TOTAL, ID_EMPLEADO, ID_CLIENTE, FACTURA, ESTADO, TIPO_ENTREGA, DIRECCION_ENVIO, MONTO_ADELANTO, REFERENCIA_BANCARIA)
                VALUES (NOW(), ?, ?, ?, NULL, 'Pendiente de Verificacion', 'Retiro en Tienda', ?, ?, ?)
            `, [total, idEmpleadoVenta, idCliente, datosCliente.direccion || null, total * 0.5, referencia || null]);

            const idVenta = resultVenta.insertId;

            // Registrar auditoría del pedido web recibido (Pago Pendiente)
            AuditoriaModel.registrar({
                id_empleado: idEmpleadoVenta,
                username: 'Tienda Web',
                accion: 'PAGO_PENDIENTE',
                tabla: 'VENTAS',
                id_registro: idVenta,
                detalle: `Se registró un pedido web pendiente de pago por un total de C$ ${total.toFixed(2)}`
            }).catch(e => console.error('Audit log error:', e));

            // 6. Insertar productos de la venta
            for (const item of productos) {
                const subtotal = item.precio_unitario * item.cantidad;

                await connection.query(`
                    INSERT INTO VENTAS_PRODUCTOS (ID_VENTA, ID_PRODUCTO, cantidad_neta, precio_venta, sub_total)
                    VALUES (?, ?, ?, ?, ?)
                `, [idVenta, item.id_producto, item.cantidad, item.precio_unitario, subtotal]);
            }

            // 7. Commit de la transacción
            await connection.commit();

            // 8. Generar número de pedido
            const numeroPedido = `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(idVenta).padStart(4, '0')}`;

            // 9. Registrar movimientos de stock para cada producto vendido
            for (const item of productos) {
                // Calcular stock resultante después de la venta
                const [stockResult] = await db.query(`
                    SELECT 
                        (
                            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
                            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0)
                        ) AS stock_resultante
                `, [item.id_producto, item.id_producto]);

                const stockResultante = stockResult[0].stock_resultante;

                // Obtener nombre del producto
                const [producto] = await db.query(
                    'SELECT NOMBRE_PRODUCTO FROM PRODUCTOS WHERE ID_PRODUCTO = ?',
                    [item.id_producto]
                );

                const nombreProducto = producto[0]?.NOMBRE_PRODUCTO || 'Producto Desconocido';

                // Registrar movimiento de salida
                await movimientosStockModel.registrarMovimiento(
                    item.id_producto,
                    nombreProducto,
                    'salida',
                    `Pedido: ${numeroPedido}`,
                    item.cantidad,
                    stockResultante
                );
            }

            // 10. Enviar email de "Pedido recibido — pendiente de pago" (NO la factura todavía)
            try {
                await emailService.sendPedidoPendienteEmail(
                    datosCliente.email,
                    datosCliente.nombre,
                    numeroPedido,
                    total,
                    metodoPago
                );
                console.log(`✅ Email de pedido pendiente enviado a ${datosCliente.email}`);
            } catch (emailError) {
                console.error('⚠️ Error al enviar email de pedido pendiente:', emailError.message);
            }

            return {
                id_venta: idVenta,
                numero_pedido: numeroPedido,
                factura: null,
                total: total,
                estado_pago: 'PENDIENTE',
                metodo_pago: metodoPago,
                id_cliente: idCliente,
                id_empleado: idEmpleadoVenta
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error al crear pedido:', error);
            console.error('Stack:', error.stack);
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Obtener detalles de un pedido
     * @param {number} idVenta - ID de la venta
     * @returns {Object} Detalles del pedido
     */
    obtenerPedido: async (idVenta) => {
        try {
            // Obtener datos de la venta
            const [venta] = await db.query(`
                SELECT 
                    v.ID_VENTA,
                    v.FECHA AS FECHA_VENTA,
                    v.TOTAL,
                    CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS NOMBRE_CLIENTE,
                    c.EMAIL,
                    c.TELEFONO,
                    '' AS DIRECCION
                FROM VENTAS v
                INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ?
            `, [idVenta]);

            if (venta.length === 0) {
                return null;
            }

            // Obtener productos de la venta
            const [productos] = await db.query(`
        SELECT 
          vp.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          p.MODELO,
          vp.cantidad_neta AS cantidad,
          vp.precio_venta AS precio_unitario,
          vp.sub_total AS subtotal
        FROM VENTAS_PRODUCTOS vp
        INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE vp.ID_VENTA = ?
      `, [idVenta]);

            return {
                ...venta[0],
                productos: productos
            };

        } catch (error) {
            console.error('Error al obtener pedido:', error);
            throw error;
        }
    },

    /**
     * Validar stock disponible para un producto
     * @param {number} idProducto - ID del producto
     * @param {number} cantidad - Cantidad solicitada
     * @returns {boolean} true si hay stock suficiente
     */
    validarStock: async (idProducto, cantidad) => {
        try {
            const [result] = await db.query(`
        SELECT 
          (
            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0)
          ) AS stock_disponible
      `, [idProducto, idProducto]);

            return result[0].stock_disponible >= cantidad;
        } catch (error) {
            console.error('Error al validar stock:', error);
            throw error;
        }
    },

    /**
     * Guardar comprobante de pago subido por el cliente
     * @param {number} idVenta - ID de la venta
     * @param {string} rutaImagen - Ruta relativa del archivo guardado
     * @param {string} nombreArchivo - Nombre original del archivo
     * @param {string} notasCliente - Notas opcionales del cliente
     */
    guardarComprobante: async (idVenta, rutaImagen, nombreArchivo, notasCliente = '') => {
        try {
            // Verificar que la venta existe y es de la tienda web
            const [[venta]] = await db.query(
                "SELECT ID_VENTA, ESTADO FROM VENTAS WHERE ID_VENTA = ? AND (FACTURA IS NULL OR FACTURA LIKE 'WEB-%')",
                [idVenta]
            );

            if (!venta) throw new Error('Pedido no encontrado');
            if (venta.ESTADO === 'Aprobado') throw new Error('El pedido ya fue confirmado');
            if (venta.ESTADO === 'Rechazado')  throw new Error('El pedido fue rechazado, contacta a soporte');

            // Actualizar la columna COMPROBANTE_URL en la tabla VENTAS
            await db.query(
                "UPDATE VENTAS SET COMPROBANTE_URL = ?, ESTADO = 'Pendiente de Verificacion' WHERE ID_VENTA = ?",
                [rutaImagen, idVenta]
            );

            return { ok: true };
        } catch (error) {
            console.error('Error al guardar comprobante:', error);
            throw error;
        }
    },

    /**
     * Obtener estado de pago de un pedido
     * @param {number} idVenta
     */
    obtenerEstadoPedido: async (idVenta) => {
        try {
            const [[row]] = await db.query(
                `SELECT 
                    CASE v.ESTADO
                        WHEN 'Pendiente de Verificacion' THEN 'PENDIENTE'
                        WHEN 'Aprobado' THEN 'CONFIRMADO'
                        WHEN 'Rechazado' THEN 'RECHAZADO'
                        ELSE 'PENDIENTE'
                    END AS ESTADO_PAGO,
                    IF(v.REFERENCIA_BANCARIA IS NOT NULL AND v.REFERENCIA_BANCARIA <> '', 'Transferencia Bancaria', 'Pago en Efectivo (al retirar)') AS METODO_PAGO,
                    v.FACTURA, 
                    v.TOTAL, 
                    v.REFERENCIA_BANCARIA AS NOTAS_PAGO,
                    v.COMPROBANTE_URL IS NOT NULL AS tiene_comprobante
                 FROM VENTAS v
                 WHERE v.ID_VENTA = ?`,
                [idVenta]
            );
            return row || null;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Pedidos;
