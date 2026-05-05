/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: vendedores.routes.js
 * Descripción: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/vendedores.controller.js');

router.get('/buscar', controlador.buscar);
router.get('/', controlador.listar);
router.post('/', controlador.agregar);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;