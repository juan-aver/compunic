/*
 * Módulo: reportes.controller.js
 * Descripción: Controlador para la API de reportes analíticos y financieros de Compunic.
 */
const ReportesModel = require('../models/reportes.model');
const AuditoriaModel = require('../models/auditoria.model');
const PDFDocument = require('pdfkit');

const ReportesController = {
    /**
     * GET /api/reportes/financiero
     */
    getFinanciero: async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const data = await ReportesModel.obtenerResumenFinanciero(fecha_inicio, fecha_fin);
            res.json(data);
        } catch (err) {
            console.error('Error en getFinanciero:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /api/reportes/ventas
     */
    getVentas: async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin, canal, id_vendedor } = req.query;
            const data = await ReportesModel.obtenerReporteVentas(fecha_inicio, fecha_fin, canal, id_vendedor);
            res.json(data);
        } catch (err) {
            console.error('Error en getVentas:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /api/reportes/stock
     */
    getStock: async (req, res) => {
        try {
            const { id_categoria, estado_stock } = req.query;
            const data = await ReportesModel.obtenerReporteStock(id_categoria, estado_stock);
            res.json(data);
        } catch (err) {
            console.error('Error en getStock:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /api/reportes/servicios
     */
    getServicios: async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const data = await ReportesModel.obtenerReporteServicios(fecha_inicio, fecha_fin);
            res.json(data);
        } catch (err) {
            console.error('Error en getServicios:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * GET /api/reportes/exportar/pdf
     * Genera un reporte institucional en PDF descargable
     */
    exportarPdf: async (req, res) => {
        try {
            const { tipo = 'financiero', fecha_inicio, fecha_fin } = req.query;

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const filename = `Reporte_${tipo.toUpperCase()}_${Date.now()}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            doc.pipe(res);

            // Membrete
            doc.fontSize(20).fillColor('#145D90').text('COMPUNIC', 40, 40, { bold: true });
            doc.fontSize(10).fillColor('#64748b').text('Tecnología y Soluciones Informáticas', 40, 65);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-NI')}`, 40, 78);
            doc.moveDown();

            // Título del Reporte
            doc.fontSize(16).fillColor('#1e293b').text(`REPORTE: ${tipo.toUpperCase()}`, 40, 105, { underline: true });
            if (fecha_inicio && fecha_fin) {
                doc.fontSize(10).fillColor('#475569').text(`Período: ${fecha_inicio} al ${fecha_fin}`, 40, 125);
            }
            doc.moveDown(2);

            if (tipo === 'financiero') {
                const data = await ReportesModel.obtenerResumenFinanciero(fecha_inicio, fecha_fin);
                const k = data.kpis;

                doc.fontSize(12).fillColor('#0f172a').text('Resumen Ejecutivo de Rendimiento:');
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#334155');
                doc.text(`• Total Ingresos: C$ ${k.total_ingresos.toFixed(2)} (Ventas: C$ ${k.total_ventas.toFixed(2)} | Servicios: C$ ${k.total_servicios.toFixed(2)})`);
                doc.text(`• Total Egresos (Compras): C$ ${k.total_egresos.toFixed(2)}`);
                doc.text(`• Costo Estimado de Mercancía Vendida: C$ ${k.costo_mercancia.toFixed(2)}`);
                doc.text(`• Utilidad / Ganancia Bruta: C$ ${k.ganancia_bruta.toFixed(2)}`);
                doc.text(`• Margen de Rentabilidad: ${k.margen_ganancia_porcentaje}%`);
                doc.text(`• Total Transacciones de Ventas: ${k.transacciones_ventas}`);
                doc.text(`• Total Órdenes de Servicio: ${k.servicios_realizados}`);
            } else if (tipo === 'stock') {
                const data = await ReportesModel.obtenerReporteStock();
                const r = data.resumen;

                doc.fontSize(12).fillColor('#0f172a').text('Valoración y Estado del Inventario:');
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#334155');
                doc.text(`• Total Productos Distintos: ${r.total_productos_distintos}`);
                doc.text(`• Unidades Totales en Bodega: ${r.total_unidades_inventario}`);
                doc.text(`• Valoración Total al Costo: C$ ${r.valoracion_costo_total.toFixed(2)}`);
                doc.text(`• Valoración Total Proyectada (Venta): C$ ${r.valoracion_venta_total.toFixed(2)}`);
                doc.text(`• Margen Bruto Potencial: C$ ${r.ganancia_potencial_total.toFixed(2)} (${r.margen_potencial_porcentaje}%)`);
                doc.text(`• Productos con Stock Normal: ${r.productos_stock_normal}`);
                doc.text(`• Productos con Stock Bajo (≤ 5): ${r.productos_stock_bajo}`);
                doc.text(`• Productos Agotados: ${r.productos_agotados}`);
            } else if (tipo === 'servicios') {
                const data = await ReportesModel.obtenerReporteServicios(fecha_inicio, fecha_fin);
                const r = data.resumen;

                doc.fontSize(12).fillColor('#0f172a').text('Rendimiento del Taller y Soporte Técnico:');
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#334155');
                doc.text(`• Total de Servicios: ${r.total_servicios}`);
                doc.text(`• Total Recaudado por Mano de Obra: C$ ${parseFloat(r.total_recaudado).toFixed(2)}`);
                doc.text(`• Trabajos Completados / Entregados: ${r.total_completados}`);
                doc.text(`• Trabajos en Progreso / Pendientes: ${r.total_en_progreso}`);
                doc.text(`• Calificación Promedio de Clientes: ${parseFloat(r.promedio_estrellas).toFixed(1)} / 5 Estrellas`);
            } else {
                const data = await ReportesModel.obtenerReporteVentas(fecha_inicio, fecha_fin);
                doc.fontSize(12).fillColor('#0f172a').text('Resumen de Operaciones Comerciales:');
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#334155');
                doc.text(`• Total de Ventas Registradas: ${data.listado.length}`);
                const montoTotal = data.listado.reduce((acc, v) => acc + parseFloat(v.TOTAL || 0), 0);
                doc.text(`• Monto Total Facturado: C$ ${montoTotal.toFixed(2)}`);
            }

            // Pie de página
            doc.moveDown(3);
            doc.fontSize(8).fillColor('#94a3b8').text('Documento generado automáticamente por el Sistema Integral Compunic. Válido para control y auditoría interna.', { align: 'center' });

            doc.end();

            // Auditoría
            AuditoriaModel.registrar({
                id_empleado: req.userId || null,
                username: req.username || 'Sistema',
                accion: 'EXPORTAR',
                tabla: 'REPORTES',
                descripcion: `Se exportó reporte PDF de tipo ${tipo.toUpperCase()}`
            }).catch(e => console.error('Audit log error:', e));

        } catch (err) {
            console.error('Error generando PDF:', err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = ReportesController;
