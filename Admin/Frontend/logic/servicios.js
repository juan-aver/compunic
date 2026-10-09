/*
 * Módulo: servicios.js
 * Descripción: Lógica para gestionar los servicios técnicos de taller y soporte.
 * Incluye: Asignación de técnicos, Evidencia fotográfica, Calificación por estrellas y Reseñas.
 */

// Función auxiliar para normalizar URLs de imágenes (locales o remotas)
function getFullImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    const backendOrigin = typeof API_BASE !== 'undefined' ? API_BASE.replace(/\/api\/?$/, '') : 'http://localhost:3001';
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Abrir modal de servicio en modo nuevo o edición
function abrirModalServicio(servicio) {
    const modal = document.getElementById('modalServicioForm');
    const title = document.getElementById('modalServicioTitle');
    if (!modal) return;

    const btnGuardar = document.getElementById('btn-guardar-servicio');
    const btnModificar = document.getElementById('btn-modificar-servicio');
    const btnEliminar = document.getElementById('btn-eliminar-servicio');

    if (servicio) {
        // Modo edición
        if (title) title.innerHTML = '<i class="fas fa-edit"></i> Editar Servicio Técnico';
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
        if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Servicio Técnico';
        const form = document.getElementById('formularioServicio');
        if (form) form.reset();
        
        document.getElementById('id_servicio').value = '';
        quitarEvidenciaPreview();
        setStarRating(0);

        if (btnGuardar) {
            btnGuardar.style.display = 'flex';
            btnGuardar.onclick = agregarServicio;
        }
        if (btnModificar) btnModificar.style.display = 'none';
        if (btnEliminar) btnEliminar.style.display = 'none';

        // Fecha de solicitud por defecto = hoy
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

// Manejo de Vista Previa de Evidencia en Formulario
function setupEvidenciaInput() {
    const fileInput = document.getElementById('evidencia_file');
    if (!fileInput) return;

    fileInput.onchange = function () {
        const file = this.files && this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewBox = document.getElementById('evidencia-preview-box');
                const previewImg = document.getElementById('evidencia-img-preview');
                if (previewImg && previewBox) {
                    previewImg.src = e.target.result;
                    previewBox.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    };
}
window.setupEvidenciaInput = setupEvidenciaInput;

function quitarEvidenciaPreview() {
    const fileInput = document.getElementById('evidencia_file');
    const urlInput = document.getElementById('evidencia_url');
    const previewBox = document.getElementById('evidencia-preview-box');
    const previewImg = document.getElementById('evidencia-img-preview');

    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewBox) previewBox.style.display = 'none';
}
window.quitarEvidenciaPreview = quitarEvidenciaPreview;

// Visor Lightbox para Evidencia Fotográfica
function abrirVisorEvidencia(url, descripcion) {
    const modal = document.getElementById('modalVisorEvidencia');
    const img = document.getElementById('visorEvidenciaImg');
    const desc = document.getElementById('visorEvidenciaDesc');
    const linkDownload = document.getElementById('visorEvidenciaDownload');

    if (!modal || !img) return;

    const fullUrl = getFullImageUrl(url);
    img.src = fullUrl;
    if (desc) desc.textContent = descripcion || 'Evidencia fotográfica del trabajo realizado';
    if (linkDownload) linkDownload.href = fullUrl;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
window.abrirVisorEvidencia = abrirVisorEvidencia;

function cerrarVisorEvidencia() {
    const modal = document.getElementById('modalVisorEvidencia');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}
window.cerrarVisorEvidencia = cerrarVisorEvidencia;

// Control interactivo de Estrellas en Formulario
const ratingLabels = {
    0: 'Sin calificar',
    1: '⭐ 1 estrella - Muy Insatisfecho',
    2: '⭐⭐ 2 estrellas - Insatisfecho',
    3: '⭐⭐⭐ 3 estrellas - Aceptable',
    4: '⭐⭐⭐⭐ 4 estrellas - Bueno',
    5: '⭐⭐⭐⭐⭐ 5 estrellas - Excelente'
};

function setStarRating(val) {
    const stars = document.querySelectorAll('#star-rating-form .star-item');
    const input = document.getElementById('calificacion');
    const text = document.getElementById('star-rating-text');

    val = parseInt(val) || 0;
    if (input) input.value = val > 0 ? val : '';
    if (text) text.textContent = ratingLabels[val] || 'Sin calificar';

    stars.forEach(star => {
        const sVal = parseInt(star.getAttribute('data-val'));
        if (sVal <= val) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}
window.setStarRating = setStarRating;

// Control de Calificación Rápida (Modal Emergente)
function abrirModalCalificar(idServicio, currentRating, currentOpinion, infoServicio) {
    const modal = document.getElementById('modalCalificarServicio');
    if (!modal) return;

    document.getElementById('quick_id_servicio').value = idServicio;
    document.getElementById('quick_opinion_cliente').value = currentOpinion || '';
    document.getElementById('quick_servicio_info').textContent = infoServicio || `Servicio #${idServicio}`;

    setQuickStarRating(currentRating || 0);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
window.abrirModalCalificar = abrirModalCalificar;

function cerrarModalCalificar() {
    const modal = document.getElementById('modalCalificarServicio');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}
window.cerrarModalCalificar = cerrarModalCalificar;

function setQuickStarRating(val) {
    const stars = document.querySelectorAll('#star-rating-quick .quick-star');
    const input = document.getElementById('quick_calificacion');
    const text = document.getElementById('quick_rating_text');

    val = parseInt(val) || 0;
    if (input) input.value = val > 0 ? val : '';
    if (text) text.textContent = val > 0 ? ratingLabels[val] : 'Seleccione estrellas';

    stars.forEach(star => {
        const sVal = parseInt(star.getAttribute('data-val'));
        if (sVal <= val) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}
window.setQuickStarRating = setQuickStarRating;

function guardarCalificacionRapida() {
    const idServicio = document.getElementById('quick_id_servicio').value;
    const calificacion = document.getElementById('quick_calificacion').value;
    const opinion = document.getElementById('quick_opinion_cliente').value;

    if (!calificacion || parseInt(calificacion) < 1) {
        Alerta.advertencia('Por favor seleccione al menos 1 estrella para registrar la calificación.');
        return;
    }

    fetch(`${API_BASE}/servicios/${idServicio}/calificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            calificacion: parseInt(calificacion),
            opinion_cliente: opinion
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al registrar calificación');
        return res.json();
    })
    .then(data => {
        cerrarModalCalificar();
        Alerta.exito('La opinión del cliente ha sido guardada satisfactoriamente.', '¡Calificación Registrada!');
        cargarServicios();
    })
    .catch(err => {
        console.error(err);
        Alerta.error(err.message, 'Error');
    });
}
window.guardarCalificacionRapida = guardarCalificacionRapida;

// Cargar y Listar Servicios en Tablas
function cargarServicios() {
    const tablaActivos = document.getElementById("tabla-servicios-activos");
    const tablaHistorial = document.getElementById("tabla-servicios-historial");
    if (!tablaActivos || !tablaHistorial) return;

    const tbodyActivos = tablaActivos.querySelector("tbody");
    const tbodyHistorial = tablaHistorial.querySelector("tbody");
    if (!tbodyActivos || !tbodyHistorial) return;

    tbodyActivos.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Cargando servicios activos...</td></tr>';
    tbodyHistorial.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</td></tr>';

    fetch(`${API_BASE}/servicios/estados`)
        .then(res => res.json())
        .then(estadosDB => {
            window._estadosServicios = estadosDB;
            return fetch(`${API_BASE}/servicios`);
        })
        .then(res => res.json())
        .then(data => {
            const lista = Array.isArray(data) ? data : (data.data || []);
            tbodyActivos.innerHTML = "";
            tbodyHistorial.innerHTML = "";

            if (lista.length === 0) {
                tbodyActivos.innerHTML = '<tr><td colspan="10" style="text-align:center; color: #64748b;">No hay servicios activos registrados.</td></tr>';
                tbodyHistorial.innerHTML = '<tr><td colspan="10" style="text-align:center; color: #64748b;">No hay trabajos en el historial.</td></tr>';
                return;
            }

            let countActivos = 0;
            let countHistorial = 0;

            lista.forEach((s, idx) => {
                const cliente = s.NOMBRE_CLIENTE
                    ? `${s.NOMBRE_CLIENTE} ${s.APELLIDO_CLIENTE || ''}`.trim()
                    : (s.nombre_cliente || `ID: ${s.ID_CLIENTE}`);

                const tecnico = s.NOMBRE_TECNICO
                    ? `<span class="badge-tecnico"><i class="fas fa-user-cog"></i> ${s.NOMBRE_TECNICO}</span>`
                    : '<span style="color: #94a3b8; font-size: 0.82rem; font-style: italic;">Sin asignar</span>';

                const tipo = s.TIPO_SERVICIO || s.TIPO || s.tipo || 'N/A';
                const estado = s.ESTADO_SERVICIO || s.ESTADO || s.estado || 'N/A';
                
                let garantia = s.NOMBRE_GARANTIA || 'Sin Garantía';
                if (s.NOMBRE_GARANTIA && s.DURACION_MESES !== undefined) {
                    garantia += ` (${s.DURACION_MESES}m)`;
                }

                const fechaSolicitud = s.FECHA_SOLICITUD ? new Date(s.FECHA_SOLICITUD).toLocaleDateString() : '-';
                const fechaEjecucion = s.FECHA_EJECUCION ? new Date(s.FECHA_EJECUCION).toLocaleDateString() : '-';

                // Evidencia Fotográfica
                let evidenciaHTML = '';
                if (s.EVIDENCIA_URL) {
                    const fullImg = getFullImageUrl(s.EVIDENCIA_URL);
                    const descClean = (s.DESCRIPCION || '').replace(/"/g, '&quot;');
                    evidenciaHTML = `
                        <img src="${fullImg}" class="evidencia-thumb" title="Ver foto de evidencia" alt="Evidencia"
                             onclick="abrirVisorEvidencia('${s.EVIDENCIA_URL}', '${descClean}')">
                    `;
                } else {
                    evidenciaHTML = '<span class="evidencia-empty"><i class="fas fa-camera-slash"></i> Sin foto</span>';
                }

                // Calificación por Estrellas
                let calificacionHTML = '';
                const descForModal = `${s.DESCRIPCION ? s.DESCRIPCION.substring(0, 40) : 'Servicio'} - Cliente: ${cliente}`.replace(/'/g, "\\'");
                const opinionClean = (s.OPINION_CLIENTE || '').replace(/'/g, "\\'");
                
                if (s.CALIFICACION && s.CALIFICACION > 0) {
                    const starsStr = '★'.repeat(s.CALIFICACION) + '☆'.repeat(5 - s.CALIFICACION);
                    calificacionHTML = `
                        <span class="rating-badge" title="${s.OPINION_CLIENTE ? 'Opinión: ' + s.OPINION_CLIENTE : 'Calificación: ' + s.CALIFICACION + '/5'}"
                              onclick="abrirModalCalificar(${s.ID_SERVICIO}, ${s.CALIFICACION}, '${opinionClean}', '${descForModal}')">
                            <span style="color: #f59e0b;">${starsStr}</span>
                            <span style="font-size: 0.78rem;">(${s.CALIFICACION}/5)</span>
                        </span>
                    `;
                } else {
                    calificacionHTML = `
                        <span class="rating-badge-none" title="Registrar calificación del cliente"
                              onclick="abrirModalCalificar(${s.ID_SERVICIO}, 0, '', '${descForModal}')">
                            <i class="far fa-star"></i> Calificar
                        </span>
                    `;
                }

                const tr = document.createElement("tr");

                // Clasificar en Activos o Historial
                const estadoLower = estado.toLowerCase();
                const esHistorial = estadoLower.includes('completado') || estadoLower.includes('entregado') || estadoLower.includes('cancelado');

                if (esHistorial) {
                    // TABLA HISTORIAL
                    tr.innerHTML = `
                        <td><strong>#${s.ID_SERVICIO || s.id_servicio}</strong></td>
                        <td title="${s.NOTAS_TECNICAS ? 'Notas: ' + s.NOTAS_TECNICAS : ''}">${s.DESCRIPCION || s.descripcion || '-'}</td>
                        <td>${cliente}</td>
                        <td>${tecnico}</td>
                        <td style="text-align:center;">${evidenciaHTML}</td>
                        <td style="text-align:center;">${calificacionHTML}</td>
                        <td>${fechaEjecucion}</td>
                        <td><span class="badge ${estadoLower.includes('cancelado') ? 'badge-danger' : 'badge-success'}">${estado}</span></td>
                        <td><strong>C$${parseFloat(s.COSTO || 0).toFixed(2)}</strong></td>
                        <td style="text-align:center; white-space: nowrap;">
                            <button onclick="editarServicioPorFila(event, window._allServicios[${idx}])"
                                style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; margin-right: 4px;">
                                <i class="fas fa-edit"></i> Ver / Editar
                            </button>
                        </td>
                    `;
                    tbodyHistorial.appendChild(tr);
                    countHistorial++;
                } else {
                    // TABLA ACTIVOS (En Progreso / Pendientes)
                    let optionsHTML = '';
                    if (window._estadosServicios) {
                        window._estadosServicios.forEach(e => {
                            const selected = (e.ID_SERVICIO_ESTADO === s.ID_SERVICIO_ESTADO) ? 'selected' : '';
                            optionsHTML += `<option value="${e.ID_SERVICIO_ESTADO}" ${selected}>${e.ESTADO}</option>`;
                        });
                    }

                    tr.innerHTML = `
                        <td><strong>#${s.ID_SERVICIO || s.id_servicio}</strong></td>
                        <td title="${s.NOTAS_TECNICAS ? 'Notas: ' + s.NOTAS_TECNICAS : ''}">${s.DESCRIPCION || s.descripcion || '-'}</td>
                        <td>${cliente}</td>
                        <td>${tecnico}</td>
                        <td>${tipo}</td>
                        <td>${garantia}</td>
                        <td>${fechaSolicitud}</td>
                        <td><strong>C$${parseFloat(s.COSTO || 0).toFixed(2)}</strong></td>
                        <td>
                            <select onchange="cambiarEstadoServicioInline(${s.ID_SERVICIO || s.id_servicio}, this.value)"
                                style="padding: 5px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #ffffff; color: #334155; font-weight: 500; cursor: pointer; outline: none;">
                                ${optionsHTML}
                            </select>
                        </td>
                        <td style="text-align:center; white-space: nowrap;">
                            <button onclick="editarServicioPorFila(event, window._allServicios[${idx}])"
                                style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.82rem;">
                                <i class="fas fa-tools"></i> Atender
                            </button>
                        </td>
                    `;
                    tbodyActivos.appendChild(tr);
                    countActivos++;
                }
            });

            if (countActivos === 0) tbodyActivos.innerHTML = '<tr><td colspan="10" style="text-align:center; color: #64748b;">No hay servicios activos.</td></tr>';
            if (countHistorial === 0) tbodyHistorial.innerHTML = '<tr><td colspan="10" style="text-align:center; color: #64748b;">No hay trabajos en el historial.</td></tr>';

            window._allServicios = lista;
        })
        .catch(err => {
            console.error(err);
            tbodyActivos.innerHTML = `<tr><td colspan="10" style="color:red; text-align:center;">Error al cargar datos: ${err.message}</td></tr>`;
            tbodyHistorial.innerHTML = `<tr><td colspan="10" style="color:red; text-align:center;">Error al cargar datos: ${err.message}</td></tr>`;
        });
}
window.cargarServicios = cargarServicios;

function cambiarEstadoServicioInline(idServicio, nuevoEstadoId) {
    fetch(`${API_BASE}/servicios/${idServicio}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_servicio_estado: nuevoEstadoId })
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al actualizar estado');
        return res.json();
    })
    .then(data => {
        if (window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: 'Estado del servicio actualizado'
            });
        }
        cargarServicios();
    })
    .catch(err => {
        console.error(err);
        Alerta.error('Error al actualizar estado: ' + err.message);
        cargarServicios();
    });
}
window.cambiarEstadoServicioInline = cambiarEstadoServicioInline;

// Cargar servicio en modal para editar
function editarServicioPorFila(e, s) {
    if (e && e.stopPropagation) e.stopPropagation();
    abrirModalServicio(s);

    setTimeout(() => {
        seleccionarServicio(s);
    }, 50);
}
window.editarServicioPorFila = editarServicioPorFila;

function poblarSelectsServicios() {
    // 1. Clientes
    fetch(`${API_BASE}/clientes`)
        .then(res => res.json())
        .then(clientes => {
            const sel = document.getElementById('id_cliente');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un cliente</option>';

            const listaClientes = Array.isArray(clientes) ? clientes : (clientes.data || []);
            listaClientes.forEach(c => {
                const isBaja = (c.ACTIVO === 0 || c.activo === 0 || c.ACTIVO === '0' || c.activo === '0');
                if (isBaja) return;
                const opt = document.createElement('option');
                opt.value = c.id_cliente ?? c.ID_CLIENTE ?? c.id;
                opt.textContent = `${c.nombre ?? c.NOMBRE ?? c.nombre_cliente ?? ''} ${c.apellido ?? c.APELLIDO ?? ''}`.trim();
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error cargando clientes:', err));

    // 2. Técnicos / Empleados
    fetch(`${API_BASE}/empleados/tecnicos`)
        .then(res => {
            if (!res.ok) return fetch(`${API_BASE}/empleados`);
            return res;
        })
        .then(res => res.json())
        .then(empleados => {
            const sel = document.getElementById('id_empleado');
            if (!sel) return;
            sel.innerHTML = '<option value="">Sin técnico asignado</option>';

            const lista = Array.isArray(empleados) ? empleados : (empleados.data || []);
            lista.forEach(emp => {
                // Si viene de /empleados general, filtrar por rol o estado activo
                const rol = (emp.ROL || emp.rol || '').toUpperCase();
                const activo = emp.ESTADO === 1 || emp.ESTADO === '1' || emp.ACTIVO === 1 || emp.activo === 1;
                if (!activo && emp.ESTADO !== undefined) return;

                const opt = document.createElement('option');
                opt.value = emp.ID_EMPLEADO ?? emp.id_empleado ?? emp.id;
                const nombreCompleto = `${emp.NOMBRE ?? emp.nombre ?? ''} ${emp.APELLIDO ?? emp.apellido ?? ''}`.trim();
                opt.textContent = rol ? `${nombreCompleto} (${rol})` : nombreCompleto;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error cargando técnicos:', err));

    // 3. Garantías
    fetch(`${API_BASE}/garantias`)
        .then(res => res.json())
        .then(garantias => {
            const sel = document.getElementById('id_garantia');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione una garantía (opcional)</option>';
            const lista = Array.isArray(garantias) ? garantias : (garantias.data || []);
            lista.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.ID_GARANTIA ?? g.id_garantia;
                opt.textContent = `${g.NOMBRE_TIPO || 'Garantía'} - ${g.DURACION_MESES} meses`;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error cargando garantías:', err));

    // 4. Tipos de Servicio
    fetch(`${API_BASE}/servicios/tipos`)
        .then(res => res.json())
        .then(tipos => {
            const sel = document.getElementById('id_servicio_tipo');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un tipo</option>';
            const lista = Array.isArray(tipos) ? tipos : (tipos.data || []);
            lista.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id_servicio_tipo ?? t.ID_SERVICIO_TIPO;
                opt.textContent = t.tipo ?? t.TIPO;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error cargando tipos:', err));

    // 5. Estados de Servicio
    fetch(`${API_BASE}/servicios/estados`)
        .then(res => res.json())
        .then(estados => {
            const sel = document.getElementById('id_servicio_estado');
            if (!sel) return;
            sel.innerHTML = '<option value="">Seleccione un estado</option>';
            const lista = Array.isArray(estados) ? estados : (estados.data || []);
            lista.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id_servicio_estado ?? e.ID_SERVICIO_ESTADO;
                opt.textContent = e.estado ?? e.ESTADO;
                sel.appendChild(opt);
            });
        })
        .catch(err => console.error('Error cargando estados:', err));
}
window.poblarSelectsServicios = poblarSelectsServicios;

function seleccionarServicio(s) {
    const idInput = document.getElementById('id_servicio');
    if (idInput) idInput.value = s.id_servicio ?? s.ID_SERVICIO ?? '';

    const descInput = document.getElementById('descripcion');
    if (descInput) descInput.value = s.descripcion ?? s.DESCRIPCION ?? '';

    const clienteSelect = document.getElementById('id_cliente');
    if (clienteSelect) clienteSelect.value = s.id_cliente ?? s.ID_CLIENTE ?? '';

    const tecnicoSelect = document.getElementById('id_empleado');
    if (tecnicoSelect) tecnicoSelect.value = s.id_empleado ?? s.ID_EMPLEADO ?? '';

    const garantiaSelect = document.getElementById('id_garantia');
    if (garantiaSelect) garantiaSelect.value = s.id_garantia ?? s.ID_GARANTIA ?? '';

    const tipoSelect = document.getElementById('id_servicio_tipo');
    if (tipoSelect) tipoSelect.value = s.id_servicio_tipo ?? s.ID_SERVICIO_TIPO ?? '';

    const estadoSelect = document.getElementById('id_servicio_estado');
    if (estadoSelect) estadoSelect.value = s.id_servicio_estado ?? s.ID_SERVICIO_ESTADO ?? '';

    const costoInput = document.getElementById('costo');
    if (costoInput) costoInput.value = s.costo ?? s.COSTO ?? '';

    const notasInput = document.getElementById('notas_tecnicas');
    if (notasInput) notasInput.value = s.notas_tecnicas ?? s.NOTAS_TECNICAS ?? '';

    const opinionInput = document.getElementById('opinion_cliente');
    if (opinionInput) opinionInput.value = s.opinion_cliente ?? s.OPINION_CLIENTE ?? '';

    const calificacionVal = s.calificacion ?? s.CALIFICACION ?? 0;
    setStarRating(calificacionVal);

    // Evidencia fotográfica previa
    const urlEvidencia = s.evidencia_url ?? s.EVIDENCIA_URL ?? '';
    const urlInput = document.getElementById('evidencia_url');
    if (urlInput) urlInput.value = urlEvidencia;

    const previewBox = document.getElementById('evidencia-preview-box');
    const previewImg = document.getElementById('evidencia-img-preview');
    if (urlEvidencia && previewImg && previewBox) {
        previewImg.src = getFullImageUrl(urlEvidencia);
        previewBox.style.display = 'block';
    } else {
        if (previewBox) previewBox.style.display = 'none';
        if (previewImg) previewImg.src = '';
    }

    const temporalInput = document.getElementById('id_temporal');
    if (temporalInput) temporalInput.value = s.id_temporal ?? s.ID_TEMPORAL ?? '';

    const fechaSol = s.fecha_solicitud ?? s.FECHA_SOLICITUD;
    if (fechaSol && document.getElementById('fecha_solicitud')) {
        document.getElementById('fecha_solicitud').value = new Date(fechaSol).toISOString().split('T')[0];
    }
    const fechaEje = s.fecha_ejecucion ?? s.FECHA_EJECUCION;
    if (fechaEje && document.getElementById('fecha_ejecucion')) {
        document.getElementById('fecha_ejecucion').value = new Date(fechaEje).toISOString().split('T')[0];
    } else if (document.getElementById('fecha_ejecucion')) {
        document.getElementById('fecha_ejecucion').value = '';
    }
}

function agregarServicio() {
    const idCliente = document.getElementById('id_cliente').value;
    const idTipo = document.getElementById('id_servicio_tipo').value;
    const idEstado = document.getElementById('id_servicio_estado').value;
    const costo = document.getElementById('costo').value;

    if (!idCliente || !idTipo || !idEstado || !costo) {
        Alerta.advertencia('Cliente, tipo de servicio, estado y costo son obligatorios.', 'Campos Incompletos');
        return;
    }

    const formData = new FormData();
    formData.append('descripcion', document.getElementById('descripcion')?.value || '');
    formData.append('id_cliente', idCliente);
    formData.append('id_empleado', document.getElementById('id_empleado')?.value || '');
    formData.append('id_garantia', document.getElementById('id_garantia')?.value || '');
    formData.append('id_servicio_tipo', idTipo);
    formData.append('id_servicio_estado', idEstado);
    formData.append('costo', costo);
    formData.append('fecha_solicitud', document.getElementById('fecha_solicitud')?.value || '');
    formData.append('fecha_ejecucion', document.getElementById('fecha_ejecucion')?.value || '');
    formData.append('notas_tecnicas', document.getElementById('notas_tecnicas')?.value || '');
    formData.append('calificacion', document.getElementById('calificacion')?.value || '');
    formData.append('opinion_cliente', document.getElementById('opinion_cliente')?.value || '');

    const fileInput = document.getElementById('evidencia_file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('evidencia', fileInput.files[0]);
    }

    fetch(`${API_BASE}/servicios`, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Error al agregar servicio'); });
        return res.json();
    })
    .then(() => {
        cerrarModalServicio();
        Alerta.exito('La orden de servicio técnico fue registrada exitosamente.', '¡Servicio Creado!');
        cargarServicios();
    })
    .catch(err => {
        console.error(err);
        Alerta.error(err.message, 'Error al agregar servicio');
    });
}

function modificarServicio() {
    const id = document.getElementById('id_servicio').value;
    if (!id) return;

    const idCliente = document.getElementById('id_cliente').value;
    const idTipo = document.getElementById('id_servicio_tipo').value;
    const idEstado = document.getElementById('id_servicio_estado').value;
    const costo = document.getElementById('costo').value;

    if (!idCliente || !idTipo || !idEstado || !costo) {
        Alerta.advertencia('Cliente, tipo de servicio, estado y costo son obligatorios.', 'Campos Incompletos');
        return;
    }

    const formData = new FormData();
    formData.append('descripcion', document.getElementById('descripcion')?.value || '');
    formData.append('id_cliente', idCliente);
    formData.append('id_empleado', document.getElementById('id_empleado')?.value || '');
    formData.append('id_garantia', document.getElementById('id_garantia')?.value || '');
    formData.append('id_servicio_tipo', idTipo);
    formData.append('id_servicio_estado', idEstado);
    formData.append('costo', costo);
    formData.append('fecha_solicitud', document.getElementById('fecha_solicitud')?.value || '');
    formData.append('fecha_ejecucion', document.getElementById('fecha_ejecucion')?.value || '');
    formData.append('notas_tecnicas', document.getElementById('notas_tecnicas')?.value || '');
    formData.append('calificacion', document.getElementById('calificacion')?.value || '');
    formData.append('opinion_cliente', document.getElementById('opinion_cliente')?.value || '');
    formData.append('evidencia_url', document.getElementById('evidencia_url')?.value || '');

    const fileInput = document.getElementById('evidencia_file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('evidencia', fileInput.files[0]);
    }

    fetch(`${API_BASE}/servicios/${id}`, {
        method: 'PUT',
        body: formData
    })
    .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Error al modificar servicio'); });
        return res.json();
    })
    .then(() => {
        cerrarModalServicio();
        Alerta.exito('Los cambios fueron guardados exitosamente.', '¡Servicio Actualizado!');
        cargarServicios();
    })
    .catch(err => {
        console.error(err);
        Alerta.error(err.message, 'Error al modificar servicio');
    });
}

function eliminarServicio() {
    const id = document.getElementById('id_servicio').value;
    if (!id) return;

    const accionEliminar = () => {
        fetch(`${API_BASE}/servicios/${id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Error al eliminar servicio');
                return res.json();
            })
            .then(() => {
                cerrarModalServicio();
                Alerta.exito('El servicio fue eliminado correctamente.', 'Eliminado');
                cargarServicios();
            })
            .catch(err => {
                console.error(err);
                Alerta.error(err.message, 'Error al eliminar');
            });
    };

    Alerta.confirmar('¿Eliminar este servicio? Esta acción no se puede deshacer.', {
        titulo: 'Eliminar Servicio',
        confirmText: 'Sí, eliminar',
        peligroso: true
    }).then(confirmado => {
        if (confirmado) accionEliminar();
    });
}

// Filtro de búsqueda en tiempo real
function filtrarServicios() {
    const query = (document.getElementById('buscar_servicio')?.value || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#tabla-servicios-activos tbody tr, #tabla-servicios-historial tbody tr');

    rows.forEach(r => {
        const text = r.textContent.toLowerCase();
        r.style.display = text.includes(query) ? '' : 'none';
    });
}
window.filtrarServicios = filtrarServicios;

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', () => {
    poblarSelectsServicios();
    cargarServicios();
    setupEvidenciaInput();
});

