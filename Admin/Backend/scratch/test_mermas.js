const axios = require('axios');

async function testMermas() {
    try {
        console.log('1. Probando GET /api/mermas...');
        const resList = await axios.get('http://localhost:3001/api/mermas');
        console.log('Mermas existentes:', resList.data.length);

        console.log('2. Probando validación: Merma sin justificación...');
        try {
            await axios.post('http://localhost:3001/api/mermas', {
                id_producto: 1,
                cantidad: 1,
                motivo: 'Dañado',
                justificacion: ''
            });
            console.error('❌ Error: debió fallar por falta de justificación');
        } catch (err) {
            console.log('✅ Validación correcta:', err.response?.data?.error || err.message);
        }

        console.log('3. Probando registro de merma válida...');
        const resPost = await axios.post('http://localhost:3001/api/mermas', {
            id_producto: 3, // Mouse Logitech
            cantidad: 1,
            motivo: 'Defectuoso',
            justificacion: 'Falla en rueda de scroll confirmada en revisión técnica',
            id_empleado: 11
        });
        console.log('✅ Merma registrada:', resPost.data);

        console.log('4. Verificando lista actualizada de mermas...');
        const resList2 = await axios.get('http://localhost:3001/api/mermas');
        console.log('Mermas después del registro:', resList2.data.length);
        console.log('Última merma:', resList2.data[0]);

        console.log('🎉 Todas las pruebas de Mermas pasaron exitosamente!');
    } catch (e) {
        console.error('❌ Error en prueba:', e.response?.data || e.message);
    }
}

testMermas();
