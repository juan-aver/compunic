const db = require('../config/db');

const Auditoria = {
    registrar: async ({ id_empleado = null, usuario = null, username = null, accion, tabla = null, id_registro = null, detalle = null, descripcion = null, ip = null }) => {
        // Normalize aliases: username → usuario, descripcion → detalle
        const usuarioFinal = usuario || username || null;
        const detalleFinal = detalle || descripcion || null;
        try {
            const sql = `
                INSERT INTO AUDITORIA (ID_EMPLEADO, USUARIO, ACCION, TABLA, ID_REGISTRO, DETALLE, IP)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(sql, [id_empleado, usuarioFinal, accion, tabla, id_registro, detalleFinal, ip]);
            return result;
        } catch (err) {
            console.error('❌ Error al registrar en auditoría:', err.message);
            // No bloquea el flujo de la aplicación principal
            return null;
        }
    },

    obtenerTodas: async ({ usuario, tabla, accion, desde, hasta, limite = 100 } = {}) => {
        try {
            let sql = `
                SELECT a.*, e.NOMBRE, e.APELLIDO 
                FROM AUDITORIA a
                LEFT JOIN EMPLEADOS e ON a.ID_EMPLEADO = e.ID_EMPLEADO
                WHERE 1=1
            `;
            const params = [];

            if (usuario) {
                sql += ' AND (a.USUARIO LIKE ? OR e.NOMBRE LIKE ? OR e.APELLIDO LIKE ?)';
                const term = `%${usuario}%`;
                params.push(term, term, term);
            }

            if (tabla) {
                sql += ' AND a.TABLA = ?';
                params.push(tabla);
            }

            if (accion) {
                sql += ' AND a.ACCION = ?';
                params.push(accion);
            }

            if (desde) {
                sql += ' AND DATE(a.FECHA_HORA) >= ?';
                params.push(desde);
            }

            if (hasta) {
                sql += ' AND DATE(a.FECHA_HORA) <= ?';
                params.push(hasta);
            }

            sql += ' ORDER BY a.FECHA_HORA DESC LIMIT ?';
            params.push(parseInt(limite));

            const [resultados] = await db.query(sql, params);
            return resultados;
        } catch (err) {
            throw new Error('Error al obtener auditorías: ' + err.message);
        }
    },

    obtenerResumenKpis: async () => {
        try {
            // Total acciones hoy
            const [accionesHoy] = await db.query(`
                SELECT COUNT(*) as total FROM AUDITORIA WHERE DATE(FECHA_HORA) = CURDATE()
            `);

            // Total fallos de login hoy
            const [loginsFallidos] = await db.query(`
                SELECT COUNT(*) as total FROM AUDITORIA WHERE ACCION = 'LOGIN_FALLIDO' AND DATE(FECHA_HORA) = CURDATE()
            `);

            // Total modificaciones/eliminaciones hoy
            const [modificacionesHoy] = await db.query(`
                SELECT COUNT(*) as total FROM AUDITORIA WHERE ACCION IN ('MODIFICAR', 'ELIMINAR') AND DATE(FECHA_HORA) = CURDATE()
            `);

            // Gráfico de actividad por día de los últimos 7 días
            const [actividadPorDia] = await db.query(`
                SELECT DATE(FECHA_HORA) as fecha, COUNT(*) as cantidad
                FROM AUDITORIA
                WHERE FECHA_HORA >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(FECHA_HORA)
                ORDER BY fecha ASC
            `);

            // Top tablas modificadas
            const [tablasModificadas] = await db.query(`
                SELECT TABLA, COUNT(*) as cantidad
                FROM AUDITORIA
                WHERE TABLA IS NOT NULL
                GROUP BY TABLA
                ORDER BY cantidad DESC
                LIMIT 5
            `);

            // Top usuarios activos
            const [usuariosActivos] = await db.query(`
                SELECT COALESCE(USUARIO, 'Sistema') as usuario, COUNT(*) as cantidad
                FROM AUDITORIA
                GROUP BY USUARIO
                ORDER BY cantidad DESC
                LIMIT 5
            `);

            return {
                kpis: {
                    acciones_hoy: accionesHoy[0].total || 0,
                    logins_fallidos_hoy: loginsFallidos[0].total || 0,
                    modificaciones_hoy: modificacionesHoy[0].total || 0
                },
                actividad_semanal: actividadPorDia,
                tablas_mas_afectadas: tablasModificadas,
                usuarios_mas_activos: usuariosActivos
            };
        } catch (err) {
            throw new Error('Error al obtener KPIs de auditoría: ' + err.message);
        }
    }
};

module.exports = Auditoria;
