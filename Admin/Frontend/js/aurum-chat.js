/**
 * @file aurum-chat.js
 * @description AURUM Chat Widget — Frontend logic para el chatbot IA.
 * Solo se activa para usuarios con rol 'admin'.
 */

(function () {
    'use strict';

    // --- Configuración ---
    const AURUM_API = `${API_BASE}/aurum`;
    let historial = [];
    let isOpen = false;
    let isProcessing = false;

    // --- Verificación de rol (solo admin) ---
    function esAdmin() {
        try {
            const session = sessionStorage.getItem('compunic_session');
            if (!session) return false;
            const data = JSON.parse(session);
            return data.rol === 'admin';
        } catch {
            return false;
        }
    }

    // --- Inicialización ---
    function init() {
        if (!esAdmin()) {
            console.log('[AURUM] Widget oculto — Usuario no es administrador.');
            return;
        }

        crearWidget();
        verificarEstado();
        console.log('✨ [AURUM] Chat widget inicializado.');
    }

    // --- Crear estructura HTML del widget ---
    function crearWidget() {
        // Botón flotante
        const fab = document.createElement('button');
        fab.id = 'aurum-fab';
        fab.title = 'Hablar con AURUM IA';
        fab.innerHTML = `
            <span class="aurum-fab-icon">✨</span>
            <span class="aurum-badge" id="aurum-badge">1</span>
        `;
        fab.addEventListener('click', toggleChat);

        // Panel de chat
        const panel = document.createElement('div');
        panel.id = 'aurum-chat-panel';
        panel.innerHTML = `
            <div class="aurum-header">
                <div class="aurum-header-avatar">🧠</div>
                <div class="aurum-header-info">
                    <h3>AURUM</h3>
                    <p class="aurum-header-status">
                        <span class="aurum-status-dot" id="aurum-status-dot"></span>
                        <span id="aurum-status-text">Conectando...</span>
                    </p>
                </div>
                <button class="aurum-close-btn" id="aurum-close-btn" title="Cerrar">✕</button>
            </div>
            <div class="aurum-messages" id="aurum-messages">
                <div class="aurum-welcome">
                    <div class="aurum-welcome-icon">🧠</div>
                    <h4>¡Hola! Soy AURUM</h4>
                    <p>Tu asistente de IA para Compunic. Puedo consultar ventas, inventario, clientes y más. ¿En qué te ayudo?</p>
                </div>
            </div>
            <div class="aurum-suggestions" id="aurum-suggestions">
                <button class="aurum-suggestion-btn" data-msg="¿Cuáles son las ventas de hoy?">📊 Ventas de hoy</button>
                <button class="aurum-suggestion-btn" data-msg="Dame un resumen del estado del negocio">📈 Resumen general</button>
                <button class="aurum-suggestion-btn" data-msg="¿Qué productos tienen stock bajo?">⚠️ Stock bajo</button>
                <button class="aurum-suggestion-btn" data-msg="¿Cuáles son los productos más vendidos?">🏆 Top productos</button>
            </div>
            <div class="aurum-input-area">
                <textarea 
                    id="aurum-input" 
                    placeholder="Escribe tu consulta..." 
                    rows="1"
                    maxlength="1000"
                ></textarea>
                <button class="aurum-send-btn" id="aurum-send-btn" title="Enviar">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('aurum-close-btn').addEventListener('click', toggleChat);
        document.getElementById('aurum-send-btn').addEventListener('click', enviarMensaje);
        
        const input = document.getElementById('aurum-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
            }
        });

        // Auto-resize del textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 80) + 'px';
        });

        // Sugerencias rápidas
        document.querySelectorAll('.aurum-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.getAttribute('data-msg');
                document.getElementById('aurum-input').value = msg;
                enviarMensaje();
            });
        });
    }

    // --- Toggle abrir/cerrar ---
    function toggleChat() {
        isOpen = !isOpen;
        const panel = document.getElementById('aurum-chat-panel');
        const fab = document.getElementById('aurum-fab');

        if (isOpen) {
            panel.classList.add('visible');
            fab.classList.add('open');
            fab.querySelector('.aurum-fab-icon').textContent = '✕';
            document.getElementById('aurum-input').focus();
            
            // Ocultar badge
            const badge = document.getElementById('aurum-badge');
            if (badge) badge.style.display = 'none';
        } else {
            panel.classList.remove('visible');
            fab.classList.remove('open');
            fab.querySelector('.aurum-fab-icon').textContent = '✨';
        }
    }

    // --- Verificar estado de AURUM ---
    async function verificarEstado() {
        try {
            const res = await fetch(`${AURUM_API}/status`);
            const data = await res.json();

            const dot = document.getElementById('aurum-status-dot');
            const text = document.getElementById('aurum-status-text');

            if (data.aurum && data.aurum.disponible) {
                dot.classList.remove('offline');
                text.textContent = `Modelo: ${data.aurum.modelo}`;
            } else {
                dot.classList.add('offline');
                text.textContent = 'IA no disponible';
            }
        } catch (err) {
            const dot = document.getElementById('aurum-status-dot');
            const text = document.getElementById('aurum-status-text');
            if (dot) dot.classList.add('offline');
            if (text) text.textContent = 'Sin conexión al servidor';
        }
    }

    // --- Enviar mensaje ---
    async function enviarMensaje() {
        const input = document.getElementById('aurum-input');
        const mensaje = input.value.trim();
        if (!mensaje || isProcessing) return;

        isProcessing = true;
        input.value = '';
        input.style.height = 'auto';
        document.getElementById('aurum-send-btn').disabled = true;

        // Ocultar sugerencias tras el primer mensaje
        const suggestions = document.getElementById('aurum-suggestions');
        if (suggestions) suggestions.style.display = 'none';

        // Ocultar welcome
        const welcome = document.querySelector('.aurum-welcome');
        if (welcome) welcome.style.display = 'none';

        // Agregar burbuja del usuario
        agregarMensaje(mensaje, 'user');

        // Indicador de "pensando"
        const typingId = mostrarTyping();

        try {
            const res = await fetch(`${AURUM_API}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje,
                    historial
                })
            });

            const data = await res.json();
            ocultarTyping(typingId);

            if (data.success) {
                agregarMensaje(data.respuesta, 'bot');
                historial = data.nuevoHistorial || [];
            } else {
                agregarMensaje(data.error || 'Lo siento, ocurrió un error.', 'error');
            }
        } catch (err) {
            ocultarTyping(typingId);
            agregarMensaje('Error de conexión con el servidor. Verifica que el backend esté corriendo.', 'error');
        }

        isProcessing = false;
        document.getElementById('aurum-send-btn').disabled = false;
        document.getElementById('aurum-input').focus();
    }

    // --- Agregar mensaje al chat ---
    function agregarMensaje(contenido, tipo) {
        const container = document.getElementById('aurum-messages');
        const bubble = document.createElement('div');
        bubble.classList.add('aurum-msg', tipo);

        if (tipo === 'user') {
            bubble.textContent = contenido;
        } else {
            // Bot o error: renderizar HTML/markdown simple
            bubble.innerHTML = formatearRespuesta(contenido);
        }

        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    // --- Formatear respuesta (markdown simplificado → HTML) ---
    function formatearRespuesta(texto) {
        if (!texto) return '';

        // Si ya contiene HTML, devolverlo limpio
        if (texto.includes('<ul>') || texto.includes('<ol>') || texto.includes('<strong>')) {
            return texto;
        }

        // Convertir markdown básico a HTML
        let html = texto
            // Negrita: **texto** → <strong>texto</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Cursiva: *texto* → <em>texto</em>
            .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>')
            // Código inline: `texto` → <code>texto</code>
            .replace(/`(.*?)`/g, '<code style="background:rgba(20,93,144,0.1);padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');

        // Procesar listas (líneas que empiezan con - o •)
        const lines = html.split('\n');
        let resultado = '';
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.match(/^[-•]\s+/)) {
                if (!inList) {
                    resultado += '<ul style="margin:6px 0;padding-left:18px;">';
                    inList = true;
                }
                resultado += `<li style="margin-bottom:3px;">${line.replace(/^[-•]\s+/, '')}</li>`;
            } else if (line.match(/^\d+\.\s+/)) {
                if (!inList) {
                    resultado += '<ol style="margin:6px 0;padding-left:18px;">';
                    inList = true;
                }
                resultado += `<li style="margin-bottom:3px;">${line.replace(/^\d+\.\s+/, '')}</li>`;
            } else {
                if (inList) {
                    resultado += html.includes('<ol') ? '</ol>' : '</ul>';
                    inList = false;
                }
                if (line) {
                    resultado += line + '<br>';
                }
            }
        }

        if (inList) {
            resultado += '</ul>';
        }

        // Limpiar <br> extra al final
        resultado = resultado.replace(/(<br>)+$/, '');

        return resultado;
    }

    // --- Indicador de escritura ---
    function mostrarTyping() {
        const container = document.getElementById('aurum-messages');
        const typing = document.createElement('div');
        typing.classList.add('aurum-typing');
        typing.id = 'aurum-typing-' + Date.now();
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
        return typing.id;
    }

    function ocultarTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // --- Inicializar cuando el DOM esté listo ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
