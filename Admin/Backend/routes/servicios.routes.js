/*
 * Módulo: servicios.routes.js
 * Descripción: Rutas para gestionar los servicios técnicos.
 */
const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');

router.get('/', serviciosController.getAll);
router.get('/mis-servicios', serviciosController.getMisServicios);
router.get('/tipos', serviciosController.getTipos);
router.get('/estados', serviciosController.getEstados);
router.get('/:id', serviciosController.getById);
router.post('/', serviciosController.upload.single('evidencia'), serviciosController.create);
router.put('/:id', serviciosController.upload.single('evidencia'), serviciosController.update);
router.put('/:id/estado', serviciosController.updateEstado);
router.put('/:id/iniciar', serviciosController.iniciar);
router.put('/:id/pausar', serviciosController.pausar);
router.post('/:id/finalizar', serviciosController.upload.single('evidencia'), serviciosController.finalizar);
router.post('/:id/evidencia', serviciosController.upload.single('evidencia'), serviciosController.subirEvidencia);
router.post('/:id/calificacion', serviciosController.calificarServicio);
router.delete('/:id', serviciosController.delete);

module.exports = router;
