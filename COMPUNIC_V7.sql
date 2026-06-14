DROP DATABASE IF EXISTS COMPUNIC_V5; 
CREATE DATABASE COMPUNIC_V5;
USE COMPUNIC_V5;

-- ==========================================
-- 1. TABLAS CATÁLOGO (Nivel 0)
-- ==========================================

CREATE TABLE CATEGORIAS (
    ID_CATEGORIA INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_CATEGORIA VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE MARCAS (
    ID_MARCA INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_MARCA VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE GARANTIA_TIPOS (
    ID_GARANTIA_TIPO INT PRIMARY KEY AUTO_INCREMENT,
    TIPO VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE GARANTIA_ESTADOS (
    ID_GARANTIA_ESTADO INT PRIMARY KEY AUTO_INCREMENT,
    ESTADO VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE SERVICIO_TIPOS (
    ID_SERVICIO_TIPO INT PRIMARY KEY AUTO_INCREMENT,
    TIPO VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE SERVICIO_ESTADOS (
    ID_SERVICIO_ESTADO INT PRIMARY KEY AUTO_INCREMENT,
    ESTADO VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE INGRESO_METODOS_PAGO (
    ID_METODO_PAGO INT PRIMARY KEY AUTO_INCREMENT,
    METODO_PAGO VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE INGRESO_MONEDAS (
    ID_MONEDA INT PRIMARY KEY AUTO_INCREMENT,
    MONEDA VARCHAR(10) UNIQUE NOT NULL
);

-- TABLA EMPLEADOS UNIFICADA
CREATE TABLE EMPLEADOS (
    ID_EMPLEADO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(100),
    APELLIDO VARCHAR(100),
    TELEFONO VARCHAR(20),
    EMAIL VARCHAR(255), 
    DIRECCION VARCHAR(500), -- Para los temporales
    SEXO CHAR(1),
    F_NACIMIENTO DATE,
    AREA VARCHAR(100),      -- Para los vendedores
    HORARIO VARCHAR(50),    -- Para los vendedores
    USERNAME VARCHAR(50) UNIQUE,      
    PASSWORD_HASH VARCHAR(255),       
    ROL ENUM('ADMIN', 'VENDEDOR', 'TEMPORAL') DEFAULT 'VENDEDOR', 
    ESTADO TINYINT DEFAULT 1          
);

-- comprobacion de correos y envio de tokens
CREATE TABLE PASSWORD_RESET_TOKENS (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_EMPLEADO INT NOT NULL,
    TOKEN VARCHAR(255) NOT NULL UNIQUE,
    EXPIRA_EN DATETIME NOT NULL,
    USADO TINYINT DEFAULT 0,
    CREADO_EN DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO) ON DELETE CASCADE,
    
    INDEX idx_token (TOKEN),
    INDEX idx_expiracion (EXPIRA_EN),
    INDEX idx_empleado (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. TABLAS NIVEL 1
-- ==========================================

CREATE TABLE GARANTIAS (
    ID_GARANTIA INT PRIMARY KEY,
    FECHA DATE,
    CONDICION VARCHAR(500),
    EXCLUSIONES VARCHAR(1000),
    HORA TIME,
    DURACION_MESES INT,
    ID_GARANTIA_TIPO INT,
    ID_GARANTIA_ESTADO INT,
    FOREIGN KEY (ID_GARANTIA_TIPO) REFERENCES GARANTIA_TIPOS(ID_GARANTIA_TIPO),
    FOREIGN KEY (ID_GARANTIA_ESTADO) REFERENCES GARANTIA_ESTADOS(ID_GARANTIA_ESTADO)
);

-- ==========================================
-- 3. TABLAS NIVEL 2
-- ==========================================

CREATE TABLE CLIENTES (
    ID_CLIENTE INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(100),
    APELLIDO VARCHAR(100),
    TELEFONO VARCHAR(20),
    EMAIL VARCHAR(255),
    PUNTOS INT DEFAULT 0, -- Nueva columna agregada con valor inicial de 0
    ID_EMPLEADO INT, -- Apunta al vendedor
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
);

CREATE TABLE PROVEEDORES (
    ID_PROVEEDOR INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_EMPRESA VARCHAR(255),
    PERSONA_CONTACTO VARCHAR(255),
    TELEFONO VARCHAR(20),
    DIRECCION VARCHAR(500),
    PAGINA_WEB VARCHAR(255),
    EMAIL VARCHAR(255),
    ID_EMPLEADO INT, -- Apunta al administrador
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
);

-- ==========================================
-- 4. TABLAS NIVEL 3 (PRODUCTOS Y COMPRAS)
-- ==========================================

CREATE TABLE PRODUCTOS (
    ID_PRODUCTO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_PRODUCTO VARCHAR(255),
    MODELO VARCHAR(100),
    DESCRIPCION VARCHAR(500),
    IMAGEN_URL VARCHAR(255), 
    PRECIO_COMPRA DECIMAL(12, 2), 
    PRECIO_VENTA DECIMAL(12, 2),
    ID_MARCA INT,
    ID_EMPLEADO INT, -- Apunta al administrador
    ID_GARANTIAS INT,
    ID_PROVEEDOR INT, 
    FOREIGN KEY (ID_MARCA) REFERENCES MARCAS(ID_MARCA),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO),
    FOREIGN KEY (ID_GARANTIAS) REFERENCES GARANTIAS(ID_GARANTIA),
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES(ID_PROVEEDOR)
);

CREATE TABLE PRODUCTO_PROVEEDOR (
    ID_PRODUCTO INT NOT NULL,
    ID_PROVEEDOR INT NOT NULL,
    PRECIO_COMPRA DECIMAL(12,2),
    PRIMARY KEY (ID_PRODUCTO, ID_PROVEEDOR),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO),
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES(ID_PROVEEDOR)
);

CREATE TABLE COMPRAS (
    ID_COMPRA INT PRIMARY KEY AUTO_INCREMENT,
    ID_PROVEEDOR INT NOT NULL,
    FECHA_COMPRA DATE DEFAULT (CURRENT_DATE),
    NUMERO_FACTURA_PROVEEDOR VARCHAR(50) NOT NULL, 
    TOTAL_COMPRA DECIMAL(12,2),
    IVA_PORCENTAJE DECIMAL(5,2) DEFAULT 15.00 COMMENT 'Porcentaje de IVA fijo (15%)',
    ID_EMPLEADO INT, -- Apunta al administrador
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES(ID_PROVEEDOR),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO),
    CONSTRAINT UQ_PROVEEDOR_FACTURA UNIQUE (ID_PROVEEDOR, NUMERO_FACTURA_PROVEEDOR)
);

CREATE TABLE DETALLE_COMPRA (
    ID_DETALLE INT PRIMARY KEY AUTO_INCREMENT,
    ID_COMPRA INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    PRECIO_UNITARIO_COMPRA DECIMAL(12, 2) NOT NULL,    
    MESES_GARANTIA INT DEFAULT 0,      
    SUBTOTAL DECIMAL(12, 2) GENERATED ALWAYS AS (CANTIDAD * PRECIO_UNITARIO_COMPRA) STORED,    
    FOREIGN KEY (ID_COMPRA) REFERENCES COMPRAS(ID_COMPRA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO)
);

-- ==========================================
-- 5. TABLAS DE OPERACIÓN
-- ==========================================

CREATE TABLE VENTAS (
    ID_VENTA INT PRIMARY KEY AUTO_INCREMENT,
    FECHA DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    ID_CLIENTE INT NOT NULL,
    ID_EMPLEADO INT, 
    ESTADO ENUM('Pendiente de Verificacion', 'Aprobado', 'Rechazado', 'Completado') DEFAULT 'Pendiente de Verificacion',
    TIPO_ENTREGA ENUM('Retiro en Tienda', 'Envio a Domicilio') NOT NULL DEFAULT 'Retiro en Tienda',
    DIRECCION_ENVIO VARCHAR(500) NULL, 
    TOTAL DECIMAL(12,2) NOT NULL DEFAULT 0.00, 
    MONTO_ADELANTO DECIMAL(12,2) DEFAULT 0.00, 
    REFERENCIA_BANCARIA VARCHAR(100) NULL,     -- El número de texto que digita el cliente
    COMPROBANTE_URL VARCHAR(255) NULL,         -- La ruta de la foto que subió el cliente (Ej: 'uploads/comprobantes/ticket_6021.jpg')
    FACTURA VARCHAR(50) NULL UNIQUE, 
    
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES(ID_CLIENTE),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO) 
);

CREATE TABLE DEVOLUCIONES (
    ID_DEVOLUCION INT PRIMARY KEY AUTO_INCREMENT,
    ID_VENTA INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    MOTIVO VARCHAR(255), 
    ACCION ENUM('reingreso', 'desecho', 'garantia') NOT NULL,
    FECHA_DEVOLUCION DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS(ID_VENTA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO)
);

CREATE TABLE SERVICIOS (
    ID_SERVICIO INT PRIMARY KEY AUTO_INCREMENT,
    DESCRIPCION VARCHAR(1000),
    FECHA_SOLICITUD DATE,
    FECHA_EJECUCION DATE,
    COSTO DECIMAL(12, 2),
    ID_EMPLEADO INT, -- Apunta al empleado temporal/técnico
    ID_CLIENTE INT,
    ID_GARANTIA INT,
    ID_SERVICIO_TIPO INT,
    ID_SERVICIO_ESTADO INT,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO),
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES(ID_CLIENTE),
    FOREIGN KEY (ID_GARANTIA) REFERENCES GARANTIAS(ID_GARANTIA),
    FOREIGN KEY (ID_SERVICIO_TIPO) REFERENCES SERVICIO_TIPOS(ID_SERVICIO_TIPO),
    FOREIGN KEY (ID_SERVICIO_ESTADO) REFERENCES SERVICIO_ESTADOS(ID_SERVICIO_ESTADO)
);

-- ==========================================
-- 6. TABLAS FINANCIERAS
-- ==========================================

CREATE TABLE INGRESOS (
    ID_INGRESO INT PRIMARY KEY AUTO_INCREMENT,
    FECHA_PAGO DATETIME DEFAULT CURRENT_TIMESTAMP, 
    MONTO DECIMAL(12, 2) NOT NULL,
    ID_VENTA INT NULL,
    ID_SERVICIO INT NULL,
    ID_CLIENTE INT NOT NULL,
    ID_METODO_PAGO INT NOT NULL,
    ID_MONEDA INT NOT NULL,
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS(ID_VENTA),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS(ID_SERVICIO),
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES(ID_CLIENTE),
    FOREIGN KEY (ID_METODO_PAGO) REFERENCES INGRESO_METODOS_PAGO(ID_METODO_PAGO),
    FOREIGN KEY (ID_MONEDA) REFERENCES INGRESO_MONEDAS(ID_MONEDA),
    CONSTRAINT CHK_ORIGEN_INGRESO CHECK (ID_VENTA IS NOT NULL OR ID_SERVICIO IS NOT NULL)
);

-- ==========================================
-- 7. TABLAS PUENTE Y STOCK
-- ==========================================

CREATE TABLE VENTAS_PRODUCTOS (
    ID_VENTA INT,
    ID_PRODUCTO INT,
    cantidad_neta INT,
    precio_venta DECIMAL(12, 2),
    sub_total DECIMAL(12, 2),
    PRIMARY KEY (ID_VENTA, ID_PRODUCTO),
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS(ID_VENTA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO)
);

CREATE TABLE Productos_servicios (
    ID_PRODUCTOS INT,
    ID_SERVICIO INT,
    FECHA_ASIGNACION DATE,
    PRIMARY KEY (ID_PRODUCTOS, ID_SERVICIO),
    FOREIGN KEY (ID_PRODUCTOS) REFERENCES PRODUCTOS(ID_PRODUCTO),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS(ID_SERVICIO)
);

CREATE TABLE PRODUCTO_CATEGORIA (
    ID_PRODUCTO INT,
    ID_CATEGORIA INT,
    PRIMARY KEY (ID_PRODUCTO, ID_CATEGORIA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO),
    FOREIGN KEY (ID_CATEGORIA) REFERENCES CATEGORIAS(ID_CATEGORIA)
);

CREATE TABLE MOVIMIENTOS_STOCK (
    ID_MOVIMIENTO INT PRIMARY KEY AUTO_INCREMENT,
    ID_PRODUCTO INT NOT NULL,
    NOMBRE_PRODUCTO VARCHAR(255),
    TIPO_MOVIMIENTO ENUM('entrada', 'salida', 'modificacion') NOT NULL,
    MOTIVO VARCHAR(255),
    CANTIDAD INT NOT NULL,
    STOCK_RESULTANTE INT NOT NULL,
    FECHA_MOVIMIENTO DATETIME DEFAULT CURRENT_TIMESTAMP,
    ID_EMPLEADO INT NULL, -- Apunta al administrador
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
);

-- ==========================================
-- CARGA DE DATOS (EN CÓRDOBAS C$)
-- ==========================================

-- 1. CATÁLOGOS
INSERT INTO CATEGORIAS (NOMBRE_CATEGORIA) VALUES
('Laptop'), ('Monitor'), ('Accesorio'), ('Periférico'), ('Impresora'),
('Almacenamiento'), ('Componente'), ('Memoria RAM'), ('Procesador'),
('Motherboard'), ('Tarjeta de Video'), ('Fuente de Poder'), ('Case');

INSERT INTO MARCAS (NOMBRE_MARCA) VALUES
('Dell'), ('HP'), ('Lenovo'), ('Samsung'), ('Logitech'), ('Epson'),
('Kingston'), ('Intel'), ('AMD'), ('Asus'), ('Gigabyte'), ('Nvidia'),
('EVGA'), ('Cooler Master'), ('Corsair');

INSERT INTO GARANTIA_TIPOS (TIPO) VALUES
('Estándar'), ('Extendida'), ('Limitada'), ('Nula'), ('Fabricante'), ('Premium');

INSERT INTO GARANTIA_ESTADOS (ESTADO) VALUES
('Activa'), ('Expirada');

INSERT INTO SERVICIO_TIPOS (TIPO) VALUES
('Mantenimiento'), ('Instalación'), ('Recuperación'), ('Software'),
('Diagnóstico'), ('Configuración'), ('Reparación');

INSERT INTO SERVICIO_ESTADOS (ESTADO) VALUES
('Completado'), ('En Progreso'), ('Pendiente');

INSERT INTO INGRESO_METODOS_PAGO (METODO_PAGO) VALUES
('Transferencia'), ('Tarjeta C'), ('Efectivo'), ('Crédito 30d'),
('Tarjeta D'), ('Crédito 15d');

INSERT INTO INGRESO_MONEDAS (ID_MONEDA, MONEDA) VALUES
(1, 'USD'), (2, 'NIO'); 

-- 2. EMPLEADOS (Unificados)
INSERT INTO EMPLEADOS (ID_EMPLEADO, NOMBRE, APELLIDO, EMAIL, TELEFONO, DIRECCION, SEXO, F_NACIMIENTO, AREA, HORARIO, USERNAME, PASSWORD_HASH, ROL) VALUES
-- Vendedores Originales (1 al 6)
(1, 'vendedor', '01', 'carlos.perez@compunic.com', '8811-2201', NULL, 'M', '1990-05-15', 'Ventas Corporativas', '08:00-17:00', 'vendedor', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'VENDEDOR'),
(2, 'Ana', 'Martinez', 'ana.martinez@compunic.com', '8811-2202', NULL, 'F', '1992-08-20', 'Ventas al Detalle', '09:00-18:00', 'ana.martinez', '$2b$10$Qa60PzwkNqXZIJQDe19FDOAMxk2OWF5d9IgsW3VX8AaOmD7mC0Sfq', 'VENDEDOR'),
(3, 'Luis', 'Gomez', 'luis.gomez@compunic.com', '8811-2203', NULL, 'M', '1988-01-10', 'Ventas en Línea', '08:00-17:00', 'luis.gomez', '$2b$10$Oq3IOSmx/p.I9XsR6uUFa./ckyluFGKr9uHBhnxhkzjxBoeU7jprW', 'VENDEDOR'),
(4, 'Sofia', 'Hernandez', 'sofia.hernandez@compunic.com', '8811-2204', NULL, 'F', '1995-11-30', 'Atención al Cliente', '09:00-18:00', 'sofia.hernandez', '$2b$10$X4aptKDTlU8OMog4UEcag.VpxaUeUDYWUybd6OlLHsUEfUB5x115K', 'VENDEDOR'),
(5, 'Juan', 'Torres', 'juan.torres@compunic.com', '8811-2205', NULL, 'M', '1993-03-25', 'Ventas Corporativas', '08:00-17:00', 'juan.torres', '$2b$10$rli4Jj9CDsanv2EP51VlVed8UmxZAt50l9DbEDPYU.K2Qn47sLKRq', 'VENDEDOR'),
(6, 'Maria', 'Rodriguez', 'maria.rodriguez@compunic.com', '8811-2206', NULL, 'F', '1985-07-12', 'Ventas al Detalle', '09:00-18:00', 'maria.rodriguez', '$2b$10$t61HgZ3E8sXPNxy0cqJAbO29czpla7EShpprS1EWWuAd8NkA/QnTC', 'VENDEDOR'),
-- Administradores (11 al 13)
(11, 'Axel', 'Ruiz', '20230642i.axelruiz@gmail.com', '8740-5434', NULL, 'M', '2004-05-24', 'Ventas', '07:00-18:00', 'axel.ruiz', '$2b$10$WADzWsPtOmU/ji/z5jprXeYu32VSbSALyCzILN8MV4TzgadsYmK9a', 'ADMIN'),
(12, 'Juan', 'Averruz', 'Juan_Averruz.adm@compunic.com', '89040605', NULL, 'M', '2005-12-30', 'Ventas', '07:00-18:00', 'juan.averruz', '$2b$10$xOg2ncxa4mRnox05g8NuGOocTAn04G03o9yMz3jxJtaDjobU6Gxli', 'ADMIN'),
(13, 'Enrique', 'Urbina', 'enriqueu228@gmail.com', '8101-7846', NULL, 'M', '2005-12-30', 'Ventas', '07:00-18:00', 'enrique.urbina', '$2b$10$e0ZC8kb/buk/XIuBdKpMPul.OyX8G3jyjgKCKyruzG1BQYIoqwlaq', 'ADMIN'),
-- Temporales Originales (3001 al 3015)
(3001, 'Miguel', 'Jimenez T.', 'miguel.jimenez.temp@gmail.com', '8888-1001', 'Barrio Monseñor Lezcano', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3002, 'Lucia', 'Flores T.', 'lucia.flores.temp@gmail.com', '8888-1002', 'Km 14 Carretera Masaya', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3003, 'Jorge', 'Mendoza T.', 'jorge.mendoza.temp@gmail.com', '8888-1003', 'Reparto San Juan', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3004, 'Valeria', 'Cruz T.', 'valeria.cruz.temp@gmail.com', '8888-1004', 'Altamira D''Este', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3005, 'Ricardo', 'Diaz T.', 'ricardo.diaz.temp@gmail.com', '8888-1005', 'Bello Horizonte', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3006, 'Andres', 'Gallo', 'andres.gallo.temp@gmail.com', '8888-1006', 'Linda Vista', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3007, 'Brenda', 'Larios', 'brenda.larios.temp@gmail.com', '8888-1007', 'Satélite Asososca', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3008, 'Cesar', 'Montes', 'cesar.montes.temp@gmail.com', '8888-1008', 'Batahola Sur', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3009, 'Diana', 'Fonseca', 'diana.fonseca.temp@gmail.com', '8888-1009', 'Las Colinas', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3010, 'Esteban', 'Quiroz', 'esteban.quiroz.temp@gmail.com', '8888-1010', 'Camino de Oriente', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3011, 'Fabiola', 'Navas', 'fabiola.navas.temp@gmail.com', '8888-1011', 'Villa Fontana', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3012, 'German', 'Ponce', 'german.ponce.temp@gmail.com', '8888-1012', 'Reparto Shick', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3013, 'Hilda', 'Tellez', 'hilda.tellez.temp@gmail.com', '8888-1013', 'Bello Amanecer', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3014, 'Ivan', 'Velasquez', 'ivan.velasquez.temp@gmail.com', '8888-1014', 'Ciudad Sandino', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL'),
(3015, 'Jimena', 'Rizo', 'jimena.rizo.temp@gmail.com', '8888-1015', 'Masaya', NULL, NULL, NULL, NULL, NULL, NULL, 'TEMPORAL');


-- 3. GARANTIAS
INSERT INTO GARANTIAS (ID_GARANTIA, FECHA, CONDICION, EXCLUSIONES, HORA, DURACION_MESES, ID_GARANTIA_TIPO, ID_GARANTIA_ESTADO) VALUES
(101, '2025-01-10', 'Cubre defectos de fábrica', 'Daños físicos, agua o voltaje', '09:00:00', 12, 1, 1),
(102, '2025-01-15', 'Cobertura extendida tienda', 'Software y virus', '10:30:00', 12, 2, 1),
(103, '2025-02-01', 'Solo partes internas', 'Mano de obra y software', '11:00:00', 6, 3, 1),
(104, '2025-02-05', 'Garantía limitada de accesorios', 'Desgaste normal (pads, cables)', '14:15:00', 3, 3, 1),
(105, '2025-03-10', 'Cubre defectos de fábrica', 'Daños por sobretensión', '15:00:00', 12, 1, 1),
(106, '2025-03-12', 'Producto en liquidación (Outlet)', 'Sin garantía', '16:00:00', 0, 4, 2),
(107, '2025-04-01', 'Garantía local (Tramite fabricante)', 'Pines doblados, quemaduras', '09:30:00', 12, 5, 1),
(108, '2025-04-05', 'Cubre defectos de fábrica', 'Daños por agua o caídas', '10:00:00', 12, 1, 1),
(109, '2025-05-20', 'Cobertura Panel Monitor', 'Golpes, <5 píxeles muertos', '11:00:00', 12, 6, 1),
(110, '2025-05-22', 'Cubre defectos de fábrica', 'N/A', '14:00:00', 12, 1, 1),
(111, '2025-06-01', 'Solo partes', 'Mano de obra', '15:00:00', 6, 3, 1),
(112, '2025-06-15', 'Cobertura extendida', 'Software, mal uso', '09:00:00', 12, 2, 1),
(113, '2025-07-01', 'Cubre defectos de fábrica', 'Daños por sobretensión', '10:30:00', 12, 1, 1),
(114, '2025-07-10', 'Garantía limitada de accesorios', 'Desgaste normal', '11:00:00', 3, 3, 1),
(115, '2025-08-14', 'Cubre defectos de fábrica', 'N/A', '14:15:00', 12, 1, 1),
(116, '2025-08-20', 'Producto en liquidación', 'N/A', '15:00:00', 0, 4, 2),
(117, '2025-09-01', 'Garantía local SSD', 'Exceso de TBW (Escritura)', '16:00:00', 12, 5, 1),
(118, '2025-09-10', 'Cubre defectos de fábrica', 'Daños por agua o caídas', '09:30:00', 12, 1, 1),
(119, '2025-10-01', 'Cobertura total', 'N/A', '10:00:00', 12, 6, 1),
(120, '2025-10-05', 'Solo partes', 'Mano de obra', '11:00:00', 6, 3, 1);

-- 4. CLIENTES Y PROVEEDORES (IDs de Empleado actualizados)
INSERT INTO CLIENTES (ID_CLIENTE, NOMBRE, APELLIDO, TELEFONO, EMAIL, PUNTOS, ID_EMPLEADO) VALUES
(1001, 'Empresa A', 'S.A.', '2278-0001', 'compras@empresa-a.com', 0, 1),
(1002, 'Fernanda', 'Montoya', '8765-4321', 'fmontoya@gmail.com', 125, 2),
(1003, 'Marcos', 'Castillo', '8901-2345', 'marcos.castillo@outlook.com', 45, 3),
(1004, 'Universidad UNI', 'R.U.L.', '2270-0002', 'ti@uni.edu.ni', 0, 1),
(1005, 'David', 'Ortega', '8642-1357', 'david.ortega@yahoo.com', 80, 4),
(1006, 'Bufete Legal', 'Asociados', '2266-5544', 'legal@bufete.com', 0, 5),
(1007, 'Lucia', 'Barrios', '8555-1234', 'lucia.barrios@gmail.com', 210, 2),
(1008, 'Restaurante', 'El Sabor', '2299-8877', 'admin@elsabor.com', 0, 6),
(1009, 'Carlos', 'Sandoval', '8333-4455', 'carlos.sandoval@hotmail.com', 35, 11),
(1010, 'Oficina Contable', 'Perez y Cia.', '2244-1122', 'contable@perez.com', 0, 5),
(1011, 'Ana', 'Guzman', '8111-2233', 'ana.guzman@gmail.com', 90, 12),
(1012, 'Roberto', 'Vargas', '8222-3344', 'roberto.vargas@yahoo.com', 15, 13),
(1013, 'Clínica Dental', 'Sonrisas', '2233-4455', 'info@sonrisas.com', 0, 1),
(1014, 'Sofia', 'Molina', '8444-5566', 'sofia.molina@gmail.com', 165, 2),
(1015, 'Miguel', 'Bermudez', '8666-7788', 'miguel.bermudez@outlook.com', 70, 4),
(1016, 'Transporte', 'Rápido S.A.', '2255-7788', 'gerencia@transporterapido.com', 0, 13),
(1017, 'Valeria', 'Campos', '8777-8899', 'valeria.campos@gmail.com', 110, 3),
(1018, 'Hotel', 'Pacífico', '2288-9900', 'reservas@hotelpacifico.com', 0, 5),
(1019, 'Javier', 'Solorzano', '8999-0011', 'javier.solorzano@yahoo.com', 50, 4),
(1020, 'Ferretería', 'El Clavo', '2211-3344', 'gerencia@ferreteriaelclavo.com', 0, 6);

INSERT INTO PROVEEDORES (ID_PROVEEDOR, NOMBRE_EMPRESA, PERSONA_CONTACTO, TELEFONO, DIRECCION, PAGINA_WEB, EMAIL, ID_EMPLEADO) VALUES
(2001, 'Intcomex', 'Sandra Peña', '2266-7788', 'Miami, FL', 'intcomex.com', 'ventas.ni@intcomex.com', 11),
(2002, 'TechData', 'Robert Smith', '2255-4433', 'USA', 'techdata.com', 'robert.smith@techdata.com', 12),
(2003, 'SINERCOM', 'Ernesto Baltodano', '2299-1122', 'Managua', 'sinercom.com.ni', 'ebaltodano@sinercom.com.ni', 13),
(2004, 'Laptop Home', 'Karla Nicaragua', '2277-3344', 'Managua', 'laptophome.com.ni', 'ventas@laptophome.com.ni', 11),
(2005, 'COIMSA', 'Martha Rivas', '2268-0000', 'Managua', 'coimsa.com.ni', 'mrivas@coimsa.com.ni', 12),
(2006, 'Sistemas Aplicativos', 'Luis Martinez', '2250-1234', 'Managua', 'sisa.com.ni', 'luis.martinez@sisa.com.ni', 11),
(2007, 'Dell Nicaragua', 'Ana Chamorro', '2260-5678', 'Managua', 'dell.com.ni', 'ana.chamorro@dell.com', 12),
(2008, 'HP Nicaragua', 'Mario Blanco', '2270-8901', 'Managua', 'hp.com.ni', 'mario.blanco@hp.com', 13),
(2009, 'Kingston Latam', 'Maria Jose', '+(507) 123-456', 'Panamá', 'kingston.com', 'mjose@kingston.com', 11),
(2010, 'Samsung Nicaragua', 'Pedro Guzman', '2240-3456', 'Managua', 'samsung.com.ni', 'pedro.guzman@samsung.com', 12),
(2011, 'Logitech CA', 'Juan Valdez', '+(506) 987-654', 'Costa Rica', 'logitech.com', 'juan.valdez@logitech.com', 13),
(2012, 'Asus CA', 'Sofia Lee', '+(507) 345-678', 'Panamá', 'asus.com', 'sofia.lee@asus.com', 11),
(2013, 'Microsoft Nicaragua', 'Diego Solis', '2280-1212', 'Managua', 'microsoft.com', 'diego.solis@microsoft.com', 12),
(2014, 'Epson Nicaragua', 'Lucia Pineda', '2270-4545', 'Managua', 'epson.com.ni', 'lucia.pineda@epson.com', 13),
(2015, 'TP-Link CA', 'Miguel Angel', '+(507) 567-890', 'Panamá', 'tp-link.com', 'miguel.angel@tp-link.com', 11);

-- 5. PRODUCTOS (IDs de Empleado actualizados)
INSERT INTO PRODUCTOS 
(ID_PRODUCTO, NOMBRE_PRODUCTO, MODELO, DESCRIPCION, PRECIO_COMPRA, PRECIO_VENTA, ID_EMPLEADO, ID_GARANTIAS, ID_PROVEEDOR, ID_MARCA) 
VALUES
(4001, 'Laptop Vostro 3400', 'V3400', 'Laptop Dell Intel i5, 8GB RAM, 256GB SSD.', 22940.00, 27565.00, 11, 101, 2007, 1),
(4002, 'Laptop Pavilion 15', 'PAV15-A', 'Laptop HP Gaming, Ryzen 5, GTX 1650.', 28860.00, 34040.00, 11, 102, 2008, 2),
(4003, 'Laptop IdeaPad 3', 'IP3-15', 'Lenovo uso ofimático, i3, 4GB RAM.', 12950.00, 16650.00, 12, 101, 2003, 3),
(4004, 'Monitor 24" Curvo', 'S24C360', 'Samsung FHD Curvo 75Hz.', 4255.00, 5365.00, 13, 109, 2010, 4),
(4005, 'Monitor 27" Ultrasharp', 'U2720Q', 'Dell Profesional IPS 4K USB-C.', 17760.00, 22200.00, 13, 109, 2007, 1),
(4006, 'Mouse Inalámbrico', 'M170', 'Mouse básico oficina gris.', 314.50, 555.00, 11, 104, 2011, 5),
(4007, 'Teclado Mecánico GPro', 'GPRO-K', 'Logitech TKL RGB Switch Blue.', 3145.00, 4440.00, 11, 104, 2011, 5),
(4008, 'Impresora LaserJet', 'M110w', 'HP Laser monocromática WiFi.', 4995.00, 6475.00, 12, 105, 2008, 2),
(4009, 'Impresora EcoTank', 'L3210', 'Epson Multifuncional tinta continua.', 7030.00, 9065.00, 12, 102, 2014, 6),
(4010, 'SSD Kingston 480GB', 'A400', 'Sata 2.5 pulgadas.', 1036.00, 1665.00, 13, 117, 2009, 7),
(4011, 'SSD Samsung 500GB', '870 EVO', 'Sata 2.5 Alta velocidad.', 1665.00, 2590.00, 13, 117, 2010, 4),
(4012, 'RAM Fury 8GB DDR4', 'KF432C', '3200MHz Disipador negro.', 814.00, 1295.00, 11, 106, 2009, 7),
(4013, 'CPU Core i5-12400', 'i5-12400', 'Intel 12va Gen 6 núcleos.', 5920.00, 7770.00, 11, 107, 2002, 8),
(4014, 'CPU Ryzen 5 5600X', 'R5-5600X', 'AMD AM4 6 núcleos gamer.', 5365.00, 7215.00, 12, 107, 2002, 9),
(4015, 'Motherboard Prime B660M', 'B660M-A', 'Asus para Intel 12/13/14 gen.', 4070.00, 5365.00, 12, 110, 2012, 10),
(4016, 'Motherboard B550M', 'B550M-DS3H', 'Gigabyte AM4 económica.', 3145.00, 4255.00, 13, 110, 2003, 11),
(4017, 'GPU RTX 3060', 'RTX3060-12G', 'Asus Dual Fan 12GB VRAM.', 10730.00, 14060.00, 13, 102, 2012, 12),
(4018, 'GPU Radeon RX 6600', 'RX6600', 'Gigabyte Eagle 8GB.', 7770.00, 10360.00, 11, 102, 2003, 13),
(4019, 'Fuente de Poder 600W', '600W-BR', 'EVGA 80+ Bronze no modular.', 1665.00, 2405.00, 11, 111, 2004, 14),
(4020, 'Case ATX Mid-Tower', 'Q300L', 'Cooler Master MasterBox acrílico.', 1480.00, 2220.00, 11, 116, 2004, 15);

INSERT INTO PRODUCTO_PROVEEDOR (ID_PRODUCTO, ID_PROVEEDOR, PRECIO_COMPRA) VALUES
(4001, 2007, 22940.00), (4002, 2008, 28860.00), (4003, 2003, 12950.00), 
(4004, 2010, 4255.00), (4005, 2007, 17760.00), (4006, 2011, 314.50), 
(4007, 2011, 3145.00), (4008, 2008, 4995.00), (4009, 2014, 7030.00), 
(4010, 2009, 1036.00), (4011, 2010, 1665.00), (4012, 2009, 814.00), 
(4013, 2002, 5920.00), (4014, 2002, 5365.00), (4015, 2012, 4070.00), 
(4016, 2003, 3145.00), (4017, 2012, 10730.00), (4018, 2003, 7770.00), 
(4019, 2004, 1665.00), (4020, 2004, 1480.00);

-- 6. COMPRAS Y DETALLE (IDs de Empleado actualizados)
INSERT INTO COMPRAS (ID_COMPRA, ID_PROVEEDOR, FECHA_COMPRA, ID_EMPLEADO, TOTAL_COMPRA, NUMERO_FACTURA_PROVEEDOR) VALUES 
(1, 2007, '2025-01-10', 11, 229400.00, 'FAC-001001'),
(2, 2008, '2025-01-15', 11, 432900.00, 'FAC-001002'),
(3, 2003, '2025-02-01', 12, 259000.00, 'FAC-001003'),
(4, 2010, '2025-02-05', 13, 106375.00, 'FAC-001004'),
(5, 2007, '2025-03-10', 13, 177600.00, 'FAC-001005'),
(6, 2011, '2025-03-12', 11, 15725.00, 'FAC-001006'),
(7, 2011, '2025-04-01', 11, 125800.00, 'FAC-001007'),
(8, 2008, '2025-04-05', 12, 74925.00, 'FAC-001008'),
(9, 2014, '2025-05-20', 12, 70300.00, 'FAC-001009'),
(10, 2009, '2025-05-22', 13, 103600.00, 'FAC-001010'),
(11, 2010, '2025-06-01', 13, 133200.00, 'FAC-001011'),
(12, 2009, '2025-06-15', 11, 122100.00, 'FAC-001012'),
(13, 2002, '2025-07-01', 11, 177600.00, 'FAC-001013'),
(14, 2002, '2025-07-10', 12, 160950.00, 'FAC-001014'),
(15, 2012, '2025-08-14', 12, 81400.00, 'FAC-001015'),
(16, 2003, '2025-08-20', 13, 62900.00, 'FAC-001016'),
(17, 2012, '2025-09-01', 13, 107300.00, 'FAC-001017'),
(18, 2003, '2025-09-10', 11, 77700.00, 'FAC-001018'),
(19, 2004, '2025-10-01', 12, 41625.00, 'FAC-001019'),
(20, 2004, '2025-10-05', 13, 44400.00, 'FAC-001020');

INSERT INTO DETALLE_COMPRA (ID_COMPRA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO_COMPRA, MESES_GARANTIA) VALUES 
(1, 4001, 10, 22940.00, 12),
(2, 4002, 15, 28860.00, 12),
(3, 4003, 20, 12950.00, 12),
(4, 4004, 25, 4255.00, 12),
(5, 4005, 10, 17760.00, 12),
(6, 4006, 50, 314.50, 3),
(7, 4007, 40, 3145.00, 6),
(8, 4008, 15, 4995.00, 12),
(9, 4009, 10, 7030.00, 12),
(10, 4010, 100, 1036.00, 12),
(11, 4011, 80, 1665.00, 12),
(12, 4012, 150, 814.00, 12),
(13, 4013, 30, 5920.00, 12),
(14, 4014, 30, 5365.00, 12),
(15, 4015, 20, 4070.00, 12),
(16, 4016, 20, 3145.00, 12),
(17, 4017, 10, 10730.00, 12),
(18, 4018, 10, 7770.00, 12),
(19, 4019, 25, 1665.00, 6),
(20, 4020, 30, 1480.00, 1);

-- 7. VENTAS Y DETALLE (IDs de Empleado actualizados)
INSERT INTO VENTAS (
    ID_VENTA, FECHA, ID_CLIENTE, ID_EMPLEADO, 
    ESTADO, TIPO_ENTREGA, DIRECCION_ENVIO, 
    TOTAL, MONTO_ADELANTO, REFERENCIA_BANCARIA, COMPROBANTE_URL, FACTURA
) VALUES
-- Pedidos Completados (Retiro en tienda: Sin dirección, adelanto 0, pago 100% en tienda)
(6001, '2025-09-28 09:00:00', 1001, 1, 'Completado', 'Retiro en Tienda', NULL, 27565.00, 0.00, NULL, NULL, 'FAC-V001'),
(6002, '2025-09-30 10:15:00', 1002, 2, 'Completado', 'Retiro en Tienda', NULL, 10730.00, 0.00, NULL, NULL, 'FAC-V002'),
(6003, '2025-10-01 11:30:00', 1003, 3, 'Completado', 'Retiro en Tienda', NULL, 555.00, 0.00, NULL, NULL, 'FAC-V003'),

-- Pedidos Completados (Envío a domicilio: Con dirección, tuvieron adelanto del 50%, ya tienen factura)
(6004, '2025-10-02 14:00:00', 1004, 1, 'Completado', 'Envio a Domicilio', 'Managua, Rotonda el Periodista 1c al sur', 131350.00, 65675.00, 'REF-001928', NULL, 'FAC-V004'),
(6005, '2025-10-03 09:45:00', 1005, 4, 'Completado', 'Envio a Domicilio', 'León, Parque Central 2c al norte', 1665.00, 832.50, 'REF-002847', NULL, 'FAC-V005'),

-- Más pedidos completados mixtos
(6006, '2025-10-03 16:20:00', 1002, 2, 'Completado', 'Retiro en Tienda', NULL, 4440.00, 0.00, NULL, NULL, 'FAC-V006'),
(6007, '2025-10-04 10:00:00', 1006, 5, 'Completado', 'Retiro en Tienda', NULL, 6475.00, 0.00, NULL, NULL, 'FAC-V007'),
(6008, '2025-10-04 15:30:00', 1007, 2, 'Completado', 'Retiro en Tienda', NULL, 20350.00, 0.00, NULL, NULL, 'FAC-V008'),
(6009, '2025-10-05 11:00:00', 1008, 6, 'Completado', 'Retiro en Tienda', NULL, 28120.00, 0.00, NULL, NULL, 'FAC-V009'),
(6010, '2025-10-05 13:45:00', 1009, 11, 'Completado', 'Envio a Domicilio', 'Masaya, Mercado de Artesanías 1c al este', 2405.00, 1202.50, 'REF-003746', NULL, 'FAC-V010'),
(6011, '2025-10-06 09:15:00', 1010, 5, 'Completado', 'Retiro en Tienda', NULL, 16650.00, 0.00, NULL, NULL, 'FAC-V011'),
(6012, '2025-10-07 16:00:00', 1011, 12, 'Completado', 'Retiro en Tienda', NULL, 1665.00, 0.00, NULL, NULL, 'FAC-V012'),

-- Pedido Rechazado (Para que se vea en el dashboard)
(6013, '2025-10-08 10:30:00', 1012, 13, 'Rechazado', 'Envio a Domicilio', 'Managua, Plaza Inter', 0.00, 0.00, 'REF-FALSO123', NULL, NULL),

-- Más completados
(6014, '2025-10-09 14:20:00', 1004, 1, 'Completado', 'Retiro en Tienda', NULL, 25900.00, 0.00, NULL, NULL, 'FAC-V014'),
(6015, '2025-10-10 11:10:00', 1014, 2, 'Completado', 'Retiro en Tienda', NULL, 34040.00, 0.00, NULL, NULL, 'FAC-V015'),
(6016, '2025-10-11 09:50:00', 1015, 4, 'Completado', 'Envio a Domicilio', 'Managua, UCA 2c al sur', 5365.00, 2682.50, 'REF-004657', NULL, 'FAC-V016'),
(6017, '2025-10-12 15:05:00', 1016, 13, 'Completado', 'Retiro en Tienda', NULL, 25900.00, 0.00, NULL, NULL, 'FAC-V017'),

-- ¡Pedidos Pendientes para probar el Dashboard de Administración! (Factura NULL, calculo 50% aplicado)
(6018, '2025-10-13 13:00:00', 1017, 3, 'Pendiente de Verificacion', 'Envio a Domicilio', 'Managua, Bello Horizonte', 22200.00, 11100.00, 'REF-993847', NULL, NULL),
(6019, '2025-10-14 10:40:00', 1018, 5, 'Pendiente de Verificacion', 'Envio a Domicilio', 'San Juan del Sur, Frente a la playa', 44400.00, 22200.00, 'REF-112233', NULL, NULL),
(6020, '2025-10-15 17:00:00', 1019, 4, 'Pendiente de Verificacion', 'Envio a Domicilio', 'Managua, Galerias Santo Domingo', 10360.00, 5180.00, 'REF-887766', NULL, NULL);

INSERT INTO VENTAS_PRODUCTOS (ID_VENTA, ID_PRODUCTO, cantidad_neta, precio_venta, sub_total) VALUES
(6001, 4001, 1, 27565.00, 27565.00), 
(6002, 4004, 2, 5365.00, 10730.00), 
(6003, 4006, 1, 555.00, 555.00),
(6004, 4013, 10, 7770.00, 77700.00),
(6005, 4010, 1, 1665.00, 1665.00), 
(6006, 4007, 1, 4440.00, 4440.00),
(6007, 4012, 5, 1295.00, 6475.00), 
(6008, 4020, 1, 2220.00, 2220.00),
(6009, 4017, 2, 14060.00, 28120.00),
(6010, 4019, 1, 2405.00, 2405.00), 
(6011, 4003, 1, 16650.00, 16650.00), 
(6012, 4006, 3, 555.00, 1665.00),
(6008, 4009, 2, 9065.00, 18130.00), 
(6014, 4012, 20, 1295.00, 25900.00), 
(6015, 4002, 1, 34040.00, 34040.00),
(6016, 4015, 1, 5365.00, 5365.00), 
(6017, 4008, 4, 6475.00, 25900.00), 
(6018, 4005, 1, 22200.00, 22200.00),
(6019, 4007, 10, 4440.00, 44400.00), 
(6020, 4018, 1, 10360.00, 10360.00),
(6004, 4015, 10, 5365.00, 53650.00); 

-- 8. SERVICIOS (IDs de Empleado actualizados)
INSERT INTO SERVICIOS (ID_SERVICIO, DESCRIPCION, FECHA_SOLICITUD, FECHA_EJECUCION, COSTO, ID_EMPLEADO, ID_CLIENTE, ID_GARANTIA, ID_SERVICIO_TIPO, ID_SERVICIO_ESTADO) VALUES
(7001, 'Mantenimiento Preventivo PC (Limpieza + Pasta Térmica)', '2025-10-01', '2025-10-02', 1295.00, 3001, 1001, 101, 1, 1),
(7002, 'Instalación de Red Cableado Estructurado', '2025-10-03', '2025-10-05', 9250.00, 3002, 1004, 101, 2, 1),
(7003, 'Recuperación de Datos HDD Dañado', '2025-10-05', '2025-10-08', 4440.00, 3003, 1003, 106, 3, 1),
(7004, 'Formateo, Drivers y Paquete Office', '2025-10-10', '2025-10-10', 1480.00, 3001, 1002, 106, 4, 1),
(7005, 'Diagnóstico de Laptop', '2025-10-11', NULL, 740.00, 3004, 1005, 101, 5, 2),
(7006, 'Limpieza de Virus y Optimización', '2025-10-12', '2025-10-12', 1110.00, 3005, 1007, 106, 4, 1),
(7007, 'Configuración Impresora Fiscal en Red', '2025-10-13', NULL, 2220.00, 3002, 1006, 105, 6, 3),
(7008, 'Mantenimiento Preventivo Impresora', '2025-10-14', '2025-10-14', 1295.00, 3006, 1008, 105, 1, 1),
(7009, 'Instalación de Kit CCTV 4 Cámaras', '2025-10-15', NULL, 12950.00, 3007, 1010, 106, 2, 3),
(7010, 'Formateo e Instalación SO Licencia Original', '2025-10-16', '2025-10-16', 2220.00, 3008, 1009, 106, 4, 1),
(7011, 'Cambio de Pantalla Laptop (Mano de obra)', '2025-10-17', '2025-10-18', 1665.00, 3009, 1011, 102, 7, 1),
(7012, 'Instalación de Rack de Servidores', '2025-10-18', NULL, 11100.00, 3010, 1013, 101, 2, 3),
(7013, 'Diagnóstico de Servidor Empresarial', '2025-10-19', '2025-10-20', 3700.00, 3011, 1016, 101, 5, 1),
(7014, 'Mantenimiento Preventivo PC Gamer', '2025-10-20', '2025-10-20', 1665.00, 3012, 1014, 106, 1, 1),
(7015, 'Limpieza de Ransomware (Intento)', '2025-10-21', NULL, 2960.00, 3013, 1015, 106, 4, 2),
(7016, 'Recuperación de Datos (Software)', '2025-10-22', '2025-10-24', 2960.00, 3014, 1017, 106, 3, 1),
(7017, 'Formateo e Instalación Linux', '2025-10-23', '2025-10-23', 1480.00, 3015, 1018, 106, 4, 1),
(7018, 'Diagnóstico de Laptop', '2025-10-24', NULL, 740.00, 3001, 1019, 103, 5, 2),
(7019, 'Configuración de Correo Outlook Exchange', '2025-10-25', '2025-10-25', 1850.00, 3002, 1020, 106, 6, 1),
(7020, 'Mantenimiento Preventivo PC', '2025-10-26', NULL, 1295.00, 3003, 1001, 101, 1, 3);

-- 9. RELACIONES Y FINANZAS
INSERT INTO Productos_servicios (ID_PRODUCTOS, ID_SERVICIO, FECHA_ASIGNACION) VALUES
(4001, 7001, '2025-10-01'), (4001, 7005, '2025-10-11'), (4002, 7004, '2025-10-10'),
(4008, 7008, '2025-10-14'), (4003, 7011, '2025-10-17'), (4001, 7018, '2025-10-24'),
(4001, 7020, '2025-10-26'), (4004, 7001, '2025-10-01'), (4005, 7001, '2025-10-01'),
(4010, 7003, '2025-10-05'), (4011, 7016, '2025-10-22'), (4017, 7005, '2025-10-11');

INSERT INTO PRODUCTO_CATEGORIA (ID_PRODUCTO, ID_CATEGORIA) VALUES
(4001, 1), (4002, 1), (4003, 1), (4004, 2), (4005, 2), (4006, 3), (4006, 4),
(4007, 3), (4007, 4), (4008, 5), (4009, 5), (4010, 6), (4010, 7), (4011, 6),
(4011, 7), (4012, 8), (4012, 7), (4013, 9), (4013, 7), (4014, 9), (4014, 7),
(4015, 10), (4015, 7), (4016, 10), (4016, 7), (4017, 11), (4017, 7), (4018, 11),
(4018, 7), (4019, 12), (4019, 7), (4020, 13), (4020, 7);

INSERT INTO INGRESOS (ID_INGRESO, FECHA_PAGO, ID_CLIENTE, MONTO, ID_METODO_PAGO, ID_MONEDA, ID_VENTA, ID_SERVICIO) VALUES
(5001, '2025-10-01', 1001, 27565.00, 1, 2, 6001, NULL), 
(5002, '2025-10-01', 1002, 10730.00, 2, 2, 6002, NULL),  
(5003, '2025-10-02', 1003, 4440.00, 3, 2, NULL, 7003),  
(5004, '2025-10-03', 1004, 131350.00, 4, 2, 6004, NULL), 
(5005, '2025-10-03', 1002, 4440.00, 5, 2, 6006, NULL),   
(5006, '2025-10-04', 1005, 1665.00, 3, 2, 6005, NULL),   
(5007, '2025-10-05', 1006, 2220.00, 6, 2, NULL, 7007),   
(5008, '2025-10-05', 1007, 20350.00, 3, 2, 6008, NULL),  
(5009, '2025-10-06', 1008, 28120.00, 1, 2, 6009, NULL), 
(5010, '2025-10-07', 1009, 2405.00, 2, 2, 6010, NULL),  
(5011, '2025-10-08', 1010, 16650.00, 4, 2, 6011, NULL),  
(5012, '2025-10-09', 1011, 1665.00, 3, 2, NULL, 7011),   
(5013, '2025-10-10', 1012, 0.00, 2, 2, 6013, NULL), 
(5014, '2025-10-10', 1004, 25900.00, 1, 2, 6014, NULL), 
(5016, '2025-10-12', 1015, 5365.00, 5, 2, 6016, NULL),  
(5017, '2025-10-13', 1016, 25900.00, 4, 2, 6017, NULL),  
(5018, '2025-10-14', 1017, 22200.00, 3, 2, 6018, NULL),  
(5019, '2025-10-15', 1018, 44400.00, 1, 2, 6019, NULL),  
(5020, '2025-10-15', 1019, 10360.00, 2, 2, 6020, NULL);

-- ==========================================
-- 10. PROCEDIMIENTOS ALMACENADOS
-- ==========================================

DELIMITER //

CREATE PROCEDURE sp_BuscarPrecioProducto(
    IN p_nombre_modelo VARCHAR(100)
)
BEGIN
    SELECT 
        NOMBRE_PRODUCTO, 
        MODELO, 
        PRECIO_VENTA,
        ID_GARANTIAS
    FROM PRODUCTOS 
    WHERE NOMBRE_PRODUCTO LIKE CONCAT('%', p_nombre_modelo, '%') 
       OR MODELO LIKE CONCAT('%', p_nombre_modelo, '%');
END //

DELIMITER ;

CALL sp_BuscarPrecioProducto('Laptop');

-- Procedimiento actualizado con ID_EMPLEADO
DELIMITER //

CREATE PROCEDURE sp_NuevoCliente(
    IN p_nombre VARCHAR(100),
    IN p_apellido VARCHAR(100),
    IN p_telefono VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_id_empleado INT
)
BEGIN
    INSERT INTO CLIENTES (NOMBRE, APELLIDO, TELEFONO, EMAIL, ID_EMPLEADO) 
    VALUES (p_nombre, p_apellido, p_telefono, p_email, p_id_empleado);
END //

DELIMITER ;

CALL sp_NuevoCliente('Juan', 'Pérez', '8888-9999', 'juanperez@gmail.com', 1);

-- Procedimiento actualizado con ID_EMPLEADO
DELIMITER //

CREATE PROCEDURE sp_VentasPorVendedor(
    IN p_id_empleado INT
)
BEGIN
    SELECT 
        FACTURA, 
        FECHA, 
        TOTAL 
    FROM VENTAS 
    WHERE ID_EMPLEADO = p_id_empleado
    ORDER BY FECHA DESC;
END //

DELIMITER ;

CALL sp_VentasPorVendedor(1);

-- ==========================================
-- 11. ACTUALIZACIONES DE IMÁGENES
-- ==========================================

UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1775690946731-405021595.jpg' WHERE ID_PRODUCTO = 4001;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1775690504568-355039167.png' WHERE ID_PRODUCTO = 4002;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1774039977822-452197659.png' WHERE ID_PRODUCTO = 4003;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1774029590295-289642088.png' WHERE ID_PRODUCTO = 4004;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1772337570089-527072682.png' WHERE ID_PRODUCTO = 4005;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1772058116421-625295483.png' WHERE ID_PRODUCTO = 4006;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1772054874222-809086477.jpg' WHERE ID_PRODUCTO = 4007;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1772049889235-414280856.jpg' WHERE ID_PRODUCTO = 4008;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1771980283673-393463041.jpg' WHERE ID_PRODUCTO = 4009;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1771647829869-919772094.jpg' WHERE ID_PRODUCTO = 4010;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768104410298-119290909.png' WHERE ID_PRODUCTO = 4011;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768021548445-140311350.jpg' WHERE ID_PRODUCTO = 4012;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768021433711-515191660.webp' WHERE ID_PRODUCTO = 4013;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768021126680-284531162.webp' WHERE ID_PRODUCTO = 4014;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768020956935-169598838.jpg' WHERE ID_PRODUCTO = 4015;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768020875703-6201071.jpg' WHERE ID_PRODUCTO = 4016;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768020768815-7539728.png' WHERE ID_PRODUCTO = 4017;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768020616496-354525317.png' WHERE ID_PRODUCTO = 4018;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768020471883-531269574.jpg' WHERE ID_PRODUCTO = 4019;
UPDATE PRODUCTOS SET IMAGEN_URL = 'uploads/productos/producto_1768008181592-377506880.jpg' WHERE ID_PRODUCTO = 4020;