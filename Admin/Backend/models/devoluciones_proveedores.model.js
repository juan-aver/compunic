/*
 * Módulo: devoluciones_proveedores.model.js
 * Descripción: Modelo para gestionar devoluciones de productos a proveedores (REQ-FR-31, UR-03, UR-11).
 */
const db = require('../config/db');

const DevolucionesProveedores = {
  // Obtener todas las devoluciones a proveedores
  getAll: async () => {
    const query = `
      SELECT 
        dp.ID_DEVOLUCION_PROV,
        dp.ID_COMPRA,
        dp.ID_PROVEEDOR,
        dp.ID_PRODUCTO,
        dp.CANTIDAD,
        dp.MOTIVO,
        dp.ESTADO,
        dp.ID_EMPLEADO,
        dp.FECHA,
        prov.NOMBRE_EMPRESA AS NOMBRE_PROVEEDOR,
        prov.PERSONA_CONTACTO,
        prov.TELEFONO AS TELEFONO_PROVEEDOR,
        prov.EMAIL AS EMAIL_PROVEEDOR,
        p.NOMBRE_PRODUCTO,
        p.MODELO AS MODELO_PRODUCTO,
        p.IMAGEN_URL,
        p.PRECIO_COMPRA,
        (dp.CANTIDAD * p.PRECIO_COMPRA) AS COSTO_TOTAL,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_EMPLEADO,
        c.NUMERO_FACTURA_PROVEEDOR,
        c.FECHA_COMPRA
      FROM DEVOLUCIONES_PROVEEDORES dp
      JOIN PROVEEDORES prov ON dp.ID_PROVEEDOR = prov.ID_PROVEEDOR
      JOIN PRODUCTOS p ON dp.ID_PRODUCTO = p.ID_PRODUCTO
      JOIN EMPLEADOS e ON dp.ID_EMPLEADO = e.ID_EMPLEADO
      LEFT JOIN COMPRAS c ON dp.ID_COMPRA = c.ID_COMPRA
      ORDER BY dp.FECHA DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Obtener por ID
  getById: async (id) => {
    const query = `
      SELECT 
        dp.ID_DEVOLUCION_PROV,
        dp.ID_COMPRA,
        dp.ID_PROVEEDOR,
        dp.ID_PRODUCTO,
        dp.CANTIDAD,
        dp.MOTIVO,
        dp.ESTADO,
        dp.ID_EMPLEADO,
        dp.FECHA,
        prov.NOMBRE_EMPRESA AS NOMBRE_PROVEEDOR,
        prov.PERSONA_CONTACTO,
        prov.TELEFONO AS TELEFONO_PROVEEDOR,
        prov.EMAIL AS EMAIL_PROVEEDOR,
        prov.DIRECCION AS DIRECCION_PROVEEDOR,
        p.NOMBRE_PRODUCTO,
        p.MODELO AS MODELO_PRODUCTO,
        p.IMAGEN_URL,
        p.PRECIO_COMPRA,
        (dp.CANTIDAD * p.PRECIO_COMPRA) AS COSTO_TOTAL,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_EMPLEADO,
        c.NUMERO_FACTURA_PROVEEDOR,
        c.FECHA_COMPRA
      FROM DEVOLUCIONES_PROVEEDORES dp
      JOIN PROVEEDORES prov ON dp.ID_PROVEEDOR = prov.ID_PROVEEDOR
      JOIN PRODUCTOS p ON dp.ID_PRODUCTO = p.ID_PRODUCTO
      JOIN EMPLEADOS e ON dp.ID_EMPLEADO = e.ID_EMPLEADO
      LEFT JOIN COMPRAS c ON dp.ID_COMPRA = c.ID_COMPRA
      WHERE dp.ID_DEVOLUCION_PROV = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  // Registrar nueva devolución a proveedor
  create: async ({ id_proveedor, id_producto, cantidad, motivo, id_compra = null, id_empleado = 11, estado = 'Pendiente' }) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO DEVOLUCIONES_PROVEEDORES 
          (ID_PROVEEDOR, ID_PRODUCTO, CANTIDAD, MOTIVO, ID_COMPRA, ID_EMPLEADO, ESTADO, FECHA)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id_proveedor, id_producto, cantidad, motivo, id_compra || null, id_empleado, estado]
      );

      const idDevolucion = result.insertId;
      await connection.commit();
      return idDevolucion;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Actualizar estado de resolución de la devolución (REQ-FR-31)
  updateEstado: async (id, nuevoEstado) => {
    const [result] = await db.query(
      'UPDATE DEVOLUCIONES_PROVEEDORES SET ESTADO = ? WHERE ID_DEVOLUCION_PROV = ?',
      [nuevoEstado, id]
    );
    return result.affectedRows > 0;
  },

  // Obtener compras de un proveedor para relacionar facturas de compra
  getComprasPorProveedor: async (idProveedor) => {
    const query = `
      SELECT 
        c.ID_COMPRA,
        c.NUMERO_FACTURA_PROVEEDOR,
        c.FECHA_COMPRA,
        c.TOTAL_COMPRA,
        dc.ID_PRODUCTO,
        p.NOMBRE_PRODUCTO,
        dc.CANTIDAD AS CANTIDAD_COMPRADA,
        dc.PRECIO_UNITARIO_COMPRA
      FROM COMPRAS c
      JOIN DETALLE_COMPRA dc ON c.ID_COMPRA = dc.ID_COMPRA
      JOIN PRODUCTOS p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
      WHERE c.ID_PROVEEDOR = ?
      ORDER BY c.FECHA_COMPRA DESC
    `;
    const [rows] = await db.query(query, [idProveedor]);
    return rows;
  }
};

module.exports = DevolucionesProveedores;
