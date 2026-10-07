/*
 * Módulo: devoluciones_proveedores.controller.js
 * Descripción: Controlador para devoluciones a proveedores (REQ-FR-31, UR-03, UR-11).
 */
const DevolucionesProveedores = require('../models/devoluciones_proveedores.model');
const Producto = require('../models/productos.model');
const movimientosStockModel = require('../models/movimientos_stock.model');
const AuditoriaModel = require('../models/auditoria.model');
const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const data = await DevolucionesProveedores.getAll();
    res.json(data);
  } catch (error) {
    console.error('Error al listar devoluciones a proveedores:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await DevolucionesProveedores.getById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Devolución a proveedor no encontrada.' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error al obtener devolución a proveedor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_proveedor, id_producto, cantidad, motivo, id_compra, estado } = req.body;
    const id_empleado = req.userId || req.body.id_empleado || 11;

    if (!id_proveedor || !id_producto || !cantidad || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor, producto, cantidad y motivo son obligatorios.'
      });
    }

    const cantDevolver = parseInt(cantidad);
    if (isNaN(cantDevolver) || cantDevolver <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad a devolver debe ser un número entero mayor a cero.'
      });
    }

    // 1. Validar producto y stock actual disponible
    const [prodInfo] = await Producto.obtenerNombreYStock(id_producto);
    if (!prodInfo) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    const stockActual = prodInfo.stock || 0;
    if (stockActual < cantDevolver) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente para devolver. Stock disponible en bodega: ${stockActual}, intentas devolver: ${cantDevolver}.`
      });
    }

    // 2. Registrar devolución a proveedor
    const estadoInicial = estado || 'Pendiente';
    const idDevolucion = await DevolucionesProveedores.create({
      id_proveedor,
      id_producto,
      cantidad: cantDevolver,
      motivo,
      id_compra: id_compra || null,
      id_empleado,
      estado: estadoInicial
    });

    // 3. Registrar movimiento de salida de stock en MOVIMIENTOS_STOCK
    const stockResultante = stockActual - cantDevolver;
    try {
      const [provRows] = await db.query('SELECT NOMBRE_EMPRESA FROM PROVEEDORES WHERE ID_PROVEEDOR = ?', [id_proveedor]);
      const nombreProveedor = provRows[0]?.NOMBRE_EMPRESA || `Proveedor #${id_proveedor}`;

      await movimientosStockModel.registrarMovimiento(
        id_producto,
        prodInfo.nombre,
        'salida',
        `Devolución a Proveedor: ${nombreProveedor} (Dev #${idDevolucion}) - Motivo: ${motivo}`,
        cantDevolver,
        stockResultante
      );

      // Auditoría
      await AuditoriaModel.registrar({
        id_empleado,
        username: req.username || 'Sistema',
        accion: 'DEVOLUCION_PROVEEDOR',
        tabla: 'DEVOLUCIONES_PROVEEDORES',
        descripcion: `Se registró devolución #${idDevolucion} de ${cantDevolver} unidad(es) de "${prodInfo.nombre}" al proveedor "${nombreProveedor}". Motivo: ${motivo}`
      });
    } catch (movErr) {
      console.error('Error registrando movimiento de stock/auditoría para devolución a proveedor:', movErr);
    }

    res.status(201).json({
      success: true,
      message: `Devolución #${idDevolucion} registrada con éxito. Se descontaron ${cantDevolver} unidad(es) del stock.`,
      id_devolucion: idDevolucion
    });
  } catch (error) {
    console.error('Error al registrar devolución a proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al registrar devolución: ' + error.message });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const id = req.params.id;
    const { estado, notas } = req.body;
    const id_empleado = req.userId || 11;

    const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada', 'Reemplazo_Recibido', 'Reembolso_Recibido'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Opciones permitidas: ${estadosValidos.join(', ')}`
      });
    }

    const devExistente = await DevolucionesProveedores.getById(id);
    if (!devExistente) {
      return res.status(404).json({ success: false, message: 'Devolución no encontrada.' });
    }

    const estadoAnterior = devExistente.ESTADO;
    await DevolucionesProveedores.updateEstado(id, estado);

    // Si el estado cambia a "Reemplazo_Recibido" o "Rechazada", gestionar el retorno físico al stock
    if (estado === 'Reemplazo_Recibido' && estadoAnterior !== 'Reemplazo_Recibido') {
      const [prodInfo] = await Producto.obtenerNombreYStock(devExistente.ID_PRODUCTO);
      const stockActual = prodInfo ? prodInfo.stock : 0;
      const stockResultante = stockActual + devExistente.CANTIDAD;

      await movimientosStockModel.registrarMovimiento(
        devExistente.ID_PRODUCTO,
        devExistente.NOMBRE_PRODUCTO,
        'entrada',
        `Reemplazo nuevo recibido del Proveedor: ${devExistente.NOMBRE_PROVEEDOR} (Dev #${id})`,
        devExistente.CANTIDAD,
        stockResultante
      );
    } else if (estado === 'Rechazada' && estadoAnterior !== 'Rechazada') {
      // Si el proveedor rechazó la garantía y devolvió el producto
      const [prodInfo] = await Producto.obtenerNombreYStock(devExistente.ID_PRODUCTO);
      const stockActual = prodInfo ? prodInfo.stock : 0;
      const stockResultante = stockActual + devExistente.CANTIDAD;

      await movimientosStockModel.registrarMovimiento(
        devExistente.ID_PRODUCTO,
        devExistente.NOMBRE_PRODUCTO,
        'entrada',
        `Reingreso por Devolución Rechazada por Proveedor: ${devExistente.NOMBRE_PROVEEDOR} (Dev #${id})`,
        devExistente.CANTIDAD,
        stockResultante
      );
    }

    // Auditoría
    try {
      await AuditoriaModel.registrar({
        id_empleado,
        username: req.username || 'Sistema',
        accion: 'ACTUALIZAR_ESTADO_DEV_PROV',
        tabla: 'DEVOLUCIONES_PROVEEDORES',
        descripcion: `Se actualizó el estado de la devolución a proveedor #${id} (${devExistente.NOMBRE_PRODUCTO}) de "${estadoAnterior}" a "${estado}"`
      });
    } catch (auditErr) {
      console.error('Error en auditoría al actualizar devolución a proveedor:', auditErr);
    }

    res.json({
      success: true,
      message: `Estado de la devolución #${id} actualizado a "${estado}".`
    });
  } catch (error) {
    console.error('Error al actualizar estado de devolución a proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado: ' + error.message });
  }
};

exports.getComprasPorProveedor = async (req, res) => {
  try {
    const idProveedor = req.params.idProveedor;
    const compras = await DevolucionesProveedores.getComprasPorProveedor(idProveedor);
    res.json(compras);
  } catch (error) {
    console.error('Error al obtener compras del proveedor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
