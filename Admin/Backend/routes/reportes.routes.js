/*
 * Módulo: reportes.routes.js
 * Descripción: Rutas API para generación y exportación de reportes en Compunic.
 */
const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');

router.get('/financiero', ReportesController.getFinanciero);
router.get('/ventas', ReportesController.getVentas);
router.get('/stock', ReportesController.getStock);
router.get('/servicios', ReportesController.getServicios);
router.get('/exportar/pdf', ReportesController.exportarPdf);

module.exports = router;
