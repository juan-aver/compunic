const db = require('./config/db');

async function migrate() {
    try {
        console.log("Adding CEDULA to CLIENTES...");
        try {
            await db.query('ALTER TABLE CLIENTES ADD COLUMN CEDULA VARCHAR(20) UNIQUE NULL;');
            console.log("CEDULA added.");
        } catch(e) {
            console.log("Column CEDULA might already exist or error: ", e.message);
        }

        console.log("Adding numeros_serie to VENTAS_PRODUCTOS...");
        try {
            await db.query('ALTER TABLE VENTAS_PRODUCTOS ADD COLUMN numeros_serie VARCHAR(500) NULL;');
            console.log("numeros_serie added.");
        } catch(e) {
            console.log("Column numeros_serie might already exist or error: ", e.message);
        }

        console.log("Updating sp_NuevoCliente...");
        await db.query('DROP PROCEDURE IF EXISTS sp_NuevoCliente;');
        
        const sp = `
        CREATE PROCEDURE sp_NuevoCliente(
            IN p_nombre VARCHAR(100),
            IN p_apellido VARCHAR(100),
            IN p_telefono VARCHAR(20),
            IN p_email VARCHAR(255),
            IN p_id_empleado INT,
            IN p_cedula VARCHAR(20)
        )
        BEGIN
            INSERT INTO CLIENTES (NOMBRE, APELLIDO, TELEFONO, EMAIL, ID_EMPLEADO, CEDULA) 
            VALUES (p_nombre, p_apellido, p_telefono, p_email, p_id_empleado, p_cedula);
        END
        `;
        await db.query(sp);
        console.log("sp_NuevoCliente updated.");
        
        console.log("Migration finished successfully.");
        process.exit(0);
    } catch(err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
