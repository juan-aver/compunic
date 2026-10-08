/* ==========================================================================
   MÓDULO: empleados_temporales.js
   PROPÓSITO: Lógica integral para gestión de empleados temporales y credenciales.
   ========================================================================== */

let listaTemporalesGlobal = [];

/**
 * Carga todos los empleados con ROL = 'TEMPORAL' desde el backend
 */
function cargarETemporales() {
    const tbody = document.getElementById('cuerpo-tabla-temporales');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 25px; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Cargando colaboradores temporales...
                </td>
            </tr>
        `;
    }

    fetch(`${API_BASE}/empleados/temporales`)
        .then(res => {
            if (!res.ok) throw new Error('Error al consultar lista de temporales');
            return res.json();
        })
        .then(data => {
            listaTemporalesGlobal = Array.isArray(data) ? data : [];
            actualizarKpisTemporales(listaTemporalesGlobal);
            renderizarTablaTemporales(listaTemporalesGlobal);
        })
        .catch(err => {
            console.error('❌ Error en cargarETemporales:', err);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 25px; color: #ef4444;">
                            <i class="fas fa-exclamation-triangle"></i> Error al cargar datos: ${err.message}
                        </td>
                    </tr>
                `;
            }
        });
}

/**
 * Actualiza las tarjetas superiores de KPI
 */
function actualizarKpisTemporales(temporales) {
    const kpiTotal = document.getElementById('kpi-total-temporales');
    const kpiCred = document.getElementById('kpi-con-credenciales');
    const kpiActivos = document.getElementById('kpi-activos-temporales');

    if (kpiTotal) kpiTotal.textContent = temporales.length;
    if (kpiCred) {
        const conCred = temporales.filter(t => t.USERNAME && t.PASSWORD_HASH).length;
        kpiCred.textContent = conCred;
    }
    if (kpiActivos) {
        const activos = temporales.filter(t => t.ESTADO === 1).length;
        kpiActivos.textContent = activos;
    }
}

/**
 * Renderiza los registros en la tabla
 */
function renderizarTablaTemporales(temporales) {
    const tbody = document.getElementById('cuerpo-tabla-temporales');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!temporales || temporales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    No hay colaboradores temporales registrados.
                </td>
            </tr>
        `;
        return;
    }

    temporales.forEach(t => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

        const isActivo = t.ESTADO === 1;
        const tieneCredencial = Boolean(t.USERNAME && t.PASSWORD_HASH);

        const badgeCredencial = tieneCredencial
            ? `<span style="background: rgba(16, 185, 129, 0.15); color: #059669; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                 <i class="fas fa-check-circle"></i> Activa
               </span>`
            : `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                 <i class="fas fa-clock"></i> Pendiente
               </span>`;

        tr.innerHTML = `
            <td style="padding: 12px 10px; font-weight: 600;">#${t.ID_EMPLEADO}</td>
            <td style="padding: 12px 10px;">
                <div style="font-weight: 600; color: var(--text-color);">${t.NOMBRE} ${t.APELLIDO}</div>
                <small style="color: var(--text-muted);">${t.TELEFONO || 'Sin teléfono'}</small>
            </td>
            <td style="padding: 12px 10px;">
                <code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #ea580c;">
                    ${t.USERNAME || '—'}
                </code>
            </td>
            <td style="padding: 12px 10px; font-size: 0.9rem;">${t.EMAIL || '<span style="color:red;">Sin correo</span>'}</td>
            <td style="padding: 12px 10px; font-size: 0.9rem;">${t.AREA || 'Apoyo General'}</td>
            <td style="padding: 12px 10px;">${badgeCredencial}</td>
            <td style="padding: 12px 10px;">
                <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                    <input type="checkbox" ${isActivo ? 'checked' : ''} onchange="cambiarEstadoTemporal(${t.ID_EMPLEADO}, this.checked)" style="opacity: 0; width: 0; height: 0;">
                    <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActivo ? '#10b981' : '#ccc'}; transition: .4s; border-radius: 24px;"></span>
                </label>
            </td>
            <td style="padding: 12px 10px; text-align: center;">
                <div style="display: inline-flex; gap: 6px;">
                    <button class="btn-sm" title="Editar datos" onclick='seleccionarTemporal(${JSON.stringify(t)})' style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-pen"></i>
                    </button>
                    ${t.EMAIL ? `
                        <button class="btn-sm" title="Reenviar enlace de contraseña / credenciales" onclick="reenviarCredenciales('${t.EMAIL}', '${t.NOMBRE}')" style="background: #e0f2fe; border: 1px solid #bae6fd; color: #0284c7; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Selecciona un empleado temporal y lo carga en el formulario
 */
function seleccionarTemporal(t) {
    document.getElementById('temp_id_empleado').value = t.ID_EMPLEADO;
    document.getElementById('temp_nombre').value = t.NOMBRE || '';
    document.getElementById('temp_apellido').value = t.APELLIDO || '';
    document.getElementById('temp_email').value = t.EMAIL || '';
    document.getElementById('temp_username').value = t.USERNAME || '';
    document.getElementById('temp_telefono').value = t.TELEFONO || '';
    document.getElementById('temp_area').value = t.AREA || '';
    document.getElementById('temp_horario').value = t.HORARIO || '';
    document.getElementById('temp_direccion').value = t.DIRECCION || '';

    const tituloForm = document.getElementById('titulo-form-temporal');
    if (tituloForm) tituloForm.textContent = `Editar Colaborador #${t.ID_EMPLEADO}`;

    const btnGuardar = document.getElementById('btn_guardar_temporal');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Temporal';
    }

    // Scroll al formulario
    const formSec = document.getElementById('seccion-formulario-temporal');
    if (formSec) formSec.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Limpia el formulario
 */
