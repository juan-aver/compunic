/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: servicios.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */

// Ocultar/mostrar el formulario de servicios (catálogo lateral)
function toggleFormularioServicios() {
    const modalCatalogo = document.querySelector('.catalogo-section');
    const btn = document.getElementById('btn-toggle-form-servicios');
    if (!modalCatalogo) return;
    const visible = modalCatalogo.style.display !== 'none';
    modalCatalogo.style.display = visible ? 'none' : '';
    if (btn) {
        btn.innerHTML = visible
            ? '<i class="fas fa-eye"></i> Mostrar Catálogo'
            : '<i class="fas fa-eye-slash"></i> Ocultar Formulario';
    }
}
window.toggleFormularioServicios = toggleFormularioServicios;

// Abrir modal de servicio en modo nuevo
function abrirModalServicio(servicio) {
    const modal = document.getElementById('modalServicioForm');
    const title = document.getElementById('modalServicioTitle');
    if (!modal) return;

    const btnGuardar = document.getElementById('btn-guardar-servicio');
    const btnModificar = document.getElementById('btn-modificar-servicio');
    const btnEliminar = document.getElementById('btn-eliminar-servicio');

    if (servicio) {
        // Modo edición
        if (title) title.innerHTML = '<i class="fas fa-edit"></i> Editar Servicio';
        if (btnGuardar) btnGuardar.style.display = 'none';
        if (btnModificar) {
            btnModificar.style.display = 'flex';
            btnModificar.onclick = modificarServicio;
        }
        if (btnEliminar) {
            btnEliminar.style.display = 'flex';
            btnEliminar.onclick = eliminarServicio;
        }
    } else {
        // Modo nuevo
        if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Servicio';
        const form = document.getElementById('formularioServicio');
        if (form) form.reset();
        document.getElementById('id_servicio').value = '';
        if (btnGuardar) {
            btnGuardar.style.display = 'flex';
            btnGuardar.onclick = agregarServicio;
        }
        if (btnModificar) btnModificar.style.display = 'none';
        if (btnEliminar) btnEliminar.style.display = 'none';

        // Poner fecha de solicitud = hoy
        const fechaSolInput = document.getElementById('fecha_solicitud');
        if (fechaSolInput) fechaSolInput.value = new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
window.abrirModalServicio = abrirModalServicio;

function cerrarModalServicio() {
    const modal = document.getElementById('modalServicioForm');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}
window.cerrarModalServicio = cerrarModalServicio;

function cargarServicios() {
    const tabla = document.getElementById("tabla-servicios");
    if (!tabla) return;

    const tbody = tabla.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Cargando historial...</td></tr>';

    fetch(`${API_BASE}/servicios`)
        .then(res => res.json())
        .then(data => {
            const lista = Array.isArray(data) ? data : (data.data || []);
            tbody.innerHTML = "";

            if (lista.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No hay trabajos registrados.</td></tr>';
                return;
            }

            lista.forEach(s => {
                const tr = document.createElement("tr");

                const cliente = s.NOMBRE_CLIENTE
                    ? `${s.NOMBRE_CLIENTE} ${s.APELLIDO_CLIENTE || ''}`
                    : (s.nombre_cliente || `ID: ${s.ID_CLIENTE}`);

                const tipo = s.TIPO_SERVICIO || s.TIPO || s.tipo || 'N/A';
                const estado = s.ESTADO_SERVICIO || s.ESTADO || s.estado || 'N/A';
                let garantia = s.NOMBRE_GARANTIA || 'Sin Garantía';
                if (s.NOMBRE_GARANTIA && s.DURACION_MESES !== undefined) {
                    garantia += ` (${s.DURACION_MESES} meses)`;
                }

                const fechaSolicitud = s.FECHA_SOLICITUD ? new Date(s.FECHA_SOLICITUD).toLocaleDateString() : '-';
                const fechaEjecucion = s.FECHA_EJECUCION ? new Date(s.FECHA_EJECUCION).toLocaleDateString() : '-';

                tr.innerHTML = `
                    <td>${s.ID_SERVICIO || s.id_servicio}</td>
                    <td>${s.DESCRIPCION || s.descripcion || '-'}</td>
                    <td>${cliente}</td>
                    <td>${tipo}</td>
                    <td>${garantia}</td>
                    <td>${fechaSolicitud}</td>
                    <td>${fechaEjecucion}</td>
                    <td>${estado}</td>
                    <td>C$${parseFloat(s.COSTO || 0).toFixed(2)}</td>
                    <td style="text-align:center;">
                        <button onclick="editarServicioPorFila(event, window._allServicios[${lista.indexOf(s)}])"
                            style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            window._allServicios = lista;
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="10" style="color:red; text-align:center;">Error de conexión</td></tr>`;
        });
}

// Cargar servicio en modal para editar
function editarServicioPorFila(e, s) {
    e.stopPropagation();
    abrirModalServicio(s);

    // Poblar campos del formulario
    setTimeout(() => {
        seleccionarServicio(s);
    }, 50);
}
window.editarServicioPorFila = editarServicioPorFila;

function poblarSelectsServicios() {
    // Clientes
    fetch(`${API_BASE}/clientes`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status} al cargar clientes`);
            return res.json();
        })
        .then(clientes => {
            const sel = document.getElementById('id_cliente');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un cliente</option>';

            if (clientes.length === 0) {
                const opt = document.createElement('option');
                opt.disabled = true;
                opt.textContent = 'No hay clientes registrados';
                sel.appendChild(opt);
                return;
            }

            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_cliente ?? c.ID_CLIENTE ?? c.id;
                opt.textContent = `${c.nombre ?? c.NOMBRE ?? c.nombre_cliente ?? ''} ${c.apellido ?? c.APELLIDO ?? ''}`.trim();
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error(err));

    // Garantías
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const sel = document.getElementById('id_garantia');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione una garantía</option>';
            garantias.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.ID_GARANTIA;
                opt.textContent = `${g.NOMBRE_TIPO || 'Garantía'} - ${g.DURACION_MESES} meses`;
                sel.appendChild(opt);
            });
        });

    // Tipos de Servicio
    fetch(`${API_BASE}/servicios/tipos`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status} al cargar tipos`);
            return res.json();
        })
        .then(tipos => {
            const sel = document.getElementById('id_servicio_tipo');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un tipo</option>';

            if (tipos.length === 0) {
                const opt = document.createElement('option');
                opt.disabled = true;
                opt.textContent = 'No hay tipos definidos';
                sel.appendChild(opt);
                return;
            }

            tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id_servicio_tipo ?? t.ID_SERVICIO_TIPO;
                opt.textContent = t.tipo ?? t.TIPO;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error(err));

    // Estados de Servicio
    fetch(`${API_BASE}/servicios/estados`)
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status} al cargar estados`);
            return res.json();
        })
        .then(estados => {
            const sel = document.getElementById('id_servicio_estado');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un estado</option>';

            if (estados.length === 0) {
                const opt = document.createElement('option');
                opt.disabled = true;
                opt.textContent = 'No hay estados definidos';
                sel.appendChild(opt);
                return;
            }

            estados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id_servicio_estado ?? e.ID_SERVICIO_ESTADO;
                opt.textContent = e.estado ?? e.ESTADO;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error(err));
}

function seleccionarServicio(s) {
    const idInput = document.getElementById('id_servicio');
    if (idInput) idInput.value = s.id_servicio ?? s.ID_SERVICIO ?? '';

    const descInput = document.getElementById('descripcion');
    if (descInput) descInput.value = s.descripcion ?? s.DESCRIPCION ?? '';

    const clienteSelect = document.getElementById('id_cliente');
    if (clienteSelect) clienteSelect.value = s.id_cliente ?? s.ID_CLIENTE ?? '';

    const garantiaSelect = document.getElementById('id_garantia');
    if (garantiaSelect) garantiaSelect.value = s.id_garantia ?? s.ID_GARANTIA ?? '';

    const tipoSelect = document.getElementById('id_servicio_tipo');
    if (tipoSelect) tipoSelect.value = s.id_servicio_tipo ?? s.ID_SERVICIO_TIPO ?? '';

    const estadoSelect = document.getElementById('id_servicio_estado');
    if (estadoSelect) estadoSelect.value = s.id_servicio_estado ?? s.ID_SERVICIO_ESTADO ?? '';

    const costoInput = document.getElementById('costo');
    if (costoInput) costoInput.value = s.costo ?? s.COSTO ?? '';

    const temporalInput = document.getElementById('id_temporal');
    if (temporalInput) temporalInput.value = s.id_temporal ?? s.ID_TEMPORAL ?? '';

    const fechaSol = s.fecha_solicitud ?? s.FECHA_SOLICITUD;
    if (fechaSol && document.getElementById('fecha_solicitud')) {
        document.getElementById('fecha_solicitud').value = new Date(fechaSol).toISOString().split('T')[0];
    }
    const fechaEje = s.fecha_ejecucion ?? s.FECHA_EJECUCION;
    if (fechaEje && document.getElementById('fecha_ejecucion')) {
        document.getElementById('fecha_ejecucion').value = new Date(fechaEje).toISOString().split('T')[0];
    }
}

function agregarServicio() {
    const data = {
        descripcion: document.getElementById('descripcion')?.value || '',
        id_cliente: document.getElementById('id_cliente').value,
        id_garantia: document.getElementById('id_garantia').value || null,
        id_servicio_tipo: document.getElementById('id_servicio_tipo').value,
        id_servicio_estado: document.getElementById('id_servicio_estado').value,
        costo: document.getElementById('costo').value,
        id_temporal: document.getElementById('id_temporal').value || null,
        fecha_solicitud: document.getElementById('fecha_solicitud').value,
        fecha_ejecucion: document.getElementById('fecha_ejecucion').value || null
    };

    if (!data.id_cliente || !data.id_servicio_tipo || !data.id_servicio_estado || !data.costo) {
        return alert('Cliente, tipo, estado y costo son obligatorios.');
    }

    fetch(`${API_BASE}/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error('Error al agregar servicio');
            return res.json();
        })
        .then(() => {
            cerrarModalServicio();
            alert('Servicio agregado exitosamente');
            cargarServicios();
        })
        .catch(err => alert(err.message));
}

