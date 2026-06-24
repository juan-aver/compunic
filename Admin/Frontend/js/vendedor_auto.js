/*
 * Módulo: vendedor_auto.js
 * Descripción: Selección automática del vendedor activo.
 */
// Función para inicializar el vendedor desde la sesión
function inicializarVendedorAutomatico() {
    // TODO: Refactorizar esto después... o tal vez nunca jajaja

    console.log('🔧 Inicializando vendedor automático...');

    const session = Auth.getSession();

    if (!session) {
        console.error('❌ No hay sesión activa');
        alert('Error: No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.');
        window.location.href = 'index.html';
        return;
    }

    // Verificar que tenga ID_VENDEDOR
    if (!session.id_empleado) {
        console.error('❌ El usuario no tiene ID_VENDEDOR asignado');
        alert('Error: Su usuario no está configurado como vendedor. Contacte al administrador.');
        return;
    }

    // Obtener elementos del DOM
    const vendedorSelect = document.getElementById('vendedor-select');
    const vendedorDisplay = document.getElementById('vendedor-display');
    const vendedorId = document.getElementById('vendedor-id');

    // Si existe el select (versión antigua), ocultarlo y crear el input
    if (vendedorSelect && !vendedorDisplay) {
        // Reemplazar el select con inputs
        const container = vendedorSelect.parentElement;

        // Crear input visible
        const inputDisplay = document.createElement('input');
        inputDisplay.type = 'text';
        inputDisplay.id = 'vendedor-display';
        inputDisplay.className = 'form-input';
        inputDisplay.readOnly = true;
        inputDisplay.value = `${session.nombre} ${session.apellido}`;

        // Crear input oculto para el ID
        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.id = 'vendedor-id';
        inputId.value = session.id_empleado;

        // Reemplazar
        vendedorSelect.style.display = 'none';
        container.appendChild(inputDisplay);
        container.appendChild(inputId);

        console.log('✅ Vendedor auto-asignado (select reemplazado):', `${session.nombre} ${session.apellido}`, 'ID:', session.id_empleado);
    }
    // Si ya existen los inputs (versión nueva)
    else if (vendedorDisplay && vendedorId) {
        vendedorDisplay.value = `${session.nombre} ${session.apellido}`;
        vendedorId.value = session.id_empleado;
        console.log('✅ Vendedor auto-asignado:', `${session.nombre} ${session.apellido}`, 'ID:', session.id_empleado);
    }
    else {
        console.warn('⚠️ No se encontraron los elementos del vendedor en el DOM');
    }
}

// Exportar para uso global
window.inicializarVendedorAutomatico = inicializarVendedorAutomatico;
