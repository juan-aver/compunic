/**
 * @file validaciones.js
 * @description Lógica clave del sistema modularizado.
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.
 * Estructurado a mano con paciencia y un red bull.
 */
const Validaciones = {
    // ========================================
    // VALIDACIONES GENERALES
    // ========================================

    /**
     * Valida que un campo no esté vacío
     */
    noVacio: function (valor, nombreCampo) {
        if (!valor || valor.trim() === '') {
            return { valido: false, mensaje: `${nombreCampo} no puede estar vacío` };
        }
        return { valido: true };
    },

    /**
     * Valida longitud máxima de un string
     */
    longitudMaxima: function (valor, max, nombreCampo) {
        if (valor && valor.length > max) {
            return { valido: false, mensaje: `${nombreCampo} no puede exceder ${max} caracteres` };
        }
        return { valido: true };
    },

    /**
     * Valida que solo contenga letras y espacios
     */
    soloLetrasYEspacios: function (valor, nombreCampo) {
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (valor && !regex.test(valor)) {
            return { valido: false, mensaje: `${nombreCampo} solo puede contener letras y espacios` };
        }
        return { valido: true };
    },

    /**
     * Valida formato de email
     */
    email: function (valor, nombreCampo = 'Email') {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (valor && !regex.test(valor)) {
            return { valido: false, mensaje: `${nombreCampo} no tiene un formato válido` };
        }
        return { valido: true };
    },

    /**
     * Valida formato de teléfono (10 dígitos)
     */
    telefono: function (valor, nombreCampo = 'Teléfono') {
        const regex = /^\d{10}$/;
        if (valor && !regex.test(valor)) {
            return { valido: false, mensaje: `${nombreCampo} debe tener exactamente 10 dígitos` };
        }
        return { valido: true };
    },

    /**
     * Valida que un número sea mayor que un valor mínimo
     */
    numeroMinimo: function (valor, min, nombreCampo) {
        const num = parseFloat(valor);
        if (isNaN(num) || num < min) {
            return { valido: false, mensaje: `${nombreCampo} debe ser mayor o igual a ${min}` };
        }
        return { valido: true };
    },

    /**
     * Valida que un número sea positivo
     */
    numeroPositivo: function (valor, nombreCampo) {
        const num = parseFloat(valor);
        if (isNaN(num) || num <= 0) {
            return { valido: false, mensaje: `${nombreCampo} debe ser un número positivo` };
        }
        return { valido: true };
    },

    /**
     * Valida que un número sea entero
     */
    numeroEntero: function (valor, nombreCampo) {
        const num = parseInt(valor);
        if (isNaN(num) || num !== parseFloat(valor)) {
            return { valido: false, mensaje: `${nombreCampo} debe ser un número entero` };
        }
        return { valido: true };
    },

    /**
     * Valida que un número esté en un rango
     */
    numeroEnRango: function (valor, min, max, nombreCampo) {
        const num = parseFloat(valor);
        if (isNaN(num) || num < min || num > max) {
            return { valido: false, mensaje: `${nombreCampo} debe estar entre ${min} y ${max}` };
        }
        return { valido: true };
    },

    /**
     * Valida que un select tenga una opción seleccionada
     */
    selectSeleccionado: function (valor, nombreCampo) {
        if (!valor || valor === '' || valor === '0') {
            return { valido: false, mensaje: `Debe seleccionar ${nombreCampo}` };
        }
        return { valido: true };
    },

    /**
     * Valida formato de fecha
     */
    fecha: function (valor, nombreCampo = 'Fecha') {
        if (!valor) {
            return { valido: false, mensaje: `${nombreCampo} es requerida` };
        }
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) {
            return { valido: false, mensaje: `${nombreCampo} no tiene un formato válido` };
        }
        return { valido: true };
    },

    /**
     * Valida que una fecha no sea futura
     */
    fechaNoFutura: function (valor, nombreCampo = 'Fecha') {
        const fecha = new Date(valor);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fecha > hoy) {
            return { valido: false, mensaje: `${nombreCampo} no puede ser futura` };
        }
        return { valido: true };
    },

    /**
     * Valida que fecha2 sea mayor o igual a fecha1
     */
    fechaMayorOIgual: function (fecha1, fecha2, nombreCampo1, nombreCampo2) {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);

        if (f2 < f1) {
            return { valido: false, mensaje: `${nombreCampo2} debe ser mayor o igual a ${nombreCampo1}` };
        }
        return { valido: true };
    },

    // ========================================
    // VALIDACIONES ESPECÍFICAS DE MÓDULOS
    // ========================================

    /**
     * Valida datos de venta
     */
    validarVenta: function (datos) {
        const errores = [];

        // Cliente seleccionado
        const validCliente = this.selectSeleccionado(datos.idCliente, 'un cliente');
        if (!validCliente.valido) errores.push(validCliente.mensaje);

        // Vendedor asignado
        const validVendedor = this.selectSeleccionado(datos.idVendedor, 'un vendedor');
        if (!validVendedor.valido) errores.push(validVendedor.mensaje);

        // Al menos un producto
        if (!datos.items || datos.items.length === 0) {
            errores.push('Debe agregar al menos un producto a la venta');
        }

        // Validar fecha
        const validFecha = this.fecha(datos.fecha);
        if (!validFecha.valido) errores.push(validFecha.mensaje);

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida item de venta antes de agregar al carrito
     */
    validarItemVenta: function (item) {
        const errores = [];

        // Producto seleccionado
        const validProducto = this.selectSeleccionado(item.idProducto, 'un producto');
        if (!validProducto.valido) errores.push(validProducto.mensaje);

        // Cantidad válida
        const validCantidad = this.numeroEntero(item.cantidad, 'Cantidad');
        if (!validCantidad.valido) {
            errores.push(validCantidad.mensaje);
        } else {
            const validCantidadPositiva = this.numeroPositivo(item.cantidad, 'Cantidad');
            if (!validCantidadPositiva.valido) errores.push(validCantidadPositiva.mensaje);
        }

        // Precio unitario válido
        const validPrecio = this.numeroPositivo(item.precioUnitario, 'Precio unitario');
        if (!validPrecio.valido) errores.push(validPrecio.mensaje);

        // Descuento válido (entre 0 y precio unitario)
        if (item.descuento !== undefined && item.descuento !== null) {
            const validDescuento = this.numeroEnRango(item.descuento, 0, item.precioUnitario, 'Descuento');
            if (!validDescuento.valido) errores.push(validDescuento.mensaje);
        }

        // Stock disponible
        if (item.stockDisponible !== undefined && item.cantidad > item.stockDisponible) {
            errores.push(`Stock insuficiente. Disponible: ${item.stockDisponible}`);
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de producto
     */
    validarProducto: function (datos) {
        const errores = [];

        // Nombre del producto
        const validNombre = this.noVacio(datos.nombre, 'Nombre del producto');
        if (!validNombre.valido) {
            errores.push(validNombre.mensaje);
        } else {
            const validLongitudNombre = this.longitudMaxima(datos.nombre, 100, 'Nombre del producto');
            if (!validLongitudNombre.valido) errores.push(validLongitudNombre.mensaje);
        }

        // Modelo
        if (datos.modelo) {
            const validModelo = this.longitudMaxima(datos.modelo, 50, 'Modelo');
            if (!validModelo.valido) errores.push(validModelo.mensaje);
        }

        // Descripción
        if (datos.descripcion) {
            const validDescripcion = this.longitudMaxima(datos.descripcion, 500, 'Descripción');
            if (!validDescripcion.valido) errores.push(validDescripcion.mensaje);
        }

        // Categoría seleccionada
        const validCategoria = this.selectSeleccionado(datos.idCategoria, 'una categoría');
        if (!validCategoria.valido) errores.push(validCategoria.mensaje);

        // Marca seleccionada
        const validMarca = this.selectSeleccionado(datos.idMarca, 'una marca');
        if (!validMarca.valido) errores.push(validMarca.mensaje);

        // Proveedor seleccionado
        const validProveedor = this.selectSeleccionado(datos.idProveedor, 'un proveedor');
        if (!validProveedor.valido) errores.push(validProveedor.mensaje);

        // Garantía seleccionada
        const validGarantia = this.selectSeleccionado(datos.idGarantia, 'una garantía');
        if (!validGarantia.valido) errores.push(validGarantia.mensaje);

        // Precio de venta
        const validPrecioVenta = this.numeroPositivo(datos.precioVenta, 'Precio de venta');
        if (!validPrecioVenta.valido) errores.push(validPrecioVenta.mensaje);

        // Advertencia si precio venta <= precio compra
        if (datos.precioCompra && datos.precioVenta && parseFloat(datos.precioVenta) <= parseFloat(datos.precioCompra)) {
            errores.push('⚠️ ADVERTENCIA: El precio de venta es menor o igual al precio de compra. No hay margen de ganancia.');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de cliente
     */
    validarCliente: function (datos) {
        const errores = [];

        // Nombre
        const validNombre = this.noVacio(datos.nombre, 'Nombre');
        if (!validNombre.valido) {
            errores.push(validNombre.mensaje);
        } else {
            const validLetrasNombre = this.soloLetrasYEspacios(datos.nombre, 'Nombre');
            if (!validLetrasNombre.valido) errores.push(validLetrasNombre.mensaje);

            const validLongitudNombre = this.longitudMaxima(datos.nombre, 50, 'Nombre');
            if (!validLongitudNombre.valido) errores.push(validLongitudNombre.mensaje);
        }

        // Apellido
        const validApellido = this.noVacio(datos.apellido, 'Apellido');
        if (!validApellido.valido) {
            errores.push(validApellido.mensaje);
        } else {
            const validLetrasApellido = this.soloLetrasYEspacios(datos.apellido, 'Apellido');
            if (!validLetrasApellido.valido) errores.push(validLetrasApellido.mensaje);

            const validLongitudApellido = this.longitudMaxima(datos.apellido, 50, 'Apellido');
            if (!validLongitudApellido.valido) errores.push(validLongitudApellido.mensaje);
        }

        // Teléfono
        const validTelefono = this.telefono(datos.telefono);
        if (!validTelefono.valido) errores.push(validTelefono.mensaje);

        // Email
        const validEmail = this.email(datos.email);
        if (!validEmail.valido) errores.push(validEmail.mensaje);

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de servicio
     */
    validarServicio: function (datos) {
        const errores = [];

        // Cliente seleccionado
        const validCliente = this.selectSeleccionado(datos.idCliente, 'un cliente');
        if (!validCliente.valido) errores.push(validCliente.mensaje);

        // Tipo de servicio seleccionado
        const validTipo = this.selectSeleccionado(datos.idServicioTipo, 'un tipo de servicio');
        if (!validTipo.valido) errores.push(validTipo.mensaje);

        // Estado seleccionado
        const validEstado = this.selectSeleccionado(datos.idServicioEstado, 'un estado');
        if (!validEstado.valido) errores.push(validEstado.mensaje);

        // Costo válido (>= 0)
        const validCosto = this.numeroMinimo(datos.costo, 0, 'Costo');
        if (!validCosto.valido) errores.push(validCosto.mensaje);

        // Fecha de solicitud
        const validFechaSolicitud = this.fecha(datos.fechaSolicitud, 'Fecha de solicitud');
        if (!validFechaSolicitud.valido) {
            errores.push(validFechaSolicitud.mensaje);
        } else {
            // No puede ser futura
            const validNoFutura = this.fechaNoFutura(datos.fechaSolicitud, 'Fecha de solicitud');
            if (!validNoFutura.valido) errores.push(validNoFutura.mensaje);
        }

        // Fecha de ejecución (si existe)
        if (datos.fechaEjecucion) {
            const validFechaEjecucion = this.fecha(datos.fechaEjecucion, 'Fecha de ejecución');
            if (!validFechaEjecucion.valido) {
                errores.push(validFechaEjecucion.mensaje);
            } else if (datos.fechaSolicitud) {
                // Debe ser >= fecha de solicitud
                const validMayor = this.fechaMayorOIgual(datos.fechaSolicitud, datos.fechaEjecucion, 'Fecha de solicitud', 'Fecha de ejecución');
                if (!validMayor.valido) errores.push(validMayor.mensaje);
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de compra
     */
    validarCompra: function (datos) {
        const errores = [];

        // Proveedor seleccionado
        const validProveedor = this.selectSeleccionado(datos.idProveedor, 'un proveedor');
        if (!validProveedor.valido) errores.push(validProveedor.mensaje);

        // Al menos un producto
        if (!datos.items || datos.items.length === 0) {
            errores.push('Debe agregar al menos un producto a la compra');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida item de compra antes de agregar
     */
    validarItemCompra: function (item) {
        const errores = [];

        // Producto seleccionado
        const validProducto = this.selectSeleccionado(item.idProducto, 'un producto');
        if (!validProducto.valido) errores.push(validProducto.mensaje);

        // Cantidad válida (entero positivo)
        const validCantidad = this.numeroEntero(item.cantidad, 'Cantidad');
        if (!validCantidad.valido) {
            errores.push(validCantidad.mensaje);
        } else {
            const validCantidadPositiva = this.numeroPositivo(item.cantidad, 'Cantidad');
            if (!validCantidadPositiva.valido) errores.push(validCantidadPositiva.mensaje);
        }

        // Garantía válida (entero >= 0)
        if (item.garantia !== undefined && item.garantia !== null && item.garantia !== '') {
            const validGarantiaEntero = this.numeroEntero(item.garantia, 'Garantía');
            if (!validGarantiaEntero.valido) {
                errores.push(validGarantiaEntero.mensaje);
            } else {
                const validGarantiaMinimo = this.numeroMinimo(item.garantia, 0, 'Garantía');
                if (!validGarantiaMinimo.valido) errores.push(validGarantiaMinimo.mensaje);
            }
        }

        // Costo válido (decimal positivo)
        const validCosto = this.numeroPositivo(item.costo, 'Costo');
        if (!validCosto.valido) errores.push(validCosto.mensaje);

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de empleado
     */
    validarEmpleado: function (datos) {
        const errores = [];

        // Nombre
        const validNombre = this.noVacio(datos.nombre, 'Nombre');
        if (!validNombre.valido) {
            errores.push(validNombre.mensaje);
        } else {
            const validLetrasNombre = this.soloLetrasYEspacios(datos.nombre, 'Nombre');
            if (!validLetrasNombre.valido) errores.push(validLetrasNombre.mensaje);
        }

        // Apellido
        const validApellido = this.noVacio(datos.apellido, 'Apellido');
        if (!validApellido.valido) {
            errores.push(validApellido.mensaje);
        } else {
            const validLetrasApellido = this.soloLetrasYEspacios(datos.apellido, 'Apellido');
            if (!validLetrasApellido.valido) errores.push(validLetrasApellido.mensaje);
        }

        // Teléfono (formato válido, solo números)
        if (datos.telefono) {
            const validTelefono = this.telefono(datos.telefono);
            if (!validTelefono.valido) errores.push(validTelefono.mensaje);
        }

        // Email
        if (datos.email) {
            const validEmail = this.email(datos.email);
            if (!validEmail.valido) errores.push(validEmail.mensaje);
        }

        // Dirección (longitud máxima)
        if (datos.direccion) {
            const validDireccion = this.longitudMaxima(datos.direccion, 200, 'Dirección');
            if (!validDireccion.valido) errores.push(validDireccion.mensaje);
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de proveedor
     */
    validarProveedor: function (datos) {
        const errores = [];

        // Nombre de empresa
        const validNombre = this.noVacio(datos.nombreEmpresa, 'Nombre de empresa');
        if (!validNombre.valido) {
            errores.push(validNombre.mensaje);
        } else {
            const validLongitud = this.longitudMaxima(datos.nombreEmpresa, 100, 'Nombre de empresa');
            if (!validLongitud.valido) errores.push(validLongitud.mensaje);
        }

        // Teléfono
        if (datos.telefono) {
            const validTelefono = this.telefono(datos.telefono);
            if (!validTelefono.valido) errores.push(validTelefono.mensaje);
        }

        // Email
        if (datos.email) {
            const validEmail = this.email(datos.email);
            if (!validEmail.valido) errores.push(validEmail.mensaje);
        }

        // Dirección (longitud máxima)
        if (datos.direccion) {
            const validDireccion = this.longitudMaxima(datos.direccion, 200, 'Dirección');
            if (!validDireccion.valido) errores.push(validDireccion.mensaje);
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de devolución
     */
    validarDevolucion: function (datos) {
        const errores = [];

        // Venta seleccionada
        const validVenta = this.selectSeleccionado(datos.idVenta, 'una venta');
        if (!validVenta.valido) errores.push(validVenta.mensaje);

        // Motivo de devolución
        const validMotivo = this.noVacio(datos.motivo, 'Motivo de devolución');
        if (!validMotivo.valido) {
            errores.push(validMotivo.mensaje);
        } else {
            const validLongitudMotivo = this.longitudMaxima(datos.motivo, 500, 'Motivo de devolución');
            if (!validLongitudMotivo.valido) errores.push(validLongitudMotivo.mensaje);
        }

        // Cantidad a devolver
        const validCantidad = this.numeroEntero(datos.cantidad, 'Cantidad a devolver');
        if (!validCantidad.valido) {
            errores.push(validCantidad.mensaje);
        } else {
            const validCantidadPositiva = this.numeroPositivo(datos.cantidad, 'Cantidad a devolver');
            if (!validCantidadPositiva.valido) {
                errores.push(validCantidadPositiva.mensaje);
            } else if (datos.cantidadOriginal && datos.cantidad > datos.cantidadOriginal) {
                errores.push(`Cantidad a devolver (${datos.cantidad}) no puede exceder la cantidad original (${datos.cantidadOriginal})`);
            }
        }

        // Fecha de devolución
        if (datos.fechaDevolucion) {
            const validFechaDevolucion = this.fecha(datos.fechaDevolucion, 'Fecha de devolución');
            if (!validFechaDevolucion.valido) {
                errores.push(validFechaDevolucion.mensaje);
            } else if (datos.fechaVenta) {
                // No puede ser anterior a la fecha de venta
                const validMayor = this.fechaMayorOIgual(datos.fechaVenta, datos.fechaDevolucion, 'Fecha de venta', 'Fecha de devolución');
                if (!validMayor.valido) errores.push(validMayor.mensaje);
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    /**
     * Valida datos de garantía
     */
    validarGarantia: function (datos) {
        const errores = [];

        // Descripción de garantía
        const validDescripcion = this.noVacio(datos.descripcion, 'Descripción de garantía');
        if (!validDescripcion.valido) errores.push(validDescripcion.mensaje);

        // Duración en meses (entero positivo, máximo 60)
        const validDuracion = this.numeroEntero(datos.duracionMeses, 'Duración en meses');
        if (!validDuracion.valido) {
            errores.push(validDuracion.mensaje);
        } else {
            const validDuracionPositiva = this.numeroPositivo(datos.duracionMeses, 'Duración en meses');
            if (!validDuracionPositiva.valido) {
                errores.push(validDuracionPositiva.mensaje);
            } else {
                const validDuracionMaxima = this.numeroEnRango(datos.duracionMeses, 1, 60, 'Duración en meses');
                if (!validDuracionMaxima.valido) errores.push(validDuracionMaxima.mensaje);
            }
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    },

    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================

    /**
     * Muestra errores en un alert
     */
    mostrarErrores: function (errores) {
        if (errores.length > 0) {
            alert('❌ Errores de validación:\n\n' + errores.map((e, i) => `${i + 1}. ${e}`).join('\n'));
        }
    },

    /**
     * Verifica stock bajo (< 10 unidades)
     */
    verificarStockBajo: function (stock, nombreProducto) {
        const UMBRAL_STOCK_BAJO = 10;
        if (stock < UMBRAL_STOCK_BAJO) {
            return {
                alerta: true,
                mensaje: `⚠️ ALERTA: Stock bajo para "${nombreProducto}". Solo quedan ${stock} unidades.`
            };
        }
        return { alerta: false };
    }
};

// Hacer disponible globalmente
window.Validaciones = Validaciones;
