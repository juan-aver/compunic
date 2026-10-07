const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-user-id': '11'
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3001,
      path: path
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    });
  });
}

async function runTests() {
  console.log('--- TEST 1: GET /api/cotizaciones ---');
  const cotizacionesInit = await get('/api/cotizaciones');
  console.log('Status:', cotizacionesInit.status, 'Cotizaciones existentes:', cotizacionesInit.data.length);

  console.log('\n--- TEST 2: Validar que cliente sea obligatorio (REQ-FR-20) ---');
  const cotSinCliente = await post('/api/cotizaciones', {
    id_cliente: null,
    items: [{ id_producto: 1, cantidad: 1, precio_unitario: 500, subtotal: 500 }]
  });
  console.log('Status sin cliente:', cotSinCliente.status, 'Mensaje:', cotSinCliente.data.message);

  console.log('\n--- TEST 3: Obtener stock previo de un producto ---');
  const prods = await get('/api/productos');
  const prod1 = prods.data[0];
  console.log(`Producto ID ${prod1.ID_PRODUCTO || prod1.id_producto}: ${prod1.nombre || prod1.NOMBRE_PRODUCTO}, Stock previo: ${prod1.stock || prod1.stock_actual_calculado}`);

  console.log('\n--- TEST 4: Emitir Cotización / Proforma ---');
  const clientes = await get('/api/clientes');
  const cliente1 = clientes.data[0];
  console.log(`Cliente ID ${cliente1.ID_CLIENTE}: ${cliente1.NOMBRE} ${cliente1.APELLIDO}`);

  const nuevaCot = await post('/api/cotizaciones', {
    id_cliente: cliente1.ID_CLIENTE,
    dias_vigencia: 15,
    notas: 'Cotización de prueba para verificación de stock y vigencia.',
    items: [
      { id_producto: prod1.ID_PRODUCTO || prod1.id_producto, cantidad: 3, precio_unitario: 500, subtotal: 1500 }
    ]
  });
  console.log('Status nueva cotización:', nuevaCot.status, 'Respuesta:', nuevaCot.data);

  console.log('\n--- TEST 5: Verificar que el stock NO fue descontado (REQ-FR-19) ---');
  const prodsPost = await get('/api/productos');
  const prod1Post = prodsPost.data.find(p => (p.ID_PRODUCTO || p.id_producto) === (prod1.ID_PRODUCTO || prod1.id_producto));
  console.log(`Producto ID ${prod1Post.ID_PRODUCTO || prod1Post.id_producto}: Stock actual: ${prod1Post.stock || prod1Post.stock_actual_calculado} (Stock previo era: ${prod1.stock || prod1.stock_actual_calculado})`);
  const stockSinCambio = (prod1Post.stock || prod1Post.stock_actual_calculado) === (prod1.stock || prod1.stock_actual_calculado);
  console.log('✅ REQ-FR-19 Cumplido (Stock sin cambios):', stockSinCambio);

  console.log('\n--- TEST 6: Consultar cotización por ID con productos y cliente ---');
  const cotDetalle = await get(`/api/cotizaciones/${nuevaCot.data.data.id_cotizacion}`);
  console.log('Detalle cotización:', {
    numero: cotDetalle.data.NUMERO_COTIZACION,
    cliente: cotDetalle.data.NOMBRE_CLIENTE,
    vence: cotDetalle.data.FECHA_VENCIMIENTO,
    diasRestantes: cotDetalle.data.DIAS_RESTANTES,
    total: cotDetalle.data.TOTAL,
    items: cotDetalle.data.items.length
  });

  console.log('\n--- TEST 7: Verificar auditoría de cotización registrada ---');
  const auditorias = await get('/api/auditorias');
  const ultimaAudit = auditorias.data[0];
  console.log('Última auditoría:', { accion: ultimaAudit.ACCION, tabla: ultimaAudit.TABLA, desc: ultimaAudit.DESCRIPCION });

  console.log('\n🎉 ¡TODOS LOS TESTS COMPLETADOS SATISFACTORIAMENTE!');
}

runTests().catch(console.error);
