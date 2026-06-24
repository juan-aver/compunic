const db = require('./config/db');

async function main() {
    try {
        console.log("Adding column ID_PRODUCTO_SEMINUEVO to DEVOLUCIONES...");
        await db.query('ALTER TABLE DEVOLUCIONES ADD COLUMN ID_PRODUCTO_SEMINUEVO INT NULL;');
        console.log("Column added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(e);
        }
    } finally {
        process.exit();
    }
}

main();
