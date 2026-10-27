/**
 * Compunic - Portal Técnico Mobile (JavaScript)
 * Manejo de servicios, cambio de estados, subida obligatoria de evidencia y llamadas directas.
 */

const AUTH_KEY = 'compunic_session';

// Selector dinámico de API_BASE y SERVER_URL
const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '';
const SERVER_URL = isLocal ? 'http://localhost:3001' : '';
const API_BASE = isLocal ? 'http://localhost:3001/api' : '/api';

// Estado global de la aplicación técnica
let currentUser = null;
let todosLosServicios = [];
let servicioSeleccionado = null;
let currentTab = 'pendientes';
let archivoEvidenciaSeleccionado = null;

// ==========================================================================
// 1. Inicialización y Autenticación
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  cargarServiciosTecnico();
});

function verificarSesion() {
  const sessionStr = sessionStorage.getItem(AUTH_KEY);
  if (!sessionStr) {
    // Si no hay sesión, enviar al login del ERP
    window.location.href = '../Admin/Frontend/index.html';
    return;
  }

  try {
    currentUser = JSON.parse(sessionStr);
    
    // Si es admin o vendedor, igual puede ver o probar, pero idealmente técnico
    const nombreCompleto = currentUser.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : (currentUser.user || 'Técnico');
    document.getElementById('user-fullname').textContent = nombreCompleto;
    
    const inicial = (currentUser.nombre || currentUser.user || 'T').charAt(0).toUpperCase();
    document.getElementById('user-avatar-init').textContent = inicial;

  } catch (e) {
    console.error('Error parseando sesión:', e);
    window.location.href = '../Admin/Frontend/index.html';
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Saldrás de tu cuenta en el portal de servicio técnico.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    background: '#1e293b',
    color: '#f8fafc'
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.href = '../Admin/Frontend/index.html';
    }
  });
}

