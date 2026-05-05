/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: table-enhancements.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
class TableEnhancer {
    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        if (!this.table) {
            console.error(`Tabla con ID "${tableId}" no encontrada`);
            return;
        }

        this.tbody = this.table.querySelector('tbody');
        this.thead = this.table.querySelector('thead');

        // Opciones
        this.options = {
            itemsPerPage: options.itemsPerPage || 10,
            searchable: options.searchable !== false,
            sortable: options.sortable !== false,
            selectable: options.selectable !== false,
            pagination: options.pagination !== false,
            ...options
        };

        // Estado
        this.currentPage = 1;
        this.itemsPerPage = this.options.itemsPerPage;
        this.allRows = [];
        this.filteredRows = [];
        this.selectedRow = null;
        this.sortColumn = null;
        this.sortDirection = null;

        this.init();
    }

    init() {
        // Guardar todas las filas
        this.allRows = Array.from(this.tbody.querySelectorAll('tr'));
        this.filteredRows = [...this.allRows];

        // Agregar clase enhanced-table
        this.table.classList.add('enhanced-table');

        // Inicializar características
        if (this.options.sortable) this.initSorting();
        if (this.options.selectable) this.initSelection();
        if (this.options.pagination) this.initPagination();

        // Renderizar
        this.render();
    }

    // ==========================================
    // ORDENAMIENTO
    // ==========================================

    initSorting() {
        const headers = this.thead.querySelectorAll('th');
        headers.forEach((header, index) => {
            // Skip actions column
            if (header.classList.contains('actions-column')) return;

            header.classList.add('sortable');
            header.dataset.column = index;

            // Agregar icono de ordenamiento
            const sortIcon = document.createElement('span');
            sortIcon.className = 'sort-icon';
            header.appendChild(sortIcon);

            header.addEventListener('click', () => this.sort(index));
        });
    }

    sort(columnIndex) {
        const header = this.thead.querySelectorAll('th')[columnIndex];

        // Determinar dirección
        if (this.sortColumn === columnIndex) {
            if (this.sortDirection === 'asc') {
                this.sortDirection = 'desc';
            } else if (this.sortDirection === 'desc') {
                this.sortDirection = null;
                this.sortColumn = null;
            } else {
                this.sortDirection = 'asc';
            }
        } else {
            this.sortColumn = columnIndex;
            this.sortDirection = 'asc';
        }

        // Actualizar clases de headers
        this.thead.querySelectorAll('th').forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
        });

        if (this.sortDirection) {
            header.classList.add(`sorted-${this.sortDirection}`);
            this.sortRows(columnIndex, this.sortDirection);
        } else {
            // Restaurar orden original
            this.filteredRows = [...this.allRows];
        }

        this.currentPage = 1;
        this.render();
    }

    sortRows(columnIndex, direction) {
        this.filteredRows.sort((a, b) => {
            const aValue = a.cells[columnIndex]?.textContent.trim() || '';
            const bValue = b.cells[columnIndex]?.textContent.trim() || '';

            // Intentar comparar como números
            const aNum = parseFloat(aValue.replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(bValue.replace(/[^0-9.-]/g, ''));

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Comparar como texto
            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    }

    // ==========================================
    // SELECCIÓN DE FILAS
    // ==========================================

    initSelection() {
        this.tbody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row || e.target.closest('.action-btn')) return;

            this.selectRow(row);
        });

        // Deseleccionar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('table')) {
                this.deselectRow();
            }
        });
    }

    selectRow(row) {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('selected');
        }
        row.classList.add('selected');
        this.selectedRow = row;

        // Disparar evento personalizado
        const event = new CustomEvent('rowselected', {
            detail: { row, data: this.getRowData(row) }
        });
        this.table.dispatchEvent(event);
    }

    deselectRow() {
        if (this.selectedRow) {
            this.selectedRow.classList.remove('selected');
            this.selectedRow = null;
        }
    }

    getRowData(row) {
        const data = {};
        const cells = row.querySelectorAll('td');
        const headers = this.thead.querySelectorAll('th');

        cells.forEach((cell, index) => {
            if (headers[index] && !headers[index].classList.contains('actions-column')) {
                const key = headers[index].textContent.trim().toLowerCase();
                data[key] = cell.textContent.trim();
            }
        });

        return data;
    }

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    initPagination() {
        // Crear contenedor de paginación si no existe
        let paginationContainer = this.table.parentElement.querySelector('.table-pagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'table-pagination';
            this.table.parentElement.appendChild(paginationContainer);
        }
        this.paginationContainer = paginationContainer;
    }

    renderPagination() {
        if (!this.paginationContainer) return;

        const totalItems = this.filteredRows.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        let html = `
            <div class="pagination-info">
                Mostrando <strong>${start}-${end}</strong> de <strong>${totalItems}</strong> registros
            </div>
            <div class="pagination-controls">
                <button class="page-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
        `;

        // Números de página
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-number" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
        }

        html += `
                <button class="page-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        this.paginationContainer.innerHTML = html;

        // Event listeners
        this.paginationContainer.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page === 'prev') {
                    this.goToPage(this.currentPage - 1);
                } else if (page === 'next') {
                    this.goToPage(this.currentPage + 1);
                } else {
                    this.goToPage(parseInt(page));
                }
            });
        });
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.render();
    }

    setItemsPerPage(items) {
        this.itemsPerPage = parseInt(items);
        this.currentPage = 1;
        this.render();
    }

    // ==========================================
    // FILTRADO
    // ==========================================

    filter(searchTerm, columnIndex = null) {
        searchTerm = searchTerm.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredRows = [...this.allRows];
        } else {
            this.filteredRows = this.allRows.filter(row => {
                if (columnIndex !== null) {
                    const cell = row.cells[columnIndex];
                    return cell && cell.textContent.toLowerCase().includes(searchTerm);
                } else {
                    // Buscar en todas las columnas
                    return Array.from(row.cells).some(cell =>
                        cell.textContent.toLowerCase().includes(searchTerm)
                    );
                }
            });
        }

        this.currentPage = 1;
        this.render();
    }

    clearFilters() {
        this.filteredRows = [...this.allRows];
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = null;

        // Limpiar clases de ordenamiento
        this.thead.querySelectorAll('th').forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
        });

        this.render();
    }

    // ==========================================
    // RENDERIZADO
    // ==========================================

    render() {
        // Limpiar tbody
        this.tbody.innerHTML = '';

        // Calcular filas a mostrar
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const rowsToShow = this.filteredRows.slice(start, end);

        // Agregar filas
        rowsToShow.forEach(row => {
            this.tbody.appendChild(row);
        });

        // Renderizar paginación
        if (this.options.pagination) {
            this.renderPagination();
        }

        // Mensaje si no hay resultados
        if (this.filteredRows.length === 0) {
            const colspan = this.thead.querySelectorAll('th').length;
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="${colspan}" style="text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No se encontraron resultados
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // ACCIONES
    // ==========================================

    addActionButtons(editCallback, deleteCallback, viewCallback = null) {
        // Agregar columna de acciones al header si no existe
        let actionsHeader = this.thead.querySelector('.actions-column');
        if (!actionsHeader) {
            actionsHeader = document.createElement('th');
            actionsHeader.className = 'actions-column';
            actionsHeader.textContent = 'Acciones';
            this.thead.querySelector('tr').appendChild(actionsHeader);
        }

        // Agregar botones a cada fila
        this.allRows.forEach(row => {
            let actionsCell = row.querySelector('.actions-cell');
            if (!actionsCell) {
                actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell';
                row.appendChild(actionsCell);
            }

            let html = '';

            if (viewCallback) {
                html += `<button class="action-btn action-view" title="Ver detalles"><i class="fas fa-eye"></i></button>`;
            }

            html += `
                <button class="action-btn action-edit" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="action-btn action-delete" title="Eliminar"><i class="fas fa-trash"></i></button>
            `;

            actionsCell.innerHTML = html;

            // Event listeners
            if (viewCallback) {
                actionsCell.querySelector('.action-view').addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewCallback(this.getRowData(row), row);
                });
            }

            actionsCell.querySelector('.action-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                editCallback(this.getRowData(row), row);
            });

            actionsCell.querySelector('.action-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCallback(this.getRowData(row), row);
            });
        });

        this.render();
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    refresh() {
        this.allRows = Array.from(this.tbody.querySelectorAll('tr'));
        this.filteredRows = [...this.allRows];
        this.render();
    }

    destroy() {
        // Limpiar event listeners y restaurar tabla
        this.table.classList.remove('enhanced-table');
        if (this.paginationContainer) {
            this.paginationContainer.remove();
        }
    }
}

// Exponer globalmente
window.TableEnhancer = TableEnhancer;
