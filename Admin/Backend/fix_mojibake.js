const pool = require('./config/db');

const REPLACEMENTS = [
  // CP850 mojibake (from Windows command prompt)
  ['├í', 'á'],
  ['├®', 'é'],
  ['├¡', 'í'],
  ['├│', 'ó'],
  ['├║', 'ú'],
  ['├▒', 'ñ'],
  ['├╝', 'ü'],
  ['├ü', 'Á'],
  ['├ë', 'É'],
  ['├ì', 'Í'],
  ['├Í', 'Í'],
  ['├ô', 'Ó'],
  ['├Ó', 'Ó'],
  ['├Ü', 'Ú'],
  ['├æ', 'Ñ'],

  // Latin1 / Windows-1252 mojibake (just in case)
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã\xad', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã±', 'ñ'],
  ['Ã¼', 'ü'],
  ['Ã', 'Á'],
  ['Ã‰', 'É'],
  ['Ã', 'Í'],
  ['Ã“', 'Ó'],
  ['Ãš', 'Ú'],
  ['Ã‘', 'Ñ']
];

async function fixMojibake() {
  console.log('🔄 Iniciando escaneo y corrección de codificación (tildes / ñ)...');
  const [tables] = await pool.query('SHOW TABLES');
  const tKey = Object.keys(tables[0])[0];
  let totalFixed = 0;

  for (const t of tables) {
    const tableName = t[tKey];
    
    // Check if it's a view or table
    const [tableStatus] = await pool.query(`SHOW FULL TABLES WHERE \`${tKey}\` = ?`, [tableName]);
    if (tableStatus.length > 0 && tableStatus[0].Table_type === 'VIEW') {
      continue;
    }

    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const textCols = cols.filter(c => 
      c.Type.includes('varchar') || 
      c.Type.includes('text') || 
      c.Type.includes('char')
    );

    for (const c of textCols) {
      const colName = c.Field;

      // Check if column contains any mojibake
      const [matches] = await pool.query(
        `SELECT COUNT(*) as cnt FROM \`${tableName}\` WHERE \`${colName}\` LIKE '%├%' OR \`${colName}\` LIKE '%Ã%'`
      );

      const count = matches[0].cnt;
      if (count > 0) {
        console.log(`📌 Corrigiendo ${count} fila(s) en tabla \`${tableName}\` columna \`${colName}\`...`);
        
        // Build nested REPLACE expression
        let replaceExpr = `\`${colName}\``;
        const params = [];
        for (const [from, to] of REPLACEMENTS) {
          replaceExpr = `REPLACE(${replaceExpr}, ?, ?)`;
          params.push(from, to);
        }

        const updateSql = `UPDATE \`${tableName}\` SET \`${colName}\` = ${replaceExpr} WHERE \`${colName}\` LIKE '%├%' OR \`${colName}\` LIKE '%Ã%'`;
        const [res] = await pool.query(updateSql, params);
        totalFixed += res.affectedRows;
      }
    }
  }

  console.log(`\n✅ Corrección completada: ${totalFixed} registros actualizados.`);

  // Verificación final
  console.log('\n🔍 Verificando estado final...');
  const [emp] = await pool.query('SELECT ID_EMPLEADO, NOMBRE, APELLIDO FROM EMPLEADOS WHERE ID_EMPLEADO IN (1, 2, 4, 6)');
  const [cat] = await pool.query('SELECT ID_CATEGORIA, NOMBRE_CATEGORIA FROM CATEGORIAS WHERE ID_CATEGORIA IN (4)');
  const [gar] = await pool.query('SELECT ID_GARANTIA_TIPO, TIPO FROM GARANTIA_TIPOS WHERE ID_GARANTIA_TIPO = 1');
  const [prod] = await pool.query('SELECT ID_PRODUCTO, NOMBRE_PRODUCTO FROM PRODUCTOS WHERE ID_PRODUCTO IN (3)');

  console.log('Muestra Empleados:', emp);
  console.log('Muestra Categorías:', cat);
  console.log('Muestra Garantías:', gar);
  console.log('Muestra Productos:', prod);

  process.exit(0);
}

fixMojibake().catch(err => {
  console.error('❌ Error durante la corrección:', err);
  process.exit(1);
});
