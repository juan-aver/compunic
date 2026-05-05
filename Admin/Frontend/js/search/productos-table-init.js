/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: productos-table-init.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initProductosTableEnhancements();
    }, 1500);
});

function initProductosTableEnhancements() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    const table = document.getElementById('tablaProductos');
    if (!table || typeof TableEnhancer === 'undefined') {
        console.log('⏳ Esperando tabla de productos o TableEnhancer...');
        setTimeout(initProductosTableEnhancements, 500);
        return;
    }

    console.log('✅ Inicializando mejoras de tabla para Productos');

    // DESHABILITADO: TableEnhancer interfiere con el botón "Ver Detalles"
    // window.productosTableEnhancer = new TableEnhancer('tablaProductos', {
    //     itemsPerPage: 10,
    //     searchable: true,
    //     sortable: true,
    //     selectable: true,
    //     pagination: true
    // });

    // INICIALIZAR CONTADOR AUTOMÁTICAMENTE
    setTimeout(() => {
        const tbody = document.getElementById('tablaProductos');
        if (tbody) {
            const totalRows = tbody.querySelectorAll('tr').length;
            const resultsCount = document.getElementById('results-count');
            const totalCount = document.getElementById('total-count');
            if (resultsCount) resultsCount.textContent = totalRows;
            if (totalCount) totalCount.textContent = totalRows;
            console.log(`📊 Contador inicializado: ${totalRows} productos`);
        }
    }, 1000);

    // BÚSQUEDA MEJORADA CON RESALTADO
    const searchInput = document.getElementById('buscar_tabla');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const searchTerm = e.target.value;
                const tbody = document.getElementById('tablaProductos');
                if (!tbody) return;

                const rows = tbody.querySelectorAll('tr');
                let visibleCount = 0;

                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length === 0) return;

                    const nombre = cells[1]?.textContent || '';
                    const modelo = cells[2]?.textContent || '';
                    // SKIP cells[3] - contiene el botón "Ver Detalles"
                    const marca = cells[5]?.textContent || '';

                    const searchLower = searchTerm.toLowerCase();
                    const matches = !searchTerm ||
                        nombre.toLowerCase().includes(searchLower) ||
                        modelo.toLowerCase().includes(searchLower) ||
                        marca.toLowerCase().includes(searchLower);

                    if (matches) {
                        row.style.display = '';
                        visibleCount++;

                        // Resaltar coincidencias (SKIP cells[3] - contiene botón)
                        if (searchTerm) {
                            [cells[1], cells[2], cells[5]].forEach(cell => {
                                if (cell) {
                                    const texto = cell.textContent;
                                    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    const regex = new RegExp(`(${escapedTerm})`, 'gi');
                                    cell.innerHTML = texto.replace(regex, '<mark>$1</mark>');
                                }
                            });
                        } else {
                            // Limpiar resaltado (SKIP cells[3] - contiene botón)
                            [cells[1], cells[2], cells[5]].forEach(cell => {
                                if (cell && cell.querySelector('mark')) {
                                    cell.innerHTML = cell.textContent;
                                }
                            });
                        }
                    } else {
                        row.style.display = 'none';
                    }
                });

                // Actualizar contador
                const resultsCount = document.getElementById('results-count');
                const totalCount = document.getElementById('total-count');
                if (resultsCount) resultsCount.textContent = visibleCount;
                if (totalCount) totalCount.textContent = rows.length;
            }, 300);
        });
    }

    // DESHABILITADO: TableEnhancer no se usa
    // const perPageSelect = document.getElementById('productos-per-page');
    // if (perPageSelect) {
    //     perPageSelect.addEventListener('change', (e) => {
    //         window.productosTableEnhancer.setItemsPerPage(e.target.value);
    //     });
    // }

    // window.productosTableEnhancer.addActionButtons(
    //     (data, row) => {
    //         console.log('Editar producto:', data);
    //     },
    //     (data, row) => {
    //         if (confirm(`¿Está seguro de eliminar el producto ${data.nombre}?`)) {
    //             console.log('Eliminar producto:', data);
    //         }
    //     },
    //     (data, row) => {
    //         console.log('Ver detalles de producto:', data);
    //     }
    // );

    table.addEventListener('rowselected', (e) => {
        console.log('Producto seleccionado:', e.detail.data);
    });
}

function clearProductosFilters() {
    // Empieza la magia ✨

    const searchInput = document.getElementById('buscar_tabla');
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
    }

    if (window.productosTableEnhancer) {
        window.productosTableEnhancer.clearFilters();
        const perPageSelect = document.getElementById('productos-per-page');
        if (perPageSelect) perPageSelect.value = '10';
    }
}

function refreshProductosTable() {
    if (window.productosTableEnhancer) {
        window.productosTableEnhancer.refresh();
    }
}

window.clearProductosFilters = clearProductosFilters;
window.refreshProductosTable = refreshProductosTable;

console.log('✅ Productos Table Init cargado con búsqueda mejorada integrada');
