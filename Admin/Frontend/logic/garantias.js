
// ========================================================================================================
// LÓGICA DE GARANTÍAS
// ========================================================================================================

// Genera un ID único para la garantía (timestamp + random)
function generarIdGarantia() {
    return Date.now() % 1000000 + Math.floor(Math.random() * 100);
}

// Calcula fecha de vencimiento = fecha actual + duración en meses
function calcularFechaVencimiento(duracionMeses) {
    const hoy = new Date();
    hoy.setMonth(hoy.getMonth() + parseInt(duracionMeses || 0));
    return hoy.toISOString().split('T')[0];
}

// Función para ocultar/mostrar el formulario
function toggleFormularioGarantia() {
    const form = document.getElementById('seccion-formulario');
    const btn = document.getElementById('btn-toggle-form-garantia');
    if (!form) return;
    const visible = form.querySelector('form').style.display !== 'none';
    form.querySelector('form').style.display = visible ? 'none' : '';
    if (btn) {
        btn.innerHTML = visible
            ? '<i class="fas fa-eye"></i> Mostrar Formulario'
            : '<i class="fas fa-eye-slash"></i> Ocultar Formulario';
    }
}
window.toggleFormularioGarantia = toggleFormularioGarantia;

function cargarGarantias() {
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const tbody = document.getElementById('tablaGarantias');
            if (!tbody) return;
            tbody.innerHTML = '';

            // Verificar si el usuario es admin
            const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
            const esAdmin = session && session.rol && session.rol.toLowerCase() === 'admin';

            garantias.forEach(g => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';

                const isActivo = g.ACTIVO !== undefined ? Number(g.ACTIVO) !== 0 : true;

                if (!isActivo) {
                    tr.classList.add('garantia-inactiva');
                }

                const fechaRegistro = g.FECHA ? new Date(g.FECHA).toLocaleDateString('es-NI') : '-';
                const duracion = g.DURACION_MESES || 0;

                // Calcular fecha de vencimiento desde FECHA + DURACION_MESES
                let fechaVence = '-';
                if (g.FECHA && duracion) {
                    const base = new Date(g.FECHA);
                    base.setMonth(base.getMonth() + parseInt(duracion));
                    fechaVence = base.toLocaleDateString('es-NI');
                }

                const badgeHtml = isActivo 
                    ? `<span class="badge-status badge-status-activo">Activa</span>` 
                    : `<span class="badge-status badge-status-inactivo">Dada de Baja</span>`;

                // Botones según rol
                const botonesAccion = esAdmin
                    ? `<button class="btn-action-table btn-action-edit" onclick="seleccionarGarantiaEditar(event, ${JSON.stringify(g).replace(/"/g, '&quot;')})" title="Modificar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${isActivo 
                            ? `<button class="btn-action-table btn-action-delete" onclick="toggleEstadoGarantia(event, ${g.ID_GARANTIA}, 0)" title="Dar de baja">
                                 <i class="fas fa-ban"></i>
                               </button>`
                            : `<button class="btn-action-table btn-action-reactivate" onclick="toggleEstadoGarantia(event, ${g.ID_GARANTIA}, 1)" title="Reactivar">
                                 <i class="fas fa-undo"></i>
                               </button>`
                        }`
                    : `<span style="color: #999; font-size: 0.8rem;">Solo admin</span>`;

                tr.innerHTML = `
                  <td>${g.ID_GARANTIA}</td>
                  <td>${fechaRegistro}</td>
                  <td>${fechaVence}</td>
                  <td>${g.NOMBRE_TIPO || ''} ${badgeHtml}</td>
                  <td>${g.NOMBRE_ESTADO || ''}</td>
                  <td>${duracion} meses</td>
                  <td>${g.CONDICION || ''}</td>
                  <td style="text-align:center;">${botonesAccion}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando garantías:', err));
}

// Carga la garantía en el formulario para edición (solo admin)
function seleccionarGarantiaEditar(e, g) {
    e.stopPropagation();
    document.getElementById('ID_GARANTIA').value = g.ID_GARANTIA || '';
    document.getElementById('DURACION_MESES').value = g.DURACION_MESES || '';
    document.getElementById('CONDICION').value = g.CONDICION || '';
    document.getElementById('EXCLUSIONES').value = g.EXCLUSIONES || '';

    const selectTipo = document.getElementById('ID_GARANTIA_TIPO');
    if (selectTipo) selectTipo.value = g.ID_GARANTIA_TIPO || '';
    const selectEstado = document.getElementById('ID_GARANTIA_ESTADO');
    if (selectEstado) selectEstado.value = g.ID_GARANTIA_ESTADO || '';

    // Mostrar formulario si está oculto
    const form = document.getElementById('seccion-formulario');
    if (form) form.querySelector('form').style.display = '';
    const toggleBtn = document.getElementById('btn-toggle-form-garantia');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Formulario';

    // Mostrar botón de modificar
    const btnMod = document.getElementById('btn_modificar_garantia');
    if (btnMod) btnMod.style.display = '';

    document.getElementById('seccion-formulario')?.scrollIntoView({ behavior: 'smooth' });
}
window.seleccionarGarantiaEditar = seleccionarGarantiaEditar;

// Alternar estado de la garantía (dar de baja o reactivar)
function toggleEstadoGarantia(e, id, nuevoEstado) {
    e.stopPropagation();
    const accionStr = nuevoEstado === 0 ? 'dar de baja' : 'reactivar';
    if (!confirm(`¿Seguro que deseas ${accionStr} esta garantía?`)) return;

    fetch(`${API_BASE}/garantias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
    })
        .then(res => res.json())
        .then(() => {
            alert(`Garantía ${nuevoEstado === 0 ? 'dada de baja' : 'reactivada'} correctamente`);
            cargarGarantias();
            if (typeof poblarSelectGarantiaTipos === 'function') poblarSelectGarantiaTipos();
            if (typeof poblarSelectGarantias === 'function') poblarSelectGarantias();
        })
        .catch(error => console.error(`Error al ${accionStr}:`, error));
}
window.toggleEstadoGarantia = toggleEstadoGarantia;

