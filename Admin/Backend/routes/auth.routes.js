/*
 * ==========================================
 * MÓDULO: auth.routes.js
 * PROPÓSITO: Rutas del API. Define los endpoints. Siempre validar auth antes de dar acceso.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', AuthController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// GET /api/auth/validate-token/:token
router.get('/validate-token/:token', AuthController.validateToken);

// POST /api/auth/notify-lockout
router.post('/notify-lockout', AuthController.notifyLockout);

module.exports = router;