function limpiarFormularioTemporal() {
    const form = document.getElementById('formulario-temporal');
    if (form) form.reset();
    document.getElementById('temp_id_empleado').value = '';

    const tituloForm = document.getElementById('titulo-form-temporal');
    if (tituloForm) tituloForm.textContent = 'Registrar Personal Temporal';

    const btnGuardar = document.getElementById('btn_guardar_temporal');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Temporal';
    }
}

/**
 * Guarda o actualiza un empleado temporal
 */
function guardarTemporal() {
    const id = document.getElementById('temp_id_empleado').value;
    const nombre = document.getElementById('temp_nombre').value.trim();
    const apellido = document.getElementById('temp_apellido').value.trim();
    const email = document.getElementById('temp_email').value.trim();
    const username = document.getElementById('temp_username').value.trim();
    const telefono = document.getElementById('temp_telefono').value.trim();
    const area = document.getElementById('temp_area').value.trim();
    const horario = document.getElementById('temp_horario').value.trim();
    const direccion = document.getElementById('temp_direccion').value.trim();

    if (!nombre || !apellido) {
        Swal.fire({ icon: 'warning', title: 'Faltan Datos', text: 'Nombre y Apellido son obligatorios.' });
        return;
    }

    if (!username) {
        Swal.fire({ icon: 'warning', title: 'Usuario Requerido', text: 'El Nombre de Usuario es obligatorio para habilitar credenciales de acceso.' });
        return;
    }

    if (!email) {
        Swal.fire({ icon: 'warning', title: 'Correo Requerido', text: 'El correo electrónico es necesario para que el temporal active su contraseña.' });
        return;
    }

    const payload = {
        nombre,
        apellido,
        email,
        username,
        telefono,
        area: area || 'Taller Técnico',
        horario: horario || '08:00 - 17:00',
        direccion,
        rol: 'TEMPORAL',
        sexo: 'M'
    };

    const isEdicion = Boolean(id);
    const url = isEdicion ? `${API_BASE}/empleados/${id}` : `${API_BASE}/empleados`;
    const method = isEdicion ? 'PUT' : 'POST';

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) throw new Error('Error al guardar datos del empleado temporal');
            return res.json().catch(() => ({ mensaje: 'Operación realizada correctamente' }));
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: isEdicion ? '¡Actualizado!' : '¡Registrado!',
                text: data.mensaje || 'Personal temporal y credenciales configuradas correctamente.',
                confirmButtonColor: '#ea580c'
            });
            limpiarFormularioTemporal();
            cargarETemporales();
        })
        .catch(err => {
            console.error('Error al guardar temporal:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        });
}

/**
 * Cambia el estado (Activo/Inactivo) del empleado temporal
 */
function cambiarEstadoTemporal(id, activo) {
    fetch(`${API_BASE}/empleados/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: activo ? 1 : 0 })
    })
        .then(res => {
            if (!res.ok) throw new Error('Error al actualizar estado');
            return res.json().catch(() => ({}));
        })
        .then(() => {
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
            toast.fire({
                icon: 'success',
                title: `Colaborador #${id} ${activo ? 'Activado' : 'Desactivado'}`
            });
            cargarETemporales();
        })
        .catch(err => {
            console.error('Error al cambiar estado:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            cargarETemporales();
        });
}

/**
 * Reenvía enlace de credenciales o contraseña por email
 */
function reenviarCredenciales(email, nombre) {
    if (!email) {
        Swal.fire({ icon: 'warning', title: 'Sin Correo', text: 'Este colaborador no tiene correo registrado.' });
        return;
    }

    Swal.fire({
        title: '¿Reenviar enlace de credenciales?',
        text: `Se enviará un correo a ${email} (${nombre}) para que active o actualice su contraseña.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Enviar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ea580c'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
                .then(res => res.json())
                .then(data => {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Enviado!',
                        text: `Se ha enviado el enlace de activación de credenciales a ${email}.`,
                        confirmButtonColor: '#ea580c'
                    });
                })
                .catch(err => {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el correo: ' + err.message });
                });
        }
    });
}

/**
 * Filtro de búsqueda en tiempo real
 */
function filtrarTemporalesEnTiempoReal(termino) {
    const term = (termino || '').toLowerCase().trim();
    if (!term) {
        renderizarTablaTemporales(listaTemporalesGlobal);
        return;
    }

    const filtrados = listaTemporalesGlobal.filter(t => {
        const nom = `${t.NOMBRE || ''} ${t.APELLIDO || ''}`.toLowerCase();
        const usr = (t.USERNAME || '').toLowerCase();
        const mail = (t.EMAIL || '').toLowerCase();
        const tel = (t.TELEFONO || '').toLowerCase();
        const area = (t.AREA || '').toLowerCase();
        return nom.includes(term) || usr.includes(term) || mail.includes(term) || tel.includes(term) || area.includes(term);
    });

    renderizarTablaTemporales(filtrados);
}

/**
 * Inicializa eventos cuando el router carga la vista
 */
function initTemporalesEventos() {
    console.log('✅ Vista de Personal Temporal inicializada');
}

// Exponer en window para acceso desde el DOM
window.cargarETemporales = cargarETemporales;
window.seleccionarTemporal = seleccionarTemporal;
window.limpiarFormularioTemporal = limpiarFormularioTemporal;
window.guardarTemporal = guardarTemporal;
window.cambiarEstadoTemporal = cambiarEstadoTemporal;
window.reenviarCredenciales = reenviarCredenciales;
window.filtrarTemporalesEnTiempoReal = filtrarTemporalesEnTiempoReal;
window.initTemporalesEventos = initTemporalesEventos;
