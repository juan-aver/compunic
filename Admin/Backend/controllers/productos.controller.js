/**
 * @file productos.controller.js
 * @description Controlador maestro para Productos. Maneja lógica de negocio y carga de imágenes a ImgBB.
 * @date 8 de abril de 2026
 */

const Producto = require('../models/productos.model.js');
const movimientosStockController = require('./movimientos_stock.controller');
const AuditoriaModel = require('../models/auditoria.model');
const db = require('../config/db.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Configuración híbrida de multer: Memoria para Cloud (ImgBB) o Disco para Local
let storage;
if (process.env.IMGBB_API_KEY) {
  // En la nube usamos memoria para luego enviarlo a ImgBB
  storage = multer.memoryStorage();
} else {
  // En local seguimos usando el disco
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '../uploads/productos');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'producto_' + uniqueSuffix + ext);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * Función auxiliar para subir a ImgBB
 */
async function subirAImgBB(buffer, fileName) {
  const form = new FormData();
  form.append('image', buffer.toString('base64'));

  try {
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, form, {
      headers: form.getHeaders()
    });
    return response.data.data.url;
  } catch (error) {
    console.error('Error subiendo a ImgBB:', error.response ? error.response.data : error.message);
    throw new Error('Error al subir la imagen a la nube.');
  }
}

