/**
 * @file aurum.routes.js
 * @description Rutas del módulo AURUM (IA/Chatbot).
 * Todos los endpoints requieren autenticación de admin.
 */
const express = require('express');
const router = express.Router();
const aurumController = require('../controllers/aurum.controller');

// Estado del servicio AURUM
router.get('/status', aurumController.getStatus);

// Chat interactivo con AURUM (Function Calling + Gemini)
router.post('/chat', aurumController.chat);

// Análisis automático de datos
router.post('/analizar', aurumController.analizar);

module.exports = router;
