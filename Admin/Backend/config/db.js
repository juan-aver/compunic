/*
 * ==========================================
 * MÓDULO: db.js
 * PROPÓSITO: DB Connection.
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2');

// Conexión Cloud (DB_URL) o Local (localhost)
const dbConfig = process.env.DB_URL
  ? { uri: process.env.DB_URL }
  : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
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