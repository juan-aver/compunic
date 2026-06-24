/*
 * ==========================================
 * MÓDULO: clientes.routes.js
 * PROPÓSITO: Rutas para gestionar clientes.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/clientes.controller.js');

router.get('/buscar', controlador.buscar);
router.get('/', controlador.listar);
router.post('/rapido', controlador.agregarRapido); // Registro rápido de cliente por SP
router.post('/', controlador.agregar);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);
router.put('/:id/activar', controlador.activar);

module.exports = router;