/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: proveedores.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */

function toggleFormularioProveedores() {
    const form = document.getElementById('formularioProveedor');
    const btn = document.getElementById('btn-toggle-form-proveedores');
    if (!form) return;
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : '';
    if (btn) {
        btn.innerHTML = visible
            ? '<i class="fas fa-eye"></i> Mostrar Formulario'
            : '<i class="fas fa-eye-slash"></i> Ocultar Formulario';
    }
}
window.toggleFormularioProveedores = toggleFormularioProveedores;

function asignarEventosProveedores() {
    // Validamos primero, no queremos que nos tumben el server 😅

    const btnAdd = document.getElementById('btn_agregar_proveedor');
    const btnMod = document.getElementById('btn_modificar_proveedor');
    const btnDel = document.getElementById('btn_eliminar_proveedor');
    const btnClean = document.getElementById('btn_limpiar');
    const btnSearch = document.getElementById('btn_buscar_proveedor');

    if (btnAdd) btnAdd.onclick = agregarProveedor;
    if (btnMod) btnMod.onclick = modificarProveedor;
    if (btnDel) btnDel.onclick = eliminarProveedor;
    if (btnClean) btnClean.onclick = limpiarFormulario;
    if (btnSearch) btnSearch.onclick = buscarProveedor;
}

