/*
 * ==========================================
 * MÓDULO: email.service.js
 * PROPÓSITO: Lógica clave del sistema modularizado.
 * FECHA: 8 de abril de 2026
 * ==========================================
 * Comentario mental: Asegurarme de no romper el frontend cuando 
 * cambie esto de nuevo. Funciona, no lo toques mucho 🙏.
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
    // Empieza la magia ✨

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
 * Enviar correo con factura adjunta
 * @param {string} email - Correo del destinatario
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} numeroFactura - Número de factura
 * @param {Buffer} pdfBuffer - Buffer del PDF de la factura
 * @param {number} total - Total de la compra
 */
async function sendInvoiceEmail(email, nombreCliente, numeroFactura, pdfBuffer, total) {
    const mailOptions = {
        from: `"COMPUNIC - Ventas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Factura ${numeroFactura} - Compra Confirmada`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    .total { font-size: 24px; color: #667eea; font-weight: bold; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ ¡Compra Confirmada!</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>${nombreCliente}</strong>,</p>
                        
                        <div class="success-box">
                            <strong>🎉 Tu compra ha sido procesada exitosamente</strong>
                        </div>
                        
                        <p>Gracias por tu compra en COMPUNIC. Adjunto encontrarás tu factura electrónica.</p>
                        
                        <div class="info-box">
                            <p><strong>Número de Factura:</strong> ${numeroFactura}</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-NI', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
                            <p><strong>Total:</strong> <span class="total">C$ ${total.toFixed(2)}</span></p>
                        </div>
                        
                        <p><strong>📎 Factura Adjunta:</strong></p>
                        <p>Hemos adjuntado tu factura en formato PDF a este correo. Puedes descargarla y guardarla para tus registros.</p>
                        
                        <p>Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.</p>
                        
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} COMPUNIC - Sistema de Gestión</p>
                            <p>Managua, Nicaragua | Tel: (505) 8289-0773</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        attachments: [
            {
                filename: `Factura_${numeroFactura}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Factura enviada por email:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando factura por email:', error);
        throw new Error('No se pudo enviar la factura por email');
    }
}

module.exports = {
    sendPasswordResetEmail,
    verifyEmailService,
    sendAccountLockoutEmail,
    sendInvoiceEmail
};
