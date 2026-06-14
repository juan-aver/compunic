const http = require('http');

const payload = JSON.stringify({
  id_cliente: null,
  nombre_cliente_ocasional: 'alexander centeno',
  id_empleado: 13,
  fecha: new Date().toISOString().split('T')[0],
  factura: '',
  items: [
    {
      idProducto: 4020,
      cantidad: 2,
      precioUnitario: 2220.00,
      subtotal: 4440.00
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
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${body}`);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.write(payload);
req.end();
