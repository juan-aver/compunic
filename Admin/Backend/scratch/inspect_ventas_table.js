const db = require('../config/db.js');
async function run() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM VENTAS");
    console.log("VENTAS Columns:");
    console.log(JSON.stringify(columns, null, 2));
  } catch (e) {
    console.error("Error inspecting:", e);
  }
  process.exit(0);
}
run();
