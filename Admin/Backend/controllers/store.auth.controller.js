// controllers/store.auth.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    }
};

module.exports = storeAuthController;
