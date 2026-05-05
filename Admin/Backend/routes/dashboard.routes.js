/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: dashboard.routes.js
 * Descripción: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Estadísticas del dashboard
router.get('/ingresos-mes', dashboardController.getIngresosMes);
router.get('/servicios-pendientes', dashboardController.getServiciosPendientes);
router.get('/stock-critico', dashboardController.getStockCritico);
router.get('/clientes-nuevos', dashboardController.getClientesNuevos);
router.get('/ventas-vs-costos', dashboardController.getVentasVsCostos);
router.get('/stock-por-categoria', dashboardController.getStockPorCategoria);

module.exports = router;
