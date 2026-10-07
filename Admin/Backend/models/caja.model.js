/**
 * @file caja.model.js
 * @description Modelo para gestión de Caja Chica, Turnos, Movimientos y Arqueo (CU-27, CU-28, CU-29).
 * Cumple con REQ-FR-47, REQ-FR-48, REQ-FR-52, REQ-FR-53, REQ-FR-54.
 */

const db = require('../config/db');

const CajaModel = {
    /**
     * Obtiene la sesión de caja actualmente abierta (por empleado o la global activa)
     */
    obtenerSesionActiva: async () => {
        const sql = `
            SELECT cs.*, 
                   CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_CAJERO,
                   e.USERNAME AS USERNAME_CAJERO
            FROM CAJA_SESIONES cs
            JOIN EMPLEADOS e ON cs.ID_EMPLEADO = e.ID_EMPLEADO
            WHERE cs.ESTADO = 'ABIERTA'
            ORDER BY cs.ID_CAJA_SESION DESC LIMIT 1
        `;
        const [rows] = await db.query(sql);
        if (rows.length === 0) return null;

        const sesion = rows[0];
        const resumen = await CajaModel.obtenerResumenSesion(sesion.ID_CAJA_SESION);
        return { ...sesion, ...resumen };
    },

    /**
     * Obtiene los cálculos y totales en tiempo real de una sesión específica
     */
    obtenerResumenSesion: async (id_caja_sesion) => {
        // 1. Obtener la sesión
        const [sesionRows] = await db.query(
            `SELECT * FROM CAJA_SESIONES WHERE ID_CAJA_SESION = ?`,
            [id_caja_sesion]
        );
        if (sesionRows.length === 0) throw new Error('Sesión de caja no encontrada');
        const sesion = sesionRows[0];

        const fechaInicio = sesion.FECHA_APERTURA;
        const fechaFin = sesion.FECHA_CIERRE || new Date();

        // 2. Movimientos manuales (Ingresos y Egresos)
        const [movimientos] = await db.query(
            `SELECT cm.*, CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_EMPLEADO
             FROM CAJA_MOVIMIENTOS cm
             JOIN EMPLEADOS e ON cm.ID_EMPLEADO = e.ID_EMPLEADO
             WHERE cm.ID_CAJA_SESION = ?
             ORDER BY cm.FECHA_HORA DESC`,
            [id_caja_sesion]
        );

        let totalIngresosManuales = 0;
        let totalEgresosManuales = 0;
        for (const m of movimientos) {
            const monto = parseFloat(m.MONTO) || 0;
            if (m.TIPO_MOVIMIENTO === 'INGRESO') {
                totalIngresosManuales += monto;
            } else if (m.TIPO_MOVIMIENTO === 'EGRESO') {
                totalEgresosManuales += monto;
            }
        }

        // 3. Ventas realizadas durante el turno (por método de pago)
        const [ventas] = await db.query(
            `SELECT v.ID_VENTA, v.FACTURA, v.FECHA, v.TOTAL, v.METODO_PAGO_TEXT,
                    COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS CLIENTE,
                    CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS VENDEDOR
             FROM VENTAS v
             LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
             LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
             WHERE v.FECHA >= ? AND v.FECHA <= ?
               AND v.ESTADO != 'Rechazado'
             ORDER BY v.FECHA DESC`,
            [fechaInicio, fechaFin]
        );

        let totalVentasEfectivo = 0;
        let totalVentasTarjeta = 0;
        let totalVentasTransferencia = 0;
        let totalVentasGeneral = 0;

        for (const v of ventas) {
            const total = parseFloat(v.TOTAL) || 0;
            totalVentasGeneral += total;
            const metodo = (v.METODO_PAGO_TEXT || '').toLowerCase();
            if (metodo.includes('tarjeta')) {
                totalVentasTarjeta += total;
            } else if (metodo.includes('transferencia')) {
                totalVentasTransferencia += total;
            } else {
                // Por defecto contado/efectivo
                totalVentasEfectivo += total;
            }
        }

        const montoInicial = parseFloat(sesion.MONTO_INICIAL) || 0;
        // Saldo teórico que debe haber físicamente en efectivo en la gaveta
        const saldoEsperadoEfectivo = montoInicial + totalVentasEfectivo + totalIngresosManuales - totalEgresosManuales;

        return {
            monto_inicial: montoInicial,
            total_ingresos_manuales: totalIngresosManuales,
            total_egresos_manuales: totalEgresosManuales,
            total_ventas_efectivo: totalVentasEfectivo,
            total_ventas_tarjeta: totalVentasTarjeta,
            total_ventas_transferencia: totalVentasTransferencia,
            total_ventas_general: totalVentasGeneral,
            saldo_esperado_efectivo: saldoEsperadoEfectivo,
            cantidad_ventas: ventas.length,
            movimientos,
            ventas
        };
    },

    /**
     * CU-27: Abrir un nuevo turno de caja declarando fondo inicial
     */
    abrirCaja: async ({ id_empleado, monto_inicial }) => {
        // Validar que no haya una caja ya abierta por este empleado o en general
        const [activas] = await db.query(
            `SELECT ID_CAJA_SESION, ID_EMPLEADO FROM CAJA_SESIONES WHERE ESTADO = 'ABIERTA'`
        );

        if (activas.length > 0) {
            throw new Error('Ya existe una sesión de caja activa en el sistema. Debe cerrar el turno anterior antes de iniciar uno nuevo.');
        }

        const monto = parseFloat(monto_inicial);
        if (isNaN(monto) || monto < 0) {
            throw new Error('El fondo inicial de caja debe ser una cantidad numérica válida mayor o igual a 0.');
        }

        const [result] = await db.query(
            `INSERT INTO CAJA_SESIONES (ID_EMPLEADO, MONTO_INICIAL, ESTADO, FECHA_APERTURA)
             VALUES (?, ?, 'ABIERTA', NOW())`,
            [id_empleado, monto]
        );

        return {
            id_caja_sesion: result.insertId,
            monto_inicial: monto,
            fecha_apertura: new Date()
        };
    },

    /**
     * CU-28: Registrar un movimiento extraordinario de caja (Ingreso o Egreso)
     */
    registrarMovimiento: async ({ id_caja_sesion, id_empleado, tipo_movimiento, concepto, monto }) => {
        const tipo = (tipo_movimiento || '').toUpperCase();
        if (!['INGRESO', 'EGRESO'].includes(tipo)) {
            throw new Error('El tipo de movimiento debe ser INGRESO o EGRESO.');
        }

        const cantidad = parseFloat(monto);
        if (isNaN(cantidad) || cantidad <= 0) {
            throw new Error('El monto del movimiento debe ser un valor numérico mayor a cero.');
        }

        if (!concepto || concepto.trim().length === 0) {
            throw new Error('Debe especificar un concepto o justificación para este movimiento.');
        }

        // Validar que la caja esté abierta
        const [sesionRows] = await db.query(
            `SELECT * FROM CAJA_SESIONES WHERE ID_CAJA_SESION = ? AND ESTADO = 'ABIERTA'`,
            [id_caja_sesion]
        );
        if (sesionRows.length === 0) {
            throw new Error('La sesión de caja no existe o ya ha sido cerrada.');
        }

        // Si es EGRESO, validar que haya fondos suficientes en efectivo en caja
        if (tipo === 'EGRESO') {
            const resumen = await CajaModel.obtenerResumenSesion(id_caja_sesion);
            if (cantidad > resumen.saldo_esperado_efectivo) {
                throw new Error(`Fondos insuficientes en caja para registrar esta salida. Efectivo disponible: C$ ${resumen.saldo_esperado_efectivo.toFixed(2)}, solicitado: C$ ${cantidad.toFixed(2)}.`);
            }
        }

        const [result] = await db.query(
            `INSERT INTO CAJA_MOVIMIENTOS (ID_CAJA_SESION, ID_EMPLEADO, TIPO_MOVIMIENTO, CONCEPTO, MONTO, FECHA_HORA)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [id_caja_sesion, id_empleado, tipo, concepto.trim(), cantidad]
        );

        return {
            id_movimiento_caja: result.insertId,
            id_caja_sesion,
            tipo_movimiento: tipo,
            concepto: concepto.trim(),
            monto: cantidad,
            fecha_hora: new Date()
        };
    },

    /**
     * CU-29: Arqueo y cierre definitivo de turno de caja
     */
    cerrarCaja: async ({ id_caja_sesion, id_empleado, monto_real, observaciones }) => {
        const contado = parseFloat(monto_real);
        if (isNaN(contado) || contado < 0) {
            throw new Error('Debe ingresar un monto de efectivo físico contado válido (puede ser 0.00).');
        }

        const [sesionRows] = await db.query(
            `SELECT * FROM CAJA_SESIONES WHERE ID_CAJA_SESION = ? AND ESTADO = 'ABIERTA'`,
            [id_caja_sesion]
        );
        if (sesionRows.length === 0) {
            throw new Error('La sesión de caja indicada no existe o ya se encuentra cerrada.');
        }

        // Calcular saldo esperado
        const resumen = await CajaModel.obtenerResumenSesion(id_caja_sesion);
        const montoEsperado = resumen.saldo_esperado_efectivo;
        const diferencia = contado - montoEsperado;

        // Si hay faltante o sobrante, se requiere observación según especificación
        if (Math.abs(diferencia) >= 0.01 && (!observaciones || observaciones.trim().length === 0)) {
            throw new Error(`Hay una diferencia de C$ ${diferencia.toFixed(2)} (${diferencia < 0 ? 'Faltante' : 'Sobrante'}). Es obligatorio ingresar una justificación u observación.`);
        }

        await db.query(
            `UPDATE CAJA_SESIONES
             SET FECHA_CIERRE = NOW(),
                 MONTO_ESPERADO = ?,
                 MONTO_REAL = ?,
                 DIFERENCIA = ?,
                 ESTADO = 'CERRADA',
                 OBSERVACIONES = ?
             WHERE ID_CAJA_SESION = ?`,
            [
                montoEsperado,
                contado,
                diferencia,
                observaciones ? observaciones.trim() : 'Cierre sin observaciones.',
                id_caja_sesion
            ]
        );

        return {
            id_caja_sesion,
            fecha_cierre: new Date(),
            monto_inicial: resumen.monto_inicial,
            total_ventas_efectivo: resumen.total_ventas_efectivo,
            total_ventas_tarjeta: resumen.total_ventas_tarjeta,
            total_ventas_transferencia: resumen.total_ventas_transferencia,
            total_ingresos_manuales: resumen.total_ingresos_manuales,
            total_egresos_manuales: resumen.total_egresos_manuales,
            monto_esperado: montoEsperado,
            monto_real: contado,
            diferencia: diferencia,
            observaciones: observaciones || '',
            estado: 'CERRADA'
        };
    },

    /**
     * Historial de sesiones de caja (para auditoría administrativa)
     */
    obtenerHistorial: async ({ limite = 50, fecha_inicio = null, fecha_fin = null }) => {
        let sql = `
            SELECT cs.*,
                   CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_CAJERO,
                   e.USERNAME AS USERNAME_CAJERO
            FROM CAJA_SESIONES cs
            JOIN EMPLEADOS e ON cs.ID_EMPLEADO = e.ID_EMPLEADO
            WHERE 1=1
        `;
        const params = [];

        if (fecha_inicio) {
            sql += ` AND cs.FECHA_APERTURA >= ?`;
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            sql += ` AND cs.FECHA_APERTURA <= ?`;
            params.push(fecha_fin + ' 23:59:59');
        }

        sql += ` ORDER BY cs.ID_CAJA_SESION DESC LIMIT ?`;
        params.push(parseInt(limite, 10));

        const [rows] = await db.query(sql, params);
        return rows;
    }
};

module.exports = CajaModel;
