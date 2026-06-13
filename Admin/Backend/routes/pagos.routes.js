/**
 * @file pagos.routes.js
 * @description Rutas para gestión admin de pagos de la tienda web.
 */

const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');

// Resumen de contadores por estado
router.get('/resumen', pagosController.resumenEstados);

// Listar pedidos (con filtro por estado: PENDIENTE, VERIFICANDO, CONFIRMADO, RECHAZADO, TODOS)
router.get('/', pagosController.listarPedidos);

// Aprobar pago (transferencia / comprobante)
router.post('/:id/aprobar', pagosController.aprobarPago);

// Confirmar pago en físico / efectivo (sin comprobante, pago en tienda)
router.post('/:id/confirmar-fisico', pagosController.confirmarPagoFisico);

// Rechazar pago
router.post('/:id/rechazar', pagosController.rechazarPago);

// Marcar en verificación
router.post('/:id/verificando', pagosController.marcarVerificando);

module.exports = router;

