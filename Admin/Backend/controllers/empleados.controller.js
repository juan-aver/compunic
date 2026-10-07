const Empleado = require('../models/empleados.model');
const AuthModel = require('../models/auth.model');
const EmailService = require('../services/email.service');
const AuditoriaModel = require('../models/auditoria.model');

// Controlador para todas las operaciones de empleados
const EmpleadosController = {
    // ---- OBTENER TODOS ----
    obtenerTodos: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos();
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    obtenerVendedores: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos('VENDEDOR');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    obtenerAdministradores: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos('ADMIN');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    obtenerTemporales: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos('TEMPORAL');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    obtenerCajeros: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos('CAJERO');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    obtenerTecnicos: async (req, res) => {
        try {
            const resultados = await Empleado.obtenerTodos('TECNICO');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // ---- BUSCAR ----
    buscarTodos: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino);
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    buscarVendedores: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino, 'VENDEDOR');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    buscarAdministradores: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino, 'ADMIN');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    buscarTemporales: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino, 'TEMPORAL');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    buscarCajeros: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino, 'CAJERO');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    buscarTecnicos: async (req, res) => {
        try {
            const termino = req.params.termino;
            const resultados = await Empleado.buscar(termino, 'TECNICO');
            res.json(resultados);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // ---- AGREGAR ----
    agregarEmpleado: async (req, res) => {
        try {
            const { nombre, apellido, telefono, email, direccion, sexo, f_nacimiento, area, horario, username, rol } = req.body;
            
            // Validar ROL obligatorio (ADMIN, VENDEDOR, CAJERO, TECNICO, TEMPORAL)
            const rolesValidos = ['ADMIN', 'VENDEDOR', 'CAJERO', 'TECNICO', 'TEMPORAL'];
            if (!rol || !rolesValidos.includes(rol)) {
                return res.status(400).send('Rol inválido o faltante');
            }

            // Los usuarios con acceso al sistema (ADMIN, VENDEDOR, CAJERO, TECNICO) inician con ESTADO=0 hasta que creen contraseña
            // TEMPORAL inicia como ESTADO=1 (activo) porque no tiene acceso al sistema
            const estadoInicial = (rol === 'TEMPORAL') ? 1 : 0;

            const datos = [
                nombre || null, 
                apellido || null, 
                telefono || null, 
                email || null, 
                direccion || null, 
                sexo || null, 
                f_nacimiento || null, 
                area || null, 
                horario || null, 
                username || null, 
                rol,
                estadoInicial
            ];

            const result = await Empleado.agregar(datos);
            const nuevoId = result.insertId;

            // Si es ADMIN, VENDEDOR, CAJERO o TECNICO, enviar correo para crear contraseña
            const rolesConAcceso = ['ADMIN', 'VENDEDOR', 'CAJERO', 'TECNICO'];
            if (rolesConAcceso.includes(rol) && email) {
                try {
                    // Crear token de bienvenida (2 horas de expiración)
                    const tokenResult = await AuthModel.createWelcomePasswordToken(email);
                    
                    if (tokenResult) {
                        const nombreCompleto = `${nombre} ${apellido}`;
                        await EmailService.sendNewEmployeePasswordEmail(
                            email,
                            tokenResult.token,
                            nombreCompleto,
                            rol
                        );
                        console.log(`📧 Correo de bienvenida enviado a ${email} (${rol})`);
                        
                        return res.status(201).json({ 
                            id: nuevoId, 
                            mensaje: `Empleado agregado correctamente. Se envió un correo a ${email} para que cree su contraseña.`,
                            correoEnviado: true
                        });
                    }
                } catch (emailError) {
                    console.error('⚠️ Error enviando correo de bienvenida:', emailError);
                    // El empleado se creó, pero el correo falló - no es crítico
                    return res.status(201).json({ 
                        id: nuevoId, 
                        mensaje: 'Empleado agregado, pero hubo un error al enviar el correo de bienvenida. Se puede reenviar manualmente.',
                        correoEnviado: false
                    });
                }
            }

            // Para temporales o sin email
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'CREAR',
                tabla: 'EMPLEADOS',
                descripcion: `Se agregó el nuevo empleado "${nombre} ${apellido}" con rol ${rol} (ID: ${nuevoId})`
            }).catch(e => console.error('Audit log error:', e));

            res.status(201).json({ 
                id: nuevoId, 
                mensaje: 'Empleado agregado correctamente',
                correoEnviado: false
            });
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // ---- ACTUALIZAR ----
    actualizarEmpleado: async (req, res) => {
        try {
            const id = req.params.id;
            const { nombre, apellido, telefono, email, direccion, sexo, f_nacimiento, area, horario, username, rol } = req.body;
            
            const rolesValidos = ['ADMIN', 'VENDEDOR', 'CAJERO', 'TECNICO', 'TEMPORAL'];
            if (!rol || !rolesValidos.includes(rol)) {
                return res.status(400).send('Rol inválido o faltante');
            }

            const datos = [
                nombre || null, 
                apellido || null, 
                telefono || null, 
                email || null, 
                direccion || null, 
                sexo || null, 
                f_nacimiento || null, 
                area || null, 
                horario || null, 
                username || null, 
                rol,
                id // ID_EMPLEADO
            ];

            await Empleado.actualizar(datos);

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'MODIFICAR',
                tabla: 'EMPLEADOS',
                descripcion: `Se actualizó la información del empleado "${nombre} ${apellido}" (ID: ${id})`
            }).catch(e => console.error('Audit log error:', e));

            res.send('Empleado actualizado correctamente');
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // ---- ELIMINAR ----
    eliminarEmpleado: async (req, res) => {
        try {
            const id = req.params.id;
            await Empleado.eliminar(id);

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'ELIMINAR',
                tabla: 'EMPLEADOS',
                descripcion: `Se dio de baja al empleado con ID: ${id}`
            }).catch(e => console.error('Audit log error:', e));

            res.send('Empleado eliminado (soft delete) correctamente');
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // ---- CAMBIAR ESTADO ----
    cambiarEstado: async (req, res) => {
        try {
            const id = req.params.id;
            const { estado } = req.body;
            await Empleado.cambiarEstado(id, estado);

            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'CAMBIAR_ESTADO',
                tabla: 'EMPLEADOS',
                descripcion: `Se cambió el estado del empleado (ID: ${id}) a ${estado === 1 ? 'ACTIVO' : 'INACTIVO'}`
            }).catch(e => console.error('Audit log error:', e));

            res.send('Estado actualizado correctamente');
        } catch (error) {
            res.status(500).send(error.message);
        }
    }
};

module.exports = EmpleadosController;
