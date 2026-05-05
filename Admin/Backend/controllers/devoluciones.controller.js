/*
 * ==========================================
 * MÓDULO: devoluciones.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const Devoluciones = require('../models/devoluciones.model');

// Obtener todas las devoluciones
exports.findAll = async (req, res) => {
    try {
        const data = await Devoluciones.obtenerTodas();
        res.send(data);
    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al obtener devoluciones'
        });
    }
};

// Obtener una devolución por ID
exports.findById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Devoluciones.obtenerPorId(id);

        if (!data) {
            return res.status(404).send({ message: 'Devolución no encontrada' });
        }

        res.send(data);
    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al obtener devolución'
        });
    }
};

// Obtener productos de una venta específica
exports.getProductosPorVenta = async (req, res) => {
    try {
        const idVenta = req.params.idVenta;
        const productos = await Devoluciones.obtenerProductosDeVenta(idVenta);
        res.send(productos);
    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al obtener productos de venta'
        });
    }
};

// Crear una nueva devolución
exports.create = async (req, res) => {
    // Validar datos requeridos
    if (!req.body.id_venta || !req.body.id_producto || !req.body.cantidad || !req.body.accion) {
        return res.status(400).send({
            message: 'Faltan datos requeridos: id_venta, id_producto, cantidad, accion'
        });
    }

    const { id_venta, id_producto, cantidad, motivo, accion } = req.body;

    // Validar que la acción sea válida
    const accionesValidas = ['reingreso', 'desecho', 'garantia'];
    if (!accionesValidas.includes(accion)) {
        return res.status(400).send({
            message: 'Acción inválida. Debe ser: reingreso, desecho o garantia'
        });
    }

    // Validar cantidad
    if (cantidad <= 0) {
        return res.status(400).send({
            message: 'La cantidad debe ser mayor a 0'
        });
    }

    try {
        // 1. Validar que la cantidad no exceda lo vendido
        const validacion = await Devoluciones.validarCantidadDevolucion(
            id_venta,
            id_producto,
            parseInt(cantidad)
        );

        if (!validacion.valido) {
            return res.status(400).send({ message: validacion.mensaje });
        }

        // 2. Crear la devolución
        const devolucion = {
            id_venta: parseInt(id_venta),
            id_producto: parseInt(id_producto),
            cantidad: parseInt(cantidad),
            motivo: motivo || '',
            accion: accion
        };

        const idDevolucion = await Devoluciones.crear(devolucion);

        res.send({
            message: 'Devolución registrada exitosamente',
            id_devolucion: idDevolucion
        });
    } catch (err) {
        console.error('Error al crear devolución:', err);
        res.status(500).send({
            message: err.message || 'Error al crear devolución'
        });
    }
};

// Actualizar una devolución
exports.update = async (req, res) => {
    const id = req.params.id;

    if (!req.body.motivo && !req.body.accion) {
        return res.status(400).send({
            message: 'Debe proporcionar al menos un campo para actualizar'
        });
    }

    try {
        const datos = {
            motivo: req.body.motivo,
            accion: req.body.accion
        };

        const result = await Devoluciones.actualizar(id, datos);

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Devolución no encontrada' });
        }

        res.send({ message: 'Devolución actualizada exitosamente' });
    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al actualizar devolución'
        });
    }
};

// Eliminar una devolución
exports.delete = async (req, res) => {
    const id = req.params.id;

    try {
        const result = await Devoluciones.eliminar(id);

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Devolución no encontrada' });
        }

        res.send({ message: 'Devolución eliminada exitosamente' });
    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al eliminar devolución'
        });
    }
};
