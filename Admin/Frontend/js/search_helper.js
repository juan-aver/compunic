/*
 * ==========================================
 * MÓDULO: search_helper.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
function filtrarTabla(inputId, tableId, columnIndices) {
    // Empieza la magia ✨

    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('keyup', function () {
        const filter = this.value.toLowerCase();
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.getElementsByTagName('tr');

        // Empezar desde 1 para saltar el header, o detectar tbody
        const tbody = table.querySelector('tbody');
        const trs = tbody ? tbody.getElementsByTagName('tr') : rows;

        for (let i = 0; i < trs.length; i++) {
            const row = trs[i];
            // Si es una fila de "No hay datos", ignorar o mostrar siempre si no hay filtro
            if (row.cells.length === 1 && row.cells[0].colSpan > 1) continue;

            let textFound = false;

            if (columnIndices) {
                for (let index of columnIndices) {
                    if (row.cells[index]) {
                        const cellText = row.cells[index].textContent || row.cells[index].innerText;
                        if (cellText.toLowerCase().indexOf(filter) > -1) {
                            textFound = true;
                            break;
                        }
                    }
                }
            } else {
                // Si no se especifican columnas, buscar en todas
                const cellText = row.textContent || row.innerText;
                if (cellText.toLowerCase().indexOf(filter) > -1) {
                    textFound = true;
                }
            }

            if (textFound) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    });
}
