/**
 * @file empleados-search.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initEmpleadosSearch();
    }, 1000);
});

function initEmpleadosSearch() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    // Si esto falla, probablemente sea la base de datos caída 💀

    const searchInput = document.getElementById('buscar_empleado');
    const searchButton = document.getElementById('btn_buscar_empleado');

    if (!searchInput) {
        setTimeout(initEmpleadosSearch, 500);
        return;
    }

    console.log('✅ Inicializando búsqueda en tiempo real para Empleados');

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filtrarEmpleados(e.target.value);
        }, 300);
    });

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            filtrarEmpleados(searchInput.value);
        });
    }
}

function filtrarEmpleados(searchTerm) {
    const tbody = document.getElementById('tablaEmpleados');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const nombre = cells[1]?.textContent || '';
        const apellido = cells[2]?.textContent || '';

        const searchLower = searchTerm.toLowerCase();
        const matches = !searchTerm ||
            nombre.toLowerCase().includes(searchLower) ||
            apellido.toLowerCase().includes(searchLower);

        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Empleados: Mostrando ${visibleCount} de ${rows.length}`);
}

console.log('✅ Script de búsqueda para Empleados cargado');
