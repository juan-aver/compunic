const Series = require('../models/series.model');
const AuditoriaModel = require('../models/auditoria.model');

exports.registrar = async (req, res) => {
    try {
        let { id_producto, seriales } = req.body;
        
        if (!id_producto || !seriales || !Array.isArray(seriales) || seriales.length === 0) {
            return res.status(400).send({ message: 'Se requiere ID de producto y un array de seriales' });
        }

        const ProductoModel = require('../models/productos.model');
        const db = require('../config/db');

        // Validar límite físico de stock
        const stockInfo = await ProductoModel.obtenerStockCalculado(id_producto);
        const physicalStock = stockInfo.length > 0 ? Number(stockInfo[0].stock) : 0;

        const [rows] = await db.query(
            "SELECT COUNT(*) AS total_en_stock FROM PRODUCTO_SERIES WHERE ID_PRODUCTO = ? AND ESTADO = 'en_stock'",
            [id_producto]
        );
        const seriesEnStockActuales = Number(rows[0].total_en_stock);

        const availableSlots = physicalStock - seriesEnStockActuales;

        if (availableSlots <= 0) {
            return res.status(400).send({ 
                message: `No hay stock físico libre para registrar más series. Stock físico: ${physicalStock}. Series ya registradas: ${seriesEnStockActuales}.` 
            });
        }

        let createdCount = seriales.length;
        let originalCount = seriales.length;
        if (seriales.length > availableSlots) {
            seriales = seriales.slice(0, availableSlots);
            createdCount = availableSlots;
        }

        const result = await Series.registrar(id_producto, seriales);
        
        AuditoriaModel.registrar({
            id_empleado: req.userId || null,
            username: req.username || 'Sistema',
            accion: 'REGISTRO_SERIES',
            tabla: 'PRODUCTO_SERIES',
            descripcion: `Se registraron ${createdCount} series para el producto ID: ${id_producto}`
        }).catch(e => console.error('Audit log error:', e));

        let responseMessage = 'Series registradas exitosamente';
        if (originalCount > createdCount) {
            responseMessage = `Se registraron solo ${createdCount} series para no exceder el stock físico. Las demás fueron omitidas.`;
        }

        res.status(201).send({ message: responseMessage, result });
    } catch (error) {
        console.error('Error al registrar series:', error);
        res.status(500).send({ message: error.message || 'Error al registrar series' });
    }
};

exports.obtenerPorProducto = async (req, res) => {
    try {
        const id_producto = req.params.id_producto;
        const series = await Series.obtenerPorProducto(id_producto);
        res.send(series);
    } catch (error) {
        res.status(500).send({ message: error.message || 'Error al obtener series' });
    }
};

exports.obtenerDisponibles = async (req, res) => {
    try {
        const id_producto = req.params.id_producto;
        const series = await Series.obtenerDisponibles(id_producto);
        res.send(series);
    } catch (error) {
        res.status(500).send({ message: error.message || 'Error al obtener series disponibles' });
    }
};

exports.eliminar = async (req, res) => {
    try {
        const id_serie = req.params.id_serie;
        const result = await Series.eliminar(id_serie);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Serie no encontrada o no está en stock' });
        }

        AuditoriaModel.registrar({
            id_empleado: req.userId || null,
            username: req.username || 'Sistema',
            accion: 'ELIMINAR_SERIE',
            tabla: 'PRODUCTO_SERIES',
            descripcion: `Se eliminó la serie ID: ${id_serie} del inventario`
        }).catch(e => console.error('Audit log error:', e));

        res.send({ message: 'Serie eliminada exitosamente' });
    } catch (error) {
        res.status(500).send({ message: error.message || 'Error al eliminar serie' });
    }
};
