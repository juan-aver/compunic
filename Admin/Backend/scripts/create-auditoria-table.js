/**
 * Script para crear la tabla AUDITORIA
 * Ejecutar una sola vez: node scripts/create-auditoria-table.js
 */

const db = require('../config/db');

async function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS AUDITORIA (
            ID_AUDITORIA INT PRIMARY KEY AUTO_INCREMENT,
            FECHA_HORA DATETIME DEFAULT CURRENT_TIMESTAMP,
            ID_EMPLEADO INT NULL,
            USUARIO VARCHAR(100) NULL,
            ACCION VARCHAR(50) NOT NULL,
            TABLA VARCHAR(50) NULL,
            ID_REGISTRO INT NULL,
            DETALLE TEXT NULL,
            IP VARCHAR(45) NULL,
            
            FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO) ON DELETE SET NULL,
            
            INDEX idx_fecha (FECHA_HORA),
            INDEX idx_empleado (ID_EMPLEADO),
            INDEX idx_accion (ACCION),
            INDEX idx_tabla (TABLA)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        console.log('📋 Creando tabla AUDITORIA...');
        await db.query(sql);
        console.log('✅ Tabla creada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando tabla:', error.message);
        process.exit(1);
    }
}

createTable();