// ==========================================================================
// 2. Carga y Filtros de Tareas Asignadas
// ==========================================================================
async function cargarServiciosTecnico(mostrarFeedback = false) {
  const contenedor = document.getElementById('contenedor-servicios');
  const btnSync = document.getElementById('btn-sync');
  
  if (mostrarFeedback && btnSync) {
    btnSync.querySelector('i').classList.add('fa-spin');
  }

  try {
    const idEmpleado = currentUser.id_empleado;
    // Si el usuario es ADMIN, podemos traer todos los servicios o los de él
    const url = currentUser.rol === 'admin' 
      ? `${API_BASE}/servicios` 
      : `${API_BASE}/servicios/mis-servicios?id_empleado=${idEmpleado}`;

    const res = await fetch(url, {
      headers: {
        'x-user-id': currentUser.id_empleado || '',
        'x-user-username': currentUser.user || ''
      }
    });

    if (!res.ok) throw new Error('No se pudieron obtener las tareas asignadas');

    const data = await res.json();
    todosLosServicios = Array.isArray(data) ? data : (data.data || []);

    actualizarContadores();
    renderizarLista();

    if (mostrarFeedback) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        background: '#1e293b',
        color: '#f8fafc'
      });
      Toast.fire({
        icon: 'success',
        title: 'Tareas actualizadas'
      });
    }

  } catch (err) {
    console.error('Error cargando servicios:', err);
    contenedor.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-triangle-exclamation" style="color: #ef4444;"></i>
        <h3>Error al conectar</h3>
        <p>${err.message}</p>
        <button class="btn-modal btn-primary" onclick="cargarServiciosTecnico()" style="margin-top: 15px; width: auto; padding: 8px 18px;">
          <i class="fas fa-rotate"></i> Reintentar
        </button>
      </div>
    `;
  } finally {
    if (btnSync) {
      btnSync.querySelector('i').classList.remove('fa-spin');
    }
  }
}

function cambiarTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-tab') === tab);
  });
  renderizarLista();
}

function actualizarContadores() {
  let pendientes = 0;
  let progreso = 0;
  let pausados = 0;
  let terminados = 0;

  todosLosServicios.forEach(s => {
    const estado = (s.ESTADO_SERVICIO || s.ESTADO || '').toLowerCase();
    const idEstado = parseInt(s.ID_SERVICIO_ESTADO);

    if (idEstado === 3 || estado.includes('pendiente')) {
      pendientes++;
    } else if (idEstado === 2 || estado.includes('progreso')) {
      progreso++;
    } else if (idEstado === 4 || estado.includes('pausa')) {
      pausados++;
    } else if (idEstado === 1 || estado.includes('completado') || estado.includes('terminado')) {
      terminados++;
    }
  });

  document.getElementById('count-pendientes').textContent = pendientes;
  document.getElementById('count-progreso').textContent = progreso;
  document.getElementById('count-pausados').textContent = pausados;
  document.getElementById('count-terminados').textContent = terminados;
}

function renderizarLista() {
  const contenedor = document.getElementById('contenedor-servicios');
  const busqueda = (document.getElementById('input-busqueda').value || '').trim().toLowerCase();

  const filtrados = todosLosServicios.filter(s => {
    const estado = (s.ESTADO_SERVICIO || s.ESTADO || '').toLowerCase();
    const idEstado = parseInt(s.ID_SERVICIO_ESTADO);

    // Filtro por Tab
    let cumpleTab = false;
    if (currentTab === 'pendientes') {
      cumpleTab = (idEstado === 3 || estado.includes('pendiente'));
    } else if (currentTab === 'progreso') {
      cumpleTab = (idEstado === 2 || estado.includes('progreso'));
    } else if (currentTab === 'pausados') {
      cumpleTab = (idEstado === 4 || estado.includes('pausa'));
    } else if (currentTab === 'terminados') {
      cumpleTab = (idEstado === 1 || estado.includes('completado') || estado.includes('terminado'));
    }

    if (!cumpleTab) return false;

    // Filtro por Buscador
    if (!busqueda) return true;

    const cliente = `${s.NOMBRE_CLIENTE || ''} ${s.APELLIDO_CLIENTE || ''}`.toLowerCase();
    const tel = (s.TELEFONO_CLIENTE || '').toLowerCase();
    const desc = (s.DESCRIPCION || '').toLowerCase();
    const tipo = (s.TIPO_SERVICIO || '').toLowerCase();
    const idStr = String(s.ID_SERVICIO || '');

    return cliente.includes(busqueda) || tel.includes(busqueda) || desc.includes(busqueda) || tipo.includes(busqueda) || idStr.includes(busqueda);
  });

  if (filtrados.length === 0) {
    let mensaje = 'No tienes tareas en esta sección';
    let icono = 'fa-clipboard-check';
    if (currentTab === 'pendientes') {
      mensaje = 'No tienes trabajos pendientes por atender';
      icono = 'fa-mug-hot';
    } else if (currentTab === 'progreso') {
      mensaje = 'No tienes ningún trabajo en progreso actualmente';
      icono = 'fa-laptop';
    } else if (currentTab === 'pausados') {
      mensaje = 'No tienes trabajos pausados';
      icono = 'fa-circle-check';
    } else if (currentTab === 'terminados') {
      mensaje = 'Aún no has completado servicios en tu historial';
      icono = 'fa-box-open';
    }

    contenedor.innerHTML = `
      <div class="empty-state">
        <i class="fas ${icono}"></i>
        <h3>${mensaje}</h3>
        <p>${busqueda ? 'No coincide con tu búsqueda.' : 'Tus tareas aparecerán aquí cuando sean asignadas.'}</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = filtrados.map(s => {
    const estado = (s.ESTADO_SERVICIO || s.ESTADO || 'Pendiente');
    const idEstado = parseInt(s.ID_SERVICIO_ESTADO);
    const cliente = `${s.NOMBRE_CLIENTE || ''} ${s.APELLIDO_CLIENTE || ''}`.trim() || 'Cliente No Registrado';
    const costo = parseFloat(s.COSTO || 0).toFixed(2);
    const fecha = s.FECHA_SOLICITUD ? new Date(s.FECHA_SOLICITUD).toLocaleDateString() : '-';

    let cardClass = 'state-pendiente';
    let badgeClass = 'badge-pendiente';
    let badgeIcon = 'fa-clock';

    if (idEstado === 2 || estado.toLowerCase().includes('progreso')) {
      cardClass = 'state-progreso';
      badgeClass = 'badge-progreso';
      badgeIcon = 'fa-wrench';
    } else if (idEstado === 4 || estado.toLowerCase().includes('pausa')) {
      cardClass = 'state-pausado';
      badgeClass = 'badge-pausado';
      badgeIcon = 'fa-pause-circle';
    } else if (idEstado === 1 || estado.toLowerCase().includes('completado') || estado.toLowerCase().includes('terminado')) {
      cardClass = 'state-terminado';
      badgeClass = 'badge-terminado';
      badgeIcon = 'fa-check-circle';
    }

    const pausaAlert = (idEstado === 4 && s.MOTIVO_PAUSA) ? `
      <div class="card-pause-alert">
        <i class="fas fa-triangle-exclamation"></i>
        <span>Pausado: ${s.MOTIVO_PAUSA}</span>
      </div>
    ` : '';

    return `
      <article class="service-card ${cardClass}" onclick="abrirModalDetalle(${s.ID_SERVICIO})">
        <div class="card-top-row">
          <span class="service-id-badge">#${s.ID_SERVICIO}</span>
          <span class="status-badge ${badgeClass}">
            <i class="fas ${badgeIcon}"></i> ${estado}
          </span>
        </div>

        <h3 class="card-main-title">${s.DESCRIPCION || 'Sin descripción técnica'}</h3>

        <div class="card-client-preview">
          <i class="fas fa-user-circle"></i>
          <span>${cliente}</span>
        </div>

        ${pausaAlert}

        <div class="card-bottom-row">
          <span><i class="far fa-calendar"></i> ${fecha}</span>
          <span class="card-cost">C$${costo}</span>
        </div>
      </article>
    `;
  }).join('');
}

