/**
 * @file alertas.js
 * @description Servicio centralizado de alertas, modales y confirmaciones para Compunic.
 * Reemplaza los alerts/confirms nativos con modales modernos de SweetAlert2 estilizados
 * con soporte para temas Claro/Oscuro y tipografía corporativa.
 * @date 2026
 */

(function (window) {
    'use strict';

    // Helper interno para clases personalizadas
    const getBaseClasses = (esPeligroso = false) => ({
        popup: 'compunic-swal',
        confirmButton: esPeligroso
            ? 'swal2-confirm btn-compunic-danger'
            : 'swal2-confirm btn-compunic-primary',
        cancelButton: 'swal2-cancel btn-compunic-cancel'
    });

    const Alerta = {
        /**
         * Notificación de éxito
         * @param {string} mensaje 
         * @param {string} [titulo='¡Éxito!'] 
         * @returns {Promise}
         */
        exito: function (mensaje, titulo = '¡Éxito!') {
            if (typeof Swal === 'undefined') return alert(mensaje);
            return Swal.fire({
                icon: 'success',
                title: titulo,
                text: mensaje,
                buttonsStyling: false,
                customClass: getBaseClasses(),
                confirmButtonText: 'Entendido'
            });
        },

        /**
         * Notificación de error
         * @param {string} mensaje 
         * @param {string} [titulo='Error'] 
         * @returns {Promise}
         */
        error: function (mensaje, titulo = 'Error') {
            if (typeof Swal === 'undefined') return alert(mensaje);
            return Swal.fire({
                icon: 'error',
                title: titulo,
                text: mensaje,
                buttonsStyling: false,
                customClass: getBaseClasses(),
                confirmButtonText: 'Aceptar'
            });
        },

        /**
         * Notificación de advertencia o validación
         * @param {string} mensaje 
         * @param {string} [titulo='Atención'] 
         * @returns {Promise}
         */
        advertencia: function (mensaje, titulo = 'Atención') {
            if (typeof Swal === 'undefined') return alert(mensaje);
            return Swal.fire({
                icon: 'warning',
                title: titulo,
                text: mensaje,
                buttonsStyling: false,
                customClass: getBaseClasses(),
                confirmButtonText: 'Entendido'
            });
        },

        /**
         * Notificación informativa
         * @param {string} mensaje 
         * @param {string} [titulo='Información'] 
         * @returns {Promise}
         */
        info: function (mensaje, titulo = 'Información') {
            if (typeof Swal === 'undefined') return alert(mensaje);
            return Swal.fire({
                icon: 'info',
                title: titulo,
                text: mensaje,
                buttonsStyling: false,
                customClass: getBaseClasses(),
                confirmButtonText: 'Entendido'
            });
        },

        /**
         * Diálogo de confirmación moderno (Asíncrono)
         * @param {string} mensaje 
         * @param {Object} [opciones={}]
         * @returns {Promise<boolean>} Devuelve true si el usuario confirmó, false si canceló
         */
        confirmar: async function (mensaje, opciones = {}) {
            if (typeof Swal === 'undefined') {
                return window._nativeConfirm ? window._nativeConfirm(mensaje) : confirm(mensaje);
            }

            const {
                titulo = '¿Estás seguro?',
                confirmText = 'Sí, continuar',
                cancelText = 'Cancelar',
                peligroso = true,
                icono = 'warning'
            } = opciones;

            const resultado = await Swal.fire({
                icon: icono,
                title: titulo,
                html: mensaje.replace(/\n/g, '<br>'),
                showCancelButton: true,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                reverseButtons: true,
                buttonsStyling: false,
                customClass: getBaseClasses(peligroso)
            });

            return !!resultado.isConfirmed;
        },

        /**
         * Diálogo de entrada de texto (Reemplazo para prompt)
         * @param {string} mensaje 
         * @param {string} [valorInicial=''] 
         * @param {Object} [opciones={}]
         * @returns {Promise<string|null>} Devuelve el texto ingresado o null si canceló
         */
        prompt: async function (mensaje, valorInicial = '', opciones = {}) {
            if (typeof Swal === 'undefined') {
                return window._nativePrompt ? window._nativePrompt(mensaje, valorInicial) : prompt(mensaje, valorInicial);
            }

            const {
                titulo = 'Ingrese un valor',
                placeholder = '',
                confirmText = 'Aceptar',
                cancelText = 'Cancelar',
                inputType = 'text',
                validador = null
            } = opciones;

            const resultado = await Swal.fire({
                title: titulo,
                text: mensaje,
                input: inputType,
                inputValue: valorInicial,
                inputPlaceholder: placeholder,
                showCancelButton: true,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                reverseButtons: true,
                buttonsStyling: false,
                customClass: getBaseClasses(false),
                inputValidator: validador || function (value) {
                    if (!value || !value.trim()) {
                        return 'Por favor complete este campo';
                    }
                    return null;
                }
            });

            if (resultado.isConfirmed) {
                return resultado.value;
            }
            return null;
        },

        /**
         * Notificación Toast flotante (auto-cierre)
         * @param {string} mensaje 
         * @param {'success'|'error'|'warning'|'info'} [tipo='success'] 
         * @param {number} [tiempoMs=3000]
         */
        toast: function (mensaje, tipo = 'success', tiempoMs = 3000) {
            if (typeof Swal === 'undefined') return;
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: tiempoMs,
                timerProgressBar: true,
                customClass: { popup: 'compunic-toast' },
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
            Toast.fire({
                icon: tipo,
                title: mensaje
            });
        }
    };

    // Exportar al ámbito global
    window.Alerta = Alerta;
    window.Alertas = Alerta;

    // =========================================================================
    // RED DE SEGURIDAD (Polyfill inteligente para llamadas residuales a alert)
    // =========================================================================
    if (!window._nativeAlert) {
        window._nativeAlert = window.alert;
    }

    // Sobrescribir window.alert de forma segura e inteligente
    window.alert = function (mensaje) {
        if (typeof Swal === 'undefined') {
            return window._nativeAlert(mensaje);
        }

        const msgStr = String(mensaje || '');
        const msgLower = msgStr.toLowerCase();

        // Determinar icono y título automáticamente según el texto
        if (msgLower.includes('error') || msgLower.includes('❌') || msgLower.includes('falló') || msgLower.includes('no se pudo')) {
            Alerta.error(msgStr, 'Error');
        } else if (msgLower.includes('éxito') || msgLower.includes('exitosamente') || msgLower.includes('correctamente') || msgLower.includes('✅') || msgLower.includes('agregad') || msgLower.includes('actualizad') || msgLower.includes('modificad') || msgLower.includes('guardad')) {
            Alerta.exito(msgStr, '¡Éxito!');
        } else if (msgLower.includes('atención') || msgLower.includes('advertencia') || msgLower.includes('obligatorio') || msgLower.includes('seleccione') || msgLower.includes('debe ') || msgLower.includes('requerido') || msgLower.includes('no hay suficiente stock')) {
            Alerta.advertencia(msgStr, 'Atención');
        } else {
            Alerta.info(msgStr, 'Información');
        }
    };

})(window);
