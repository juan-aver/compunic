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

// Conexión Cloud (DB_URL / MYSQL_URL de Railway / DATABASE_URL) o Local
const connectionUri = process.env.DB_URL || process.env.MYSQL_URL || process.env.DATABASE_URL;

const dbConfig = connectionUri
  ? { uri: connectionUri }
  : {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT
      ? parseInt(process.env.DB_PORT, 10)
      : (process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT, 10) : 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD !== undefined
      ? process.env.DB_PASSWORD
      : (process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : ''),
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'COMPUNIC_V5',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

const pool = connectionUri
  ? mysql.createPool(connectionUri)
  : mysql.createPool(dbConfig);

// Exportamos con .promise() para poder usar 'await pool.query(...)' en los modelos
module.exports = pool.promise();