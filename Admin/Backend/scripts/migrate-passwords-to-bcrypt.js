const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Script de migración: Encripta todas las contraseñas existentes con bcrypt
 * 
 * IMPORTANTE: Este script debe ejecutarse UNA SOLA VEZ
 * 
 * Proceso:
 * 1. Lee todas las contraseñas actuales (texto plano)
 * 2. Las encripta con bcrypt (salt rounds: 10)
 * 3. Actualiza la base de datos con las contraseñas encriptadas
 */

async function migratePasswords() {
    console.log('🔐 Iniciando migración de contraseñas a bcrypt...\n');

    try {
        // 1. Obtener todos los empleados con contraseñas en texto plano
        const [empleados] = await db.query(`
            SELECT ID, USERNAME, PASSWORD_HASH 
            FROM EMPLEADOS 
            WHERE PASSWORD_HASH IS NOT NULL
        `);

        console.log(`📊 Total de empleados encontrados: ${empleados.length}\n`);

        if (empleados.length === 0) {
            console.log('✅ No hay contraseñas para migrar.');
            process.exit(0);
        }

        let migrados = 0;
        let errores = 0;

        // 2. Encriptar cada contraseña
        for (const empleado of empleados) {
            try {
                // Verificar si ya está encriptada (bcrypt hashes empiezan con $2a$ o $2b$)
                if (empleado.PASSWORD_HASH.startsWith('$2a$') || empleado.PASSWORD_HASH.startsWith('$2b$')) {
                    console.log(`⏭️  ${empleado.USERNAME}: Ya está encriptada, omitiendo...`);
                    continue;
                }

                // Encriptar contraseña con bcrypt (10 salt rounds)
                const hashedPassword = await bcrypt.hash(empleado.PASSWORD_HASH, 10);

                // Actualizar en la base de datos
                await db.query(
                    'UPDATE EMPLEADOS SET PASSWORD_HASH = ? WHERE ID = ?',
                    [hashedPassword, empleado.ID]
                );

                console.log(`✅ ${empleado.USERNAME}: Contraseña encriptada exitosamente`);
                migrados++;

            } catch (error) {
                console.error(`❌ Error encriptando contraseña de ${empleado.USERNAME}:`, error.message);
                errores++;
            }
        }

        // 3. Resumen final
        console.log('\n' + '='.repeat(50));
        console.log('📋 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(50));
        console.log(`✅ Contraseñas migradas: ${migrados}`);
        console.log(`❌ Errores: ${errores}`);
        console.log(`⏭️  Ya encriptadas: ${empleados.length - migrados - errores}`);
        console.log('='.repeat(50));

        if (migrados > 0) {
            console.log('\n🎉 ¡Migración completada exitosamente!');
            console.log('⚠️  IMPORTANTE: Ahora debes actualizar el código de login para usar bcrypt.compare()');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error fatal en la migración:', error);
        process.exit(1);
    }
}

// Ejecutar migración
migratePasswords();
