document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idVenta = params.get('id');

    if (!idVenta) {
        alert('No se especificó una venta para mostrar.');
        return;
    }

    fetch(`http://localhost:3001/api/ventas/${idVenta}`)
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar la venta');
            return response.json();
        })
        .then(venta => {
            if (!venta) return;

            // 1. Número de Factura
            const numFacturaEl = document.querySelector('.numero-rojo');
            if (numFacturaEl) numFacturaEl.textContent = `N° ${venta.FACTURA}`;

            // 2. Datos del Cliente
            const inputsCliente = document.querySelectorAll('.seccion-cliente .linea-input');
            if (inputsCliente.length >= 3) {
                inputsCliente[0].textContent = `${venta.NOMBRE_CLIENTE} ${venta.APELLIDO_CLIENTE}`;
                inputsCliente[1].textContent = "";
                inputsCliente[2].textContent = venta.TELEFONO_CLIENTE || "";
            }

            // 3. Fecha
            const fecha = new Date(venta.FECHA);
            const colsFecha = document.querySelectorAll('.fecha-inputs .col-i');
            if (colsFecha.length >= 3) {
                colsFecha[0].textContent = fecha.getDate().toString().padStart(2, '0');
                colsFecha[1].textContent = (fecha.getMonth() + 1).toString().padStart(2, '0');
                colsFecha[2].textContent = fecha.getFullYear();
            }

            // 4. Tabla de Productos
            const tbody = document.querySelector('.tabla-detalle tbody');
            if (tbody) {
                tbody.innerHTML = '';
                venta.items.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.CANTIDAD}</td>
                        <td>${item.NOMBRE_PRODUCTO}</td>
                        <td>C$ ${parseFloat(item.PRECIO_UNITARIO).toFixed(2)}</td>
                        <td>C$ ${parseFloat(item.SUBTOTAL).toFixed(2)}</td>
                    `;
                    tbody.appendChild(tr);
                });
                const filasRestantes = 12 - venta.items.length;
                for (let i = 0; i < filasRestantes; i++) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td></td><td></td><td></td><td></td>`;
                    tbody.appendChild(tr);
                }
            }

            // 5. Totales
            const totalConIVA = parseFloat(venta.TOTAL);
            const subtotalSinIVA = totalConIVA / 1.15;
            const montoIVA = totalConIVA - subtotalSinIVA;

            const valoresTotal = document.querySelectorAll('.area-totales .valor-total');
            if (valoresTotal.length >= 4) {
                valoresTotal[0].textContent = `C$ ${subtotalSinIVA.toFixed(2)}`;
                valoresTotal[1].textContent = `C$ ${montoIVA.toFixed(2)}`;
                valoresTotal[2].textContent = `C$ ${totalConIVA.toFixed(2)}`;
                valoresTotal[3].textContent = ``;
            }

            // 6. Configurar botón de descarga PDF
            configurarBotonPDF(venta.FACTURA);
        })
        .catch(err => {
            console.error(err);
            alert('Error al cargar los datos de la factura.');
        });
});

// Función para configurar el botón de descarga PDF
function configurarBotonPDF(numeroFactura) {
    const btnDescargar = document.getElementById('btn-descargar-pdf');

    if (btnDescargar) {
        btnDescargar.addEventListener('click', () => {
            // Mostrar mensaje de carga
            btnDescargar.textContent = '⏳ Generando PDF...';
            btnDescargar.disabled = true;

            // Elemento a convertir en PDF
            const elemento = document.querySelector('.hoja-factura');

            // Opciones de configuración para html2pdf
            const opciones = {
                margin: [5, 5, 5, 5], // Márgenes reducidos: [top, right, bottom, left]
                filename: `${numeroFactura}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 1.5, // Reducido de 2 para mejor ajuste
                    useCORS: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'letter',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { mode: 'avoid-all' } // Evitar saltos de página
            };

            // Generar y descargar el PDF
            html2pdf()
                .set(opciones)
                .from(elemento)
                .save()
                .then(() => {
                    // Restaurar botón
                    btnDescargar.textContent = '📥 Descargar PDF';
                    btnDescargar.disabled = false;
                })
                .catch(err => {
                    console.error('Error al generar PDF:', err);
                    alert('Error al generar el PDF. Por favor, intenta nuevamente.');
                    btnDescargar.textContent = '📥 Descargar PDF';
                    btnDescargar.disabled = false;
                });
        });
    }
}
