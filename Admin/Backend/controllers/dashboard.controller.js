/*
 * Módulo: dashboard.controller.js
 * Descripción: Controlador para gestionar las estadísticas del panel de control.
 */
// controllers/dashboard.controller.js
const db = require('../config/db');

// Obtener ingresos del mes actual
exports.getIngresosMes = async (req, res) => {
    try {
        console.log('📊 Dashboard: Consultando ingresos del mes...');
        const query = `
            SELECT 
                COALESCE(SUM(TOTAL), 0) as total_mes,
                COUNT(*) as num_ventas
            FROM VENTAS
            WHERE MONTH(FECHA) = MONTH(CURRENT_DATE)
            AND YEAR(FECHA) = YEAR(CURRENT_DATE)
        `;
        const [resultado] = await db.query(query);

        console.log('✅ Ingresos obtenidos:', resultado[0]);

        // Calcular porcentaje de cambio vs mes anterior (simulado por ahora)
        const cambio = 4.5; // Puedes calcular esto comparando con el mes anterior

        res.json({
            total: parseFloat(resultado[0].total_mes || 0),
            num_ventas: resultado[0].num_ventas || 0,
            cambio_porcentaje: cambio
        });
    } catch (err) {
        console.error('❌ Error al obtener ingresos:', err.message);
        console.error('SQL Query failed:', err.sql);
        res.status(500).json({ error: 'Error al obtener ingresos del mes' });
    }
};

// Obtener servicios pendientes
exports.getServiciosPendientes = async (req, res) => {
    try {
        console.log('📊 Dashboard: Consultando servicios pendientes...');
        const query = `
            SELECT 
                COUNT(*) as total_pendientes,
                SUM(CASE WHEN ID_SERVICIO_ESTADO = 1 THEN 1 ELSE 0 END) as en_diagnostico
            FROM SERVICIOS
            WHERE ID_SERVICIO_ESTADO != 3
        `;
        const [resultado] = await db.query(query);

        console.log('✅ Servicios obtenidos:', resultado[0]);

        res.json({
            total_pendientes: resultado[0].total_pendientes || 0,
            en_diagnostico: resultado[0].en_diagnostico || 0
        });
    } catch (err) {
        console.error('❌ Error al obtener servicios:', err.message);
        res.status(500).json({ error: 'Error al obtener servicios pendientes' });
    }
};

// Obtener productos con stock crítico
exports.getStockCritico = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                COALESCE(
                    (SELECT SUM(dc.CANTIDAD) 
                     FROM DETALLE_COMPRA dc 
                     JOIN COMPRAS c ON dc.ID_COMPRA = c.ID_COMPRA 
                     WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0
                ) - 
                COALESCE(
                    (SELECT SUM(vp.cantidad_neta) 
                     FROM VENTAS_PRODUCTOS vp 
                     WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0
                ) as stock_actual
            FROM PRODUCTOS p
            HAVING stock_actual <= 5 AND stock_actual >= 0
            ORDER BY stock_actual ASC
            LIMIT 10
        `;
        const [productos] = await db.query(query);

        res.json({
            total: productos.length,
            productos: productos.map(p => ({
                nombre: p.NOMBRE_PRODUCTO,
                stock: p.stock_actual
            }))
        });
    } catch (err) {
        console.error('Error al obtener stock crítico:', err);
        res.status(500).json({ error: 'Error al obtener stock crítico' });
    }
};

// Obtener total de clientes
exports.getClientesNuevos = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_clientes
            FROM CLIENTES
        `;
        const [resultado] = await db.query(query);

        res.json({
            total_nuevos: resultado[0].total_clientes || 0
        });
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error al obtener total de clientes' });
    }
};

// Obtener datos para gráfico de ventas vs costos
exports.getVentasVsCostos = async (req, res) => {
    try {
        console.log('📊 Dashboard: Consultando ventas vs costos...');
        const query = `
            SELECT 
                mes,
                SUM(ventas) as ventas,
                SUM(costos) as costos
            FROM (
                SELECT 
                    DATE_FORMAT(FECHA, '%Y-%m') as mes,
                    TOTAL as ventas,
                    0 as costos
                FROM VENTAS
                WHERE FECHA >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
                
                UNION ALL
                
                SELECT 
                    DATE_FORMAT(FECHA_COMPRA, '%Y-%m') as mes,
                    0 as ventas,
                    TOTAL_COMPRA as costos
                FROM COMPRAS
                WHERE FECHA_COMPRA >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            ) AS combined
            GROUP BY mes
            ORDER BY mes ASC
        `;
        const [datos] = await db.query(query);

        console.log('✅ Ventas vs costos obtenidos:', datos);

        res.json(datos);
    } catch (err) {
        console.error('❌ Error al obtener ventas vs costos:', err.message);
        res.status(500).json({ error: 'Error al obtener datos de gráfico' });
    }
};

