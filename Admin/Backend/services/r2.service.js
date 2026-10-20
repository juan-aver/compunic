/**
 * @file r2.service.js
 * @description Servicio para subir y gestionar archivos e imágenes en Cloudflare R2 (S3 compatible).
 */

const path = require('path');

let s3Client = null;

/**
 * Verifica si las variables de entorno para Cloudflare R2 están presentes.
 */
function isR2Configured() {
    return Boolean(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
}

/**
 * Obtiene o instancia el cliente S3 para Cloudflare R2.
 */
function getS3Client() {
    if (!isR2Configured()) {
        throw new Error('Cloudflare R2 no está configurado en las variables de entorno.');
    }

    if (!s3Client) {
        const { S3Client } = require('@aws-sdk/client-s3');
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
    }

    return s3Client;
}

/**
 * Construye la URL pública del archivo subido a R2.
 * @param {string} key Ruta/nombre del archivo dentro del bucket.
 * @returns {string} URL pública accesible.
 */
function getPublicUrl(key) {
    if (process.env.R2_PUBLIC_URL) {
        const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
        return `${baseUrl}/${key}`;
    }
    // Fallback al endpoint de R2 directo
    return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Sube un archivo a una carpeta específica en Cloudflare R2.
 * @param {Object} options
 * @param {Buffer} options.buffer Buffer con los bytes del archivo.
 * @param {string} options.originalname Nombre original del archivo.
 * @param {string} options.mimetype Tipo MIME (ej: image/jpeg, application/pdf).
 * @param {string} [options.carpeta='general'] Nombre de la carpeta destino dentro del bucket (ej: 'productos', 'servicios', 'comprobantes').
 * @returns {Promise<string>} URL pública de la imagen subida.
 */
async function subirArchivoR2({ buffer, originalname, mimetype, carpeta = 'general' }) {
    const s3 = getS3Client();
    const { PutObjectCommand } = require('@aws-sdk/client-s3');

    const ext = path.extname(originalname).toLowerCase();
    const sanitizedBase = path.basename(originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
    const uniqueName = `${Date.now()}_${sanitizedBase}${ext}`;

    // Normalizar la carpeta para evitar barras dobles
    const cleanCarpeta = carpeta.replace(/^\/+|\/+$/g, '');
    const key = cleanCarpeta ? `${cleanCarpeta}/${uniqueName}` : uniqueName;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype || 'application/octet-stream',
    });

    await s3.send(command);

    return getPublicUrl(key);
}

/**
 * Elimina un archivo de Cloudflare R2 a partir de su URL pública o su Key.
 * @param {string} urlOrKey URL pública completa o la ruta relativa (key) en el bucket.
 */
async function eliminarArchivoR2(urlOrKey) {
    if (!urlOrKey || !isR2Configured()) return;

    try {
        let key = urlOrKey;
        if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
            const urlObj = new URL(urlOrKey);
            key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
        }

        const s3 = getS3Client();
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await s3.send(command);
    } catch (error) {
        console.error('Error al eliminar archivo de R2:', error.message);
    }
}

module.exports = {
    isR2Configured,
    subirArchivoR2,
    eliminarArchivoR2,
    getPublicUrl
};
