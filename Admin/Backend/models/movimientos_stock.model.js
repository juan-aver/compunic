
// models/movimientos_stock.model.js
const pool = require('../config/db');

const movimientosStockModel = {

  // 1. REGISTRAR UN MOVIMIENTO NUEVO (Tiempo Real)
  registrarMovimiento: async (productoId, nombreProducto, tipoMovimiento, motivo, cantidad, stockResultante) => {
    const sql = `
      INSERT INTO MOVIMIENTOS_STOCK 
        (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE, ID_EMPLEADO)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `;
    await pool.query(sql, [productoId, nombreProducto, tipoMovimiento, motivo, cantidad, stockResultante]);
  },

  // 2. OBTENER EL HISTORIAL (Para la Tabla del Frontend)
  obtenerHistorial: async () => {
    const sql = `SELECT * FROM MOVIMIENTOS_STOCK ORDER BY FECHA_MOVIMIENTO DESC, ID_MOVIMIENTO DESC`;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // 3. SINCRONIZACIÓN INTELIGENTE (Reparación Automática)
  sincronizarSiEstaVacio: async () => {
    try {
      // A. Verificar si la tabla ya tiene datos
      const [check] = await pool.query("SELECT COUNT(*) as total FROM MOVIMIENTOS_STOCK");
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
        FROM DETALLE_COMPRA dc
        JOIN COMPRAS c ON dc.ID_COMPRA = c.ID_COMPRA
        JOIN PRODUCTOS p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
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
          v.ESTADO,
          'salida' as TIPO
        FROM VENTAS_PRODUCTOS vp
        JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA
        JOIN PRODUCTOS p ON vp.ID_PRODUCTO = p.ID_PRODUCTO
      `;
      const [ventas] = await pool.query(sqlVentas);

      // C2. Generar Entradas para las Ventas Rechazadas
      const rechazos = ventas
        .filter(v => v.ESTADO === 'Rechazado')
        .map(v => ({
            ...v,
            TIPO: 'entrada',
            // Añadimos un pequeño retraso a la fecha para que la entrada suceda después de la salida
            FECHA: new Date(new Date(v.FECHA).getTime() + 1000).toISOString() 
        }));

      // C3. Generar Entradas por Reingresos de Garantías/Devoluciones
      const sqlReingresos = `
        SELECT 
          d.ID_PRODUCTO_SEMINUEVO as ID_PRODUCTO, 
          p.NOMBRE_PRODUCTO, 
          d.CANTIDAD, 
          d.FECHA_DEVOLUCION as FECHA, 
          CONCAT('Dev: ', d.ID_DEVOLUCION) as REF, 
          'entrada' as TIPO
        FROM DEVOLUCIONES d
        JOIN PRODUCTOS p ON d.ID_PRODUCTO_SEMINUEVO = p.ID_PRODUCTO
        WHERE d.ACCION = 'reingreso' AND d.REINGRESO_CONFIRMADO = 1
      `;
      const [reingresos] = await pool.query(sqlReingresos);

      // C4. Generar Salidas por Reemplazos de Garantías
      const sqlReemplazos = `
        SELECT 
          d.ID_PRODUCTO_REEMPLAZO as ID_PRODUCTO, 
          p.NOMBRE_PRODUCTO, 
          d.CANTIDAD, 
          d.FECHA_DEVOLUCION as FECHA, 
          CONCAT('Dev: ', d.ID_DEVOLUCION) as REF, 
          'salida' as TIPO
        FROM DEVOLUCIONES d
        JOIN PRODUCTOS p ON d.ID_PRODUCTO_REEMPLAZO = p.ID_PRODUCTO
        WHERE d.ID_PRODUCTO_REEMPLAZO IS NOT NULL
      `;
      const [reemplazos] = await pool.query(sqlReemplazos);

      // C5. Generar Salidas por Mermas
      const sqlMermas = `
        SELECT 
          m.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          m.CANTIDAD,
          m.FECHA_REGISTRO as FECHA,
          CONCAT('Merma #', m.ID_MERMA, ' (', m.MOTIVO, '): ', m.JUSTIFICACION) as REF,
          'salida' as TIPO
        FROM MERMAS m
        JOIN PRODUCTOS p ON m.ID_PRODUCTO = p.ID_PRODUCTO
      `;
      const [mermas] = await pool.query(sqlMermas);

      // C6. Generar Salidas por Devoluciones a Proveedores
      const sqlDevProv = `
        SELECT 
          dp.ID_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          dp.CANTIDAD,
          dp.FECHA,
          CONCAT('Dev. Proveedor #', dp.ID_DEVOLUCION_PROV, ': ', dp.MOTIVO) as REF,
          'salida' as TIPO
        FROM DEVOLUCIONES_PROVEEDORES dp
        JOIN PRODUCTOS p ON dp.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE dp.ESTADO = 'Aprobada'
      `;
      const [devProv] = await pool.query(sqlDevProv);

      // D. Unir y Ordenar Cronológicamente
      let movimientos = [...compras, ...ventas, ...rechazos, ...reingresos, ...reemplazos, ...mermas, ...devProv];
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
        let motivo = '';
        const refStr = mov.REF || '';
        if (mov.TIPO === 'entrada') {
          if (refStr.startsWith('Dev:')) motivo = `Reingreso por Devolución: ${refStr}`;
          else if (mov.ESTADO === 'Rechazado') motivo = `Venta Rechazada: ${refStr}`;
          else motivo = `Compra Factura: ${refStr}`;
        } else {
          if (refStr.startsWith('Dev:')) motivo = `Reemplazo entregado por Devolución: ${refStr}`;
          else motivo = `Venta Factura: ${refStr}`;
        }

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
          INSERT INTO MOVIMIENTOS_STOCK 
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