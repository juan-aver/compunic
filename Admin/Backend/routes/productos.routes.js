/**
 * @file productos.routes.js
 * @description Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const express = require('express');
const router = express.Router();
const controlador = require('../controllers/productos.controller.js');
const upload = require('../controllers/productos.controller.js').upload;

router.get('/', controlador.listar);   // Obtener todos los productos
router.get('/precio/buscar', controlador.buscarPrecio); // Buscar precio de producto por SP
router.post('/', upload.single('imagen'), controlador.crear);   // Crear un nuevo producto con imagen
router.put('/:id', upload.single('imagen'), controlador.actualizar);  // Actualizar un producto con imagen
router.delete('/:id', controlador.eliminar);  // Eliminar un producto

module.exports = router;
