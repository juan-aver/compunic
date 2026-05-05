/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: movimientos_stock.controller.js
 * Descripción: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// controllers/movimientos_stock.controller.js
const movimientosStockModel = require('../models/movimientos_stock.model');

const movimientosStockController = {

  // GET: Obtener historial
  obtenerHistorial: async (req, res) => {
    try {
      const historial = await movimientosStockModel.obtenerHistorial();
      res.json(historial);
    } catch (err) {
      console.error("ERROR CRÍTICO:", err);
      res.status(500).json({ error: "Error BD", mensaje_tecnico: err.message });
    }
  },

  // POST: Endpoint para registrar manualmente (opcional)
  registrarMovimiento: async (req, res) => {
    const { tipo_movimiento, producto_id, nombre_producto, cantidad, stock_resultante, motivo } = req.body;
    try {
      await movimientosStockModel.registrarMovimiento(producto_id, nombre_producto, tipo_movimiento, motivo || 'Manual', cantidad, stock_resultante);
      res.status(200).json({ message: 'Movimiento registrado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =============================================================
  // FUNCIONES INTERNAS (Corregidas para recibir datos reales)
  // =============================================================

  registrarEntrada: async (id, nombre, cantidad, stockNuevo, factura) => {
    const motivo = `Compra Factura: ${factura}`;
    await movimientosStockModel.registrarMovimiento(id, nombre, 'entrada', motivo, cantidad, stockNuevo);
  },

  registrarSalida: async (id, nombre, cantidad, stockNuevo, factura) => {
    const motivo = `Venta Factura: ${factura}`;
    await movimientosStockModel.registrarMovimiento(id, nombre, 'salida', motivo, cantidad, stockNuevo);
  },

  registrarModificacion: async (id, nombre, cantidad, stockNuevo) => {
    await movimientosStockModel.registrarMovimiento(id, nombre, 'modificacion', 'Ajuste Manual', cantidad, stockNuevo);
  }
};

module.exports = movimientosStockController;