const path = require('path');
// Cargar variables de entorno PRIMERO
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

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
const cajaRoutes = require('./routes/caja.routes.js');
const divisasRoutes = require('./routes/divisas.routes.js');


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
    app.use('/Tecnico', express.static(path.join(__dirname, '..', '..', 'Tecnico')));
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
app.use('/api/caja', cajaRoutes);
app.use('/api/divisas', divisasRoutes);



// 2. Ejecutar la sincronización (no bloquea el arranque del servidor)
// Esto se ejecutará en segundo plano cada vez que guardes o reinicies
movimientosStockModel.sincronizarSiEstaVacio();

// Auto-verificar y migrar columnas de DEVOLUCIONES en base de datos si faltan (para producción)
(async () => {
    try {
        const pool = require('./config/db');
        const [cols] = await pool.query('SHOW COLUMNS FROM DEVOLUCIONES');
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('ESTADO_SOLICITUD')) {
            await pool.query(`
                ALTER TABLE DEVOLUCIONES 
                ADD COLUMN ESTADO_SOLICITUD ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Completada') NOT NULL DEFAULT 'Pendiente',
                ADD COLUMN MOTIVO_RECHAZO TEXT NULL,
                ADD COLUMN FECHA_RESOLUCION DATETIME NULL
            `);
            console.log('✅ Auto-migración: Columnas de autorización agregadas a DEVOLUCIONES en producción.');
        } else {
            // Asegurar que el ENUM incluya 'Completada'
            await pool.query(`
                ALTER TABLE DEVOLUCIONES 
                MODIFY COLUMN ESTADO_SOLICITUD ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Completada') NOT NULL DEFAULT 'Pendiente'
            `);
        }

        if (!colNames.includes('ID_PRODUCTO_REEMPLAZO')) {
            await pool.query(`
                ALTER TABLE DEVOLUCIONES 
                ADD COLUMN ID_PRODUCTO_REEMPLAZO INT NULL,
                ADD COLUMN SERIES_REEMPLAZO TEXT NULL
            `);
            console.log('✅ Auto-migración: Columnas de reemplazo agregadas a DEVOLUCIONES en producción.');
        }
    } catch (err) {
        console.error('⚠️ Auto-migración DEVOLUCIONES:', err.message);
    }
})();

// Auto-verificar y migrar columnas de SERVICIOS y SERVICIO_ESTADOS (para Railway y local)
(async () => {
    try {
        const pool = require('./config/db');
        
        // 1. Asegurar estado 'En Pausa' (ID 4)
        await pool.query(`
            INSERT INTO SERVICIO_ESTADOS (ID_SERVICIO_ESTADO, ESTADO) VALUES (4, 'En Pausa')
            ON DUPLICATE KEY UPDATE ESTADO = VALUES(ESTADO)
        `);

        // 2. Asegurar MOTIVO_PAUSA en SERVICIOS
        const [servCols] = await pool.query('SHOW COLUMNS FROM SERVICIOS');
        const servColNames = servCols.map(c => c.Field);
        if (!servColNames.includes('MOTIVO_PAUSA')) {
            await pool.query(`
                ALTER TABLE SERVICIOS 
                ADD COLUMN MOTIVO_PAUSA VARCHAR(500) NULL AFTER NOTAS_TECNICAS
            `);
            console.log('✅ Auto-migración: MOTIVO_PAUSA agregado a SERVICIOS.');
        }
    } catch (err) {
        console.error('⚠️ Auto-migración SERVICIOS:', err.message);
    }
})();

// 3. Inicializar AURUM (Gemini IA)
aurumService.inicializarGemini();


module.exports = app;