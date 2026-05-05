/**
 * @file compras.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// models/compras.model.js
const db = require('../config/db');

const Compras = {
  // Obtener todas las compras con nombre de proveedor
  obtenerCompras: async () => {
    const query = `
      SELECT 
        c.ID_COMPRA,
        c.FECHA_COMPRA,
        c.NUMERO_FACTURA_PROVEEDOR,
        c.TOTAL_COMPRA,
        15.00 as IVA_PORCENTAJE,
        p.NOMBRE_EMPRESA AS proveedor,
        (SELECT COUNT(*) FROM DETALLE_COMPRA dc WHERE dc.ID_COMPRA = c.ID_COMPRA) as items_count,
        COALESCE((SELECT MAX(dc.MESES_GARANTIA) FROM DETALLE_COMPRA dc WHERE dc.ID_COMPRA = c.ID_COMPRA), 0) as meses_garantia
      FROM COMPRAS c
      LEFT JOIN PROVEEDORES p ON c.ID_PROVEEDOR = p.ID_PROVEEDOR
      ORDER BY c.FECHA_COMPRA DESC
    `;
    try {
      const [resultados] = await db.query(query);
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener compras: ' + err.message);
    }
  },

  // Crear una nueva compra con sus detalles (Transacción)
  crearCompra: async (datosCompra) => {
    const { id_proveedor, id_administrador, numero_factura, total_compra, detalles, iva_porcentaje = 15.00 } = datosCompra;

    // detalles es un array de objetos: { id_producto, cantidad, precio_unitario, meses_garantia }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insertar en tabla COMPRAS
      // Manejo de error para restricción única UQ_PROVEEDOR_FACTURA
      try {
        const [resCompra] = await connection.query(
          'INSERT INTO COMPRAS (ID_PROVEEDOR, ID_ADMINISTRADOR, FECHA_COMPRA, NUMERO_FACTURA_PROVEEDOR, TOTAL_COMPRA) VALUES (?, ?, CURRENT_DATE, ?, ?)',
          [id_proveedor, id_administrador, numero_factura, total_compra]
        );
        var idCompra = resCompra.insertId;
      } catch (insertErr) {
        if (insertErr.code === 'ER_DUP_ENTRY') {
          throw new Error(`La factura "${numero_factura}" ya existe para este proveedor.`);
        }
        throw insertErr;
      }

      // 2. Insertar detalles en DETALLE_COMPRA
      for (const item of detalles) {
        await connection.query(
          'INSERT INTO DETALLE_COMPRA (ID_COMPRA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO_COMPRA, MESES_GARANTIA) VALUES (?, ?, ?, ?, ?)',
          [idCompra, item.id_producto, item.cantidad, item.precio_unitario, item.meses_garantia || 0]
        );

        // Actualizar precio de compra en PRODUCTOS (opcional, pero útil para referencia)
        await connection.query(
          'UPDATE PRODUCTOS SET PRECIO_COMPRA = ? WHERE ID_PRODUCTO = ?',
          [item.precio_unitario, item.id_producto]
        );
      }

      await connection.commit();
      return idCompra;

    } catch (err) {
      await connection.rollback();
      throw new Error(err.message); // Re-lanzar mensaje limpio
    } finally {
      connection.release();
    }
  },

  obtenerDetalleCompra: async (idCompra) => {
    const query = `
        SELECT 
            dc.ID_DETALLE,
            dc.CANTIDAD,
            dc.PRECIO_UNITARIO_COMPRA AS PRECIO_UNITARIO,
            dc.MESES_GARANTIA,
            dc.SUBTOTAL,
            p.NOMBRE_PRODUCTO
        FROM DETALLE_COMPRA dc
        JOIN PRODUCTOS p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE dc.ID_COMPRA = ?
      `;
    try {
      const [rows] = await db.query(query, [idCompra]);
      return rows;
    } catch (err) {
      throw new Error('Error al obtener detalles: ' + err.message);
    }
  }
};

module.exports = Compras;