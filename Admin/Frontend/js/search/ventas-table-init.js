/*
 * Módulo: ventas-table-init.js
 * Descripción: Lógica para inicializar la tabla de ventas.
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initVentasTableEnhancements();
    }, 1500);
});

function initVentasTableEnhancements() {
    // Validamos primero, no queremos que nos tumben el server 😅

    const table = document.getElementById('sales-record-table');
    if (!table || typeof TableEnhancer === 'undefined') {
        console.log('⏳ Esperando tabla de ventas o TableEnhancer...');
        setTimeout(initVentasTableEnhancements, 500);
        return;
    }

    console.log('✅ Inicializando mejoras de tabla para Ventas');

    window.ventasTableEnhancer = new TableEnhancer('tabla-ventas-enhanced', {
        itemsPerPage: 10,
        searchable: true,
        sortable: true,
        selectable: true,
        pagination: true
    });

    const searchInput = document.getElementById('buscar_venta');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.ventasTableEnhancer.filter(e.target.value);
        });
    }

    const perPageSelect = document.getElementById('ventas-per-page');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', (e) => {
            window.ventasTableEnhancer.setItemsPerPage(e.target.value);
        });
    }

    window.ventasTableEnhancer.addActionButtons(
        (data, row) => {
            console.log('Editar venta:', data);
        },
        async (data, row) => {
            const ok = typeof Alerta !== 'undefined'
                ? await Alerta.confirmar(`¿Está seguro de eliminar la venta ${data['no. factura']}?`, { titulo: 'Eliminar Venta', confirmText: 'Sí, eliminar', peligroso: true })
                : confirm(`¿Está seguro de eliminar la venta ${data['no. factura']}?`);
            if (ok) {
                console.log('Eliminar venta:', data);
            }
        },
        (data, row) => {
            console.log('Ver detalles de venta:', data);
        }
    );
}

function clearVentasFilters() {

    if (window.ventasTableEnhancer) {
        window.ventasTableEnhancer.clearFilters();
        const searchInput = document.getElementById('buscar_venta');
        if (searchInput) searchInput.value = '';
        const perPageSelect = document.getElementById('ventas-per-page');
        if (perPageSelect) perPageSelect.value = '10';
    }
}

function refreshVentasTable() {
    if (window.ventasTableEnhancer) {
        window.ventasTableEnhancer.refresh();
    }
}

window.clearVentasFilters = clearVentasFilters;
window.refreshVentasTable = refreshVentasTable;
