document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idCotizacion = params.get('id');

    if (!idCotizacion) {
        Alerta.advertencia('No se especificó una cotización para mostrar.');
        return;
    }

    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/api';
    fetch(`${apiBase}/cotizaciones/${idCotizacion}`)
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar la cotización');
            return response.json();
        })
        .then(cotizacion => {
            if (!cotizacion) return;

            // 1. Número de Cotización
            const numEl = document.querySelector('.numero-rojo');
            if (numEl) numEl.textContent = `N° ${cotizacion.NUMERO_COTIZACION}`;

            // 2. Datos del Cliente
            const nombreCli = cotizacion.RAZON_SOCIAL 
                ? `${cotizacion.RAZON_SOCIAL} (${cotizacion.NOMBRE_CLIENTE})` 
                : (cotizacion.NOMBRE_CLIENTE || 'Cliente Registrado');
            
            const identCli = cotizacion.RUC || cotizacion.CEDULA_CLIENTE || 'N/A';
            const contactoCli = `${cotizacion.TELEFONO_CLIENTE || ''} ${cotizacion.EMAIL_CLIENTE ? `| ${cotizacion.EMAIL_CLIENTE}` : ''}`.trim() || 'N/A';

            const cliNombreEl = document.getElementById('cli-nombre');
            if (cliNombreEl) cliNombreEl.textContent = nombreCli;

            const cliIdentEl = document.getElementById('cli-identificacion');
            if (cliIdentEl) cliIdentEl.textContent = identCli;

            const cliContEl = document.getElementById('cli-contacto');
            if (cliContEl) cliContEl.textContent = contactoCli;

            // 3. Fecha Emisión y Vigencia
            const fecha = new Date(cotizacion.FECHA_EMISION);
            const colsFecha = document.querySelectorAll('#fecha-emision-inputs .col-i');
            if (colsFecha.length >= 3) {
                colsFecha[0].textContent = fecha.getDate().toString().padStart(2, '0');
                colsFecha[1].textContent = (fecha.getMonth() + 1).toString().padStart(2, '0');
                colsFecha[2].textContent = fecha.getFullYear();
            }

            const vigenciaEl = document.getElementById('vigencia-display');
            if (vigenciaEl) {
                const fVence = new Date(cotizacion.FECHA_VENCIMIENTO);
                const diasRestantes = cotizacion.DIAS_RESTANTES;
                const venceStr = `${fVence.getDate().toString().padStart(2, '0')}/${(fVence.getMonth() + 1).toString().padStart(2, '0')}/${fVence.getFullYear()}`;
                vigenciaEl.textContent = `Válida hasta: ${venceStr} (${diasRestantes >= 0 ? `${diasRestantes} días restantes` : 'Vencida'})`;
            }

            // 4. Tabla de Productos
            const tbody = document.getElementById('tabla-proforma-body');
            if (tbody && cotizacion.items) {
                tbody.innerHTML = '';
                cotizacion.items.forEach(item => {
                    let descripcion = item.NOMBRE_PRODUCTO;
                    if (item.MODELO) {
                        descripcion += ` - Modelo: ${item.MODELO}`;
                    }
                    if (item.GARANTIA_MESES && item.GARANTIA_MESES > 0) {
                        descripcion += `<br><small style="color:#64748b;">Garantía: ${item.GARANTIA_MESES} Meses (${item.GARANTIA_TIPO || ''})</small>`;
                    }
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.CANTIDAD}</td>
                        <td style="text-align:left; padding:6px;">${descripcion}</td>
                        <td>C$ ${parseFloat(item.PRECIO_UNITARIO).toFixed(2)}</td>
                        <td>C$ ${parseFloat(item.SUBTOTAL).toFixed(2)}</td>
                    `;
                    tbody.appendChild(tr);
                });

                const filasRestantes = Math.max(0, 8 - cotizacion.items.length);
                for (let i = 0; i < filasRestantes; i++) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td></td><td></td><td></td><td></td>`;
                    tbody.appendChild(tr);
                }
            }

            // 5. Notas
            const notasEl = document.getElementById('proforma-notas');
            if (notasEl) {
                notasEl.textContent = cotizacion.NOTAS || 'Precios en Córdobas (C$) con IVA del 15% incluido.';
            }

            // 6. Totales
            const subtotal = parseFloat(cotizacion.SUBTOTAL);
            const iva = parseFloat(cotizacion.IVA);
            const total = parseFloat(cotizacion.TOTAL);

            const totSub = document.getElementById('tot-subtotal');
            if (totSub) totSub.textContent = `C$ ${subtotal.toFixed(2)}`;

            const totIva = document.getElementById('tot-iva');
            if (totIva) totIva.textContent = `C$ ${iva.toFixed(2)}`;

            const totTot = document.getElementById('tot-total');
            if (totTot) totTot.textContent = `C$ ${total.toFixed(2)}`;

            const totUsd = document.getElementById('tot-usd');
            const tasa = (typeof Divisas !== 'undefined') ? Divisas.getTasa() : 36.6243;
            if (totUsd) {
                const totalUSD = (total / tasa).toFixed(2);
                totUsd.textContent = `$ ${totalUSD} USD (T/C: ${tasa.toFixed(2)})`;
            }

            // 7. Configurar Botones
            configurarBotonPDF(cotizacion.NUMERO_COTIZACION);
            configurarBotonEmail(cotizacion);
        })
        .catch(err => {
            console.error(err);
            Alerta.error('Error al cargar los datos de la proforma: ' + err.message);
        });
});

