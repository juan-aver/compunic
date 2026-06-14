/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: ventas.controller.js
 * Descripción: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// controllers/ventas.controller.js
const Ventas = require('../models/ventas.model.js');
const movimientosStockController = require('./movimientos_stock.controller');
const Producto = require('../models/productos.model.js'); // Necesario para consultar stock
const AuditoriaModel = require('../models/auditoria.model');

exports.findAll = async (req, res) => {
  try {
    const data = await Ventas.getAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.create = async (req, res) => {
  if (!req.body.id_cliente || !req.body.id_empleado || !req.body.items || req.body.items.length === 0) {
    return res.status(400).send({ message: "Contenido vacío." });
  }

  const venta = {
    fecha: req.body.fecha || new Date(),
    id_cliente: req.body.id_cliente,
    id_empleado: req.body.id_empleado,
    items: req.body.items
  };

  try {
    // ✅ NUEVO: Obtener stock ANTES de insertar la venta para cálculo correcto
    const stocksAnteriores = {};
    for (const item of venta.items) {
      const [prodInfo] = await Producto.obtenerNombreYStock(item.idProducto);
      stocksAnteriores[item.idProducto] = {
        nombre: prodInfo ? prodInfo.nombre : 'Producto Vendido',
        stock: prodInfo ? prodInfo.stock : 0
      };
    }

    // 1. Guardar Venta (DESPUÉS de obtener stocks)
    const idVenta = await Ventas.create(venta);
    const facturaGenerada = `FAC-V${String(idVenta).padStart(3, '0')}`;

    // 2. Registrar Movimientos usando los stocks guardados anteriormente
    for (const item of venta.items) {
      try {
        // Usar el stock que guardamos ANTES de la venta
        const { nombre, stock } = stocksAnteriores[item.idProducto];
        const cantidadVendida = parseInt(item.cantidad);
        const stockFinal = stock - cantidadVendida; // Ahora usa el stock correcto

        await movimientosStockController.registrarSalida(
          item.idProducto,
          nombre,
          cantidadVendida,
          stockFinal,      // Stock calculado correctamente
          facturaGenerada
        );
      } catch (errMov) {
        console.error("Error log stock venta:", errMov);
      }
    }

    res.send({
      message: "Venta creada.",
      id_venta: idVenta,
      factura: facturaGenerada
    });

    // Auditoría
    const totalItems = venta.items.reduce((sum, i) => sum + parseInt(i.cantidad), 0);
    AuditoriaModel.registrar({
      id_empleado: req.userId || venta.id_empleado || null,
      username: req.username || 'Sistema',
      accion: 'VENTA',
      tabla: 'VENTAS',
      descripcion: `Se registró la venta ${facturaGenerada} con ${totalItems} artículo(s) para el cliente ID: ${venta.id_cliente}`
    }).catch(e => console.error('Audit log error:', e));
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findById = async (req, res) => {
  try {
    const id = req.params.id;
    const venta = await Ventas.getById(id);

    if (!venta) {
      return res.status(404).send({ message: "Venta no encontrada." });
    }

    res.send(venta);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// LLAMADO A PROCEDIMIENTO ALMACENADO sp_VentasPorVendedor
exports.findByVendedor = async (req, res) => {
  try {
    const idEmpleado = req.params.id;
    if (!idEmpleado) {
      return res.status(400).send({ message: "Se requiere el ID del empleado." });
    }

    const ventasVendedor = await Ventas.obtenerPorVendedor(idEmpleado);
    res.send(ventasVendedor);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};