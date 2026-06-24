const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');

// Registrar nuevas series
router.post('/', seriesController.registrar);

// Obtener series de un producto (todas)
router.get('/:id_producto', seriesController.obtenerPorProducto);

// Obtener solo series disponibles de un producto
router.get('/:id_producto/disponibles', seriesController.obtenerDisponibles);

// Eliminar una serie específica (solo si está en stock)
router.delete('/:id_serie', seriesController.eliminar);

module.exports = router;
