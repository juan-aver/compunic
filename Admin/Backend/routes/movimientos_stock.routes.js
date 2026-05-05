/**
 * @file movimientos_stock.routes.js
 * @description Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// routes/movimientos_stock.routes.js

const express = require('express');
const router = express.Router();
const movimientosStockController = require('../controllers/movimientos_stock.controller');

// Ruta para registrar un movimiento genérico (entrada, salida, o modificación)
router.post('/', movimientosStockController.registrarMovimiento);

// Ruta para obtener el historial completo
router.get('/', movimientosStockController.obtenerHistorial);

module.exports = router;
