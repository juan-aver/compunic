const db = require('../config/db');

async function run() {
    try {
        // Verificar si ID_CLIENTE es nullable en VENTAS
        const [cols] = await db.query(
            "SELECT IS_NULLABLE, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='VENTAS' AND COLUMN_NAME='ID_CLIENTE'"
        );
        
        if (cols.length > 0) {
            console.log('ID_CLIENTE estado actual:', cols[0]);
            
            if (cols[0].IS_NULLABLE === 'NO') {
                console.log('ID_CLIENTE es NOT NULL. Modificando a nullable...');
                // Necesitamos saber el tipo de columna para preservarlo
                const colType = cols[0].COLUMN_TYPE;
                await db.query(`ALTER TABLE VENTAS MODIFY COLUMN ID_CLIENTE ${colType} NULL`);
                console.log('✅ ID_CLIENTE ahora acepta NULL (clientes ocasionales)');
            } else {
                console.log('✅ ID_CLIENTE ya acepta NULL');
            }
        } else {
            console.log('Columna ID_CLIENTE no encontrada en VENTAS');
        }

        // Verificar FK constraints
        const [fks] = await db.query(
            "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='VENTAS' AND COLUMN_NAME='ID_CLIENTE' AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        console.log('FK constraints en ID_CLIENTE:', fks.length > 0 ? fks.map(f => f.CONSTRAINT_NAME).join(', ') : 'Ninguna');

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

run();
