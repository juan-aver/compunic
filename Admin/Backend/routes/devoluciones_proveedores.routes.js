/*
 * Módulo: devoluciones_proveedores.routes.js
 * Descripción: Rutas para el módulo de devoluciones a proveedores (REQ-FR-31).
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/devoluciones_proveedores.controller');

// Obtener todas las devoluciones a proveedores
router.get('/', controller.getAll);

// Obtener compras de un proveedor para asociar factura
router.get('/compras/:idProveedor', controller.getComprasPorProveedor);

// Obtener detalle por ID
router.get('/:id', controller.getById);

// Registrar nueva devolución a proveedor
router.post('/', controller.create);

// Actualizar estado de resolución (Pendiente, Aprobada, Rechazada, Reemplazo_Recibido, Reembolso_Recibido)
router.patch('/:id/estado', controller.updateEstado);

module.exports = router;
