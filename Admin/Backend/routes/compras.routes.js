/*
 * ==========================================
 * MÓDULO: compras.routes.js
 * PROPÓSITO: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// routes/compras.routes.js
const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');

// Obtener todas las compras
router.get('/', comprasController.getCompras);

// Crear nueva compra
router.post('/', comprasController.createCompra);

// Obtener detalles de una compra
router.get('/:id/detalles', comprasController.getDetalleCompra);

module.exports = router;