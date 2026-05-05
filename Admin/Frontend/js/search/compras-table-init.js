/*
 * ==========================================
 * MÓDULO: compras-table-init.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
// Esperar a que el DOM y TableEnhancer estén listos
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que la tabla se cargue con datos
    setTimeout(() => {
        initComprasTableEnhancements();
    }, 1500);
});

function initComprasTableEnhancements() {
    // Empieza la magia ✨

    const table = document.getElementById('tabla-compras-enhanced');
    if (!table || typeof TableEnhancer === 'undefined') {
        console.log('⏳ Esperando tabla de compras o TableEnhancer...');
        setTimeout(initComprasTableEnhancements, 500);
        return;
    }

    console.log('✅ Inicializando mejoras de tabla para Compras');

    // Crear instancia de TableEnhancer
    window.comprasTableEnhancer = new TableEnhancer('tabla-compras-enhanced', {
        itemsPerPage: 10,
        searchable: true,
        sortable: true,
        selectable: true,
        pagination: true
    });

    // Configurar búsqueda
    const searchInput = document.getElementById('buscar_compra');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.comprasTableEnhancer.filter(e.target.value);
        });
    }

    // Configurar selector de items por página
    const perPageSelect = document.getElementById('compras-per-page');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', (e) => {
            window.comprasTableEnhancer.setItemsPerPage(e.target.value);
        });
    }

    // Agregar botones de acción
    window.comprasTableEnhancer.addActionButtons(
        // Editar
        (data, row) => {
            console.log('Editar compra:', data);
            // Aquí iría la lógica de edición existente
            // Por ejemplo, cargar los datos en el formulario
        },
        // Eliminar
        (data, row) => {
            if (confirm(`¿Está seguro de eliminar la compra ${data['no. factura']}?`)) {
                console.log('Eliminar compra:', data);
                // Aquí iría la lógica de eliminación existente
            }
        },
        // Ver detalles (opcional)
        (data, row) => {
            console.log('Ver detalles de compra:', data);
            // Aquí iría la lógica para mostrar el modal de detalles
        }
    );

    // Escuchar selección de filas
    table.addEventListener('rowselected', (e) => {
        console.log('Fila seleccionada:', e.detail.data);
    });
}

// Función para limpiar filtros
function clearComprasFilters() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    if (window.comprasTableEnhancer) {
        window.comprasTableEnhancer.clearFilters();

        // Limpiar input de búsqueda
        const searchInput = document.getElementById('buscar_compra');
        if (searchInput) searchInput.value = '';

        // Resetear selector de items por página
        const perPageSelect = document.getElementById('compras-per-page');
        if (perPageSelect) perPageSelect.value = '10';
    }
}

// Función para refrescar la tabla después de agregar/editar/eliminar
function refreshComprasTable() {
    if (window.comprasTableEnhancer) {
        window.comprasTableEnhancer.refresh();
    }
}

// Exponer funciones globalmente
window.clearComprasFilters = clearComprasFilters;
window.refreshComprasTable = refreshComprasTable;
