/*
 * ==========================================
 * MÓDULO: config.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// Detectar si estamos en localhost o en red local
const API_BASE_URL = `http://${window.location.hostname}:3001/api`;

// Exportar para uso global
window.API_BASE_URL = API_BASE_URL;

console.log(`✅ API configurada en: ${API_BASE_URL}`);
