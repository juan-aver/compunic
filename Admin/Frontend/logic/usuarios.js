
// ========================================================================================================
// LÓGICA DE EMPLEADOS (UNIFICADA) — Con acordeones y envío de correo de bienvenida
// ========================================================================================================

// Inicializar eventos del módulo de empleados (llamado por el router al cargar la vista)
function initEmpleadosEventos() {
    const rolSelect = document.getElementById('ROL');
    if(rolSelect) {
        rolSelect.addEventListener('change', mostrarCamposPorRol);
    }
}

// ============================================
// FUNCIONES DE ACORDEÓN
// ============================================

function toggleAcordeon(contenidoId, headerEl) {
    const contenido = document.getElementById(contenidoId);
    const flecha = headerEl.querySelector('.acordeon-flecha');
    
    if (contenido.classList.contains('acordeon-abierto')) {
        contenido.classList.remove('acordeon-abierto');
        if (flecha) flecha.classList.add('cerrado');
    } else {
        contenido.classList.add('acordeon-abierto');
        if (flecha) flecha.classList.remove('cerrado');
    }
}

function abrirAcordeon(seccionId, contenidoId) {
    const seccion = document.getElementById(seccionId);
    const contenido = document.getElementById(contenidoId);
    if (seccion) {
        seccion.style.display = 'block';
        if (contenido) {
            contenido.classList.add('acordeon-abierto');
            const flecha = seccion.querySelector('.acordeon-flecha');
            if (flecha) flecha.classList.remove('cerrado');
        }
    }
}

function cerrarAcordeon(seccionId) {
    const seccion = document.getElementById(seccionId);
    if (seccion) seccion.style.display = 'none';
}

// ============================================
// MOSTRAR/OCULTAR CAMPOS SEGÚN ROL
// ============================================

function mostrarCamposPorRol() {
    const rol = document.getElementById('ROL').value;

    // Ocultar todos los acordeones primero
    cerrarAcordeon('acordeon-generales');
    cerrarAcordeon('acordeon-acceso');
    cerrarAcordeon('acordeon-vendedor');
    cerrarAcordeon('acordeon-temporal');

    if (!rol) return; // Si no hay rol, todo queda oculto

    // Siempre mostrar datos generales
    abrirAcordeon('acordeon-generales', 'contenido-generales');

    if (rol === 'ADMIN') {
        abrirAcordeon('acordeon-acceso', 'contenido-acceso');
    } else if (rol === 'VENDEDOR') {
        abrirAcordeon('acordeon-acceso', 'contenido-acceso');
        abrirAcordeon('acordeon-vendedor', 'contenido-vendedor');
    } else if (rol === 'TEMPORAL') {
        abrirAcordeon('acordeon-temporal', 'contenido-temporal');
    }
}

// ============================================
// RENDERIZAR FILA DE TABLA (Reutilizable)
// ============================================

function renderFilaEmpleado(e) {
    const tr = document.createElement('tr');
    
    // Clicking row selects employee (except when clicking the toggle)
    tr.onclick = (event) => {
        if(event.target.tagName !== 'INPUT' && !event.target.classList.contains('slider') && !event.target.classList.contains('estado-texto')) {
            seleccionarEmpleado(e);
        }
    };
    tr.style.cursor = "pointer";

    const isChecked = e.ESTADO === 1 ? 'checked' : '';
    const estadoTexto = e.ESTADO === 1 ? 'Activo' : 'Inactivo';
    const estadoClase = e.ESTADO === 1 ? 'activo' : 'inactivo';
    
    // Determinar la clase del badge según el rol
    let badgeClase = 'temporal';
    if (e.ROL === 'ADMIN') badgeClase = 'admin';
    else if (e.ROL === 'VENDEDOR') badgeClase = 'vendedor';

    // Sexo legible
    let sexoTexto = '';
    if (e.SEXO === 'M') sexoTexto = 'Masculino';
    else if (e.SEXO === 'F') sexoTexto = 'Femenino';

    tr.innerHTML = `
      <td>${e.ID_EMPLEADO}</td>
      <td>${e.NOMBRE} ${e.APELLIDO}</td>
      <td><span class="badge-rol ${badgeClase}">${e.ROL}</span></td>
      <td>${e.EMAIL || ''}</td>
      <td>${e.TELEFONO || ''}</td>
      <td>${sexoTexto}</td>
      <td>${e.DIRECCION || '—'}</td>
      <td onclick="event.stopPropagation();">
        <div class="estado-toggle-container">
          <label class="switch">
            <input type="checkbox" onchange="cambiarEstadoEmpleado(${e.ID_EMPLEADO}, this.checked)" ${isChecked}>
            <span class="slider round"></span>
          </label>
          <span class="estado-texto ${estadoClase}">${estadoTexto}</span>
        </div>
      </td>
    `;
    return tr;
}

// ============================================
// CARGAR EMPLEADOS
// ============================================

function cargarEmpleados() {
    fetch(`${API_BASE}/empleados`)
        .then(res => res.json())
        .then(empleados => {
            const tbody = document.getElementById('tablaEmpleados');
            if (!tbody) return;
            tbody.innerHTML = '';

            empleados.forEach(e => {
                tbody.appendChild(renderFilaEmpleado(e));
            });
        })
        .catch(err => console.error('Error cargando empleados:', err));
}

// ============================================
// CAMBIAR ESTADO (Toggle)
// ============================================