// Obtener servicios por estado
exports.getServiciosPorEstado = async (req, res) => {
    try {
        const query = `
            SELECT 
                se.ESTADO,
                COUNT(s.ID_SERVICIO) as total_servicios
            FROM SERVICIO_ESTADOS se
            LEFT JOIN SERVICIOS s ON se.ID_SERVICIO_ESTADO = s.ID_SERVICIO_ESTADO
            GROUP BY se.ID_SERVICIO_ESTADO, se.ESTADO
            ORDER BY total_servicios DESC
        `;
        const [datos] = await db.query(query);

        res.json(datos);
    } catch (err) {
        console.error('Error al obtener servicios por estado:', err);
        res.status(500).json({ error: 'Error al obtener servicios por estado' });
    }
};

// Obtener el cliente con más compras
exports.getTopCliente = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.ID_CLIENTE,
                c.NOMBRE,
                c.APELLIDO,
                c.TELEFONO,
                COUNT(v.ID_VENTA) as total_compras,
                COALESCE(SUM(v.TOTAL), 0) as monto_total
            FROM CLIENTES c
            INNER JOIN VENTAS v ON c.ID_CLIENTE = v.ID_CLIENTE
            GROUP BY c.ID_CLIENTE, c.NOMBRE, c.APELLIDO, c.TELEFONO
            ORDER BY total_compras DESC, monto_total DESC
            LIMIT 1
        `;
        const [resultado] = await db.query(query);

        if (resultado.length > 0) {
            res.json({
                encontrado: true,
                cliente: {
                    nombre: `${resultado[0].NOMBRE} ${resultado[0].APELLIDO}`,
                    telefono: resultado[0].TELEFONO || 'N/A',
                    total_compras: resultado[0].total_compras,
                    monto_total: parseFloat(resultado[0].monto_total)
                }
            });
        } else {
            res.json({ encontrado: false });
        }
    } catch (err) {
        console.error('❌ Error al obtener top cliente:', err);
        res.status(500).json({ error: 'Error al obtener top cliente' });
    }
};

// Obtener el producto más vendido
exports.getProductoMasVendido = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                p.IMAGEN_URL,
                p.PRECIO_VENTA,
                SUM(vp.cantidad_neta) as total_vendido,
                COALESCE(SUM(vp.sub_total), 0) as ingresos_generados
            FROM VENTAS_PRODUCTOS vp
            INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
            GROUP BY p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.IMAGEN_URL, p.PRECIO_VENTA
            ORDER BY total_vendido DESC
            LIMIT 1
        `;
        const [resultado] = await db.query(query);

        if (resultado.length > 0) {
            res.json({
                encontrado: true,
                producto: {
                    id: resultado[0].ID_PRODUCTO,
                    nombre: resultado[0].NOMBRE_PRODUCTO,
                    imagen: resultado[0].IMAGEN_URL,
                    precio: parseFloat(resultado[0].PRECIO_VENTA || 0),
                    total_vendido: resultado[0].total_vendido,
                    ingresos: parseFloat(resultado[0].ingresos_generados)
                }
            });
        } else {
            res.json({ encontrado: false });
        }
    } catch (err) {
        console.error('❌ Error al obtener producto más vendido:', err);
        res.status(500).json({ error: 'Error al obtener producto más vendido' });
    }
};

// Obtener el producto menos vendido (que tenga al menos 1 venta)
exports.getProductoMenosVendido = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.ID_PRODUCTO,
                p.NOMBRE_PRODUCTO,
                p.IMAGEN_URL,
                p.PRECIO_VENTA,
                SUM(vp.cantidad_neta) as total_vendido,
                COALESCE(SUM(vp.sub_total), 0) as ingresos_generados
            FROM VENTAS_PRODUCTOS vp
            INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
            GROUP BY p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.IMAGEN_URL, p.PRECIO_VENTA
            ORDER BY total_vendido ASC
            LIMIT 1
        `;
        const [resultado] = await db.query(query);

        if (resultado.length > 0) {
            res.json({
                encontrado: true,
                producto: {
                    id: resultado[0].ID_PRODUCTO,
                    nombre: resultado[0].NOMBRE_PRODUCTO,
                    imagen: resultado[0].IMAGEN_URL,
                    precio: parseFloat(resultado[0].PRECIO_VENTA || 0),
                    total_vendido: resultado[0].total_vendido,
                    ingresos: parseFloat(resultado[0].ingresos_generados)
                }
            });
        } else {
            res.json({ encontrado: false });
        }
    } catch (err) {
        console.error('❌ Error al obtener producto menos vendido:', err);
        res.status(500).json({ error: 'Error al obtener producto menos vendido' });
    }
};
