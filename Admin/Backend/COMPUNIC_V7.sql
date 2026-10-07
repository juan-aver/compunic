-- ==================================================================================
-- BASE DE DATOS: COMPUNIC_V5 (Compatible con COMPUNIC_V7)
-- SISTEMA DE GESTIÓN INTEGRAL COMPUNIC
-- Cumplimiento total de Requerimientos de Usuario (UR-01 al UR-22)
-- y Requisitos Funcionales (REQ-FR-01 al REQ-FR-60)
-- ==================================================================================

DROP DATABASE IF EXISTS COMPUNIC_V5;
CREATE DATABASE COMPUNIC_V5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE COMPUNIC_V5;

-- ==========================================
-- 1. TABLAS CATÁLOGO (Nivel 0)
-- ==========================================

-- REQ-FR-07: Categorías con soporte de habilitar/deshabilitar
CREATE TABLE CATEGORIAS (
    ID_CATEGORIA INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_CATEGORIA VARCHAR(100) UNIQUE NOT NULL,
    ACTIVO TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MARCAS (
    ID_MARCA INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_MARCA VARCHAR(100) UNIQUE NOT NULL,
    ACTIVO TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE GARANTIA_TIPOS (
    ID_GARANTIA_TIPO INT PRIMARY KEY AUTO_INCREMENT,
    TIPO VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE GARANTIA_ESTADOS (
    ID_GARANTIA_ESTADO INT PRIMARY KEY AUTO_INCREMENT,
    ESTADO VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SERVICIO_TIPOS (
    ID_SERVICIO_TIPO INT PRIMARY KEY AUTO_INCREMENT,
    TIPO VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SERVICIO_ESTADOS (
    ID_SERVICIO_ESTADO INT PRIMARY KEY AUTO_INCREMENT,
    ESTADO VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE INGRESO_METODOS_PAGO (
    ID_METODO_PAGO INT PRIMARY KEY AUTO_INCREMENT,
    METODO_PAGO VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE INGRESO_MONEDAS (
    ID_MONEDA INT PRIMARY KEY AUTO_INCREMENT,
    MONEDA VARCHAR(10) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. EMPLEADOS, ROLES Y AUDITORÍA
-- ==========================================

-- UR-01, REQ-FR-09, REQ-FR-10: Soporte formal para roles ADMIN, VENDEDOR, CAJERO, TECNICO, TEMPORAL
CREATE TABLE EMPLEADOS (
    ID_EMPLEADO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(100) NOT NULL,
    APELLIDO VARCHAR(100) NOT NULL,
    TELEFONO VARCHAR(20),
    EMAIL VARCHAR(255),
    DIRECCION VARCHAR(500),
    SEXO CHAR(1),
    F_NACIMIENTO DATE,
    AREA VARCHAR(100),
    HORARIO VARCHAR(50),
    USERNAME VARCHAR(50) UNIQUE,
    PASSWORD_HASH VARCHAR(255),
    ROL ENUM(
        'ADMIN',
        'VENDEDOR',
        'CAJERO',
        'TECNICO',
        'TEMPORAL'
    ) NOT NULL DEFAULT 'VENDEDOR',
    ESTADO TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE EMPLEADOS 
MODIFY COLUMN ROL ENUM('ADMIN', 'VENDEDOR', 'CAJERO', 'TECNICO', 'TEMPORAL') 
NOT NULL DEFAULT 'VENDEDOR';


-- REQ-FR-45, REQ-FR-46: Recuperación de credenciales
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

-- UR-05, REQ-FR-12: Bitácora de auditoría detallando fecha, usuario, acción, tabla e IP
CREATE TABLE AUDITORIA (
    ID_AUDITORIA INT PRIMARY KEY AUTO_INCREMENT,
    FECHA_HORA DATETIME DEFAULT CURRENT_TIMESTAMP,
    ID_EMPLEADO INT NULL,
    USUARIO VARCHAR(100) NULL,
    ACCION VARCHAR(50) NOT NULL,
    TABLA VARCHAR(50) NULL,
    ID_REGISTRO INT NULL,
    DETALLE TEXT NULL,
    IP VARCHAR(45) NULL,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO) ON DELETE SET NULL,
    INDEX idx_fecha (FECHA_HORA),
    INDEX idx_empleado (ID_EMPLEADO),
    INDEX idx_accion (ACCION),
    INDEX idx_tabla (TABLA)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. GARANTÍAS (Políticas y Condiciones)
-- ==========================================

-- REQ-FR-11: Políticas de garantías con duración y condiciones
CREATE TABLE GARANTIAS (
    ID_GARANTIA INT PRIMARY KEY,
    FECHA DATE,
    CONDICION VARCHAR(500),
    EXCLUSIONES VARCHAR(1000),
    HORA TIME,
    DURACION_MESES INT DEFAULT 12,
    ID_GARANTIA_TIPO INT,
    ID_GARANTIA_ESTADO INT,
    FOREIGN KEY (ID_GARANTIA_TIPO) REFERENCES GARANTIA_TIPOS (ID_GARANTIA_TIPO),
    FOREIGN KEY (ID_GARANTIA_ESTADO) REFERENCES GARANTIA_ESTADOS (ID_GARANTIA_ESTADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. CLIENTES Y PROVEEDORES
-- ==========================================

-- UR-10, UR-19, REQ-FR-13, REQ-FR-20: Registro de clientes naturales e institucionales con RUC
CREATE TABLE CLIENTES (
    ID_CLIENTE INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(100) NOT NULL,
    APELLIDO VARCHAR(100) NOT NULL,
    TELEFONO VARCHAR(20),
    EMAIL VARCHAR(255),
    PASSWORD_HASH VARCHAR(255) NULL,
    CEDULA VARCHAR(20) UNIQUE,
    TIPO_CLIENTE ENUM('Natural', 'Institucional') DEFAULT 'Natural',
    RUC VARCHAR(50) NULL,
    RAZON_SOCIAL VARCHAR(200) NULL,
    PUNTOS INT DEFAULT 0,
    ID_EMPLEADO INT NULL,
    ACTIVO TINYINT DEFAULT 1,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQ-FR-32, REQ-FR-36: Datos corporativos y contacto de proveedores
CREATE TABLE PROVEEDORES (
    ID_PROVEEDOR INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_EMPRESA VARCHAR(255) NOT NULL,
    PERSONA_CONTACTO VARCHAR(255),
    TELEFONO VARCHAR(20),
    DIRECCION VARCHAR(500),
    PAGINA_WEB VARCHAR(255),
    EMAIL VARCHAR(255),
    ID_EMPLEADO INT NULL,
    ACTIVO TINYINT DEFAULT 1,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. PRODUCTOS, SERIES E INVENTARIO
-- ==========================================

-- UR-02, REQ-FR-04, REQ-FR-06: Catálogo de productos con modelo, marca, categoría, proveedor y precios
CREATE TABLE PRODUCTOS (
    ID_PRODUCTO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE_PRODUCTO VARCHAR(255) NOT NULL,
    MODELO VARCHAR(100),
    DESCRIPCION VARCHAR(500),
    IMAGEN_URL VARCHAR(255), 
    PRECIO_COMPRA DECIMAL(12, 2) NOT NULL DEFAULT 0.00, 
    PRECIO_VENTA DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ID_MARCA INT,
    ID_EMPLEADO INT,
    ID_GARANTIAS INT,
    ID_PROVEEDOR INT, 
    ACTIVO TINYINT DEFAULT 1,
    FOREIGN KEY (ID_MARCA) REFERENCES MARCAS(ID_MARCA),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO),
    FOREIGN KEY (ID_GARANTIAS) REFERENCES GARANTIAS(ID_GARANTIA),
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES(ID_PROVEEDOR)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PRODUCTO_PROVEEDOR (
    ID_PRODUCTO INT NOT NULL,
    ID_PROVEEDOR INT NOT NULL,
    PRECIO_COMPRA DECIMAL(12, 2),
    PRIMARY KEY (ID_PRODUCTO, ID_PROVEEDOR),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES (ID_PROVEEDOR)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PRODUCTO_CATEGORIA (
    ID_PRODUCTO INT NOT NULL,
    ID_CATEGORIA INT NOT NULL,
    PRIMARY KEY (ID_PRODUCTO, ID_CATEGORIA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_CATEGORIA) REFERENCES CATEGORIAS (ID_CATEGORIA)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. COMPRAS Y DEVOLUCIONES A PROVEEDORES
-- ==========================================

-- UR-04, REQ-FR-33, REQ-FR-34, REQ-FR-35: Registro de compras y subtotal/IVA/total
CREATE TABLE COMPRAS (
    ID_COMPRA INT PRIMARY KEY AUTO_INCREMENT,
    ID_PROVEEDOR INT NOT NULL,
    FECHA_COMPRA DATE DEFAULT(CURRENT_DATE),
    NUMERO_FACTURA_PROVEEDOR VARCHAR(50) NOT NULL,
    TOTAL_COMPRA DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    IVA_PORCENTAJE DECIMAL(5, 2) DEFAULT 15.00 COMMENT 'Porcentaje de IVA fijo (15%)',
    ID_EMPLEADO INT,
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES (ID_PROVEEDOR),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO),
    CONSTRAINT UQ_PROVEEDOR_FACTURA UNIQUE (
        ID_PROVEEDOR,
        NUMERO_FACTURA_PROVEEDOR
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE DETALLE_COMPRA (
    ID_DETALLE INT PRIMARY KEY AUTO_INCREMENT,
    ID_COMPRA INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    PRECIO_UNITARIO_COMPRA DECIMAL(12, 2) NOT NULL,
    MESES_GARANTIA INT DEFAULT 0,
    SUBTOTAL DECIMAL(12, 2) GENERATED ALWAYS AS (
        CANTIDAD * PRECIO_UNITARIO_COMPRA
    ) STORED,
    FOREIGN KEY (ID_COMPRA) REFERENCES COMPRAS (ID_COMPRA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQ-FR-31: Devoluciones a proveedores
CREATE TABLE DEVOLUCIONES_PROVEEDORES (
    ID_DEVOLUCION_PROV INT PRIMARY KEY AUTO_INCREMENT,
    ID_COMPRA INT NULL,
    ID_PROVEEDOR INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    MOTIVO TEXT NOT NULL,
    ESTADO ENUM('Pendiente', 'Aprobada', 'Rechazada', 'Reemplazo_Recibido', 'Reembolso_Recibido') DEFAULT 'Pendiente',
    ID_EMPLEADO INT NOT NULL,
    FECHA DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_COMPRA) REFERENCES COMPRAS (ID_COMPRA),
    FOREIGN KEY (ID_PROVEEDOR) REFERENCES PROVEEDORES (ID_PROVEEDOR),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 7. MERMAS Y PÉRDIDAS DE INVENTARIO
-- ==========================================

-- REQ-FR-05: Pérdidas/mermas con justificación obligatoria y descuento de stock
CREATE TABLE MERMAS (
    ID_MERMA INT PRIMARY KEY AUTO_INCREMENT,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    MOTIVO ENUM('Dañado', 'Defectuoso', 'Vencido', 'Extraviado', 'Obsolescencia', 'Otro') NOT NULL,
    JUSTIFICACION TEXT NOT NULL,
    COSTO_UNITARIO DECIMAL(12, 2) NOT NULL,
    COSTO_TOTAL DECIMAL(12, 2) NOT NULL,
    ID_EMPLEADO INT NOT NULL,
    FECHA_REGISTRO DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 8. CAJA CHICA, TURNOS Y ARQUEOS DIARIOS
-- ==========================================

-- UR-12, UR-14, REQ-FR-47, REQ-FR-48, REQ-FR-54: Turnos, apertura, arqueo y cierre de caja
CREATE TABLE CAJA_SESIONES (
    ID_CAJA_SESION INT PRIMARY KEY AUTO_INCREMENT,
    ID_EMPLEADO INT NOT NULL,
    FECHA_APERTURA DATETIME DEFAULT CURRENT_TIMESTAMP,
    MONTO_INICIAL DECIMAL(12, 2) NOT NULL COMMENT 'Fondo de caja chica al abrir turno',
    FECHA_CIERRE DATETIME NULL,
    MONTO_ESPERADO DECIMAL(12, 2) NULL COMMENT 'Calculado por el sistema: Inicial + Entradas - Salidas + Ventas Ef.',
    MONTO_REAL DECIMAL(12, 2) NULL COMMENT 'Efectivo físico contado por el cajero',
    DIFERENCIA DECIMAL(12, 2) NULL COMMENT 'Faltante (negativo) o Sobrante (positivo)',
    ESTADO ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
    OBSERVACIONES TEXT NULL,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQ-FR-52, REQ-FR-53: Entradas y salidas directas de caja (inyección de cambio, gastos menores, pagos)
CREATE TABLE CAJA_MOVIMIENTOS (
    ID_MOVIMIENTO_CAJA INT PRIMARY KEY AUTO_INCREMENT,
    ID_CAJA_SESION INT NOT NULL,
    ID_EMPLEADO INT NOT NULL,
    TIPO_MOVIMIENTO ENUM('INGRESO', 'EGRESO') NOT NULL,
    CONCEPTO VARCHAR(255) NOT NULL,
    MONTO DECIMAL(12, 2) NOT NULL,
    FECHA_HORA DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_CAJA_SESION) REFERENCES CAJA_SESIONES(ID_CAJA_SESION),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 9. VENTAS, PROFORMAS Y DEVOLUCIONES
-- ==========================================

-- UR-09, UR-13, REQ-FR-18, REQ-FR-21 a REQ-FR-26, REQ-FR-49 a REQ-FR-51, REQ-FR-56:
-- Ventas con desglose de IVA, RUC, canal físico/web, pagos combinados y cambio
CREATE TABLE VENTAS (
    ID_VENTA INT PRIMARY KEY AUTO_INCREMENT,
    FECHA DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ID_CLIENTE INT NOT NULL,
    ID_EMPLEADO INT NULL,
    ESTADO ENUM(
        'Pendiente de Verificacion',
        'Aprobado',
        'Rechazado',
        'Completado'
    ) DEFAULT 'Pendiente de Verificacion',
    TIPO_ENTREGA ENUM(
        'Retiro en Tienda',
        'Envio a Domicilio'
    ) NOT NULL DEFAULT 'Retiro en Tienda',
    DIRECCION_ENVIO VARCHAR(500) NULL,
    SUBTOTAL DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    IVA DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    TOTAL DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MONTO_ADELANTO DECIMAL(12, 2) DEFAULT 0.00,
    MONTO_RECIBIDO DECIMAL(12, 2) DEFAULT 0.00,
    CAMBIO DECIMAL(12, 2) DEFAULT 0.00,
    METODO_PAGO_TEXT VARCHAR(100) NULL,
    REFERENCIA_BANCARIA VARCHAR(100) NULL,
    COMPROBANTE_URL VARCHAR(255) NULL,
    FACTURA VARCHAR(50) NULL UNIQUE,
    TIPO_CANAL ENUM('TIENDA_FISICA', 'TIENDA_WEB') DEFAULT 'TIENDA_FISICA',
    NOMBRE_CLIENTE_OCASIONAL VARCHAR(255) NULL,
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES (ID_CLIENTE),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE VENTAS_PRODUCTOS (
    ID_VENTA INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    cantidad_neta INT NOT NULL,
    precio_venta DECIMAL(12, 2) NOT NULL,
    sub_total DECIMAL(12, 2) NOT NULL,
    numeros_serie VARCHAR(500) NULL,
    PRIMARY KEY (ID_VENTA, ID_PRODUCTO),
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS (ID_VENTA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UR-08, REQ-FR-19, REQ-FR-20: Cotizaciones / Proformas comerciales con vigencia temporal
CREATE TABLE COTIZACIONES (
    ID_COTIZACION INT PRIMARY KEY AUTO_INCREMENT,
    NUMERO_COTIZACION VARCHAR(50) UNIQUE NOT NULL,
    FECHA_EMISION DATETIME DEFAULT CURRENT_TIMESTAMP,
    FECHA_VENCIMIENTO DATE NOT NULL,
    ID_CLIENTE INT NOT NULL,
    ID_EMPLEADO INT NOT NULL,
    SUBTOTAL DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    IVA DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    TOTAL DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ESTADO ENUM('Pendiente', 'Aceptada', 'Rechazada', 'Vencida', 'Convertida') DEFAULT 'Pendiente',
    NOTAS TEXT NULL,
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES(ID_CLIENTE),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE COTIZACION_PRODUCTOS (
    ID_COTIZACION INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    PRECIO_UNITARIO DECIMAL(12, 2) NOT NULL,
    SUBTOTAL DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (ID_COTIZACION, ID_PRODUCTO),
    FOREIGN KEY (ID_COTIZACION) REFERENCES COTIZACIONES(ID_COTIZACION) ON DELETE CASCADE,
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS(ID_PRODUCTO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UR-03, UR-11, REQ-FR-27 a REQ-FR-30: Devoluciones de clientes y disposición final
CREATE TABLE DEVOLUCIONES (
    ID_DEVOLUCION INT PRIMARY KEY AUTO_INCREMENT,
    ID_VENTA INT NOT NULL,
    ID_PRODUCTO INT NOT NULL,
    CANTIDAD INT NOT NULL,
    MOTIVO VARCHAR(255),
    ACCION ENUM(
        'reingreso',
        'desecho',
        'garantia'
    ) NOT NULL,
    REINGRESO_CONFIRMADO TINYINT DEFAULT 0,
    NUMERO_SERIE VARCHAR(500) NULL,
    ID_PRODUCTO_SEMINUEVO INT NULL,
    FECHA_DEVOLUCION DATETIME DEFAULT CURRENT_TIMESTAMP,
    ID_PRODUCTO_REEMPLAZO INT NULL,
    SERIES_REEMPLAZO VARCHAR(500) NULL,
    DISPOSICION_FINAL ENUM('reingreso', 'desecho', 'seminuevo', 'reparacion', 'garantia_proveedor') NULL,
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS (ID_VENTA),
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 10. SERVICIOS TÉCNICOS Y EVIDENCIAS
-- ==========================================

-- UR-16, UR-17, UR-18, UR-22, REQ-FR-17, REQ-FR-37, REQ-FR-38, REQ-FR-39:
-- Servicios técnicos asignados a técnicos con foto de evidencia obligatoria y calificación de clientes
CREATE TABLE SERVICIOS (
    ID_SERVICIO INT PRIMARY KEY AUTO_INCREMENT,
    DESCRIPCION VARCHAR(1000),
    FECHA_SOLICITUD DATE,
    FECHA_EJECUCION DATE,
    COSTO DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ID_EMPLEADO INT, -- Técnico asignado
    ID_CLIENTE INT,
    ID_GARANTIA INT,
    ID_SERVICIO_TIPO INT,
    ID_SERVICIO_ESTADO INT,
    EVIDENCIA_URL VARCHAR(500) NULL COMMENT 'Ruta de la foto JPG/PNG obligatoria al pasar a Realizada',
    NOTAS_TECNICAS TEXT NULL,
    CALIFICACION INT NULL COMMENT 'Calificación del cliente de 1 a 5 estrellas',
    OPINION_CLIENTE TEXT NULL COMMENT 'Reseña o comentario del cliente sobre la calidad del servicio',
    FECHA_CALIFICACION DATETIME NULL,
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO),
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES (ID_CLIENTE),
    FOREIGN KEY (ID_GARANTIA) REFERENCES GARANTIAS (ID_GARANTIA),
    FOREIGN KEY (ID_SERVICIO_TIPO) REFERENCES SERVICIO_TIPOS (ID_SERVICIO_TIPO),
    FOREIGN KEY (ID_SERVICIO_ESTADO) REFERENCES SERVICIO_ESTADOS (ID_SERVICIO_ESTADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Productos_servicios (
    ID_PRODUCTOS INT NOT NULL,
    ID_SERVICIO INT NOT NULL,
    FECHA_ASIGNACION DATE,
    PRIMARY KEY (ID_PRODUCTOS, ID_SERVICIO),
    FOREIGN KEY (ID_PRODUCTOS) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS (ID_SERVICIO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 11. INGRESOS FINANCIEROS Y MOVIMIENTOS DE STOCK
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
    ID_CAJA_SESION INT NULL,
    FOREIGN KEY (ID_VENTA) REFERENCES VENTAS (ID_VENTA),
    FOREIGN KEY (ID_SERVICIO) REFERENCES SERVICIOS (ID_SERVICIO),
    FOREIGN KEY (ID_CLIENTE) REFERENCES CLIENTES (ID_CLIENTE),
    FOREIGN KEY (ID_METODO_PAGO) REFERENCES INGRESO_METODOS_PAGO (ID_METODO_PAGO),
    FOREIGN KEY (ID_MONEDA) REFERENCES INGRESO_MONEDAS (ID_MONEDA),
    FOREIGN KEY (ID_CAJA_SESION) REFERENCES CAJA_SESIONES (ID_CAJA_SESION),
    CONSTRAINT CHK_ORIGEN_INGRESO CHECK (
        ID_VENTA IS NOT NULL
        OR ID_SERVICIO IS NOT NULL
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQ-FR-08: Historial de movimientos de stock con motivo y fecha
CREATE TABLE MOVIMIENTOS_STOCK (
    ID_MOVIMIENTO INT PRIMARY KEY AUTO_INCREMENT,
    ID_PRODUCTO INT NOT NULL,
    NOMBRE_PRODUCTO VARCHAR(255),
    TIPO_MOVIMIENTO ENUM(
        'entrada',
        'salida',
        'modificacion'
    ) NOT NULL,
    MOTIVO VARCHAR(255),
    CANTIDAD INT NOT NULL,
    STOCK_RESULTANTE INT NOT NULL,
    FECHA_MOVIMIENTO DATETIME DEFAULT CURRENT_TIMESTAMP,
    ID_EMPLEADO INT NULL,
    FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTOS (ID_PRODUCTO),
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PRODUCTO_SERIES (
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ==================================================================================
-- CARGA DE DATOS INICIALES Y SEED DATA (EN CÓRDOBAS C$)
-- ==================================================================================

-- 1. CATÁLOGOS BASE
INSERT INTO CATEGORIAS (ID_CATEGORIA, NOMBRE_CATEGORIA, ACTIVO) VALUES 
(1, 'Laptop', 1),
(2, 'Monitor', 1),
(3, 'Accesorio', 1),
(4, 'Periférico', 1),
(5, 'Impresora', 1),
(6, 'Almacenamiento', 1),
(7, 'Componente', 1),
(8, 'Memoria RAM', 1),
(9, 'Procesador', 1),
(10, 'Motherboard', 1),
(11, 'Tarjeta de Video', 1),
(12, 'Fuente de Poder', 1),
(13, 'Case', 1);

INSERT INTO MARCAS (ID_MARCA, NOMBRE_MARCA, ACTIVO) VALUES 
(1, 'Dell', 1),
(2, 'HP', 1),
(3, 'Lenovo', 1),
(4, 'Samsung', 1),
(5, 'Logitech', 1),
(6, 'Epson', 1),
(7, 'Kingston', 1),
(8, 'Intel', 1),
(9, 'AMD', 1),
(10, 'Asus', 1),
(11, 'Gigabyte', 1),
(12, 'Nvidia', 1),
(13, 'EVGA', 1),
(14, 'Cooler Master', 1),
(15, 'Corsair', 1);

INSERT INTO GARANTIA_TIPOS (ID_GARANTIA_TIPO, TIPO) VALUES 
(1, 'Estándar'),
(2, 'Extendida'),
(3, 'Limitada'),
(4, 'Nula'),
(5, 'Fabricante'),
(6, 'Premium');

INSERT INTO GARANTIA_ESTADOS (ID_GARANTIA_ESTADO, ESTADO) VALUES 
(1, 'Activa'),
(2, 'Expirada');

INSERT INTO SERVICIO_TIPOS (ID_SERVICIO_TIPO, TIPO) VALUES 
(1, 'Mantenimiento'),
(2, 'Instalación'),
(3, 'Recuperación'),
(4, 'Software'),
(5, 'Diagnóstico'),
(6, 'Configuración'),
(7, 'Reparación');

INSERT INTO SERVICIO_ESTADOS (ID_SERVICIO_ESTADO, ESTADO) VALUES 
(1, 'Completado'),
(2, 'En Progreso'),
(3, 'Pendiente');

INSERT INTO INGRESO_METODOS_PAGO (ID_METODO_PAGO, METODO_PAGO) VALUES 
(1, 'Transferencia'),
(2, 'Tarjeta C'),
(3, 'Efectivo'),
(4, 'Crédito 30d'),
(5, 'Tarjeta D'),
(6, 'Crédito 15d');

INSERT INTO INGRESO_MONEDAS (ID_MONEDA, MONEDA) VALUES 
(1, 'USD'),
(2, 'NIO');

-- 2. EMPLEADOS (Unificados con roles ADMIN, VENDEDOR, CAJERO, TECNICO, TEMPORAL)
INSERT INTO EMPLEADOS (
    ID_EMPLEADO, NOMBRE, APELLIDO, EMAIL, TELEFONO, DIRECCION, SEXO, F_NACIMIENTO, AREA, HORARIO, USERNAME, PASSWORD_HASH, ROL, ESTADO
) VALUES
-- Vendedores (1 al 6) - password: password123
(1, 'Carlos', 'Pérez', 'carlos.perez@compunic.com', '8811-2201', 'Managua', 'M', '1990-05-15', 'Ventas Corporativas', '08:00-17:00', 'vendedor', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'VENDEDOR', 1),
(2, 'Ana', 'Martínez', 'ana.martinez@compunic.com', '8811-2202', 'Managua', 'F', '1992-08-20', 'Ventas al Detalle', '09:00-18:00', 'ana.martinez', '$2b$10$Qa60PzwkNqXZIJQDe19FDOAMxk2OWF5d9IgsW3VX8AaOmD7mC0Sfq', 'VENDEDOR', 1),
(3, 'Luis', 'Gómez', 'luis.gomez@compunic.com', '8811-2203', 'Managua', 'M', '1988-01-10', 'Ventas en Línea', '08:00-17:00', 'luis.gomez', '$2b$10$Oq3IOSmx/p.I9XsR6uUFa./ckyluFGKr9uHBhnxhkzjxBoeU7jprW', 'VENDEDOR', 1),
(4, 'Sofía', 'Hernández', 'sofia.hernandez@compunic.com', '8811-2204', 'Managua', 'F', '1995-11-30', 'Atención al Cliente', '09:00-18:00', 'sofia.hernandez', '$2b$10$X4aptKDTlU8OMog4UEcag.VpxaUeUDYWUybd6OlLHsUEfUB5x115K', 'VENDEDOR', 1),
(5, 'Juan', 'Torres', 'juan.torres@compunic.com', '8811-2205', 'Managua', 'M', '1993-03-25', 'Ventas Corporativas', '08:00-17:00', 'juan.torres', '$2b$10$rli4Jj9CDsanv2EP51VlVed8UmxZAt50l9DbEDPYU.K2Qn47sLKRq', 'VENDEDOR', 1),
(6, 'María', 'Rodríguez', 'maria.rodriguez@compunic.com', '8811-2206', 'Managua', 'F', '1985-07-12', 'Ventas al Detalle', '09:00-18:00', 'maria.rodriguez', '$2b$10$t61HgZ3E8sXPNxy0cqJAbO29czpla7EShpprS1EWWuAd8NkA/QnTC', 'VENDEDOR', 1),

-- Administradores (11 al 13) - password: password123
(11, 'Axel', 'Ruiz', '20230642i.axelruiz@gmail.com', '8740-5434', 'Managua', 'M', '2004-05-24', 'Gerencia', '07:00-18:00', 'axel.ruiz', '$2b$10$WADzWsPtOmU/ji/z5jprXeYu32VSbSALyCzILN8MV4TzgadsYmK9a', 'ADMIN', 1),
(12, 'Juan', 'Averruz', 'Juan_Averruz.adm@compunic.com', '89040605', 'Managua', 'M', '2005-12-30', 'Administración', '07:00-18:00', 'juan.averruz', '$2b$10$xOg2ncxa4mRnox05g8NuGOocTAn04G03o9yMz3jxJtaDjobU6Gxli', 'ADMIN', 1),
(13, 'Enrique', 'Urbina', 'enriqueu228@gmail.com', '8101-7846', 'Managua', 'M', '2005-12-30', 'Administración', '07:00-18:00', 'enrique.urbina', '$2b$10$e0ZC8kb/buk/XIuBdKpMPul.OyX8G3jyjgKCKyruzG1BQYIoqwlaq', 'ADMIN', 1),

-- Cajeros (20 y 21) - password: password123
(20, 'Marcos', 'Cajero', 'marcos.caja@compunic.com', '8822-3344', 'Managua', 'M', '1998-03-14', 'Caja Central', '08:00-17:00', 'cajero', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'CAJERO', 1),
(21, 'Claudia', 'Morales', 'claudia.caja@compunic.com', '8822-3355', 'Managua', 'F', '1996-09-22', 'Caja Principal', '08:00-17:00', 'claudia.caja', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'CAJERO', 1),

-- Técnicos Especialistas (30 y 31) - password: password123
(30, 'Roberto', 'Técnico', 'roberto.tec@compunic.com', '8833-4455', 'Managua', 'M', '1994-06-18', 'Soporte Técnico', '08:00-17:00', 'tecnico', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(31, 'Franklin', 'García', 'franklin.tec@compunic.com', '8833-4466', 'Managua', 'M', '1991-11-05', 'Taller y Redes', '08:00-17:00', 'franklin.tec', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),

-- Técnicos y Temporales (3001 al 3015)
(3001, 'Miguel', 'Jiménez T.', 'miguel.jimenez.temp@gmail.com', '8888-1001', 'Barrio Monseñor Lezcano', 'M', '1990-01-01', 'Servicios', '08:00-17:00', 'miguel.jimenez', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(3002, 'Lucía', 'Flores T.', 'lucia.flores.temp@gmail.com', '8888-1002', 'Km 14 Carretera Masaya', 'F', '1992-02-02', 'Servicios', '08:00-17:00', 'lucia.flores', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(3003, 'Jorge', 'Mendoza T.', 'jorge.mendoza.temp@gmail.com', '8888-1003', 'Reparto San Juan', 'M', '1991-03-03', 'Servicios', '08:00-17:00', 'jorge.mendoza', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(3004, 'Valeria', 'Cruz T.', 'valeria.cruz.temp@gmail.com', '8888-1004', 'Altamira D''Este', 'F', '1993-04-04', 'Servicios', '08:00-17:00', 'valeria.cruz', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(3005, 'Ricardo', 'Díaz T.', 'ricardo.diaz.temp@gmail.com', '8888-1005', 'Bello Horizonte', 'M', '1989-05-05', 'Servicios', '08:00-17:00', 'ricardo.diaz', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TECNICO', 1),
(3006, 'Elena', 'Morales T.', 'elena.morales.temp@gmail.com', '8888-1006', 'Linda Vista', 'F', '1994-06-06', 'Servicios', '08:00-17:00', 'elena.morales', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3007, 'Gabriel', 'Castro T.', 'gabriel.castro.temp@gmail.com', '8888-1007', 'Colonia Centroamérica', 'M', '1995-07-07', 'Servicios', '08:00-17:00', 'gabriel.castro', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3008, 'Patricia', 'Ortiz T.', 'patricia.ortiz.temp@gmail.com', '8888-1008', 'Villa Fontana', 'F', '1990-08-08', 'Servicios', '08:00-17:00', 'patricia.ortiz', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3009, 'Fernando', 'Silva T.', 'fernando.silva.temp@gmail.com', '8888-1009', 'Los Robles', 'M', '1988-09-09', 'Servicios', '08:00-17:00', 'fernando.silva', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3010, 'Camila', 'Reyes T.', 'camila.reyes.temp@gmail.com', '8888-1010', 'Ciudad Jardín', 'F', '1996-10-10', 'Servicios', '08:00-17:00', 'camila.reyes', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3011, 'Diego', 'Vargas T.', 'diego.vargas.temp@gmail.com', '8888-1011', 'Las Brisas', 'M', '1992-11-11', 'Servicios', '08:00-17:00', 'diego.vargas', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3012, 'Natalia', 'Ríos T.', 'natalia.rios.temp@gmail.com', '8888-1012', 'Reparto Schick', 'F', '1993-12-12', 'Servicios', '08:00-17:00', 'natalia.rios', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3013, 'Andrés', 'Navarro T.', 'andres.navarro.temp@gmail.com', '8888-1013', 'Santa Ana', 'M', '1991-01-13', 'Servicios', '08:00-17:00', 'andres.navarro', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3014, 'Paula', 'Salazar T.', 'paula.salazar.temp@gmail.com', '8888-1014', 'Villa Progreso', 'F', '1994-02-14', 'Servicios', '08:00-17:00', 'paula.salazar', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1),
(3015, 'Mauricio', 'Paredes T.', 'mauricio.paredes.temp@gmail.com', '8888-1015', 'Ducualí', 'M', '1987-03-15', 'Servicios', '08:00-17:00', 'mauricio.paredes', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', 'TEMPORAL', 1);

-- 3. GARANTÍAS INICIALES
INSERT INTO GARANTIAS (ID_GARANTIA, FECHA, CONDICION, EXCLUSIONES, HORA, DURACION_MESES, ID_GARANTIA_TIPO, ID_GARANTIA_ESTADO) VALUES
(201, '2025-01-10', 'Defectos de fábrica en hardware', 'Daños por líquidos o golpes', '09:00:00', 12, 1, 1),
(202, '2025-01-15', 'Cobertura total de componentes', 'Uso indebido de voltaje', '10:30:00', 24, 2, 1),
(203, '2025-02-01', 'Solo partes eléctricas principales', 'Desgaste estético', '11:00:00', 6, 3, 1),
(204, '2025-02-10', 'Sin garantía extendida', 'Todo tipo de daño externo', '14:00:00', 0, 4, 2),
(205, '2025-03-05', 'Garantía directa con fabricante', 'Apertura no autorizada', '15:30:00', 36, 5, 1),
(206, '2025-03-20', 'Servicio técnico prioritario 24/7', 'Pérdida de datos', '16:00:00', 12, 6, 1);

-- 4. CLIENTES
INSERT INTO CLIENTES (ID_CLIENTE, NOMBRE, APELLIDO, TELEFONO, EMAIL, PASSWORD_HASH, CEDULA, TIPO_CLIENTE, RUC, RAZON_SOCIAL, PUNTOS, ID_EMPLEADO, ACTIVO) VALUES
(1001, 'Cliente', 'Prueba', '8888-0000', 'cliente@compunic.com', '$2b$10$Lf2pue8i0iOY1CDLf5/WQ.sYJhApO3aXbTH5zaqQGN98J.5KejXjS', '001-000000-0000U', 'Natural', NULL, NULL, 150, 1, 1),
(1002, 'Roberto', 'Carlos', '8811-1002', 'roberto.carlos@gmail.com', NULL, '001-020390-0002B', 'Natural', NULL, NULL, 40, 2, 1),
(1003, 'Elena', 'Naranjo', '8811-1003', 'elena.naranjo@gmail.com', NULL, '001-150688-0003C', 'Natural', NULL, NULL, 85, 3, 1),
(1004, 'Mario', 'Bross', '8811-1004', 'mario.bross@gmail.com', NULL, '001-201195-0004D', 'Natural', NULL, NULL, 120, 4, 1),
(1005, 'Lucía', 'Méndez', '8811-1005', 'lucia.mendez@gmail.com', NULL, '001-050892-0005E', 'Natural', NULL, NULL, 0, 5, 1),
(1006, 'Gabriel', 'Soto', '8811-1006', 'gabriel.soto@gmail.com', NULL, '001-300485-0006F', 'Natural', NULL, NULL, 30, 6, 1),
(1007, 'Patricia', 'Manterola', '8811-1007', 'patricia.m@gmail.com', NULL, '001-121293-0007G', 'Natural', NULL, NULL, 65, 1, 1),
(1008, 'Fernando', 'Colunga', '8811-1008', 'fernando.c@gmail.com', NULL, '001-250187-0008H', 'Natural', NULL, NULL, 90, 2, 1),
(1009, 'Thalía', 'Sodi', '8811-1009', 'thalia.sodi@gmail.com', NULL, '001-180991-0009I', 'Natural', NULL, NULL, 110, 3, 1),
(1010, 'Paulina', 'Rubio', '8811-1010', 'paulina.r@gmail.com', NULL, '001-090794-0010J', 'Natural', NULL, NULL, 25, 4, 1),
(1011, 'Enrique', 'Iglesias', '8811-1011', 'enrique.i@gmail.com', NULL, '001-080575-0011K', 'Natural', NULL, NULL, 15, 5, 1),
(1012, 'Ricky', 'Martin', '8811-1012', 'ricky.m@gmail.com', NULL, '001-241271-0012L', 'Natural', NULL, NULL, 0, 6, 1),
(1013, 'Chayanne', 'Figueroa', '8811-1013', 'chayanne.f@gmail.com', NULL, '001-280668-0013M', 'Natural', NULL, NULL, 50, 1, 1),
(1014, 'Shakira', 'Mebarak', '8811-1014', 'shakira.m@gmail.com', NULL, '001-020277-0014N', 'Natural', NULL, NULL, 140, 2, 1),
(1015, 'Juanes', 'Aristizabal', '8811-1015', 'juanes.a@gmail.com', NULL, '001-090872-0015O', 'Natural', NULL, NULL, 75, 3, 1),
(1016, 'Innovatech Corp', 'S.A.', '2255-9000', 'contacto@innovatech.com.ni', NULL, 'J0310000123456', 'Institucional', 'J0310000123456', 'Innovaciones Tecnológicas de Nicaragua S.A.', 300, 1, 1),
(1017, 'Soluciones Médicas', 'R.L.', '2270-4000', 'compras@solmed.com.ni', NULL, 'J0310000987654', 'Institucional', 'J0310000987654', 'Soluciones Médicas de Centroamérica R.L.', 250, 5, 1);

-- 5. PROVEEDORES
INSERT INTO PROVEEDORES (ID_PROVEEDOR, NOMBRE_EMPRESA, PERSONA_CONTACTO, TELEFONO, DIRECCION, PAGINA_WEB, EMAIL, ID_EMPLEADO, ACTIVO) VALUES
(1, 'Comtech Nicaragua', 'Ernesto Varela', '2277-0011', 'Km 4.5 Carretera a Masaya, Managua', 'www.comtech.com.ni', 'ventas@comtech.com.ni', 11, 1),
(2, 'PBS Nicaragua', 'Claudia Chamorro', '2255-8800', 'Rotonda El Guegüense 1c al norte, Managua', 'www.pbs.com.ni', 'contacto@pbs.com.ni', 11, 1),
(3, 'Soliq Nicaragua', 'Mauricio Belli', '2278-5522', 'Plaza España, Edificio Málaga, Managua', 'www.soliq.com.ni', 'ventas@soliq.com.ni', 12, 1),
(4, 'Equipos y Sistemas S.A.', 'Karla Somarriba', '2266-9944', 'Pista Jean Paul Genie, Managua', 'www.equiposysistemas.com.ni', 'info@equiposysistemas.com', 12, 1),
(5, 'Intcomex Nicaragua', 'David Gutierrez', '2249-1133', 'Carretera Norte Km 5.5, Managua', 'www.intcomex.com', 'ventas.ni@intcomex.com', 13, 1);

-- 6. PRODUCTOS
INSERT INTO PRODUCTOS (ID_PRODUCTO, NOMBRE_PRODUCTO, MODELO, DESCRIPCION, IMAGEN_URL, PRECIO_COMPRA, PRECIO_VENTA, ID_MARCA, ID_EMPLEADO, ID_GARANTIAS, ID_PROVEEDOR, ACTIVO) VALUES
(1, 'Laptop Dell Inspiron 15', 'Inspiron 3520', 'Intel Core i5 11th Gen, 8GB RAM, 512GB SSD, Pantalla 15.6 FHD', 'uploads/productos/dell_inspiron.png', 18500.00, 24050.00, 1, 11, 201, 1, 1),
(2, 'Monitor Samsung Curvo 24', 'LC24F390FHL', 'Monitor LED 24 FHD Curvo, 60Hz, FreeSync, HDMI/VGA', 'uploads/productos/samsung_24.png', 4200.00, 5550.00, 4, 11, 201, 1, 1),
(3, 'Mouse Logitech Inalámbrico M170', 'M170', 'Conectividad inalámbrica 2.4GHz, alcance 10m, batería hasta 12 meses', 'uploads/productos/logitech_m170.png', 320.00, 480.00, 5, 11, 203, 3, 1),
(4, 'Impresora Epson EcoTank L3250', 'EcoTank L3250', 'Multifuncional Wi-Fi con sistema continuo de tinta original', 'uploads/productos/epson_l3250.png', 7800.00, 10175.00, 6, 12, 205, 2, 1),
(5, 'SSD Kingston NV2 1TB', 'SNV2S/1000G', 'M.2 2280 NVMe PCIe 4.0, Lectura hasta 3500MB/s', 'uploads/productos/kingston_1tb.png', 2100.00, 2960.00, 7, 12, 201, 5, 1),
(6, 'Teclado Mecánico Corsair K55', 'K55 RGB PRO', 'Retroiluminación RGB dinámica, teclas para macros dedicadas, IP42', 'uploads/productos/corsair_k55.png', 1600.00, 2220.00, 15, 13, 201, 5, 1),
(7, 'Memoria RAM Kingston Fury 16GB', 'KF432C16BB/16', 'DDR4 3200MHz CL16 DIMM FURY Beast Black', 'uploads/productos/ram_fury_16.png', 1300.00, 1850.00, 7, 13, 201, 5, 1),
(8, 'Laptop HP Pavilion 14', 'Pavilion 14-dv', 'Intel Core i7 12th Gen, 16GB RAM, 1TB SSD, Teclado Iluminado', 'uploads/productos/hp_pavilion.png', 25000.00, 32560.00, 2, 11, 202, 2, 1),
(9, 'Procesador AMD Ryzen 7 5700X', 'Ryzen 7 5700X', '8 núcleos, 16 hilos, reloj base 3.4GHz, turbo 4.6GHz, Socket AM4', 'uploads/productos/ryzen_7.png', 6500.00, 8510.00, 9, 12, 201, 4, 1),
(10, 'Tarjeta de Video Asus RTX 4060', 'Dual RTX4060-O8G', '8GB GDDR6, DLSS 3, Ray Tracing, 2 ventiladores Axial-tech', 'uploads/productos/rtx_4060.png', 14500.00, 18870.00, 10, 11, 202, 4, 1),
(11, 'Laptop Lenovo ThinkPad E14', 'ThinkPad E14 Gen 4', 'AMD Ryzen 5 5625U, 16GB RAM, 512GB SSD, Pantalla 14 FHD', 'uploads/productos/lenovo_e14.png', 21500.00, 27750.00, 3, 11, 201, 1, 1),
(12, 'Motherboard Gigabyte B550M DS3H', 'B550M DS3H AC', 'Socket AM4, Micro ATX, Dual M.2, Wi-Fi AC y Bluetooth', 'uploads/productos/b550m.png', 3400.00, 4440.00, 11, 13, 201, 5, 1);

-- Categorías por producto
INSERT INTO PRODUCTO_CATEGORIA (ID_PRODUCTO, ID_CATEGORIA) VALUES 
(1, 1), (2, 2), (3, 4), (4, 5), (5, 6), (6, 4), (7, 8), (8, 1), (9, 9), (10, 11), (11, 1), (12, 10);

-- Proveedores por producto
INSERT INTO PRODUCTO_PROVEEDOR (ID_PRODUCTO, ID_PROVEEDOR, PRECIO_COMPRA) VALUES 
(1, 1, 18500.00), (2, 1, 4200.00), (3, 3, 320.00), (4, 2, 7800.00), (5, 5, 2100.00), (6, 5, 1600.00),
(7, 5, 1300.00), (8, 2, 25000.00), (9, 4, 6500.00), (10, 4, 14500.00), (11, 1, 21500.00), (12, 5, 3400.00);

-- 7. SERIES DE PRODUCTO
INSERT INTO PRODUCTO_SERIES (ID_PRODUCTO, NUMERO_SERIE, CONDICION, ESTADO, NOTAS) VALUES
(1, 'DELL-INSP-001', 'Nuevo', 'en_stock', 'Lote de importación Comtech'),
(1, 'DELL-INSP-002', 'Nuevo', 'en_stock', 'Lote de importación Comtech'),
(1, 'DELL-INSP-003', 'Nuevo', 'en_stock', 'Lote de importación Comtech'),
(8, 'HP-PAV-001', 'Nuevo', 'en_stock', 'Distribución PBS'),
(8, 'HP-PAV-002', 'Nuevo', 'en_stock', 'Distribución PBS'),
(10, 'ASUS-RTX-001', 'Nuevo', 'en_stock', 'Garantía 2 años'),
(11, 'LEN-TP-001', 'Nuevo', 'en_stock', 'ThinkPad Corporativa');

-- 8. COMPRAS A PROVEEDORES
INSERT INTO COMPRAS (ID_COMPRA, ID_PROVEEDOR, FECHA_COMPRA, NUMERO_FACTURA_PROVEEDOR, TOTAL_COMPRA, IVA_PORCENTAJE, ID_EMPLEADO) VALUES
(8001, 1, '2025-09-01', 'FACT-CT-1092', 113500.00, 15.00, 11),
(8002, 2, '2025-09-05', 'FACT-PBS-4421', 98400.00, 15.00, 12),
(8003, 3, '2025-09-10', 'FACT-SL-7712', 12800.00, 15.00, 11),
(8004, 4, '2025-09-15', 'FACT-EQS-3301', 84000.00, 15.00, 12),
(8005, 5, '2025-09-20', 'FACT-INT-9904', 50000.00, 15.00, 13);

INSERT INTO DETALLE_COMPRA (ID_DETALLE, ID_COMPRA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO_COMPRA, MESES_GARANTIA) VALUES
(1, 8001, 1, 5, 18500.00, 12),
(2, 8001, 2, 5, 4200.00, 12),
(3, 8002, 4, 8, 7800.00, 24),
(4, 8002, 8, 2, 25000.00, 24),
(5, 8003, 3, 40, 320.00, 6),
(6, 8004, 9, 6, 6500.00, 12),
(7, 8004, 10, 3, 14500.00, 24),
(8, 8005, 5, 15, 2100.00, 12),
(9, 8005, 7, 10, 1300.00, 12);

-- 9. CAJA SESIONES Y MOVIMIENTOS
INSERT INTO CAJA_SESIONES (ID_CAJA_SESION, ID_EMPLEADO, FECHA_APERTURA, MONTO_INICIAL, FECHA_CIERRE, MONTO_ESPERADO, MONTO_REAL, DIFERENCIA, ESTADO, OBSERVACIONES) VALUES
(1, 20, '2025-10-01 08:00:00', 3000.00, '2025-10-01 17:30:00', 49750.00, 49750.00, 0.00, 'CERRADA', 'Cierre de turno cuadrado sin incidencias.'),
(2, 20, '2025-10-02 08:00:00', 3000.00, '2025-10-02 17:30:00', 38550.00, 38550.00, 0.00, 'CERRADA', 'Turno cerrado con normalidad.'),
(3, 20, CURRENT_TIMESTAMP, 3000.00, NULL, NULL, NULL, NULL, 'ABIERTA', 'Turno de caja activo para cobros.');

INSERT INTO CAJA_MOVIMIENTOS (ID_MOVIMIENTO_CAJA, ID_CAJA_SESION, ID_EMPLEADO, TIPO_MOVIMIENTO, CONCEPTO, MONTO, FECHA_HORA) VALUES
(1, 1, 20, 'INGRESO', 'Inyección de sencillo para cambio', 1000.00, '2025-10-01 10:15:00'),
(2, 1, 20, 'EGRESO', 'Compra de suministros de limpieza urgentes', 250.00, '2025-10-01 13:00:00'),
(3, 3, 20, 'INGRESO', 'Fondo adicional de billetes de C$ 50 y C$ 100', 500.00, CURRENT_TIMESTAMP);

-- 10. VENTAS
INSERT INTO VENTAS (
    ID_VENTA, FECHA, ID_CLIENTE, ID_EMPLEADO, ESTADO, TIPO_ENTREGA, DIRECCION_ENVIO, SUBTOTAL, IVA, TOTAL, MONTO_ADELANTO, MONTO_RECIBIDO, CAMBIO, METODO_PAGO_TEXT, FACTURA, TIPO_CANAL
) VALUES
(6001, '2025-10-01 09:30:00', 1001, 1, 'Completado', 'Retiro en Tienda', NULL, 20913.04, 3136.96, 24050.00, 0.00, 24050.00, 0.00, 'Efectivo', 'FAC-V001', 'TIENDA_FISICA'),
(6002, '2025-10-01 11:15:00', 1002, 2, 'Completado', 'Retiro en Tienda', NULL, 4826.09, 723.91, 5550.00, 0.00, 5600.00, 50.00, 'Efectivo', 'FAC-V002', 'TIENDA_FISICA'),
(6003, '2025-10-01 14:00:00', 1003, 3, 'Completado', 'Envio a Domicilio', 'Managua, Residencial Las Colinas #45', 8847.83, 1327.17, 10175.00, 5087.50, 10175.00, 0.00, 'Transferencia', 'FAC-V003', 'TIENDA_WEB'),
(6004, '2025-10-02 10:20:00', 1004, 4, 'Completado', 'Retiro en Tienda', NULL, 2573.91, 386.09, 2960.00, 0.00, 3000.00, 40.00, 'Efectivo', 'FAC-V004', 'TIENDA_FISICA'),
(6005, '2025-10-02 15:45:00', 1005, 5, 'Completado', 'Retiro en Tienda', NULL, 1930.43, 289.57, 2220.00, 0.00, 2220.00, 0.00, 'Tarjeta C', 'FAC-V005', 'TIENDA_FISICA'),
(6006, '2025-10-03 09:10:00', 1006, 6, 'Completado', 'Retiro en Tienda', NULL, 1608.70, 241.30, 1850.00, 0.00, 2000.00, 150.00, 'Efectivo', 'FAC-V006', 'TIENDA_FISICA'),
(6007, '2025-10-03 16:30:00', 1007, 1, 'Completado', 'Retiro en Tienda', NULL, 28313.04, 4246.96, 32560.00, 0.00, 32560.00, 0.00, 'Transferencia', 'FAC-V007', 'TIENDA_FISICA'),
(6008, '2025-10-04 10:00:00', 1008, 2, 'Completado', 'Retiro en Tienda', NULL, 7400.00, 1110.00, 8510.00, 0.00, 8510.00, 0.00, 'Tarjeta D', 'FAC-V008', 'TIENDA_FISICA'),
(6009, '2025-10-04 14:15:00', 1016, 1, 'Completado', 'Envio a Domicilio', 'Oficinas Innovatech Managua', 38608.70, 5791.30, 44400.00, 0.00, 44400.00, 0.00, 'Transferencia', 'FAC-V009', 'TIENDA_FISICA');

INSERT INTO VENTAS_PRODUCTOS (ID_VENTA, ID_PRODUCTO, cantidad_neta, precio_venta, sub_total, numeros_serie) VALUES
(6001, 1, 1, 24050.00, 24050.00, 'DELL-INSP-001'),
(6002, 2, 1, 5550.00, 5550.00, NULL),
(6003, 4, 1, 10175.00, 10175.00, NULL),
(6004, 5, 1, 2960.00, 2960.00, NULL),
(6005, 6, 1, 2220.00, 2220.00, NULL),
(6006, 7, 1, 1850.00, 1850.00, NULL),
(6007, 8, 1, 32560.00, 32560.00, 'HP-PAV-001'),
(6008, 9, 1, 8510.00, 8510.00, NULL),
(6009, 10, 2, 18870.00, 37740.00, 'ASUS-RTX-001, ASUS-RTX-002'),
(6009, 2, 1, 5550.00, 5550.00, NULL);

-- 11. COTIZACIONES / PROFORMAS
INSERT INTO COTIZACIONES (ID_COTIZACION, NUMERO_COTIZACION, FECHA_EMISION, FECHA_VENCIMIENTO, ID_CLIENTE, ID_EMPLEADO, SUBTOTAL, IVA, TOTAL, ESTADO, NOTAS) VALUES
(1, 'COT-2025-001', '2025-10-05 10:00:00', '2025-10-20', 1016, 1, 48100.00, 7215.00, 55315.00, 'Pendiente', 'Cotización de 2 Laptops Dell Inspiron y 1 Monitor Samsung. Válida por 15 días.'),
(2, 'COT-2025-002', '2025-10-06 11:30:00', '2025-10-21', 1017, 5, 27750.00, 4162.50, 31912.50, 'Aceptada', 'Cotización de 1 ThinkPad para área médica.');

INSERT INTO COTIZACION_PRODUCTOS (ID_COTIZACION, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL) VALUES
(1, 1, 2, 24050.00, 48100.00),
(1, 2, 1, 5550.00, 5550.00),
(2, 11, 1, 27750.00, 27750.00);

-- 12. MERMAS / PÉRDIDAS
INSERT INTO MERMAS (ID_MERMA, ID_PRODUCTO, CANTIDAD, MOTIVO, JUSTIFICACION, COSTO_UNITARIO, COSTO_TOTAL, ID_EMPLEADO, FECHA_REGISTRO) VALUES
(1, 3, 1, 'Defectuoso', 'Mouse con sensor óptico inoperativo de fábrica no admitido por proveedor', 320.00, 320.00, 11, '2025-10-02 16:00:00'),
(2, 2, 1, 'Dañado', 'Pantalla con fisura interna durante maniobra de estantería en bodega', 4200.00, 4200.00, 12, '2025-10-04 11:00:00');

-- 13. DEVOLUCIONES DE CLIENTES
INSERT INTO DEVOLUCIONES (ID_DEVOLUCION, ID_VENTA, ID_PRODUCTO, CANTIDAD, MOTIVO, ACCION, REINGRESO_CONFIRMADO, NUMERO_SERIE, FECHA_DEVOLUCION, DISPOSICION_FINAL) VALUES
(1, 6005, 6, 1, 'Cliente solicitó modelo superior inalámbrico', 'reingreso', 1, NULL, '2025-10-03 11:00:00', 'reingreso');

-- 14. DEVOLUCIONES A PROVEEDORES
INSERT INTO DEVOLUCIONES_PROVEEDORES (ID_DEVOLUCION_PROV, ID_COMPRA, ID_PROVEEDOR, ID_PRODUCTO, CANTIDAD, MOTIVO, ESTADO, ID_EMPLEADO, FECHA) VALUES
(1, 8003, 3, 3, 2, 'Lote con empaque aplastado durante el flete', 'Aprobada', 11, '2025-09-12 14:00:00');

-- 15. SERVICIOS TÉCNICOS
INSERT INTO SERVICIOS (ID_SERVICIO, DESCRIPCION, FECHA_SOLICITUD, FECHA_EJECUCION, COSTO, ID_EMPLEADO, ID_CLIENTE, ID_GARANTIA, ID_SERVICIO_TIPO, ID_SERVICIO_ESTADO, EVIDENCIA_URL, NOTAS_TECNICAS, CALIFICACION, OPINION_CLIENTE, FECHA_CALIFICACION) VALUES
(7001, 'Mantenimiento preventivo y limpieza de disipación térmica en laptop Dell', '2025-10-01', '2025-10-02', 1200.00, 30, 1001, 201, 1, 1, 'uploads/evidencias/serv_7001_evidencia.jpg', 'Se aplicó pasta térmica Arctic MX-4 y se limpió ventilador.', 5, 'Excelente servicio, mi laptop quedó muy silenciosa y rápida.', '2025-10-02 18:00:00'),
(7002, 'Instalación de sistema operativo Windows 11 Pro y suite ofimática', '2025-10-02', '2025-10-03', 850.00, 30, 1003, 201, 2, 1, 'uploads/evidencias/serv_7002_evidencia.jpg', 'Instalación limpia, drivers actualizados a última versión.', 5, 'Muy puntuales y profesionales.', '2025-10-03 17:30:00'),
(7003, 'Diagnóstico de placa madre con falla de encendido', '2025-10-03', NULL, 500.00, 31, 1005, 203, 5, 2, NULL, 'Revisando línea de 19V en circuito de entrada.', NULL, NULL, NULL),
(7004, 'Reparación de bisagra y cambio de teclado en Laptop HP', '2025-10-04', '2025-10-05', 1800.00, 31, 1008, 202, 7, 1, 'uploads/evidencias/serv_7004_evidencia.jpg', 'Cambio de teclado original en español e inyección de soporte en carcasa.', 4, 'Buen trabajo, la bisagra quedó firme.', '2025-10-05 19:00:00');

-- 16. INGRESOS FINANCIEROS
INSERT INTO INGRESOS (ID_INGRESO, FECHA_PAGO, MONTO, ID_VENTA, ID_SERVICIO, ID_CLIENTE, ID_METODO_PAGO, ID_MONEDA, ID_CAJA_SESION) VALUES
(5001, '2025-10-01 09:35:00', 24050.00, 6001, NULL, 1001, 3, 2, 1),
(5002, '2025-10-01 11:20:00', 5550.00, 6002, NULL, 1002, 3, 2, 1),
(5003, '2025-10-01 14:05:00', 10175.00, 6003, NULL, 1003, 1, 2, 1),
(5004, '2025-10-02 10:25:00', 2960.00, 6004, NULL, 1004, 3, 2, 2),
(5005, '2025-10-02 15:50:00', 2220.00, 6005, NULL, 1005, 2, 2, 2),
(5006, '2025-10-02 17:00:00', 1200.00, NULL, 7001, 1001, 3, 2, 2),
(5007, '2025-10-03 09:15:00', 1850.00, 6006, NULL, 1006, 3, 2, 2),
(5008, '2025-10-03 16:35:00', 32560.00, 6007, NULL, 1007, 1, 2, 2),
(5009, '2025-10-03 17:35:00', 850.00, NULL, 7002, 1003, 3, 2, 2),
(5010, '2025-10-04 10:05:00', 8510.00, 6008, NULL, 1008, 5, 2, 2),
(5011, '2025-10-04 14:20:00', 44400.00, 6009, NULL, 1016, 1, 2, 2),
(5012, '2025-10-05 17:00:00', 1800.00, NULL, 7004, 1008, 3, 2, 2);

-- 17. MOVIMIENTOS DE STOCK (Historial inicial sincronizado)
INSERT INTO MOVIMIENTOS_STOCK (ID_PRODUCTO, NOMBRE_PRODUCTO, TIPO_MOVIMIENTO, MOTIVO, CANTIDAD, STOCK_RESULTANTE, FECHA_MOVIMIENTO, ID_EMPLEADO) VALUES
(1, 'Laptop Dell Inspiron 15', 'entrada', 'Compra Factura: FACT-CT-1092', 5, 5, '2025-09-01 08:00:00', 11),
(2, 'Monitor Samsung Curvo 24', 'entrada', 'Compra Factura: FACT-CT-1092', 5, 5, '2025-09-01 08:00:00', 11),
(4, 'Impresora Epson EcoTank L3250', 'entrada', 'Compra Factura: FACT-PBS-4421', 8, 8, '2025-09-05 09:00:00', 12),
(8, 'Laptop HP Pavilion 14', 'entrada', 'Compra Factura: FACT-PBS-4421', 2, 2, '2025-09-05 09:00:00', 12),
(3, 'Mouse Logitech Inalámbrico M170', 'entrada', 'Compra Factura: FACT-SL-7712', 40, 40, '2025-09-10 10:00:00', 11),
(3, 'Mouse Logitech Inalámbrico M170', 'salida', 'Devolución Proveedor: Soliq Nicaragua', 2, 38, '2025-09-12 14:00:00', 11),
(9, 'Procesador AMD Ryzen 7 5700X', 'entrada', 'Compra Factura: FACT-EQS-3301', 6, 6, '2025-09-15 11:00:00', 12),
(10, 'Tarjeta de Video Asus RTX 4060', 'entrada', 'Compra Factura: FACT-EQS-3301', 3, 3, '2025-09-15 11:00:00', 12),
(5, 'SSD Kingston NV2 1TB', 'entrada', 'Compra Factura: FACT-INT-9904', 15, 15, '2025-09-20 10:30:00', 13),
(7, 'Memoria RAM Kingston Fury 16GB', 'entrada', 'Compra Factura: FACT-INT-9904', 10, 10, '2025-09-20 10:30:00', 13),
(1, 'Laptop Dell Inspiron 15', 'salida', 'Venta Factura: FAC-V001', 1, 4, '2025-10-01 09:30:00', 1),
(2, 'Monitor Samsung Curvo 24', 'salida', 'Venta Factura: FAC-V002', 1, 4, '2025-10-01 11:15:00', 2),
(4, 'Impresora Epson EcoTank L3250', 'salida', 'Venta Factura: FAC-V003', 1, 7, '2025-10-01 14:00:00', 3),
(3, 'Mouse Logitech Inalámbrico M170', 'salida', 'Merma: Defectuoso', 1, 37, '2025-10-02 16:00:00', 11),
(5, 'SSD Kingston NV2 1TB', 'salida', 'Venta Factura: FAC-V004', 1, 14, '2025-10-02 10:20:00', 4),
(6, 'Teclado Mecánico Corsair K55', 'entrada', 'Reingreso por Devolución: Dev 1', 1, 1, '2025-10-03 11:00:00', 11),
(7, 'Memoria RAM Kingston Fury 16GB', 'salida', 'Venta Factura: FAC-V006', 1, 9, '2025-10-03 09:10:00', 6),
(8, 'Laptop HP Pavilion 14', 'salida', 'Venta Factura: FAC-V007', 1, 1, '2025-10-03 16:30:00', 1),
(9, 'Procesador AMD Ryzen 7 5700X', 'salida', 'Venta Factura: FAC-V008', 1, 5, '2025-10-04 10:00:00', 2),
(2, 'Monitor Samsung Curvo 24', 'salida', 'Merma: Dañado', 1, 3, '2025-10-04 11:00:00', 12),
(10, 'Tarjeta de Video Asus RTX 4060', 'salida', 'Venta Factura: FAC-V009', 2, 1, '2025-10-04 14:15:00', 1),
(2, 'Monitor Samsung Curvo 24', 'salida', 'Venta Factura: FAC-V009', 1, 2, '2025-10-04 14:15:00', 1);


-- ==================================================================================
-- PROCEDIMIENTOS ALMACENADOS Y VISTAS DE REPORTES
-- ==================================================================================

DELIMITER //

-- Procedimiento: Búsqueda rápida de precio y modelo
CREATE PROCEDURE sp_BuscarPrecioProducto(
    IN p_nombre_modelo VARCHAR(100)
)
BEGIN
    SELECT 
        p.ID_PRODUCTO,
        p.NOMBRE_PRODUCTO, 
        p.MODELO, 
        p.PRECIO_VENTA,
        p.PRECIO_COMPRA,
        m.NOMBRE_MARCA,
        c.NOMBRE_CATEGORIA
    FROM PRODUCTOS p
    LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
    LEFT JOIN PRODUCTO_CATEGORIA pc ON p.ID_PRODUCTO = pc.ID_PRODUCTO
    LEFT JOIN CATEGORIAS c ON pc.ID_CATEGORIA = c.ID_CATEGORIA
    WHERE p.ACTIVO = 1 
      AND (p.NOMBRE_PRODUCTO LIKE CONCAT('%', p_nombre_modelo, '%') 
       OR p.MODELO LIKE CONCAT('%', p_nombre_modelo, '%'));
END //

-- Procedimiento: Alta de nuevo cliente
CREATE PROCEDURE sp_NuevoCliente(
    IN p_nombre VARCHAR(100),
    IN p_apellido VARCHAR(100),
    IN p_telefono VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_id_empleado INT,
    IN p_cedula VARCHAR(20),
    IN p_tipo VARCHAR(20),
    IN p_ruc VARCHAR(50),
    IN p_razon_social VARCHAR(200)
)
BEGIN
    INSERT INTO CLIENTES (
        NOMBRE, APELLIDO, TELEFONO, EMAIL, ID_EMPLEADO, CEDULA, TIPO_CLIENTE, RUC, RAZON_SOCIAL
    ) VALUES (
        p_nombre, p_apellido, p_telefono, p_email, p_id_empleado, p_cedula, 
        COALESCE(p_tipo, 'Natural'), p_ruc, p_razon_social
    );
END //

-- Procedimiento: Ventas por vendedor
CREATE PROCEDURE sp_VentasPorVendedor(
    IN p_id_empleado INT
)
BEGIN
    SELECT 
        v.FACTURA, 
        v.FECHA, 
        v.TOTAL,
        v.ESTADO,
        v.TIPO_CANAL,
        CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS CLIENTE
    FROM VENTAS v
    JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE
    WHERE v.ID_EMPLEADO = p_id_empleado
    ORDER BY v.FECHA DESC;
END //

DELIMITER ;

-- ==================================================================================
-- VISTAS PARA EL MÓDULO DE REPORTES (REQ-FR-55, 56, 57, 58, UR-06)
-- ==================================================================================

-- REQ-FR-56: Reporte detallado de ventas por canal, vendedor y cliente
CREATE OR REPLACE VIEW vw_reporte_ventas AS
SELECT 
    v.ID_VENTA,
    v.FACTURA,
    v.FECHA,
    v.TIPO_CANAL,
    v.ESTADO,
    v.SUBTOTAL,
    v.IVA,
    v.TOTAL,
    v.METODO_PAGO_TEXT,
    COALESCE(CONCAT(e.NOMBRE, ' ', e.APELLIDO), 'En Línea') AS VENDEDOR,
    COALESCE(CONCAT(c.NOMBRE, ' ', c.APELLIDO), v.NOMBRE_CLIENTE_OCASIONAL, 'Cliente Ocasional') AS CLIENTE,
    c.TIPO_CLIENTE,
    c.RUC AS RUC_CLIENTE
FROM VENTAS v
LEFT JOIN EMPLEADOS e ON v.ID_EMPLEADO = e.ID_EMPLEADO
LEFT JOIN CLIENTES c ON v.ID_CLIENTE = c.ID_CLIENTE;

-- REQ-FR-57: Reporte de valoración total de inventario monetario
CREATE OR REPLACE VIEW vw_valoracion_inventario AS
SELECT 
    p.ID_PRODUCTO,
    p.NOMBRE_PRODUCTO,
    p.MODELO,
    m.NOMBRE_MARCA,
    p.PRECIO_COMPRA,
    p.PRECIO_VENTA,
    COALESCE((
        SELECT ms.STOCK_RESULTANTE 
        FROM MOVIMIENTOS_STOCK ms 
        WHERE ms.ID_PRODUCTO = p.ID_PRODUCTO 
        ORDER BY ms.FECHA_MOVIMIENTO DESC, ms.ID_MOVIMIENTO DESC 
        LIMIT 1
    ), 0) AS STOCK_ACTUAL,
    (
        COALESCE((
            SELECT ms.STOCK_RESULTANTE 
            FROM MOVIMIENTOS_STOCK ms 
            WHERE ms.ID_PRODUCTO = p.ID_PRODUCTO 
            ORDER BY ms.FECHA_MOVIMIENTO DESC, ms.ID_MOVIMIENTO DESC 
            LIMIT 1
        ), 0) * p.PRECIO_COMPRA
    ) AS VALORACION_COSTO,
    (
        COALESCE((
            SELECT ms.STOCK_RESULTANTE 
            FROM MOVIMIENTOS_STOCK ms 
            WHERE ms.ID_PRODUCTO = p.ID_PRODUCTO 
            ORDER BY ms.FECHA_MOVIMIENTO DESC, ms.ID_MOVIMIENTO DESC 
            LIMIT 1
        ), 0) * p.PRECIO_VENTA
    ) AS VALORACION_VENTA
FROM PRODUCTOS p
LEFT JOIN MARCAS m ON p.ID_MARCA = m.ID_MARCA
WHERE p.ACTIVO = 1;

-- REQ-FR-58: Reporte operativo de servicios técnicos por técnico y estado
CREATE OR REPLACE VIEW vw_reporte_servicios AS
SELECT 
    s.ID_SERVICIO,
    s.DESCRIPCION,
    s.FECHA_SOLICITUD,
    s.FECHA_EJECUCION,
    s.COSTO,
    se.ESTADO AS ESTADO_SERVICIO,
    st.TIPO AS TIPO_SERVICIO,
    CONCAT(e.NOMBRE, ' ', e.APELLIDO) AS TECNICO_ASIGNADO,
    CONCAT(c.NOMBRE, ' ', c.APELLIDO) AS CLIENTE,
    s.CALIFICACION,
    s.OPINION_CLIENTE,
    s.EVIDENCIA_URL
FROM SERVICIOS s
LEFT JOIN EMPLEADOS e ON s.ID_EMPLEADO = e.ID_EMPLEADO
LEFT JOIN CLIENTES c ON s.ID_CLIENTE = c.ID_CLIENTE
LEFT JOIN SERVICIO_ESTADOS se ON s.ID_SERVICIO_ESTADO = se.ID_SERVICIO_ESTADO
LEFT JOIN SERVICIO_TIPOS st ON s.ID_SERVICIO_TIPO = st.ID_SERVICIO_TIPO;
