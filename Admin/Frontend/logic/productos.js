/**
 * @file productos.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
function initProductosImagen() {

    const imagenInput = document.getElementById('imagen_producto');
    const previewContainer = document.getElementById('preview_imagen_container');
    const previewImagen = document.getElementById('preview_imagen');

    if (imagenInput) {
        imagenInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    previewImagen.src = event.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
                previewImagen.src = '';
            }
        });
    }
}

function mostrarDetalleProducto(producto) {
    const modal = document.getElementById('modalDescripcionProducto');
    if (!modal) return;

    // Normalize product data
    const p = {
        nombre: producto.nombre || producto.NOMBRE || producto.NOMBRE_PRODUCTO || 'N/A',
        modelo: producto.modelo || producto.MODELO || 'N/A',
        descripcion: producto.descripcion || producto.DESCRIPCION || 'Sin descripción',
        categoria: producto.nombre_categoria || producto.NOMBRE_CATEGORIA || producto.CATEGORIA || 'N/A',
        marca: producto.nombre_marca || producto.NOMBRE_MARCA || producto.MARCA || 'N/A',
        proveedor: producto.nombre_proveedor || producto.NOMBRE_PROVEEDOR || producto.PROVEEDOR || 'N/A',
        garantia: producto.garantia_meses || producto.GARANTIA_MESES || 'N/A',
        garantia_proveedor: producto.garantia_proveedor || producto.GARANTIA_PROVEEDOR || 0,
        stock: producto.stock ?? producto.stock_actual_calculado ?? producto.STOCK ?? '0',
        precio_compra: parseFloat(producto.precio_compra || producto.PRECIO_COMPRA || 0),
        precio_venta: parseFloat(producto.precio_venta || producto.PRECIO_VENTA || 0),
        imagen_url: producto.imagen_url || producto.IMAGEN_URL
    };

    // Populate image header
    const modalImagen = document.getElementById('modal_imagen');
    const modalPlaceholder = document.getElementById('modal_img_placeholder');
    if (modalImagen && modalPlaceholder) {
        if (p.imagen_url) {
            modalImagen.src = p.imagen_url.startsWith('http') ? p.imagen_url : `${SERVER_URL}/${p.imagen_url}`;
            modalImagen.style.display = 'block';
            modalPlaceholder.style.display = 'none';
        } else {
            modalImagen.style.display = 'none';
            modalPlaceholder.style.display = 'block';
        }
    }

    // Populate detail fields
    const setField = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setField('modal_nombre', p.nombre);
    setField('modal_descripcion_text', p.descripcion);
    setField('modal_modelo', p.modelo);
    setField('modal_categoria', p.categoria);
    setField('modal_marca', p.marca);
    setField('modal_proveedor', p.proveedor);
    setField('modal_garantia', p.garantia !== 'N/A' && !String(p.garantia).toLowerCase().includes('mes') ? p.garantia + ' meses' : p.garantia);
    setField('modal_garantia_proveedor', p.garantia_proveedor ? p.garantia_proveedor + ' meses' : 'Sin Garantía');
    setField('modal_stock', p.stock);
    setField('modal_precio_compra', 'C$' + p.precio_compra.toFixed(2));
    setField('modal_precio_venta', 'C$' + p.precio_venta.toFixed(2));

    modal.style.display = 'flex';
}

function cerrarModalDescripcion() {
    const modal = document.getElementById('modalDescripcionProducto');
    if (modal) modal.style.display = 'none';
}

// ========================================================================================================
// LÓGICA DE PRODUCTOS (CRUD)
// ========================================================================================================

function buscarProducto() {
    const nombre = document.getElementById('buscar_nombre').value.trim();
    const resultadosDiv = document.getElementById('resultadosBusqueda');
    const resultadosSection = document.getElementById('resultadosBusquedaSection');
    const tablaSection = document.getElementById('seccion-tabla');

    resultadosDiv.innerHTML = '';
    resultadosSection.style.display = 'none';
    tablaSection.style.display = 'none';

    if (!nombre) {
        tablaSection.style.display = 'block';
        return;
    }

    resultadosSection.style.display = 'block';

    fetch(`${API_BASE}/productos?nombre=${encodeURIComponent(nombre)}`)
        .then(res => res.json())
        .then(productos => {
            if (productos.length === 0) {
                resultadosDiv.innerHTML = '<p>No se encontraron productos.</p>';
                return;
            }
            const p = productos[0];
            resultadosDiv.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #3498db; color: white;">
            <tr>
              <th>ID</th><th>Nombre</th><th>Descripción</th><th>Precio Compra</th><th>Precio Venta</th><th>Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${p.id_producto}</td><td>${p.nombre}</td><td>${p.descripcion}</td><td>C$${p.precio_compra}</td><td>C$${p.precio_venta}</td><td>${p.stock}</td>
            </tr>
          </tbody>
        </table>
      `;
        })
        .catch(err => {
            console.error('Error al buscar productos:', err);
            resultadosDiv.innerHTML = '<p>Error al buscar productos.</p>';
        });
}

function cargarFormulario(p) {
    document.getElementById("usuario").value = p.id_usuario || '';
    document.getElementById("nombre").value = p.nombre || '';
    document.getElementById("proveedor").value = p.id_proveedor || '';
    document.getElementById("descripcion").value = p.descripcion || '';
    document.getElementById("categoria").value = p.id_categoria || '';
    document.getElementById("precio_compra").value = p.precio_compra || '';
    document.getElementById("precio_venta").value = p.precio_venta || '';
    document.getElementById("stock").value = p.stock || 0;
    document.getElementById("marca").value = p.marca || '';
    document.getElementById("modelo").value = p.modelo || '';
    document.getElementById("identificador").value = p.identificador || '';
    document.getElementById("año").value = p.año || '';
    document.getElementById("formulario").dataset.idProducto = p.id_producto || '';
}

// ========================================================================================================
// PRODUCT VIEW: Cards + Table dual rendering
// ========================================================================================================

window._allProductos = []; // Store all products for search/filter
window._filteredProductos = [];
window._productosCurrentPage = 1;
window._productosPerPage = 15;
window._productosSearchQuery = '';

// 🔥 Obtenemos TODOS los productos del backend y procesamos la vista actual
function cargarProductos() {
    fetch(`${API_BASE}/productos`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            window._allProductos = data;
            window._filteredProductos = data;
            renderProductosPaginated();
        })
        .catch(err => {
            console.error('Error al cargar productos:', err);
        });
}

function renderProductosPaginated() {
    // Calculate slice
    const startIndex = (window._productosCurrentPage - 1) * window._productosPerPage;
    const endIndex = startIndex + window._productosPerPage;
    const paginatedData = window._filteredProductos.slice(startIndex, endIndex);
    
    // Always render cards view
    renderProductCards(paginatedData);
    
    // Render pagination controls
    renderPaginationControls(window._filteredProductos.length);
}

function renderPaginationControls(totalItems) {
    const controlsContainer = document.getElementById('productos-pagination');
    if (!controlsContainer) return;
    
    const totalPages = Math.ceil(totalItems / window._productosPerPage);
    let html = '';
    
    if (totalPages > 1) {
        html += `<button onclick="window.changeProductosPage(${window._productosCurrentPage - 1})" ${window._productosCurrentPage === 1 ? 'disabled' : ''} class="btn-card-detail" style="margin-right: 10px;">&laquo; Anterior</button>`;
        html += `<span style="margin: 0 10px; font-weight: bold;">Página ${window._productosCurrentPage} de ${totalPages}</span>`;
        html += `<button onclick="window.changeProductosPage(${window._productosCurrentPage + 1})" ${window._productosCurrentPage === totalPages ? 'disabled' : ''} class="btn-card-detail" style="margin-left: 10px;">Siguiente &raquo;</button>`;
    } else if (totalItems > 0) {
        html += `<span style="margin: 0 10px; color: #666;">Mostrando todos los ${totalItems} productos</span>`;
    }
    controlsContainer.innerHTML = html;
}

window.changeProductosPage = function(page) {
    window._productosCurrentPage = page;
    renderProductosPaginated();
};

function renderProductCards(paginatedData) {
    const grid = document.getElementById('productosGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!paginatedData || paginatedData.length === 0) {
        grid.innerHTML = '<div class="no-products-message"><i class="fas fa-box-open"></i>No hay productos encontrados</div>';
        return;
    }

    paginatedData.forEach((producto, index) => {
        const gIndex = window._allProductos.indexOf(producto);
        const nombre = producto.nombre ?? producto.NOMBRE ?? producto.NOMBRE_PRODUCTO ?? 'Sin nombre';
        const modelo = producto.modelo ?? producto.MODELO ?? '';
        const categoria = producto.nombre_categoria ?? producto.NOMBRE_CATEGORIA ?? producto.CATEGORIA ?? '';
        const marca = producto.nombre_marca ?? producto.NOMBRE_MARCA ?? producto.MARCA ?? '';
        const precioVenta = parseFloat(producto.precio_venta ?? producto.PRECIO_VENTA ?? 0);
        const stock = Number(producto.stock ?? producto.stock_actual_calculado ?? producto.STOCK ?? 0) || 0;
        const imagenUrl = producto.imagen_url || producto.IMAGEN_URL || '';
        const activo = producto.activo !== undefined ? Number(producto.activo) : 1;

        // Badges
        let badges = '';
        if (nombre.includes('(Seminuevo)')) {
            badges += '<span class="badge" style="background: #e67e22; color: white;"><i class="fas fa-recycle"></i> SEMINUEVO</span>';
        }
        if (activo === 0) {
            badges += '<span class="badge badge-baja"><i class="fas fa-ban"></i> Dado de Baja</span>';
        } else if (stock === 0) {
            badges += '<span class="badge badge-agotado"><i class="fas fa-exclamation-circle"></i> Agotado</span>';
        } else if (stock < 5) {
            badges += '<span class="badge badge-stock-bajo"><i class="fas fa-exclamation-triangle"></i> Stock Bajo</span>';
        }
        
        const seriesNuevas = Number(producto.series_nuevas || 0);
        const seriesSeminuevas = Number(producto.series_seminuevas || 0);
        if (seriesNuevas > 0) badges += `<span class="badge" style="background: #27ae60; color: white;"><i class="fas fa-box"></i> Nuevos: ${seriesNuevas}</span>`;
        if (seriesSeminuevas > 0) badges += `<span class="badge" style="background: #e67e22; color: white;"><i class="fas fa-recycle"></i> Seminuevos: ${seriesSeminuevas}</span>`;

        // Image
        const imgPath = imagenUrl && imagenUrl.startsWith('http') ? imagenUrl : `${SERVER_URL}/${imagenUrl}`;
        const imgHtml = imagenUrl
            ? `<img src="${imgPath}" alt="${nombre}">`
            : '<div class="card-img-placeholder"><i class="fas fa-box-open"></i></div>';

        // Stock class
        let stockClass = 'card-stock';
        if (activo === 0) stockClass += ' stock-zero';
        else if (stock === 0) stockClass += ' stock-zero';
        else if (stock < 5) stockClass += ' stock-low';

        // Subtitle
        const subtitle = [categoria, marca].filter(Boolean).join(' · ') || 'General';

        const card = document.createElement('div');
        card.className = 'product-card' + (activo === 0 ? ' product-card-baja' : '');
        card.style.animationDelay = `${Math.min(index * 0.03, 0.3)}s`;
        card.dataset.searchText = `${nombre} ${modelo} ${categoria} ${marca}`.toLowerCase();

        card.innerHTML = `
            <div class="card-badges">${badges}</div>
            <div class="card-image">${imgHtml}${activo === 0 ? '<div class="card-baja-overlay"><i class="fas fa-ban"></i></div>' : ''}</div>
            <div class="card-body">
                <h4 title="${nombre}">${nombre}</h4>
                <div class="card-subtitle">${subtitle}</div>
                <div class="card-info">
                    <span class="card-price">${activo === 0 ? '<s>C$' + precioVenta.toFixed(2) + '</s>' : 'C$' + precioVenta.toFixed(2)}</span>
                    <span class="${stockClass}"><i class="fas fa-cube"></i> ${stock}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-card-detail" style="background: #9b59b6; border-color: #9b59b6;" onclick="event.stopPropagation(); abrirModalSeries(window._allProductos[${gIndex}])">
                        <i class="fas fa-barcode"></i> Series
                    </button>
                    <button class="btn-card-detail" style="background: #e74c3c; border-color: #e74c3c;" onclick="event.stopPropagation(); abrirModalMerma(window._allProductos[${gIndex}].id_producto || window._allProductos[${gIndex}].ID_PRODUCTO)">
                        <i class="fas fa-exclamation-triangle"></i> Merma
                    </button>
                    <button class="btn-card-detail" onclick="event.stopPropagation(); mostrarDetalleProducto(window._allProductos[${gIndex}])">
                        <i class="fas fa-eye"></i> Detalle
                    </button>
                    <button class="btn-card-edit" onclick="event.stopPropagation(); seleccionarProducto(window._allProductos[${gIndex}])">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;

        // Click on card = select product
        card.addEventListener('click', () => seleccionarProducto(producto));

        grid.appendChild(card);
    });
}



// Card search filter
function initCardSearch() {
    const input = document.getElementById('buscar_tabla');
    if (!input) return;

    input.addEventListener('keyup', function () {
        window._productosSearchQuery = this.value.toLowerCase();
        
        if (!window._productosSearchQuery) {
            window._filteredProductos = window._allProductos;
        } else {
            window._filteredProductos = window._allProductos.filter(producto => {
                const nombre = (producto.nombre ?? producto.NOMBRE ?? producto.NOMBRE_PRODUCTO ?? '').toLowerCase();
                const modelo = (producto.modelo ?? producto.MODELO ?? '').toLowerCase();
                const categoria = (producto.nombre_categoria ?? producto.NOMBRE_CATEGORIA ?? producto.CATEGORIA ?? '').toLowerCase();
                const marca = (producto.nombre_marca ?? producto.NOMBRE_MARCA ?? producto.MARCA ?? '').toLowerCase();
                const desc = (producto.descripcion ?? producto.DESCRIPCION ?? '').toLowerCase();
                
                const searchStr = `${nombre} ${modelo} ${categoria} ${marca} ${desc}`;
                return searchStr.includes(window._productosSearchQuery);
            });
        }
        
        window._productosCurrentPage = 1;
        renderProductosPaginated();
    });
}
window.initCardSearch = initCardSearch;

// Selección de producto desde la tabla o card: resalta y carga formulario en modal
function seleccionarProducto(producto, fila) {
    // quitar clase de otras filas
    const tbody = document.getElementById('tablaProductos');
    if (tbody) {
        Array.from(tbody.querySelectorAll('tr')).forEach(r => r.style.backgroundColor = 'transparent');
    }
    // resaltar la fila seleccionada (if from table)
    if (fila) fila.style.backgroundColor = 'rgba(0,123,255,0.08)';

    // guardar id seleccionado en el formulario
    const form = document.getElementById('formularioProducto');
    if (form) form.dataset.idSelected = producto.id_producto ?? producto.ID_PRODUCTO ?? producto.id ?? '';

    cargarFormularioProducto(producto);

    // Open modal in edit mode
    abrirModalProducto(producto);
}

function abrirModalProducto(producto) {
    const modal = document.getElementById('modalProductoForm');
    const title = document.getElementById('modalProductoTitle');
    const btnAgregar = document.getElementById('btn_agregar');
    const btnModificar = document.getElementById('btn_modificar');
    const btnEliminar = document.getElementById('btn_eliminar');
    if (!modal) return;

    if (producto) {
        // Edit mode
        if (title) title.innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
        if (btnAgregar) btnAgregar.style.display = 'none';
        if (btnModificar) {
            btnModificar.style.display = 'flex';
            btnModificar.onclick = modificarProducto;
        }
        if (btnEliminar) {
            // Si el producto está dado de baja, mostrar botón de reactivar; si no, de dar de baja
            const activo = producto.activo !== undefined ? Number(producto.activo) : 1;
            btnEliminar.style.display = 'flex';
            if (activo === 0) {
                btnEliminar.innerHTML = '<i class="fas fa-check-circle"></i> Reactivar';
                btnEliminar.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
                btnEliminar.onclick = reactivarProducto;
            } else {
                btnEliminar.innerHTML = '<i class="fas fa-ban"></i> Dar de Baja';
                btnEliminar.style.background = 'linear-gradient(135deg, #e67e22, #d35400)';
                btnEliminar.onclick = darDeBajaProducto;
            }
        }
    } else {
        // Create mode
        if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Producto';
        const form = document.getElementById('formularioProducto');
        if (form) {
            form.reset();
            delete form.dataset.idSelected;
        }
        document.getElementById('id_producto').value = '';
        const previewContainer = document.getElementById('preview_imagen_container');
        if (previewContainer) previewContainer.style.display = 'none';
        if (btnAgregar) {
            btnAgregar.style.display = 'flex';
            btnAgregar.onclick = agregarProducto;
        }
        if (btnModificar) btnModificar.style.display = 'none';
        if (btnEliminar) btnEliminar.style.display = 'none';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
window.abrirModalProducto = abrirModalProducto;

function cerrarModalProducto() {
    const modal = document.getElementById('modalProductoForm');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}
window.cerrarModalProducto = cerrarModalProducto;

function cargarFormularioProducto(p) {
    document.getElementById('id_producto').value = p.id_producto ?? p.ID_PRODUCTO ?? p.id ?? '';
    const idInput = document.getElementById('id_producto');
    if (idInput) {
        idInput.setAttribute('readonly', 'true');
        idInput.style.backgroundColor = '#e9ecef';
        idInput.style.cursor = 'not-allowed';
    }
    const form = document.getElementById('formularioProducto');
    if (form && form.dataset.creating) {
        delete form.dataset.creating;
        const btn = document.getElementById('btn_agregar');
        if (btn) btn.textContent = 'Agregar';
        document.getElementById('precio_compra')?.removeAttribute('readonly');
    }
    document.getElementById('nombre_producto').value = p.nombre ?? p.NOMBRE ?? p.NOMBRE_PRODUCTO ?? '';
    document.getElementById('modelo').value = p.modelo ?? p.MODELO ?? '';
    if (document.getElementById('descripcion')) document.getElementById('descripcion').value = p.descripcion ?? p.DESCRIPCION ?? '';

    // Selects
    if (p.nombre_categoria && document.getElementById('categoria')) {
        const raw = p._raw || {};
        const idsStr = raw.categoria_ids ?? raw.CATEGORIA_IDS ?? raw.categoria_id ?? raw.ID_CATEGORIA ?? null;
        let idCat = null;
        if (idsStr && typeof idsStr === 'string') {
            idCat = idsStr.split(',').map(s => s.trim())[0];
        } else if (raw.ID_CATEGORIA) {
            idCat = raw.ID_CATEGORIA;
        }
        if (idCat) document.getElementById('categoria').value = idCat;
    }
    if (p.nombre_marca && document.getElementById('marca')) {
        const idMarca = p._raw && (p._raw.ID_MARCA || p._raw.id_marca) || null;
        if (idMarca) document.getElementById('marca').value = idMarca;
    }
    if (p.nombre_proveedor && document.getElementById('proveedor')) {
        const idProv = p._raw && (p._raw.ID_PROVEEDOR || p._raw.id_proveedor) || null;
        if (idProv) document.getElementById('proveedor').value = idProv;
    }
    if (p.garantia_meses && document.getElementById('garantia')) {
        const idGar = p._raw && (p._raw.ID_GARANTIAS || p._raw.id_garantias || p._raw.ID_GARANTIA_TIPO) || null;
        if (idGar) document.getElementById('garantia').value = idGar;
    }
    if (document.getElementById('precio_venta')) document.getElementById('precio_venta').value = p.precio_venta ?? p.PRECIO_VENTA ?? '';
    if (document.getElementById('precio_compra')) document.getElementById('precio_compra').value = p.precio_compra ?? p.PRECIO_COMPRA ?? '';
    if (document.getElementById('stock_actual')) document.getElementById('stock_actual').value = p.stock ?? p.stock_actual_calculado ?? 0;
    if (document.getElementById('garantia_proveedor_ref')) {
        const valGp = p.garantia_proveedor ?? p.GARANTIA_PROVEEDOR ?? 0;
        document.getElementById('garantia_proveedor_ref').value = valGp ? `${valGp} meses` : 'Sin Garantía';
    }

    // Preview de imagen
    const previewContainer = document.getElementById('preview_imagen_container');
    const previewImagen = document.getElementById('preview_imagen');
    if (p.imagen_url && previewContainer && previewImagen) {
        previewImagen.src = p.imagen_url.startsWith('http') ? p.imagen_url : `${SERVER_URL}/${p.imagen_url}`;
        previewContainer.style.display = 'block';
    } else if (previewContainer) {
        previewContainer.style.display = 'none';
    }
}

// Helper: construir payload para API desde formulario actual
function construirPayloadProducto() {
    return {
        nombre: document.getElementById('nombre_producto').value,
        modelo: document.getElementById('modelo')?.value || '',
        descripcion: document.getElementById('descripcion')?.value || '',
        precio_compra: document.getElementById('precio_compra').value ? parseFloat(document.getElementById('precio_compra').value) : 0,
        precio_venta: document.getElementById('precio_venta').value ? parseFloat(document.getElementById('precio_venta').value) : 0,
        id_marca: (() => { const v = document.getElementById('marca')?.value; return v ? parseInt(v) : null })(),
        id_administrador: null,
        id_garantias: (() => { const v = document.getElementById('garantia')?.value; return v ? parseInt(v) : null })(),
        id_proveedor: (() => { const v = document.getElementById('proveedor')?.value; return v ? parseInt(v) : null })(),
        id_categoria: (() => { const v = document.getElementById('categoria')?.value; return v ? parseInt(v) : null })()
    };
}


function modificarProducto() {
    const form = document.getElementById('formularioProducto');
    const id = form?.dataset.idSelected || document.getElementById('id_producto').value;
    if (!id) return alert('Seleccione un producto de la tabla para modificar');

    const formData = new FormData();
    formData.append('nombre', document.getElementById('nombre_producto').value);
    formData.append('modelo', document.getElementById('modelo')?.value || '');
    formData.append('descripcion', document.getElementById('descripcion')?.value || '');
    formData.append('precio_compra', document.getElementById('precio_compra').value ? parseFloat(document.getElementById('precio_compra').value) : 0);
    formData.append('precio_venta', document.getElementById('precio_venta').value ? parseFloat(document.getElementById('precio_venta').value) : 0);
    formData.append('id_marca', document.getElementById('marca')?.value || '');
    formData.append('id_garantias', document.getElementById('garantia')?.value || '');
    formData.append('id_proveedor', document.getElementById('proveedor')?.value || '');
    formData.append('id_categoria', document.getElementById('categoria')?.value || '');

    const imagenFile = document.getElementById('imagen_producto')?.files[0];
    if (imagenFile) formData.append('imagen', imagenFile);

    fetch(`${API_BASE}/productos/${id}`, {
        method: 'PUT',
        body: formData
    })
        .then(async res => {
            if (!res.ok) {
                const e = await res.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(e.error || e.detail || 'Error al modificar producto');
            }
            return res.json();
        })
        .then(() => {
            cerrarModalProducto();
            alert('Producto modificado exitosamente');
            document.getElementById('formularioProducto')?.reset();
            document.getElementById('preview_imagen_container').style.display = 'none';
            if (typeof cargarProductos === 'function') cargarProductos();
        })
        .catch(err => {
            console.error('Error modificando producto:', err);
            alert('Error al modificar producto: ' + err.message);
        });
}

// 🔴 Da de baja un producto (lo desactiva sin eliminar de la BD)
function darDeBajaProducto() {
    const form = document.getElementById('formularioProducto');
    const id = form?.dataset.idSelected || document.getElementById('id_producto').value;
    if (!id) return alert('Seleccione un producto de la tabla para dar de baja');
    const nombre = document.getElementById('nombre_producto')?.value || `ID ${id}`;
    if (!confirm(`¿Dar de baja el producto "${nombre}"?\n\nEl producto no aparecerá disponible para vender, pero se conserva en el sistema.`)) return;

    fetch(`${API_BASE}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: 0 })
    })
        .then(async res => {
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const errMsg = json && (json.error || json.mensaje) ? (json.error || json.mensaje) : `HTTP ${res.status}`;
                alert('Error al dar de baja: ' + errMsg);
                throw new Error(errMsg);
            }
            return json;
        })
        .then(() => {
            cerrarModalProducto();
            alert(`🚫 Producto "${nombre}" dado de baja exitosamente.\nAparecerá marcado visualmente y no estará disponible para vender.`);
            document.getElementById('formularioProducto')?.reset();
            if (typeof cargarProductos === 'function') cargarProductos();
        })
        .catch(err => {
            console.error('Error dando de baja producto:', err);
        });
}
window.darDeBajaProducto = darDeBajaProducto;

// ✅ Reactiva un producto dado de baja
function reactivarProducto() {
    const form = document.getElementById('formularioProducto');
    const id = form?.dataset.idSelected || document.getElementById('id_producto').value;
    if (!id) return alert('Seleccione un producto para reactivar');
    const nombre = document.getElementById('nombre_producto')?.value || `ID ${id}`;
    if (!confirm(`¿Reactivar el producto "${nombre}"?\n\nVolverá a estar disponible para vender.`)) return;

    fetch(`${API_BASE}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: 1 })
    })
        .then(async res => {
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                alert('Error al reactivar: ' + (json?.error || json?.mensaje || `HTTP ${res.status}`));
                throw new Error(json?.error || 'error');
            }
            return json;
        })
        .then(() => {
            cerrarModalProducto();
            alert(`✅ Producto "${nombre}" reactivado exitosamente.`);
            document.getElementById('formularioProducto')?.reset();
            if (typeof cargarProductos === 'function') cargarProductos();
        })
        .catch(err => console.error('Error reactivando producto:', err));
}
window.reactivarProducto = reactivarProducto;


// 📦 Registra un nuevo ítem en la BD, incluye parseo de FormData para la imagen
function agregarProducto() {
    const form = document.getElementById('formularioProducto');
    const nombre = document.getElementById('nombre_producto').value;
    if (!nombre) return alert("El nombre del producto es obligatorio.");

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('modelo', document.getElementById('modelo')?.value || '');
    formData.append('descripcion', document.getElementById('descripcion')?.value || '');
    formData.append('precio_compra', 0);
    formData.append('precio_venta', document.getElementById('precio_venta').value ? parseFloat(document.getElementById('precio_venta').value) : 0);
    formData.append('id_marca', document.getElementById('marca')?.value || '');
    formData.append('id_garantias', document.getElementById('garantia')?.value || '');
    formData.append('id_proveedor', document.getElementById('proveedor')?.value || '');
    formData.append('id_categoria', document.getElementById('categoria')?.value || '');

    const imagenFile = document.getElementById('imagen_producto')?.files[0];
    if (imagenFile) formData.append('imagen', imagenFile);

    fetch(`${API_BASE}/productos`, {
        method: 'POST',
        body: formData
    })
        .then(async res => {
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const errMsg = json && (json.error || json.mensaje || json.detail) ? (json.error || json.mensaje || json.detail) : `HTTP ${res.status}`;
                alert('Error al crear producto: ' + errMsg);
                throw new Error(errMsg);
            }
            return json;
        })
        .then(resp => {
            cerrarModalProducto();
            alert('Producto agregado exitosamente. ID generado: ' + (resp.id || 'N/A'));
            if (form) form.reset();
            document.getElementById('preview_imagen_container').style.display = 'none';
            if (typeof cargarProductos === 'function') cargarProductos();
        })
        .catch(err => {
            console.error('Error agregando producto:', err);
            alert('Error al agregar producto: ' + err.message);
        });
}

function _recolectarFormulario() {
    return {
        id_usuario: document.getElementById("usuario").value,
        nombre: document.getElementById("nombre").value,
        id_proveedor: document.getElementById("proveedor").value || null,
        descripcion: document.getElementById("descripcion").value,
        marca: document.getElementById("marca").value || null,
        modelo: document.getElementById("modelo").value || null,
        identificador: document.getElementById("identificador").value || null,
        año: document.getElementById("año").value ? parseInt(document.getElementById("año").value) : null,
        id_categoria: document.getElementById("categoria").value || null,
        id_garantias: document.getElementById("garantia")?.value || null,
        precio_compra: document.getElementById("precio_compra").value ? parseFloat(document.getElementById("precio_compra").value) : null,
        precio_venta: document.getElementById("precio_venta").value ? parseFloat(document.getElementById("precio_venta").value) : null,
        stock: document.getElementById("stock").value ? parseInt(document.getElementById("stock").value) : 0
    };
}

// ========================================================================================================
// LÓGICA DE SERIES
// ========================================================================================================

let idProductoSeriesActual = null;

function actualizarPrefijos(id_producto) {
    fetch(`${API_BASE}/series/${id_producto}`, {
        headers: { 'x-user-id': localStorage.getItem('compunic_admin_id') }
    })
    .then(res => res.json())
    .then(todasLasSeries => {
        let prefixes = new Set();
        todasLasSeries.forEach(s => {
            const match = s.NUMERO_SERIE.match(/^([a-zA-Z\-]+)\d+$/);
            if (match) {
                prefixes.add(match[1]);
            }
        });
        const datalist = document.getElementById('lista-prefijos');
        if (datalist) {
            datalist.innerHTML = '';
            prefixes.forEach(p => {
                datalist.innerHTML += `<option value="${p}"></option>`;
            });
        }
    })
    .catch(err => console.error('Error cargando prefijos:', err));
}

function abrirModalSeries(producto) {
    idProductoSeriesActual = producto.id_producto ?? producto.ID_PRODUCTO ?? producto.id;
    const nombre = producto.nombre ?? producto.NOMBRE ?? producto.NOMBRE_PRODUCTO ?? '';
    
    document.getElementById('modalSeriesTitle').innerHTML = `<i class="fas fa-barcode"></i> Series de: ${nombre}`;
    document.getElementById('modalSeries').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    mostrarFormSerie('individual');
    cargarSeriesDisponibles(idProductoSeriesActual);
    actualizarPrefijos(idProductoSeriesActual);
}
window.abrirModalSeries = abrirModalSeries;

function cerrarModalSeries() {
    document.getElementById('modalSeries').style.display = 'none';
    document.body.style.overflow = '';
    idProductoSeriesActual = null;
    if (typeof cargarProductos === 'function') cargarProductos(); // Refresh to update badges
}
window.cerrarModalSeries = cerrarModalSeries;

function mostrarFormSerie(tipo) {
    document.getElementById('formSerieIndividual').style.display = tipo === 'individual' ? 'block' : 'none';
    document.getElementById('formSerieLote').style.display = tipo === 'lote' ? 'block' : 'none';
    document.getElementById('formSerieAuto').style.display = tipo === 'auto' ? 'block' : 'none';
}
window.mostrarFormSerie = mostrarFormSerie;

function cargarSeriesDisponibles(id_producto) {
    const tbody = document.getElementById('tabla_series_disponibles');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Cargando...</td></tr>';
    
    fetch(`${API_BASE}/series/${id_producto}/disponibles`, {
        headers: { 'x-user-id': localStorage.getItem('compunic_admin_id') }
    })
    .then(res => res.json())
    .then(series => {
        tbody.innerHTML = '';
        if (series.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #777;">No hay series en stock para este producto</td></tr>';
            return;
        }
        
        series.forEach(serie => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${serie.NUMERO_SERIE}</strong></td>
                <td><span class="badge" style="background: ${serie.CONDICION === 'Nuevo' ? '#27ae60' : '#e67e22'};">${serie.CONDICION}</span></td>
                <td>
                    <button onclick="eliminarSerie(${serie.ID_SERIE})" style="color: red; background: none; border: none; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err => {
        console.error('Error cargando series:', err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error al cargar series</td></tr>';
    });
}
window.cargarSeriesDisponibles = cargarSeriesDisponibles;

function enviarSeries(seriales) {
    if (!idProductoSeriesActual) return alert('No hay producto seleccionado');
    
    fetch(`${API_BASE}/series`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('compunic_admin_id'),
            'x-user-username': localStorage.getItem('compunic_admin_username')
        },
        body: JSON.stringify({
            id_producto: idProductoSeriesActual,
            seriales: seriales
        })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'Error al registrar series');
        }
        return data;
    })
    .then(data => {
        alert(data.message || 'Series registradas exitosamente');
        // Clear inputs
        document.getElementById('serie_individual').value = '';
        document.getElementById('series_lote').value = '';
        document.getElementById('serie_prefijo').value = '';
        
        cargarSeriesDisponibles(idProductoSeriesActual);
    })
    .catch(err => {
        console.error(err);
        alert(err.message);
    });
}

function guardarSerieIndividual() {
    const serie = document.getElementById('serie_individual').value.trim();
    const condicion = document.getElementById('condicion_individual').value;
    
    if (!serie) return alert('Ingrese un número de serie');
    
    enviarSeries([{ numero_serie: serie, condicion: condicion }]);
}
window.guardarSerieIndividual = guardarSerieIndividual;

function guardarSeriesLote() {
    const texto = document.getElementById('series_lote').value;
    const condicion = document.getElementById('condicion_lote').value;
    
    const arraySeries = texto.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    if (arraySeries.length === 0) return alert('No se encontraron series válidas');
    
    const seriales = arraySeries.map(s => ({ numero_serie: s, condicion: condicion }));
    enviarSeries(seriales);
}
window.guardarSeriesLote = guardarSeriesLote;

function guardarSeriesAuto() {
    const prefijo = document.getElementById('serie_prefijo').value.trim();
    const cantidad = parseInt(document.getElementById('serie_cantidad').value);
    
    if (!prefijo) return alert('Ingrese un prefijo');
    if (!cantidad || cantidad <= 0) return alert('Ingrese una cantidad válida');
    
    fetch(`${API_BASE}/series/${idProductoSeriesActual}`, {
        headers: { 'x-user-id': localStorage.getItem('compunic_admin_id') }
    })
    .then(res => res.json())
    .then(todasLasSeries => {
        let maxSuffix = 0;
        todasLasSeries.forEach(s => {
            if (s.NUMERO_SERIE.startsWith(prefijo)) {
                const suffixStr = s.NUMERO_SERIE.substring(prefijo.length);
                const suffixNum = parseInt(suffixStr, 10);
                if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
                    maxSuffix = suffixNum;
                }
            }
        });

        const seriales = [];
        for (let i = 1; i <= cantidad; i++) {
            seriales.push({ numero_serie: `${prefijo}${String(maxSuffix + i).padStart(3, '0')}`, condicion: 'Nuevo' });
        }
        
        enviarSeries(seriales);
    })
    .catch(err => {
        console.error('Error al auto-generar:', err);
        alert('Error al verificar las series existentes para generar nuevas');
    });
}
window.guardarSeriesAuto = guardarSeriesAuto;

function eliminarSerie(id_serie) {
    if (!confirm('¿Seguro que desea eliminar esta serie del sistema?')) return;
    
    fetch(`${API_BASE}/series/${id_serie}`, {
        method: 'DELETE',
        headers: { 
            'x-user-id': localStorage.getItem('compunic_admin_id'),
            'x-user-username': localStorage.getItem('compunic_admin_username')
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al eliminar serie');
        return res.json();
    })
    .then(() => {
        cargarSeriesDisponibles(idProductoSeriesActual);
    })
    .catch(err => {
        console.error(err);
        alert('Error al eliminar serie');
    });
}
window.eliminarSerie = eliminarSerie;

// ========================================================================================================
// LÓGICA DE REGISTRO DE MERMAS Y PÉRDIDAS (REQ-FR-05)
// ========================================================================================================

window.abrirModalMerma = function(idProductoSeleccionado) {
    const modal = document.getElementById('modalMermaForm');
    const select = document.getElementById('merma_producto_select');
    if (!modal || !select) return;

    // Poblar select con productos disponibles
    select.innerHTML = '<option value="" disabled selected>Seleccione un producto...</option>';
    const productos = window._allProductos || [];
    productos.forEach(p => {
        const id = p.id_producto || p.ID_PRODUCTO;
        const nombre = p.nombre || p.NOMBRE || p.NOMBRE_PRODUCTO;
        const stock = Number(p.stock ?? p.stock_actual_calculado ?? p.STOCK ?? 0);
        select.innerHTML += `<option value="${id}" data-stock="${stock}" data-precio="${p.precio_compra || p.PRECIO_COMPRA || 0}">${nombre} (Stock: ${stock})</option>`;
    });

    if (idProductoSeleccionado) {
        select.value = idProductoSeleccionado;
    }

    document.getElementById('merma_cantidad').value = 1;
    document.getElementById('merma_motivo').value = 'Dañado';
    document.getElementById('merma_justificacion').value = '';
    
    alCambiarProductoMerma();
    modal.style.display = 'flex';
};

window.cerrarModalMerma = function() {
    const modal = document.getElementById('modalMermaForm');
    if (modal) modal.style.display = 'none';
};

window.alCambiarProductoMerma = function() {
    const select = document.getElementById('merma_producto_select');
    const stockInfo = document.getElementById('merma_stock_info');
    const seriesContainer = document.getElementById('merma_series_container');
    const seriesList = document.getElementById('merma_series_list');
    
    if (!select.value) {
        if (stockInfo) stockInfo.style.display = 'none';
        if (seriesContainer) seriesContainer.style.display = 'none';
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const stock = parseInt(selectedOption.getAttribute('data-stock') || '0', 10);
    const precio = parseFloat(selectedOption.getAttribute('data-precio') || '0');

    document.getElementById('merma_stock_disponible').textContent = stock;
    document.getElementById('merma_costo_unitario').textContent = 'C$' + precio.toFixed(2);
    if (stockInfo) stockInfo.style.display = 'block';

    const inputCant = document.getElementById('merma_cantidad');
    inputCant.max = Math.max(stock, 1);
    if (parseInt(inputCant.value) > stock && stock > 0) {
        inputCant.value = stock;
    }

    calcularCostoTotalMerma();

    // Consultar si el producto tiene series activas
    fetch(`${API_BASE}/series/${select.value}`)
        .then(res => res.json())
        .then(series => {
            const seriesEnStock = (series || []).filter(s => s.ESTADO === 'en_stock');
            if (seriesEnStock.length > 0) {
                seriesContainer.style.display = 'block';
                seriesList.innerHTML = seriesEnStock.map(s => `
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; cursor: pointer;">
                        <input type="checkbox" name="merma_serie_cb" value="${s.NUMERO_SERIE}" onchange="actualizarSeriesMermaSeleccionadas()">
                        <span><strong>${s.NUMERO_SERIE}</strong> (${s.CONDICION || 'Nuevo'})</span>
                    </label>
                `).join('');
                actualizarSeriesMermaSeleccionadas();
            } else {
                seriesContainer.style.display = 'none';
                seriesList.innerHTML = '';
            }
        })
        .catch(() => {
            seriesContainer.style.display = 'none';
        });
};

window.calcularCostoTotalMerma = function() {
    const select = document.getElementById('merma_producto_select');
    const cantidad = parseInt(document.getElementById('merma_cantidad').value || '0', 10);
    if (!select.value) {
        document.getElementById('merma_costo_total').textContent = 'C$0.00';
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const precio = parseFloat(selectedOption.getAttribute('data-precio') || '0');
    const total = precio * cantidad;
    document.getElementById('merma_costo_total').textContent = 'C$' + total.toFixed(2);
};

window.actualizarSeriesMermaSeleccionadas = function() {
    const checked = document.querySelectorAll('input[name="merma_serie_cb"]:checked');
    const countEl = document.getElementById('merma_series_count');
    if (countEl) countEl.textContent = checked.length;
    if (checked.length > 0) {
        document.getElementById('merma_cantidad').value = checked.length;
        calcularCostoTotalMerma();
    }
};

window.guardarMerma = async function(event) {
    if (event) event.preventDefault();

    const idProducto = document.getElementById('merma_producto_select').value;
    const cantidad = parseInt(document.getElementById('merma_cantidad').value, 10);
    const motivo = document.getElementById('merma_motivo').value;
    const justificacion = document.getElementById('merma_justificacion').value.trim();

    if (!idProducto) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Seleccione un producto.' });
        } else {
            alert('Seleccione un producto.');
        }
        return;
    }

    if (!cantidad || cantidad <= 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Cantidad Inválida', text: 'La cantidad a descontar debe ser mayor a 0.' });
        } else {
            alert('La cantidad a descontar debe ser mayor a 0.');
        }
        return;
    }

    if (!justificacion) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'La justificación es obligatoria para registrar una merma.' });
        } else {
            alert('La justificación es obligatoria.');
        }
        document.getElementById('merma_justificacion').focus();
        return;
    }

    // Obtener series seleccionadas si aplica
    const seriesChecked = Array.from(document.querySelectorAll('input[name="merma_serie_cb"]:checked')).map(cb => cb.value);

    let idEmpleado = 11;
    let username = 'admin';
    try {
        if (typeof Auth !== 'undefined' && typeof Auth.getEmpleadoId === 'function') {
            idEmpleado = Auth.getEmpleadoId() || 11;
            username = Auth.getUser() || 'admin';
        } else {
            const sess = JSON.parse(sessionStorage.getItem('compunic_session') || '{}');
            idEmpleado = sess.id_empleado || 11;
            username = sess.user || 'admin';
        }
    } catch (e) {
        idEmpleado = 11;
    }

    const payload = {
        id_producto: parseInt(idProducto, 10),
        cantidad,
        motivo,
        justificacion,
        series: seriesChecked,
        id_empleado: idEmpleado
    };

    try {
        const res = await fetch(`${API_BASE}/mermas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': String(idEmpleado),
                'x-user-username': username
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Error al registrar la merma');
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: '¡Merma Registrada!',
                text: 'La pérdida se registró exitosamente y el stock ha sido descontado.',
                timer: 2500,
                showConfirmButton: true,
                confirmButtonColor: '#145D90'
            });
        } else {
            alert('✅ ' + data.message);
        }

        cerrarModalMerma();
        cargarProductos();
    } catch (err) {
        console.error('Error al registrar merma:', err);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar',
                text: err.message,
                confirmButtonColor: '#d33'
            });
        } else {
            alert('❌ ' + err.message);
        }
    }
};
