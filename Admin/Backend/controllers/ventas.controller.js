/*
 * Módulo: ventas.controller.js
 * Descripción: Controlador para registrar y gestionar las ventas.
 */
// controllers/ventas.controller.js
const Ventas = require('../models/ventas.model.js');
const movimientosStockController = require('./movimientos_stock.controller');
const Producto = require('../models/productos.model.js'); // Necesario para consultar stock
const AuditoriaModel = require('../models/auditoria.model');
const db = require('../config/db');

exports.findAll = async (req, res) => {
  try {
    const data = await Ventas.getAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { id_cliente, nombre_cliente_ocasional, id_empleado, items, metodo_pago, referencia_bancaria } = req.body;

  // Se requiere o id_cliente (registrado) o nombre_cliente_ocasional (ocasional)
  if (!id_empleado || !items || items.length === 0) {
    return res.status(400).send({ message: "Contenido vacío." });
  }
  if (!id_cliente && !nombre_cliente_ocasional) {
    return res.status(400).send({ message: "Se requiere un cliente registrado o un nombre para cliente ocasional." });
  }

  const venta = {
    fecha: new Date(),
    id_cliente: id_cliente || null,
    nombre_cliente_ocasional: nombre_cliente_ocasional || null,
    id_empleado: id_empleado,
    items: items,
    metodo_pago: metodo_pago || 'Efectivo',
    referencia_bancaria: referencia_bancaria || null,
    estado: 'Completado'
  };

  try {
    const subtotalVenta = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVenta = subtotalVenta * 1.15;

    if (totalVenta > 10000) {
      if (!id_cliente) {
        return res.status(400).send({ message: "Para ventas mayores a C$ 10,000 debe seleccionar un cliente registrado con Cédula." });
      }
      const [cRows] = await db.query('SELECT CEDULA, TELEFONO FROM CLIENTES WHERE ID_CLIENTE = ?', [id_cliente]);
      if (!cRows[0] || !cRows[0].CEDULA || !cRows[0].TELEFONO) {
        return res.status(400).send({ message: "Para ventas mayores a C$ 10,000 el cliente debe tener registrada su Cédula y Teléfono. Por favor actualice el perfil del cliente." });
      }
    }
    // ✅ NUEVO: Verificar que los productos estén activos y obtener stock ANTES de insertar la venta
    const stocksAnteriores = {};
    for (const item of venta.items) {
      const [pRows] = await db.query('SELECT NOMBRE_PRODUCTO, COALESCE(ACTIVO, 1) AS activo FROM PRODUCTOS WHERE ID_PRODUCTO = ?', [item.idProducto]);
      if (pRows[0] && Number(pRows[0].activo) === 0) {
        return res.status(400).send({ error: `El producto "${pRows[0].NOMBRE_PRODUCTO}" está dado de baja y no se puede vender.` });
      }
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
    const clienteDesc = id_cliente ? `cliente ID: ${id_cliente}` : `cliente ocasional: "${nombre_cliente_ocasional}"`;
    AuditoriaModel.registrar({
      id_empleado: req.userId || venta.id_empleado || null,
      username: req.username || 'Sistema',
      accion: 'VENTA',
      tabla: 'VENTAS',
      descripcion: `Se registró la venta ${facturaGenerada} con ${totalItems} artículo(s) para el ${clienteDesc}`
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

const emailService = require('../services/email.service');

exports.enviarFacturaEmail = async (req, res) => {
  try {
    const id = req.params.id;
    const { email } = req.body;

    const venta = await Ventas.getById(id);
    if (!venta) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
    }

    const emailDestino = email || venta.EMAIL_CLIENTE;
    if (!emailDestino || !emailDestino.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró una dirección de correo válida para el cliente. Por favor ingrese el correo electrónico.'
      });
    }

    const nombreCompleto = `${venta.NOMBRE_CLIENTE || ''} ${venta.APELLIDO_CLIENTE || ''}`.replace(/\bnull\b/gi, '').replace(/\s+/g, ' ').trim() || 'Estimado(a) Cliente';

    await emailService.sendInvoiceEmail(
      emailDestino,
      nombreCompleto,
      venta.FACTURA || `FAC-${venta.ID_VENTA}`,
      null, // HTML enriquecido
      parseFloat(venta.TOTAL) || 0,
      venta.items || []
    );

    // Auditoría
    try {
      await AuditoriaModel.registrar({
        id_empleado: req.userId || 11,
        username: req.username || 'Sistema',
        accion: 'ENVIO_FACTURA_EMAIL',
        tabla: 'VENTAS',
        descripcion: `Se envió la factura ${venta.FACTURA} al correo ${emailDestino} (${nombreCompleto})`
      });
    } catch (auditErr) {
      console.error('Error en auditoría de envío de factura:', auditErr);
    }

    res.json({
      success: true,
      message: `Factura enviada exitosamente al correo ${emailDestino}.`
    });
  } catch (error) {
    console.error('Error al enviar factura por email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar la factura por email: ' + error.message
    });
  }
};