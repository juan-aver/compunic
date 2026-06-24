/*
 * ==========================================
 * MÓDULO: pedidos.controller.js
 * PROPÓSITO: Controlador para gestionar pedidos de clientes.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
// controllers/pedidos.controller.js
// Controlador para gestionar pedidos desde la tienda web

const Pedidos  = require('../models/pedidos.model');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');

// --- Configuración de Multer para comprobantes ---
const uploadsDir = path.join(__dirname, '..', 'uploads', 'comprobantes');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename:    (_req, file, cb) => {
        const ext  = path.extname(file.originalname);
        const name = `comprobante_${Date.now()}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf/;
        const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
        ok ? cb(null, true) : cb(new Error('Solo se permiten imágenes o PDF'));
    }
});


const pedidosController = {
    /**
     * Crear un nuevo pedido
     * POST /api/store/pedidos
     */
    crearPedido: async (req, res) => {
        try {
            console.log('=== CREAR PEDIDO ===');
            console.log('Body recibido:', JSON.stringify(req.body, null, 2));

            const { cliente, productos, total, puntos_usados, metodo_pago, referencia } = req.body;

            // Validar datos requeridos
            if (!cliente || !cliente.nombre || !cliente.email || !cliente.telefono) {
                console.log('Error: Datos del cliente incompletos');
                return res.status(400).json({
                    success: false,
                    error: 'Datos del cliente incompletos. Se requiere: nombre, email y teléfono'
                });
            }

            if (!productos || productos.length === 0) {
                console.log('Error: No hay productos');
                return res.status(400).json({
                    success: false,
                    error: 'El pedido debe contener al menos un producto'
                });
            }

            // Validar monto > 10,000
            if (total > 10000 && !cliente.cedula) {
                return res.status(400).json({
                    success: false,
                    error: 'Para compras mayores a C$ 10,000 debe tener registrada su Cédula de Identidad. Actualice su perfil.'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cliente.email)) {
                console.log('Error: Email inválido');
                return res.status(400).json({
                    success: false,
                    error: 'Formato de email inválido'
                });
            }

            // Validar que cada producto tenga los datos necesarios
            for (const producto of productos) {
                if (!producto.id_producto || !producto.cantidad || !producto.precio_unitario) {
                    console.log('Error: Datos de producto incompletos', producto);
                    return res.status(400).json({
                        success: false,
                        error: 'Datos de producto incompletos'
                    });
                }

                if (producto.cantidad <= 0) {
                    console.log('Error: Cantidad inválida');
                    return res.status(400).json({
                        success: false,
                        error: 'La cantidad debe ser mayor a 0'
                    });
                }
            }

            console.log('Validaciones pasadas, creando pedido...');

            // Crear el pedido
            const resultado = await Pedidos.crearPedido(cliente, productos, puntos_usados || 0, metodo_pago || 'Transferencia Bancaria', referencia);

            console.log('Pedido creado exitosamente:', resultado);

            res.status(201).json({
                success: true,
                id_venta: resultado.id_venta,
                numero_pedido: resultado.numero_pedido,
                total: resultado.total,
                mensaje: 'Pedido creado exitosamente'
            });

        } catch (error) {
            console.error('=== ERROR EN CREAR PEDIDO ===');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);

            // Manejar errores específicos
            if (error.message.includes('Stock insuficiente')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Error al procesar el pedido',
                message: error.message
            });
        }
    },

    /**
     * Obtener detalles de un pedido
     * GET /api/store/pedidos/:id
     */
    obtenerPedido: async (req, res) => {
        try {
            const { id } = req.params;

            const pedido = await Pedidos.obtenerPedido(id);

            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    error: 'Pedido no encontrado'
                });
            }

            res.json({
                success: true,
                pedido: pedido
            });

        } catch (error) {
            console.error('Error en obtenerPedido:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener el pedido',
                message: error.message
            });
        }
    },

    /**
     * Validar stock de un producto
     * GET /api/store/validar-stock/:id/:cantidad
     */
    validarStock: async (req, res) => {
        try {
            const { id, cantidad } = req.params;

            const stockDisponible = await Pedidos.validarStock(parseInt(id), parseInt(cantidad));

            res.json({
                success: true,
                disponible: stockDisponible
            });

        } catch (error) {
            console.error('Error en validarStock:', error);
            res.status(500).json({
                success: false,
                error: 'Error al validar stock',
                message: error.message
            });
        }
    },

    /**
     * Subir comprobante de pago
     * POST /api/store/pedidos/:id/comprobante
     */
    subirComprobante: [
        upload.single('comprobante'),
        async (req, res) => {
            try {
                const { id } = req.params;
                const { notas } = req.body;

                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
                }

                const rutaRelativa = `uploads/comprobantes/${req.file.filename}`;
                await Pedidos.guardarComprobante(parseInt(id), rutaRelativa, req.file.originalname, notas || '');

                res.json({ success: true, mensaje: 'Comprobante recibido. Tu pago está siendo verificado.' });
            } catch (error) {
                console.error('Error en subirComprobante:', error);
                res.status(400).json({ success: false, error: error.message });
            }
        }
    ],

    /**
     * Obtener estado de pago de un pedido
     * GET /api/store/pedidos/:id/estado
     */
    obtenerEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const estado = await Pedidos.obtenerEstadoPedido(parseInt(id));

            if (!estado) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            res.json({ success: true, ...estado });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = pedidosController;
