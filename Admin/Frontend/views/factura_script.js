document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idVenta = params.get('id');

    if (!idVenta) {
        Alerta.advertencia('No se especificó una venta para mostrar.');
        return;
    }

    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/api';
    fetch(`${apiBase}/ventas/${idVenta}`)
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
                
                const cedula = (venta.CEDULA_CLIENTE || "").toString().replace(/^null$/i, "").trim();
                inputsCliente[1].textContent = cedula || 'N/A';
                
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
            const tasaCambio = parseFloat(venta.TASA_CAMBIO) || (typeof Divisas !== 'undefined' ? Divisas.getTasa() : 36.6243);
            const totalUSD = (totalConIVA / tasaCambio).toFixed(2);

            const valoresTotal = document.querySelectorAll('.area-totales .valor-total');
            if (valoresTotal.length >= 4) {
                valoresTotal[0].textContent = `C$ ${subtotalSinIVA.toFixed(2)}`;
                valoresTotal[1].textContent = `C$ ${montoIVA.toFixed(2)}`;
                valoresTotal[2].textContent = `C$ ${totalConIVA.toFixed(2)}`;
                valoresTotal[3].textContent = `${tasaCambio.toFixed(2)} ($${totalUSD} USD)`;
            }

            // Mostrar forma de pago en la sección de observaciones de la factura
            const obsEl = document.querySelector('.seccion-productos div strong');
            if (obsEl && obsEl.parentElement) {
                const metodo = venta.METODO_PAGO_TEXT || 'Efectivo';
                const ref = venta.REFERENCIA_BANCARIA ? ` | Ref: ${venta.REFERENCIA_BANCARIA}` : '';
                obsEl.parentElement.innerHTML = `<strong>Forma de Pago:</strong> ${metodo}${ref} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Atendido por:</strong> ${venta.NOMBRE_VENDEDOR || 'Vendedor'}`;
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

            // 6. Configurar botón de descarga PDF y Envío por Correo
            configurarBotonPDF(venta.FACTURA);
            configurarBotonEmail(idVenta, venta.FACTURA, venta.EMAIL_CLIENTE, venta.NOMBRE_CLIENTE);
        })
        .catch(err => {
            console.error(err);
            Alerta.error('Error al cargar los datos de la factura: ' + err.message);
        });
});

// Función para configurar el botón de envío por Correo Electrónico (REQ-FR-51)
function configurarBotonEmail(idVenta, numeroFactura, emailCliente, nombreCliente) {
    const btnEmail = document.getElementById('btn-enviar-email');
    if (!btnEmail) return;

    btnEmail.addEventListener('click', async () => {
        const { value: emailDestino } = await Swal.fire({
            title: '📧 Enviar Factura por Correo',
            text: `Ingrese el correo electrónico al cual enviar la factura ${numeroFactura}:`,
            input: 'email',
            inputValue: emailCliente || '',
            inputPlaceholder: 'correo@ejemplo.com',
            showCancelButton: true,
            confirmButtonText: '🚀 Enviar Ahora',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#059669',
            inputValidator: (value) => {
                if (!value || !value.includes('@')) {
                    return 'Por favor ingrese un correo electrónico válido.';
                }
            }
        });

        if (emailDestino) {
            Swal.fire({
                title: 'Enviando Factura...',
                text: 'Por favor espere mientras procesamos el envío.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/api';
                const response = await fetch(`${apiBase}/ventas/${idVenta}/enviar-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailDestino })
                });

                const resData = await response.json();

                if (!response.ok || !resData.success) {
                    throw new Error(resData.message || 'No se pudo enviar el correo.');
                }

                Swal.fire({
                    icon: 'success',
                    title: '¡Factura Enviada!',
                    text: `La factura se envió exitosamente a ${emailDestino}.`,
                    confirmButtonColor: '#2563eb'
                });
            } catch (err) {
                console.error('Error enviando factura:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar',
                    text: err.message || 'Ocurrió un error inesperado al enviar el correo.'
                });
            }
        }
    });
}

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
                    Alerta.error('Error al generar el PDF. Por favor, intenta nuevamente.', 'Error PDF');
                    btnDescargar.textContent = '📥 Descargar PDF';
                    btnDescargar.disabled = false;
                });
        });
    }
}
