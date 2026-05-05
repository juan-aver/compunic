/**
 * @file store.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// models/store.model.js
// Modelo para el catálogo público de la tienda

const db = require('../config/db');

const Store = {
    /**
     * Obtener productos disponibles para la tienda (con stock > 0)
     * Incluye información de categorías, marcas y precios de venta
     */
    obtenerProductosDisponibles: async (filtros = {}) => {
        try {
            let sql = `
        SELECT 
          p.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          p.MODELO,
          p.DESCRIPCION,
          p.IMAGEN_URL,
          p.PRECIO_VENTA,
          m.NOMBRE_MARCA,
          m.ID_MARCA,
          GROUP_CONCAT(DISTINCT c.NOMBRE_CATEGORIA SEPARATOR ', ') AS categorias,
          GROUP_CONCAT(DISTINCT c.ID_CATEGORIA SEPARATOR ',') AS categoria_ids,
          (
            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
          ) AS stock_disponible,
          g.DURACION_MESES AS garantia_meses
        FROM PRODUCTOS p
        LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
        LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
        LEFT JOIN CATEGORIAS c ON pc.ID_CATEGORIA = c.ID_CATEGORIA
        LEFT JOIN GARANTIAS g ON p.ID_GARANTIAS = g.ID_GARANTIA
        WHERE 1=1
      `;

            const params = [];

            // Filtro por categoría
            if (filtros.categoria) {
                sql += ` AND c.ID_CATEGORIA = ?`;
                params.push(filtros.categoria);
            }

            // Filtro por marca
            if (filtros.marca) {
                sql += ` AND m.ID_MARCA = ?`;
                params.push(filtros.marca);
            }

            // Filtro por búsqueda
            if (filtros.busqueda) {
                sql += ` AND (p.NOMBRE_PRODUCTO LIKE ? OR p.MODELO LIKE ? OR p.DESCRIPCION LIKE ?)`;
                const searchTerm = `%${filtros.busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            sql += ` 
        GROUP BY p.ID_PRODUCTO 
        HAVING stock_disponible > 0 
        ORDER BY p.ID_PRODUCTO DESC
      `;

            const [rows] = await db.query(sql, params);

            // Formatear las categorías y IDs de categoría como arrays
            const formattedRows = rows.map(row => ({
                ...row,
                categorias: row.categorias ? row.categorias.split(', ').filter(Boolean) : [],
                categoria_ids: row.categoria_ids ? row.categoria_ids.split(',').filter(Boolean).map(Number) : []
            }));

            return formattedRows;
        } catch (err) {
            console.error('Error al obtener productos de la tienda:', err.message);
            throw new Error('Error al obtener productos: ' + err.message);
        }
    },

    /**
     * Obtener detalle completo de un producto
     */
    obtenerProducto: async (idProducto) => {
        try {
            const sql = `
        SELECT 
          p.*,
          m.NOMBRE_MARCA,
          GROUP_CONCAT(DISTINCT c.NOMBRE_CATEGORIA SEPARATOR ', ') AS categorias,
          GROUP_CONCAT(DISTINCT c.ID_CATEGORIA SEPARATOR ',') AS categoria_ids,
          (
            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
          ) AS stock_disponible,
          g.DURACION_MESES AS garantia_meses,
          gt.TIPO AS garantia_tipo
        FROM PRODUCTOS p
        LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
        LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
        LEFT JOIN CATEGORIAS c ON pc.ID_CATEGORIA = c.ID_CATEGORIA
        LEFT JOIN GARANTIAS g ON p.ID_GARANTIAS = g.ID_GARANTIA
        LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
        WHERE p.ID_PRODUCTO = ?
        GROUP BY p.ID_PRODUCTO
      `;

            const [rows] = await db.query(sql, [idProducto]);
            return rows[0];
        } catch (err) {
            console.error('Error al obtener producto:', err.message);
            throw new Error('Error al obtener producto: ' + err.message);
        }
    },

    /**
     * Obtener todas las categorías disponibles
     */
    obtenerCategorias: async () => {
        try {
            const sql = `
        SELECT DISTINCT c.ID_CATEGORIA, c.NOMBRE_CATEGORIA
        FROM CATEGORIAS c
        INNER JOIN PRODUCTO_CATEGORIA pc ON c.ID_CATEGORIA = pc.ID_CATEGORIA
        INNER JOIN PRODUCTOS p ON pc.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE (
          COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
          COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
        ) > 0
        ORDER BY c.NOMBRE_CATEGORIA
      `;

            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            console.error('Error al obtener categorías:', err.message);
            throw new Error('Error al obtener categorías: ' + err.message);
        }
    },

    /**
     * Obtener todas las marcas disponibles
     */
    obtenerMarcas: async () => {
        try {
            const sql = `
        SELECT DISTINCT m.ID_MARCA, m.NOMBRE_MARCA
        FROM MARCAS m
        INNER JOIN PRODUCTOS p ON m.ID_MARCA = p.ID_MARCA
        WHERE (
          COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
          COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
        ) > 0
        ORDER BY m.NOMBRE_MARCA
      `;

            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            console.error('Error al obtener marcas:', err.message);
            throw new Error('Error al obtener marcas: ' + err.message);
        }
    }
};

module.exports = Store;
