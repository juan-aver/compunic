/*
 * ==========================================
 * MÓDULO: administradores.routes.js
 * PROPÓSITO: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * FECHA: 8 de abril de 2026
 * ==========================================

 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/administradores.controller.js');

router.get('/buscar', controlador.buscar);
router.get('/', controlador.listar);
router.post('/', controlador.agregar);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
