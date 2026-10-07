/*
 * Módulo: reportes.model.js
 * Descripción: Modelo de consultas SQL para generación de reportes financieros, de ventas, stock y servicios técnicos.
 */
const db = require('../config/db');

const ReportesModel = {
    /**
     * Resumen Financiero: Ingresos (ventas + servicios), Egresos (compras), Ganancia Bruta y Serie Temporal.
     */
    obtenerResumenFinanciero: async (fechaInicio, fechaFin) => {
        try {
            let whereVentas = "WHERE v.ESTADO != 'CANCELADA'";
            let whereCompras = "WHERE 1=1";
            let whereServicios = "WHERE s.ID_SERVICIO_ESTADO != (SELECT ID_SERVICIO_ESTADO FROM SERVICIO_ESTADOS WHERE LOWER(ESTADO) LIKE '%cancelado%' LIMIT 1)";
            const paramsVentas = [];
            const paramsCompras = [];
            const paramsServicios = [];

            if (fechaInicio && fechaFin) {
                whereVentas += " AND DATE(v.FECHA) BETWEEN ? AND ?";
                paramsVentas.push(fechaInicio, fechaFin);

                whereCompras += " AND DATE(c.FECHA_COMPRA) BETWEEN ? AND ?";
                paramsCompras.push(fechaInicio, fechaFin);

                whereServicios += " AND DATE(COALESCE(s.FECHA_EJECUCION, s.FECHA_SOLICITUD)) BETWEEN ? AND ?";
                paramsServicios.push(fechaInicio, fechaFin);
            }

            // 1. Total Ventas (Ingresos por ventas)
            const sqlVentas = `
                SELECT 
                    COUNT(*) AS total_transacciones,
                    COALESCE(SUM(v.TOTAL), 0) AS total_ingresos_ventas,
                    COALESCE(SUM(v.TOTAL / 1.15), 0) AS total_subtotal_ventas,
                    COALESCE(SUM(v.TOTAL - (v.TOTAL / 1.15)), 0) AS total_iva_ventas
                FROM VENTAS v
                ${whereVentas}
            `;
            const [resVentas] = await db.query(sqlVentas, paramsVentas);

            // 2. Total Compras (Egresos a proveedores)
            const sqlCompras = `
                SELECT 
                    COUNT(*) AS total_compras,
                    COALESCE(SUM(c.TOTAL_COMPRA), 0) AS total_egresos_compras
                FROM COMPRAS c
                ${whereCompras}
            `;
            const [resCompras] = await db.query(sqlCompras, paramsCompras);

            // 3. Total Servicios Técnicos
            const sqlServicios = `
                SELECT 
                    COUNT(*) AS total_servicios,
                    COALESCE(SUM(s.COSTO), 0) AS total_ingresos_servicios
                FROM SERVICIOS s
                ${whereServicios}
            `;
            const [resServicios] = await db.query(sqlServicios, paramsServicios);

            // 4. Costo de Mercancía Vendida (COGS) estimado para calcular ganancia neta en ventas
            const sqlCostoVentas = `
                SELECT 
                    COALESCE(SUM(vp.cantidad_neta * COALESCE(p.PRECIO_COMPRA, 0)), 0) AS costo_mercancia_vendida
                FROM VENTAS_PRODUCTOS vp
                JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA
                JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
                ${whereVentas}
            `;
            const [resCostoVentas] = await db.query(sqlCostoVentas, paramsVentas);

            // 5. Serie temporal mensual/diaria para gráficos de flujo financiero
            const sqlSerieVentas = `
                SELECT 
                    DATE_FORMAT(v.FECHA, '%Y-%m-%d') AS fecha,
                    COALESCE(SUM(v.TOTAL), 0) AS total_ventas
                FROM VENTAS v
                ${whereVentas}
                GROUP BY DATE_FORMAT(v.FECHA, '%Y-%m-%d')
                ORDER BY fecha ASC
            `;
            const [serieVentas] = await db.query(sqlSerieVentas, paramsVentas);

            const sqlSerieCompras = `
                SELECT 
                    DATE_FORMAT(c.FECHA_COMPRA, '%Y-%m-%d') AS fecha,
                    COALESCE(SUM(c.TOTAL_COMPRA), 0) AS total_compras
                FROM COMPRAS c
                ${whereCompras}
                GROUP BY DATE_FORMAT(c.FECHA_COMPRA, '%Y-%m-%d')
                ORDER BY fecha ASC
            `;
            const [serieCompras] = await db.query(sqlSerieCompras, paramsCompras);

            const totalVentas = parseFloat(resVentas[0].total_ingresos_ventas);
            const totalServicios = parseFloat(resServicios[0].total_ingresos_servicios);
            const totalIngresos = totalVentas + totalServicios;
            const totalEgresos = parseFloat(resCompras[0].total_egresos_compras);
            const costoMercancia = parseFloat(resCostoVentas[0].costo_mercancia_vendida);
            const gananciaBruta = (totalVentas - costoMercancia) + totalServicios;
            const margenGanancia = totalIngresos > 0 ? ((gananciaBruta / totalIngresos) * 100).toFixed(1) : 0;

            return {
                kpis: {
                    total_ingresos: totalIngresos,
                    total_ventas: totalVentas,
                    total_servicios: totalServicios,
                    total_egresos: totalEgresos,
                    costo_mercancia: costoMercancia,
                    ganancia_bruta: gananciaBruta,
                    margen_ganancia_porcentaje: parseFloat(margenGanancia),
                    transacciones_ventas: resVentas[0].total_transacciones,
                    ordenes_compras: resCompras[0].total_compras,
                    servicios_realizados: resServicios[0].total_servicios
                },
                series: {
                    ventas: serieVentas,
                    compras: serieCompras
                }
            };
        } catch (err) {
            throw new Error('Error al generar resumen financiero: ' + err.message);
        }
    },

    /**
     * Reporte de Ventas: Métricas por canal, top productos, top clientes, métodos de pago y listado detallado.
     */
    obtenerReporteVentas: async (fechaInicio, fechaFin, canal = null, idVendedor = null) => {
        try {
            let where = "WHERE 1=1";
            const params = [];

            if (fechaInicio && fechaFin) {
                where += " AND DATE(v.FECHA) BETWEEN ? AND ?";
                params.push(fechaInicio, fechaFin);
            }
            if (canal && canal !== 'TODOS') {
                where += " AND v.TIPO_CANAL = ?";
                params.push(canal);
            }
            if (idVendedor && idVendedor !== 'TODOS') {
                where += " AND v.ID_EMPLEADO = ?";
                params.push(parseInt(idVendedor));
            }

            // 1. Listado Detallado de Ventas
            const sqlListado = `
                SELECT 
                    v.ID_VENTA,
                    v.FACTURA,
                    v.FECHA,
                    COALESCE(v.TIPO_CANAL, 'FISICO') AS TIPO_CANAL,
                    COALESCE(v.ESTADO, 'COMPLETADA') AS ESTADO,
                    v.TOTAL,
                    v.METODO_PAGO_TEXT,
                    COALESCE(CONCAT(e.NOMBRE, ' ', e.APELLIDO), 'Venta en Línea') AS NOMBRE_VENDEDOR,
                    COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS NOMBRE_CLIENTE
                FROM VENTAS v
                LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
                LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                ${where}
                ORDER BY v.FECHA DESC, v.ID_VENTA DESC
                LIMIT 500
            `;
            const [listado] = await db.query(sqlListado, params);

            // 2. Ventas por Canal (Físico / POS vs Web / E-Commerce)
            const sqlCanales = `
                SELECT 
                    COALESCE(v.TIPO_CANAL, 'FISICO') AS canal,
                    COUNT(*) AS total_operaciones,
                    COALESCE(SUM(v.TOTAL), 0) AS total_recaudado
                FROM VENTAS v
                ${where}
                GROUP BY COALESCE(v.TIPO_CANAL, 'FISICO')
            `;
            const [ventasCanales] = await db.query(sqlCanales, params);

            // 3. Top 10 Productos Más Vendidos
            const sqlTopProductos = `
                SELECT 
                    p.ID_PRODUCTO,
                    p.NOMBRE_PRODUCTO,
                    COALESCE(m.NOMBRE_MARCA, 'Genérico') AS NOMBRE_MARCA,
                    SUM(vp.cantidad_neta) AS total_unidades,
                    SUM(vp.sub_total) AS total_ingresos
                FROM VENTAS_PRODUCTOS vp
                JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA
                JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
                LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
                ${where}
                GROUP BY p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, m.NOMBRE_MARCA
                ORDER BY total_unidades DESC
                LIMIT 10
            `;
            const [topProductos] = await db.query(sqlTopProductos, params);

            // 4. Top 10 Clientes con Mayor Compra
            const sqlTopClientes = `
                SELECT 
                    COALESCE(v.ID_CLIENTE, 0) AS ID_CLIENTE,
                    COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS cliente,
                    COUNT(v.ID_VENTA) AS total_compras,
                    COALESCE(SUM(v.TOTAL), 0) AS total_gastado
                FROM VENTAS v
                LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
                ${where}
                GROUP BY v.ID_CLIENTE, cliente
                ORDER BY total_gastado DESC
                LIMIT 10
            `;
            const [topClientes] = await db.query(sqlTopClientes, params);

            // 5. Desglose por Vendedor
            const sqlVendedores = `
                SELECT 
                    COALESCE(v.ID_EMPLEADO, 0) AS ID_EMPLEADO,
                    COALESCE(CONCAT(e.NOMBRE, ' ', e.APELLIDO), 'Tienda Web') AS vendedor,
                    COUNT(v.ID_VENTA) AS total_ventas,
                    COALESCE(SUM(v.TOTAL), 0) AS total_monto
                FROM VENTAS v
                LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
                ${where}
                GROUP BY v.ID_EMPLEADO, vendedor
                ORDER BY total_monto DESC
            `;
            const [vendedores] = await db.query(sqlVendedores, params);

            return {
                listado,
                canales: ventasCanales,
                topProductos,
                topClientes,
                vendedores
            };
        } catch (err) {
            throw new Error('Error al generar reporte de ventas: ' + err.message);
        }
    },

    /**
     * Reporte de Stock e Inventario: Valoración monetaria, niveles de stock, categorías y alertas.
     */
    obtenerReporteStock: async (idCategoria = null, estadoStock = null) => {
        try {
            // 1. Obtener valoración y listado de productos
            const sqlProductos = `
                SELECT 
                    p.ID_PRODUCTO,
                    p.NOMBRE_PRODUCTO,
                    p.MODELO,
                    p.PRECIO_COMPRA,
                    p.PRECIO_VENTA,
                    COALESCE(m.NOMBRE_MARCA, 'Sin Marca') AS NOMBRE_MARCA,
                    COALESCE(cat.NOMBRE_CATEGORIA, 'Sin Categoría') AS NOMBRE_CATEGORIA,
                    COALESCE((
                        SELECT ms.STOCK_RESULTANTE 
                        FROM MOVIMIENTOS_STOCK ms 
                        WHERE ms.ID_PRODUCTO = p.ID_PRODUCTO 
                        ORDER BY ms.FECHA_MOVIMIENTO DESC, ms.ID_MOVIMIENTO DESC 
                        LIMIT 1
                    ), 0) AS STOCK_ACTUAL
                FROM PRODUCTOS p
                LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
                LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
                LEFT JOIN CATEGORIAS cat ON pc.ID_CATEGORIA = cat.ID_CATEGORIA
                WHERE p.ACTIVO = 1
                ORDER BY STOCK_ACTUAL ASC, p.NOMBRE_PRODUCTO ASC
            `;
            const [productos] = await db.query(sqlProductos);

            let valoracionCostoTotal = 0;
            let valoracionVentaTotal = 0;
            let totalUnidadesStock = 0;
            let countStockNormal = 0;
            let countStockBajo = 0; // <= 5
            let countAgotados = 0;   // <= 0

            const productosConCalculo = productos.map(p => {
                const stock = parseInt(p.STOCK_ACTUAL) || 0;
                const pCompra = parseFloat(p.PRECIO_COMPRA) || 0;
                const pVenta = parseFloat(p.PRECIO_VENTA) || 0;
                const valCosto = stock * pCompra;
                const valVenta = stock * pVenta;
                const margen = valVenta - valCosto;

                valoracionCostoTotal += valCosto;
                valoracionVentaTotal += valVenta;
                totalUnidadesStock += stock;

                let estado = 'Normal';
                if (stock <= 0) {
                    estado = 'Agotado';
                    countAgotados++;
                } else if (stock <= 5) {
                    estado = 'Bajo';
                    countStockBajo++;
                } else {
                    countStockNormal++;
                }

                return {
                    ...p,
                    STOCK_ACTUAL: stock,
                    VALOR_COSTO: valCosto,
                    VALOR_VENTA: valVenta,
                    MARGEN_POTENCIAL: margen,
                    ESTADO_STOCK: estado
                };
            });

            // 2. Agrupación por Categoría
            const porCategoria = {};
            productosConCalculo.forEach(p => {
                const cat = p.NOMBRE_CATEGORIA || 'Sin Categoría';
                if (!porCategoria[cat]) {
                    porCategoria[cat] = { categoria: cat, cantidad_productos: 0, unidades_totales: 0, valor_venta: 0 };
                }
                porCategoria[cat].cantidad_productos += 1;
                porCategoria[cat].unidades_totales += p.STOCK_ACTUAL;
                porCategoria[cat].valor_venta += p.VALOR_VENTA;
            });

            return {
                resumen: {
                    total_productos_distintos: productos.length,
                    total_unidades_inventario: totalUnidadesStock,
                    valoracion_costo_total: valoracionCostoTotal,
                    valoracion_venta_total: valoracionVentaTotal,
                    ganancia_potencial_total: valoracionVentaTotal - valoracionCostoTotal,
                    margen_potencial_porcentaje: valoracionVentaTotal > 0 ? (((valoracionVentaTotal - valoracionCostoTotal) / valoracionVentaTotal) * 100).toFixed(1) : 0,
                    productos_agotados: countAgotados,
                    productos_stock_bajo: countStockBajo,
                    productos_stock_normal: countStockNormal
                },
                categorias: Object.values(porCategoria),
                listado: productosConCalculo
            };
        } catch (err) {
            throw new Error('Error al generar reporte de stock: ' + err.message);
        }
    },

    /**
     * Reporte de Servicios Técnicos: Estados, recaudación, métricas de técnicos y calificaciones.
     */
    obtenerReporteServicios: async (fechaInicio, fechaFin) => {
        try {
            let where = "WHERE 1=1";
            const params = [];

            if (fechaInicio && fechaFin) {
                where += " AND DATE(COALESCE(s.FECHA_EJECUCION, s.FECHA_SOLICITUD)) BETWEEN ? AND ?";
                params.push(fechaInicio, fechaFin);
            }

            // 1. Métricas Generales
            const sqlGeneral = `
                SELECT 
                    COUNT(*) AS total_servicios,
                    COALESCE(SUM(s.COSTO), 0) AS total_recaudado,
                    COALESCE(AVG(CASE WHEN s.CALIFICACION > 0 THEN s.CALIFICACION END), 0) AS promedio_estrellas,
                    COUNT(CASE WHEN s.CALIFICACION > 0 THEN 1 END) AS total_calificados,
                    COUNT(CASE WHEN se.ESTADO LIKE '%completado%' OR se.ESTADO LIKE '%entregado%' THEN 1 END) AS total_completados,
                    COUNT(CASE WHEN se.ESTADO LIKE '%progreso%' OR se.ESTADO LIKE '%pendiente%' OR se.ESTADO LIKE '%espera%' THEN 1 END) AS total_en_progreso,
                    COUNT(CASE WHEN se.ESTADO LIKE '%cancelado%' THEN 1 END) AS total_cancelados
                FROM SERVICIOS s
                LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
                ${where}
            `;
            const [resGeneral] = await db.query(sqlGeneral, params);

            // 2. Desempeño por Técnico
            const sqlTecnicos = `
                SELECT 
                    COALESCE(s.ID_EMPLEADO, 0) AS ID_EMPLEADO,
                    COALESCE(CONCAT(e.NOMBRE, ' ', e.APELLIDO), 'Sin asignar') AS tecnico,
                    COUNT(*) AS total_asignados,
                    COUNT(CASE WHEN se.ESTADO LIKE '%completado%' OR se.ESTADO LIKE '%entregado%' THEN 1 END) AS completados,
                    COALESCE(SUM(s.COSTO), 0) AS total_recaudado,
                    COALESCE(AVG(CASE WHEN s.CALIFICACION > 0 THEN s.CALIFICACION END), 0) AS promedio_estrellas
                FROM SERVICIOS s
                LEFT JOIN EMPLEADOS e ON s.ID_EMPLEADO = e.ID_EMPLEADO
                LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
                ${where}
                GROUP BY s.ID_EMPLEADO, tecnico
                ORDER BY total_recaudado DESC
            `;
            const [tecnicos] = await db.query(sqlTecnicos, params);

            // 3. Distribución de Calificaciones (1 a 5 estrellas)
            const sqlCalificaciones = `
                SELECT 
                    s.CALIFICACION AS estrellas,
                    COUNT(*) AS cantidad
                FROM SERVICIOS s
                ${where} AND s.CALIFICACION BETWEEN 1 AND 5
                GROUP BY s.CALIFICACION
                ORDER BY s.CALIFICACION DESC
            `;
            const [calificaciones] = await db.query(sqlCalificaciones, params);

            // 4. Listado Detallado de Trabajos
            const sqlListado = `
                SELECT 
                    s.ID_SERVICIO,
                    s.DESCRIPCION,
                    s.FECHA_SOLICITUD,
                    s.FECHA_EJECUCION,
                    s.COSTO,
                    s.CALIFICACION,
                    s.OPINION_CLIENTE,
                    s.EVIDENCIA_URL,
                    COALESCE(se.ESTADO, 'Pendiente') AS ESTADO_SERVICIO,
                    COALESCE(st.TIPO, 'General') AS TIPO_SERVICIO,
                    COALESCE(CONCAT(e.NOMBRE, ' ', e.APELLIDO), 'Sin asignar') AS NOMBRE_TECNICO,
                    COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), 'Cliente Ocasional') AS NOMBRE_CLIENTE
                FROM SERVICIOS s
                LEFT JOIN EMPLEADOS e ON s.ID_EMPLEADO = e.ID_EMPLEADO
                LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
                LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO
                ${where}
                ORDER BY s.ID_SERVICIO DESC
                LIMIT 200
            `;
            const [listado] = await db.query(sqlListado, params);

            return {
                resumen: resGeneral[0],
                tecnicos,
                calificaciones,
                listado
            };
        } catch (err) {
            throw new Error('Error al generar reporte de servicios: ' + err.message);
        }
    }
};

module.exports = ReportesModel;
