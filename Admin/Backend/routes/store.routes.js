/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: store.routes.js
 * Descripción: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// routes/store.routes.js
// Rutas públicas para la tienda web

const express = require('express');
const router = express.Router();
const controller = require('../controllers/store.controller');
const pedidosController = require('../controllers/pedidos.controller');

// Obtener catálogo de productos (con filtros opcionales)
router.get('/productos', controller.obtenerProductos);

// Obtener detalle de un producto específico
router.get('/productos/:id', controller.obtenerProducto);

// Obtener categorías disponibles
router.get('/categorias', controller.obtenerCategorias);

// Obtener marcas disponibles
router.get('/marcas', controller.obtenerMarcas);

// Crear un nuevo pedido
router.post('/pedidos', pedidosController.crearPedido);

// Obtener detalles de un pedido
router.get('/pedidos/:id', pedidosController.obtenerPedido);

// Validar stock disponible
router.get('/validar-stock/:id/:cantidad', pedidosController.validarStock);

module.exports = router;
