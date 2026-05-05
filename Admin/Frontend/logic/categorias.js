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
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarCategoria(c);

                tr.innerHTML = `
                    <td>${c.ID_CATEGORIA}</td>
                    <td>${c.NOMBRE_CATEGORIA}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error cargando lista:', error));
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
