/*
 * Módulo: store.routes.js
 * Descripción: Rutas para las funciones de la tienda.
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

// Obtener estado de pago de un pedido
router.get('/pedidos/:id/estado', pedidosController.obtenerEstado);

// Subir comprobante de pago (multipart/form-data, campo "comprobante")
router.post('/pedidos/:id/comprobante', pedidosController.subirComprobante);

// Validar stock disponible
router.get('/validar-stock/:id/:cantidad', pedidosController.validarStock);

module.exports = router;
