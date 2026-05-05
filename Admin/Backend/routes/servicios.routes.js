/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: servicios.routes.js
 * Descripción: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');

router.get('/', serviciosController.getAll);
router.get('/tipos', serviciosController.getTipos);
router.get('/estados', serviciosController.getEstados);
router.get('/:id', serviciosController.getById);
router.post('/', serviciosController.create);
router.put('/:id', serviciosController.update);
router.delete('/:id', serviciosController.delete);

module.exports = router;
