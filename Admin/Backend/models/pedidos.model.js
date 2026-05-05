/*
 * ==========================================
 * MÓDULO: pedidos.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// models/pedidos.model.js
// Modelo para gestionar pedidos desde la tienda web

const db = require('../config/db');
const movimientosStockModel = require('./movimientos_stock.model');
const invoiceService = require('../services/invoice.service');
const emailService = require('../services/email.service');

const Pedidos = {
    /**
     * Crear un nuevo pedido desde la tienda web
     * @param {Object} datosCliente - Información del cliente
     * @param {Array} productos - Lista de productos del pedido
     * @returns {Object} Datos del pedido creado
     */
    crearPedido: async (datosCliente, productos) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Verificar stock disponible para todos los productos
            for (const item of productos) {
                const [stockResult] = await connection.query(`
          SELECT 
            (
              COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
              COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = ?), 0)
            ) AS stock_disponible
        `, [item.id_producto, item.id_producto]);

                const stockDisponible = stockResult[0].stock_disponible;

                if (stockDisponible < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ID ${item.id_producto}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`);
                }
            }

            // 2. Obtener o crear vendedor "Tienda Web"
            let idVendedor;

            // Buscar vendedor "Tienda Web"
            const [vendedorWeb] = await connection.query(`
                SELECT v.ID_VENDEDOR 
                FROM VENDEDOR v
                JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID
                WHERE e.NOMBRE = 'Tienda' AND e.APELLIDO = 'Web'
            `);

            if (vendedorWeb.length > 0) {
                idVendedor = vendedorWeb[0].ID_VENDEDOR;
            } else {
                // Crear empleado "Tienda Web"
                const [resultEmpleado] = await connection.query(`
                    INSERT INTO EMPLEADOS (NOMBRE, APELLIDO, SEXO, F_NACIMIENTO)
                    VALUES ('Tienda', 'Web', 'O', '2000-01-01')
                `);

                const idEmpleado = resultEmpleado.insertId;

                // Crear vendedor "Tienda Web"
                const [resultVendedor] = await connection.query(`
                    INSERT INTO VENDEDOR (AREA, HORARIO, TELEFONO, EMAIL, ID_EMPLEADO)
                    VALUES ('Tienda Web', '24/7', 'N/A', 'tiendaweb@compunic.com', ?)
                `, [idEmpleado]);

                idVendedor = resultVendedor.insertId;
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

            // 4. Calcular total
            const total = productos.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

            // 5. Generar número de factura automático
            const timestamp = Date.now();
            const facturaTemp = `WEB-${timestamp}`;

            // 6. Crear venta con vendedor "Tienda Web"
            const [resultVenta] = await connection.query(`
                INSERT INTO VENTAS (FECHA, TOTAL, ID_VENDEDOR, ID_CLIENTE, FACTURA)
                VALUES (NOW(), ?, ?, ?, ?)
            `, [total, idVendedor, idCliente, facturaTemp]);

            const idVenta = resultVenta.insertId;

            // 7. Insertar productos de la venta
            for (const item of productos) {
                const subtotal = item.precio_unitario * item.cantidad;

                await connection.query(`
                    INSERT INTO VENTAS_PRODUCTOS (ID_VENTA, ID_PRODUCTO, cantidad_neta, precio_venta, sub_total)
                    VALUES (?, ?, ?, ?, ?)
                `, [idVenta, item.id_producto, item.cantidad, item.precio_unitario, subtotal]);
            }

            // 8. Actualizar FACTURA con el ID real de la venta
            const facturaFinal = `WEB-${String(idVenta).padStart(6, '0')}`;
            await connection.query(`
                UPDATE VENTAS SET FACTURA = ? WHERE ID_VENTA = ?
            `, [facturaFinal, idVenta]);

            // 9. Commit de la transacción
            await connection.commit();

            // 10. Registrar movimientos de stock para cada producto vendido
            for (const item of productos) {
                // Calcular stock resultante después de la venta
                const [stockResult] = await db.query(`
                    SELECT 
                        (
                            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
                            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = ?), 0)
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
                    `Venta Factura: ${facturaFinal}`,
                    item.cantidad,
                    stockResultante
                );
            }

            // 11. Generar número de pedido
            const numeroPedido = `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(idVenta).padStart(4, '0')}`;

            // 12. Enviar factura por email (sin bloquear la creación del pedido)
            try {
                // Obtener información completa de los productos para la factura
                const productosParaFactura = [];
                for (const item of productos) {
                    const [producto] = await db.query(
                        'SELECT NOMBRE_PRODUCTO FROM PRODUCTOS WHERE ID_PRODUCTO = ?',
                        [item.id_producto]
                    );

                    productosParaFactura.push({
                        nombre: producto[0]?.NOMBRE_PRODUCTO || 'Producto',
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.precio_unitario * item.cantidad
                    });
                }

                // Generar PDF de la factura
                const invoiceData = {
                    factura: facturaFinal,
                    fecha: new Date(),
                    cliente: {
                        nombre: datosCliente.nombre,
                        email: datosCliente.email,
                        telefono: datosCliente.telefono
                    },
                    productos: productosParaFactura,
                    total: total
                };

                const pdfBuffer = await invoiceService.generateInvoicePDF(invoiceData);

                // Enviar email con la factura
                await emailService.sendInvoiceEmail(
                    datosCliente.email,
                    datosCliente.nombre,
                    facturaFinal,
                    pdfBuffer,
                    total
                );

                console.log(`✅ Factura ${facturaFinal} enviada por email a ${datosCliente.email}`);
            } catch (emailError) {
                // No bloquear la creación del pedido si falla el email
                console.error('⚠️ Error al enviar factura por email (pedido creado exitosamente):', emailError.message);
            }

            return {
                id_venta: idVenta,
                numero_pedido: numeroPedido,
                factura: facturaFinal,
                total: total,
                id_cliente: idCliente,
                id_vendedor: idVendedor
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
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = ?), 0)
          ) AS stock_disponible
      `, [idProducto, idProducto]);

            return result[0].stock_disponible >= cantidad;
        } catch (error) {
            console.error('Error al validar stock:', error);
            throw error;
        }
    }
};

module.exports = Pedidos;
