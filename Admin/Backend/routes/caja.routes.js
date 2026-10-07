/**
 * @file caja.routes.js
 * @description Rutas para el módulo de Caja (CU-27, CU-28, CU-29).
 */

const express = require('express');
const router = express.Router();
const CajaController = require('../controllers/caja.controller');

router.get('/estado', CajaController.getEstadoActual);
router.post('/abrir', CajaController.abrir);
router.post('/movimiento', CajaController.registrarMovimiento);
router.post('/cerrar', CajaController.cerrar);
router.get('/historial', CajaController.getHistorial);
router.get('/sesion/:id', CajaController.getDetalleSesion);

module.exports = router;
