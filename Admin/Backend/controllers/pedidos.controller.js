/*
 * ==========================================
 * MÓDULO: pedidos.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// controllers/pedidos.controller.js
// Controlador para gestionar pedidos desde la tienda web

const Pedidos = require('../models/pedidos.model');

const pedidosController = {
    /**
     * Crear un nuevo pedido
     * POST /api/store/pedidos
     */
    crearPedido: async (req, res) => {
        try {
            console.log('=== CREAR PEDIDO ===');
            console.log('Body recibido:', JSON.stringify(req.body, null, 2));

            const { cliente, productos, total } = req.body;

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
            const resultado = await Pedidos.crearPedido(cliente, productos);

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
    }
};

module.exports = pedidosController;
