const db = require('./config/db.js');

async function migrate() {
    try {
        console.log("Starting migration for PRODUCTO_SERIES...");
        
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS PRODUCTO_SERIES (
                ID_SERIE INT PRIMARY KEY AUTO_INCREMENT,
                ID_PRODUCTO INT NOT NULL,
                NUMERO_SERIE VARCHAR(100) NOT NULL,
                CONDICION ENUM('Nuevo', 'Seminuevo') DEFAULT 'Nuevo',
                ESTADO ENUM('en_stock', 'vendido', 'devuelto', 'desechado') DEFAULT 'en_stock',
                ID_VENTA INT NULL,
                ID_DEVOLUCION INT NULL,
                FECHA_REGISTRO DATETIME DEFAULT CURRENT_TIMESTAMP,
                NOTAS VARCHAR(500) NULL,
                FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO),
                UNIQUE KEY UQ_SERIE_PRODUCTO (ID_PRODUCTO, NUMERO_SERIE)
            );
        `;
        
        await db.query(createTableSql);
        console.log("Table PRODUCTO_SERIES created successfully.");

    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        process.exit();
    }
}

migrate();
