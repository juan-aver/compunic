/*
 * ==========================================
 * MÓDULO: usuarios.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
function cargarClientes() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    fetch(`${API_BASE}/clientes`)
        .then(res => res.json())
        .then(clientes => {
            const tbody = document.getElementById('tablaClientes');
            if (!tbody) return;
            tbody.innerHTML = '';

            clientes.forEach(c => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarCliente(c);

                tr.innerHTML = `
          <td>${c.ID_CLIENTE}</td>
          <td>${c.NOMBRE}</td>
          <td>${c.APELLIDO}</td>
          <td>${c.TELEFONO}</td>
          <td>${c.EMAIL}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando clientes:', err));
}

function buscarCliente() {
    const termino = document.getElementById('buscar_nombre').value.trim();
    if (!termino) {
        cargarClientes();
        return;
    }

    fetch(`${API_BASE}/clientes/buscar?q=${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(clientes => {
            const tbody = document.getElementById('tablaClientes');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (clientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No se encontraron clientes</td></tr>';
                return;
            }

            clientes.forEach(c => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarCliente(c);

                tr.innerHTML = `
          <td>${c.ID_CLIENTE}</td>
          <td>${c.NOMBRE}</td>
          <td>${c.APELLIDO}</td>
          <td>${c.TELEFONO}</td>
          <td>${c.EMAIL}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando clientes:', err));
}

function recolectarDatosCliente() {
    return {
        nombre: document.getElementById('NOMBRE').value,
        apellido: document.getElementById('APELLIDO').value,
        telefono: document.getElementById('TELEFONO').value,
        email: document.getElementById('EMAIL').value
    };
}

function seleccionarCliente(c) {
    document.getElementById('NOMBRE').value = c.NOMBRE;
    document.getElementById('APELLIDO').value = c.APELLIDO;
    document.getElementById('TELEFONO').value = c.TELEFONO;
    document.getElementById('EMAIL').value = c.EMAIL;

    const form = document.getElementById('formulario-clientes');
    form.dataset.idCliente = c.ID_CLIENTE;
    console.log("Cliente seleccionado:", c.ID_CLIENTE);
}

function agregarCliente() {
    const datos = recolectarDatosCliente();
    if (!datos.nombre || !datos.apellido) return alert("Nombre y Apellido son obligatorios");

    fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(() => {
            alert('Cliente agregado');
            limpiarFormularioClientes();
            cargarClientes();
        })
        .catch(err => console.error(err));
}

function modificarCliente() {
    const form = document.getElementById('formulario-clientes');
    const id = form.dataset.idCliente;
    if (!id) return alert("Selecciona un cliente de la tabla");

    fetch(`${API_BASE}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recolectarDatosCliente())
    })
        .then(res => res.json())
        .then(() => {
            alert('Cliente actualizado');
            limpiarFormularioClientes();
            cargarClientes();
        })
        .catch(err => console.error(err));
}

function eliminarCliente() {
    const form = document.getElementById('formulario-clientes');
    const id = form.dataset.idCliente;
    if (!id) return alert("Selecciona un cliente de la tabla");
    if (!confirm("¿Eliminar este cliente?")) return;

    fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            alert('Cliente eliminado');
            limpiarFormularioClientes();
            cargarClientes();
        })
        .catch(err => console.error(err));
}

function limpiarFormularioClientes() {
    const form = document.getElementById('formulario-clientes');
    if (form) {
        form.reset();
        delete form.dataset.idCliente;
    }
}

// ========================================================================================================
// LÓGICA DE VENDEDORES
// ========================================================================================================

function cargarVendedores() {
    fetch(`${API_BASE}/vendedores`)
        .then(res => res.json())
        .then(vendedores => {
            const tbody = document.getElementById('tablaVendedores');
            if (!tbody) return;
            tbody.innerHTML = '';

            vendedores.forEach(v => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarVendedor(v);

                tr.innerHTML = `
          <td>${v.ID_VENDEDOR}</td>
          <td>${v.AREA || ''}</td>
          <td>${v.HORARIO || ''}</td>
          <td>${v.TELEFONO || ''}</td>
          <td>${v.EMAIL || ''}</td>
          <td>${v.ID_EMPLEADO || ''}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando vendedores:', err));
}

function recolectarDatosVendedor() {
    return {
        area: document.getElementById('AREA').value,
        horario: document.getElementById('HORARIO').value,
        telefono: document.getElementById('TELEFONO').value,
        email: document.getElementById('EMAIL').value,
        id_empleado: document.getElementById('ID_EMPLEADO').value
    };
}

function seleccionarVendedor(v) {
    document.getElementById('AREA').value = v.AREA || '';
    document.getElementById('HORARIO').value = v.HORARIO || '';
    document.getElementById('TELEFONO').value = v.TELEFONO || '';
    document.getElementById('EMAIL').value = v.EMAIL || '';
    document.getElementById('ID_EMPLEADO').value = v.ID_EMPLEADO || '';

    const form = document.getElementById('formulario-vendedores');
    form.dataset.idVendedor = v.ID_VENDEDOR;
    console.log("Vendedor seleccionado:", v.ID_VENDEDOR);
}

function agregarVendedor() {
    const datos = recolectarDatosVendedor();
    if (!datos.area || !datos.id_empleado) return alert("Área e ID Empleado son obligatorios");

    fetch(`${API_BASE}/vendedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(() => {
            alert('Vendedor agregado');
            limpiarFormularioVendedores();
            cargarVendedores();
        })
        .catch(err => console.error(err));
}

function buscarVendedor() {
    const termino = document.getElementById('buscar_vendedor').value.trim();
    if (!termino) {
        cargarVendedores();
        return;
    }

    fetch(`${API_BASE}/vendedores/buscar?q=${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(vendedores => {
            const tbody = document.getElementById('tablaVendedores');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (vendedores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No se encontraron vendedores</td></tr>';
                return;
            }

            vendedores.forEach(v => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarVendedor(v);

                tr.innerHTML = `
          <td>${v.ID_VENDEDOR}</td>
          <td>${v.AREA || ''}</td>
          <td>${v.HORARIO || ''}</td>
          <td>${v.TELEFONO || ''}</td>
          <td>${v.EMAIL || ''}</td>
          <td>${v.ID_EMPLEADO || ''}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando vendedores:', err));
}

function modificarVendedor() {
    const form = document.getElementById('formulario-vendedores');
    const id = form.dataset.idVendedor;
    if (!id) return alert("Selecciona un vendedor de la tabla");

    fetch(`${API_BASE}/vendedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recolectarDatosVendedor())
    })
        .then(res => res.json())
        .then(() => {
            alert('Vendedor actualizado');
            limpiarFormularioVendedores();
            cargarVendedores();
        })
        .catch(err => console.error(err));
}

function eliminarVendedor() {
    const form = document.getElementById('formulario-vendedores');
    const id = form.dataset.idVendedor;
    if (!id) return alert("Selecciona un vendedor de la tabla");
    if (!confirm("¿Eliminar este vendedor?")) return;

    fetch(`${API_BASE}/vendedores/${id}`, { method: 'DELETE' })
        .then(async res => {
            if (!res.ok) throw new Error("No se puede eliminar (quizás tiene clientes asignados)");
            return res.json();
        })
        .then(() => {
            alert('Vendedor eliminado');
            limpiarFormularioVendedores();
            cargarVendedores();
        })
        .catch(err => alert(err.message));
}

function limpiarFormularioVendedores() {
    const form = document.getElementById('formulario-vendedores');
    if (form) {
        form.reset();
        delete form.dataset.idVendedor;
    }
}

// ========================================================================================================
// LÓGICA DE EMPLEADOS
// ========================================================================================================

function cargarEmpleados() {
    fetch(`${API_BASE}/empleados`)
        .then(res => res.json())
        .then(empleados => {
            const tbody = document.getElementById('tablaEmpleados');
            if (!tbody) return;
            tbody.innerHTML = '';

            empleados.forEach(e => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarEmpleado(e);

                const fecha = e.F_NACIMIENTO ? new Date(e.F_NACIMIENTO).toISOString().split('T')[0] : '';

                tr.innerHTML = `
          <td>${e.ID}</td>
          <td>${e.NOMBRE}</td>
          <td>${e.APELLIDO}</td>
          <td>${e.SEXO}</td>
          <td>${fecha}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando empleados:', err));
}

function recolectarDatosEmpleado() {
    return {
        nombre: document.getElementById('NOMBRE').value,
        apellido: document.getElementById('APELLIDO').value,
        sexo: document.getElementById('SEXO').value,
        f_nacimiento: document.getElementById('F_NACIMIENTO').value
    };
}

function seleccionarEmpleado(e) {
    document.getElementById('NOMBRE').value = e.NOMBRE;
    document.getElementById('APELLIDO').value = e.APELLIDO;
    document.getElementById('SEXO').value = e.SEXO;

    if (e.F_NACIMIENTO) {
        document.getElementById('F_NACIMIENTO').value = new Date(e.F_NACIMIENTO).toISOString().split('T')[0];
    }

    const form = document.getElementById('formulario-empleados');
    form.dataset.idEmpleado = e.ID;
    console.log("Empleado seleccionado:", e.ID);
}

function buscarEmpleado() {
    const termino = document.getElementById('buscar_empleado').value.trim();
    if (!termino) {
        cargarEmpleados();
        return;
    }

    fetch(`${API_BASE}/empleados/buscar?q=${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(empleados => {
            const tbody = document.getElementById('tablaEmpleados');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (empleados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No se encontraron empleados</td></tr>';
                return;
            }

            empleados.forEach(e => {
                const tr = document.createElement('tr');
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarEmpleado(e);

                const fecha = e.F_NACIMIENTO ? new Date(e.F_NACIMIENTO).toISOString().split('T')[0] : '';

                tr.innerHTML = `
          <td>${e.ID}</td>
          <td>${e.NOMBRE}</td>
          <td>${e.APELLIDO}</td>
          <td>${e.SEXO}</td>
          <td>${fecha}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando empleados:', err));
}

function agregarEmpleado() {
    const datos = recolectarDatosEmpleado();
    if (!datos.nombre || !datos.apellido) return alert("Nombre y Apellido son obligatorios");

    fetch(`${API_BASE}/empleados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(() => {
            alert('Empleado agregado');
            limpiarFormularioEmpleado();
            cargarEmpleados();
        })
        .catch(err => console.error(err));
}

function modificarEmpleado() {
    const form = document.getElementById('formulario-empleados');
    const id = form.dataset.idEmpleado;
    if (!id) return alert("Selecciona un empleado de la tabla");

    fetch(`${API_BASE}/empleados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recolectarDatosEmpleado())
    })
        .then(res => res.json())
        .then(() => {
            alert('Empleado actualizado');
            limpiarFormularioEmpleado();
            cargarEmpleados();
        })
        .catch(err => console.error(err));
}

function eliminarEmpleado() {
    const form = document.getElementById('formulario-empleados');
    const id = form.dataset.idEmpleado;
    if (!id) return alert("Selecciona un empleado de la tabla");
    if (!confirm("¿Eliminar este empleado?")) return;

    fetch(`${API_BASE}/empleados/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            alert('Empleado eliminado');
            limpiarFormularioEmpleado();
            cargarEmpleados();
        })
        .catch(err => console.error(err));
}

function limpiarFormularioEmpleado() {
    const form = document.getElementById('formulario-empleados');
    if (form) {
        form.reset();
        delete form.dataset.idEmpleado;
    }
}

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
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarGarantia(g);

                const fecha = g.FECHA ? new Date(g.FECHA).toISOString().split('T')[0] : '';

                tr.innerHTML = `
          <td>${g.ID_GARANTIA}</td>
          <td>${fecha}</td>
          <td>${g.NOMBRE_TIPO || g.ID_GARANTIA_TIPO}</td>
          <td>${g.NOMBRE_ESTADO || g.ID_GARANTIA_ESTADO}</td>
          <td>${g.DURACION_MESES}</td>
          <td>${g.CONDICION}</td>
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
            const selectForm = document.getElementById('ID_GARANTIA_TIPO');
            const selectBusqueda = document.getElementById('buscar_tipo');

            if (selectForm) {
                selectForm.innerHTML = '<option value="">Seleccione Tipo...</option>';
                tipos.forEach(t => {
                    selectForm.innerHTML += `<option value="${t.ID_GARANTIA_TIPO}">${t.TIPO}</option>`;
                });
            }

            if (selectBusqueda) {
                selectBusqueda.innerHTML = '<option value="">Todos los Tipos</option>';
                tipos.forEach(t => {
                    selectBusqueda.innerHTML += `<option value="${t.ID_GARANTIA_TIPO}">${t.TIPO}</option>`;
                });
            }
        })
        .catch(err => console.error('Error cargando tipos de garantía:', err));
}

function cargarEstadosGarantia() {
    fetch(`${API_BASE}/garantias/estados`)
        .then(res => res.json())
        .then(estados => {
            const selectForm = document.getElementById('ID_GARANTIA_ESTADO');
            const selectBusqueda = document.getElementById('buscar_estado');

            if (selectForm) {
                selectForm.innerHTML = '<option value="">Seleccione Estado...</option>';
                estados.forEach(e => {
                    selectForm.innerHTML += `<option value="${e.ID_GARANTIA_ESTADO}">${e.ESTADO}</option>`;
                });
            }

            if (selectBusqueda) {
                selectBusqueda.innerHTML = '<option value="">Todos los Estados</option>';
                estados.forEach(e => {
                    selectBusqueda.innerHTML += `<option value="${e.ID_GARANTIA_ESTADO}">${e.ESTADO}</option>`;
                });
            }
        })
        .catch(err => console.error('Error cargando estados de garantía:', err));
}

function buscarGarantia() {
    const tipo = document.getElementById('buscar_tipo').value;
    const estado = document.getElementById('buscar_estado').value;
    const duracion = document.getElementById('buscar_duracion').value.trim();

    let query = `${API_BASE}/garantias/buscar?`;
    if (tipo) query += `tipo=${tipo}&`;
    if (estado) query += `estado=${estado}&`;
    if (duracion) query += `duracion=${duracion}&`;

    fetch(query)
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
                tr.style.cursor = "pointer";
                tr.onclick = () => seleccionarGarantia(g);

                const fecha = g.FECHA ? new Date(g.FECHA).toISOString().split('T')[0] : '';

                tr.innerHTML = `
          <td>${g.ID_GARANTIA}</td>
          <td>${fecha}</td>
          <td>${g.NOMBRE_TIPO || g.ID_GARANTIA_TIPO}</td>
          <td>${g.NOMBRE_ESTADO || g.ID_GARANTIA_ESTADO}</td>
          <td>${g.DURACION_MESES}</td>
          <td>${g.CONDICION}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando garantías:', err));
}

function seleccionarGarantia(g) {
    document.getElementById('ID_GARANTIA').value = g.ID_GARANTIA;
    document.getElementById('ID_GARANTIA').disabled = true;
    if (g.FECHA) {
        document.getElementById('FECHA').value = new Date(g.FECHA).toISOString().split('T')[0];
    }
    document.getElementById('HORA').value = g.HORA;
    document.getElementById('DURACION_MESES').value = g.DURACION_MESES;
    document.getElementById('ID_GARANTIA_TIPO').value = g.ID_GARANTIA_TIPO;
    document.getElementById('ID_GARANTIA_ESTADO').value = g.ID_GARANTIA_ESTADO;
    document.getElementById('CONDICION').value = g.CONDICION;
    document.getElementById('EXCLUSIONES').value = g.EXCLUSIONES;

    const form = document.getElementById('formulario-garantias');
    form.dataset.idOriginal = g.ID_GARANTIA;
}

function recolectarDatosGarantia() {
    return {
        id_garantia: document.getElementById('ID_GARANTIA').value,
        fecha: document.getElementById('FECHA').value,
        hora: document.getElementById('HORA').value,
        duracion_meses: document.getElementById('DURACION_MESES').value,
        id_garantia_tipo: document.getElementById('ID_GARANTIA_TIPO').value,
        id_garantia_estado: document.getElementById('ID_GARANTIA_ESTADO').value,
        condicion: document.getElementById('CONDICION').value,
        exclusiones: document.getElementById('EXCLUSIONES').value
    };
}

function agregarGarantia() {
    const datos = recolectarDatosGarantia();
    if (!datos.id_garantia || !datos.fecha) return alert("ID y Fecha son obligatorios");

    fetch(`${API_BASE}/garantias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(() => {
            alert('Garantía agregada');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error(err));
}

function modificarGarantia() {
    const form = document.getElementById('formulario-garantias');
    const id = form.dataset.idOriginal;
    if (!id) return alert("Selecciona una garantía");

    fetch(`${API_BASE}/garantias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recolectarDatosGarantia())
    })
        .then(res => res.json())
        .then(() => {
            alert('Garantía actualizada');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error(err));
}

function eliminarGarantia() {
    const form = document.getElementById('formulario-garantias');
    const id = form.dataset.idOriginal;
    if (!id) return alert("Selecciona una garantía");
    if (!confirm("¿Eliminar esta garantía?")) return;

    fetch(`${API_BASE}/garantias/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            alert('Garantía eliminada');
            limpiarFormularioGarantia();
            cargarGarantias();
        })
        .catch(err => console.error(err));
}

function limpiarFormularioGarantia() {
    const form = document.getElementById('formulario-garantias');
    if (form) {
        form.reset();
        delete form.dataset.idOriginal;
        document.getElementById('ID_GARANTIA').disabled = false;
    }
}

// ========================================================================================================
// LÓGICA DE ADMINISTRADORES
// ========================================================================================================

function inicializarEventos() {
    document.getElementById("btn_agregar")?.addEventListener("click", agregarProducto);
    document.getElementById("btn_modificar")?.addEventListener("click", modificarProducto);
    document.getElementById("btn_eliminar")?.addEventListener("click", eliminarProducto);
    document.getElementById("btn_buscar")?.addEventListener("click", buscarProducto);

    document.getElementById("btn_agregar_venta")?.addEventListener("click", agregarVenta);
    fetch(`${API_BASE}/administradores`)
        .then(res => res.json())
        .then(admins => {
            const tbody = document.getElementById('tablaAdministradores');
            if (!tbody) return;
            tbody.innerHTML = '';

            admins.forEach(a => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => seleccionarAdministrador(a);

                tr.innerHTML = `
          <td>${a.ID_ADMINISTRADOR}</td>
          <td>${a.NOMBRE} ${a.APELLIDO}</td>
          <td>${a.TELEFONO}</td>
          <td>${a.EMAIL}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando administradores:', err));
}

function seleccionarAdministrador(a) {
    document.getElementById('ID_ADMINISTRADOR').value = a.ID_ADMINISTRADOR;
    document.getElementById('ID_EMPLEADO').value = a.ID_EMPLEADO || '';
    document.getElementById('TELEFONO').value = a.TELEFONO || '';
    document.getElementById('EMAIL').value = a.EMAIL || '';
}

function buscarAdministrador() {
    const termino = document.getElementById('buscar_administrador').value.trim();
    if (!termino) {
        cargarAdministradores();
        return;
    }

    fetch(`${API_BASE}/administradores/buscar?q=${encodeURIComponent(termino)}`)
        .then(res => res.json())
        .then(admins => {
            const tbody = document.getElementById('tablaAdministradores');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (admins.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No se encontraron administradores</td></tr>';
                return;
            }

            admins.forEach(a => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => seleccionarAdministrador(a);

                tr.innerHTML = `
          <td>${a.ID_ADMINISTRADOR}</td>
          <td>${a.NOMBRE} ${a.APELLIDO}</td>
          <td>${a.TELEFONO}</td>
          <td>${a.EMAIL}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando administradores:', err));
}

function agregarAdministrador() {
    const id_empleado = document.getElementById('ID_EMPLEADO').value;
    const telefono = document.getElementById('TELEFONO').value;
    const email = document.getElementById('EMAIL').value;

    fetch(`${API_BASE}/administradores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_empleado, telefono, email })
    })
        .then(res => res.json())
        .then(() => {
            alert('Administrador agregado');
            cargarAdministradores();
            limpiarFormularioAdministrador();
        })
        .catch(err => console.error('Error agregando administrador:', err));
}

function modificarAdministrador() {
    const id = document.getElementById('ID_ADMINISTRADOR').value;
    const id_empleado = document.getElementById('ID_EMPLEADO').value;
    const telefono = document.getElementById('TELEFONO').value;
    const email = document.getElementById('EMAIL').value;

    if (!id) return alert('Seleccione un administrador para modificar');

    fetch(`${API_BASE}/administradores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_empleado, telefono, email })
    })
        .then(res => res.json())
        .then(() => {
            alert('Administrador modificado');
            cargarAdministradores();
            limpiarFormularioAdministrador();
        })
        .catch(err => console.error('Error modificando administrador:', err));
}

function eliminarAdministrador() {
    const id = document.getElementById('ID_ADMINISTRADOR').value;
    if (!id) return alert('Seleccione un administrador para eliminar');

    if (!confirm('¿Seguro que desea eliminar este administrador?')) return;

    fetch(`${API_BASE}/administradores/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            alert('Administrador eliminado');
            cargarAdministradores();
            limpiarFormularioAdministrador();
        })
        .catch(err => console.error('Error eliminando administrador:', err));
}

function limpiarFormularioAdministrador() {
    document.getElementById('formulario-administradores')?.reset();
    if (document.getElementById('ID_ADMINISTRADOR')) document.getElementById('ID_ADMINISTRADOR').value = '';
}
