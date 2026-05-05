/**
 * @file mobile-menu.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
class MobileMenu {
    constructor() {
        this.menuToggle = null;
        this.menu = null;
        this.backdrop = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Obtener elementos
        this.menuToggle = document.querySelector('.mobile-menu-toggle');
        this.menu = document.querySelector('.mobile-menu');
        this.backdrop = document.querySelector('.mobile-menu-backdrop');

        if (!this.menuToggle || !this.menu || !this.backdrop) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Event listeners
        this.menuToggle.addEventListener('click', () => this.toggle());
        this.backdrop.addEventListener('click', () => this.close());

        // Cerrar al hacer clic en un link del menú
        const menuLinks = this.menu.querySelectorAll('.mobile-menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Pequeño delay para que se vea la animación del click
                setTimeout(() => this.close(), 200);
            });
        });

        // Cerrar con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevenir scroll en body cuando el menú está abierto
        this.menu.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.menuToggle.classList.add('active');
        this.menu.classList.add('active');
        this.backdrop.classList.add('active');
        document.body.classList.add('mobile-menu-open');

        // Trigger animación de items
        const items = this.menu.querySelectorAll('.mobile-menu-item');
        items.forEach((item, index) => {
            item.style.transitionDelay = `${0.1 + (index * 0.05)}s`;
        });
    }

    close() {
        this.isOpen = false;
        this.menuToggle.classList.remove('active');
        this.menu.classList.remove('active');
        this.backdrop.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }
}

// Inicializar el menú móvil
const mobileMenu = new MobileMenu();

// Exportar para uso global si es necesario
if (typeof window !== 'undefined') {
    window.MobileMenu = MobileMenu;
}
