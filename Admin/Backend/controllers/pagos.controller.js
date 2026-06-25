/**
 * @file pagos.controller.js
 * @description Controlador Admin para gestión y verificación de pagos de la Tienda Web.
 * Permite aprobar o rechazar comprobantes de pago subidos por los clientes.
 */

const db = require('../config/db');
const emailService = require('../services/email.service');
const AuditoriaModel = require('../models/auditoria.model');

const pagosController = {

    /**
     * Obtener todos los pedidos de la tienda web con su estado de pago
     * GET /api/admin/pagos
     */
    listarPedidos: async (req, res) => {
        try {
            const { estado = 'PENDIENTE', limit = 50, offset = 0 } = req.query;

            let whereClause = "WHERE (v.FACTURA IS NULL OR v.FACTURA LIKE 'WEB-%')";
            const params = [];

            if (estado !== 'TODOS') {
                whereClause += " AND v.ESTADO = ?";
                if (estado === 'PENDIENTE') {
                    params.push('Pendiente de Verificacion');
                } else if (estado === 'CONFIRMADO') {
                    params.push('Aprobado');
                } else if (estado === 'RECHAZADO') {
                    params.push('Rechazado');
                } else {
                    params.push(estado);
                }
            }

            const [pedidos] = await db.query(`
                SELECT
                    v.ID_VENTA,
                    v.FACTURA,
                    v.FECHA,
                    v.TOTAL,
                    CASE v.ESTADO
                        WHEN 'Pendiente de Verificacion' THEN 'PENDIENTE'
                        WHEN 'Aprobado' THEN 'CONFIRMADO'
                        WHEN 'Rechazado' THEN 'RECHAZADO'
                        ELSE 'PENDIENTE'
                    END AS ESTADO_PAGO,
                    IF(v.REFERENCIA_BANCARIA IS NOT NULL AND v.REFERENCIA_BANCARIA <> '', 'Transferencia Bancaria', 'Pago en Efectivo (al retirar)') AS METODO_PAGO,
                    v.REFERENCIA_BANCARIA AS NOTAS_PAGO,
                    CONCAT(c.NOMBRE, ' ', COALESCE(c.APELLIDO,'')) AS nombre_cliente,
                    c.EMAIL AS email_cliente,
                    c.TELEFONO AS telefono_cliente,
                    NULL AS ID_COMPROBANTE,
                    v.COMPROBANTE_URL AS RUTA_IMAGEN,
                    v.FECHA AS FECHA_SUBIDA,
                    NULL AS NOTAS_CLIENTE,
                    v.MONTO_ADELANTO,
                    v.REFERENCIA_BANCARIA
                FROM VENTAS v
                INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                ${whereClause}
                ORDER BY v.FECHA DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);

            const [[{ total }]] = await db.query(`
                SELECT COUNT(*) AS total FROM VENTAS v
                ${whereClause}
            `, params);

            res.json({ success: true, total, pedidos });
        } catch (error) {
            console.error('Error en listarPedidos:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Obtener resumen de contadores por estado
     * GET /api/admin/pagos/resumen
     */
    resumenEstados: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT v.ESTADO, COUNT(*) AS total
                FROM VENTAS v
                WHERE (v.FACTURA IS NULL OR v.FACTURA LIKE 'WEB-%')
                GROUP BY v.ESTADO
            `);

            const resumen = { PENDIENTE: 0, VERIFICANDO: 0, CONFIRMADO: 0, RECHAZADO: 0 };
            rows.forEach(r => {
                if (r.ESTADO === 'Pendiente de Verificacion') {
                    resumen.PENDIENTE = r.total;
                } else if (r.ESTADO === 'Aprobado') {
                    resumen.CONFIRMADO = r.total;
                } else if (r.ESTADO === 'Rechazado') {
                    resumen.RECHAZADO = r.total;
                }
            });

            res.json({ success: true, resumen });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Aprobar un pago — cambia estado a CONFIRMADO y notifica al cliente
     * POST /api/admin/pagos/:id/aprobar
     */
    aprobarPago: async (req, res) => {
        const { id } = req.params;
        const { notas, series } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Obtener datos del pedido
            const [[pedido]] = await connection.query(`
                SELECT v.*, CONCAT(c.NOMBRE,' ',COALESCE(c.APELLIDO,'')) AS nombre_cliente, c.EMAIL
                FROM VENTAS v INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ? AND (v.FACTURA IS NULL OR v.FACTURA LIKE 'WEB-%')
            `, [id]);

            if (!pedido) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            if (pedido.ESTADO === 'Aprobado') {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, error: 'El pedido ya está confirmado' });
            }

            const nFactura = `WEB-${String(id).padStart(6, '0')}`;

            // 1. Procesar series si vienen en el body
            if (series && typeof series === 'object') {
                for (const idProducto of Object.keys(series)) {
                    const seriesStr = series[idProducto]; // Ejemplo: "S1,S2"
                    if (seriesStr) {
                        // Actualizar la tabla VENTAS_PRODUCTOS
                        await connection.query(
                            'UPDATE VENTAS_PRODUCTOS SET numeros_serie = ? WHERE ID_VENTA = ? AND ID_PRODUCTO = ?',
                            [seriesStr, id, idProducto]
                        );

                        // Actualizar el estado de las series a 'vendido'
                        const seriesArray = seriesStr.split(',').map(s => s.trim()).filter(s => s);
                        if (seriesArray.length > 0) {
                            const placeholders = seriesArray.map(() => '?').join(',');
                            await connection.query(
                                `UPDATE PRODUCTO_SERIES 
                                 SET ESTADO = 'vendido', ID_VENTA = ? 
                                 WHERE ID_PRODUCTO = ? AND NUMERO_SERIE IN (${placeholders})`,
                                [id, idProducto, ...seriesArray]
                            );
                        }
                    }
                }
            }

            // 2. Actualizar estado
            await connection.query(
                "UPDATE VENTAS SET ESTADO = 'Aprobado', FACTURA = ? WHERE ID_VENTA = ?",
                [nFactura, id]
            );

            await connection.commit();
            connection.release();

            // Registrar auditoría
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'PAGO_APROBADO',
                tabla: 'VENTAS',
                id_registro: id,
                detalle: `Se aprobó el pago del pedido web ID: ${id} (Factura: ${nFactura})`
            }).catch(e => console.error('Audit log error:', e));

            // Notificar al cliente por email (sin bloquear)
            try {
                await emailService.sendPagoConfirmadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    nFactura,
                    parseFloat(pedido.TOTAL),
                    pedido.REFERENCIA_BANCARIA ? 'Transferencia Bancaria' : 'Pago en tienda'
                );
            } catch (emailErr) {
                console.warn('⚠️ No se pudo enviar email de confirmación:', emailErr.message);
            }

            res.json({ success: true, mensaje: 'Pago aprobado y cliente notificado' });
        } catch (error) {
            console.error('Error en aprobarPago:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Rechazar un pago — cambia estado a RECHAZADO y notifica al cliente con motivo
     * POST /api/admin/pagos/:id/rechazar
     */
    rechazarPago: async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || motivo.trim().length < 5) {
            return res.status(400).json({ success: false, error: 'Se requiere un motivo de rechazo (mínimo 5 caracteres)' });
        }

        try {
            const [[pedido]] = await db.query(`
                SELECT v.*, CONCAT(c.NOMBRE,' ',COALESCE(c.APELLIDO,'')) AS nombre_cliente, c.EMAIL
                FROM VENTAS v INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ? AND (v.FACTURA IS NULL OR v.FACTURA LIKE 'WEB-%')
            `, [id]);

            if (!pedido) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            if (pedido.ESTADO === 'Rechazado') {
                return res.status(400).json({ success: false, error: 'Este pedido ya fue rechazado anteriormente' });
            }
            if (pedido.ESTADO === 'Aprobado') {
                return res.status(400).json({ success: false, error: 'No se puede rechazar un pedido que ya fue aprobado' });
            }

            await db.query(
                "UPDATE VENTAS SET ESTADO = 'Rechazado' WHERE ID_VENTA = ?",
                [id]
            );

            // Revertir inventario (registrar ingresos en el historial)
            const [productos] = await db.query(
                "SELECT vp.ID_PRODUCTO, vp.cantidad_neta, vp.sub_total, p.NOMBRE_PRODUCTO FROM VENTAS_PRODUCTOS vp JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO WHERE vp.ID_VENTA = ?",
                [id]
            );

            const movimientosStockModel = require('../models/movimientos_stock.model');
            const facturaNum = pedido.FACTURA || `WEB-${String(id).padStart(6, '0')}`;
            let subtotalCompra = 0;

            for (const item of productos) {
                subtotalCompra += Number(item.sub_total);

                if (item.cantidad_neta > 0) {
                    const [stockResult] = await db.query(`
                        SELECT 
                            (
                                COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = ?), 0) - 
                                COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'), 0)
                            ) AS stock_resultante
                    `, [item.ID_PRODUCTO, item.ID_PRODUCTO]);
                    
                    await movimientosStockModel.registrarMovimiento(
                        item.ID_PRODUCTO,
                        item.NOMBRE_PRODUCTO,
                        'entrada',
                        `Venta Rechazada: ${facturaNum}`,
                        item.cantidad_neta,
                        stockResult[0].stock_resultante
                    );
                }
            }

            // Reembolsar puntos usados y revertir puntos ganados
            if (pedido.ID_CLIENTE) {
                const totalPagado = Number(pedido.TOTAL);
                const descuentoPuntos = Math.max(0, subtotalCompra - totalPagado);
                const puntosUsados = Math.round(descuentoPuntos / 0.10);
                const puntosGanados = Math.floor(totalPagado / 10);
                const deltaPuntos = puntosUsados - puntosGanados;

                if (deltaPuntos !== 0) {
                    await db.query(
                        "UPDATE CLIENTES SET PUNTOS = GREATEST(0, PUNTOS + ?) WHERE ID_CLIENTE = ?",
                        [deltaPuntos, pedido.ID_CLIENTE]
                    );
                }
            }

            // Registrar auditoría
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'PAGO_RECHAZADO',
                tabla: 'VENTAS',
                id_registro: id,
                detalle: `Se rechazó el pago del pedido web ID: ${id}. Motivo: ${motivo}`
            }).catch(e => console.error('Audit log error:', e));

            // Notificar al cliente
            try {
                await emailService.sendPagoRechazadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    pedido.FACTURA || `PED-${id}`,
                    motivo
                );
            } catch (emailErr) {
                console.warn('⚠️ No se pudo enviar email de rechazo:', emailErr.message);
            }

            res.json({ success: true, mensaje: 'Pago rechazado y cliente notificado' });
        } catch (error) {
            console.error('Error en rechazarPago:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Marcar como "Verificando" — obsoleto en el nuevo esquema, se mantiene para compatibilidad
     * POST /api/admin/pagos/:id/verificando
     */
    marcarVerificando: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query(
                "UPDATE VENTAS SET ESTADO = 'Pendiente de Verificacion' WHERE ID_VENTA = ? AND (FACTURA IS NULL OR FACTURA LIKE 'WEB-%')",
                [id]
            );

            // Registrar auditoría
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'PAGO_PENDIENTE',
                tabla: 'VENTAS',
                id_registro: id,
                detalle: `Se marcó el pedido web ID: ${id} como pendiente de verificación`
            }).catch(e => console.error('Audit log error:', e));

            res.json({ success: true, mensaje: 'Pedido marcado como en verificación' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Confirmar pago en físico — obsoleto en el nuevo esquema, se mantiene para compatibilidad
     * POST /api/admin/pagos/:id/confirmar-fisico
     */
    confirmarPagoFisico: async (req, res) => {
        const { id } = req.params;
        const { notas } = req.body;

        try {
            const [[pedido]] = await db.query(`
                SELECT v.*, CONCAT(c.NOMBRE,' ',COALESCE(c.APELLIDO,'')) AS nombre_cliente, c.EMAIL
                FROM VENTAS v INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ? AND (v.FACTURA IS NULL OR v.FACTURA LIKE 'WEB-%')
            `, [id]);

            if (!pedido) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            if (pedido.ESTADO === 'Aprobado') {
                return res.status(400).json({ success: false, error: 'El pedido ya está confirmado' });
            }

            const nFactura = `WEB-${String(id).padStart(6, '0')}`;

            await db.query(
                "UPDATE VENTAS SET ESTADO = 'Aprobado', FACTURA = ? WHERE ID_VENTA = ?",
                [nFactura, id]
            );

            // Registrar auditoría
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'PAGO_APROBADO',
                tabla: 'VENTAS',
                id_registro: id,
                detalle: `Se aprobó en físico el pago del pedido web ID: ${id} (Factura: ${nFactura})`
            }).catch(e => console.error('Audit log error:', e));

            try {
                await emailService.sendPagoConfirmadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    nFactura,
                    parseFloat(pedido.TOTAL),
                    pedido.METODO_PAGO || 'Pago en tienda'
                );
            } catch (emailErr) {
                console.warn('⚠️ No se pudo enviar email de confirmación:', emailErr.message);
            }

            res.json({ success: true, mensaje: 'Pago físico confirmado y cliente notificado' });
        } catch (error) {
            console.error('Error en confirmarPagoFisico:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = pagosController;
