/**
 * @file divisas.service.js
 * @description Servicio para gestión y conversión de divisas (Córdobas NIO <-> Dólares USD).
 * Soporta tasa de cambio oficial del BCN (36.6243), sincronización automática y conversión.
 */

// Tasa oficial base de Nicaragua (BCN - Devaluación 0% desde 2024 = 36.6243 C$/USD)
const TASA_OFICIAL_DEFECTO = 36.6243;

let cacheTasa = {
    tasa: parseFloat(process.env.TASA_CAMBIO_OFICIAL) || TASA_OFICIAL_DEFECTO,
    fechaActualizacion: new Date(),
    fuente: 'Oficial BCN'
};

const DivisasService = {
    /**
     * Obtener la tasa de cambio actual USD -> NIO
     * Intenta actualizar contra API si el cache tiene más de 6 horas
     */
    async getTasaCambio() {
        const ahora = new Date();
        const horasDesdeActualizacion = (ahora - cacheTasa.fechaActualizacion) / (1000 * 60 * 60);

        // Si el cache tiene menos de 6 horas, usarlo directamente
        if (horasDesdeActualizacion < 6 && cacheTasa.tasa) {
            return {
                moneda_base: 'USD',
                moneda_destino: 'NIO',
                tasa: cacheTasa.tasa,
                fecha: cacheTasa.fechaActualizacion.toISOString(),
                fuente: cacheTasa.fuente
            };
        }

        // Intentar actualizar vía API pública sin bloquear
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch('https://open.er-api.com/v6/latest/USD', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.rates && data.rates.NIO) {
                    cacheTasa = {
                        tasa: parseFloat(data.rates.NIO),
                        fechaActualizacion: new Date(),
                        fuente: 'Open Exchange Rates (API)'
                    };
                    console.log(`💱 [Divisas] Tasa actualizada vía API: 1 USD = ${cacheTasa.tasa} NIO`);
                }
            }
        } catch (err) {
            console.warn('⚠️ [Divisas] No se pudo consultar API externa, usando tasa oficial BCN:', err.message);
            // Mantener la tasa oficial configurada
            cacheTasa.fuente = 'Oficial BCN (Fija)';
        }

        return {
            moneda_base: 'USD',
            moneda_destino: 'NIO',
            tasa: cacheTasa.tasa,
            fecha: cacheTasa.fechaActualizacion.toISOString(),
            fuente: cacheTasa.fuente
        };
    },

    /**
     * Establecer tasa de cambio manualmente (para administradores)
     */
    setTasaManual(nuevaTasa) {
        const tasaNum = parseFloat(nuevaTasa);
        if (!tasaNum || isNaN(tasaNum) || tasaNum <= 0) {
            throw new Error('La tasa de cambio debe ser un número positivo.');
        }
        cacheTasa = {
            tasa: tasaNum,
            fechaActualizacion: new Date(),
            fuente: 'Manual (Administrador)'
        };
        console.log(`💱 [Divisas] Tasa fijada manualmente: 1 USD = ${cacheTasa.tasa} NIO`);
        return cacheTasa;
    },

    /**
     * Convertir automáticamente entre Córdobas y Dólares
     * @param {number} monto - Cantidad a convertir
     * @param {string} de - 'NIO' (Córdobas) o 'USD' (Dólares)
     * @param {string} a - 'NIO' (Córdobas) o 'USD' (Dólares)
     */
    async convertir(monto, de = 'NIO', a = 'USD') {
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum < 0) {
            throw new Error('El monto a convertir debe ser un número válido.');
        }

        const infoTasa = await this.getTasaCambio();
        const tasa = infoTasa.tasa;

        const deUpper = (de || 'NIO').toUpperCase();
        const aUpper = (a || 'USD').toUpperCase();

        let resultado = montoNum;

        if (deUpper === 'NIO' && aUpper === 'USD') {
            // Córdobas a Dólares
            resultado = montoNum / tasa;
        } else if (deUpper === 'USD' && aUpper === 'NIO') {
            // Dólares a Córdobas
            resultado = montoNum * tasa;
        }

        return {
            monto_original: montoNum,
            moneda_origen: deUpper,
            monto_convertido: Math.round(resultado * 100) / 100,
            moneda_destino: aUpper,
            tasa_utilizada: tasa,
            fecha_tasa: infoTasa.fecha,
            fuente_tasa: infoTasa.fuente,
            formato_origen: deUpper === 'NIO' ? `C$ ${montoNum.toFixed(2)}` : `$ ${montoNum.toFixed(2)} USD`,
            formato_convertido: aUpper === 'USD' ? `$ ${(Math.round(resultado * 100) / 100).toFixed(2)} USD` : `C$ ${(Math.round(resultado * 100) / 100).toFixed(2)}`
        };
    }
};

module.exports = DivisasService;
