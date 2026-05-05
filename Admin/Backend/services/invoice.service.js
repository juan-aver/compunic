/*
 * ¡Puf! Qué noche tan larga programando esto ☕.
 * Módulo: invoice.service.js
 * Descripción: Lógica clave del sistema modularizado.
 * Última actualización: 8 de abril de 2026 a las 3:00 AM (probablemente).
 * Nota: Si vas a tocar aquí, ten cuidado con las dependencias circulares.
 */
const PDFDocument = require('pdfkit');

/**
 * Servicio para generar facturas en PDF
 * Diseño profesional basado en template de COMPUNIC
 */

/**
 * Generar factura en PDF
 * @param {Object} invoiceData - Datos de la factura
 * @param {string} invoiceData.factura - Número de factura
 * @param {string} invoiceData.fecha - Fecha de la venta
 * @param {Object} invoiceData.cliente - Información del cliente
 * @param {string} invoiceData.cliente.nombre - Nombre del cliente
 * @param {string} invoiceData.cliente.email - Email del cliente
 * @param {string} invoiceData.cliente.telefono - Teléfono del cliente
 * @param {Array} invoiceData.productos - Lista de productos
 * @param {number} invoiceData.total - Total de la venta
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
async function generateInvoicePDF(invoiceData) {
    // Validamos primero, no queremos que nos tumben el server 😅

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 40,
                size: 'LETTER'
            });
            const chunks = [];

            // Capturar el PDF en memoria
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ===== ENCABEZADO IZQUIERDO =====
            doc.fontSize(20)
                .fillColor('#1e3a8a')
                .text('COMPUNIC', 40, 40, { width: 250 });

            doc.fontSize(16)
                .fillColor('#1e3a8a')
                .text('FACTURA DE', 40, 70, { width: 250 });

            doc.fontSize(16)
                .fillColor('#1e3a8a')
                .text('CLIENTES', 40, 90, { width: 250 });

            doc.fontSize(9)
                .fillColor('#666')
                .text('SOLUCIONES', 40, 115, { width: 250 })
                .text('INFORMÁTICAS', 40, 127, { width: 250 });

            // ===== ENCABEZADO CENTRO =====
            doc.fontSize(14)
                .fillColor('#1e3a8a')
                .text('COMPUNIC FACTURA DE', 200, 40, { width: 200, align: 'center' });

            doc.fontSize(14)
                .fillColor('#1e3a8a')
                .text('CLIENTES', 200, 58, { width: 200, align: 'center' });

            doc.fontSize(8)
                .fillColor('#666')
                .text('RUC: 001270576003GG', 200, 80, { width: 200, align: 'center' })
                .text('Colonia Maestro Gabriel, semáforos del colonial 25 vrs. Oeste, 15 vrs. Sur.', 200, 92, { width: 200, align: 'center' })
                .text('Distrito IV. Managua, Nicaragua | Telf: 8568 0614', 200, 104, { width: 200, align: 'center' })
                .text('Email: Proveedoresventas@gmail.com', 200, 116, { width: 200, align: 'center' })
                .text('Venta de equipos informáticos para oficina', 200, 128, { width: 200, align: 'center' });

            // ===== CUADRO DE FACTURA (DERECHA) =====
            // Fondo azul
            doc.rect(450, 40, 125, 25)
                .fill('#1e3a8a');

            doc.fontSize(10)
                .fillColor('#fff')
                .text('FACTURA', 450, 48, { width: 125, align: 'center' });

            // Número de factura
            doc.fontSize(11)
                .fillColor('#dc2626')
                .text(`N° ${invoiceData.factura}`, 450, 70, { width: 125, align: 'center' });

            // Tabla de fecha
            const fechaActual = new Date(invoiceData.fecha);
            doc.rect(450, 95, 125, 50)
                .stroke('#000');

            // Encabezados de fecha
            doc.fontSize(7)
                .fillColor('#000')
                .text('DÍA', 455, 100, { width: 35, align: 'center' })
                .text('MES', 495, 100, { width: 35, align: 'center' })
                .text('AÑO', 535, 100, { width: 35, align: 'center' });

            // Líneas divisorias
            doc.moveTo(490, 95).lineTo(490, 145).stroke();
            doc.moveTo(530, 95).lineTo(530, 145).stroke();
            doc.moveTo(450, 115).lineTo(575, 115).stroke();

            // Valores de fecha
            doc.fontSize(11)
                .fillColor('#000')
                .text(fechaActual.getDate().toString(), 455, 125, { width: 35, align: 'center' })
                .text((fechaActual.getMonth() + 1).toString(), 495, 125, { width: 35, align: 'center' })
                .text(fechaActual.getFullYear().toString(), 535, 125, { width: 35, align: 'center' });

            // ===== SECCIÓN CLIENTE (FONDO AMARILLO) =====
            doc.rect(40, 160, 535, 20)
                .fill('#fbbf24');

            doc.fontSize(10)
                .fillColor('#000')
                .text('CLIENTE', 45, 166);

            // Información del cliente
            doc.fontSize(9)
                .fillColor('#000')
                .text(`Nombre: ${invoiceData.cliente.nombre}`, 45, 190)
                .text(`N° Identificación: -`, 45, 205)
                .text(`N° Contacto: ${invoiceData.cliente.telefono || '-'}`, 45, 220);

            // ===== TABLA DE PRODUCTOS =====
            const tableTop = 250;

            // Encabezados (fondo amarillo)
            doc.rect(40, tableTop, 535, 25)
                .fill('#fbbf24');

            doc.fontSize(9)
                .fillColor('#000')
                .text('CANTIDAD', 45, tableTop + 8, { width: 60, align: 'center' })
                .text('DESCRIPCIÓN', 110, tableTop + 8, { width: 200, align: 'left' })
                .text('VALOR UNITARIO', 315, tableTop + 8, { width: 120, align: 'center' })
                .text('IMPORTE', 440, tableTop + 8, { width: 130, align: 'center' });

            // Líneas de la tabla
            doc.rect(40, tableTop, 535, 25).stroke('#000');
            doc.moveTo(105, tableTop).lineTo(105, tableTop + 25).stroke();
            doc.moveTo(310, tableTop).lineTo(310, tableTop + 25).stroke();
            doc.moveTo(435, tableTop).lineTo(435, tableTop + 25).stroke();

            // Productos
            let yPosition = tableTop + 30;
            const rowHeight = 20;

            invoiceData.productos.forEach((producto) => {
                doc.fontSize(9)
                    .fillColor('#000')
                    .text(producto.cantidad.toString(), 45, yPosition, { width: 60, align: 'center' })
                    .text(producto.nombre, 110, yPosition, { width: 195, align: 'left' })
                    .text(`C$${producto.precio_unitario.toFixed(2)}`, 315, yPosition, { width: 120, align: 'center' })
                    .text(`C$${producto.subtotal.toFixed(2)}`, 440, yPosition, { width: 130, align: 'center' });

                yPosition += rowHeight;
            });

            // Líneas de la tabla de productos
            const tableBottom = yPosition;
            doc.rect(40, tableTop + 25, 535, tableBottom - (tableTop + 25)).stroke('#000');
            doc.moveTo(105, tableTop + 25).lineTo(105, tableBottom).stroke();
            doc.moveTo(310, tableTop + 25).lineTo(310, tableBottom).stroke();
            doc.moveTo(435, tableTop + 25).lineTo(435, tableBottom).stroke();

            // ===== TOTALES =====
            const totalsY = tableBottom + 10;

            // SUBTOTAL
            doc.rect(435, totalsY, 140, 20)
                .fill('#fbbf24');
            doc.fontSize(9)
                .fillColor('#000')
                .text('SUBTOTAL', 440, totalsY + 6, { width: 60, align: 'left' })
                .text(`C$${invoiceData.total.toFixed(2)}`, 505, totalsY + 6, { width: 65, align: 'right' });

            // IVA (15%)
            const iva = invoiceData.total * 0.15;
            doc.rect(435, totalsY + 20, 140, 20)
                .fill('#fbbf24');
            doc.fontSize(9)
                .fillColor('#000')
                .text('IVA (15%)', 440, totalsY + 26, { width: 60, align: 'left' })
                .text(`C$${iva.toFixed(2)}`, 505, totalsY + 26, { width: 65, align: 'right' });

            // TOTAL
            const totalConIva = invoiceData.total + iva;
            doc.rect(435, totalsY + 40, 140, 20)
                .fill('#fbbf24');
            doc.fontSize(10)
                .fillColor('#000')
                .text('TOTAL', 440, totalsY + 46, { width: 60, align: 'left' })
                .text(`C$${totalConIva.toFixed(2)}`, 505, totalsY + 46, { width: 65, align: 'right' });

            // T/C: -
            doc.fontSize(8)
                .fillColor('#666')
                .text('T/C: -', 540, totalsY + 65, { align: 'right' });

            // ===== PIE DE PÁGINA =====
            const footerY = 680;

            // Barra azul inferior
            doc.rect(40, footerY, 535, 30)
                .fill('#1e3a8a');

            doc.fontSize(8)
                .fillColor('#fff')
                .text('Colonia Maestro Gabriel, semáforos del colonial 25 vrs. Oeste, 15 vrs. Sur', 45, footerY + 8, { width: 430, align: 'left' })
                .text('COMPUNIC', 480, footerY + 8, { width: 90, align: 'right' });

            // Finalizar el PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateInvoicePDF
};
