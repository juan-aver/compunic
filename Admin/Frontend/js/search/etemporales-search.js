/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: etemporales-search.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initETemporalesSearch();
    }, 1000);
});

function initETemporalesSearch() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    const searchInput = document.getElementById('buscar_temporal');
    const searchButton = document.getElementById('btn_buscar_temporal');

    if (!searchInput) {
        setTimeout(initETemporalesSearch, 500);
        return;
    }

    console.log('✅ Inicializando búsqueda en tiempo real para Empleados Temporales');

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filtrarETemporales(e.target.value);
        }, 300);
    });

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            filtrarETemporales(searchInput.value);
        });
    }
}

function filtrarETemporales(searchTerm) {
    const tbody = document.getElementById('tablaETemporales');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const nombre = cells[1]?.textContent || '';
        const telefono = cells[2]?.textContent || '';
        const email = cells[3]?.textContent || '';
        const direccion = cells[4]?.textContent || '';

        const searchLower = searchTerm.toLowerCase();
        const matches = !searchTerm ||
            nombre.toLowerCase().includes(searchLower) ||
            telefono.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower) ||
            direccion.toLowerCase().includes(searchLower);

        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Empleados Temporales: Mostrando ${visibleCount} de ${rows.length}`);
}

console.log('✅ Script de búsqueda para Empleados Temporales cargado');
