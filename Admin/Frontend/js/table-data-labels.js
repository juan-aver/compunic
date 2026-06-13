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

            // Agregar data-label a cada celda (solo si no tiene ya el valor correcto → evita loop)
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index] && cell.getAttribute('data-label') !== headers[index]) {
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

    // Re-ejecutar cuando se carguen nuevas vistas — con debounce para evitar loops
    let debounceTimer = null;
    const observer = new MutationObserver((mutations) => {
        // Solo reaccionar a adición/eliminación de nodos, NO a cambios de atributos
        // (los cambios de data-label en td disparaban este callback infinitamente)
        const hasNodeChanges = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
        if (!hasNodeChanges) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(addDataLabelsToTables, 300);
    });

    // Observar el contenedor principal
    const contentDiv = document.getElementById('content');
    if (contentDiv) {
        observer.observe(contentDiv, {
            childList: true,
            subtree: true
            // IMPORTANTE: NO incluir 'attributes: true' para evitar loop infinito
            // cuando data-label se modifica en las celdas de las tablas.
        });
    }

    // Exportar función para uso manual si es necesario
    window.addDataLabelsToTables = addDataLabelsToTables;
})();
