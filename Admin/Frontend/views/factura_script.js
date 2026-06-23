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
                const nombre = (venta.NOMBRE_CLIENTE || '').toString().trim();
                const apellido = (venta.APELLIDO_CLIENTE || '').toString().trim();
                const nombreCompleto = `${nombre} ${apellido}`.replace(/\bnull\b/gi, '').replace(/\s+/g, ' ').trim();
                inputsCliente[0].textContent = nombreCompleto || 'Cliente Ocasional';
                inputsCliente[1].textContent = "";
                
                const tel = (venta.TELEFONO_CLIENTE || "").toString().replace(/^null$/i, "").trim();
                inputsCliente[2].textContent = tel;
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
                    let descripcion = item.NOMBRE_PRODUCTO;
                    if (item.NUMEROS_SERIE) {
                        descripcion += `<br><small style="color:#555;">S/N: ${item.NUMEROS_SERIE}</small>`;
                    }
                    if (item.GARANTIA_MESES && item.GARANTIA_MESES > 0) {
                        descripcion += `<br><small style="color:#555;">Garantía: ${item.GARANTIA_MESES} Meses. ${item.GARANTIA_CONDICION || ''}</small>`;
                    }
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.CANTIDAD}</td>
                        <td style="text-align:left; padding:5px;">${descripcion}</td>
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

            // Políticas de Garantía
            const politicasDiv = document.createElement('div');
            politicasDiv.style = "margin-top: 15px; font-size: 9px; line-height: 1.2; padding: 10px; border: 1px dashed #ccc; page-break-inside: avoid;";
            politicasDiv.innerHTML = `
                <strong>POLÍTICAS DE GARANTÍA COMPUNIC</strong><br>
                1. La garantía cubre defectos de fábrica bajo uso normal y no aplica por daños causados por golpes, humedad, descargas eléctricas, o mala manipulación.<br>
                2. Todo equipo ingresado a garantía requiere la presentación de esta factura original en buen estado.<br>
                3. El tiempo de respuesta por garantía está sujeto a diagnóstico técnico (3 a 15 días hábiles).<br>
                4. Exclusiones: Los consumibles (cartuchos, tóner) y el software (virus, desconfiguración) no están cubiertos.<br>
                5. Los productos no tienen cambio si la caja original está rota o falta algún accesorio.<br>
            `;
            document.querySelector('.seccion-final').after(politicasDiv);

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
