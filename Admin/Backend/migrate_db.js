const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Adding IMAGEN_URL to PRODUCTOS table...');
        await pool.query('ALTER TABLE PRODUCTOS ADD COLUMN IMAGEN_URL VARCHAR(255) AFTER DESCRIPCION;');
        console.log('Column added successfully!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column IMAGEN_URL already exists.');
            process.exit(0);
        }
        console.error('Error migrating database:', error);
        process.exit(1);
    }
}

migrate();
