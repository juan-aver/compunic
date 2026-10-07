/*
 * Módulo: cotizaciones.controller.js
 * Descripción: Controlador para Proformas y Cotizaciones Comerciales (REQ-FR-19, REQ-FR-20, UR-08).
 */
const Cotizaciones = require('../models/cotizaciones.model');
const AuditoriaModel = require('../models/auditoria.model');
const { sendInvoiceEmail } = require('../services/email.service');
const db = require('../config/db');

exports.create = async (req, res) => {
  try {
    const { id_cliente, dias_vigencia, items, notas } = req.body;
    const id_empleado = req.userId || req.body.id_empleado || 11; // Fallback admin

    // REQ-FR-20: Cliente obligatorio
    if (!id_cliente) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar un cliente registrado para emitir la proforma / cotización.'
      });
    }

    // Validación de items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cotización debe contener al menos un producto.'
      });
    }

    // Validar que los productos existan y estén activos
    for (const item of items) {
      const [pRows] = await db.query('SELECT NOMBRE_PRODUCTO, COALESCE(ACTIVO, 1) AS activo FROM PRODUCTOS WHERE ID_PRODUCTO = ?', [item.id_producto]);
      if (pRows.length === 0) {
        return res.status(400).json({ success: false, message: `El producto ID ${item.id_producto} no existe.` });
      }
      if (Number(pRows[0].activo) === 0) {
        return res.status(400).json({ success: false, message: `El producto "${pRows[0].NOMBRE_PRODUCTO}" está inactivo y no puede cotizarse.` });
      }
    }

    const resultado = await Cotizaciones.create({
      id_cliente,
      id_empleado,
      dias_vigencia: dias_vigencia || 15,
      items,
      notas
    });

    // Registrar en auditoría
    try {
      const [cRows] = await db.query('SELECT CONCAT(NOMBRE, " ", APELLIDO) AS cliente FROM CLIENTES WHERE ID_CLIENTE = ?', [id_cliente]);
      const nombreCli = cRows[0]?.cliente || `Cliente #${id_cliente}`;
      await AuditoriaModel.registrar({
        id_empleado,
        username: req.username || 'Sistema',
        accion: 'CREAR_COTIZACION',
        tabla: 'COTIZACIONES',
        descripcion: `Se emitió la cotización ${resultado.numero_cotizacion} para ${nombreCli} por C$ ${resultado.total.toFixed(2)} (${items.length} artículos, vigencia ${dias_vigencia || 15} días)`
      });
    } catch (auditErr) {
      console.error('Error registrando auditoría de cotización:', auditErr);
    }

    res.status(201).json({
      success: true,
      message: `Cotización ${resultado.numero_cotizacion} emitida con éxito.`,
      data: resultado
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la cotización: ' + error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const cotizaciones = await Cotizaciones.getAll();
    res.json(cotizaciones);
  } catch (error) {
    console.error('Error al listar cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotizaciones: ' + error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const cotizacion = await Cotizaciones.getById(id);
    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada.'
      });
    }
    res.json(cotizacion);
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de cotización: ' + error.message
    });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const id = req.params.id;
    const { estado } = req.body;
    const estadosPermitidos = ['Pendiente', 'Aceptada', 'Rechazada', 'Vencida', 'Convertida'];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Valores permitidos: ${estadosPermitidos.join(', ')}`
      });
    }

    const actualizado = await Cotizaciones.updateEstado(id, estado);
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada.'
      });
    }

    res.json({
      success: true,
      message: `Estado de la cotización actualizado a "${estado}".`
    });
  } catch (error) {
    console.error('Error al actualizar estado de cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado: ' + error.message
    });
  }
};
