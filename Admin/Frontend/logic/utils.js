/*
 * ==========================================
 * MÓDULO: utils.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
function cargarHistorialStock() {
    // Empieza la magia ✨

    const tbody = document.getElementById("tabla-historial")?.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando historial...</td></tr>';

    fetch(`${API_BASE}/movimientos-stock`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay movimientos registrados.</td></tr>';
                return;
            }

            data.forEach(m => {
                const tr = document.createElement("tr");

                const id = m.ID_MOVIMIENTO;
                const producto = m.NOMBRE_PRODUCTO;
                const tipo = m.TIPO_MOVIMIENTO;
                const motivo = m.MOTIVO;
                const cantidad = m.CANTIDAD;
                const stock = m.STOCK_RESULTANTE;
                const fechaRaw = m.FECHA_MOVIMIENTO;

                const fecha = fechaRaw ? new Date(fechaRaw).toLocaleString() : 'Sin fecha';

                let estiloBadge = "padding: 5px 10px; border-radius: 15px; font-weight: bold; color: white;";
                if (tipo === 'entrada') estiloBadge += "background-color: #28a745;";
                else if (tipo === 'salida') estiloBadge += "background-color: #dc3545;";
                else estiloBadge += "background-color: #ffc107; color: black;";

                tr.innerHTML = `
                    <td>${id}</td>
                    <td style="font-weight: bold;">${producto}</td>
                    <td><span style="${estiloBadge}">${tipo ? tipo.toUpperCase() : 'N/A'}</span></td>
                    <td>${motivo}</td>
                    <td style="font-weight: bold; font-size: 1.1em;">${cantidad}</td>
                    <td>${stock}</td>
                    <td>${fecha}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Error al cargar historial:", err);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: red;">Error visualizando datos.</td></tr>';
        });
}

// =========================================
// MEJORAS UI: TOASTS & TRANSICIONES
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
});

window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return alert(message);

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
        <span style="margin-right: 10px; font-size: 1.2em;">${icon}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; margin-left:10px; cursor:pointer; font-size:1.2em;">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
};

function aplicarTransicion() {
    const content = document.getElementById('content');
    if (content) {
        content.classList.remove('fade-in');
        void content.offsetWidth;
        content.classList.add('fade-in');
    }
}

// Hook en cargarVista para disparar transición
// NOTE: This wraps the cargarVista from router.js. Since router.js is loaded first,
// we wrap it here after all modules are loaded.
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.cargarVista === 'function') {
        const originalCargarVista = window.cargarVista;
        window.cargarVista = function (...args) {
            aplicarTransicion();
            return originalCargarVista.apply(this, args);
        };
    }
});

/**
 * Filtra una tabla HTML basándose en el texto de un input.
 * @param {string} inputId - ID del input de búsqueda.
 * @param {string} tableId - ID del cuerpo de la tabla (tbody) o la tabla misma.
 * @param {Array<number>} columnIndices - Índices de las columnas a considerar en la búsqueda (0-indexed).
 */
function filtrarTabla(inputId, tableId, columnIndices) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const newElement = input.cloneNode(true);
    input.parentNode.replaceChild(newElement, input);

    newElement.addEventListener('keyup', function () {
        const filter = this.value.toLowerCase();
        const tableElement = document.getElementById(tableId);
        if (!tableElement) return;

        let rows;
        if (tableElement.tagName === 'TBODY') {
            rows = tableElement.getElementsByTagName('tr');
        } else {
            const tbody = tableElement.querySelector('tbody');
            rows = tbody ? tbody.getElementsByTagName('tr') : tableElement.getElementsByTagName('tr');
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.parentNode.tagName === 'THEAD') continue;
            if (row.cells.length === 1 && row.cells[0].colSpan > 1) continue;

            let textFound = false;

            if (columnIndices && columnIndices.length > 0) {
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
