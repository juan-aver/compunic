const pool = require('../config/db');

async function updateDevolucionesSchemaCompletada() {
    try {
        console.log('Actualizando ENUM de ESTADO_SOLICITUD para incluir Completada...');
        await pool.query(`
            ALTER TABLE DEVOLUCIONES 
            MODIFY COLUMN ESTADO_SOLICITUD ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Completada') NOT NULL DEFAULT 'Pendiente'
        `);
        console.log('✅ ENUM modificado correctamente con Completada.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error alterando ENUM en DEVOLUCIONES:', err.message);
        process.exit(1);
    }
}

updateDevolucionesSchemaCompletada();
