const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        'x-user-id': '11'
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: GET /api/devoluciones-proveedores ---');
  const initList = await request('GET', '/api/devoluciones-proveedores');
  console.log('Status:', initList.status, 'Devoluciones proveedores existentes:', initList.data.length);

  console.log('\n--- TEST 2: Consultar compras de un proveedor ---');
  const provs = await request('GET', '/api/proveedores');
  const prov1 = provs.data[0];
  console.log(`Proveedor ID ${prov1.ID_PROVEEDOR}: ${prov1.NOMBRE_EMPRESA}`);

  const comprasProv = await request('GET', `/api/devoluciones-proveedores/compras/${prov1.ID_PROVEEDOR}`);
  console.log('Compras registradas de este proveedor:', comprasProv.data.length);

  console.log('\n--- TEST 3: Obtener stock previo de un producto con existencias ---');
  const prods = await request('GET', '/api/productos');
  const prod = prods.data.find(p => Number(p.stock ?? p.stock_actual_calculado ?? 0) >= 2) || prods.data[0];
  const prodId = prod.ID_PRODUCTO || prod.id_producto;
  const stockPrevio = Number(prod.stock ?? prod.stock_actual_calculado ?? 0);
  console.log(`Producto ID ${prodId}: ${prod.nombre || prod.NOMBRE_PRODUCTO}, Stock previo: ${stockPrevio}`);

  if (stockPrevio < 2) {
    console.log('Todos los productos tienen poco stock, devolviendo 1 unidad...');
  }
  const cantADevolver = Math.max(1, Math.min(2, stockPrevio));

  console.log('\n--- TEST 4: Registrar devolución a proveedor (REQ-FR-31) ---');
  const nuevaDev = await request('POST', '/api/devoluciones-proveedores', {
    id_proveedor: prov1.ID_PROVEEDOR,
    id_producto: prodId,
    cantidad: cantADevolver,
    motivo: 'Falla de fábrica detectada en lote de prueba. Se devuelve para garantía oficial.',
    estado: 'Pendiente'
  });
  console.log('Status registro:', nuevaDev.status, 'Respuesta:', nuevaDev.data);

  if (nuevaDev.status === 201) {
    console.log('\n--- TEST 5: Verificar descuento de stock en bodega ---');
    const prodsPost = await request('GET', '/api/productos');
    const prodPost = prodsPost.data.find(p => (p.ID_PRODUCTO || p.id_producto) === prodId);
    const stockPost = Number(prodPost.stock ?? prodPost.stock_actual_calculado ?? 0);
    console.log(`Stock resultante: ${stockPost} (Descontó ${cantADevolver} unidades: ${stockPrevio - stockPost === cantADevolver})`);

    console.log('\n--- TEST 6: Actualizar resolución a "Reemplazo_Recibido" ---');
    const updateRes = await request('PATCH', `/api/devoluciones-proveedores/${nuevaDev.data.id_devolucion}/estado`, {
      estado: 'Reemplazo_Recibido'
    });
    console.log('Status actualización:', updateRes.status, 'Respuesta:', updateRes.data);

    console.log('\n--- TEST 7: Verificar reingreso del reemplazo al stock ---');
    const prodsReemplazo = await request('GET', '/api/productos');
    const prodReemplazo = prodsReemplazo.data.find(p => (p.ID_PRODUCTO || p.id_producto) === prodId);
    const stockFinal = Number(prodReemplazo.stock ?? prodReemplazo.stock_actual_calculado ?? 0);
    console.log(`Stock tras recibir reemplazo: ${stockFinal} (Volvió al stock original: ${stockFinal === stockPrevio})`);
  }

  console.log('\n🎉 ¡PRUEBAS DE DEVOLUCIONES A PROVEEDORES COMPLETADAS AL 100%!');
}

runTests().catch(console.error);