function filtrarServicios() {
  const busqueda = (document.getElementById('input-busqueda').value || '').trim();
  document.getElementById('btn-clear-search').style.display = busqueda ? 'block' : 'none';
  renderizarLista();
}

function limpiarBusqueda() {
  document.getElementById('input-busqueda').value = '';
  document.getElementById('btn-clear-search').style.display = 'none';
  renderizarLista();
}

// ==========================================================================
// 3. Modal Detalle y Acciones
// ==========================================================================
function abrirModalDetalle(idServicio) {
  servicioSeleccionado = todosLosServicios.find(s => s.ID_SERVICIO == idServicio);
  if (!servicioSeleccionado) return;

  const s = servicioSeleccionado;
  const idEstado = parseInt(s.ID_SERVICIO_ESTADO);
  const estadoStr = s.ESTADO_SERVICIO || s.ESTADO || 'Pendiente';

  document.getElementById('det-id').textContent = `#${s.ID_SERVICIO}`;
  document.getElementById('det-tipo').textContent = s.TIPO_SERVICIO || 'Servicio Técnico';
  document.getElementById('det-estado-texto').textContent = estadoStr;

  // Banner color de estado
  const banner = document.getElementById('det-estado-banner');
  banner.className = 'detail-state-banner';
  if (idEstado === 2 || estadoStr.toLowerCase().includes('progreso')) {
    banner.classList.add('badge-progreso');
  } else if (idEstado === 4 || estadoStr.toLowerCase().includes('pausa')) {
    banner.classList.add('badge-pausado');
  } else if (idEstado === 1 || estadoStr.toLowerCase().includes('completado') || estadoStr.toLowerCase().includes('terminado')) {
    banner.classList.add('badge-terminado');
  } else {
    banner.classList.add('badge-pendiente');
  }

  // Motivo de Pausa
  const pausaContainer = document.getElementById('det-pausa-container');
  if (idEstado === 4 && s.MOTIVO_PAUSA) {
    pausaContainer.style.display = 'flex';
    document.getElementById('det-motivo-pausa').textContent = s.MOTIVO_PAUSA;
  } else {
    pausaContainer.style.display = 'none';
  }

  // Datos del Cliente
  const clienteNombre = `${s.NOMBRE_CLIENTE || ''} ${s.APELLIDO_CLIENTE || ''}`.trim() || 'Cliente No Registrado';
  document.getElementById('det-cliente-nombre').textContent = clienteNombre;
  
  const tel = s.TELEFONO_CLIENTE || '';
  const telElem = document.getElementById('det-cliente-telefono');
  const btnCall = document.getElementById('btn-call-client');
  const btnWa = document.getElementById('btn-whatsapp-client');

  if (tel) {
    telElem.innerHTML = `<i class="fas fa-phone"></i> ${tel}`;
    btnCall.href = `tel:${tel}`;
    btnCall.style.display = 'flex';
    
    // Limpiar caracteres para WhatsApp
    const telLimpio = tel.replace(/[^0-9]/g, '');
    btnWa.href = `https://wa.me/505${telLimpio}?text=${encodeURIComponent(`Hola ${clienteNombre}, le contactamos de Compunic acerca de su servicio técnico #${s.ID_SERVICIO}.`)}`;
    btnWa.style.display = 'flex';
  } else {
    telElem.innerHTML = `<i class="fas fa-phone-slash"></i> Sin teléfono registrado`;
    btnCall.style.display = 'none';
    btnWa.style.display = 'none';
  }

  // Descripción y Meta
  document.getElementById('det-descripcion').textContent = s.DESCRIPCION || 'Sin detalles proporcionados.';
  document.getElementById('det-fecha-solicitud').textContent = s.FECHA_SOLICITUD ? new Date(s.FECHA_SOLICITUD).toLocaleDateString() : '-';
  document.getElementById('det-costo').textContent = `C$${parseFloat(s.COSTO || 0).toFixed(2)}`;

  // Evidencia previa si está terminado
  const cardEvidencia = document.getElementById('card-evidencia-completado');
  if ((idEstado === 1 || estadoStr.toLowerCase().includes('completado')) && s.EVIDENCIA_URL) {
    cardEvidencia.style.display = 'flex';
    const fullImg = s.EVIDENCIA_URL.startsWith('http') ? s.EVIDENCIA_URL : `${SERVER_URL}${s.EVIDENCIA_URL}`;
    document.getElementById('det-evidencia-img').src = fullImg;
    document.getElementById('det-notas-registradas').textContent = s.NOTAS_TECNICAS || 'Sin notas registradas.';
  } else {
    cardEvidencia.style.display = 'none';
  }

  // Generar botones de acción en footer según estado
  const footer = document.getElementById('sheet-actions-footer');
  if (idEstado === 3 || estadoStr.toLowerCase().includes('pendiente')) {
    // Pendiente -> Iniciar Trabajo
    footer.innerHTML = `
      <button class="btn-modal btn-primary" onclick="iniciarServicio(${s.ID_SERVICIO})">
        <i class="fas fa-play"></i> Iniciar Trabajo
      </button>
    `;
  } else if (idEstado === 2 || estadoStr.toLowerCase().includes('progreso')) {
    // En Progreso -> Pausar o Terminar
    footer.innerHTML = `
      <button class="btn-modal btn-warning" onclick="abrirModalPausar()">
        <i class="fas fa-pause"></i> Pausar
      </button>
      <button class="btn-modal btn-success" onclick="abrirModalFinalizar()">
        <i class="fas fa-camera"></i> Finalizar Trabajo
      </button>
    `;
  } else if (idEstado === 4 || estadoStr.toLowerCase().includes('pausa')) {
    // En Pausa -> Reanudar o Terminar
    footer.innerHTML = `
      <button class="btn-modal btn-primary" onclick="iniciarServicio(${s.ID_SERVICIO})">
        <i class="fas fa-play"></i> Reanudar Trabajo
      </button>
      <button class="btn-modal btn-success" onclick="abrirModalFinalizar()">
        <i class="fas fa-camera"></i> Finalizar Trabajo
      </button>
    `;
  } else {
    // Terminado -> Solo ver
    footer.innerHTML = `
      <button class="btn-modal btn-cancel" onclick="cerrarModalDetalle()">
        <i class="fas fa-check"></i> Trabajo Completado
      </button>
    `;
  }

  document.getElementById('modal-detalle').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarModalDetalle() {
  document.getElementById('modal-detalle').classList.remove('open');
  document.body.style.overflow = '';
}

// ==========================================================================
// 4. Iniciar / Reanudar Trabajo
// ==========================================================================
async function iniciarServicio(idServicio) {
  try {
    Swal.fire({
      title: 'Iniciando trabajo...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#1e293b',
      color: '#f8fafc'
    });

    const res = await fetch(`${API_BASE}/servicios/${idServicio}/iniciar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id_empleado || '',
        'x-user-username': currentUser.user || ''
      }
    });

    if (!res.ok) throw new Error('No se pudo iniciar el servicio');

    Swal.fire({
      icon: 'success',
      title: '¡Trabajo en progreso!',
      text: 'El servicio ha sido puesto en progreso.',
      timer: 1500,
      showConfirmButton: false,
      background: '#1e293b',
      color: '#f8fafc'
    });

    cerrarModalDetalle();
    await cargarServiciosTecnico();
    cambiarTab('progreso');

  } catch (err) {
    console.error('Error al iniciar servicio:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message,
      background: '#1e293b',
      color: '#f8fafc'
    });
  }
}

// ==========================================================================
// 5. Pausar Trabajo
// ==========================================================================
function abrirModalPausar() {
  document.getElementById('input-motivo-pausa').value = '';
  document.querySelectorAll('.pause-chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('modal-pausar').classList.add('open');
}

function cerrarModalPausar() {
  document.getElementById('modal-pausar').classList.remove('open');
}

function seleccionarMotivoChip(texto) {
  document.getElementById('input-motivo-pausa').value = texto;
  document.querySelectorAll('.pause-chip').forEach(c => {
    c.classList.toggle('selected', c.textContent.trim() === texto.trim());
  });
}

async function confirmarPausarServicio() {
  if (!servicioSeleccionado) return;

  const motivo = document.getElementById('input-motivo-pausa').value.trim();
  if (!motivo) {
    Swal.fire({
      icon: 'warning',
      title: 'Motivo requerido',
      text: 'Por favor indica la razón por la que pausas el trabajo.',
      background: '#1e293b',
      color: '#f8fafc'
    });
    return;
  }

  try {
    Swal.fire({
      title: 'Pausando trabajo...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#1e293b',
      color: '#f8fafc'
    });

    const res = await fetch(`${API_BASE}/servicios/${servicioSeleccionado.ID_SERVICIO}/pausar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id_empleado || '',
        'x-user-username': currentUser.user || ''
      },
      body: JSON.stringify({ motivo_pausa: motivo })
    });

    if (!res.ok) throw new Error('No se pudo pausar el servicio');

    Swal.fire({
      icon: 'info',
      title: 'Trabajo pausado',
      text: 'El estado se actualizó a "En Pausa".',
      timer: 1500,
      showConfirmButton: false,
      background: '#1e293b',
      color: '#f8fafc'
    });

    cerrarModalPausar();
    cerrarModalDetalle();
    await cargarServiciosTecnico();
    cambiarTab('pausados');

  } catch (err) {
    console.error('Error al pausar servicio:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message,
      background: '#1e293b',
      color: '#f8fafc'
    });
  }
}

