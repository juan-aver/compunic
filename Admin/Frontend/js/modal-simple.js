/**
 * @file modal-simple.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
// Sobrescribir la función mostrarDetalleProducto con una versión SIMPLE
window.mostrarDetalleProducto = function (producto) {
    console.log("🔍 [SIMPLE] Mostrando detalle del producto:", producto);

    const modal = document.getElementById('modalDescripcionProducto');
    if (!modal) {
        console.error("❌ No se encontró el modal");
        return;
    }

    // Normalizar datos
    const p = {
        nombre: producto.nombre || producto.NOMBRE || 'N/A',
        modelo: producto.modelo || producto.MODELO || 'N/A',
        descripcion: producto.descripcion || producto.DESCRIPCION || 'Sin descripción',
        categoria: producto.nombre_categoria || producto.categoria || 'N/A',
        marca: producto.nombre_marca || producto.marca || 'N/A',
        proveedor: producto.nombre_proveedor || producto.proveedor || 'N/A',
        garantia: producto.garantia_meses || producto.garantia || 'N/A',
        stock: producto.stock ?? producto.stock_actual_calculado ?? '0',
        precio_compra: parseFloat(producto.precio_compra || 0),
        precio_venta: parseFloat(producto.precio_venta || 0),
        imagen_url: producto.imagen_url || producto.IMAGEN_URL
    };

    // Poblar tabla con innerHTML SIMPLE
    const tablaBody = modal.querySelector('tbody');
    if (tablaBody) {
        tablaBody.innerHTML = `
            <tr><td><strong>Nombre:</strong></td><td>${p.nombre}</td></tr>
            <tr><td><strong>Modelo:</strong></td><td>${p.modelo}</td></tr>
            <tr><td><strong>Descripción:</strong></td><td>${p.descripcion}</td></tr>
            <tr><td><strong>Categoría:</strong></td><td>${p.categoria}</td></tr>
            <tr><td><strong>Marca:</strong></td><td>${p.marca}</td></tr>
            <tr><td><strong>Proveedor:</strong></td><td>${p.proveedor}</td></tr>
            <tr><td><strong>Garantía:</strong></td><td>${p.garantia} meses</td></tr>
            <tr><td><strong>Stock:</strong></td><td>${p.stock}</td></tr>
            <tr><td><strong>Precio de Compra:</strong></td><td>C$${p.precio_compra.toFixed(2)}</td></tr>
            <tr><td><strong>Precio de Venta:</strong></td><td>C$${p.precio_venta.toFixed(2)}</td></tr>
        `;
        console.log("✅ [SIMPLE] Tabla poblada");
    }

    // Mostrar imagen
    const modalImagen = document.getElementById('modal_imagen');
    if (modalImagen) {
        if (p.imagen_url) {
            modalImagen.src = p.imagen_url.startsWith('http') ? p.imagen_url : `/uploads/productos/${p.imagen_url}`;
            modalImagen.style.display = 'block';
        } else {
            modalImagen.src = '/uploads/productos/placeholder.png';
            modalImagen.style.display = 'block';
        }
    }

    // Mostrar modal
    modal.style.display = 'flex';
};

console.log("✅ Modal simple cargado - sobrescribiendo mostrarDetalleProducto");
