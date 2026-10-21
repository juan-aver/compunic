/**
 * @file divisas.routes.js
 * @description Rutas para el servicio de conversión de divisas.
 */

const express = require('express');
const router = express.Router();
const DivisasController = require('../controllers/divisas.controller');

// GET /api/divisas/tasa - Consultar tasa del día
router.get('/tasa', DivisasController.getTasa);

// POST /api/divisas/convertir - Convertir monto entre C$ y USD
router.post('/convertir', DivisasController.convertir);

// PUT /api/divisas/tasa - Modificar tasa manualmente
router.put('/tasa', DivisasController.setTasa);

module.exports = router;
