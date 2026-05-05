/*
 * ==========================================
 * MÓDULO: compras.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// controllers/compras.controller.js
const Compras = require('../models/compras.model');
const movimientosStockController = require('./movimientos_stock.controller');
const Producto = require('../models/productos.model.js');

exports.getCompras = async (req, res) => {
  try {
    const resultados = await Compras.obtenerCompras();
    // --- TUS LOGS DE DEBUG ORIGINALES ---
    console.log('🔍 DEBUG BACKEND: Compras obtenidas:', resultados.length);
    if (resultados.length > 0) {
      console.log('🔍 DEBUG BACKEND: Primera compra completa:', JSON.stringify(resultados[0], null, 2));
    }
    // ------------------------------------
    res.json(resultados);
  } catch (err) {
    console.error('Error al obtener compras:', err);
    res.status(500).json({ error: 'Error del servidor al obtener compras' });
  }
};

exports.createCompra = async (req, res) => {
  try {
    const { id_proveedor, numero_factura, items } = req.body;

    if (!id_proveedor || !numero_factura || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos.' });
    }

    // Calcular subtotal (sin IVA)
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.cantidad * item.precio_unitario);
    }

    // Calcular IVA (15% fijo)
    const iva_porcentaje = 15.00;
    const iva_monto = subtotal * (iva_porcentaje / 100);
    const total_compra = subtotal + iva_monto;

    const id_administrador = 401; // ID temporal o fijo

    // 1. Crear la Compra en la BD (Esto actualiza el stock en DETALLE_COMPRA)
    const idCompra = await Compras.crearCompra({
      id_proveedor,
      id_administrador,
      numero_factura,
      total_compra,
      iva_porcentaje: 15.00, // IVA fijo al 15%
      detalles: items
    });

    // 2. REGISTRAR EN HISTORIAL (Movimientos de Stock)
    // Adaptado para enviar Factura y Stock Resultante Correcto
    for (const item of items) {
      try {
        const idProd = item.id_producto;
        const cantidadEntra = parseInt(item.cantidad);

        // a) Obtenemos datos actuales del producto
        const [prodInfo] = await Producto.obtenerNombreYStock(idProd);
        const nombreProd = prodInfo ? prodInfo.nombre : 'Producto Comprado';

        // b) Obtener Stock Resultante
        // Como la compra YA se insertó en el paso 1, 'prodInfo.stock' ya tiene la suma hecha.
        // Así que usamos ese valor directamente como el stock resultante.
        const stockResultante = prodInfo ? prodInfo.stock : 0;

        // Registrar Entrada con los 5 parámetros: ID, Nombre, Cantidad, StockResultante, Factura
        await movimientosStockController.registrarEntrada(
          idProd,
          nombreProd,
          cantidadEntra,
          stockResultante, // <--- Stock actualizado
          numero_factura   // <--- Factura real
        );
      } catch (errorMov) {
        console.error("Error registrando movimiento de compra:", errorMov);
      }
    }

    res.status(201).json({
      message: 'Compra registrada exitosamente',
      id_compra: idCompra,
      subtotal: subtotal,
      iva: iva_monto,
      total: total_compra
    });

  } catch (err) {
    console.error('Error al crear compra:', err);
    const status = err.message.includes('factura') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

exports.getDetalleCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const detalles = await Compras.obtenerDetalleCompra(id);
    res.json(detalles);
  } catch (err) {
    console.error('Error al obtener detalle:', err);
    res.status(500).json({ error: 'Error al obtener detalles' });
  }
};