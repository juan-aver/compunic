/*
 * ==========================================
 * MÓDULO: touch-gestures.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
class TouchGestures {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.longPressTimer = null;
        this.longPressDuration = 500; // ms
        this.swipeThreshold = 80; // px

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Solo activar en dispositivos táctiles
        if (!('ontouchstart' in window)) {
            return;
        }

        // Aplicar gestos a todas las filas de tabla
        this.initTableRowGestures();

        // Re-aplicar cuando se carguen nuevas filas
        this.observeTableChanges();
    }

    initTableRowGestures() {
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            // Evitar duplicar event listeners
            if (row.dataset.gesturesInitialized) return;
            row.dataset.gesturesInitialized = 'true';

            // Touch events
            row.addEventListener('touchstart', (e) => this.handleTouchStart(e, row), { passive: false });
            row.addEventListener('touchmove', (e) => this.handleTouchMove(e, row), { passive: false });
            row.addEventListener('touchend', (e) => this.handleTouchEnd(e, row), { passive: false });
            row.addEventListener('touchcancel', (e) => this.handleTouchCancel(e, row));
        });
    }

    handleTouchStart(e, row) {
        // Solo en móvil (< 768px)
        if (window.innerWidth > 768) return;

        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.isDragging = false;

        // Long press para selección
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(row);
        }, this.longPressDuration);
    }

    handleTouchMove(e, row) {
        if (window.innerWidth > 768) return;

        const touch = e.touches[0];
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        // Si se mueve, cancelar long press
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            clearTimeout(this.longPressTimer);
        }

        // Detectar swipe horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
            this.isDragging = true;
            e.preventDefault();

            // Swipe left (mostrar botón eliminar)
            if (deltaX < -20) {
                const translateX = Math.max(deltaX, -80);
                row.style.transform = `translateX(${translateX}px)`;
                row.style.transition = 'none';

                // Agregar botón de eliminar si no existe
                if (!row.querySelector('.swipe-delete-btn')) {
                    this.addDeleteButton(row);
                }
            }
            // Swipe right (cancelar)
            else if (deltaX > 20) {
                row.style.transform = `translateX(0)`;
                row.classList.remove('swipe-active');
            }
        }
    }

    handleTouchEnd(e, row) {
        if (window.innerWidth > 768) return;

        clearTimeout(this.longPressTimer);

        if (!this.isDragging) return;

        const deltaX = this.currentX - this.startX;

        // Si el swipe fue suficiente, mantener el botón visible
        if (deltaX < -this.swipeThreshold) {
            row.style.transform = 'translateX(-80px)';
            row.style.transition = 'transform 0.3s ease';
            row.classList.add('swipe-active');
        } else {
            // Volver a la posición original
            row.style.transform = 'translateX(0)';
            row.style.transition = 'transform 0.3s ease';
            row.classList.remove('swipe-active');

            // Remover botón después de la animación
            setTimeout(() => {
                const deleteBtn = row.querySelector('.swipe-delete-btn');
                if (deleteBtn && !row.classList.contains('swipe-active')) {
                    deleteBtn.remove();
                }
            }, 300);
        }

        this.isDragging = false;
    }

    handleTouchCancel(e, row) {
        clearTimeout(this.longPressTimer);
        row.style.transform = 'translateX(0)';
        row.style.transition = 'transform 0.3s ease';
        row.classList.remove('swipe-active');
        this.isDragging = false;
    }

    handleLongPress(row) {
        // Vibración si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Toggle selección
        row.classList.toggle('selected');

        // Feedback visual
        row.style.animation = 'none';
        setTimeout(() => {
            row.style.animation = '';
        }, 10);
    }

    addDeleteButton(row) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'swipe-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.setAttribute('aria-label', 'Eliminar');

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDelete(row);
        });

        row.style.position = 'relative';
        row.appendChild(deleteBtn);
    }

    handleDelete(row) {
        // Confirmar eliminación
        if (confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
            // Animación de salida
            row.style.transform = 'translateX(-100%)';
            row.style.opacity = '0';
            row.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                // Aquí deberías llamar a tu función de eliminación real
                // Por ahora solo removemos visualmente
                row.remove();

                // Disparar evento personalizado para que el código existente lo maneje
                const deleteEvent = new CustomEvent('row-delete-requested', {
                    detail: { row: row }
                });
                document.dispatchEvent(deleteEvent);
            }, 300);
        } else {
            // Cancelar - volver a posición original
            row.style.transform = 'translateX(0)';
            row.classList.remove('swipe-active');
            const deleteBtn = row.querySelector('.swipe-delete-btn');
            if (deleteBtn) deleteBtn.remove();
        }
    }

    observeTableChanges() {
        // Observar cambios en las tablas para aplicar gestos a nuevas filas
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    this.initTableRowGestures();
                }
            });
        });

        const tables = document.querySelectorAll('tbody');
        tables.forEach(table => {
            observer.observe(table, {
                childList: true,
                subtree: true
            });
        });
    }

    // Método para resetear todas las filas
    resetAllRows() {
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.transform = 'translateX(0)';
            row.classList.remove('swipe-active', 'selected');
            const deleteBtn = row.querySelector('.swipe-delete-btn');
            if (deleteBtn) deleteBtn.remove();
        });
    }
}

// Inicializar gestos táctiles
const touchGestures = new TouchGestures();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TouchGestures = TouchGestures;
    window.touchGestures = touchGestures;
}

// Agregar método helper para cerrar swipes al hacer scroll
window.addEventListener('scroll', () => {
    if (window.innerWidth <= 768) {
        const activeRows = document.querySelectorAll('tbody tr.swipe-active');
        activeRows.forEach(row => {
            row.style.transform = 'translateX(0)';
            row.classList.remove('swipe-active');
            const deleteBtn = row.querySelector('.swipe-delete-btn');
            if (deleteBtn) deleteBtn.remove();
        });
    }
});
