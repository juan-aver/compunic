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
        const { notas } = req.body;

        try {
            // Obtener datos del pedido
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

            // Actualizar estado
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

            await db.query(
                "UPDATE VENTAS SET ESTADO = 'Rechazado' WHERE ID_VENTA = ?",
                [id]
            );

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
