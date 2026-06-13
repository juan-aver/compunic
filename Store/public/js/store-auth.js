// public/js/store-auth.js
// Lógica de autenticación del lado del cliente para la Tienda Web

// Helpers seguros para localStorage (evitan que excepciones de seguridad tiren el script)
function safeGetItem(key, fallback = null) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch (e) {
        console.warn('localStorage no está disponible:', e);
        return fallback;
    }
}
function safeSetItem(key, val) {
    try {
        localStorage.setItem(key, val);
    } catch (e) {
        console.warn('localStorage no está disponible para guardar:', e);
    }
}
function safeRemoveItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('localStorage no está disponible para borrar:', e);
    }
}

const StoreAuth = {
    API_URL: (() => {
        if (window.location.origin && window.location.origin.startsWith('http')) {
            return `${window.location.origin}/api/store/auth`;
        }
        return 'http://localhost:3001/api/store/auth';
    })(), // Ajustar según entorno

    // Iniciar Sesión
    login: async (email, password) => {
        try {
            const res = await fetch(`${StoreAuth.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                safeSetItem('compunic_store_token', data.token);
                safeSetItem('compunic_store_user', JSON.stringify(data.cliente));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error in login:', error);
            return false;
        }
    },

    // Registrar Cuenta
    register: async (userData) => {
        try {
            const res = await fetch(`${StoreAuth.API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            
            if (data.success) {
                safeSetItem('compunic_store_token', data.token);
                safeSetItem('compunic_store_user', JSON.stringify(data.cliente));
            }
            return data;
        } catch (error) {
            console.error('Error in register:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    },

    // Cerrar Sesión
    logout: () => {
        safeRemoveItem('compunic_store_token');
        safeRemoveItem('compunic_store_user');
        window.location.href = 'index.html';
    },

    // Verificar si está logueado
    isLoggedIn: () => {
        return !!safeGetItem('compunic_store_token');
    },

    // Obtener datos del usuario logueado
    getUser: () => {
        const user = safeGetItem('compunic_store_user');
        if (!user) return null;
        try {
            return JSON.parse(user);
        } catch (e) {
            return null;
        }
    },

    // Obtener Token
    getToken: () => {
        return safeGetItem('compunic_store_token');
    },

    // Fetch protegido (incluye token)
    fetchProtected: async (url, options = {}) => {
        const token = StoreAuth.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions = { ...options, headers };
        return fetch(url, fetchOptions);
    }
};

// Actualizar Navbar si el usuario está logueado
document.addEventListener('DOMContentLoaded', () => {
    const exitButton = document.getElementById('exitButton');
    if (exitButton) {
        if (StoreAuth.isLoggedIn()) {
            const user = StoreAuth.getUser();
            exitButton.innerHTML = `
                <div class="navbar-user-avatar" style="background: linear-gradient(135deg, #145D90, #56A5DD);">
                    <i class="fas fa-user"></i>
                </div>
                <span>Mi Perfil</span>
            `;
            // Cambiar comportamiento para ir al perfil
            exitButton.onclick = () => window.location.href = 'profile.html';
        } else {
            exitButton.innerHTML = `
                <div class="navbar-user-avatar">
                    <i class="fas fa-sign-in-alt"></i>
                </div>
                <span>Ingresar</span>
            `;
            exitButton.onclick = () => window.location.href = 'login.html';
        }
    }
});
