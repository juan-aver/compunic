/**
 * @file proveedores.routes.js
 * @description Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/proveedores.controller.js');

router.get('/buscar', controlador.buscar);
router.get('/', controlador.listar);           // Obtener todos los proveedores
router.post('/', controlador.crear);           // Crear un nuevo proveedor
router.put('/:id', controlador.actualizar);    // Actualizar un proveedor
router.delete('/:id', controlador.eliminar);   // Eliminar un proveedor

module.exports = router;