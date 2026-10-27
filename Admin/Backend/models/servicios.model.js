const db = require('../config/db.js');

const Servicio = {
    obtenerTodos: async () => {
        try {
            const sql = `
        SELECT 
          s.ID_SERVICIO,
          s.DESCRIPCION,
          s.FECHA_SOLICITUD,
          s.FECHA_EJECUCION,
          s.COSTO,
          s.ID_EMPLEADO,
          s.ID_CLIENTE,
          s.ID_GARANTIA,
          s.ID_SERVICIO_TIPO,
          s.ID_SERVICIO_ESTADO,
          s.EVIDENCIA_URL,
          s.NOTAS_TECNICAS,
          s.MOTIVO_PAUSA,
          s.CALIFICACION,
          s.OPINION_CLIENTE,
          s.FECHA_CALIFICACION,
          c.NOMBRE AS NOMBRE_CLIENTE,
          c.APELLIDO AS APELLIDO_CLIENTE,
          c.TELEFONO AS TELEFONO_CLIENTE,
          c.EMAIL AS EMAIL_CLIENTE,
          CONCAT(emp.NOMBRE, ' ', emp.APELLIDO) AS NOMBRE_TECNICO,
          st.TIPO AS TIPO_SERVICIO,
          se.ESTADO AS ESTADO_SERVICIO,
          gt.TIPO AS NOMBRE_GARANTIA,
          g.DURACION_MESES
        FROM SERVICIOS s
        LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
        LEFT JOIN EMPLEADOS emp ON s.ID_EMPLEADO = emp.ID_EMPLEADO
        LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO
        LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
        LEFT JOIN GARANTIAS g ON s.ID_GARANTIA = g.ID_GARANTIA
        LEFT JOIN GARANTIA_TIPOS gt ON g.ID_GARANTIA_TIPO = gt.ID_GARANTIA_TIPO
        ORDER BY s.ID_SERVICIO DESC
      `;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener servicios: ' + err.message);
        }
    },

    obtenerPorTecnico: async (idEmpleado) => {
        try {
            const sql = `
        SELECT 
          s.ID_SERVICIO,
          s.DESCRIPCION,
          s.FECHA_SOLICITUD,
          s.FECHA_EJECUCION,
          s.COSTO,
          s.ID_EMPLEADO,
          s.ID_CLIENTE,
          s.ID_GARANTIA,
          s.ID_SERVICIO_TIPO,
          s.ID_SERVICIO_ESTADO,
          s.EVIDENCIA_URL,
          s.NOTAS_TECNICAS,
          s.MOTIVO_PAUSA,
          s.CALIFICACION,
          s.OPINION_CLIENTE,
          s.FECHA_CALIFICACION,
          c.NOMBRE AS NOMBRE_CLIENTE,
          c.APELLIDO AS APELLIDO_CLIENTE,
          c.TELEFONO AS TELEFONO_CLIENTE,
          c.EMAIL AS EMAIL_CLIENTE,
          CONCAT(emp.NOMBRE, ' ', emp.APELLIDO) AS NOMBRE_TECNICO,
          st.TIPO AS TIPO_SERVICIO,
          se.ESTADO AS ESTADO_SERVICIO
        FROM SERVICIOS s
        LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
        LEFT JOIN EMPLEADOS emp ON s.ID_EMPLEADO = emp.ID_EMPLEADO
        LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO
        LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
        WHERE s.ID_EMPLEADO = ?
        ORDER BY s.ID_SERVICIO DESC
      `;
            const [rows] = await db.query(sql, [idEmpleado]);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener servicios del técnico: ' + err.message);
        }
    },

    obtenerPorId: async (id) => {
        try {
            const sql = `
                SELECT 
                    s.*,
                    c.NOMBRE AS NOMBRE_CLIENTE,
                    c.APELLIDO AS APELLIDO_CLIENTE,
                    c.TELEFONO AS TELEFONO_CLIENTE,
                    c.EMAIL AS EMAIL_CLIENTE,
                    CONCAT(emp.NOMBRE, ' ', emp.APELLIDO) AS NOMBRE_TECNICO,
                    st.TIPO AS TIPO_SERVICIO,
                    se.ESTADO AS ESTADO_SERVICIO
                FROM SERVICIOS s
                LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
                LEFT JOIN EMPLEADOS emp ON s.ID_EMPLEADO = emp.ID_EMPLEADO
                LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO
                LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
                WHERE s.ID_SERVICIO = ?
            `;
            const [rows] = await db.query(sql, [id]);
            return rows[0];
        } catch (err) {
            throw new Error('Error al obtener servicio por ID: ' + err.message);
        }
    },

    agregar: async (datos) => {
        try {
            // datos: [descripcion, fecha_solicitud, fecha_ejecucion, costo, id_empleado, id_cliente, id_garantia, id_servicio_tipo, id_servicio_estado, evidencia_url, notas_tecnicas, calificacion, opinion_cliente]
            const sql = `
        INSERT INTO SERVICIOS (
            DESCRIPCION, FECHA_SOLICITUD, FECHA_EJECUCION, COSTO, 
            ID_EMPLEADO, ID_CLIENTE, ID_GARANTIA, ID_SERVICIO_TIPO, 
            ID_SERVICIO_ESTADO, EVIDENCIA_URL, NOTAS_TECNICAS, 
            CALIFICACION, OPINION_CLIENTE, FECHA_CALIFICACION
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            const [result] = await db.query(sql, datos);
            return result;
        } catch (err) {
            throw new Error('Error al agregar servicio: ' + err.message);
        }
    },

    actualizar: async (id, datos) => {
        try {
            const sql = `
        UPDATE SERVICIOS 
        SET DESCRIPCION = ?, FECHA_SOLICITUD = ?, FECHA_EJECUCION = ?, COSTO = ?, 
            ID_EMPLEADO = ?, ID_CLIENTE = ?, ID_GARANTIA = ?, ID_SERVICIO_TIPO = ?, 
            ID_SERVICIO_ESTADO = ?, EVIDENCIA_URL = ?, NOTAS_TECNICAS = ?, 
            CALIFICACION = ?, OPINION_CLIENTE = ?
        WHERE ID_SERVICIO = ?
      `;
            const [result] = await db.query(sql, [...datos, id]);
            return result;
        } catch (err) {
            throw new Error('Error al actualizar servicio: ' + err.message);
        }
    },

    actualizarEstado: async (id, idEstado, fechaEjecucion = null) => {
        try {
            let sql = `UPDATE SERVICIOS SET ID_SERVICIO_ESTADO = ?`;
            let params = [idEstado];
            if (fechaEjecucion) {
                sql += `, FECHA_EJECUCION = ?`;
                params.push(fechaEjecucion);
            }
            sql += ` WHERE ID_SERVICIO = ?`;
            params.push(id);

            const [result] = await db.query(sql, params);
            return result;
        } catch (err) {
            throw new Error('Error al actualizar estado del servicio: ' + err.message);
        }
    },

    actualizarEvidencia: async (id, evidenciaUrl) => {
        try {
            const sql = `UPDATE SERVICIOS SET EVIDENCIA_URL = ? WHERE ID_SERVICIO = ?`;
            const [result] = await db.query(sql, [evidenciaUrl, id]);
            return result;
        } catch (err) {
            throw new Error('Error al actualizar evidencia del servicio: ' + err.message);
        }
    },

    iniciarServicio: async (id) => {
        try {
            // Estado 2: En Progreso
            const sql = `UPDATE SERVICIOS SET ID_SERVICIO_ESTADO = 2 WHERE ID_SERVICIO = ?`;
            const [result] = await db.query(sql, [id]);
            return result;
        } catch (err) {
            throw new Error('Error al iniciar servicio: ' + err.message);
        }
    },

    pausarServicio: async (id, motivoPausa) => {
        try {
            // Estado 4: En Pausa
            const sql = `UPDATE SERVICIOS SET ID_SERVICIO_ESTADO = 4, MOTIVO_PAUSA = ? WHERE ID_SERVICIO = ?`;
            const [result] = await db.query(sql, [motivoPausa || null, id]);
            return result;
        } catch (err) {
            throw new Error('Error al pausar servicio: ' + err.message);
        }
    },

    finalizarServicio: async (id, evidenciaUrl, notasTecnicas) => {
        try {
            // Estado 1: Completado, FECHA_EJECUCION = NOW()
            const sql = `
                UPDATE SERVICIOS 
                SET ID_SERVICIO_ESTADO = 1, 
                    EVIDENCIA_URL = ?, 
                    NOTAS_TECNICAS = COALESCE(?, NOTAS_TECNICAS),
                    FECHA_EJECUCION = CURDATE()
                WHERE ID_SERVICIO = ?
            `;
            const [result] = await db.query(sql, [evidenciaUrl, notasTecnicas || null, id]);
            return result;
        } catch (err) {
            throw new Error('Error al finalizar servicio: ' + err.message);
        }
    },

    registrarCalificacion: async (id, calificacion, opinion) => {
        try {
            const sql = `
                UPDATE SERVICIOS 
                SET CALIFICACION = ?, OPINION_CLIENTE = ?, FECHA_CALIFICACION = NOW() 
                WHERE ID_SERVICIO = ?
            `;
            const [result] = await db.query(sql, [calificacion, opinion, id]);
            return result;
        } catch (err) {
            throw new Error('Error al registrar calificación: ' + err.message);
        }
    },

    eliminar: async (id) => {
        try {
            const sql = `DELETE FROM SERVICIOS WHERE ID_SERVICIO = ?`;
            const [result] = await db.query(sql, [id]);
            return result;
        } catch (err) {
            throw new Error('Error al eliminar servicio: ' + err.message);
        }
    },

    obtenerTipos: async () => {
        try {
            const sql = `SELECT * FROM SERVICIO_TIPOS`;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener tipos de servicio: ' + err.message);
        }
    },

    obtenerEstados: async () => {
        try {
            const sql = `SELECT * FROM SERVICIO_ESTADOS`;
            const [rows] = await db.query(sql);
            return rows;
        } catch (err) {
            throw new Error('Error al obtener estados de servicio: ' + err.message);
        }
    }
};

module.exports = Servicio;
