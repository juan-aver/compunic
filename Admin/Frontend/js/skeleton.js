/**
 * ==========================================
 * MÓDULO: skeleton.js
 * PROPÓSITO: Generador de Skeleton Screens profesionales
 * y optimizaciones de renderizado instantáneo sin layout shift.
 * ==========================================
 */

const Skeleton = {
  /**
   * Genera el HTML del skeleton completo adaptado al tipo de vista
   * @param {string} viewName - Identificador de la vista
   * @returns {string} HTML del skeleton screen
   */
  renderView(viewName) {
    switch (viewName) {
      case 'gestion-productos':
        return this.productsView();
      case 'gestion-ventas':
        return this.posView('Punto de Venta (POS)', 'Venta');
      case 'gestion-compra':
        return this.posView('Nueva Compra (POS)', 'Compra');
      case 'gestion-lista-ventas':
        return this.tableView('Historial de Ventas', ['ID Venta', 'No. Factura', 'Fecha', 'Cliente', 'Vendedor', 'Tipo Pago', 'Total', 'Acciones'], 8);
      case 'gestion-lista-compras':
        return this.tableView('Historial de Compras', ['ID Compra', 'No. Factura', 'Fecha', 'Proveedor', 'Usuario', 'Total', 'Acciones'], 8);
      case 'historial-stock':
        return this.tableView('Historial de Stock', ['ID', 'Producto', 'Tipo Movimiento', 'Cantidad', 'Fecha / Hora', 'Usuario', 'Detalles'], 8);
      case 'gestion-auditoria':
        return this.tableView('Auditoría del Sistema', ['ID', 'Fecha / Hora', 'Usuario', 'Acción Realizada', 'Módulo', 'IP / Dispositivo', 'Detalles'], 8);
      case 'devoluciones-clientes':
        return this.tableView('Devolución a Clientes', ['ID', 'Fecha', 'No. Factura', 'Cliente', 'Producto', 'Motivo', 'Estado', 'Acciones'], 6);
      case 'devoluciones-proveedores':
        return this.tableView('Devolución a Proveedores', ['ID', 'Fecha', 'Proveedor', 'Producto', 'Cantidad', 'Motivo', 'Estado', 'Acciones'], 6);
      case 'gestion-clientes':
        return this.formTableView('Gestión de Clientes', ['Nombre', 'Apellido', 'Teléfono', 'Email', 'Cédula'], ['ID', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Cédula', 'Acciones']);
      case 'gestion-empleados':
        return this.formTableView('Personal / Empleados', ['Nombre', 'Apellido', 'Cargo', 'Teléfono', 'Email', 'Salario'], ['ID', 'Nombre', 'Apellido', 'Cargo', 'Teléfono', 'Estado', 'Acciones']);
      case 'gestion-proveedores':
        return this.formTableView('Gestión de Proveedores', ['Nombre Empresa / Proveedor', 'Contacto', 'Teléfono', 'Email', 'Dirección', 'RUC'], ['ID', 'Proveedor', 'Contacto', 'Teléfono', 'Email', 'RUC', 'Acciones']);
      case 'gestion-categorias':
        return this.formTableView('Gestión de Categorías', ['Nombre de la Categoría', 'Descripción'], ['ID', 'Nombre de Categoría', 'Acciones']);
      case 'gestion-garantias':
        return this.formTableView('Gestión de Garantías', ['Tipo de Garantía', 'Duración (Meses)', 'Descripción', 'Condiciones'], ['ID', 'Póliza', 'Duración', 'Estado', 'Acciones']);
      case 'gestion-temporales':
        return this.formTableView('Técnicos Temporales', ['Nombre Completo', 'Especialidad', 'Teléfono', 'Tarifa'], ['ID', 'Técnico', 'Especialidad', 'Teléfono', 'Estado', 'Acciones']);
      case 'gestion-servicios':
        return this.serviciosView();
      case 'gestion-caja':
        return this.cajaView();
      case 'gestion-reportes':
        return this.reportesView();
      case 'gestion-devoluciones':
        return this.devolucionesView();
      case 'gestion-pagos-web':
        return this.pagosWebView();
      case 'inicio':
      default:
        return this.dashboardView();
    }
  },

  /**
   * Skeleton para Catálogo de Productos (Cards Grid)
   */
  productsView() {
    let cardsHtml = '';
    for (let i = 0; i < 8; i++) {
      cardsHtml += `
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="skeleton-pill" style="width: 70px;"></div>
            <div class="skeleton-pill" style="width: 50px;"></div>
          </div>
          <div class="skeleton-line w-80" style="height: 18px;"></div>
          <div class="skeleton-line w-50"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div class="skeleton-line w-40" style="height: 22px;"></div>
            <div class="skeleton-pill" style="width: 60px;"></div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <div class="skeleton-btn" style="flex: 1;"></div>
            <div class="skeleton-btn" style="width: 40px;"></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="skeleton-view-wrapper">
        <div class="skeleton-controls-bar">
          <div style="display: flex; gap: 12px; flex: 1; min-width: 280px; align-items: center;">
            <div class="skeleton-input" style="flex: 1; max-width: 380px;"></div>
            <div class="skeleton-btn" style="width: 140px;"></div>
            <div class="skeleton-btn" style="width: 140px;"></div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="skeleton-btn" style="width: 90px;"></div>
            <div class="skeleton-btn" style="width: 150px;"></div>
          </div>
        </div>
        <div class="skeleton-cards-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para POS (Ventas y Compras con 2 columnas)
   */
  posView(title, tipo) {
    let productItems = '';
    for (let i = 0; i < 6; i++) {
      productItems += `
        <div class="skeleton-card" style="padding: 12px;">
          <div class="skeleton-box" style="height: 90px; border-radius: 8px; margin-bottom: 8px;"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-50" style="height: 18px;"></div>
        </div>
      `;
    }

    return `
      <div class="skeleton-view-wrapper">
        <div style="margin-bottom: 20px;">
          <div class="skeleton-title" style="width: 280px;"></div>
          <div class="skeleton-subtitle"></div>
        </div>
        <div class="skeleton-pos-layout">
          <!-- Columna Izquierda: Selección de Productos -->
          <div>
            <div class="skeleton-controls-bar" style="margin-bottom: 16px;">
              <div class="skeleton-input" style="flex: 1;"></div>
              <div class="skeleton-btn" style="width: 120px;"></div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;">
              ${productItems}
            </div>
          </div>
          <!-- Columna Derecha: Ticket / Carrito -->
          <div>
            <div class="skeleton-card" style="position: sticky; top: 20px;">
              <div class="skeleton-title" style="width: 140px; margin-bottom: 8px;"></div>
              <div class="skeleton-input" style="height: 40px; margin-bottom: 10px;"></div>
              <div class="skeleton-input" style="height: 40px; margin-bottom: 15px;"></div>
              <div style="border-top: 1px solid var(--sk-card-border); padding-top: 12px; display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <div class="skeleton-line w-50"></div>
                  <div class="skeleton-line w-25"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <div class="skeleton-line w-40"></div>
                  <div class="skeleton-line w-25"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <div class="skeleton-line w-60"></div>
                  <div class="skeleton-line w-30"></div>
                </div>
              </div>
              <div style="margin-top: 20px; border-top: 2px solid var(--sk-card-border); padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <div class="skeleton-line w-40" style="height: 22px;"></div>
                  <div class="skeleton-line w-40" style="height: 26px;"></div>
                </div>
                <div class="skeleton-btn" style="width: 100%; height: 46px; border-radius: 10px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Tablas / Historiales
   */
  tableView(title, columns = ['ID', 'Columna 1', 'Columna 2', 'Columna 3', 'Total', 'Acciones'], rowCount = 8) {
    let theadCells = columns.map(c => `<th><div class="skeleton-line w-75 skeleton-th"></div></th>`).join('');
    let tbodyRows = '';
    const sampleWidths = ['w-30', 'w-75', 'w-50', 'w-60', 'w-40', 'w-70', 'w-50'];

    for (let r = 0; r < rowCount; r++) {
      let cells = columns.map((c, idx) => {
        const w = sampleWidths[(r + idx) % sampleWidths.length];
        return `<td class="skeleton-td"><div class="skeleton-line ${w}"></div></td>`;
      }).join('');
      tbodyRows += `<tr class="skeleton-tr">${cells}</tr>`;
    }

    return `
      <div class="skeleton-view-wrapper">
        <div style="margin-bottom: 20px;">
          <div class="skeleton-title" style="width: 320px;"></div>
          <div class="skeleton-subtitle"></div>
        </div>
        <div class="skeleton-controls-bar">
          <div class="skeleton-input" style="flex: 1; max-width: 360px;"></div>
          <div style="display: flex; gap: 10px;">
            <div class="skeleton-btn" style="width: 130px;"></div>
            <div class="skeleton-btn" style="width: 100px;"></div>
          </div>
        </div>
        <div class="skeleton-table-wrapper">
          <table class="skeleton-table">
            <thead>
              <tr>${theadCells}</tr>
            </thead>
            <tbody>
              ${tbodyRows}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--sk-card-border);">
            <div class="skeleton-line w-25"></div>
            <div style="display: flex; gap: 8px;">
              <div class="skeleton-btn" style="width: 90px; height: 32px;"></div>
              <div class="skeleton-btn" style="width: 90px; height: 32px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Formulario CRUD + Tabla
   */
  formTableView(title, formFields = [], tableColumns = []) {
    let fieldsHtml = formFields.map(f => `
      <div>
        <div class="skeleton-line w-40" style="height: 12px; margin-bottom: 6px;"></div>
        <div class="skeleton-input"></div>
      </div>
    `).join('');

    let theadCells = tableColumns.map(c => `<th><div class="skeleton-line w-75 skeleton-th"></div></th>`).join('');
    let tbodyRows = '';
    for (let r = 0; r < 5; r++) {
      let cells = tableColumns.map((c, idx) => {
        return `<td class="skeleton-td"><div class="skeleton-line ${idx === 0 ? 'w-30' : 'w-70'}"></div></td>`;
      }).join('');
      tbodyRows += `<tr class="skeleton-tr">${cells}</tr>`;
    }

    return `
      <div class="skeleton-view-wrapper">
        <!-- Formulario -->
        <div class="skeleton-form-card">
          <div class="skeleton-title" style="width: 240px; margin-bottom: 16px;"></div>
          <div class="skeleton-form-grid">
            ${fieldsHtml}
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
            <div class="skeleton-btn" style="width: 110px;"></div>
            <div class="skeleton-btn" style="width: 110px;"></div>
          </div>
        </div>

        <!-- Buscador -->
        <div class="skeleton-controls-bar">
          <div class="skeleton-input" style="flex: 1; max-width: 400px;"></div>
          <div class="skeleton-btn" style="width: 110px;"></div>
        </div>

        <!-- Tabla -->
        <div class="skeleton-table-wrapper">
          <table class="skeleton-table">
            <thead>
              <tr>${theadCells}</tr>
            </thead>
            <tbody>
              ${tbodyRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Servicios Técnicos
   */
  serviciosView() {
    let ticketsHtml = '';
    for (let i = 0; i < 6; i++) {
      ticketsHtml += `
        <div class="skeleton-card" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="skeleton-pill" style="width: 80px;"></div>
            <div class="skeleton-line w-25"></div>
          </div>
          <div class="skeleton-line w-80" style="height: 18px; margin-top: 8px;"></div>
          <div class="skeleton-line w-50"></div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
            <div class="skeleton-avatar" style="width: 32px; height: 32px;"></div>
            <div class="skeleton-line w-40"></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="skeleton-view-wrapper">
        <!-- Stats de Servicios -->
        <div class="skeleton-stats-grid">
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-30" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-30" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-30" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-30" style="height: 22px;"></div></div></div>
        </div>

        <!-- Barra de Tabs y Acciones -->
        <div class="skeleton-controls-bar">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <div class="skeleton-pill" style="width: 110px; height: 34px;"></div>
            <div class="skeleton-pill" style="width: 120px; height: 34px;"></div>
            <div class="skeleton-pill" style="width: 110px; height: 34px;"></div>
            <div class="skeleton-pill" style="width: 110px; height: 34px;"></div>
          </div>
          <div class="skeleton-btn" style="width: 150px;"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;">
          ${ticketsHtml}
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Control de Caja y Arqueo
   */
  cajaView() {
    return `
      <div class="skeleton-view-wrapper">
        <div class="skeleton-stats-grid">
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 24px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 24px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 24px;"></div></div></div>
        </div>
        <div class="skeleton-controls-bar">
          <div style="display: flex; gap: 12px;">
            <div class="skeleton-btn" style="width: 130px;"></div>
            <div class="skeleton-btn" style="width: 130px;"></div>
            <div class="skeleton-btn" style="width: 130px;"></div>
          </div>
          <div class="skeleton-btn" style="width: 140px;"></div>
        </div>
        <div class="skeleton-table-wrapper">
          <table class="skeleton-table">
            <thead>
              <tr>
                <th><div class="skeleton-line w-30 skeleton-th"></div></th>
                <th><div class="skeleton-line w-60 skeleton-th"></div></th>
                <th><div class="skeleton-line w-50 skeleton-th"></div></th>
                <th><div class="skeleton-line w-40 skeleton-th"></div></th>
                <th><div class="skeleton-line w-30 skeleton-th"></div></th>
              </tr>
            </thead>
            <tbody>
              ${this.tableRows(6, 5)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Reportes y Estadísticas
   */
  reportesView() {
    return `
      <div class="skeleton-view-wrapper">
        <div class="skeleton-controls-bar">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; flex: 1;">
            <div class="skeleton-input" style="width: 180px;"></div>
            <div class="skeleton-input" style="width: 180px;"></div>
            <div class="skeleton-btn" style="width: 120px;"></div>
          </div>
          <div class="skeleton-btn" style="width: 140px;"></div>
        </div>
        <div class="skeleton-stats-grid">
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 22px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-50"></div><div class="skeleton-line w-40" style="height: 22px;"></div></div></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
          <div class="skeleton-card" style="height: 320px;">
            <div class="skeleton-title" style="width: 180px;"></div>
            <div class="skeleton-box" style="flex: 1; border-radius: 8px;"></div>
          </div>
          <div class="skeleton-card" style="height: 320px;">
            <div class="skeleton-title" style="width: 180px;"></div>
            <div class="skeleton-box" style="flex: 1; border-radius: 8px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Skeleton para Pagos Web
   */
  pagosWebView() {
    return this.tableView('Gestión de Pagos Web', ['ID Pago', 'Fecha', 'Cliente', 'Referencia / Voucher', 'Monto', 'Método', 'Estado', 'Acciones'], 6);
  },

  /**
   * Skeleton para Devoluciones
   */
  devolucionesView() {
    return this.formTableView('Gestión de Devoluciones', ['No. Venta / Factura', 'Producto a Devolver', 'Cantidad', 'Motivo de la Devolución'], ['ID', 'Factura', 'Producto', 'Cliente', 'Motivo', 'Estado', 'Acciones']);
  },

  /**
   * Skeleton para Dashboard Principal (Inicio)
   */
  dashboardView() {
    return `
      <div class="skeleton-view-wrapper">
        <div class="skeleton-stats-grid">
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-60"></div><div class="skeleton-line w-40" style="height: 26px;"></div><div class="skeleton-line w-30" style="height: 12px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-60"></div><div class="skeleton-line w-40" style="height: 26px;"></div><div class="skeleton-line w-30" style="height: 12px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-60"></div><div class="skeleton-line w-40" style="height: 26px;"></div><div class="skeleton-line w-30" style="height: 12px;"></div></div></div>
          <div class="skeleton-stat-card"><div class="skeleton-avatar"></div><div style="flex: 1;"><div class="skeleton-line w-60"></div><div class="skeleton-line w-40" style="height: 26px;"></div><div class="skeleton-line w-30" style="height: 12px;"></div></div></div>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
          <div class="skeleton-card" style="height: 320px;">
            <div class="skeleton-title" style="width: 220px;"></div>
            <div class="skeleton-box" style="flex: 1; border-radius: 8px;"></div>
          </div>
          <div class="skeleton-card" style="height: 320px;">
            <div class="skeleton-title" style="width: 180px;"></div>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
              <div class="skeleton-line w-100" style="height: 38px; border-radius: 8px;"></div>
              <div class="skeleton-line w-100" style="height: 38px; border-radius: 8px;"></div>
              <div class="skeleton-line w-100" style="height: 38px; border-radius: 8px;"></div>
              <div class="skeleton-line w-100" style="height: 38px; border-radius: 8px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Helper: Genera filas skeleton de tabla para usar dinámicamente en cargas asíncronas
   * @param {number} rowCount - Cantidad de filas
   * @param {number} colCount - Cantidad de columnas
   */
  tableRows(rowCount = 5, colCount = 6) {
    const widths = ['w-30', 'w-75', 'w-50', 'w-60', 'w-40', 'w-70', 'w-50'];
    let html = '';
    for (let r = 0; r < rowCount; r++) {
      let cells = '';
      for (let c = 0; c < colCount; c++) {
        const w = widths[(r + c) % widths.length];
        cells += `<td class="skeleton-td"><div class="skeleton-line ${w}"></div></td>`;
      }
      html += `<tr class="skeleton-tr">${cells}</tr>`;
    }
    return html;
  },

  /**
   * Helper: Genera tarjetas skeleton de productos para usar durante fetch
   * @param {number} count - Cantidad de tarjetas
   */
  productCards(count = 8) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="skeleton-pill" style="width: 70px;"></div>
            <div class="skeleton-pill" style="width: 50px;"></div>
          </div>
          <div class="skeleton-line w-80" style="height: 18px;"></div>
          <div class="skeleton-line w-50"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div class="skeleton-line w-40" style="height: 22px;"></div>
            <div class="skeleton-pill" style="width: 60px;"></div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <div class="skeleton-btn" style="flex: 1;"></div>
            <div class="skeleton-btn" style="width: 40px;"></div>
          </div>
        </div>
      `;
    }
    return html;
  }
};

// Exportar globalmente
window.Skeleton = Skeleton;

