/*
 * ==========================================
 * MÓDULO: config.js
 * PROPÓSITO: Configuración global del sistema frontend.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
// Detectar si estamos en localhost o en producción
const isLocalEnv = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '';
const API_BASE_URL = isLocalEnv ? `http://${window.location.hostname}:3001/api` : '/api';

// Exportar para uso global
window.API_BASE_URL = API_BASE_URL;

console.log(`✅ API configurada en: ${API_BASE_URL}`);
