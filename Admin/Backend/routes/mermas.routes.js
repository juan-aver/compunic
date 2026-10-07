/*
 * ==================================================================================
 * MÓDULO: mermas.routes.js
 * PROPÓSITO: Rutas para la gestión de mermas y pérdidas de inventario (REQ-FR-05)
 * ==================================================================================
 */
const express = require('express');
const router = express.Router();
const mermasController = require('../controllers/mermas.controller');

// Rutas de Mermas
router.get('/', mermasController.getAll);
router.get('/:id', mermasController.getById);
router.get('/producto/:id', mermasController.getByProducto);
router.post('/', mermasController.create);

module.exports = router;
