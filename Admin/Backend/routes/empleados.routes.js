const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleados.controller');

// Rutas para Vendedores
router.get('/vendedores', empleadosController.obtenerVendedores);
router.get('/vendedores/buscar/:termino', empleadosController.buscarVendedores);

// Rutas para Administradores
router.get('/administradores', empleadosController.obtenerAdministradores);
router.get('/administradores/buscar/:termino', empleadosController.buscarAdministradores);

// Rutas para Temporales
router.get('/temporales', empleadosController.obtenerTemporales);
router.get('/temporales/buscar/:termino', empleadosController.buscarTemporales);

// Rutas Generales de CRUD (Sirven para todos, se diferencian por el 'rol' que venga en el body)
router.get('/', empleadosController.obtenerTodos);
router.get('/buscar/:termino', empleadosController.buscarTodos);
router.post('/', empleadosController.agregarEmpleado);
router.put('/:id', empleadosController.actualizarEmpleado);
router.delete('/:id', empleadosController.eliminarEmpleado);
router.patch('/:id/estado', empleadosController.cambiarEstado);

module.exports = router;
