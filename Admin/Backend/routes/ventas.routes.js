/*
 * Módulo: ventas.routes.js
 * Descripción: Rutas para gestionar el registro de ventas.
 */
const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller.js');

// Ruta para obtener todas las ventas
// GET http://localhost:3001/api/ventas
router.get('/', ventasController.findAll);

// Ruta para obtener una venta específica por ID
// GET http://localhost:3001/api/ventas/:id
router.get('/:id', ventasController.findById);

// Ruta para obtener ventas de un vendedor específico por SP
// GET http://localhost:3001/api/ventas/vendedor/:id
router.get('/vendedor/:id', ventasController.findByVendedor);

// Ruta para crear una nueva venta
router.post('/', ventasController.create);

module.exports = router;