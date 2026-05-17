const db = require('../config/db.js');
const bcrypt = require('bcryptjs');

const Empleado = {
    obtenerTodos: async (rol = null) => {
        try {
            let sql = 'SELECT * FROM EMPLEADOS WHERE 1=1';
            let params = [];
            
            if (rol) {
                sql += ' AND ROL = ?';
                params.push(rol);
            }
            
            const [resultados] = await db.query(sql, params);
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener empleados: ' + err.message);
        }
    },

    buscar: async (termino, rol = null) => {
        try {
            let sql = `
                SELECT * FROM EMPLEADOS 
                WHERE (NOMBRE LIKE ? OR APELLIDO LIKE ? OR EMAIL LIKE ? OR TELEFONO LIKE ?)
            `;
            const likeTerm = `%${termino}%`;
            let params = [likeTerm, likeTerm, likeTerm, likeTerm];

            if (rol) {
                sql += ' AND ROL = ?';
                params.push(rol);
            }

            const [resultados] = await db.query(sql, params);
            return resultados;
        } catch (err) {
            throw new Error('Error al buscar empleados: ' + err.message);
        }
    },

    agregar: async (datos) => {
        try {
            // datos esperado: [NOMBRE, APELLIDO, TELEFONO, EMAIL, DIRECCION, SEXO, F_NACIMIENTO, AREA, HORARIO, USERNAME, ROL, ESTADO]
            const sql = `
                INSERT INTO EMPLEADOS 
                (NOMBRE, APELLIDO, TELEFONO, EMAIL, DIRECCION, SEXO, F_NACIMIENTO, AREA, HORARIO, USERNAME, ROL, ESTADO) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar empleado: ' + err.message);
        }
    },

    actualizar: async (datos) => {
        try {
            // El array de datos esperado: [NOMBRE, APELLIDO, TELEFONO, EMAIL, DIRECCION, SEXO, F_NACIMIENTO, AREA, HORARIO, USERNAME, ROL, ID_EMPLEADO]
            const sql = `
                UPDATE EMPLEADOS 
                SET NOMBRE=?, APELLIDO=?, TELEFONO=?, EMAIL=?, DIRECCION=?, SEXO=?, F_NACIMIENTO=?, AREA=?, HORARIO=?, USERNAME=?, ROL=? 
                WHERE ID_EMPLEADO=?
            `;
            await db.query(sql, datos);
        } catch (err) {
            throw new Error('Error al actualizar empleado: ' + err.message);
        }
    },
    
    actualizarPassword: async (id_empleado, newPassword) => {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const sql = 'UPDATE EMPLEADOS SET PASSWORD_HASH = ? WHERE ID_EMPLEADO = ?';
            await db.query(sql, [hashedPassword, id_empleado]);
        } catch (err) {
            throw new Error('Error al actualizar contraseña: ' + err.message);
        }
    },

    eliminar: async (id) => {
        try {
            // Soft delete
            const sql = 'UPDATE EMPLEADOS SET ESTADO = 0 WHERE ID_EMPLEADO=?';
            await db.query(sql, [id]);
        } catch (err) {
            throw new Error('Error al eliminar empleado: ' + err.message);
        }
    },
    
    cambiarEstado: async (id, nuevoEstado) => {
        try {
            const sql = 'UPDATE EMPLEADOS SET ESTADO = ? WHERE ID_EMPLEADO = ?';
            await db.query(sql, [nuevoEstado, id]);
        } catch (err) {
            throw new Error('Error al cambiar estado: ' + err.message);
        }
    }
};

module.exports = Empleado;
