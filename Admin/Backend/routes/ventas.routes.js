/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: ventas.routes.js
 * Descripción: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
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

// Ruta para crear una nueva venta
router.post('/', ventasController.create);

module.exports = router;