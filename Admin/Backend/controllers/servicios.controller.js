/*
 * Módulo: servicios.controller.js
 * Descripción: Controlador para gestionar las órdenes de servicio técnico.
 */
const Servicio = require('../models/servicios.model');
const AuditoriaModel = require('../models/auditoria.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { isR2Configured, subirArchivoR2, eliminarArchivoR2 } = require('../services/r2.service');

// Configuración de almacenamiento para fotos de evidencia (R2, ImgBB o Local)
let storage;
if (isR2Configured() || process.env.IMGBB_API_KEY) {
    storage = multer.memoryStorage();
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '../uploads/servicios');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, 'evidencia_' + uniqueSuffix + ext);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Función auxiliar para subir a ImgBB si está en producción
async function subirAImgBB(buffer, fileName) {
    const form = new FormData();
    form.append('image', buffer.toString('base64'));
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, form, {
        headers: form.getHeaders()
    });
    return response.data.data.url;
}

const serviciosController = {
    upload: upload,

    getAll: async (req, res) => {
        try {
            const servicios = await Servicio.obtenerTodos();
            res.json(servicios);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getById: async (req, res) => {
        try {
            const servicio = await Servicio.obtenerPorId(req.params.id);
            if (!servicio) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json(servicio);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const { 
                descripcion, direccion, fecha_solicitud, fecha_ejecucion, costo, 
                id_empleado, id_cliente, id_garantia, id_servicio_tipo, 
                id_servicio_estado, notas_tecnicas, calificacion, opinion_cliente 
            } = req.body;

            let evidenciaUrl = req.body.evidencia_url || null;

            if (req.file) {
                if (process.env.IMGBB_API_KEY) {
                    try {
                        evidenciaUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
                    } catch (uploadError) {
                        console.error('Error al subir evidencia a ImgBB:', uploadError);
                        return res.status(500).json({ error: 'Error al subir la imagen de evidencia' });
                    }
                } else {
                    evidenciaUrl = `/uploads/servicios/${req.file.filename}`;
                }
            }

            const fechaCalificacion = calificacion ? new Date() : null;

            const datos = [
                descripcion || null, 
                direccion || null,
                fecha_solicitud || new Date(), 
                fecha_ejecucion || null, 
                parseFloat(costo) || 0.00, 
                id_empleado ? parseInt(id_empleado) : null, 
                parseInt(id_cliente), 
                id_garantia ? parseInt(id_garantia) : null, 
                parseInt(id_servicio_tipo), 
                parseInt(id_servicio_estado),
                evidenciaUrl,
                notas_tecnicas || null,
                calificacion ? parseInt(calificacion) : null,
                opinion_cliente || null,
                fechaCalificacion
            ];

            const result = await Servicio.agregar(datos);
            res.status(201).json({ message: 'Servicio creado exitosamente', id: result.insertId, evidencia_url: evidenciaUrl });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'CREAR',
                tabla: 'SERVICIOS',
                descripcion: `Se creó el servicio #${result.insertId}: "${descripcion?.substring(0, 60) || 'Sin descripción'}"`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error('Error al crear servicio:', err);
            res.status(500).json({ error: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { 
                descripcion, direccion, fecha_solicitud, fecha_ejecucion, costo, 
                id_empleado, id_cliente, id_garantia, id_servicio_tipo, 
                id_servicio_estado, notas_tecnicas, calificacion, opinion_cliente 
            } = req.body;

            // Obtener servicio actual para conservar evidencia previa si no se sube una nueva
            const servicioActual = await Servicio.obtenerPorId(req.params.id);
            if (!servicioActual) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }

            let evidenciaUrl = req.body.evidencia_url !== undefined ? req.body.evidencia_url : servicioActual.EVIDENCIA_URL;

            if (req.file) {
                if (process.env.IMGBB_API_KEY) {
                    try {
                        evidenciaUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
                    } catch (uploadError) {
                        console.error('Error al subir evidencia a ImgBB:', uploadError);
                        return res.status(500).json({ error: 'Error al subir la imagen de evidencia' });
                    }
                } else {
                    evidenciaUrl = `/uploads/servicios/${req.file.filename}`;
                }
            }

            const datos = [
                descripcion || null, 
                direccion !== undefined ? (direccion || null) : servicioActual.DIRECCION,
                fecha_solicitud || null, 
                fecha_ejecucion || null, 
                parseFloat(costo) || 0.00, 
                id_empleado ? parseInt(id_empleado) : null, 
                parseInt(id_cliente), 
                id_garantia ? parseInt(id_garantia) : null, 
                parseInt(id_servicio_tipo), 
                parseInt(id_servicio_estado),
                evidenciaUrl,
                notas_tecnicas || null,
                calificacion ? parseInt(calificacion) : null,
                opinion_cliente || null
            ];

            const result = await Servicio.actualizar(req.params.id, datos);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio actualizado exitosamente', evidencia_url: evidenciaUrl });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Se actualizó el servicio ID: ${req.params.id}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error('Error al actualizar servicio:', err);
            res.status(500).json({ error: err.message });
        }
    },

    updateEstado: async (req, res) => {
        try {
            const { id_servicio_estado, fecha_ejecucion } = req.body;
            if (!id_servicio_estado) {
                return res.status(400).json({ message: 'El estado es requerido' });
            }

            const result = await Servicio.actualizarEstado(req.params.id, id_servicio_estado, fecha_ejecucion);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Estado del servicio actualizado exitosamente' });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Se cambió el estado del servicio ID: ${req.params.id} al estado ID: ${id_servicio_estado}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getMisServicios: async (req, res) => {
        try {
            // Se puede recibir idEmpleado por query o req.userId
            const idEmpleado = req.query.id_empleado || req.userId;
            if (!idEmpleado) {
                return res.status(400).json({ error: 'Se requiere ID de empleado/técnico' });
            }
            const servicios = await Servicio.obtenerPorTecnico(idEmpleado);
            res.json(servicios);
        } catch (err) {
            console.error('Error al obtener servicios del técnico:', err);
            res.status(500).json({ error: err.message });
        }
    },

    iniciar: async (req, res) => {
        try {
            const id = req.params.id;
            const result = await Servicio.iniciarServicio(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio iniciado con éxito', id_servicio_estado: 2 });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Técnico',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Técnico inició el servicio ID: ${id}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    pausar: async (req, res) => {
        try {
            const id = req.params.id;
            const { motivo_pausa } = req.body;
            const result = await Servicio.pausarServicio(id, motivo_pausa);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio puesto en pausa', id_servicio_estado: 4, motivo_pausa });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Técnico',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Técnico pausó el servicio ID: ${id}. Motivo: ${motivo_pausa || 'Sin motivo'}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    finalizar: async (req, res) => {
        try {
            const id = req.params.id;
            const { notas_tecnicas } = req.body;

            if (!req.file) {
                return res.status(400).json({ error: 'Es estrictamente obligatorio subir una foto de evidencia para finalizar el servicio.' });
            }

            let evidenciaUrl;
            if (isR2Configured()) {
                evidenciaUrl = await subirArchivoR2({
                    buffer: req.file.buffer,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    carpeta: 'servicios'
                });
            } else if (process.env.IMGBB_API_KEY) {
                evidenciaUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
            } else {
                evidenciaUrl = `/uploads/servicios/${req.file.filename}`;
            }

            const result = await Servicio.finalizarServicio(id, evidenciaUrl, notas_tecnicas);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }

            res.json({ 
                message: 'Servicio finalizado con éxito', 
                id_servicio_estado: 1, 
                evidencia_url: evidenciaUrl,
                notas_tecnicas 
            });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Técnico',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Técnico finalizó el servicio ID: ${id} con evidencia fotográfica adjunta`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error('Error al finalizar servicio:', err);
            res.status(500).json({ error: err.message });
        }
    },

    subirEvidencia: async (req, res) => {
        try {
            const idServicio = req.params.id;
            if (!req.file) {
                return res.status(400).json({ error: 'No se subió ningún archivo de imagen' });
            }

            let evidenciaUrl;
            if (isR2Configured()) {
                evidenciaUrl = await subirArchivoR2({
                    buffer: req.file.buffer,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    carpeta: 'servicios'
                });
            } else if (process.env.IMGBB_API_KEY) {
                evidenciaUrl = await subirAImgBB(req.file.buffer, req.file.originalname);
            } else {
                evidenciaUrl = `/uploads/servicios/${req.file.filename}`;
            }

            await Servicio.actualizarEvidencia(idServicio, evidenciaUrl);

            res.json({
                message: 'Evidencia fotográfica subida correctamente',
                evidencia_url: evidenciaUrl
            });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Se adjuntó foto de evidencia al servicio ID: ${idServicio}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error('Error subiendo evidencia:', err);
            res.status(500).json({ error: err.message });
        }
    },

    calificarServicio: async (req, res) => {
        try {
            const idServicio = req.params.id;
            const { calificacion, opinion_cliente } = req.body;

            if (!calificacion || calificacion < 1 || calificacion > 5) {
                return res.status(400).json({ error: 'La calificación debe ser un valor entre 1 y 5 estrellas' });
            }

            await Servicio.registrarCalificacion(idServicio, calificacion, opinion_cliente || null);

            res.json({
                message: 'Calificación y opinión del cliente registradas correctamente',
                calificacion: calificacion,
                opinion_cliente: opinion_cliente
            });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'SERVICIOS',
                descripcion: `Se registró calificación de ${calificacion} estrellas para el servicio ID: ${idServicio}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            console.error('Error registrando calificación:', err);
            res.status(500).json({ error: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await Servicio.eliminar(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Servicio no encontrado' });
            }
            res.json({ message: 'Servicio eliminado' });

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'ELIMINAR',
                tabla: 'SERVICIOS',
                descripcion: `Se eliminó el servicio ID: ${req.params.id}`
            }).catch(e => console.error('Audit log error:', e));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getTipos: async (req, res) => {
        try {
            const tipos = await Servicio.obtenerTipos();
            res.json(tipos);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getEstados: async (req, res) => {
        try {
            const estados = await Servicio.obtenerEstados();
            res.json(estados);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = serviciosController;