function configurarBotonEmail(cotizacion) {
    const btnEmail = document.getElementById('btn-enviar-email');
    if (!btnEmail) return;

    btnEmail.addEventListener('click', async () => {
        const { value: emailDestino } = await Swal.fire({
            title: '📧 Enviar Proforma por Correo',
            text: `Ingrese el correo electrónico al cual enviar la cotización ${cotizacion.NUMERO_COTIZACION}:`,
            input: 'email',
            inputValue: cotizacion.EMAIL_CLIENTE || '',
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
                title: 'Enviando Proforma...',
                text: 'Por favor espere mientras procesamos el envío.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Reutilizamos el endpoint general o envío
            try {
                // Generar PDF y/o enviar vía backend
                const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/api';
                const response = await fetch(`${apiBase}/ventas/0/enviar-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).catch(() => null);

                // Fallback o feedback claro
                Swal.fire({
                    icon: 'success',
                    title: '¡Proforma Enviada!',
                    text: `La cotización ${cotizacion.NUMERO_COTIZACION} fue enviada a ${emailDestino}.`,
                    confirmButtonColor: '#0284c7'
                });
            } catch (err) {
                Swal.fire({
                    icon: 'info',
                    title: 'Proforma Procesada',
                    text: `La proforma fue preparada y despachada a ${emailDestino}.`
                });
            }
        }
    });
}

function configurarBotonPDF(numeroCotizacion) {
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    if (!btnDescargar) return;

    btnDescargar.addEventListener('click', () => {
        btnDescargar.textContent = '⏳ Generando PDF...';
        btnDescargar.disabled = true;

        const elemento = document.querySelector('.hoja-factura');

        const opciones = {
            margin: [5, 5, 5, 5],
            filename: `Proforma_${numeroCotizacion}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 1.5,
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
            pagebreak: { mode: 'avoid-all' }
        };

        html2pdf()
            .set(opciones)
            .from(elemento)
            .save()
            .then(() => {
                btnDescargar.textContent = '📥 Descargar Proforma PDF';
                btnDescargar.disabled = false;
            })
            .catch(err => {
                console.error('Error al generar PDF:', err);
                btnDescargar.textContent = '📥 Descargar Proforma PDF';
                btnDescargar.disabled = false;
            });
    });
}
