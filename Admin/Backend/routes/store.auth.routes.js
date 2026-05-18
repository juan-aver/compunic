// routes/store.auth.routes.js
const express = require('express');
const router = express.Router();
const storeAuthController = require('../controllers/store.auth.controller');

// Rutas públicas
router.post('/register', storeAuthController.register);
router.post('/login', storeAuthController.login);

// Rutas protegidas (requieren token)
router.get('/me', storeAuthController.getProfile);
router.get('/compras', storeAuthController.getHistorialCompras);

module.exports = router;
