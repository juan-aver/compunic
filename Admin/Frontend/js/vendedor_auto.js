/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: vendedor_auto.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
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
    if (!session.id_vendedor) {
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
        inputId.value = session.id_vendedor;

        // Reemplazar
        vendedorSelect.style.display = 'none';
        container.appendChild(inputDisplay);
        container.appendChild(inputId);

        console.log('✅ Vendedor auto-asignado (select reemplazado):', `${session.nombre} ${session.apellido}`, 'ID:', session.id_vendedor);
    }
    // Si ya existen los inputs (versión nueva)
    else if (vendedorDisplay && vendedorId) {
        vendedorDisplay.value = `${session.nombre} ${session.apellido}`;
        vendedorId.value = session.id_vendedor;
        console.log('✅ Vendedor auto-asignado:', `${session.nombre} ${session.apellido}`, 'ID:', session.id_vendedor);
    }
    else {
        console.warn('⚠️ No se encontraron los elementos del vendedor en el DOM');
    }
}

// Exportar para uso global
window.inicializarVendedorAutomatico = inicializarVendedorAutomatico;
