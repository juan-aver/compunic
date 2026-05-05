/*
 * ==========================================
 * MÓDULO: devoluciones.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
 */
function cargarDevoluciones() {
    // Empieza la magia ✨

    fetch(`${API_BASE}/devoluciones`)
        .then(res => res.json())
        .then(devoluciones => {
            const tbody = document.getElementById('devolutions-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (devoluciones.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center italic text-gray">No hay devoluciones registradas.</td></tr>`;
                return;
            }

            devoluciones.forEach(dev => {
                const fila = document.createElement('tr');
                const fechaFormateada = new Date(dev.FECHA_DEVOLUCION).toLocaleDateString();

                let badgeClass = 'badge ';
                if (dev.ACCION === 'reingreso') badgeClass += 'badge-reingreso';
                else if (dev.ACCION === 'garantia') badgeClass += 'badge-garantia';
                else if (dev.ACCION === 'desecho') badgeClass += 'badge-desecho';

                fila.innerHTML = `
                    <td class="text-left">#${dev.ID_DEVOLUCION}</td>
                    <td class="text-left">${dev.FACTURA}</td>
                    <td class="text-left">${dev.NOMBRE_PRODUCTO}</td>
                    <td class="text-center">${dev.CANTIDAD}</td>
                    <td class="text-left">${dev.MOTIVO || 'N/A'}</td>
                    <td class="text-center"><span class="${badgeClass}">${dev.ACCION}</span></td>
                    <td class="text-left">${fechaFormateada}</td>
                    <td class="text-center">
                        <button type="button" class="btn-danger" onclick="eliminarDevolucion(${dev.ID_DEVOLUCION})" title="Eliminar">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        })
        .catch(err => {
            console.error('Error al cargar devoluciones:', err);
            const tbody = document.getElementById('devolutions-table-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Error al cargar devoluciones</td></tr>`;
        });
}

function poblarSelectVentas() {
    fetch(`${API_BASE}/ventas`)
        .then(res => res.json())
        .then(ventas => {
            const select = document.getElementById('venta-select');
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Seleccione una Venta</option>';

            ventas.forEach(venta => {
                const option = document.createElement('option');
                option.value = venta.ID_VENTA;
                option.textContent = `${venta.FACTURA} - ${venta.NOMBRE_CLIENTE} (${new Date(venta.FECHA).toLocaleDateString()})`;
                select.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar ventas:', err));
}

function cargarProductosDeVenta(idVenta) {
    const productoSelect = document.getElementById('producto-devolucion-select');
    const cantidadInput = document.getElementById('cantidad-devolucion');
    const infoText = document.getElementById('cantidad-disponible-info');

    if (!productoSelect) return;

    if (!idVenta) {
        productoSelect.innerHTML = '<option value="" disabled selected>Seleccione una venta primero</option>';
        productoSelect.disabled = true;
        if (infoText) infoText.textContent = '';
        return;
    }

    fetch(`${API_BASE}/devoluciones/venta/${idVenta}/productos`)
        .then(res => res.json())
        .then(productos => {
            productoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Producto</option>';

            if (productos.length === 0) {
                productoSelect.innerHTML = '<option value="" disabled selected>No hay productos disponibles para devolver</option>';
                productoSelect.disabled = true;
                return;
            }

            productoSelect.disabled = false;

            productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.ID_PRODUCTO;
                option.textContent = `${prod.NOMBRE_PRODUCTO} (Disponible: ${prod.CANTIDAD_DISPONIBLE})`;
                option.dataset.cantidadDisponible = prod.CANTIDAD_DISPONIBLE;
                productoSelect.appendChild(option);
            });

            productoSelect.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];
                const cantidadDisponible = selectedOption.dataset.cantidadDisponible;

                if (cantidadDisponible && infoText) {
                    infoText.textContent = `Cantidad disponible para devolución: ${cantidadDisponible}`;
                }

                if (cantidadInput) {
                    cantidadInput.max = cantidadDisponible;
                    cantidadInput.value = Math.min(1, parseInt(cantidadDisponible));
                }
            });
        })
        .catch(err => {
            console.error('Error al cargar productos de venta:', err);
            productoSelect.innerHTML = '<option value="" disabled selected>Error al cargar productos</option>';
            productoSelect.disabled = true;
        });
}

function agregarDevolucion(event) {
    event.preventDefault();

    const idVenta = document.getElementById('venta-select').value;
    const idProducto = document.getElementById('producto-devolucion-select').value;
    const cantidad = parseInt(document.getElementById('cantidad-devolucion').value);
    const motivo = document.getElementById('motivo-devolucion').value;
    const accion = document.getElementById('accion-select').value;

    if (!idVenta || !idProducto) {
        return alert('Debe seleccionar una venta y un producto');
    }

    if (!cantidad || cantidad <= 0) {
        return alert('La cantidad debe ser mayor a 0');
    }

    if (!accion) {
        return alert('Debe seleccionar una acción');
    }

    const devolucion = {
        id_venta: parseInt(idVenta),
        id_producto: parseInt(idProducto),
        cantidad: cantidad,
        motivo: motivo,
        accion: accion
    };

    fetch(`${API_BASE}/devoluciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devolucion)
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al registrar devolución');
            return data;
        })
        .then(data => {
            alert(`Devolución registrada exitosamente. ID: ${data.id_devolucion}`);
            limpiarFormularioDevolucion();
            cargarDevoluciones();
        })
        .catch(err => {
            console.error('Error al registrar devolución:', err);
            alert(`Error: ${err.message}`);
        });
}

function eliminarDevolucion(id) {
    if (!confirm('¿Está seguro de eliminar esta devolución?')) return;

    fetch(`${API_BASE}/devoluciones/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            alert('Devolución eliminada exitosamente');
            cargarDevoluciones();
        })
        .catch(err => {
            console.error('Error al eliminar devolución:', err);
            alert('Error al eliminar devolución');
        });
}

function limpiarFormularioDevolucion() {
    const form = document.getElementById('devolution-form');
    if (form) {
        form.reset();
        const productoSelect = document.getElementById('producto-devolucion-select');
        if (productoSelect) {
            productoSelect.innerHTML = '<option value="" disabled selected>Seleccione una venta primero</option>';
            productoSelect.disabled = true;
        }
        const infoText = document.getElementById('cantidad-disponible-info');
        if (infoText) infoText.textContent = '';
    }
}
