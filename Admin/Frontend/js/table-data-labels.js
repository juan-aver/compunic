/**
 * @file table-data-labels.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
(function () {
    'use strict';

    function addDataLabelsToTables() {
        // Obtener todas las tablas
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            // Excluir tablas dentro de modales o con data-no-labels
            if (table.closest('.modal-descripcion') || table.closest('[id*="modal"]') || table.closest('.modal') || table.hasAttribute('data-no-labels')) {
                return;
            }

            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');

            if (!thead || !tbody) return;

            // Obtener los headers
            const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent.trim());

            // Agregar data-label a cada celda
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index]);
                    }
                });
            });
        });

        console.log('✅ Data labels agregados a las tablas (excluyendo modales)');
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDataLabelsToTables);
    } else {
        addDataLabelsToTables();
    }

    // Re-ejecutar cuando se carguen nuevas vistas
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                // Pequeño delay para asegurar que la tabla esté completamente renderizada
                setTimeout(addDataLabelsToTables, 100);
            }
        });
    });

    // Observar el contenedor principal
    const contentDiv = document.getElementById('content');
    if (contentDiv) {
        observer.observe(contentDiv, {
            childList: true,
            subtree: true
        });
    }

    // Exportar función para uso manual si es necesario
    window.addDataLabelsToTables = addDataLabelsToTables;
})();
