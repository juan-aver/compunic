/*
 * Módulo: dashboard.routes.js
 * Descripción: Rutas para acceder a los datos del panel de control.
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
router.get('/servicios-por-estado', dashboardController.getServiciosPorEstado);

// Nuevas estadísticas de negocio
router.get('/top-cliente', dashboardController.getTopCliente);
router.get('/producto-mas-vendido', dashboardController.getProductoMasVendido);
router.get('/producto-menos-vendido', dashboardController.getProductoMenosVendido);

module.exports = router;
