/*
 * ==========================================
 * MÓDULO: marcas.routes.js
 * PROPÓSITO: Rutas para gestionar las marcas de productos.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/marcas.controller.js');

router.get('/', controlador.listar);
router.post('/', controlador.agregar);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
