/*
 * ==========================================
 * MÓDULO: email.service.js
 * PROPÓSITO: Servicio para el envío de correos electrónicos.
 * FECHA: 8 de abril de 2026
 * ==========================================
 */
const nodemailer = require('nodemailer');

/**
 * Servicio de envío de correos electrónicos
 * Configurado para Gmail
 */

// Crear transportador de correo
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Enviar correo de recuperación de contraseña
 * @param {string} email - Correo del destinatario
 * @param {string} token - Token de recuperación
 * @param {string} nombreCompleto - Nombre del empleado
 */
async function sendPasswordResetEmail(email, token, nombreCompleto) {

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    const mailOptions = {
        from: `"COMPUNIC - Sistema" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Recuperación de Contraseña - COMPUNIC',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                    .button:hover { background: #5568d3; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Recuperación de Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${nombreCompleto}</strong>,</p>
                        
                        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema COMPUNIC.</p>
                        
                        <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                        </div>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
                            ${resetUrl}
                        </p>
                        
                        <div class="warning">
                            <strong>⏰ Importante:</strong> Este enlace es válido por <strong>1 hora</strong> y solo puede usarse una vez.
                        </div>
                        
                        <p><strong>¿No solicitaste este cambio?</strong></p>
                        <p>Si no fuiste tú quien solicitó restablecer la contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual no será modificada.</p>
                        
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} COMPUNIC - Sistema de Gestión</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        throw new Error('No se pudo enviar el correo de recuperación');
    }
}

/**
 * Verificar configuración del servicio de email
 */
async function verifyEmailService() {
    try {
        await transporter.verify();
        console.log('✅ Servicio de email configurado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en configuración de email:', error.message);
        return false;
    }
}



/**
 * Enviar correo de alerta por bloqueo de cuenta
 * @param {string} email - Correo del destinatario
 * @param {string} nombreCompleto - Nombre del empleado
 */
async function sendAccountLockoutEmail(email, nombreCompleto) {
    const mailOptions = {
        from: `"COMPUNIC - Seguridad" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '⚠️ Alerta de Seguridad: Cuenta Bloqueada Temporalmente',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #fff5f5; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ffe3e3; }
                    .warning-box { background: white; border-left: 5px solid #ff4b2b; padding: 15px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Alerta de Seguridad</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${nombreCompleto}</strong>,</p>
                        
                        <p>Nuestro sistema ha detectado <strong>3 intentos fallidos de inicio de sesión</strong> consecutivos con tu cuenta.</p>
                        
                        <div class="warning-box">
                            <h3>🔒 Tu cuenta ha sido bloqueada temporalmente</h3>
                            <p>Por tu seguridad, el acceso se ha restringido durante <strong>5 minutos</strong>.</p>
                        </div>

                        <p><strong>Recomendaciones:</strong></p>
                        <ul>
                            <li>Verifica que estás usando la contraseña correcta.</li>
                            <li>Comprueba que la tecla "Bloq Mayús" no esté activada.</li>
                            <li>Si olvidaste tu contraseña, puedes usar la opción "Recuperar contraseña".</li>
                        </ul>
                        
                        <p>Si no fuiste tú quien intentó acceder, te recomendamos cambiar tu contraseña inmediatamente una vez recuperes el acceso.</p>
                        
                        <div class="footer">
                            <p>Este es un mensaje automático de seguridad del sistema COMPUNIC.</p>
                            <p>&copy; ${new Date().getFullYear()} COMPUNIC - Seguridad</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de alerta enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando correo de alerta:', error);
        throw new Error('No se pudo enviar el correo de alerta');
    }
}

/**
 * Enviar correo con factura detallada y PDF opcional adjunto
 * @param {string} email - Correo del destinatario
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} numeroFactura - Número de factura
 * @param {Buffer|null} pdfBuffer - Buffer opcional del PDF de la factura
 * @param {number} total - Total de la compra
 * @param {Array} items - Lista opcional de items para desglose
 */
async function sendInvoiceEmail(email, nombreCliente, numeroFactura, pdfBuffer, total, items = []) {
    let itemsHtml = '';
    if (items && items.length > 0) {
        itemsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px; border-bottom: 2px solid #cbd5e1;">Cant</th>
                        <th style="padding: 8px; border-bottom: 2px solid #cbd5e1;">Descripción</th>
                        <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Precio</th>
                        <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(it => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-weight: bold;">${it.CANTIDAD || it.cantidad || 1}</td>
                            <td style="padding: 8px;">
                                ${it.NOMBRE_PRODUCTO || it.nombre || 'Producto'}
                                ${it.NUMEROS_SERIE ? `<br><span style="font-size: 11px; color: #64748b;">S/N: ${it.NUMEROS_SERIE}</span>` : ''}
                            </td>
                            <td style="padding: 8px; text-align: right;">C$ ${parseFloat(it.PRECIO_UNITARIO || it.precio_unitario || it.precio_venta || 0).toFixed(2)}</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">C$ ${parseFloat(it.SUBTOTAL || it.subtotal || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    const attachments = [];
    if (pdfBuffer) {
        attachments.push({
            filename: `Factura_${numeroFactura}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
    }

    const mailOptions = {
        from: `"COMPUNIC - Facturación" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🧾 Factura Electrónica ${numeroFactura} - COMPUNIC`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin:0; padding:0; background: #f8fafc; }
                    .container { max-width: 620px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .success-box { background: #dcfce7; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 15px 0; border-radius: 4px; color: #15803d; font-weight: 500; }
                    .info-box { background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
                    .total-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: right; }
                    .total { font-size: 22px; color: #1d4ed8; font-weight: bold; }
                    .footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 20px; background: #f1f5f9; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🧾 Factura Electrónica</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">COMPUNIC - Soluciones Informáticas</p>
                    </div>
                    <div class="content">
                        <p>Estimado(a) <strong>${nombreCliente}</strong>,</p>
                        
                        <div class="success-box">
                            ✅ Su compra ha sido registrada y facturada exitosamente.
                        </div>
                        
                        <div class="info-box">
                            <table style="width:100%; font-size: 14px;">
                                <tr>
                                    <td><strong>N° Factura:</strong></td>
                                    <td style="text-align:right; font-weight:bold; color:#1e40af;">${numeroFactura}</td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha de Emisión:</strong></td>
                                    <td style="text-align:right;">${new Date().toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td><strong>RUC Emisor:</strong></td>
                                    <td style="text-align:right;">0012705950036G</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${itemsHtml}
                        
                        <div class="total-box">
                            <span style="font-size: 14px; color: #64748b;">Monto Total (IVA Incluido):</span><br>
                            <span class="total">C$ ${parseFloat(total).toFixed(2)}</span>
                        </div>
                        
                        <div style="background: #f8fafc; border-left: 3px solid #64748b; padding: 10px 14px; font-size: 11px; color: #64748b; margin-top: 20px;">
                            <strong>Garantía:</strong> Todos los productos cuentan con respaldo y soporte técnico de COMPUNIC según las condiciones de fábrica. Guarde este correo como comprobante digital.
                        </div>
                    </div>
                    <div class="footer">
                        <p style="margin: 0 0 5px;"><strong>COMPUNIC</strong> | Colonia Maestro Gabriel, Managua, Nicaragua</p>
                        <p style="margin: 0;">Tel: (505) 8568-0614 | Email: compunicventas@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        attachments
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Factura enviada por email a:', email, 'ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando factura por email:', error);
        throw new Error('No se pudo enviar la factura por email: ' + error.message);
    }
}

/**
 * Enviar proforma / cotización comercial por correo electrónico (REQ-FR-19, UR-08)
 */
async function sendCotizacionEmail(email, nombreCliente, numeroCotizacion, fechaVencimiento, total, items = [], notas = '') {
    const itemsHtml = items.map(it => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; font-weight: bold;">${it.CANTIDAD || it.cantidad || 1}</td>
            <td style="padding: 8px;">
                ${it.NOMBRE_PRODUCTO || it.nombre || 'Producto'}
                ${it.MODELO ? `<br><span style="font-size: 11px; color: #64748b;">Mod: ${it.MODELO}</span>` : ''}
            </td>
            <td style="padding: 8px; text-align: right;">C$ ${parseFloat(it.PRECIO_UNITARIO || it.precio_unitario || 0).toFixed(2)}</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">C$ ${parseFloat(it.SUBTOTAL || it.subtotal || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    const subtotal = total / 1.15;
    const iva = total - subtotal;

    const mailOptions = {
        from: `"COMPUNIC - Cotizaciones" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📋 Proforma Comercial ${numeroCotizacion} - COMPUNIC`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin:0; padding:0; background: #f8fafc; }
                    .container { max-width: 620px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .info-box { background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
                    .total-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 15px 0; }
                    .footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 20px; background: #f1f5f9; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">📋 Proforma Comercial</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">COMPUNIC - Soluciones Informáticas</p>
                    </div>
                    <div class="content">
                        <p>Estimado(a) <strong>${nombreCliente}</strong>,</p>
                        <p>Agradecemos su interés en nuestros productos. A continuación le presentamos la cotización solicitada:</p>
                        
                        <div class="info-box">
                            <table style="width:100%; font-size: 14px;">
                                <tr>
                                    <td><strong>N° Cotización:</strong></td>
                                    <td style="text-align:right; font-weight:bold; color:#0284c7;">${numeroCotizacion}</td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha de Emisión:</strong></td>
                                    <td style="text-align:right;">${new Date().toLocaleDateString('es-NI')}</td>
                                </tr>
                                <tr>
                                    <td><strong>Válida hasta:</strong></td>
                                    <td style="text-align:right; font-weight: bold; color: #e11d48;">${new Date(fechaVencimiento).toLocaleDateString('es-NI')}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
                            <thead>
                                <tr style="background: #f1f5f9; text-align: left;">
                                    <th style="padding: 8px; border-bottom: 2px solid #cbd5e1;">Cant</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #cbd5e1;">Descripción</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Unitario</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        
                        <div class="total-box">
                            <table style="width: 100%; font-size: 14px;">
                                <tr>
                                    <td>Subtotal:</td>
                                    <td style="text-align: right; font-weight: 500;">C$ ${subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>IVA (15%):</td>
                                    <td style="text-align: right; font-weight: 500;">C$ ${iva.toFixed(2)}</td>
                                </tr>
                                <tr style="border-top: 1px solid #bae6fd; font-size: 18px; font-weight: bold; color: #0369a1;">
                                    <td style="padding-top: 8px;">TOTAL:</td>
                                    <td style="padding-top: 8px; text-align: right;">C$ ${parseFloat(total).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>

                        ${notas ? `<p style="font-size: 12px; color: #475569; background: #f8fafc; padding: 10px; border-radius: 6px;"><strong>Notas:</strong> ${notas}</p>` : ''}

                        <p style="font-size: 12px; color: #64748b;">
                            * Esta cotización no reserva inventario. Los precios y existencias están sujetos a cambio tras el vencimiento de la proforma.
                        </p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0 0 5px;"><strong>COMPUNIC</strong> | Colonia Maestro Gabriel, Managua, Nicaragua</p>
                        <p style="margin: 0;">Tel: (505) 8568-0614 | Email: compunicventas@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Proforma enviada por email a:', email, 'ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando cotización por email:', error);
        throw new Error('No se pudo enviar la cotización por email: ' + error.message);
    }
}

/**
 * Enviar correo de bienvenida a nuevo empleado para crear su contraseña
 * @param {string} email - Correo del destinatario
 * @param {string} token - Token de creación de contraseña
 * @param {string} nombreCompleto - Nombre del empleado
 * @param {string} rol - Rol asignado (ADMIN/VENDEDOR)
 */
async function sendNewEmployeePasswordEmail(email, token, nombreCompleto, rol) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}&welcome=1`;

    const rolNombres = {
        'ADMIN': 'Administrador',
        'VENDEDOR': 'Vendedor',
        'CAJERO': 'Cajero',
        'TECNICO': 'Técnico',
        'TEMPORAL': 'Técnico Temporal'
    };
    const rolTexto = rolNombres[rol] || rol;

    const mailOptions = {
        from: `"COMPUNIC - Sistema" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 ¡Bienvenido a COMPUNIC! - Crea tu contraseña',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                    .button:hover { background: #218838; }
                    .info-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 ¡Bienvenido a COMPUNIC!</h1>
                        <p style="margin: 0; font-size: 16px;">Sistema de Gestión Empresarial</p>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${nombreCompleto}</strong>,</p>
                        
                        <p>Has sido registrado en el sistema COMPUNIC como <strong>${rolTexto}</strong>.</p>
                        
                        <div class="info-box">
                            <strong>🔐 Crea tu contraseña para activar tu cuenta</strong>
                            <p>Para comenzar a usar el sistema, necesitas crear una contraseña segura.</p>
                        </div>
                        
                        <p>Haz clic en el siguiente botón para crear tu contraseña:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Crear Mi Contraseña</a>
                        </div>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
                            ${resetUrl}
                        </p>
                        
                        <div class="warning">
                            <strong>⏰ Importante:</strong> Este enlace es válido por <strong>2 horas</strong> y solo puede usarse una vez. Tu cuenta se activará automáticamente cuando crees tu contraseña.
                        </div>
                        
                        <p><strong>¿Necesitas ayuda?</strong></p>
                        <p>Si tienes problemas para crear tu contraseña, contacta al administrador del sistema.</p>
                        
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} COMPUNIC - Sistema de Gestión</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de bienvenida enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando correo de bienvenida:', error);
        throw new Error('No se pudo enviar el correo de bienvenida');
    }
}

/**
 * Email: Pedido recibido — pendiente de verificación de pago
 * Detecta automáticamente si es pago en físico o transferencia bancaria.
 */
async function sendPedidoPendienteEmail(email, nombreCliente, numeroFactura, total, metodoPago) {
    const datosPayload = {
        'Depósito Bancario':     { banco: 'BANPRO', cuenta: '1001-020-502133-2', titular: 'COMPUNIC S.A.', tipo: 'Cuenta Corriente en Córdobas' },
        'Transferencia Bancaria': { banco: 'BANPRO', cuenta: '1001-020-502133-2', titular: 'COMPUNIC S.A.', tipo: 'Cuenta Corriente en Córdobas' },
        'SINPE / Transferencia':  { banco: 'BAC',    cuenta: '357-001234-5',       titular: 'COMPUNIC S.A.', tipo: 'Cuenta de Ahorros' }
    };

    // Detectar si el cliente eligió pago en tienda / efectivo
    const m = (metodoPago || '').toLowerCase();
    const esFisico = m.includes('efectivo') || m.includes('entrega') || m.includes('retirar') ||
                     m.includes('fisico') || m.includes('físico') || m.includes('cash') || m.includes('presencial');

    const datos = datosPayload[metodoPago] || datosPayload['Depósito Bancario'];

    // Bloque de contenido principal del email según tipo de pago
    const contenidoPago = esFisico ? `
        <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:20px;border-radius:8px;margin:20px 0">
            <h3 style="margin:0 0 10px;color:#065f46">💵 Instrucciones para pago en tienda</h3>
            <p style="margin:0;font-size:14px;color:#064e3b">
                Elegiste pagar en <strong>efectivo al retirar en nuestra tienda</strong>. No necesitas hacer ningún depósito ni subir comprobante.
            </p>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b;width:45%">📋 Nº de Pedido</td><td style="font-weight:700">${numeroFactura}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b">💳 Método</td><td style="font-weight:700">${metodoPago}</td></tr>
                <tr><td style="padding:8px 0;font-size:14px;color:#64748b">💰 Total a pagar</td><td style="font-weight:700;font-size:18px;color:#1d4ed8">C$ ${parseFloat(total).toFixed(2)}</td></tr>
            </table>
        </div>
        <p><strong>¿Qué necesitas hacer?</strong></p>
        <ol style="counter-reset:step;list-style:none;padding:0;margin:0">
            <li style="display:flex;align-items:flex-start;gap:12px;margin:10px 0;font-size:14px"><span style="background:#10b981;color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:12px">1</span>Lleva tu número de pedido <strong>${numeroFactura}</strong> cuando vengas a recoger</li>
            <li style="display:flex;align-items:flex-start;gap:12px;margin:10px 0;font-size:14px"><span style="background:#10b981;color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:12px">2</span>Paga en caja el monto exacto de <strong>C$ ${parseFloat(total).toFixed(2)}</strong></li>
            <li style="display:flex;align-items:flex-start;gap:12px;margin:10px 0;font-size:14px"><span style="background:#10b981;color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:12px">3</span>Recibirás un email de confirmación una vez el cajero registre tu pago</li>
        </ol>
        <div style="background:#fff7ed;border-radius:8px;padding:12px 16px;margin:18px 0;font-size:13px;color:#92400e">
            📍 <strong>Dirección:</strong> COMPUNIC, Managua, Nicaragua — Lunes a Sábado 8am–6pm
        </div>` :
    `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b;width:45%">📋 Nº de Pedido</td><td style="font-weight:700">${numeroFactura}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b">💳 Método</td><td style="font-weight:700">${metodoPago}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b">🏦 Banco</td><td style="font-weight:700">${datos.banco}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px;color:#64748b">📁 Tipo de cuenta</td><td style="font-weight:700">${datos.tipo}</td></tr>
                <tr><td style="padding:8px 0;font-size:14px;color:#64748b">👤 Titular</td><td style="font-weight:700">${datos.titular}</td></tr>
            </table>
        </div>
        <p style="color:#64748b;font-size:13px;margin-bottom:4px">Número de cuenta:</p>
        <div style="background:#0f172a;color:#7dd3fc;padding:14px 18px;border-radius:6px;font-family:monospace;font-size:16px;letter-spacing:2px;text-align:center;margin:10px 0">${datos.cuenta}</div>
        <div style="background:#eff6ff;border-radius:8px;padding:14px 18px;font-size:18px;font-weight:700;color:#1d4ed8;text-align:center;margin:18px 0">Total a depositar: C$ ${parseFloat(total).toFixed(2)}</div>
        <p><strong>¿Cómo confirmar tu pago?</strong></p>
        <ol style="list-style:decimal;padding-left:20px;font-size:14px">
            <li>Realiza el depósito o transferencia por <strong>C$ ${parseFloat(total).toFixed(2)}</strong></li>
            <li>Toma una foto o captura pantalla del comprobante</li>
            <li>Sube tu comprobante desde la página de tu pedido</li>
            <li>Verificaremos tu pago en menos de <strong>2 horas hábiles</strong></li>
        </ol>
        <div style="text-align:center;margin:24px 0">
            <a href="${process.env.FRONTEND_URL}/Store/views/order-confirmation.html?order=${numeroFactura.replace('WEB-','')}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
                📎 Subir Comprobante de Pago
            </a>
        </div>`;

    const mailOptions = {
        from: `"COMPUNIC - Tienda" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: esFisico
            ? `🛍️ Pedido ${numeroFactura} recibido — Paga al retirar en tienda`
            : `⏳ Pedido ${numeroFactura} recibido — Pendiente de pago`,
        html: `<!DOCTYPE html><html><head><style>
            body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
            .wrap{max-width:600px;margin:0 auto;background:#fff}
            .header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;padding:32px 30px;text-align:center}
            .header h1{margin:0 0 6px;font-size:22px;font-weight:700}
            .header p{margin:0;opacity:.8;font-size:14px}
            .body{padding:28px 30px}
            .alert-box{background:#fff7ed;border-left:4px solid #f97316;padding:16px 18px;border-radius:6px;margin:20px 0}
            .footer{background:#f8fafc;padding:20px 30px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
        </style></head><body><div class="wrap">
            <div class="header">
                <h1>⚡ COMPUNIC</h1>
                <p>${esFisico ? 'Tu pedido fue recibido — Ven a pagar en tienda' : 'Tu pedido fue recibido — Realiza tu pago para confirmarlo'}</p>
            </div>
            <div class="body">
                <p>Hola <strong>${nombreCliente}</strong>,</p>
                <p>Recibimos tu pedido correctamente. Elegiste pagar por <strong>${metodoPago}</strong>.</p>
                <div class="alert-box">
                    <strong>⏰ Importante:</strong> Tu pedido se reserva por <strong>48 horas</strong>.
                    Pasado ese tiempo, si no recibimos confirmación de pago, se cancelará automáticamente.
                </div>
                ${contenidoPago}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} COMPUNIC — Managua, Nicaragua | soporte@compunic.com</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        </div></body></html>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email de pedido pendiente:', error);
        throw error;
    }
}

/**
 * Email: Pago confirmado — pedido aprobado
 * @param {string} metodoPago - Opcional, para personalizar el mensaje según el método
 */
async function sendPagoConfirmadoEmail(email, nombreCliente, numeroFactura, total, metodoPago = '') {
    const m = (metodoPago || '').toLowerCase();
    const esFisico = m.includes('efectivo') || m.includes('entrega') || m.includes('retirar') ||
                     m.includes('fisico') || m.includes('físico') || m.includes('cash') || m.includes('presencial');

    const mensajePrincipal = esFisico
        ? `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:18px;border-radius:6px;margin:20px 0">
               <strong>🎉 ¡Pago registrado!</strong> Tu pago en efectivo ha sido confirmado por nuestro equipo en tienda.
           </div>
           <p>Puedes pasar a recoger tus productos cuando gustes. Presenta tu número de pedido en caja.</p>`
        : `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:18px;border-radius:6px;margin:20px 0">
               <strong>🎉 ¡Excelente noticia!</strong> Hemos verificado tu comprobante de pago y tu pedido ha sido <strong>aprobado</strong>.
           </div>
           <p>Nos pondremos en contacto contigo para coordinar la entrega o retiro en tienda. Si tienes alguna pregunta, escríbenos.</p>`;

    const mailOptions = {
        from: `"COMPUNIC - Ventas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ ¡Pago confirmado! Pedido ${numeroFactura} aprobado`,
        html: `<!DOCTYPE html><html><head><style>
            body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
            .wrap{max-width:600px;margin:0 auto;background:#fff}
            .header{background:linear-gradient(135deg,#065f46 0%,#059669 100%);color:#fff;padding:32px 30px;text-align:center}
            .body{padding:28px 30px}
            .info-card{background:#f8fafc;border:1px solid #d1fae5;border-radius:8px;padding:18px;margin:20px 0}
            .footer{background:#f8fafc;padding:20px 30px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
        </style></head><body><div class="wrap">
            <div class="header">
                <h1>✅ ¡Pago Confirmado!</h1>
                <p>Tu pedido ha sido aprobado</p>
            </div>
            <div class="body">
                <p>Hola <strong>${nombreCliente}</strong>,</p>
                ${mensajePrincipal}
                <div class="info-card">
                    <p><strong>Nº de Pedido:</strong> ${numeroFactura}</p>
                    <p><strong>Total:</strong> C$ ${parseFloat(total).toFixed(2)}</p>
                    ${metodoPago ? `<p><strong>Método de pago:</strong> ${metodoPago}</p>` : ''}
                    <p><strong>Estado:</strong> ✅ Confirmado</p>
                </div>
                <p>¡Gracias por confiar en COMPUNIC!</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} COMPUNIC — Managua, Nicaragua</p>
            </div>
        </div></body></html>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email de pago confirmado:', error);
        throw error;
    }
}

/**
 * Email: Pago rechazado — con motivo
 */
async function sendPagoRechazadoEmail(email, nombreCliente, numeroFactura, motivo) {
    const mailOptions = {
        from: `"COMPUNIC - Ventas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `⚠️ Problema con tu pago — Pedido ${numeroFactura}`,
        html: `<!DOCTYPE html><html><head><style>
            body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
            .wrap{max-width:600px;margin:0 auto;background:#fff}
            .header{background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);color:#fff;padding:32px 30px;text-align:center}
            .body{padding:28px 30px}
            .warn-box{background:#fef2f2;border-left:4px solid #dc2626;padding:18px;border-radius:6px;margin:20px 0}
            .motivo-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0}
            .steps{list-style:decimal;padding-left:20px;font-size:14px}
            .steps li{margin:8px 0}
            .footer{background:#f8fafc;padding:20px 30px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
        </style></head><body><div class="wrap">
            <div class="header">
                <h1>⚠️ Pago No Verificado</h1>
                <p>Pedido ${numeroFactura}</p>
            </div>
            <div class="body">
                <p>Hola <strong>${nombreCliente}</strong>,</p>
                <div class="warn-box">
                    Hemos revisado tu comprobante de pago, pero no fue posible verificarlo correctamente.
                </div>
                <div class="motivo-box">
                    <strong>Motivo:</strong><br>
                    ${motivo}
                </div>
                <p><strong>¿Qué puedes hacer?</strong></p>
                <ol class="steps">
                    <li>Verifica que el monto depositado sea exacto</li>
                    <li>Asegúrate de subir una imagen clara del comprobante</li>
                    <li>Vuelve a tu pedido y sube el comprobante correcto</li>
                    <li>Si tienes dudas, contáctanos por WhatsApp o email</li>
                </ol>
                <p>Pedimos disculpas por los inconvenientes. Estamos aquí para ayudarte.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} COMPUNIC — soporte@compunic.com</p>
            </div>
        </div></body></html>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando email de rechazo:', error);
        throw error;
    }
}

module.exports = {
    sendPasswordResetEmail,
    verifyEmailService,
    sendAccountLockoutEmail,
    sendInvoiceEmail,
    sendCotizacionEmail,
    sendNewEmployeePasswordEmail,
    sendPedidoPendienteEmail,
    sendPagoConfirmadoEmail,
    sendPagoRechazadoEmail
};

