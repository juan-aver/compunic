/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: empleados_temporales.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
function cargarETemporales() {
    fetch(`${API_BASE}/e_temporales`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("tabla-e-temporales").querySelector("tbody");
            if (!tbody) return;
            tbody.innerHTML = "";

            data.forEach(et => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${et.ID}</td>
                    <td>${et.NOMBRE}</td>
                    <td>${et.APELLIDO}</td>
                    <td>${et.TELEFONO || ''}</td>
                    <td>${et.EMAIL || ''}</td>
                    <td>
                        <button class="btn-sm btn-warning" onclick='seleccionarETemporal(${JSON.stringify(et)})'><i class="fas fa-edit"></i></button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(err => console.error('Error al cargar empleados temporales:', err));
}

function seleccionarETemporal(et) {
    // Si esto falla, probablemente sea la base de datos caída 💀

    document.getElementById('id_e_temporal').value = et.ID;
    document.getElementById('nombre').value = et.NOMBRE;
    document.getElementById('apellido').value = et.APELLIDO;
    document.getElementById('telefono').value = et.TELEFONO || '';
    document.getElementById('direccion').value = et.DIRECCION || '';
    document.getElementById('email').value = et.EMAIL || '';
    if (et.ID_ADMINISTRADOR) document.getElementById('id_administrador').value = et.ID_ADMINISTRADOR;

    document.getElementById('btn-agregar-et').disabled = true;
    document.getElementById('btn-modificar-et').disabled = false;
    document.getElementById('btn-eliminar-et').disabled = false;
}

function agregarETemporal() {
    const payload = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        email: document.getElementById('email').value,
        id_administrador: document.getElementById('id_administrador').value || null
    };

    fetch(`${API_BASE}/e_temporales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert('Empleado temporal agregado');
            limpiarFormularioETemporal();
            cargarETemporales();
        })
        .catch(err => alert('Error: ' + err.message));
}

function modificarETemporal() {
    const id = document.getElementById('id_e_temporal').value;
    if (!id) return;

    const payload = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        email: document.getElementById('email').value,
        id_administrador: document.getElementById('id_administrador').value || null
    };

    fetch(`${API_BASE}/e_temporales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert('Empleado temporal modificado');
            limpiarFormularioETemporal();
            cargarETemporales();
        })
        .catch(err => alert('Error: ' + err.message));
}

function eliminarETemporal() {
    const id = document.getElementById('id_e_temporal').value;
    if (!id) return;
    if (!confirm('¿Eliminar empleado temporal?')) return;

    fetch(`${API_BASE}/e_temporales/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert('Empleado temporal eliminado');
            limpiarFormularioETemporal();
            cargarETemporales();
        })
        .catch(err => alert('Error: ' + err.message));
}

function limpiarFormularioETemporal() {
    document.getElementById('e-temporal-form').reset();
    document.getElementById('id_e_temporal').value = '';
    document.getElementById('btn-agregar-et').disabled = false;
    document.getElementById('btn-modificar-et').disabled = true;
    document.getElementById('btn-eliminar-et').disabled = true;
}

function poblarSelectAdministradores() {
    fetch(`${API_BASE}/administradores`)
        .then(res => res.json())
        .then(data => {
            const sel = document.getElementById('id_administrador');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un administrador</option>';
            data.forEach(admin => {
                const opt = document.createElement('option');
                opt.value = admin.ID_ADMINISTRADOR;
                opt.textContent = `${admin.NOMBRE} (ID: ${admin.ID_ADMINISTRADOR})`;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error al cargar administradores:', err));
}
