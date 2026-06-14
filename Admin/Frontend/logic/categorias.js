/*
 * ==========================================
 * MÓDULO: categorias.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
function recolectarDatosCategoria() {
    // Ojo aquí, esta parte es crítica para que todo cuadre.

    return {
        nombre_categoria: document.getElementById('NOMBRE_CATEGORIA').value
    };
}

function seleccionarCategoria(categoria) {
    const input = document.getElementById('NOMBRE_CATEGORIA');
    if (input) input.value = categoria.NOMBRE_CATEGORIA;

    const form = document.getElementById('formulario-categorias');
    if (form) form.dataset.idCategoria = categoria.ID_CATEGORIA;

    console.log("Categoría seleccionada ID:", categoria.ID_CATEGORIA);
}

function agregarCategoria() {
    const datos = recolectarDatosCategoria();

    if (!datos.nombre_categoria) {
        return alert("Por favor, escribe un nombre para la categoría.");
    }

    fetch(`${API_BASE}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(() => {
            alert('Categoría agregada exitosamente');
            limpiarFormularioCategoria();
            cargarCategorias();
        })
        .catch(error => console.error('Error al agregar:', error));
}

function modificarCategoria() {
    const form = document.getElementById('formulario-categorias');
    const id = form.dataset.idCategoria;

    if (!id) return alert('Primero haz clic en una categoría de la tabla para seleccionarla.');

    fetch(`${API_BASE}/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recolectarDatosCategoria())
    })
        .then(res => res.json())
        .then(() => {
            alert('Categoría modificada correctamente');
            limpiarFormularioCategoria();
            cargarCategorias();
        })
        .catch(error => console.error('Error al modificar:', error));
}

function eliminarCategoria() {
    const form = document.getElementById('formulario-categorias');
    const id = form.dataset.idCategoria;

    if (!id) return alert('Primero haz clic en una categoría de la tabla para seleccionarla.');
    if (!confirm('¿Seguro que deseas eliminar esta categoría permanentemente?')) return;

    fetch(`${API_BASE}/categorias/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            alert('Categoría eliminada');
            limpiarFormularioCategoria();
            cargarCategorias();
        })
        .catch(error => console.error('Error al eliminar:', error));
}

function cargarCategorias() {
    fetch(`${API_BASE}/categorias`)
        .then(r => r.json())
        .then(arr => {
            const tbody = document.getElementById('tablaCategorias');
            if (!tbody) return;

            tbody.innerHTML = '';

            arr.forEach(c => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${c.ID_CATEGORIA}</td>
                    <td>${c.NOMBRE_CATEGORIA}</td>
                    <td style="text-align: center;">
                        <button onclick="iniciarEdicionCategoria(event, ${c.ID_CATEGORIA}, '${c.NOMBRE_CATEGORIA.replace(/'/g, "\\'")}')"
                            style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 0.82rem; margin-right: 5px;">
                            <i class="fas fa-edit"></i> Modificar
                        </button>
                        <button onclick="eliminarCategoriaPorId(event, ${c.ID_CATEGORIA}, '${c.NOMBRE_CATEGORIA.replace(/'/g, "\\'")}')"
                            style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 0.82rem;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error cargando lista:', error));
}

// Carga el nombre en el formulario para editar y marca el id
function iniciarEdicionCategoria(e, id, nombre) {
    e.stopPropagation();
    const input = document.getElementById('NOMBRE_CATEGORIA');
    if (input) input.value = nombre;
    const form = document.getElementById('formulario-categorias');
    if (form) form.dataset.idCategoria = id;
    // Cambiar el botón de agregar a modificar temporalmente
    const btnAgregar = document.getElementById('btn-agregar-categoria');
    if (btnAgregar) {
        btnAgregar.textContent = 'Guardar Cambios';
        btnAgregar.onclick = function() {
            modificarCategoria();
            btnAgregar.textContent = 'Agregar';
            btnAgregar.onclick = agregarCategoria;
        };
    }
    // Scroll al formulario
    document.getElementById('gestioncategorias')?.scrollIntoView({ behavior: 'smooth' });
}

// Eliminar directamente desde la fila
function eliminarCategoriaPorId(e, id, nombre) {
    e.stopPropagation();
    const form = document.getElementById('formulario-categorias');
    if (form) form.dataset.idCategoria = id;
    if (!confirm(`¿Seguro que deseas eliminar la categoría "${nombre}"?`)) return;
    eliminarCategoria();
}

function limpiarFormularioCategoria() {
    const form = document.getElementById('formulario-categorias');
    if (form) {
        form.reset();
        delete form.dataset.idCategoria;
    }
}

// ========================================================================================================
// SELECTS DE PRODUCTOS (Categorías, Proveedores, Marcas, Garantías)
// ========================================================================================================

function poblarSelectCategorias() {
    fetch(`${API_BASE}/categorias`)
        .then(r => r.json())
        .then(arr => {
            console.log("Categorías recibidas:", arr);
            const sel = document.getElementById('categoria');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])')?.forEach(o => o.remove());
            const seen = new Set();
            arr.forEach(c => {
                const id = c.ID_CATEGORIA ?? c.id_categoria ?? c.id ?? c.ID ?? null;
                const nombre = c.NOMBRE_CATEGORIA ?? c.nombre_categoria ?? c.nombre ?? c.NOMBRE ?? 'Sin Nombre';

                if (!id) {
                    console.warn("Categoría sin ID:", c);
                    return;
                }
                if (seen.has(String(id))) return;
                seen.add(String(id));

                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = nombre;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error poblando select categorías:', err));
}

function poblarSelectProveedores() {
    fetch(`${API_BASE}/proveedores`)
        .then(r => r.json())
        .then(arr => {
            console.log("Proveedores recibidos:", arr);
            const sel = document.getElementById('proveedor');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])')?.forEach(o => o.remove());
            arr.forEach(p => {
                const isBaja = (p.ACTIVO === 0 || p.activo === 0 || p.ACTIVO === '0' || p.activo === '0');
                if (isBaja) return;

                const id = p.ID_PROVEEDOR ?? p.id_proveedor ?? p.id ?? p.ID ?? null;
                const nombre = p.NOMBRE_EMPRESA ?? p.nombre_empresa ?? p.nombre ?? p.NOMBRE ?? 'Sin Nombre';

                if (!id) {
                    console.warn("Proveedor sin ID:", p);
                    return;
                }

                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = nombre;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error poblando select proveedores:', err));
}

function poblarSelectMarcas() {
    fetch(`${API_BASE}/marcas`)
        .then(r => r.json())
        .then(arr => {
            console.log("Marcas recibidas:", arr);
            const sel = document.getElementById('marca');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])')?.forEach(o => o.remove());
            arr.forEach(m => {
                const id = m.ID_MARCA ?? m.id_marca ?? m.id ?? m.ID ?? null;
                const nombre = m.NOMBRE_MARCA ?? m.nombre_marca ?? m.nombre ?? m.NOMBRE ?? 'Sin Nombre';

                if (!id) {
                    console.warn("Marca sin ID:", m);
                    return;
                }

                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = nombre;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error poblando select marcas:', err));
}

function poblarSelectGarantiaTipos() {
    fetch(`${API_BASE}/garantias`)
        .then(r => r.json())
        .then(arr => {
            console.log("Garantías recibidas:", arr);
            const sel = document.getElementById('garantia');
            if (!sel) return;
            sel.querySelectorAll('option:not([disabled])')?.forEach(o => o.remove());
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            defaultOpt.textContent = 'Seleccionar Garantía...';
            sel.appendChild(defaultOpt);

            arr.forEach(t => {
                const id = t.ID_GARANTIA ?? t.id_garantia ?? t.id ?? t.ID ?? null;

                if (!id) {
                    console.warn("Garantía sin ID:", t);
                    return;
                }

                const opt = document.createElement('option');
                opt.value = id;
                const tipo = t.NOMBRE_TIPO ?? t.TIPO ?? t.tipo ?? '';
                const duracion = t.DURACION_MESES ? `${t.DURACION_MESES} meses` : (t.DURACION_MESES ?? t.duracion_meses ? `${t.DURACION_MESES || t.duracion_meses} meses` : '');
                opt.textContent = tipo ? (duracion ? `${tipo} - ${duracion}` : tipo) : (duracion || `Garantía ${opt.value}`);
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error poblando select garantías:', err));
}
