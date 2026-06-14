const db = require('../config/db');
const http = require('http');

async function verify() {
  console.log('🧪 Iniciando prueba de bloqueo de venta de producto dado de baja...');
  
  // 1. Dar de baja al producto 4020
  await db.query('UPDATE PRODUCTOS SET ACTIVO = 0 WHERE ID_PRODUCTO = 4020');
  console.log('🚫 Producto 4020 configurado como Dado de Baja.');

  const payload = JSON.stringify({
    id_cliente: null,
    nombre_cliente_ocasional: 'alexander centeno',
    id_empleado: 13,
    fecha: new Date().toISOString().split('T')[0],
    factura: '',
    items: [
      {
        idProducto: 4020,
        cantidad: 1,
        precioUnitario: 2220.00,
        subtotal: 2220.00
      }
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ventas',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', async () => {
      console.log(`STATUS RECIBIDO: ${res.statusCode}`);
      console.log(`BODY RECIBIDO: ${body}`);

      // 2. Reactivar el producto para dejarlo como estaba
      await db.query('UPDATE PRODUCTOS SET ACTIVO = 1 WHERE ID_PRODUCTO = 4020');
      console.log('✅ Producto 4020 reactivado en la base de datos.');

      if (res.statusCode === 400 && body.includes('está dado de baja')) {
        console.log('🎉 VERIFICACIÓN EXITOSA: La venta fue rechazada con el mensaje esperado!');
        process.exit(0);
      } else {
        console.error('❌ VERIFICACIÓN FALLIDA: Se esperaba status 400 y mensaje de error.');
        process.exit(1);
      }
    });
  });

  req.on('error', async (e) => {
    console.error(`Problem with request: ${e.message}`);
    await db.query('UPDATE PRODUCTOS SET ACTIVO = 1 WHERE ID_PRODUCTO = 4020');
    process.exit(1);
  });

  req.write(payload);
  req.end();
}

verify();
