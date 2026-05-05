/**
 * @file garantias.routes.js
 * @description Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/garantias.controller.js');

console.log("DEBUG: Loading garantias.routes.js");
router.get('/', (req, res, next) => {
    console.log("DEBUG: Request received at /api/garantias/");
    next();
}, controlador.listar);
router.get('/buscar', controlador.buscar);
router.get('/tipos', controlador.listarTipos);
router.get('/estados', controlador.listarEstados);
router.post('/', controlador.agregar);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
