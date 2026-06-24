const db = require('../config/db.js');

async function run() {
  try {
    console.log("Altering VENTAS table: making ID_CLIENTE nullable...");
    await db.query("ALTER TABLE VENTAS MODIFY COLUMN ID_CLIENTE INT NULL");
    console.log("ID_CLIENTE successfully modified to NULL.");

    console.log("Altering VENTAS table: adding NOMBRE_CLIENTE_OCASIONAL column...");
    try {
      await db.query("ALTER TABLE VENTAS ADD COLUMN NOMBRE_CLIENTE_OCASIONAL VARCHAR(255) NULL AFTER ID_CLIENTE");
      console.log("NOMBRE_CLIENTE_OCASIONAL successfully added.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log("NOMBRE_CLIENTE_OCASIONAL column already exists.");
      } else {
        throw e;
      }
    }

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

run();
