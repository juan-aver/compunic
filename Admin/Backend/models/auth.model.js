/**
 * @file auth.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 

 */
const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const AuthModel = {
    /**
     * Autentica un usuario contra la base de datos
     * Retorna información completa del usuario incluyendo ID_VENDEDOR
     */
    async login(username, password) {
        const query = `
            SELECT 
                e.ID_EMPLEADO,
                e.NOMBRE,
                e.APELLIDO,
                e.USERNAME,
                e.PASSWORD_HASH,
                e.ROL,
                e.EMAIL,
                e.AREA
            FROM EMPLEADOS e
            WHERE e.USERNAME = ? 
              AND e.ESTADO = 1
        `;

        try {
            const [rows] = await db.query(query, [username]);

            if (rows.length === 0) {
                return null; // Usuario no encontrado
            }

            const user = rows[0];

            // Verificar contraseña con bcrypt
            const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);

            if (!passwordMatch) {
                return null; // Contraseña incorrecta
            }

            return {
                id_empleado: user.ID_EMPLEADO,
                nombre: user.NOMBRE,
                apellido: user.APELLIDO,
                username: user.USERNAME,
                rol: user.ROL,
                area: user.AREA,
                email: user.EMAIL
            };
        } catch (error) {
            console.error('❌ Error en AuthModel.login:', error);
            throw error;
        }
    },

    /**
     * Buscar empleado por email (Gmail)
     * @param {string} email - Email del empleado
     * @returns {object|null} Datos del empleado o null si no existe
     */
    async findEmployeeByEmail(email) {
        const query = `
            SELECT 
                e.ID_EMPLEADO,
                e.NOMBRE,
                e.APELLIDO,
                e.USERNAME,
                e.EMAIL
            FROM EMPLEADOS e
            WHERE e.EMAIL = ? AND e.ESTADO = 1
        `;

        try {
            const [rows] = await db.query(query, [email]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ Error buscando empleado por email:', error);
            throw error;
        }
    },

    /**
     * Buscar empleado por username
     * @param {string} username - Username del empleado
     * @returns {object|null} Datos del empleado o null si no existe
     */
    async findEmployeeByUsername(username) {
        const query = `
            SELECT 
                e.ID_EMPLEADO,
                e.NOMBRE,
                e.APELLIDO,
                e.USERNAME,
                e.EMAIL
            FROM EMPLEADOS e
            WHERE e.USERNAME = ? AND e.ESTADO = 1
        `;

        try {
            const [rows] = await db.query(query, [username]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ Error buscando empleado por username:', error);
            throw error;
        }
    },

    /**
     * Crear token de recuperación de contraseña
     * @param {string} email - Email del empleado
     * @returns {object} Token generado y datos del empleado
     */
    async createPasswordResetToken(email) {
        try {
            // Buscar empleado por email
            const empleado = await this.findEmployeeByEmail(email);

            if (!empleado) {
                // Por seguridad, no revelamos si el email existe o no
                return null;
            }

            // Generar token único
            const token = crypto.randomBytes(32).toString('hex');

            // Calcular fecha de expiración (1 hora desde ahora)
            const expiraEn = new Date();
            expiraEn.setHours(expiraEn.getHours() + 1);

            // Guardar token en la base de datos
            const insertQuery = `
                INSERT INTO PASSWORD_RESET_TOKENS (ID_EMPLEADO, TOKEN, EXPIRA_EN)
                VALUES (?, ?, ?)
            `;

            await db.query(insertQuery, [empleado.ID_EMPLEADO, token, expiraEn]);

            console.log(`✅ Token de recuperación creado para: ${email}`);

            return {
                token,
                empleado: {
                    id_empleado: empleado.ID_EMPLEADO,
                    username: empleado.USERNAME,
                    nombre: empleado.NOMBRE,
                    apellido: empleado.APELLIDO,
                    email: empleado.EMAIL
                }
            };
        } catch (error) {
            console.error('❌ Error creando token de recuperación:', error);
            throw error;
        }
    },

    /**
     * Validar token de recuperación
     * @param {string} token - Token a validar
     * @returns {object|null} Datos del token si es válido, null si no
     */
    async validateResetToken(token) {
        const query = `
            SELECT 
                t.ID,
                t.ID_EMPLEADO,
                t.EXPIRA_EN,
                t.USADO,
                e.USERNAME,
                e.NOMBRE,
                e.APELLIDO
            FROM PASSWORD_RESET_TOKENS t
            JOIN EMPLEADOS e ON t.ID_EMPLEADO = e.ID_EMPLEADO
            WHERE t.TOKEN = ?
        `;

        try {
            const [rows] = await db.query(query, [token]);

            if (rows.length === 0) {
                console.log('⚠️ Token no encontrado');
                return null;
            }

            const tokenData = rows[0];

            // Verificar si ya fue usado
            if (tokenData.USADO === 1) {
                console.log('⚠️ Token ya fue utilizado');
                return null;
            }

            // Verificar si expiró
            const ahora = new Date();
            const expiracion = new Date(tokenData.EXPIRA_EN);

            if (ahora > expiracion) {
                console.log('⚠️ Token expirado');
                return null;
            }

            return {
                id_token: tokenData.ID,
                id_empleado: tokenData.ID_EMPLEADO,
                username: tokenData.USERNAME,
                nombre: tokenData.NOMBRE,
                apellido: tokenData.APELLIDO
            };
        } catch (error) {
            console.error('❌ Error validando token:', error);
            throw error;
        }
    },

    /**
     * Restablecer contraseña usando token
     * @param {string} token - Token de recuperación
     * @param {string} newPassword - Nueva contraseña
     * @returns {boolean} true si se actualizó correctamente
     */
    async resetPasswordWithToken(token, newPassword) {
        try {
            // Validar token
            const tokenData = await this.validateResetToken(token);

            if (!tokenData) {
                throw new Error('Token inválido o expirado');
            }

            // Encriptar nueva contraseña con bcrypt
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar contraseña del empleado y activar cuenta (ESTADO=1)
            const updatePasswordQuery = `
                UPDATE EMPLEADOS 
                SET PASSWORD_HASH = ?, ESTADO = 1
                WHERE ID_EMPLEADO = ?
            `;

            await db.query(updatePasswordQuery, [hashedPassword, tokenData.id_empleado]);

            // Marcar token como usado
            const markTokenUsedQuery = `
                UPDATE PASSWORD_RESET_TOKENS
                SET USADO = 1
                WHERE ID = ?
            `;

            await db.query(markTokenUsedQuery, [tokenData.id_token]);

            console.log(`✅ Contraseña restablecida para usuario: ${tokenData.username}`);
            
            return tokenData;
        } catch (error) {
            console.error('❌ Error restableciendo contraseña:', error);
            throw error;
        }
    },

    /**
     * Crear token de bienvenida para nuevo empleado (2 horas de expiración)
     * Busca sin filtrar por ESTADO porque el empleado recién creado tiene ESTADO=0
     * @param {string} email - Email del nuevo empleado
     * @returns {object} Token generado y datos del empleado
     */
    async createWelcomePasswordToken(email) {
        try {
            // Buscar empleado por email SIN filtrar por estado (es nuevo, ESTADO=0)
            const query = `
                SELECT ID_EMPLEADO, NOMBRE, APELLIDO, EMAIL
                FROM EMPLEADOS
                WHERE EMAIL = ?
            `;
            const [rows] = await db.query(query, [email]);
            
            if (rows.length === 0) {
                console.log(`⚠️ No se encontró empleado con email: ${email}`);
                return null;
            }

            const empleado = rows[0];

            // Generar token único
            const token = crypto.randomBytes(32).toString('hex');

            // Calcular fecha de expiración (2 horas desde ahora)
            const expiraEn = new Date();
            expiraEn.setHours(expiraEn.getHours() + 2);

            // Guardar token en la base de datos
            const insertQuery = `
                INSERT INTO PASSWORD_RESET_TOKENS (ID_EMPLEADO, TOKEN, EXPIRA_EN)
                VALUES (?, ?, ?)
            `;

            await db.query(insertQuery, [empleado.ID_EMPLEADO, token, expiraEn]);

            console.log(`✅ Token de bienvenida creado para: ${email} (expira en 2h)`);

            return {
                token,
                empleado: {
                    nombre: empleado.NOMBRE,
                    apellido: empleado.APELLIDO,
                    email: empleado.EMAIL
                }
            };
        } catch (error) {
            console.error('❌ Error creando token de bienvenida:', error);
            throw error;
        }
    },

    /**
     * Limpiar tokens expirados (mantenimiento)
     * Ejecutar periódicamente para limpiar la base de datos
     */
    async cleanupExpiredTokens() {
        const query = `
            DELETE FROM PASSWORD_RESET_TOKENS
            WHERE EXPIRA_EN < NOW() OR USADO = 1
        `;

        try {
            const [result] = await db.query(query);
            console.log(`🧹 Tokens limpiados: ${result.affectedRows}`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error limpiando tokens:', error);
            throw error;
        }
    }
};

module.exports = AuthModel;

