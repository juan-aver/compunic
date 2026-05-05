/**
 * @file vendedores-search.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initVendedoresSearch();
    }, 1000);
});

function initVendedoresSearch() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    // Ojo aquí, esta parte es crítica para que todo cuadre.

    const searchInput = document.getElementById('buscar_vendedor');
    const searchButton = document.getElementById('btn_buscar_vendedor');

    if (!searchInput) {
        console.log('⏳ Input de búsqueda de vendedores no encontrado, reintentando...');
        setTimeout(initVendedoresSearch, 500);
        return;
    }

    console.log('✅ Inicializando búsqueda en tiempo real para Vendedores');

    // Búsqueda en tiempo real con debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filtrarVendedores(e.target.value);
        }, 300);
    });

    // También mantener funcionalidad del botón
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            filtrarVendedores(searchInput.value);
        });
    }
}

function filtrarVendedores(searchTerm) {
    const tbody = document.getElementById('tablaVendedores');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        // Columnas: ID, Área, Horario, Teléfono, Email, ID_Empleado
        const area = cells[1]?.textContent || '';
        const telefono = cells[3]?.textContent || '';
        const email = cells[4]?.textContent || '';

        const searchLower = searchTerm.toLowerCase();
        const matches = !searchTerm ||
            area.toLowerCase().includes(searchLower) ||
            telefono.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);

        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Vendedores: Mostrando ${visibleCount} de ${rows.length}`);
}

console.log('✅ Script de búsqueda para Vendedores cargado');
