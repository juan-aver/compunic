
// ventas.model.js

const db = require('../config/db');

const Ventas = {
  // Obtener todas las ventas (Adaptado al esquema proporcionado)
  getAll: async () => {
    const query = `
            SELECT 
                v.ID_VENTA, 
                v.FACTURA,
                v.FECHA, 
                v.TOTAL,
                COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS NOMBRE_CLIENTE,
                CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_VENDEDOR
            FROM VENTAS v
            LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
            LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
            ORDER BY v.ID_VENTA DESC
        `;

    const [rows] = await db.query(query);
    return rows;
  },

  // Crear una nueva venta
  create: async (venta) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insertar en VENTAS con FACTURA temporal
      const tempFactura = `TEMP-${Date.now()}`;

      // Intentar insertar con NOMBRE_CLIENTE_OCASIONAL si existe la columna
      let resultVenta;
      try {
        [resultVenta] = await connection.query(
          'INSERT INTO VENTAS (FECHA, ID_CLIENTE, NOMBRE_CLIENTE_OCASIONAL, ID_EMPLEADO, FACTURA) VALUES (?, ?, ?, ?, ?)',
          [venta.fecha, venta.id_cliente || null, venta.nombre_cliente_ocasional || null, venta.id_empleado, tempFactura]
        );
      } catch (colErr) {
        // Si la columna no existe, insertar sin ella
        [resultVenta] = await connection.query(
          'INSERT INTO VENTAS (FECHA, ID_CLIENTE, ID_EMPLEADO, FACTURA) VALUES (?, ?, ?, ?)',
          [venta.fecha, venta.id_cliente || null, venta.id_empleado, tempFactura]
        );
      }
      const idVenta = resultVenta.insertId;

      // 2. Calcular Total con IVA y Actualizar FACTURA y TOTAL
      const subtotalVenta = venta.items.reduce((sum, item) => sum + item.subtotal, 0);
      const tasaIVA = 0.15; // 15%
      const totalConIVA = subtotalVenta * (1 + tasaIVA); // Subtotal + 15% IVA
      const facturaFinal = `FAC-V${String(idVenta).padStart(3, '0')}`;

      await connection.query(
        'UPDATE VENTAS SET FACTURA = ?, TOTAL = ? WHERE ID_VENTA = ?',
        [facturaFinal, totalConIVA, idVenta]
      );

      // 3. Insertar productos en VENTAS_PRODUCTOS
      if (venta.items && venta.items.length > 0) {
        const values = venta.items.map(item => [
          idVenta,
          item.idProducto,
          item.cantidad,
          item.precioUnitario,
          item.subtotal
        ]);

        await connection.query(
          'INSERT INTO VENTAS_PRODUCTOS (ID_VENTA, ID_PRODUCTO, cantidad_neta, precio_venta, sub_total) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return idVenta;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Obtener una venta por ID con todos los detalles para la factura
  getById: async (id) => {
    const query = `
      SELECT 
        v.ID_VENTA,
        v.FACTURA,
        v.FECHA,
        v.TOTAL,
        COALESCE(c.NOMBRE, v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS NOMBRE_CLIENTE,
        c.APELLIDO AS APELLIDO_CLIENTE,
        c.TELEFONO AS TELEFONO_CLIENTE,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_VENDEDOR
      FROM VENTAS v
      LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
      LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
      WHERE v.ID_VENTA = ?
      ORDER BY v.ID_VENTA DESC
    `;

    const [rows] = await db.query(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    const venta = rows[0];

    // Obtener los productos de la venta
    const queryProductos = `
      SELECT 
        vp.cantidad_neta AS CANTIDAD,
        p.NOMBRE_PRODUCTO,
        vp.precio_venta AS PRECIO_UNITARIO,
        vp.sub_total AS SUBTOTAL
      FROM VENTAS_PRODUCTOS vp
      INNER JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
      WHERE vp.ID_VENTA = ?
    `;

    const [productos] = await db.query(queryProductos, [id]);
    venta.items = productos;

    return venta;
  },

  // LLAMADO A PROCEDIMIENTO ALMACENADO sp_VentasPorVendedor
  obtenerPorVendedor: async (id_empleado) => {
    try {
      const sql = 'CALL sp_VentasPorVendedor(?)';
      const [resultados] = await db.query(sql, [id_empleado]);
      return resultados[0];
    } catch (err) {
      throw new Error('Error al obtener ventas del vendedor: ' + err.message);
    }
  }
};

module.exports = Ventas;