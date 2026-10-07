/*
 * Módulo: cotizaciones.routes.js
 * Descripción: Rutas para gestión de proformas y cotizaciones comerciales.
 */
const express = require('express');
const router = express.Router();
const cotizacionesController = require('../controllers/cotizaciones.controller');

// Obtener todas las cotizaciones
router.get('/', cotizacionesController.getAll);

// Obtener una cotización por ID con sus productos
router.get('/:id', cotizacionesController.getById);

// Crear una nueva cotización / proforma (REQ-FR-19, REQ-FR-20, UR-08)
router.post('/', cotizacionesController.create);

// Actualizar estado de una cotización
router.patch('/:id/estado', cotizacionesController.updateEstado);

module.exports = router;
