/*
 * ==========================================
 * MÓDULO: auth.controller.js
 * PROPÓSITO: Controlador de acceso y autenticación.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
const AuthModel = require('../models/auth.model');
const EmailService = require('../services/email.service');
const AuditoriaModel = require('../models/auditoria.model');

const AuthController = {
    /**
     * POST /api/auth/login
     * Autentica un usuario y retorna sus datos
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Username y password son requeridos'
                });
            }

            const user = await AuthModel.login(username, password);

            if (!user) {
                // Registrar auditoría de login fallido
                AuditoriaModel.registrar({
                    id_empleado: null,
                    username: username,
                    accion: 'LOGIN_FALLIDO',
                    tabla: 'EMPLEADOS',
                    descripcion: `Intento de inicio de sesión fallido para el usuario "${username}"`
                }).catch(e => console.error('Audit log error:', e));
                return res.status(401).json({
                    error: 'Credenciales inválidas'
                });
            }

            // Registrar auditoría de inicio de sesión exitoso
            AuditoriaModel.registrar({
                id_empleado: user.id_empleado,
                username: user.username,
                accion: 'INICIO_SESION',
                tabla: 'EMPLEADOS',
                descripcion: `${user.nombre} ${user.apellido} inició sesión en el sistema`
            }).catch(e => console.error('Audit log error:', e));

            // Retornar información del usuario
            res.json({
                success: true,
                user: {
                    id_empleado: user.id_empleado,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    username: user.username,
                    rol: user.rol,
                    area: user.area,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('❌ Error en AuthController.login:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    /**
     * POST /api/auth/forgot-password
     * Solicitar recuperación de contraseña
     */
    async forgotPassword(req, res) {
        try {
            console.log('🔍 Solicitud de recuperación recibida');
            const { email } = req.body;
            console.log('📧 Email recibido:', email);

            if (!email) {
                console.log('❌ Email no proporcionado');
                return res.status(400).json({
                    error: 'El email es requerido'
                });
            }

            console.log('🔄 Creando token de recuperación...');
            // Crear token de recuperación
            const result = await AuthModel.createPasswordResetToken(email);
            console.log('✅ Token creado:', result ? 'Sí' : 'No');

            // Por seguridad, siempre retornamos el mismo mensaje
            // No revelamos si el email existe o no
            if (result) {
                console.log('📨 Intentando enviar correo...');
                // Enviar correo con el token
                const nombreCompleto = `${result.empleado.nombre} ${result.empleado.apellido}`;
                await EmailService.sendPasswordResetEmail(
                    result.empleado.email,
                    result.token,
                    nombreCompleto
                );
                console.log('✅ Correo enviado exitosamente');
            }

            res.json({
                success: true,
                message: 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña'
            });

        } catch (error) {
            console.error('❌ Error en AuthController.forgotPassword:', error);
            console.error('📋 Stack trace:', error.stack);
            res.status(500).json({
                error: 'Error al procesar la solicitud'
            });
        }
    },

    /**
     * POST /api/auth/reset-password
     * Restablecer contraseña usando token
     */
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    error: 'Token y nueva contraseña son requeridos'
                });
            }

            // Validar longitud mínima de contraseña
            if (newPassword.length < 8) {
                return res.status(400).json({
                    error: 'La contraseña debe tener al menos 8 caracteres'
                });
            }

            // Validar complejidad (letras y números)
            const strongPasswordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;
            if (!strongPasswordRegex.test(newPassword)) {
                return res.status(400).json({
                    error: 'La contraseña es muy débil. Debe combinar letras y números.'
                });
            }

            // Restablecer contraseña
            const resetResult = await AuthModel.resetPasswordWithToken(token, newPassword);

            // Registrar auditoría del reset de contraseña
            if (resetResult) {
                AuditoriaModel.registrar({
                    id_empleado: resetResult.id_empleado || null,
                    username: resetResult.username || 'Desconocido',
                    accion: 'RESET_CONTRASENA',
                    tabla: 'EMPLEADOS',
                    descripcion: `Se restableció la contraseña del usuario "${resetResult.username || 'Desconocido'}"`
                }).catch(e => console.error('Audit log error:', e));
            }

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
            });

        } catch (error) {
            console.error('❌ Error en AuthController.resetPassword:', error);

            if (error.message === 'Token inválido o expirado') {
                return res.status(400).json({
                    error: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'
                });
            }

            res.status(500).json({
                error: 'Error al restablecer la contraseña'
            });
        }
    },

    /**
     * GET /api/auth/validate-token/:token
     * Validar si un token de recuperación es válido
     */
    async validateToken(req, res) {
        try {
            const { token } = req.params;

            const tokenData = await AuthModel.validateResetToken(token);

            if (!tokenData) {
                return res.status(400).json({
                    valid: false,
                    error: 'Token inválido o expirado'
                });
            }

            res.json({
                valid: true,
                username: tokenData.username
            });

        } catch (error) {
            console.error('❌ Error en AuthController.validateToken:', error);
            res.status(500).json({
                error: 'Error al validar el token'
            });
        }
    },

    /**
     * POST /api/auth/notify-lockout
     * Notificar al usuario sobre bloqueo por intentos fallidos
     */
    async notifyLockout(req, res) {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ error: 'Username requerido' });
            }

            console.log(`🔒 Notificando bloqueo para usuario: ${username}`);

            // Buscar usuario para obtener su email
            const user = await AuthModel.findEmployeeByUsername(username);

            if (user && user.EMAIL) {
                const nombreCompleto = `${user.NOMBRE} ${user.APELLIDO}`;

                // Enviar correo asíncronamente (no bloqueamos la respuesta)
                EmailService.sendAccountLockoutEmail(user.EMAIL, nombreCompleto)
                    .catch(err => console.error('❌ Error envío alerta bloqueo:', err));

                console.log(`📧 Alerta enviada a ${user.EMAIL}`);
            } else {
                console.log(`⚠️ Usuario ${username} no encontrado o sin email, alerta omitida`);
            }

            // Siempre responder éxito para no revelar existencia de usuarios
            res.json({ success: true, message: 'Notificación procesada' });

        } catch (error) {
            console.error('❌ Error en AuthController.notifyLockout:', error);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    /**
     * POST /api/auth/logout
     * Cierra sesión y registra auditoría
     */
    async logout(req, res) {
        try {
            const { id_empleado, username } = req.body;

            if (id_empleado && username) {
                // Registrar auditoría de cierre de sesión
                await AuditoriaModel.registrar({
                    id_empleado: id_empleado,
                    username: username,
                    accion: 'CIERRE_SESION',
                    tabla: 'EMPLEADOS',
                    descripcion: `El usuario "${username}" cerró sesión en el sistema`
                });
            }

            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente en el servidor'
            });
        } catch (error) {
            console.error('❌ Error en AuthController.logout:', error);
            res.status(500).json({
                error: 'Error al cerrar sesión'
            });
        }
    }
};

module.exports = AuthController;

