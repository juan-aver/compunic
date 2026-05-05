/*
 * ==========================================
 * MÓDULO: auth.controller.js
 * PROPÓSITO: Controlador maestro. Manejador de requests y responses. La lógica de negocio vive aquí.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
const AuthModel = require('../models/auth.model');
const EmailService = require('../services/email.service');

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
                return res.status(401).json({
                    error: 'Credenciales inválidas'
                });
            }

            // Retornar información del usuario
            res.json({
                success: true,
                user: {
                    id_empleado: user.id_empleado,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    username: user.username,
                    rol: user.rol,
                    id_vendedor: user.id_vendedor,
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
            await AuthModel.resetPasswordWithToken(token, newPassword);

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
    }
};

module.exports = AuthController;

