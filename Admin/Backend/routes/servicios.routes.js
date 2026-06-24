/*
 * Módulo: servicios.routes.js
 * Descripción: Rutas para gestionar los servicios técnicos.
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
router.put('/:id/estado', serviciosController.updateEstado);
router.delete('/:id', serviciosController.delete);

module.exports = router;
