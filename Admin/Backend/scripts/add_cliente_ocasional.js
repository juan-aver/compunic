const db = require('../config/db');

async function run() {
    try {
        const [rows] = await db.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='VENTAS' AND COLUMN_NAME='NOMBRE_CLIENTE_OCASIONAL'"
        );
        if (rows.length === 0) {
            await db.query('ALTER TABLE VENTAS ADD COLUMN NOMBRE_CLIENTE_OCASIONAL VARCHAR(150) DEFAULT NULL');
            console.log('Columna NOMBRE_CLIENTE_OCASIONAL agregada a VENTAS');
        } else {
            console.log('Columna ya existe');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

run();
