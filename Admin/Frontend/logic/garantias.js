
// ========================================================================================================
// LÓGICA DE GARANTÍAS
// ========================================================================================================

function cargarGarantias() {
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const tbody = document.getElementById('tablaGarantias');
            if (!tbody) return;
            tbody.innerHTML = '';

            garantias.forEach(g => {
                const tr = document.createElement('tr');
                tr.onclick = () => seleccionarGarantia(g);
                tr.style.cursor = 'pointer';

                tr.innerHTML = `
                  <td>${g.ID_GARANTIA}</td>
                  <td>${g.FECHA ? new Date(g.FECHA).toLocaleDateString('es-NI') : ''}</td>
                  <td>${g.NOMBRE_TIPO || ''}</td>
                  <td>${g.NOMBRE_ESTADO || ''}</td>
                  <td>${g.DURACION_MESES || 0} meses</td>
                  <td>${g.CONDICION || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando garantías:', err));
}

function cargarTiposGarantia() {
    fetch(`${API_BASE}/garantias/tipos`)
        .then(res => res.json())
        .then(tipos => {
            // Poblar select del formulario
            const select = document.getElementById('ID_GARANTIA_TIPO');
            if (select) {
                // Mantener primera opción
                select.innerHTML = '<option value="">Seleccione Tipo...</option>';
                tipos.forEach(t => {
                    select.innerHTML += `<option value="${t.ID_GARANTIA_TIPO}">${t.TIPO}</option>`;
                });
            }

            // Poblar select de búsqueda
            const selectBuscar = document.getElementById('buscar_tipo');
            if (selectBuscar) {
                selectBuscar.innerHTML = '<option value="">Todos los Tipos</option>';
                tipos.forEach(t => {
                    selectBuscar.innerHTML += `<option value="${t.ID_GARANTIA_TIPO}">${t.TIPO}</option>`;
                });
            }
        })
        .catch(err => console.error('Error cargando tipos de garantía:', err));
}

function cargarEstadosGarantia() {
    fetch(`${API_BASE}/garantias/estados`)
        .then(res => res.json())
        .then(estados => {
            // Poblar select del formulario
            const select = document.getElementById('ID_GARANTIA_ESTADO');
            if (select) {
                select.innerHTML = '<option value="">Seleccione Estado...</option>';
                estados.forEach(e => {
                    select.innerHTML += `<option value="${e.ID_GARANTIA_ESTADO}">${e.ESTADO}</option>`;
                });
            }

            // Poblar select de búsqueda
            const selectBuscar = document.getElementById('buscar_estado');
            if (selectBuscar) {
                selectBuscar.innerHTML = '<option value="">Todos los Estados</option>';
                estados.forEach(e => {
                    selectBuscar.innerHTML += `<option value="${e.ID_GARANTIA_ESTADO}">${e.ESTADO}</option>`;
                });
            }
        })
        .catch(err => console.error('Error cargando estados de garantía:', err));
}

function seleccionarGarantia(g) {
    document.getElementById('ID_GARANTIA').value = g.ID_GARANTIA || '';
    document.getElementById('FECHA').value = g.FECHA ? g.FECHA.split('T')[0] : '';
    document.getElementById('HORA').value = g.HORA || '';
    document.getElementById('DURACION_MESES').value = g.DURACION_MESES || '';
    document.getElementById('CONDICION').value = g.CONDICION || '';
    document.getElementById('EXCLUSIONES').value = g.EXCLUSIONES || '';

    const selectTipo = document.getElementById('ID_GARANTIA_TIPO');
    if (selectTipo) selectTipo.value = g.ID_GARANTIA_TIPO || '';

    const selectEstado = document.getElementById('ID_GARANTIA_ESTADO');
    if (selectEstado) selectEstado.value = g.ID_GARANTIA_ESTADO || '';

    console.log("Garantía seleccionada:", g.ID_GARANTIA);
}

function agregarGarantia() {
    const id_garantia = document.getElementById('ID_GARANTIA').value;
    const fecha = document.getElementById('FECHA').value;
    const hora = document.getElementById('HORA').value;
    const duracion_meses = document.getElementById('DURACION_MESES').value;
    const id_garantia_tipo = document.getElementById('ID_GARANTIA_TIPO').value;
    const id_garantia_estado = document.getElementById('ID_GARANTIA_ESTADO').value;
    const condicion = document.getElementById('CONDICION').value;
    const exclusiones = document.getElementById('EXCLUSIONES').value;

    if (!id_garantia || !fecha || !id_garantia_tipo || !id_garantia_estado) {
        return alert("ID, Fecha, Tipo y Estado son obligatorios");
    }

    fetch(`${API_BASE}/garantias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_garantia, fecha, hora, duracion_meses, id_garantia_tipo, id_garantia_estado, condicion, exclusiones })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) return alert(data.error);
            alert('Garantía agregada correctamente');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error('Error agregando garantía:', err));
}

function modificarGarantia() {
    const id = document.getElementById('ID_GARANTIA').value;
    if (!id) return alert("Selecciona una garantía de la tabla");

    const fecha = document.getElementById('FECHA').value;
    const hora = document.getElementById('HORA').value;
    const duracion_meses = document.getElementById('DURACION_MESES').value;
    const id_garantia_tipo = document.getElementById('ID_GARANTIA_TIPO').value;
    const id_garantia_estado = document.getElementById('ID_GARANTIA_ESTADO').value;
    const condicion = document.getElementById('CONDICION').value;
    const exclusiones = document.getElementById('EXCLUSIONES').value;

    fetch(`${API_BASE}/garantias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, duracion_meses, id_garantia_tipo, id_garantia_estado, condicion, exclusiones })
    })
        .then(res => res.json())
        .then(() => {
            alert('Garantía actualizada correctamente');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error('Error modificando garantía:', err));
}

function eliminarGarantia() {
    const id = document.getElementById('ID_GARANTIA').value;
    if (!id) return alert("Selecciona una garantía de la tabla");

    if (!confirm('¿Estás seguro de eliminar esta garantía?')) return;

    fetch(`${API_BASE}/garantias/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            alert('Garantía eliminada correctamente');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error('Error eliminando garantía:', err));
}

function buscarGarantia() {
    const tipo = document.getElementById('buscar_tipo').value;
    const estado = document.getElementById('buscar_estado').value;
    const duracion = document.getElementById('buscar_duracion').value.trim();

    let url = `${API_BASE}/garantias/buscar?`;
    if (tipo) url += `tipo=${tipo}&`;
    if (estado) url += `estado=${estado}&`;
    if (duracion) url += `duracion=${duracion}&`;

    fetch(url)
        .then(res => res.json())
        .then(garantias => {
            const tbody = document.getElementById('tablaGarantias');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (garantias.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No se encontraron garantías</td></tr>';
                return;
            }

            garantias.forEach(g => {
                const tr = document.createElement('tr');
                tr.onclick = () => seleccionarGarantia(g);
                tr.style.cursor = 'pointer';

                tr.innerHTML = `
                  <td>${g.ID_GARANTIA}</td>
                  <td>${g.FECHA ? new Date(g.FECHA).toLocaleDateString('es-NI') : ''}</td>
                  <td>${g.NOMBRE_TIPO || ''}</td>
                  <td>${g.NOMBRE_ESTADO || ''}</td>
                  <td>${g.DURACION_MESES || 0} meses</td>
                  <td>${g.CONDICION || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando garantías:', err));
}

function limpiarFormularioGarantia() {
    const form = document.getElementById('formulario-garantias');
    if (form) form.reset();
}
