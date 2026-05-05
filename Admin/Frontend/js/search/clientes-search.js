/*
 * ==========================================
 * MÓDULO: clientes-search.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initClientesSearch();
    }, 1000);
});

function initClientesSearch() {
    // Ojo aquí, esta parte es crítica para que todo cuadre.

    // Si esto falla, probablemente sea la base de datos caída 💀

    const searchInput = document.getElementById('buscar_nombre');
    const searchButton = document.getElementById('btn_buscar_cliente');

    if (!searchInput) {
        setTimeout(initClientesSearch, 500);
        return;
    }

    console.log('✅ Inicializando búsqueda en tiempo real para Clientes');

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filtrarClientes(e.target.value);
        }, 300);
    });

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            filtrarClientes(searchInput.value);
        });
    }
}

function filtrarClientes(searchTerm) {
    const tbody = document.getElementById('tablaClientes');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const nombre = cells[1]?.textContent || '';
        const telefono = cells[2]?.textContent || '';
        const email = cells[3]?.textContent || '';

        const searchLower = searchTerm.toLowerCase();
        const matches = !searchTerm ||
            nombre.toLowerCase().includes(searchLower) ||
            telefono.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);

        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Clientes: Mostrando ${visibleCount} de ${rows.length}`);
}

console.log('✅ Script de búsqueda para Clientes cargado');
