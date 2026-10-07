/*
 * ==================================================================================
 * MÓDULO: mermas.controller.js
 * PROPÓSITO: Controlador para la API de mermas y pérdidas de inventario (REQ-FR-05)
 * ==================================================================================
 */
const Mermas = require('../models/mermas.model');
const AuditoriaModel = require('../models/auditoria.model');

const mermasController = {
    // 1. Obtener todas las mermas
    getAll: async (req, res) => {
        try {
            const mermas = await Mermas.obtenerTodas();
            res.json(mermas);
        } catch (error) {
            console.error('Error al obtener mermas:', error);
            res.status(500).json({ error: 'Error al obtener la lista de mermas: ' + error.message });
        }
    },

    // 2. Obtener una merma por ID
    getById: async (req, res) => {
        try {
            const merma = await Mermas.obtenerPorId(req.params.id);
            if (!merma) {
                return res.status(404).json({ error: 'Registro de merma no encontrado.' });
            }
            res.json(merma);
        } catch (error) {
            console.error('Error al obtener merma por ID:', error);
            res.status(500).json({ error: 'Error al obtener el detalle de la merma: ' + error.message });
        }
    },

    // 3. Obtener mermas de un producto específico
    getByProducto: async (req, res) => {
        try {
            const mermas = await Mermas.obtenerPorProducto(req.params.id);
            res.json(mermas);
        } catch (error) {
            console.error('Error al obtener mermas por producto:', error);
            res.status(500).json({ error: 'Error al consultar mermas del producto: ' + error.message });
        }
    },

    // 4. Registrar una nueva merma / pérdida
    create: async (req, res) => {
        try {
            const { id_producto, cantidad, motivo, justificacion, series } = req.body;

            // Validaciones obligatorias (REQ-FR-05)
            if (!id_producto) {
                return res.status(400).json({ error: 'El producto es obligatorio.' });
            }

            if (!cantidad || parseInt(cantidad, 10) <= 0) {
                return res.status(400).json({ error: 'La cantidad a mermar debe ser mayor a 0.' });
            }

            if (!motivo) {
                return res.status(400).json({ error: 'El motivo de la merma es obligatorio.' });
            }

            if (!justificacion || justificacion.trim() === '') {
                return res.status(400).json({ error: 'La justificación es obligatoria para registrar una merma.' });
            }

            const id_empleado = req.userId || req.body.id_empleado || 11;

            const resultado = await Mermas.registrar({
                id_producto: parseInt(id_producto, 10),
                cantidad: parseInt(cantidad, 10),
                motivo,
                justificacion: justificacion.trim(),
                id_empleado,
                series: series || []
            });

            // Registro en bitácora de auditoría (REQ-FR-12)
            AuditoriaModel.registrar({
                id_empleado: id_empleado,
                username: req.username || 'Sistema',
                accion: 'REGISTRAR_MERMA',
                tabla: 'MERMAS',
                id_registro: resultado.id_merma,
                descripcion: `Registro de merma #${resultado.id_merma}: ${cantidad} unidad(es) de "${resultado.nombre_producto}" por motivo "${motivo}". Justificación: "${justificacion.trim()}"`
            }).catch(e => console.error('Error al auditar merma:', e));

            res.status(201).json({
                message: 'Merma registrada exitosamente y stock actualizado.',
                data: resultado
            });
        } catch (error) {
            console.error('Error al registrar merma:', error);
            res.status(400).json({ error: error.message || 'Error al procesar la merma.' });
        }
    }
};

module.exports = mermasController;