function cargarTiposGarantia() {
    fetch(`${API_BASE}/garantias/tipos`)
        .then(res => res.json())
        .then(tipos => {
            // Poblar select del formulario
            const select = document.getElementById('ID_GARANTIA_TIPO');
            if (select) {
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
            const select = document.getElementById('ID_GARANTIA_ESTADO');
            if (select) {
                select.innerHTML = '<option value="">Seleccione Estado...</option>';
                estados.forEach(e => {
                    select.innerHTML += `<option value="${e.ID_GARANTIA_ESTADO}">${e.ESTADO}</option>`;
                });
            }
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

// Función seleccionarGarantia legacy (usada por selects de otros módulos)
function seleccionarGarantia(g) {
    if (document.getElementById('ID_GARANTIA'))
        document.getElementById('ID_GARANTIA').value = g.ID_GARANTIA || '';
    if (document.getElementById('DURACION_MESES'))
        document.getElementById('DURACION_MESES').value = g.DURACION_MESES || '';
    if (document.getElementById('CONDICION'))
        document.getElementById('CONDICION').value = g.CONDICION || '';
    if (document.getElementById('EXCLUSIONES'))
        document.getElementById('EXCLUSIONES').value = g.EXCLUSIONES || '';
    const selectTipo = document.getElementById('ID_GARANTIA_TIPO');
    if (selectTipo) selectTipo.value = g.ID_GARANTIA_TIPO || '';
    const selectEstado = document.getElementById('ID_GARANTIA_ESTADO');
    if (selectEstado) selectEstado.value = g.ID_GARANTIA_ESTADO || '';
    console.log("Garantía seleccionada:", g.ID_GARANTIA);
}

function agregarGarantia() {
    const duracion_meses = document.getElementById('DURACION_MESES').value;
    const id_garantia_tipo = document.getElementById('ID_GARANTIA_TIPO').value;
    const id_garantia_estado = document.getElementById('ID_GARANTIA_ESTADO').value;
    const condicion = document.getElementById('CONDICION').value;
    const exclusiones = document.getElementById('EXCLUSIONES').value;

    if (!duracion_meses || !id_garantia_tipo || !id_garantia_estado) {
        return alert("Duración, Tipo y Estado son obligatorios");
    }

    // Generar ID y fecha automáticamente
    const id_garantia = generarIdGarantia();
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

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

    const duracion_meses = document.getElementById('DURACION_MESES').value;
    const id_garantia_tipo = document.getElementById('ID_GARANTIA_TIPO').value;
    const id_garantia_estado = document.getElementById('ID_GARANTIA_ESTADO').value;
    const condicion = document.getElementById('CONDICION').value;
    const exclusiones = document.getElementById('EXCLUSIONES').value;

    // Calcular fecha desde hoy con la nueva duración
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

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
    fetch(`${API_BASE}/garantias/${id}`, { method: 'DELETE' })
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
                tbody.innerHTML = '<tr><td colspan="8">No se encontraron garantías</td></tr>';
                return;
            }
            const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
            const esAdmin = session && session.rol && session.rol.toLowerCase() === 'admin';

            garantias.forEach(g => {
                const tr = document.createElement('tr');
                const fechaRegistro = g.FECHA ? new Date(g.FECHA).toLocaleDateString('es-NI') : '-';
                const duracionG = g.DURACION_MESES || 0;
                let fechaVence = '-';
                if (g.FECHA && duracionG) {
                    const base = new Date(g.FECHA);
                    base.setMonth(base.getMonth() + parseInt(duracionG));
                    fechaVence = base.toLocaleDateString('es-NI');
                }
                const botonesAccion = esAdmin
                    ? `<button onclick="seleccionarGarantiaEditar(event, ${JSON.stringify(g).replace(/"/g, '&quot;')})"
                            style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; margin-right: 4px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarGarantiaPorId(event, ${g.ID_GARANTIA})"
                            style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i>
                        </button>`
                    : `<span style="color: #999; font-size: 0.8rem;">Solo admin</span>`;
                tr.innerHTML = `
                  <td>${g.ID_GARANTIA}</td>
                  <td>${fechaRegistro}</td>
                  <td>${fechaVence}</td>
                  <td>${g.NOMBRE_TIPO || ''}</td>
                  <td>${g.NOMBRE_ESTADO || ''}</td>
                  <td>${duracionG} meses</td>
                  <td>${g.CONDICION || ''}</td>
                  <td style="text-align:center;">${botonesAccion}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando garantías:', err));
}

function limpiarFormularioGarantia() {
    const form = document.getElementById('formulario-garantias');
    if (form) form.reset();
    // Ocultar botón modificar
    const btnMod = document.getElementById('btn_modificar_garantia');
    if (btnMod) btnMod.style.display = 'none';
}

// Inicializar visibilidad del botón Modificar según rol
function initGarantiasRol() {
    const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
    const esAdmin = session && session.rol && session.rol.toLowerCase() === 'admin';
    const btnMod = document.getElementById('btn_modificar_garantia');
    if (btnMod) btnMod.style.display = 'none'; // siempre oculto al inicio, se muestra al editar
    // La columna de acciones se oculta si no es admin
    const thAcciones = document.getElementById('th-acciones-garantia');
    if (thAcciones && !esAdmin) thAcciones.style.display = 'none';
}
