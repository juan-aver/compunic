const fs = require('fs');
const path = require('path');

const files = ['store.model.js', 'productos.model.js', 'pedidos.model.js', 'devoluciones.model.js'];

files.forEach(f => {
    const p = path.join(__dirname, 'models', f);
    let c = fs.readFileSync(p, 'utf8');
    
    c = c.replace(/SELECT SUM\(vp\.cantidad_neta\) FROM VENTAS_PRODUCTOS vp WHERE vp\.ID_PRODUCTO = p\.ID_PRODUCTO/g, 
        `SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = p.ID_PRODUCTO AND v.ESTADO != 'Rechazado'`);
        
    c = c.replace(/SELECT SUM\(vp\.cantidad_neta\) FROM VENTAS_PRODUCTOS vp WHERE vp\.ID_PRODUCTO = \?/g, 
        `SELECT SUM(vp.cantidad_neta) FROM VENTAS_PRODUCTOS vp JOIN VENTAS v ON vp.ID_VENTA = v.ID_VENTA WHERE vp.ID_PRODUCTO = ? AND v.ESTADO != 'Rechazado'`);
        
    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
});