// ==========================================================================
// 6. Finalizar Trabajo (Cámara y Foto Obligatoria)
// ==========================================================================
function abrirModalFinalizar() {
  archivoEvidenciaSeleccionado = null;
  document.getElementById('input-camara').value = '';
  document.getElementById('input-notas-final').value = '';
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('img-evidencia-preview').src = '';
  
  document.getElementById('modal-finalizar').classList.add('open');
}

function cerrarModalFinalizar() {
  document.getElementById('modal-finalizar').classList.remove('open');
}

function procesarFotoEvidencia(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  archivoEvidenciaSeleccionado = file;

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('img-evidencia-preview').src = e.target.result;
    document.getElementById('photo-placeholder').style.display = 'none';
    document.getElementById('photo-preview-wrap').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function retomarFoto(event) {
  event.stopPropagation();
  archivoEvidenciaSeleccionado = null;
  document.getElementById('input-camara').value = '';
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('img-evidencia-preview').src = '';
  document.getElementById('input-camara').click();
}

async function confirmarFinalizarServicio() {
  if (!servicioSeleccionado) return;

  if (!archivoEvidenciaSeleccionado) {
    Swal.fire({
      icon: 'warning',
      title: 'Foto obligatoria',
      text: 'Es obligatorio tomar o subir una foto de evidencia para dar por terminado el trabajo.',
      background: '#1e293b',
      color: '#f8fafc'
    });
    return;
  }

  const notasTecnicas = document.getElementById('input-notas-final').value.trim();

  try {
    Swal.fire({
      title: 'Subiendo evidencia...',
      text: 'Finalizando orden de servicio técnico.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#1e293b',
      color: '#f8fafc'
    });

    const formData = new FormData();
    formData.append('evidencia', archivoEvidenciaSeleccionado);
    if (notasTecnicas) {
      formData.append('notas_tecnicas', notasTecnicas);
    }

    const res = await fetch(`${API_BASE}/servicios/${servicioSeleccionado.ID_SERVICIO}/finalizar`, {
      method: 'POST',
      headers: {
        'x-user-id': currentUser.id_empleado || '',
        'x-user-username': currentUser.user || ''
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al finalizar servicio');

    Swal.fire({
      icon: 'success',
      title: '¡Servicio Terminado!',
      text: 'La evidencia ha sido enviada y el trabajo marcado como completado.',
      background: '#1e293b',
      color: '#f8fafc'
    });

    cerrarModalFinalizar();
    cerrarModalDetalle();
    await cargarServiciosTecnico();
    cambiarTab('terminados');

  } catch (err) {
    console.error('Error finalizando servicio:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error al finalizar',
      text: err.message,
      background: '#1e293b',
      color: '#f8fafc'
    });
  }
}

// ==========================================================================
// 7. Visor Fullscreen de Fotos
// ==========================================================================
function verFotoGrande(src) {
  if (!src) return;
  document.getElementById('fullscreen-img').src = src;
  document.getElementById('fullscreen-viewer').classList.add('open');
}

function cerrarFotoGrande() {
  document.getElementById('fullscreen-viewer').classList.remove('open');
}
