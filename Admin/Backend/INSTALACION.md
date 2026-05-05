# Guía de Instalación - Sistema de Autenticación Mejorado
# COMPUNIC WEB - Fases 1, 2 y 3

## Requisitos Previos
- Node.js instalado (v14 o superior)
- MySQL instalado y corriendo
- Acceso a la base de datos COMPUNIC_V5

---

## Paso 1: Navegar al directorio del Backend

```bash
cd "e:\COMPUNIC WEB\compunic\Admin\Backend"
```

---

## Paso 2: Instalar TODAS las dependencias necesarias

### Comando único (recomendado):
```bash
npm install express cors mysql2 dotenv nodemailer bcryptjs
```

### O instalar una por una:

```bash
# Dependencias básicas (ya deberían estar instaladas)
npm install express
npm install cors
npm install mysql2

# Fase 1 y 3: Sistema de recuperación de contraseña
npm install dotenv
npm install nodemailer

# Fase 2: Encriptación de contraseñas
npm install bcryptjs
```

---

## Paso 3: Crear tabla PASSWORD_RESET_TOKENS en la base de datos

```bash
node scripts/create-reset-tokens-table.js
```

**O ejecutar este SQL manualmente:**

```sql
USE COMPUNIC_V5;

CREATE TABLE IF NOT EXISTS PASSWORD_RESET_TOKENS (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_EMPLEADO INT NOT NULL,
    TOKEN VARCHAR(255) NOT NULL UNIQUE,
    EXPIRA_EN DATETIME NOT NULL,
    USADO TINYINT DEFAULT 0,
    CREADO_EN DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ID_EMPLEADO) REFERENCES EMPLEADOS(ID) ON DELETE CASCADE,
    
    INDEX idx_token (TOKEN),
    INDEX idx_expiracion (EXPIRA_EN),
    INDEX idx_empleado (ID_EMPLEADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Paso 4: Agregar campo GMAIL a tabla EMPLEADOS

**Si no existe el campo GMAIL, ejecutar:**

```sql
USE COMPUNIC_V5;

ALTER TABLE EMPLEADOS 
ADD COLUMN GMAIL VARCHAR(255) AFTER APELLIDO;
```

---

## Paso 5: Configurar archivo .env

**Crear/editar el archivo `.env` en la raíz del Backend:**

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
DB_NAME=COMPUNIC_V5

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion

# Frontend URL (ajustar al puerto de tu Live Server)
FRONTEND_URL=http://127.0.0.1:5510/compunic/Admin/Frontend

# JWT Configuration
JWT_SECRET=COMPUNIC_SECRET_KEY_2024_CHANGE_IN_PRODUCTION
JWT_EXPIRES_IN=24h

# Puerto del servidor
PORT=3001
```

**⚠️ IMPORTANTE:** 
- Reemplazar `TU_CONTRASEÑA_MYSQL` con la contraseña real de MySQL
- Reemplazar `tu_correo@gmail.com` con el Gmail real
- Obtener contraseña de aplicación de Gmail (ver instrucciones abajo)
- Ajustar `FRONTEND_URL` al puerto correcto de Live Server

---

## Paso 6: Obtener Contraseña de Aplicación de Gmail

1. Ir a https://myaccount.google.com
2. Seguridad → Verificación en 2 pasos (activar si no está)
3. Contraseñas de aplicaciones → Generar
4. Seleccionar "Correo" y "Otro dispositivo"
5. Copiar la contraseña de 16 caracteres
6. Pegarla en `.env` en `EMAIL_PASSWORD` (sin espacios)

---

## Paso 7: Migrar contraseñas a bcrypt (SOLO UNA VEZ)

**⚠️ IMPORTANTE: Ejecutar SOLO UNA VEZ por base de datos**

```bash
node scripts/migrate-passwords-to-bcrypt.js
```

**Resultado esperado:**
```
✅ Contraseñas migradas: 9
❌ Errores: 0
```

---

## Paso 8: Iniciar el servidor

```bash
node server.js
```

**Resultado esperado:**
```
🚀 Servidor corriendo en http://localhost:3001
✅ Historial de stock verificado
```

---

## Verificación de Instalación

### 1. Verificar dependencias instaladas:
```bash
npm list express cors mysql2 dotenv nodemailer bcryptjs
```

### 2. Verificar que el servidor inicie sin errores:
```bash
node server.js
```

### 3. Probar login:
- Ir a `http://127.0.0.1:5510/index.html`
- Intentar iniciar sesión con usuario existente

### 4. Probar recuperación de contraseña:
- Ir a `http://127.0.0.1:5510/forgot-password.html`
- Ingresar un Gmail de empleado
- Verificar que llegue el correo

---

## Resumen de Archivos Importantes

### Backend:
- `models/auth.model.js` - Lógica de autenticación con bcrypt
- `controllers/auth.controller.js` - Endpoints de auth
- `services/email.service.js` - Servicio de correo
- `routes/auth.routes.js` - Rutas de autenticación
- `scripts/migrate-passwords-to-bcrypt.js` - Script de migración
- `scripts/create-reset-tokens-table.js` - Script de creación de tabla
- `.env` - Variables de entorno (NO compartir)
- `.gitignore` - Protege archivos sensibles

### Frontend:
- `auth.js` - Funciones de autenticación
- `index.html` - Página de login
- `forgot-password.html` - Recuperación de contraseña
- `reset-password.html` - Restablecimiento de contraseña

---

## Solución de Problemas Comunes

### Error: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs
```

### Error: "Table 'password_reset_tokens' doesn't exist"
```bash
node scripts/create-reset-tokens-table.js
```

### Error: "Error al procesar la solicitud" (recuperación)
- Verificar que `.env` tenga credenciales correctas de Gmail
- Reiniciar el servidor después de editar `.env`

### Login no funciona después de migración:
- Verificar que el servidor se reinició después de instalar bcryptjs
- Verificar que la migración se ejecutó exitosamente

---

## Notas para el Equipo

1. **NO compartir el archivo `.env`** - Cada desarrollador debe crear el suyo
2. **Ejecutar migración SOLO UNA VEZ** - El script detecta contraseñas ya encriptadas
3. **Contraseñas originales NO cambian** - Solo se encriptan, usuarios usan las mismas
4. **Puerto del frontend** - Ajustar en `.env` según su Live Server

---

## Contacto

Si tienen problemas con la instalación, contactar al equipo de desarrollo.
