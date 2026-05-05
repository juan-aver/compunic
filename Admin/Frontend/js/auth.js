/**
 * @file auth.js
 * @description Autenticación y Seguridad. La puerta de entrada. Máxima prioridad de seguridad.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const AUTH_KEY = 'compunic_session';

// Selector dinámico de API_BASE y SERVER_URL: Si corre en puerto local 5500 vs Nube (Netlify)
const isLocal = window.location.hostname === 'localhost' && window.location.port !== '';
const SERVER_URL = isLocal ? 'http://localhost:3001' : '';
const API_BASE = isLocal ? 'http://localhost:3001/api' : '/api';

const Auth = {
    login: async function (username, password) {
        try {
            // Llamar al endpoint de autenticación
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Error de autenticación
                return false;
            }

            // Si la autenticación fue exitosa, guardar sesión
            if (data.success && data.user) {
                const session = {
                    user: data.user.username,
                    nombre: data.user.nombre,
                    apellido: data.user.apellido,
                    rol: data.user.rol.toLowerCase(), // 'ADMIN' -> 'admin', 'VENDEDOR' -> 'vendedor'
                    id_empleado: data.user.id_empleado,
                    id_vendedor: data.user.id_vendedor, // ⭐ IMPORTANTE: Para auto-asignar en ventas
                    area: data.user.area,
                    email: data.user.email,
                    timestamp: new Date().getTime()
                };

                sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error en login:', error);
            alert('Error de conexión con el servidor');
            return false;
        }
    },

    logout: function () {
        sessionStorage.removeItem(AUTH_KEY);
        window.location.href = 'index.html';
    },

    checkAuth: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        if (!session) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    checkLoginRedirect: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        if (session) {
            window.location.href = 'dashboard.html';
        }
    },

    getUser: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        return session ? JSON.parse(session).user : null;
    },

    getRole: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        return session ? JSON.parse(session).rol : null;
    },

    // ⭐ NUEVA FUNCIÓN: Obtener ID_VENDEDOR del usuario logueado
    getVendedorId: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        return session ? JSON.parse(session).id_vendedor : null;
    },

    // ⭐ NUEVA FUNCIÓN: Obtener nombre completo del usuario
    getNombreCompleto: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        if (!session) return null;
        const data = JSON.parse(session);
        return `${data.nombre} ${data.apellido}`;
    },

    // ⭐ NUEVA FUNCIÓN: Obtener toda la sesión
    getSession: function () {
        const session = sessionStorage.getItem(AUTH_KEY);
        return session ? JSON.parse(session) : null;
    },

    // ==========================================
    // FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA
    // ==========================================

    /**
     * Solicitar recuperación de contraseña
     * @param {string} email - Email del empleado
     * @returns {object} Respuesta del servidor
     */
    forgotPassword: async function (email) {
        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return {
                success: response.ok,
                message: data.message || data.error
            };
        } catch (error) {
            console.error('❌ Error en forgotPassword:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    /**
     * Validar token de recuperación
     * @param {string} token - Token de recuperación
     * @returns {object} Resultado de la validación
     */
    validateToken: async function (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/validate-token/${token}`);
            const data = await response.json();

            return {
                valid: data.valid || false,
                username: data.username,
                error: data.error
            };
        } catch (error) {
            console.error('❌ Error en validateToken:', error);
            return {
                valid: false,
                error: 'Error de conexión con el servidor'
            };
        }
    },

    /**
     * Restablecer contraseña con token
     * @param {string} token - Token de recuperación
     * @param {string} newPassword - Nueva contraseña
     * @returns {object} Resultado de la operación
     */
    resetPassword: async function (token, newPassword) {
        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            return {
                success: response.ok,
                message: data.message || data.error
            };
        } catch (error) {
            console.error('❌ Error en resetPassword:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor'
            };
        }
    },

    /**
     * Notificar bloqueo de cuenta
     * @param {string} username - Usuario bloqueado
     */
    notifyLockout: async function (username) {
        try {
            // No esperamos respuesta, es "fire and forget" desde la perspectiva UI
            fetch(`${API_BASE}/auth/notify-lockout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            }).catch(e => console.error('Error notificando bloqueo (silencioso):', e));
        } catch (error) {
            console.error('❌ Error en notifyLockout:', error);
        }
    }
};
