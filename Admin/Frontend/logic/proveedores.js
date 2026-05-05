/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: proveedores.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
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

                tr.innerHTML = `
          <td>${p.ID_PROVEEDOR || p.id_proveedor}</td>
          <td>${p.NOMBRE_EMPRESA || p.nombre_empresa}</td>
          <td>${p.PERSONA_CONTACTO || p.persona_contacto || '-'}</td>
          <td>${p.TELEFONO || p.telefono || '-'}</td>
          <td>${p.EMAIL || p.email || '-'}</td>
          <td>${webContent}</td>
          <td>${p.DIRECCION || p.direccion || '-'}</td>
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
                tbody.innerHTML = '<tr><td colspan="7">No se encontraron proveedores</td></tr>';
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

                tr.innerHTML = `
          <td>${p.ID_PROVEEDOR || p.id_proveedor}</td>
          <td>${p.NOMBRE_EMPRESA || p.nombre_empresa}</td>
          <td>${p.PERSONA_CONTACTO || p.persona_contacto || '-'}</td>
          <td>${p.TELEFONO || p.telefono || '-'}</td>
          <td>${p.EMAIL || p.email || '-'}</td>
          <td>${webContent}</td>
          <td>${p.DIRECCION || p.direccion || '-'}</td>
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
    if (!proveedor.id_proveedor || !proveedor.nombre_empresa) return alert("El ID y Nombre son obligatorios.");

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
    if (!confirm(`¿Eliminar ID ${idOriginal}?`)) return;

    fetch(`${API_BASE}/proveedores/${idOriginal}`, { method: 'DELETE' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al eliminar");
            return res.json();
        })
        .then(() => {
            alert('✅ Eliminado correctamente.');
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
