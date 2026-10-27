/**
 * @file devoluciones.routes.js
 * @description Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const express = require('express');
const router = express.Router();
const devolucionesController = require('../controllers/devoluciones.controller');

// Ruta para obtener todas las devoluciones
// GET http://localhost:3001/api/devoluciones
router.get('/', devolucionesController.findAll);

// Ruta para obtener productos de una venta (DEBE IR ANTES de /:id)
// GET http://localhost:3001/api/devoluciones/venta/:idVenta/productos
router.get('/venta/:idVenta/productos', devolucionesController.getProductosPorVenta);

// Ruta para obtener devolución por ID
// GET http://localhost:3001/api/devoluciones/:id
router.get('/:id', devolucionesController.findById);

// Ruta para crear una nueva devolución
// POST http://localhost:3001/api/devoluciones
router.post('/', devolucionesController.create);

// Ruta para actualizar una devolución
// PUT http://localhost:3001/api/devoluciones/:id
router.put('/:id', devolucionesController.update);

// Ruta para confirmar reingreso al stock
// POST http://localhost:3001/api/devoluciones/:id/confirmar-reingreso
router.post('/:id/confirmar-reingreso', devolucionesController.confirmarReingreso);

// Ruta para autorizar solicitud de devolución
// POST http://localhost:3001/api/devoluciones/:id/autorizar
router.post('/:id/autorizar', devolucionesController.autorizar);

// Ruta para rechazar solicitud de devolución
// POST http://localhost:3001/api/devoluciones/:id/rechazar
router.post('/:id/rechazar', devolucionesController.rechazar);

// Ruta para completar devolución con reemplazo
// POST http://localhost:3001/api/devoluciones/:id/completar
router.post('/:id/completar', devolucionesController.completar);

// Ruta para eliminar una devolución
// DELETE http://localhost:3001/api/devoluciones/:id
router.delete('/:id', devolucionesController.delete);

module.exports = router;

