/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: movimientos_stock.model.js
 * Descripción: Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
// models/movimientos_stock.model.js
const pool = require('../config/db');

const movimientosStockModel = {

  // 1. REGISTRAR UN MOVIMIENTO NUEVO (Tiempo Real)
  registrarMovimiento: async (productoId, nombreProducto, tipoMovimiento, motivo, cantidad, stockResultante) => {
    const sql = `
      INSERT INTO compunic_v5.movimientos_stock 
        (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE, ID_USUARIO)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `;
    await pool.query(sql, [productoId, nombreProducto, tipoMovimiento, motivo, cantidad, stockResultante]);
  },

  // 2. OBTENER EL HISTORIAL (Para la Tabla del Frontend)
  obtenerHistorial: async () => {
    const sql = `SELECT * FROM compunic_v5.movimientos_stock ORDER BY FECHA_MOVIMIENTO DESC`;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // 3. SINCRONIZACIÓN INTELIGENTE (Reparación Automática)
  sincronizarSiEstaVacio: async () => {
    try {
      // A. Verificar si la tabla ya tiene datos
      const [check] = await pool.query("SELECT COUNT(*) as total FROM compunic_v5.movimientos_stock");
      if (check[0].total > 0) {
        console.log("✅ Historial de stock verificado (Ya contiene datos).");
        return;
      }

      console.log("⚠️ Iniciando reconstrucción del historial (Cálculo Matemático Puro)...");

      // B. Obtener todas las COMPRAS (Entradas)
      const sqlCompras = `
        SELECT 
          dc.ID_PRODUCTO, 
          p.NOMBRE_PRODUCTO, 
          dc.CANTIDAD, 
          c.FECHA_COMPRA as FECHA, 
          c.NUMERO_FACTURA_PROVEEDOR as REF, 
          'entrada' as TIPO
        FROM compunic_v5.detalle_compra dc
        JOIN compunic_v5.compras c ON dc.ID_COMPRA = c.ID_COMPRA
        JOIN compunic_v5.productos p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
      `;
      const [compras] = await pool.query(sqlCompras);

      // C. Obtener todas las VENTAS (Salidas)
      const sqlVentas = `
        SELECT 
          vp.ID_PRODUCTO, 
          p.NOMBRE_PRODUCTO, 
          vp.cantidad_neta as CANTIDAD, 
          v.FECHA, 
          v.FACTURA as REF, 
          'salida' as TIPO
        FROM compunic_v5.ventas_productos vp
        JOIN compunic_v5.ventas v ON vp.ID_VENTA = v.ID_VENTA
        JOIN compunic_v5.productos p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
      `;
      const [ventas] = await pool.query(sqlVentas);

      // D. Unir y Ordenar Cronológicamente
      let movimientos = [...compras, ...ventas];
      // Ordenamos por fecha (del más viejo al más nuevo)
      movimientos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));

      // E. Calcular Stock Paso a Paso
      let inventarioMap = {};
      let inserts = [];

      for (let mov of movimientos) {
        const id = mov.ID_PRODUCTO;

        // Inicializar en 0 si es la primera vez que vemos este producto
        if (!inventarioMap[id]) inventarioMap[id] = 0;

        // MATEMÁTICA PURA (Sin restricciones de negativos para evitar errores de desfase)
        if (mov.TIPO === 'entrada') {
          inventarioMap[id] += mov.CANTIDAD;
        } else {
          inventarioMap[id] -= mov.CANTIDAD;
        }

        // Definir el texto del motivo
        let motivo = mov.TIPO === 'entrada'
          ? `Compra Factura: ${mov.REF}`
          : `Venta Factura: ${mov.REF}`;

        // Guardar para insertar
        inserts.push([
          id,
          mov.NOMBRE_PRODUCTO,
          mov.TIPO,
          motivo,
          mov.CANTIDAD,
          inventarioMap[id], // Guardamos el resultado de la suma/resta actual
          new Date(mov.FECHA)
        ]);
      }

      // F. Insertar en Base de Datos
      if (inserts.length > 0) {
        const sqlInsert = `
          INSERT INTO compunic_v5.movimientos_stock 
          (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE, FECHA_MOVIMIENTO)
          VALUES ?
        `;
        await pool.query(sqlInsert, [inserts]);
        console.log(`🔄 Historial regenerado correctamente: ${inserts.length} movimientos procesados.`);
      }

    } catch (error) {
      console.error("❌ Error crítico en la sincronización:", error);
    }
  }
};

module.exports = movimientosStockModel;