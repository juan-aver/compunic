// routes/store.auth.routes.js
const express = require('express');
const router = express.Router();
const storeAuthController = require('../controllers/store.auth.controller');

// Rutas públicas
router.post('/register', storeAuthController.register);
router.post('/login', storeAuthController.login);

// Recuperación de contraseña (Tienda Web)
router.post('/forgot-password', storeAuthController.forgotPassword);
router.get('/verify-reset-token', storeAuthController.verifyResetToken);
router.post('/reset-password', storeAuthController.resetPassword);

// Rutas protegidas (requieren token)
router.get('/me', storeAuthController.getProfile);
router.get('/compras', storeAuthController.getHistorialCompras);

module.exports = router;
