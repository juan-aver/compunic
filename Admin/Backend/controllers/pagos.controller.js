/**
 * @file pagos.controller.js
 * @description Controlador Admin para gestión y verificación de pagos de la Tienda Web.
 * Permite aprobar o rechazar comprobantes de pago subidos por los clientes.
 */

const db = require('../config/db');
const emailService = require('../services/email.service');

const pagosController = {

    /**
     * Obtener todos los pedidos de la tienda web con su estado de pago
     * GET /api/admin/pagos
     */
    listarPedidos: async (req, res) => {
        try {
            const { estado = 'PENDIENTE', limit = 50, offset = 0 } = req.query;

            let whereClause = "WHERE v.ORIGEN = 'TIENDA_WEB'";
            const params = [];

            if (estado !== 'TODOS') {
                whereClause += " AND v.ESTADO_PAGO = ?";
                params.push(estado);
            }

            const [pedidos] = await db.query(`
                SELECT
                    v.ID_VENTA,
                    v.FACTURA,
                    v.FECHA,
                    v.TOTAL,
                    v.ESTADO_PAGO,
                    v.METODO_PAGO,
                    v.NOTAS_PAGO,
                    CONCAT(c.NOMBRE, ' ', COALESCE(c.APELLIDO,'')) AS nombre_cliente,
                    c.EMAIL  AS email_cliente,
                    c.TELEFONO AS telefono_cliente,
                    cp.ID_COMPROBANTE,
                    cp.RUTA_IMAGEN,
                    cp.FECHA_SUBIDA,
                    cp.NOTAS_CLIENTE
                FROM VENTAS v
                INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN COMPROBANTES_PAGO cp ON cp.ID_VENTA = v.ID_VENTA
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
                SELECT ESTADO_PAGO, COUNT(*) AS total
                FROM VENTAS
                WHERE ORIGEN = 'TIENDA_WEB'
                GROUP BY ESTADO_PAGO
            `);

            const resumen = { PENDIENTE: 0, VERIFICANDO: 0, CONFIRMADO: 0, RECHAZADO: 0 };
            rows.forEach(r => { resumen[r.ESTADO_PAGO] = r.total; });

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
        const { notas } = req.body;

        try {
            // Obtener datos del pedido
            const [[pedido]] = await db.query(`
                SELECT v.*, CONCAT(c.NOMBRE,' ',COALESCE(c.APELLIDO,'')) AS nombre_cliente, c.EMAIL
                FROM VENTAS v INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ? AND v.ORIGEN = 'TIENDA_WEB'
            `, [id]);

            if (!pedido) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            if (pedido.ESTADO_PAGO === 'CONFIRMADO') {
                return res.status(400).json({ success: false, error: 'El pedido ya está confirmado' });
            }

            // Actualizar estado
            await db.query(
                "UPDATE VENTAS SET ESTADO_PAGO = 'CONFIRMADO', NOTAS_PAGO = ? WHERE ID_VENTA = ?",
                [notas || null, id]
            );

            // Notificar al cliente por email (sin bloquear)
            try {
                await emailService.sendPagoConfirmadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    pedido.FACTURA,
                    parseFloat(pedido.TOTAL),
                    pedido.METODO_PAGO || ''
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
                WHERE v.ID_VENTA = ? AND v.ORIGEN = 'TIENDA_WEB'
            `, [id]);

            if (!pedido) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            await db.query(
                "UPDATE VENTAS SET ESTADO_PAGO = 'RECHAZADO', NOTAS_PAGO = ? WHERE ID_VENTA = ?",
                [motivo, id]
            );

            // Notificar al cliente
            try {
                await emailService.sendPagoRechazadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    pedido.FACTURA,
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
     * Marcar como "Verificando" — estado intermedio
     * POST /api/admin/pagos/:id/verificando
     */
    marcarVerificando: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query(
                "UPDATE VENTAS SET ESTADO_PAGO = 'VERIFICANDO' WHERE ID_VENTA = ? AND ORIGEN = 'TIENDA_WEB'",
                [id]
            );
            res.json({ success: true, mensaje: 'Pedido marcado como en verificación' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Confirmar pago en físico (efectivo en tienda) sin comprobante
     * POST /api/admin/pagos/:id/confirmar-fisico
     */
    confirmarPagoFisico: async (req, res) => {
        const { id } = req.params;
        const { notas } = req.body;

        try {
            const [[pedido]] = await db.query(`
                SELECT v.*, CONCAT(c.NOMBRE,' ',COALESCE(c.APELLIDO,'')) AS nombre_cliente, c.EMAIL
                FROM VENTAS v INNER JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                WHERE v.ID_VENTA = ? AND v.ORIGEN = 'TIENDA_WEB'
            `, [id]);

            if (!pedido) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            if (pedido.ESTADO_PAGO === 'CONFIRMADO') {
                return res.status(400).json({ success: false, error: 'El pedido ya está confirmado' });
            }

            const notaFinal = notas || 'Pago recibido en efectivo en tienda física.';

            // Marcar como CONFIRMADO con nota del admin
            await db.query(
                "UPDATE VENTAS SET ESTADO_PAGO = 'CONFIRMADO', NOTAS_PAGO = ? WHERE ID_VENTA = ?",
                [notaFinal, id]
            );

            // Notificar al cliente indicando que es pago en físico
            try {
                await emailService.sendPagoConfirmadoEmail(
                    pedido.EMAIL,
                    pedido.nombre_cliente,
                    pedido.FACTURA,
                    parseFloat(pedido.TOTAL),
                    pedido.METODO_PAGO || 'Pago en tienda'
                );
            } catch (emailErr) {
                console.warn('⚠️ No se pudo enviar email de confirmación física:', emailErr.message);
            }

            res.json({ success: true, mensaje: 'Pago físico confirmado y cliente notificado' });
        } catch (error) {
            console.error('Error en confirmarPagoFisico:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = pagosController;
