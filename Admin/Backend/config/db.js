/*
 * ==========================================
 * MÓDULO: db.js
 * PROPÓSITO: DB Connection.
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
require('dotenv').config();
const mysql = require('mysql2');

// Conexión Cloud (DB_URL) o Local (localhost)
const dbConfig = process.env.DB_URL
  ? { uri: process.env.DB_URL }
  : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '301205',
    database: process.env.DB_NAME || 'COMPUNIC_V5',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

const pool = process.env.DB_URL
  ? mysql.createPool(process.env.DB_URL)
  : mysql.createPool(dbConfig);

// Exportamos con .promise() para poder usar 'await pool.query(...)' en los modelos
module.exports = pool.promise();