function modificarServicio() {
    const id = document.getElementById('id_servicio').value;
    if (!id) return;

    const data = {
        descripcion: document.getElementById('descripcion')?.value || '',
        id_cliente: document.getElementById('id_cliente').value,
        id_garantia: document.getElementById('id_garantia').value || null,
        id_servicio_tipo: document.getElementById('id_servicio_tipo').value,
        id_servicio_estado: document.getElementById('id_servicio_estado').value,
        costo: document.getElementById('costo').value,
        id_temporal: document.getElementById('id_temporal').value || null,
        fecha_solicitud: document.getElementById('fecha_solicitud').value,
        fecha_ejecucion: document.getElementById('fecha_ejecucion').value || null
    };

    fetch(`${API_BASE}/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error('Error al modificar servicio');
            return res.json();
        })
        .then(() => {
            cerrarModalServicio();
            alert('Servicio modificado exitosamente');
            cargarServicios();
        })
        .catch(err => alert(err.message));
}

function eliminarServicio() {
    const id = document.getElementById('id_servicio').value;
    if (!id) return;
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;

    fetch(`${API_BASE}/servicios/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Error al eliminar servicio');
            return res.json();
        })
        .then(() => {
            cerrarModalServicio();
            alert('Servicio eliminado exitosamente');
            cargarServicios();
        })
        .catch(err => alert(err.message));
}
