// controllers/store.auth.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const EmailService = require('../services/email.service');

async function asegurarTablaResetTokens() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS CLIENTES_RESET_TOKENS (
                ID INT PRIMARY KEY AUTO_INCREMENT,
                ID_CLIENTE INT NOT NULL,
                TOKEN VARCHAR(255) NOT NULL UNIQUE,
                EXPIRA_EN DATETIME NOT NULL,
                USADO TINYINT DEFAULT 0,
                CREADO_EN DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_token (TOKEN),
                INDEX idx_expira (EXPIRA_EN)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (e) {
        console.warn('Advertencia asegurando CLIENTES_RESET_TOKENS:', e.message);
    }
}

const storeAuthController = {
    // Registrar un nuevo cliente desde la web
    register: async (req, res) => {
        try {
            const { nombre, apellido, telefono, email, password, cedula } = req.body;

            if (!nombre || !email || !password || !cedula || !telefono) {
                return res.status(400).json({ success: false, message: 'Nombre, email, contraseña, cédula y teléfono son obligatorios' });
            }

            // Verificar si el correo ya existe
            const [existing] = await db.query('SELECT ID_CLIENTE FROM clientes WHERE EMAIL = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
            }

            // Encriptar la contraseña
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insertar el nuevo cliente (por defecto tienen 0 puntos)
            const [result] = await db.query(
                'INSERT INTO clientes (NOMBRE, APELLIDO, TELEFONO, EMAIL, PASSWORD_HASH, CEDULA, PUNTOS) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido || '', telefono, email, passwordHash, cedula, 0]
            );

            // Generar token JWT para que el cliente quede logueado de inmediato
            const token = jwt.sign(
                { id: result.insertId, email: email, role: 'cliente' },
                process.env.JWT_SECRET || 'clave_secreta_super_segura',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Cuenta creada exitosamente',
                token,
                cliente: {
                    id: result.insertId,
                    nombre,
                    email,
                    cedula,
                    puntos: 0
                }
            });

        } catch (error) {
            console.error('Error en registro de cliente:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Iniciar sesión (Login)
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
            }

            // Buscar al cliente
            const [clientes] = await db.query('SELECT * FROM clientes WHERE EMAIL = ?', [email]);
            if (clientes.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            const cliente = clientes[0];

            // Si el cliente fue creado desde el administrador y no tiene password web
            if (!cliente.PASSWORD_HASH) {
                return res.status(401).json({ success: false, message: 'Esta cuenta no tiene habilitado el acceso web. Por favor regístrese.' });
            }

            // Validar contraseña
            const validPassword = await bcrypt.compare(password, cliente.PASSWORD_HASH);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            // Generar token
            const token = jwt.sign(
                { id: cliente.ID_CLIENTE, email: cliente.EMAIL, role: 'cliente' },
                process.env.JWT_SECRET || 'clave_secreta_super_segura',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                cliente: {
                    id: cliente.ID_CLIENTE,
                    nombre: cliente.NOMBRE,
                    apellido: cliente.APELLIDO,
                    email: cliente.EMAIL,
                    cedula: cliente.CEDULA,
                    puntos: cliente.PUNTOS
                }
            });

        } catch (error) {
            console.error('Error en login de cliente:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Obtener perfil (Mis Puntos)
    getProfile: async (req, res) => {
        try {
            // Se asume que se pasa el ID_CLIENTE desde el token JWT, por ahora lo envían en headers
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura');
            
            if (decoded.role !== 'cliente') {
                return res.status(403).json({ success: false, message: 'Acceso denegado' });
            }

            const [clientes] = await db.query('SELECT ID_CLIENTE, NOMBRE, APELLIDO, EMAIL, TELEFONO, CEDULA, PUNTOS FROM clientes WHERE ID_CLIENTE = ?', [decoded.id]);
            
            if (clientes.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            }

            res.json({ success: true, cliente: clientes[0] });
        } catch (error) {
            console.error('Error en getProfile:', error);
            res.status(401).json({ success: false, message: 'Token inválido o expirado' });
        }
    },

    // Obtener historial de compras del cliente
    getHistorialCompras: async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura');
            
            if (decoded.role !== 'cliente') {
                return res.status(403).json({ success: false, message: 'Acceso denegado' });
            }

            // Consultar la tabla de ventas para el ID_CLIENTE
            const [ventas] = await db.query(
                `SELECT v.ID_VENTA, v.FECHA, v.FACTURA, v.TOTAL, 
                 (SELECT COUNT(*) FROM VENTAS_PRODUCTOS vp WHERE vp.ID_VENTA = v.ID_VENTA) as ARTICULOS
                 FROM ventas v 
                 WHERE v.ID_CLIENTE = ? 
                 ORDER BY v.FECHA DESC`, 
                [decoded.id]
            );

            res.json({ success: true, compras: ventas });
        } catch (error) {
            console.error('Error en getHistorialCompras:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Solicitar recuperación de contraseña (envío de email con token)
    forgotPassword: async (req, res) => {
        try {
            await asegurarTablaResetTokens();
            const { email } = req.body;

            if (!email || typeof email !== 'string') {
                return res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
            }

            const cleanEmail = email.trim().toLowerCase();

            // Buscar cliente por email
            const [clientes] = await db.query(
                'SELECT ID_CLIENTE, NOMBRE, APELLIDO, EMAIL FROM clientes WHERE LOWER(EMAIL) = ?',
                [cleanEmail]
            );

            // Por seguridad, siempre retornamos respuesta exitosa genérica
            if (clientes.length > 0) {
                const cliente = clientes[0];
                const token = crypto.randomBytes(32).toString('hex');
                const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

                // Invalidar tokens previos no usados
                await db.query(
                    'UPDATE CLIENTES_RESET_TOKENS SET USADO = 1 WHERE ID_CLIENTE = ? AND USADO = 0',
                    [cliente.ID_CLIENTE]
                );

                // Insertar nuevo token
                await db.query(
                    'INSERT INTO CLIENTES_RESET_TOKENS (ID_CLIENTE, TOKEN, EXPIRA_EN) VALUES (?, ?, ?)',
                    [cliente.ID_CLIENTE, token, expiraEn]
                );

                // Detectar origen del cliente
                let clientOrigin = req.get('origin');
                if (!clientOrigin && req.get('referer')) {
                    try {
                        clientOrigin = new URL(req.get('referer')).origin;
                    } catch (e) {}
                }

                try {
                    await EmailService.sendStorePasswordResetEmail(
                        cliente.EMAIL,
                        token,
                        `${cliente.NOMBRE} ${cliente.APELLIDO || ''}`.trim(),
                        clientOrigin
                    );
                    console.log('✅ Correo de recuperación de tienda enviado a:', cliente.EMAIL);
                } catch (mailErr) {
                    console.error('❌ Error enviando email de recuperación:', mailErr);
                }
            }

            return res.json({
                success: true,
                message: 'Si tu correo está registrado, recibirás un enlace con instrucciones para restablecer tu contraseña en breve.'
            });

        } catch (error) {
            console.error('Error en forgotPassword tienda:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la solicitud.' });
        }
    },

    // Verificar si un token de recuperación es válido
    verifyResetToken: async (req, res) => {
        try {
            await asegurarTablaResetTokens();
            const token = req.query.token;

            if (!token) {
                return res.status(400).json({ success: false, message: 'Token no proporcionado.' });
            }

            const [rows] = await db.query(
                `SELECT t.ID, t.EXPIRA_EN, t.USADO, c.EMAIL, c.NOMBRE 
                 FROM CLIENTES_RESET_TOKENS t
                 JOIN clientes c ON t.ID_CLIENTE = c.ID_CLIENTE
                 WHERE t.TOKEN = ?`,
                [token]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'El enlace de recuperación es inválido o no existe.' });
            }

            const tokenData = rows[0];

            if (tokenData.USADO === 1) {
                return res.status(400).json({ success: false, message: 'Este enlace de recuperación ya ha sido utilizado.' });
            }

            if (new Date() > new Date(tokenData.EXPIRA_EN)) {
                return res.status(400).json({ success: false, message: 'Este enlace de recuperación ha expirado. Por favor solicita uno nuevo.' });
            }

            res.json({
                success: true,
                email: tokenData.EMAIL,
                nombre: tokenData.NOMBRE
            });

        } catch (error) {
            console.error('Error en verifyResetToken tienda:', error);
            res.status(500).json({ success: false, message: 'Error al verificar el enlace.' });
        }
    },

    // Restablecer contraseña con token válido
    resetPassword: async (req, res) => {
        try {
            await asegurarTablaResetTokens();
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ success: false, message: 'Token y nueva contraseña son obligatorios.' });
            }

            if (typeof newPassword !== 'string' || newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            }

            const [rows] = await db.query(
                `SELECT t.ID, t.ID_CLIENTE, t.EXPIRA_EN, t.USADO 
                 FROM CLIENTES_RESET_TOKENS t
                 WHERE t.TOKEN = ?`,
                [token]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Enlace inválido o no encontrado.' });
            }

            const tokenData = rows[0];

            if (tokenData.USADO === 1) {
                return res.status(400).json({ success: false, message: 'Este enlace ya fue utilizado anteriormente.' });
            }

            if (new Date() > new Date(tokenData.EXPIRA_EN)) {
                return res.status(400).json({ success: false, message: 'El enlace ha expirado. Por favor solicita uno nuevo.' });
            }

            // Encriptar nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);

            // Actualizar contraseña del cliente
            await db.query(
                'UPDATE clientes SET PASSWORD_HASH = ? WHERE ID_CLIENTE = ?',
                [passwordHash, tokenData.ID_CLIENTE]
            );

            // Marcar token como usado
            await db.query(
                'UPDATE CLIENTES_RESET_TOKENS SET USADO = 1 WHERE ID = ?',
                [tokenData.ID]
            );

            res.json({
                success: true,
                message: '¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.'
            });

        } catch (error) {
            console.error('Error en resetPassword tienda:', error);
            res.status(500).json({ success: false, message: 'Error al restablecer la contraseña.' });
        }
    }
};

module.exports = storeAuthController;