const eliminarImagen = (imagenUrl) => {
  if (!imagenUrl || imagenUrl.startsWith('http')) return;
  try {
    const imagePath = path.join(__dirname, '..', imagenUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (err) {
    console.error('Error al eliminar imagen:', err.message);
  }
};

const parseFK = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const productosController = {
  listar: async (req, res) => {
    try {
      const resultados = await Producto.obtenerTodos();
      const normalizados = resultados.map(r => {
        const stockNum = Number(r.stock_actual_calculado ?? r.stock ?? r.STOCK ?? 0) || 0;
        return {
          id_producto: r.ID_PRODUCTO ?? r.id_producto ?? r.ID ?? null,
          nombre: r.NOMBRE ?? r.NOMBRE_PRODUCTO ?? r.nombre ?? '',
          modelo: r.MODELO ?? r.modelo ?? '',
          descripcion: r.DESCRIPCION ?? r.descripcion ?? '',
          imagen_url: r.IMAGEN_URL ?? r.imagen_url ?? null,
          activo: r.ACTIVO !== undefined ? Number(r.ACTIVO) : 1,
          precio_compra: r.PRECIO_COMPRA ?? r.precio_compra ?? 0,
          precio_venta: r.PRECIO_VENTA ?? r.precio_venta ?? 0,
          nombre_marca: r.nombre_marca ?? r.NOMBRE_MARCA ?? '',
          nombre_proveedor: r.nombre_proveedor ?? r.NOMBRE_EMPRESA ?? r.NOMBRE_PROVEEDOR ?? '',
          nombre_categoria: r.nombre_categoria ?? r.NOMBRE_CATEGORIA ?? '',
          garantia_meses: r.GARANTIA_MESES ?? r.garantia_meses ?? null,
          stock: stockNum,
          _raw: {
            ID_MARCA: r.ID_MARCA ?? null,
            ID_PROVEEDOR: r.ID_PROVEEDOR ?? null,
            ID_GARANTIAS: r.ID_GARANTIAS ?? null,
            ID_CATEGORIA: r.categoria_ids ? String(r.categoria_ids).split(',').map(s => s.trim())[0] : null,
            categoria_ids: r.categoria_ids ?? null
          }
        };
      });
      res.json(normalizados);
    } catch (err) {
      res.status(500).json({ error: 'No se pudieron obtener los productos.' });
    }
  },

  crear: async (req, res) => {
    const { nombre, modelo, descripcion, id_marca, id_empleado, id_garantias, id_proveedor, id_categoria } = req.body;

    let imagenUrl = null;
    try {
      if (req.file) {
        if (process.env.IMGBB_API_KEY) {
          imagenUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
        } else {
          imagenUrl = 'uploads/productos/' + req.file.filename;
        }
      }

      let adminId = id_empleado;
      if (!adminId) {
        const [rows] = await db.query("SELECT ID_EMPLEADO FROM EMPLEADOS WHERE ROL='ADMIN' LIMIT 1");
        adminId = rows[0]?.ID_EMPLEADO;
      }

      const explicitId = req.body.id_producto ?? req.body.id;
      let productoId;
      const cleanMarca = parseFK(id_marca);
      const cleanGarantias = parseFK(id_garantias);
      const cleanProveedor = parseFK(id_proveedor);
      const cleanCategoria = parseFK(id_categoria);

      const datosBase = [nombre, modelo, descripcion, imagenUrl, 0, 0, cleanMarca, adminId, cleanGarantias, cleanProveedor];

      if (explicitId) {
        await Producto.agregar([explicitId, ...datosBase]);
        productoId = explicitId;
      } else {
        const result = await Producto.agregar(datosBase);
        productoId = result.insertId;
      }

      if (cleanCategoria) {
        await db.query('INSERT INTO PRODUCTO_CATEGORIA (ID_PRODUCTO, ID_CATEGORIA) VALUES (?, ?)', [productoId, cleanCategoria]);
      }

      res.json({ mensaje: 'Producto creado', id: productoId });

      // Auditoría
      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'CREAR',
        tabla: 'PRODUCTOS',
        descripcion: `Se agregó el nuevo producto "${nombre}" (ID: ${productoId})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      res.status(500).json({ error: 'Error al crear el producto', detail: err.message });
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre, modelo, descripcion, precio_compra, precio_venta, id_marca, id_empleado, id_garantias, id_proveedor, id_categoria, stock, activo } = req.body;

    try {
      // ⭐ Caso especial: solo se pide dar de baja (activo: 0)
      if (activo !== undefined && Object.keys(req.body).length === 1) {
        try {
          await db.query('UPDATE PRODUCTOS SET ACTIVO = ? WHERE ID_PRODUCTO = ?', [activo, id]);
        } catch (colErr) {
          // Si la columna ACTIVO no existe, la agregamos
          if (colErr.code === 'ER_BAD_FIELD_ERROR') {
            await db.query('ALTER TABLE PRODUCTOS ADD COLUMN ACTIVO TINYINT(1) DEFAULT 1');
            await db.query('UPDATE PRODUCTOS SET ACTIVO = ? WHERE ID_PRODUCTO = ?', [activo, id]);
          } else throw colErr;
        }
        const accion = activo === 0 ? 'DAR DE BAJA' : 'REACTIVAR';
        AuditoriaModel.registrar({
          id_empleado: req.userId || null,
          username: req.username || 'Sistema',
          accion: accion,
          tabla: 'PRODUCTOS',
          descripcion: `Se dio de baja el producto ID: ${id}`
        }).catch(e => console.error('Audit log error:', e));
        return res.json({ mensaje: activo === 0 ? 'Producto dado de baja' : 'Producto reactivado' });
      }

      const [productoActual] = await db.query('SELECT IMAGEN_URL FROM PRODUCTOS WHERE ID_PRODUCTO = ?', [id]);
      let imagenUrl = productoActual[0]?.IMAGEN_URL;

      if (req.file) {
        if (!imagenUrl?.startsWith('http')) eliminarImagen(imagenUrl);

        if (process.env.IMGBB_API_KEY) {
          imagenUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
        } else {
          imagenUrl = 'uploads/productos/' + req.file.filename;
        }
      }

      const [pStock] = await Producto.obtenerStockCalculado(id);
      const stockAnterior = pStock ? pStock.stock : 0;

      let adminId = id_empleado;
      if (!adminId) {
        const [rows] = await db.query("SELECT ID_EMPLEADO FROM EMPLEADOS WHERE ROL='ADMIN' LIMIT 1");
        adminId = rows[0]?.ID_EMPLEADO;
      }

      const cleanMarca = parseFK(id_marca);
      const cleanGarantias = parseFK(id_garantias);
      const cleanProveedor = parseFK(id_proveedor);
      const cleanCategoria = parseFK(id_categoria);
      
      const cleanPrecioCompra = (precio_compra !== undefined && precio_compra !== '') ? parseFloat(precio_compra) : 0;
      const cleanPrecioVenta = (precio_venta !== undefined && precio_venta !== '') ? parseFloat(precio_venta) : 0;

      await Producto.actualizar([nombre, modelo, descripcion, imagenUrl, cleanPrecioCompra, cleanPrecioVenta, cleanMarca, adminId, cleanGarantias, cleanProveedor, id]);

      await db.query('DELETE FROM PRODUCTO_CATEGORIA WHERE ID_PRODUCTO = ?', [id]);
      if (cleanCategoria) {
        await db.query('INSERT INTO PRODUCTO_CATEGORIA (ID_PRODUCTO, ID_CATEGORIA) VALUES (?, ?)', [id, cleanCategoria]);
      }

      if (stock !== undefined && parseInt(stock) !== stockAnterior) {
        const cantidad = parseInt(stock) - stockAnterior;
        await movimientosStockController.registrarModificacion(id, nombre, cantidad, parseInt(stock));
      }

      res.json({ mensaje: 'Producto actualizado' });

      // Auditoría
      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'MODIFICAR',
        tabla: 'PRODUCTOS',
        descripcion: `Se modificó el producto "${nombre}" (ID: ${id})` + (precio_venta ? ` | Nuevo precio de venta: L. ${precio_venta}` : '')
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar el producto', detail: err.message });
    }
  },

  // LLAMADO A PROCEDIMIENTO ALMACENADO sp_BuscarPrecioProducto
  buscarPrecio: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Falta el parámetro de búsqueda (q)' });
    try {
      const resultados = await Producto.buscarPrecio(q);
      res.json(resultados);
    } catch (err) {
      console.error('Error al buscar precio:', err);
      res.status(500).json({ error: 'Error al buscar precio del producto', detail: err.message });
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    try {
      const [productoDatos] = await Producto.obtenerNombreYStock(id);
      if (!productoDatos || productoDatos.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      const { nombre, stock } = productoDatos;
      const [pActual] = await db.query('SELECT IMAGEN_URL FROM PRODUCTOS WHERE ID_PRODUCTO = ?', [id]);
      const imagenUrl = pActual[0]?.IMAGEN_URL;

      await Producto.eliminar(id);
      if (!imagenUrl?.startsWith('http')) eliminarImagen(imagenUrl);

      if (stock > 0) {
        await movimientosStockController.registrarSalida(id, nombre, stock);
      }

      res.json({ mensaje: 'Producto eliminado' });

      // Auditoría
      AuditoriaModel.registrar({
        id_empleado: req.userId || null,
        username: req.username || 'Sistema',
        accion: 'ELIMINAR',
        tabla: 'PRODUCTOS',
        descripcion: `Se eliminó el producto "${nombre}" (ID: ${id})`
      }).catch(e => console.error('Audit log error:', e));
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar el producto', detail: err.message });
    }
  }
};

module.exports = productosController;
module.exports.upload = upload;