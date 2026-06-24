/*
 * ==========================================
 * MÓDULO: auth.routes.js
 * PROPÓSITO: Rutas para autenticación de usuarios.
 * FECHA: 8 de abril de 2026
 * ==========================================
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

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

module.exports = router;

