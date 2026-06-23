
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

                const isBaja = (c.ACTIVO === 0 || c.activo === 0 || c.ACTIVO === '0' || c.activo === '0');
                const displayNombre = isBaja 
                    ? `${c.NOMBRE || ''} <span style="color: #dc3545; font-weight: bold; font-size: 0.82em; margin-left: 5px; background-color: #f8d7da; padding: 2px 6px; border-radius: 4px; border: 1px solid #f5c6cb;">Baja</span>` 
                    : (c.NOMBRE || '');

                if (isBaja) {
                    tr.style.opacity = '0.7';
                    tr.style.backgroundColor = '#fdf2f2';
                    tr.style.color = '#721c24';
                }

                const idReal = c.ID_CLIENTE;
                const btnAltaDisabled = !isBaja ? 'disabled style="background-color: #c3e6cb; color: #155724; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';
                const btnBajaDisabled = isBaja ? 'disabled style="background-color: #f5c6cb; color: #721c24; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';

                const actionButtons = `
                    <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                        <button onclick="activarClienteDesdeTabla(event, ${idReal})" ${btnAltaDisabled}>
                            <i class="fas fa-check"></i> Alta
                        </button>
                        <button onclick="darDeBajaClienteDesdeTabla(event, ${idReal})" ${btnBajaDisabled}>
                            <i class="fas fa-ban"></i> Baja
                        </button>
                    </div>
                `;

                tr.innerHTML = `
                  <td>${idReal}</td>
                  <td>${displayNombre}</td>
                  <td>${c.APELLIDO || ''}</td>
                  <td>${c.TELEFONO || ''}</td>
                  <td>${c.EMAIL || ''}</td>
                  <td>${c.CEDULA || ''}</td>
                  <td>${actionButtons}</td>
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
    document.getElementById('CEDULA').value = c.CEDULA || '';

    const form = document.getElementById('formulario-clientes');
    form.dataset.idCliente = c.ID_CLIENTE;
    console.log("Cliente seleccionado:", c.ID_CLIENTE);
}

function agregarCliente() {
    const nombre = document.getElementById('NOMBRE').value;
    const apellido = document.getElementById('APELLIDO').value;
    const telefono = document.getElementById('TELEFONO').value;
    const email = document.getElementById('EMAIL').value;
    const cedula = document.getElementById('CEDULA').value;

    if (!nombre || !apellido) return alert("Nombre y Apellido son obligatorios");

    fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, telefono, email, cedula })
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
    const cedula = document.getElementById('CEDULA').value;

    fetch(`${API_BASE}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, telefono, email, cedula })
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
                tbody.innerHTML = '<tr><td colspan="6">No se encontraron clientes</td></tr>';
                return;
            }

            clientes.forEach(c => {
                const tr = document.createElement('tr');
                tr.onclick = () => seleccionarCliente(c);
                tr.style.cursor = 'pointer';

                const isBaja = (c.ACTIVO === 0 || c.activo === 0 || c.ACTIVO === '0' || c.activo === '0');
                const displayNombre = isBaja 
                    ? `${c.NOMBRE || ''} <span style="color: #dc3545; font-weight: bold; font-size: 0.82em; margin-left: 5px; background-color: #f8d7da; padding: 2px 6px; border-radius: 4px; border: 1px solid #f5c6cb;">Baja</span>` 
                    : (c.NOMBRE || '');

                if (isBaja) {
                    tr.style.opacity = '0.7';
                    tr.style.backgroundColor = '#fdf2f2';
                    tr.style.color = '#721c24';
                }

                const idReal = c.ID_CLIENTE;
                const btnAltaDisabled = !isBaja ? 'disabled style="background-color: #c3e6cb; color: #155724; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';
                const btnBajaDisabled = isBaja ? 'disabled style="background-color: #f5c6cb; color: #721c24; cursor: not-allowed; opacity: 0.5; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: bold;"' : 'style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;"';

                const actionButtons = `
                    <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                        <button onclick="activarClienteDesdeTabla(event, ${idReal})" ${btnAltaDisabled}>
                            <i class="fas fa-check"></i> Alta
                        </button>
                        <button onclick="darDeBajaClienteDesdeTabla(event, ${idReal})" ${btnBajaDisabled}>
                            <i class="fas fa-ban"></i> Baja
                        </button>
                    </div>
                `;

                tr.innerHTML = `
                  <td>${idReal}</td>
                  <td>${displayNombre}</td>
                  <td>${c.APELLIDO || ''}</td>
                  <td>${c.TELEFONO || ''}</td>
                  <td>${c.EMAIL || ''}</td>
                  <td>${c.CEDULA || ''}</td>
                  <td>${actionButtons}</td>
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

function darDeBajaClienteDesdeTabla(event, id) {
    if (event) event.stopPropagation();
    if (!confirm(`¿Dar de baja al cliente con ID ${id}?`)) return;

    fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al dar de baja al cliente");
            return res.json();
        })
        .then(() => {
            alert('✅ Cliente dado de baja.');
            limpiarFormularioCliente();
            cargarClientes();
        })
        .catch(err => alert(err.message));
}
window.darDeBajaClienteDesdeTabla = darDeBajaClienteDesdeTabla;

function activarClienteDesdeTabla(event, id) {
    if (event) event.stopPropagation();
    if (!confirm(`¿Dar de alta al cliente con ID ${id}?`)) return;

    fetch(`${API_BASE}/clientes/${id}/activar`, { method: 'PUT' })
        .then(async res => {
            if (!res.ok) throw new Error("Error al dar de alta al cliente");
            return res.json();
        })
        .then(() => {
            alert('✅ Cliente dado de alta.');
            limpiarFormularioCliente();
            cargarClientes();
        })
        .catch(err => alert(err.message));
}
window.activarClienteDesdeTabla = activarClienteDesdeTabla;
