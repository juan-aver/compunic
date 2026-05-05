/*
 * ==========================================
 * MÓDULO: productos.model.js
 * PROPÓSITO: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// models/productos.model.js

const db = require('../config/db.js');

const Producto = {
  obtenerTodos: async () => {
    try {
      // 🛑 CONSULTA SQL REESCRITA PARA CALCULAR STOCK Y UNIR GARANTÍA
      const query = `
        SELECT 
          p.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO AS NOMBRE,
          p.MODELO,
          p.DESCRIPCION,
          p.IMAGEN_URL,
          (
            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
          ) AS stock_actual_calculado,
          CONCAT(g.DURACION_MESES, ' Meses - ', COALESCE(gt.TIPO, 'Estándar')) AS GARANTIA_MESES,
          p.PRECIO_COMPRA,
          p.PRECIO_VENTA,
          m.NOMBRE_MARCA AS nombre_marca, 
          pv.NOMBRE_EMPRESA AS nombre_proveedor, 
          GROUP_CONCAT(DISTINCT c.NOMBRE_CATEGORIA SEPARATOR ', ') AS nombre_categoria,
          GROUP_CONCAT(DISTINCT c.ID_CATEGORIA SEPARATOR ',') AS categoria_ids,
          p.ID_PROVEEDOR,
          p.ID_MARCA,
          p.ID_GARANTIAS 
          FROM 
          PRODUCTOS p
          LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA 
          LEFT JOIN PROVEEDORES pv ON p.ID_PROVEEDOR = pv.ID_PROVEEDOR
          LEFT JOIN GARANTIAS g ON p.ID_GARANTIAS = g.ID_GARANTIA
          LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
          LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
          LEFT JOIN CATEGORIAS c ON pc.ID_CATEGORIA = c.ID_CATEGORIA
          GROUP BY 
          p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.MODELO, p.DESCRIPCION, p.PRECIO_COMPRA, p.PRECIO_VENTA, m.NOMBRE_MARCA, pv.NOMBRE_EMPRESA, g.DURACION_MESES, gt.TIPO
            ORDER BY 
            p.ID_PRODUCTO DESC;
      `;
      const [resultados] = await db.query(query);
      return resultados;
    } catch (err) {
      console.error('Error al ejecutar SQL en obtenerTodos:', err.message);
      throw new Error('Error al obtener los productos (SQL): ' + err.message);
    }
  },

  /** Nueva función para obtener el stock calculado (para actualizar/eliminar) */
  obtenerStockCalculado: async (id) => {
    const sql = `
      SELECT 
        (
          COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
          COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0)
        ) AS stock
      FROM 
        PRODUCTOS p
      WHERE 
        p.ID_PRODUCTO = ?;
    `;
    try {
      const [resultados] = await db.query(sql, [id]);
      return resultados;
    } catch (err) {
      throw new Error('Error al calcular stock: ' + err.message);
    }
  },

  /** Nueva función para obtener nombre y stock calculado (para eliminar) */
  obtenerNombreYStock: async (id) => {
    const stockResult = await Producto.obtenerStockCalculado(id);
    const [nombreResult] = await db.query('SELECT NOMBRE_PRODUCTO AS nombre FROM PRODUCTOS WHERE ID_PRODUCTO = ?', [id]);

    if (nombreResult.length === 0) return [];

    return [{
      nombre: nombreResult[0].nombre,
      stock: stockResult.length > 0 ? stockResult[0].stock : 0
    }];
  },

  /** Obtener detalles de DETALLE_COMPRA y VENTAS_PRODUCTOS para depuración */
  obtenerDetalleStock: async (id) => {
    try {

      // Seleccionar todas las columnas para evitar dependencias a nombres específicos
      const comprasSql = `SELECT * FROM DETALLE_COMPRA WHERE ID_PRODUCTO = ?`;
      const [compras] = await db.query(comprasSql, [id]);

      const ventasSql = `SELECT * FROM VENTAS_PRODUCTOS WHERE ID_PRODUCTO = ?`;
      const [ventas] = await db.query(ventasSql, [id]);

      // Funciones auxiliares para extraer cantidades con tolerancia a nombres de columna
      const qtyFromCompra = (r) => Number(r.CANTIDAD ?? r.cantidad ?? r.CANT ?? r.cantidad_compra ?? r.CANTIDAD_COMPRA ?? r.cant ?? 0);
      const qtyFromVenta = (r) => Number(r.cantidad_neta ?? r.cantidad ?? r.CANTIDAD ?? r.cantidad_vendida ?? r.cantidad_producto ?? 0);

      const totalCompras = compras.reduce((s, r) => s + (isNaN(qtyFromCompra(r)) ? 0 : qtyFromCompra(r)), 0);
      const totalVentas = ventas.reduce((s, r) => s + (isNaN(qtyFromVenta(r)) ? 0 : qtyFromVenta(r)), 0);

      return {
        compras,
        ventas,
        total_compras: totalCompras,
        total_ventas: totalVentas,
        stock_calculado: totalCompras - totalVentas
      };
    } catch (err) {
      throw new Error('Error al obtener detalle de stock: ' + err.message);
    }
  },

  // El resto de las funciones agregar, actualizar y eliminar (que usan el ID_ADMINISTRADOR)
  // deben ser revisadas para reflejar las columnas reales de PRODUCTOS
  // ID_ADMINISTRADOR, ID_GARANTIAS, ID_PROVEEDOR
  agregar: async (datos) => {
    // datos puede ser con o sin ID_PRODUCTO al inicio
    // Si la primera posición es un ID explícito, insertamos incluyendo la columna ID_PRODUCTO
    try {
      let result;
      if (datos.length === 11) {
        // [id_producto, nombre, modelo, descripcion, imagen_url, precio_compra, precio_venta, id_marca, id_administrador, id_garantias, id_proveedor]
        const sqlWithId = `INSERT INTO PRODUCTOS (ID_PRODUCTO, NOMBRE_PRODUCTO, MODELO, DESCRIPCION, IMAGEN_URL, PRECIO_COMPRA, PRECIO_VENTA, ID_MARCA, ID_ADMINISTRADOR, ID_GARANTIAS, ID_PROVEEDOR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        [result] = await db.query(sqlWithId, datos);
      } else {
        // [nombre, modelo, descripcion, imagen_url, precio_compra, precio_venta, id_marca, id_administrador, id_garantias, id_proveedor]
        const sql = `INSERT INTO PRODUCTOS (NOMBRE_PRODUCTO, MODELO, DESCRIPCION, IMAGEN_URL, PRECIO_COMPRA, PRECIO_VENTA, ID_MARCA, ID_ADMINISTRADOR, ID_GARANTIAS, ID_PROVEEDOR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        [result] = await db.query(sql, datos);
      }
      return result;
    } catch (err) {
      throw new Error('Error al agregar el producto: ' + err.message);
    }
  },

  actualizar: async (datos) => {
    const sql = `
      UPDATE PRODUCTOS 
      SET NOMBRE_PRODUCTO = ?, MODELO = ?, DESCRIPCION = ?, IMAGEN_URL = ?, PRECIO_COMPRA = ?, PRECIO_VENTA = ?, ID_MARCA = ?, ID_ADMINISTRADOR = ?, ID_GARANTIAS = ?, ID_PROVEEDOR = ?
      WHERE ID_PRODUCTO = ?
    `;
    try {
      const [result] = await db.query(sql, datos);
      return result;
    } catch (err) {
      throw new Error('Error al actualizar el producto: ' + err.message);
    }
  },

  eliminar: async (id) => {
    const sql = 'DELETE FROM PRODUCTOS WHERE ID_PRODUCTO = ?';
    try {
      const [result] = await db.query(sql, [id]);
      return result;
    } catch (err) {
      throw new Error('Error al eliminar el producto: ' + err.message);
    }
  }
};

module.exports = Producto;