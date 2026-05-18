
// ========================================================================================================
// LÓGICA DE CLIENTES
// ========================================================================================================

function cargarClientes() {
    fetch(`${API_BASE}/clientes`)
        .then(res => res.json())
        .then(clientes => {
            const tbody = document.getElementById('tablaClientes');
            if (!tbody) return;
            tbody.innerHTML = '';

            clientes.forEach(c => {
                const tr = document.createElement('tr');
                tr.onclick = () => seleccionarCliente(c);
                tr.style.cursor = 'pointer';

                tr.innerHTML = `
                  <td>${c.ID_CLIENTE}</td>
                  <td>${c.NOMBRE || ''}</td>
                  <td>${c.APELLIDO || ''}</td>
                  <td>${c.TELEFONO || ''}</td>
                  <td>${c.EMAIL || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error cargando clientes:', err));
}

function seleccionarCliente(c) {
    document.getElementById('NOMBRE').value = c.NOMBRE || '';
    document.getElementById('APELLIDO').value = c.APELLIDO || '';
    document.getElementById('TELEFONO').value = c.TELEFONO || '';
    document.getElementById('EMAIL').value = c.EMAIL || '';

    const form = document.getElementById('formulario-clientes');
    form.dataset.idCliente = c.ID_CLIENTE;
    console.log("Cliente seleccionado:", c.ID_CLIENTE);
}

function agregarCliente() {
    const nombre = document.getElementById('NOMBRE').value;
    const apellido = document.getElementById('APELLIDO').value;
    const telefono = document.getElementById('TELEFONO').value;
    const email = document.getElementById('EMAIL').value;

    if (!nombre || !apellido) return alert("Nombre y Apellido son obligatorios");

    fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, telefono, email })
    })
        .then(res => res.json())
        .then(data => {
            alert('Cliente agregado correctamente');
            limpiarFormularioCliente();
            cargarClientes();
        })
        .catch(err => console.error('Error agregando cliente:', err));
}

function modificarCliente() {
    const form = document.getElementById('formulario-clientes');
    const id = form.dataset.idCliente;
    if (!id) return alert("Selecciona un cliente de la tabla");

    const nombre = document.getElementById('NOMBRE').value;
    const apellido = document.getElementById('APELLIDO').value;
    const telefono = document.getElementById('TELEFONO').value;
    const email = document.getElementById('EMAIL').value;

    fetch(`${API_BASE}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, telefono, email })
    })
        .then(res => res.json())
        .then(() => {
            alert('Cliente actualizado correctamente');
            limpiarFormularioCliente();
            cargarClientes();
        })
        .catch(err => console.error('Error modificando cliente:', err));
}

function eliminarCliente() {
    const form = document.getElementById('formulario-clientes');
    const id = form.dataset.idCliente;
    if (!id) return alert("Selecciona un cliente de la tabla");

    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    fetch(`${API_BASE}/clientes/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            alert('Cliente eliminado correctamente');
            limpiarFormularioCliente();
            cargarClientes();
        })
        .catch(err => console.error('Error eliminando cliente:', err));
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
                tr.onclick = () => seleccionarCliente(c);
                tr.style.cursor = 'pointer';

                tr.innerHTML = `
                  <td>${c.ID_CLIENTE}</td>
                  <td>${c.NOMBRE || ''}</td>
                  <td>${c.APELLIDO || ''}</td>
                  <td>${c.TELEFONO || ''}</td>
                  <td>${c.EMAIL || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error buscando clientes:', err));
}

function limpiarFormularioCliente() {
    const form = document.getElementById('formulario-clientes');
    if (form) {
        form.reset();
        delete form.dataset.idCliente;
    }
}
