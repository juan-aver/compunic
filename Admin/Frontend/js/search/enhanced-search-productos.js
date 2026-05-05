/*
 * ==========================================
 * MÓDULO: enhanced-search-productos.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
console.log('📦 Enhanced Search Productos - Versión Simple cargando...');

/**
 * Inicializar búsqueda mejorada
 */
function initEnhancedSearch() {
    // Si esto falla, probablemente sea la base de datos caída 💀

    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    console.log('🔍 Iniciando búsqueda en tiempo real...');

    const searchInput = document.getElementById('buscar_tabla');
    if (!searchInput) {
        console.error('❌ Input de búsqueda no encontrado');
        return;
    }

    // Búsqueda en tiempo real con debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filtrarProductosEnTiempoReal(e.target.value);
        }, 300);
    });

    console.log('✅ Búsqueda en tiempo real activada');

    // Inicializar contador
    actualizarContador(0, 0);
}

/**
 * Filtrar productos en tiempo real
 */
function filtrarProductosEnTiempoReal(searchTerm) {
    const tbody = document.getElementById('tablaProductos');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        // Obtener textos de las celdas principales
        const nombre = cells[1]?.textContent || '';
        const modelo = cells[2]?.textContent || '';
        const descripcion = cells[3]?.textContent || '';
        const marca = cells[5]?.textContent || '';

        // Filtro por búsqueda de texto
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            nombre.toLowerCase().includes(searchLower) ||
            modelo.toLowerCase().includes(searchLower) ||
            descripcion.toLowerCase().includes(searchLower) ||
            marca.toLowerCase().includes(searchLower);

        // Mostrar/ocultar fila
        if (matchesSearch) {
            row.style.display = '';
            visibleCount++;

            // Resaltar coincidencias
            if (searchTerm) {
                resaltarEnCelda(cells[1], searchTerm); // Nombre
                resaltarEnCelda(cells[2], searchTerm); // Modelo
                resaltarEnCelda(cells[3], searchTerm); // Descripción
                resaltarEnCelda(cells[5], searchTerm); // Marca
            } else {
                // Limpiar resaltado
                limpiarResaltado(cells[1]);
                limpiarResaltado(cells[2]);
                limpiarResaltado(cells[3]);
                limpiarResaltado(cells[5]);
            }
        } else {
            row.style.display = 'none';
        }
    });

    // Actualizar contador
    actualizarContador(visibleCount, rows.length);
}

/**
 * Resaltar texto en una celda
 */
function resaltarEnCelda(celda, searchTerm) {
    if (!celda || !searchTerm) return;

    const texto = celda.textContent;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    const textoResaltado = texto.replace(regex, '<mark>$1</mark>');

    if (textoResaltado !== texto) {
        celda.innerHTML = textoResaltado;
    }
}

/**
 * Limpiar resaltado de una celda
 */
function limpiarResaltado(celda) {
    if (!celda) return;
    if (celda.querySelector('mark')) {
        celda.innerHTML = celda.textContent;
    }
}

/**
 * Escapar caracteres especiales de regex
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Actualizar contador de resultados
 */
function actualizarContador(visible, total) {
    const resultsCount = document.getElementById('results-count');
    const totalCount = document.getElementById('total-count');

    if (resultsCount) resultsCount.textContent = visible;
    if (totalCount) totalCount.textContent = total;
}

/**
 * Limpiar filtros
 */
function clearProductosFilters() {
    const searchInput = document.getElementById('buscar_tabla');
    if (searchInput) searchInput.value = '';

    filtrarProductosEnTiempoReal('');
}

// Exportar funciones globalmente
window.initEnhancedSearch = initEnhancedSearch;
window.filtrarProductosEnTiempoReal = filtrarProductosEnTiempoReal;
window.clearProductosFilters = clearProductosFilters;

console.log('✅ Enhanced Search Simple cargado');