function cargarProveedores() {
    const url = `${API_BASE}/proveedores`;
    const tablaSection = document.getElementById('seccion-tabla');
    const resultadosSection = document.getElementById('resultadosBusquedaSection');

    if (tablaSection) tablaSection.style.display = 'block';
    if (resultadosSection) resultadosSection.style.display = 'none';

    fetch(url)
        .then(res => res.json())
        .then(proveedores => {
            const tbody = document.getElementById('tablaProveedores');
            if (!tbody) return;
            tbody.innerHTML = '';

            proveedores.forEach(p => {
                const tr = document.createElement('tr');
                const rawUrl = p.PAGINA_WEB || p.pagina_web;
                let webContent = '-';

                if (rawUrl) {
                    const hrefUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
                    webContent = `<a href="${hrefUrl}" target="_blank" style="color: #3498db; text-decoration: underline;" onclick="event.stopPropagation()">${rawUrl}</a>`;
                }

                const isBaja = (p.ACTIVO === 0 || p.activo === 0 || p.ACTIVO === '0' || p.activo === '0');
                const nombreEmpresa = p.NOMBRE_EMPRESA || p.nombre_empresa;
                const displayNombre = isBaja 
                    ? `${nombreEmpresa} <span style="color: #dc3545; font-weight: bold; font-size: 0.82em; margin-left: 5px; background-color: #f8d7da; padding: 2px 6px; border-radius: 4px; border: 1px solid #f5c6cb;">Baja</span>` 
                    : nombreEmpresa;

                if (isBaja) {
                    tr.style.opacity = '0.7';
                    tr.style.backgroundColor = '#fdf2f2';
                    tr.style.color = '#721c24';
                }

                const idReal = p.ID_PROVEEDOR || p.id_proveedor;
                const btnAltaDisabled = !isBaja ? 'disabled style="background-color: #c3e6cb; color: #155724; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';
                const btnBajaDisabled = isBaja ? 'disabled style="background-color: #f5c6cb; color: #721c24; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';

                const actionButtons = `
                    <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                        <button onclick="activarProveedorDesdeTabla(event, ${idReal})" ${btnAltaDisabled}>
                            <i class="fas fa-check"></i> Alta
                        </button>
                        <button onclick="darDeBajaDesdeTabla(event, ${idReal})" ${btnBajaDisabled}>
                            <i class="fas fa-ban"></i> Baja
                        </button>
                    </div>
                `;

                tr.innerHTML = `
          <td>${idReal}</td>
          <td>${displayNombre}</td>
          <td>${p.PERSONA_CONTACTO || p.persona_contacto || '-'}</td>
          <td>${p.TELEFONO || p.telefono || '-'}</td>
          <td>${p.EMAIL || p.email || '-'}</td>
          <td>${webContent}</td>
          <td>${p.DIRECCION || p.direccion || '-'}</td>
          <td>${actionButtons}</td>
        `;
                tr.style.cursor = 'pointer';
                tr.onclick = () => cargarFormularioProveedor(p);
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando tabla:', err));
}

function buscarProveedor() {
    const termino = document.getElementById('buscar_nombre').value.trim();
    if (!termino) {
        cargarProveedores();
        return;
    }

    fetch(`${API_BASE}/proveedores/buscar?q=${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(proveedores => {
            const tbody = document.getElementById('tablaProveedores');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (proveedores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">No se encontraron proveedores</td></tr>';
                return;
            }

            proveedores.forEach(p => {
                const tr = document.createElement('tr');
                const rawUrl = p.PAGINA_WEB || p.pagina_web;
                let webContent = '-';

                if (rawUrl) {
                    const hrefUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
                    webContent = `<a href="${hrefUrl}" target="_blank" style="color: #3498db; text-decoration: underline;" onclick="event.stopPropagation()">${rawUrl}</a>`;
                }

                const isBaja = (p.ACTIVO === 0 || p.activo === 0 || p.ACTIVO === '0' || p.activo === '0');
                const nombreEmpresa = p.NOMBRE_EMPRESA || p.nombre_empresa;
                const displayNombre = isBaja 
                    ? `${nombreEmpresa} <span style="color: #dc3545; font-weight: bold; font-size: 0.82em; margin-left: 5px; background-color: #f8d7da; padding: 2px 6px; border-radius: 4px; border: 1px solid #f5c6cb;">Baja</span>` 
                    : nombreEmpresa;

                if (isBaja) {
                    tr.style.opacity = '0.7';
                    tr.style.backgroundColor = '#fdf2f2';
                    tr.style.color = '#721c24';
                }

                const idReal = p.ID_PROVEEDOR || p.id_proveedor;
                const btnAltaDisabled = !isBaja ? 'disabled style="background-color: #c3e6cb; color: #155724; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';
                const btnBajaDisabled = isBaja ? 'disabled style="background-color: #f5c6cb; color: #721c24; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';

                const actionButtons = `
                    <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                        <button onclick="activarProveedorDesdeTabla(event, ${idReal})" ${btnAltaDisabled}>
                            <i class="fas fa-check"></i> Alta
                        </button>
                        <button onclick="darDeBajaDesdeTabla(event, ${idReal})" ${btnBajaDisabled}>
                            <i class="fas fa-ban"></i> Baja
                        </button>
                    </div>
                `;

                tr.innerHTML = `
          <td>${idReal}</td>
          <td>${displayNombre}</td>
          <td>${p.PERSONA_CONTACTO || p.persona_contacto || '-'}</td>
          <td>${p.TELEFONO || p.telefono || '-'}</td>
          <td>${p.EMAIL || p.email || '-'}</td>
          <td>${webContent}</td>
          <td>${p.DIRECCION || p.direccion || '-'}</td>
          <td>${actionButtons}</td>
        `;
                tr.style.cursor = 'pointer';
                tr.onclick = () => cargarFormularioProveedor(p);
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando proveedores:', err));
}

function agregarProveedor() {
    const proveedor = _recolectarFormularioProveedor();
    if (!proveedor.nombre_empresa) return alert("El Nombre de la Empresa es obligatorio.");
    delete proveedor.id_proveedor; // No es necesario enviar el ID ya que se autogenera en la BD

    fetch(`${API_BASE}/proveedores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proveedor)
    })
        .then(async res => {
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al guardar");
            }
            return res.json();
        })
        .then(() => {
            alert('✅ Proveedor agregado.');
            limpiarFormulario();
            cargarProveedores();
        })
        .catch(err => alert(`❌ Error: ${err.message}`));
}

function modificarProveedor() {
    const form = document.getElementById("formularioProveedor");
    const idOriginal = form.dataset.idOriginal;
    if (!idOriginal) return alert("Selecciona un proveedor primero.");

    const proveedor = _recolectarFormularioProveedor();
    fetch(`${API_BASE}/proveedores/${idOriginal}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proveedor)
    })
        .then(async res => {
            if (!res.ok) throw new Error("Error al modificar");
            return res.json();
        })
        .then(() => {
            alert('✅ Modificado correctamente.');
            limpiarFormulario();
            cargarProveedores();
        })
        .catch(err => alert(err.message));
}

function eliminarProveedor() {
    const form = document.getElementById("formularioProveedor");
    const idOriginal = form.dataset.idOriginal;
    if (!idOriginal) return alert("Selecciona un proveedor primero.");
    if (!confirm(`¿Dar de baja al proveedor con ID ${idOriginal}?`)) return;

    fetch(`${API_BASE}/proveedores/${idOriginal}`, { method: 'DELETE' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al dar de baja al proveedor");
            return res.json();
        })
        .then(() => {
            alert('✅ Proveedor dado de baja.');
            limpiarFormulario();
            cargarProveedores();
        })
        .catch(err => alert(err.message));
}

function _recolectarFormularioProveedor() {
    return {
        id_proveedor: document.getElementById("id_proveedor").value,
        nombre_empresa: document.getElementById("nombre_empresa").value,
        persona_contacto: document.getElementById("persona_contacto").value,
        telefono: document.getElementById("telefono_proveedor").value,
        email: document.getElementById("email_proveedor").value,
        pagina_web: document.getElementById("pagina_web").value,
        direccion: document.getElementById("direccion_proveedor").value
    };
}

function cargarFormularioProveedor(p) {
    const form = document.getElementById("formularioProveedor");
    const idReal = p.ID_PROVEEDOR || p.id_proveedor;
    form.dataset.idOriginal = idReal;

    document.getElementById("id_proveedor").value = idReal;
    document.getElementById("nombre_empresa").value = p.NOMBRE_EMPRESA || p.nombre_empresa;
    document.getElementById("persona_contacto").value = p.PERSONA_CONTACTO || p.persona_contacto || '';
    document.getElementById("telefono_proveedor").value = p.TELEFONO || p.telefono || '';
    document.getElementById("email_proveedor").value = p.EMAIL || p.email || '';
    document.getElementById("pagina_web").value = p.PAGINA_WEB || p.pagina_web || '';
    document.getElementById("direccion_proveedor").value = p.DIRECCION || p.direccion || '';

    form.style.backgroundColor = "#e8f0fe";
    setTimeout(() => form.style.backgroundColor = "transparent", 500);
}

function limpiarFormulario() {
    const form = document.getElementById("formularioProveedor");
    if (form) {
        form.reset();
        delete form.dataset.idOriginal;
    }
}

function darDeBajaDesdeTabla(event, id) {
    if (event) event.stopPropagation();
    if (!confirm(`¿Dar de baja al proveedor con ID ${id}?`)) return;

    fetch(`${API_BASE}/proveedores/${id}`, { method: 'DELETE' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al dar de baja al proveedor");
            return res.json();
        })
        .then(() => {
            alert('✅ Proveedor dado de baja.');
            limpiarFormulario();
            cargarProveedores();
        })
        .catch(err => alert(err.message));
}
window.darDeBajaDesdeTabla = darDeBajaDesdeTabla;

function activarProveedorDesdeTabla(event, id) {
    if (event) event.stopPropagation();
    if (!confirm(`¿Dar de alta al proveedor con ID ${id}?`)) return;

    fetch(`${API_BASE}/proveedores/${id}/activar`, { method: 'PUT' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al dar de alta al proveedor");
            return res.json();
        })
        .then(() => {
            alert('✅ Proveedor dado de alta.');
            limpiarFormulario();
            cargarProveedores();
        })
        .catch(err => alert(err.message));
}
window.activarProveedorDesdeTabla = activarProveedorDesdeTabla;
