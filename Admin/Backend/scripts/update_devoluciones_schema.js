const pool = require('../config/db');

async function updateDevolucionesSchema() {
    try {
        console.log('Verificando columnas de autorización en DEVOLUCIONES...');
        const [cols] = await pool.query('SHOW COLUMNS FROM DEVOLUCIONES');
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('ESTADO_SOLICITUD')) {
            await pool.query(`
                ALTER TABLE DEVOLUCIONES 
                ADD COLUMN ESTADO_SOLICITUD ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
                ADD COLUMN MOTIVO_RECHAZO TEXT NULL,
                ADD COLUMN FECHA_RESOLUCION DATETIME NULL
            `);
            console.log('✅ Columnas ESTADO_SOLICITUD, MOTIVO_RECHAZO y FECHA_RESOLUCION agregadas a DEVOLUCIONES.');
        } else {
            console.log('ℹ️ Las columnas ya estaban presentes en DEVOLUCIONES.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error alterando tabla DEVOLUCIONES:', err.message);
        process.exit(1);
    }
}

updateDevolucionesSchema();
