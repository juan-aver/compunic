/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: store.controller.js
 * Descripción: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// controllers/store.controller.js
// Controlador para las rutas públicas de la tienda

const Store = require('../models/store.model');

const storeController = {
    /**
     * Obtener catálogo de productos
     * GET /api/store/productos
     */
    obtenerProductos: async (req, res) => {
        try {
            const filtros = {
                categoria: req.query.categoria || '',
                marca: req.query.marca || '',
                busqueda: req.query.busqueda || ''
            };

            const productos = await Store.obtenerProductosDisponibles(filtros);

            res.json({
                success: true,
                count: productos.length,
                productos: productos
            });
        } catch (error) {
            console.error('Error en obtenerProductos:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener productos',
                message: error.message
            });
        }
    },

    /**
     * Obtener detalle de un producto
     * GET /api/store/productos/:id
     */
    obtenerProducto: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await Store.obtenerProducto(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }

            // Verificar que tenga stock disponible
            if (producto.stock_disponible <= 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto sin stock disponible'
                });
            }

            res.json({
                success: true,
                producto: producto
            });
        } catch (error) {
            console.error('Error en obtenerProducto:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener producto',
                message: error.message
            });
        }
    },

    /**
     * Obtener categorías disponibles
     * GET /api/store/categorias
     */
    obtenerCategorias: async (req, res) => {
        try {
            const categorias = await Store.obtenerCategorias();

            res.json({
                success: true,
                count: categorias.length,
                categorias: categorias
            });
        } catch (error) {
            console.error('Error en obtenerCategorias:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener categorías',
                message: error.message
            });
        }
    },

    /**
     * Obtener marcas disponibles
     * GET /api/store/marcas
     */
    obtenerMarcas: async (req, res) => {
        try {
            const marcas = await Store.obtenerMarcas();

            res.json({
                success: true,
                count: marcas.length,
                marcas: marcas
            });
        } catch (error) {
            console.error('Error en obtenerMarcas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener marcas',
                message: error.message
            });
        }
    }
};

module.exports = storeController;
