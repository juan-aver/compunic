// Cargar variables de entorno PRIMERO
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth.routes.js');
const productosRoutes = require('./routes/productos.routes.js');
const ventasRoutes = require('./routes/ventas.routes.js');
const categoriasRoutes = require('./routes/categorias.routes.js');
const marcasRoutes = require('./routes/marcas.routes.js');
const movimientosStockRoutes = require('./routes/movimientos_stock.routes');
const comprasRoutes = require('./routes/compras.routes.js');
const proveedoresRoutes = require('./routes/proveedores.routes.js');
const vendedoresRoutes = require('./routes/vendedores.routes.js');
const clientesRoutes = require('./routes/clientes.routes.js');
const empleadosRoutes = require('./routes/empleados.routes.js');
const garantiasRoutes = require('./routes/garantias.routes.js');
const administradoresRoutes = require('./routes/administradores.routes.js');
const serviciosRoutes = require('./routes/servicios.routes.js');
const eTemporalesRoutes = require('./routes/e_temporales.routes.js');
const devolucionesRoutes = require('./routes/devoluciones.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const storeRoutes = require('./routes/store.routes.js');
const movimientosStockModel = require('./models/movimientos_stock.model');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- SERVIR ARCHIVOS ESTÁTICOS (SOLO EN LOCAL) ---
// En entorno netlify/serverless, esto interfiere o es inútil
if (!process.env.NETLIFY) {
    app.use(express.static(path.join(__dirname, '..', 'Frontend')));
    app.use('/Store', express.static(path.join(__dirname, '..', '..', 'Store')));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}


// --- DEFINICIÓN DE ENDPOINTS (URLS) ---
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/movimientos-stock', movimientosStockRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/garantias', garantiasRoutes);
app.use('/api/administradores', administradoresRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/e_temporales', eTemporalesRoutes);
app.use('/api/devoluciones', devolucionesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/store', storeRoutes);




// 2. Ejecutar la sincronización (no bloquea el arranque del servidor)
// Esto se ejecutará en segundo plano cada vez que guardes o reinicies
movimientosStockModel.sincronizarSiEstaVacio();


module.exports = app;