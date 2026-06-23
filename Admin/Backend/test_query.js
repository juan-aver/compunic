const db = require('./config/db.js');
async function run() {
  try {
    const query = `
      SELECT 
          p.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO AS NOMBRE,
          p.MODELO,
          p.DESCRIPCION,
          p.IMAGEN_URL,
          COALESCE(p.ACTIVO, 1) AS ACTIVO,
          (
            COALESCE((SELECT SUM(dc.CANTIDAD) FROM DETALLE_COMPRA dc WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO), 0) - 
            COALESCE((SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO), 0) +
            COALESCE((SELECT SUM(d.CANTIDAD) FROM DEVOLUCIONES d WHERE d.ID_PRODUCTO = p.ID_PRODUCTO AND d.ACCION = 'reingreso' AND d.REINGRESO_CONFIRMADO = 1), 0)
          ) AS stock_actual_calculado,
          CONCAT(g.DURACION_MESES, ' Meses - ', COALESCE(gt.TIPO, 'Estándar')) AS GARANTIA_MESES,
          COALESCE(
            (SELECT dc.MESES_GARANTIA 
             FROM DETALLE_COMPRA dc 
             WHERE dc.ID_PRODUCTO = p.ID_PRODUCTO 
             ORDER BY dc.ID_DETALLE DESC 
             LIMIT 1), 0
          ) AS GARANTIA_PROVEEDOR,
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
          p.ID_PRODUCTO, p.NOMBRE_PRODUCTO, p.MODELO, p.DESCRIPCION, p.PRECIO_COMPRA, p.PRECIO_VENTA, m.NOMBRE_MARCA, pv.NOMBRE_EMPRESA, g.DURACION_MESES, gt.TIPO, p.ACTIVO
            ORDER BY 
            p.ID_PRODUCTO DESC;
    `;
    const [res] = await db.query(query);
    console.log('OK', res.length);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
}
run();
