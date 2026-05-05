/**
 * Script para crear la tabla PASSWORD_RESET_TOKENS
 * Ejecutar una sola vez: node scripts/create-reset-tokens-table.js
 */

const db = require('../config/db');

async function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS PASSWORD_RESET_TOKENS (
            ID INT PRIMARY KEY AUTO_INCREMENT,
            ID_EMPLEADO INT NOT NULL,
            TOKEN VARCHAR(255) NOT NULL UNIQUE,
            EXPIRA_EN DATETIME NOT NULL,
            USADO TINYINT DEFAULT 0,
            CREADO_EN DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID) ON DELETE CASCADE,
            
            INDEX idx_token (TOKEN),
            INDEX idx_expiracion (EXPIRA_EN),
            INDEX idx_empleado (ID_EMPLEADO)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        console.log('📋 Creando tabla PASSWORD_RESET_TOKENS...');
        await db.query(sql);
        console.log('✅ Tabla creada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando tabla:', error.message);
        process.exit(1);
    }
}

createTable();
