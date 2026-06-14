const pool = require('../config/db');

async function migrate() {
    try {
        console.log('Adding ACTIVO to PROVEEDORES table...');
        await pool.query('ALTER TABLE PROVEEDORES ADD COLUMN ACTIVO TINYINT(1) DEFAULT 1;');
        console.log('Column ACTIVO added successfully!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column ACTIVO already exists in PROVEEDORES.');
            process.exit(0);
        }
        console.error('Error migrating database:', error);
        process.exit(1);
    }
}

migrate();
