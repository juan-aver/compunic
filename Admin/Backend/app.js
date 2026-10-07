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

const clientesRoutes = require('./routes/clientes.routes.js');
const empleadosRoutes = require('./routes/empleados.routes.js');
const garantiasRoutes = require('./routes/garantias.routes.js');

const serviciosRoutes = require('./routes/servicios.routes.js');

const devolucionesRoutes = require('./routes/devoluciones.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const storeRoutes = require('./routes/store.routes.js');
const storeAuthRoutes = require('./routes/store.auth.routes.js');
const movimientosStockModel = require('./models/movimientos_stock.model');
const aurumRoutes = require('./routes/aurum.routes.js');
const aurumService = require('./services/aurum.service');
const pagosRoutes  = require('./routes/pagos.routes.js');
const auditoriaRoutes = require('./routes/auditoria.routes.js');
const seriesRoutes = require('./routes/series.routes.js');
const mermasRoutes = require('./routes/mermas.routes.js');
const cotizacionesRoutes = require('./routes/cotizaciones.routes.js');
const devolucionesProveedoresRoutes = require('./routes/devoluciones_proveedores.routes.js');
const reportesRoutes = require('./routes/reportes.routes.js');


const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE EXTRACCIÓN DE CONTEXTO DE USUARIO ---
app.use((req, res, next) => {
    req.userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : null;
    req.username = req.headers['x-user-username'] || null;
    next();
});

// --- SERVIR ARCHIVOS ESTÁTICOS (SOLO EN LOCAL) ---
// En entorno netlify/serverless, esto interfiere o es inútil
if (!process.env.NETLIFY) {
    app.use(express.static(path.join(__dirname, '..', 'Frontend')));
    app.use('/Store', express.static(path.join(__dirname, '..', '..', 'Store')));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/uploads/comprobantes', express.static(path.join(__dirname, 'uploads', 'comprobantes')));
}


// --- DEFINICIÓN DE ENDPOINTS (URLS) ---
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/movimientos-stock', movimientosStockRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/marcas', marcasRoutes);

app.use('/api/clientes', clientesRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/garantias', garantiasRoutes);

app.use('/api/servicios', serviciosRoutes);

app.use('/api/devoluciones', devolucionesRoutes);
app.use('/api/devoluciones-proveedores', devolucionesProveedoresRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/store/auth', storeAuthRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/aurum', aurumRoutes);
app.use('/api/admin/pagos', pagosRoutes);
app.use('/api/auditorias', auditoriaRoutes);
app.use('/api/reportes/auditoria', auditoriaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/mermas', mermasRoutes);



// 2. Ejecutar la sincronización (no bloquea el arranque del servidor)
// Esto se ejecutará en segundo plano cada vez que guardes o reinicies
movimientosStockModel.sincronizarSiEstaVacio();

// 3. Inicializar AURUM (Gemini IA)
aurumService.inicializarGemini();


module.exports = app;