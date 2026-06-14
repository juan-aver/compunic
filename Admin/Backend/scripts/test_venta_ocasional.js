const db = require('../config/db');
const Ventas = require('../models/ventas.model');
const Producto = require('../models/productos.model');

async function test() {
  console.log('🧪 Iniciando prueba de inserción de venta ocasional...');
  
  const tempVenta = {
    fecha: new Date(),
    id_cliente: null, // Ocasional
    nombre_cliente_ocasional: 'Cliente de Prueba Ocasional',
    id_empleado: 13,
    items: [
      {
        idProducto: 4001,
        cantidad: 1,
        precioUnitario: 27565.00,
        subtotal: 27565.00
      }
    ]
  };

  try {
    const idVenta = await Ventas.create(tempVenta);
    console.log('✅ Inserción exitosa! ID Venta:', idVenta);
  } catch (err) {
    console.error('❌ Error capturado en Ventas.create:', err);
  }
  process.exit(0);
}

test();
