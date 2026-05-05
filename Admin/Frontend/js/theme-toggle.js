/**
 * @file theme-toggle.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * Inicializar el sistema de temas
     */
    init() {
        // Aplicar tema inicial
        this.applyTheme(this.theme);

        // Crear toggle si no existe
        this.createToggle();

        // Escuchar cambios en preferencia del sistema
        this.watchSystemTheme();
    }

    /**
     * Obtener tema guardado en localStorage
     */
    getStoredTheme() {
        return localStorage.getItem('compunic-theme');
    }

    /**
     * Obtener preferencia de tema del sistema
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * Aplicar tema al documento
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('compunic-theme', theme);

        // Actualizar toggle si existe
        this.updateToggle();

        // Dispatch evento personalizado
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    /**
     * Alternar entre temas
     */
    toggle() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Crear toggle switch en el navbar
     */
    createToggle() {
        // Buscar navbar o header
        const navbar = document.querySelector('.navbar') ||
            document.querySelector('header') ||
            document.querySelector('.top-nav');

        if (!navbar) {
            console.warn('No se encontró navbar para agregar toggle');
            return;
        }

        // Verificar si ya existe
        if (document.getElementById('theme-toggle-container')) {
            return;
        }

        // Crear contenedor del toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'theme-toggle-container';
        toggleContainer.className = 'theme-toggle-container';

        // HTML del toggle
        toggleContainer.innerHTML = `
            <button id="theme-toggle" class="theme-toggle" aria-label="Cambiar tema" title="Cambiar tema">
                <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            </button>
        `;

        // Agregar al navbar
        navbar.appendChild(toggleContainer);

        // Agregar event listener
        const toggleButton = document.getElementById('theme-toggle');
        toggleButton.addEventListener('click', () => this.toggle());

        // Actualizar estado inicial
        this.updateToggle();
    }

    /**
     * Actualizar estado visual del toggle
     */
    updateToggle() {
        const toggleButton = document.getElementById('theme-toggle');
        if (!toggleButton) return;

        const sunIcon = toggleButton.querySelector('.sun-icon');
        const moonIcon = toggleButton.querySelector('.moon-icon');

        if (this.theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            toggleButton.classList.add('dark');
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            toggleButton.classList.remove('dark');
        }
    }

    /**
     * Escuchar cambios en preferencia del sistema
     */
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            // Solo aplicar si no hay preferencia guardada
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Exponer funciones globales para compatibilidad
window.toggleTheme = () => window.themeManager?.toggle();
window.setTheme = (theme) => window.themeManager?.applyTheme(theme);
