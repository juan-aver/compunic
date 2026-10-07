/*
 * Módulo: cotizaciones.model.js
 * Descripción: Modelo para gestionar Proformas y Cotizaciones Comerciales (REQ-FR-19, REQ-FR-20, UR-08).
 * IMPORTANTE: No descuenta stock ni genera movimientos de inventario.
 */
const db = require('../config/db');

const Cotizaciones = {
  // Crear una nueva cotización / proforma
  create: async ({ id_cliente, id_empleado, dias_vigencia = 15, items = [], notas = '' }) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Generar número de cotización secuencial: COT-YYYY-XXXX
      const anio = new Date().getFullYear();
      const [countRows] = await connection.query(
        'SELECT COUNT(*) AS total FROM COTIZACIONES WHERE NUMERO_COTIZACION LIKE ?',
        [`COT-${anio}-%`]
      );
      const siguienteNum = (countRows[0]?.total || 0) + 1;
      const numeroCotizacion = `COT-${anio}-${String(siguienteNum).padStart(4, '0')}`;

      // 2. Calcular fecha de vencimiento
      const vigenciaNum = parseInt(dias_vigencia) || 15;
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaNum);
      const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

      // 3. Calcular subtotal, iva y total
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || (parseFloat(item.precio_unitario) * parseInt(item.cantidad))), 0);
      const iva = subtotal * 0.15;
      const total = subtotal + iva;

      // 4. Insertar cabecera de cotización
      const [result] = await connection.query(
        `INSERT INTO COTIZACIONES 
          (NUMERO_COTIZACION, FECHA_EMISION, FECHA_VENCIMIENTO, ID_CLIENTE, ID_EMPLEADO, SUBTOTAL, IVA, TOTAL, ESTADO, NOTAS)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, 'Pendiente', ?)`,
        [numeroCotizacion, fechaVencimientoStr, id_cliente, id_empleado, subtotal, iva, total, notas || null]
      );

      const idCotizacion = result.insertId;

      // 5. Insertar líneas de productos en COTIZACION_PRODUCTOS
      for (const item of items) {
        const cant = parseInt(item.cantidad) || 1;
        const precio = parseFloat(item.precio_unitario) || 0;
        const itemSubtotal = parseFloat(item.subtotal) || (cant * precio);

        await connection.query(
          `INSERT INTO COTIZACION_PRODUCTOS 
            (ID_COTIZACION, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)
           VALUES (?, ?, ?, ?, ?)`,
          [idCotizacion, item.id_producto, cant, precio, itemSubtotal]
        );
      }

      await connection.commit();
      return {
        id_cotizacion: idCotizacion,
        numero_cotizacion: numeroCotizacion,
        fecha_vencimiento: fechaVencimientoStr,
        subtotal,
        iva,
        total
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Obtener todas las cotizaciones con datos de cliente y empleado
  getAll: async () => {
    const query = `
      SELECT 
        c.ID_COTIZACION,
        c.NUMERO_COTIZACION,
        c.FECHA_EMISION,
        c.FECHA_VENCIMIENTO,
        c.SUBTOTAL,
        c.IVA,
        c.TOTAL,
        c.ESTADO,
        c.NOTAS,
        c.ID_CLIENTE,
        c.ID_EMPLEADO,
        CONCAT(cl.NOMBRE, ' ', cl.APELLIDO) AS NOMBRE_CLIENTE,
        cl.CEDULA AS CEDULA_CLIENTE,
        cl.TELEFONO AS TELEFONO_CLIENTE,
        cl.EMAIL AS EMAIL_CLIENTE,
        cl.RAZON_SOCIAL,
        cl.RUC,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_EMPLEADO,
        DATEDIFF(c.FECHA_VENCIMIENTO, CURRENT_DATE) AS DIAS_RESTANTES,
        CASE 
          WHEN c.ESTADO = 'Pendiente' AND c.FECHA_VENCIMIENTO < CURRENT_DATE THEN 'Vencida'
          ELSE c.ESTADO 
        END AS ESTADO_CALCULADO,
        (SELECT COUNT(*) FROM COTIZACION_PRODUCTOS cp WHERE cp.ID_COTIZACION = c.ID_COTIZACION) AS TOTAL_ITEMS
      FROM COTIZACIONES c
      JOIN CLIENTES cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      JOIN EMPLEADOS e ON c.ID_EMPLEADO = e.ID_EMPLEADO
      ORDER BY c.FECHA_EMISION DESC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  // Obtener cotización por ID con sus productos
  getById: async (id) => {
    const [cotRows] = await db.query(
      `SELECT 
        c.ID_COTIZACION,
        c.NUMERO_COTIZACION,
        c.FECHA_EMISION,
        c.FECHA_VENCIMIENTO,
        c.SUBTOTAL,
        c.IVA,
        c.TOTAL,
        c.ESTADO,
        c.NOTAS,
        c.ID_CLIENTE,
        c.ID_EMPLEADO,
        CONCAT(cl.NOMBRE, ' ', cl.APELLIDO) AS NOMBRE_CLIENTE,
        cl.CEDULA AS CEDULA_CLIENTE,
        cl.TELEFONO AS TELEFONO_CLIENTE,
        cl.EMAIL AS EMAIL_CLIENTE,
        cl.RAZON_SOCIAL,
        cl.RUC,
        CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS NOMBRE_EMPLEADO,
        DATEDIFF(c.FECHA_VENCIMIENTO, CURRENT_DATE) AS DIAS_RESTANTES
      FROM COTIZACIONES c
      JOIN CLIENTES cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      JOIN EMPLEADOS e ON c.ID_EMPLEADO = e.ID_EMPLEADO
      WHERE c.ID_COTIZACION = ?`,
      [id]
    );

    if (cotRows.length === 0) return null;

    const cotizacion = cotRows[0];

    const [items] = await db.query(
      `SELECT 
        cp.ID_PRODUCTO,
        cp.CANTIDAD,
        cp.PRECIO_UNITARIO,
        cp.SUBTOTAL,
        p.NOMBRE_PRODUCTO,
        p.MODELO,
        p.IMAGEN_URL,
        m.NOMBRE_MARCA,
        gt.TIPO AS GARANTIA_TIPO,
        g.DURACION_MESES AS GARANTIA_MESES,
        g.CONDICION AS GARANTIA_CONDICION
      FROM COTIZACION_PRODUCTOS cp
      JOIN PRODUCTOS p ON cp.ID_PRODUCTO = p.ID_PRODUCTO
      LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
      LEFT JOIN GARANTIAS g ON p.ID_GARANTIAS = g.ID_GARANTIA
      LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
      WHERE cp.ID_COTIZACION = ?`,
      [id]
    );

    cotizacion.items = items;
    return cotizacion;
  },

  // Cambiar estado de una cotización
  updateEstado: async (id, nuevoEstado) => {
    const [result] = await db.query(
      'UPDATE COTIZACIONES SET ESTADO = ? WHERE ID_COTIZACION = ?',
      [nuevoEstado, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Cotizaciones;