function cambiarEstadoEmpleado(id, isActivo) {
    const nuevoEstado = isActivo ? 1 : 0;
    fetch(`${API_BASE}/empleados/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => {
        if(!res.ok) throw new Error("Error al cambiar estado");
        console.log(`Estado de empleado ${id} actualizado a ${nuevoEstado}`);
        // Actualizar solo el texto del toggle sin recargar todo
        cargarEmpleados();
    })
    .catch(err => {
        console.error(err);
        alert("Hubo un error al actualizar el estado del empleado.");
        cargarEmpleados(); // Reload to reset toggle visual state
    });
}

// ============================================
// RECOLECTAR DATOS DEL FORMULARIO (Sin password)
// ============================================

function recolectarDatosEmpleado() {
    return {
        rol: document.getElementById('ROL').value,
        nombre: document.getElementById('NOMBRE').value,
        apellido: document.getElementById('APELLIDO').value,
        sexo: document.getElementById('SEXO').value,
        f_nacimiento: document.getElementById('F_NACIMIENTO').value,
        telefono: document.getElementById('TELEFONO').value,
        email: document.getElementById('EMAIL').value,
        username: document.getElementById('USERNAME') ? document.getElementById('USERNAME').value : null,
        area: document.getElementById('AREA') ? document.getElementById('AREA').value : null,
        horario: document.getElementById('HORARIO') ? document.getElementById('HORARIO').value : null,
        direccion: document.getElementById('DIRECCION') ? document.getElementById('DIRECCION').value : null
    };
}

// ============================================
// SELECCIONAR EMPLEADO DE LA TABLA
// ============================================

function seleccionarEmpleado(e) {
    // Set Role first and trigger UI update
    document.getElementById('ROL').value = e.ROL;
    mostrarCamposPorRol();

    // Populate common fields
    document.getElementById('NOMBRE').value = e.NOMBRE || '';
    document.getElementById('APELLIDO').value = e.APELLIDO || '';
    document.getElementById('TELEFONO').value = e.TELEFONO || '';
    document.getElementById('EMAIL').value = e.EMAIL || '';
    document.getElementById('SEXO').value = e.SEXO || '';
    
    if (e.F_NACIMIENTO) {
        document.getElementById('F_NACIMIENTO').value = new Date(e.F_NACIMIENTO).toISOString().split('T')[0];
    } else {
        document.getElementById('F_NACIMIENTO').value = '';
    }

    // Populate specific fields
    if(document.getElementById('USERNAME')) document.getElementById('USERNAME').value = e.USERNAME || '';
    if(document.getElementById('AREA')) document.getElementById('AREA').value = e.AREA || '';
    if(document.getElementById('HORARIO')) document.getElementById('HORARIO').value = e.HORARIO || '';
    if(document.getElementById('DIRECCION')) document.getElementById('DIRECCION').value = e.DIRECCION || '';

    const form = document.getElementById('formulario-empleados');
    form.dataset.idEmpleado = e.ID_EMPLEADO;
    console.log("Empleado seleccionado:", e.ID_EMPLEADO);
}

// ============================================
// BUSCAR EMPLEADO
// ============================================

function buscarEmpleado() {
    const termino = document.getElementById('buscar_empleado').value.trim();
    if (!termino) {
        cargarEmpleados();
        return;
    }

    fetch(`${API_BASE}/empleados/buscar/${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(empleados => {
            const tbody = document.getElementById('tablaEmpleados');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (empleados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">No se encontraron empleados</td></tr>';
                return;
            }

            empleados.forEach(e => {
                tbody.appendChild(renderFilaEmpleado(e));
            });
        })
        .catch(err => console.error('Error buscando empleados:', err));
}

// ============================================
// AGREGAR EMPLEADO (con correo de bienvenida)
// ============================================

function agregarEmpleado() {
    const datos = recolectarDatosEmpleado();
    if (!datos.rol) return alert("Debe seleccionar un Rol");
    if (!datos.nombre || !datos.apellido) return alert("Nombre y Apellido son obligatorios");

    // Validar email obligatorio para ADMIN/VENDEDOR
    if ((datos.rol === 'ADMIN' || datos.rol === 'VENDEDOR') && !datos.email) {
        return alert("El Email es obligatorio para Administradores y Vendedores (se enviará el correo de activación).");
    }

    // Validar username obligatorio para ADMIN/VENDEDOR
    if ((datos.rol === 'ADMIN' || datos.rol === 'VENDEDOR') && !datos.username) {
        return alert("El Nombre de Usuario es obligatorio para Administradores y Vendedores.");
    }

    fetch(`${API_BASE}/empleados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(data => {
            if (data.correoEnviado) {
                alert(`✅ ${data.mensaje}`);
            } else if (datos.rol === 'TEMPORAL') {
                alert('✅ Empleado temporal agregado correctamente.');
            } else {
                alert(`⚠️ ${data.mensaje}`);
            }
            limpiarFormularioEmpleado();
            cargarEmpleados();
        })
        .catch(err => {
            console.error(err);
            alert('Error al agregar empleado.');
        });
}

// ============================================
// MODIFICAR EMPLEADO
// ============================================

function modificarEmpleado() {
    const form = document.getElementById('formulario-empleados');
    const id = form.dataset.idEmpleado;
    if (!id) return alert("Selecciona un empleado de la tabla");

    const datos = recolectarDatosEmpleado();

    fetch(`${API_BASE}/empleados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.text())
        .then(() => {
            alert('Empleado actualizado');
            limpiarFormularioEmpleado();
            cargarEmpleados();
        })
        .catch(err => console.error(err));
}

// ============================================
// LIMPIAR FORMULARIO
// ============================================

function limpiarFormularioEmpleado() {
    const form = document.getElementById('formulario-empleados');
    if (form) {
        form.reset();
        delete form.dataset.idEmpleado;
        mostrarCamposPorRol(); // Reset visibility (hides all accordions)
    }
}
