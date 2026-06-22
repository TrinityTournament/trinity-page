// ══════════════════════════════════════════
//  TRINITY — PERFIL DE VIDEOJUEGO + INSCRIPCIÓN
//  Módulo independiente y reutilizable
// ══════════════════════════════════════════
//
// Uso:
//   openGameProfileModal(juego, {
//       valoresGuardados: { tag: '#ABC123' },   // datos previamente guardados (opcional)
//       onGuardar: async (juegoId, datos) => {
//           // datos = { campoKey: valor, ... }
//           // lanzar un Error si falla, para mostrar el mensaje en el modal
//       },
//   });
//
// Forma de "juego":
//   {
//       id:       'clashroyale',
//       nombre:   'Clash Royale',
//       logo:     'ruta/logo.webp',   // o null
//       emoji:    '⚔️',               // fallback si no hay logo
//       campos: [                    // [] si no aplica (ej: deportes)
//           { key, label, placeholder, ayuda, tipo: 'text'|'select', opciones: [] }
//       ],
//       torneo: { nombre, fecha, formato, cupos } | null,
//   }
//
// No depende de nada del resto del proyecto, solo necesita
// que gameProfile.css esté cargado en la página.

(function () {
    let state = null; // { juego, valores, onGuardar }

    // ── Crear el DOM del modal (una sola vez) ──
    function buildModal() {
        if (document.getElementById('gp-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'gp-overlay';
        overlay.className = 'gp-overlay hidden';
        overlay.innerHTML = `
            <div class="gp-modal">
                <button type="button" class="gp-close" id="gp-close">✕</button>

                <div class="gp-header">
                    <div class="gp-header-logo" id="gp-header-logo"></div>
                    <div>
                        <p class="gp-eyebrow" id="gp-eyebrow">Configurar videojuego</p>
                        <h3 class="gp-title" id="gp-title"></h3>
                    </div>
                </div>

                <div id="gp-fields-step">
                    <p class="gp-step-label"><span>1</span> Vinculá tu cuenta</p>
                    <p class="gp-step-desc">La usamos para verificar resultados durante el torneo.</p>
                    <div class="gp-fields" id="gp-fields"></div>
                </div>

                <div class="gp-divider" id="gp-divider"></div>

                <div id="gp-torneo-step">
                    <p class="gp-step-label" id="gp-torneo-label"><span>2</span> Torneo disponible</p>
                    <div id="gp-torneo-box"></div>
                </div>

                <p class="gp-msg" id="gp-msg"></p>

                <div class="gp-actions">
                    <button type="button" class="gp-btn" id="gp-cancel">Cancelar</button>
                    <button type="button" class="gp-btn gp-btn-primary" id="gp-save">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('gp-close').addEventListener('click', closeModal);
        document.getElementById('gp-cancel').addEventListener('click', closeModal);
        document.getElementById('gp-save').addEventListener('click', confirmar);

        // Cerrar al hacer click fuera del modal
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });
    }

    // ── Abrir el modal con la config de un juego ──
    function openGameProfileModal(juego, opts) {
        buildModal();

        state = {
            juego,
            valores:   Object.assign({}, (opts && opts.valoresGuardados) || {}),
            onGuardar: (opts && opts.onGuardar) || (() => {}),
        };

        const tieneCampos = (juego.campos || []).length > 0;

        // Header
        const logoBox = document.getElementById('gp-header-logo');
        logoBox.innerHTML = juego.logo
            ? `<img src="${juego.logo}" alt="${juego.nombre}">`
            : `<span>${juego.emoji || '🎮'}</span>`;
        document.getElementById('gp-title').textContent = juego.nombre;
        document.getElementById('gp-eyebrow').textContent =
            tieneCampos ? 'Configurar videojuego' : 'Inscripción al torneo';

        // Paso 1 (solo si el juego tiene campos para vincular cuenta)
        const fieldsStep = document.getElementById('gp-fields-step');
        const divider    = document.getElementById('gp-divider');
        if (tieneCampos) {
            fieldsStep.style.display = '';
            divider.style.display    = '';
            renderFields();
        } else {
            fieldsStep.style.display = 'none';
            divider.style.display    = 'none';
        }

        // Paso 2 (torneo) — se renumera a "1" si no hubo paso de campos
        document.getElementById('gp-torneo-label').innerHTML =
            tieneCampos ? '<span>2</span> Torneo disponible' : '<span>1</span> Torneo disponible';
        renderTorneo();

        // Mensaje y botón
        const msg = document.getElementById('gp-msg');
        msg.textContent = '';
        msg.className = 'gp-msg';

        const saveBtn = document.getElementById('gp-save');
        saveBtn.disabled = false;
        saveBtn.textContent = textoBoton(juego, tieneCampos);

        document.getElementById('gp-overlay').classList.remove('hidden');
    }

    function textoBoton(juego, tieneCampos) {
        if (juego.torneo)  return tieneCampos ? 'Guardar e inscribirme' : 'Inscribirme';
        return 'Guardar datos';
    }

    // ── Renderizar campos de vinculación de cuenta ──
    function renderFields() {
        const wrap = document.getElementById('gp-fields');
        wrap.innerHTML = '';

        (state.juego.campos || []).forEach(campo => {
            const valorActual = state.valores[campo.key] || '';
            const field = document.createElement('div');
            field.className = 'gp-field';

            if (campo.tipo === 'select') {
                field.innerHTML = `
                    <label class="gp-field-label">${campo.label}</label>
                    <select class="gp-input" data-key="${campo.key}">
                        <option value="">— Elegir —</option>
                        ${(campo.opciones || []).map(op => `
                            <option value="${op}" ${op === valorActual ? 'selected' : ''}>${op}</option>
                        `).join('')}
                    </select>
                    ${campo.ayuda ? `<span class="gp-field-help">${campo.ayuda}</span>` : ''}
                `;
            } else {
                field.innerHTML = `
                    <label class="gp-field-label">${campo.label}</label>
                    <input type="text" class="gp-input" data-key="${campo.key}"
                           placeholder="${campo.placeholder || ''}" value="${valorActual}">
                    ${campo.ayuda ? `<span class="gp-field-help">${campo.ayuda}</span>` : ''}
                `;
            }
            wrap.appendChild(field);
        });
    }

    // ── Renderizar bloque de torneo (o aviso de "sin fecha") ──
    function renderTorneo() {
        const box = document.getElementById('gp-torneo-box');
        const t   = state.juego.torneo;

        if (!t) {
            box.innerHTML = `
                <p class="gp-no-torneo">
                    Todavía no hay un torneo confirmado para este juego.
                    Guardá tu cuenta y te avisamos en cuanto se abran las inscripciones.
                </p>
            `;
            return;
        }

        box.innerHTML = `
            <div class="gp-torneo-card">
                <p class="gp-torneo-name">${t.nombre}</p>
                <div class="gp-torneo-meta">
                    <span>📅 ${t.fecha}</span>
                    <span>🎮 ${t.formato}</span>
                    <span>🟢 ${t.cupos}</span>
                </div>
            </div>
        `;
    }

    // ── Leer valores actuales de los inputs ──
    function leerValores() {
        const valores = {};
        document.querySelectorAll('#gp-fields .gp-input').forEach(input => {
            valores[input.dataset.key] = input.value.trim();
        });
        return valores;
    }

    // ── Validar que los campos requeridos estén completos ──
    function validar(valores) {
        for (const campo of (state.juego.campos || [])) {
            if (!valores[campo.key]) {
                return `Completá el campo "${campo.label}".`;
            }
        }
        return null;
    }

    // ── Confirmar: delega el guardado en onGuardar del caller ──
    async function confirmar() {
        const msg     = document.getElementById('gp-msg');
        const saveBtn = document.getElementById('gp-save');
        const valores = leerValores();

        const error = validar(valores);
        if (error) {
            msg.className = 'gp-msg err';
            msg.textContent = error;
            return;
        }

        saveBtn.disabled = true;
        msg.className = 'gp-msg';
        msg.textContent = 'Guardando...';

        try {
            await state.onGuardar(state.juego.id, valores);
            msg.className = 'gp-msg ok';
            msg.textContent = state.juego.torneo
                ? '¡Listo! Quedaste inscrito en el torneo.'
                : '¡Listo! Guardamos tu cuenta.';
            setTimeout(closeModal, 1100);
        } catch (err) {
            msg.className = 'gp-msg err';
            msg.textContent = (err && err.message) || 'No se pudo guardar. Intentá de nuevo.';
            saveBtn.disabled = false;
        }
    }

    // ── Cerrar modal ──
    function closeModal() {
        const overlay = document.getElementById('gp-overlay');
        if (overlay) overlay.classList.add('hidden');
        state = null;
    }

    // Exponer globalmente
    window.openGameProfileModal  = openGameProfileModal;
    window.closeGameProfileModal = closeModal;
})();
