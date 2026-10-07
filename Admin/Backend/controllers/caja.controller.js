/**
 * @file caja.controller.js
 * @description Controlador para endpoints del Módulo de Caja (CU-27, CU-28, CU-29).
 */

const CajaModel = require('../models/caja.model');
const Auditoria = require('../models/auditoria.model');

const CajaController = {
    /**
     * GET /api/caja/estado
     * Consulta el estado actual de la caja (si está ABIERTA o CERRADA) y su balance en tiempo real
     */
    getEstadoActual: async (req, res) => {
        try {
            const id_empleado = req.query.id_empleado || null;
            const sesionActiva = await CajaModel.obtenerSesionActiva(id_empleado);
            res.json({
                abierta: !!sesionActiva,
                sesion: sesionActiva
            });
        } catch (err) {
            console.error('Error en getEstadoActual caja:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * POST /api/caja/abrir
     * CU-27: Apertura de caja con fondo inicial
     */
    abrir: async (req, res) => {
        try {
            let { id_empleado, monto_inicial } = req.body;
            id_empleado = id_empleado || req.userId || 1;

            const nuevaSesion = await CajaModel.abrirCaja({ id_empleado, monto_inicial });

            // Registrar auditoría
            await Auditoria.registrar({
                id_empleado,
                accion: 'APERTURA_CAJA',
                tabla: 'CAJA_SESIONES',
                id_registro: nuevaSesion.id_caja_sesion,
                detalle: `Apertura de turno de caja con fondo inicial de C$ ${parseFloat(monto_inicial).toFixed(2)}.`
            });

            res.status(201).json({
                mensaje: 'Caja abierta exitosamente. Turno operativo.',
                sesion: nuevaSesion
            });
        } catch (err) {
            console.error('Error al abrir caja:', err);
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * POST /api/caja/movimiento
     * CU-28: Registrar ingreso extraordinario o egreso de dinero
     */
    registrarMovimiento: async (req, res) => {
        try {
            let { id_caja_sesion, id_empleado, tipo_movimiento, concepto, monto } = req.body;
            id_empleado = id_empleado || req.userId || 1;

            if (!id_caja_sesion || !tipo_movimiento || !monto) {
                return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el movimiento de caja.' });
            }

            const nuevoMov = await CajaModel.registrarMovimiento({
                id_caja_sesion,
                id_empleado,
                tipo_movimiento,
                concepto,
                monto
            });

            // Registrar auditoría
            await Auditoria.registrar({
                id_empleado,
                accion: `MOVIMIENTO_CAJA_${nuevoMov.tipo_movimiento}`,
                tabla: 'CAJA_MOVIMIENTOS',
                id_registro: nuevoMov.id_movimiento_caja,
                detalle: `${nuevoMov.tipo_movimiento}: C$ ${parseFloat(monto).toFixed(2)} - Concepto: "${concepto}"`
            });

            res.status(201).json({
                mensaje: `${nuevoMov.tipo_movimiento === 'INGRESO' ? 'Ingreso' : 'Salida'} de dinero registrada correctamente.`,
                movimiento: nuevoMov
            });
        } catch (err) {
            console.error('Error al registrar movimiento en caja:', err);
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * POST /api/caja/cerrar
     * CU-29: Conciliación, arqueo y cierre formal de caja
     */
    cerrar: async (req, res) => {
        try {
            let { id_caja_sesion, id_empleado, monto_real, observaciones } = req.body;
            id_empleado = id_empleado || req.userId || 1;

            if (!id_caja_sesion || monto_real === undefined || monto_real === null) {
                return res.status(400).json({ error: 'Debe especificar el ID de sesión y el monto físico contado.' });
            }

            const resultadoCierre = await CajaModel.cerrarCaja({
                id_caja_sesion,
                id_empleado,
                monto_real,
                observaciones
            });

            // Registrar auditoría
            const estadoDiferencia = resultadoCierre.diferencia === 0 
                ? 'Cuadre Exacto' 
                : (resultadoCierre.diferencia < 0 ? `Faltante de C$ ${Math.abs(resultadoCierre.diferencia).toFixed(2)}` : `Sobrante de C$ ${resultadoCierre.diferencia.toFixed(2)}`);

            await Auditoria.registrar({
                id_empleado,
                accion: 'CIERRE_CAJA',
                tabla: 'CAJA_SESIONES',
                id_registro: id_caja_sesion,
                detalle: `Cierre de caja. Esperado: C$ ${resultadoCierre.monto_esperado.toFixed(2)}, Contado: C$ ${resultadoCierre.monto_real.toFixed(2)}. ${estadoDiferencia}.`
            });

            res.json({
                mensaje: 'Caja cerrada y conciliada exitosamente.',
                cierre: resultadoCierre
            });
        } catch (err) {
            console.error('Error al cerrar caja:', err);
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * GET /api/caja/historial
     * Listado histórico de turnos para auditoría
     */
    getHistorial: async (req, res) => {
        try {
            const { limite, fecha_inicio, fecha_fin } = req.query;
            const historial = await CajaModel.obtenerHistorial({
                limite: limite || 50,
                fecha_inicio,
                fecha_fin
            });
            res.json(historial);
        } catch (err) {
            console.error('Error al obtener historial de caja:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /api/caja/sesion/:id
     * Detalle completo de una sesión específica
     */
    getDetalleSesion: async (req, res) => {
        try {
            const { id } = req.params;
            const resumen = await CajaModel.obtenerResumenSesion(id);
            res.json(resumen);
        } catch (err) {
            console.error('Error al obtener resumen de sesión:', err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = CajaController;
