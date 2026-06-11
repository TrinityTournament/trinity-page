// ══════════════════════════════════════════
//  TRINITY — SELECTOR DE PREFERENCIAS
//  Módulo independiente y reutilizable
// ══════════════════════════════════════════
//
// Uso:
//   openPreferencesPicker({
//       tipo:       'deportes' | 'videojuegos',
//       bannerMap:  { 'Fútbol': 'ruta.webp', ... },
//       selected:   ['Fútbol', 'Tenis'],   // selección actual
//       max:        3,                      // máximo de opciones
//       onSave:     (tipo, seleccion) => { ... }
//   });
//
// No depende de nada del resto del proyecto, solo necesita
// que preferences-picker.css esté cargado en la página.

(function () {
    let state = null; // { tipo, bannerMap, selected:Set, max, onSave }

    const TITLES = {
        deportes:    'Elegí tus deportes favoritos',
        videojuegos: 'Elegí tus videojuegos favoritos',
    };

    // ── Crear el DOM del modal (una sola vez) ──
    function buildModal() {
        if (document.getElementById('prefs-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'prefs-overlay';
        overlay.className = 'prefs-overlay hidden';
        overlay.innerHTML = `
            <div class="prefs-modal">
                <div class="prefs-title" id="prefs-title">Elegí tus favoritos</div>
                <div class="prefs-subtitle" id="prefs-subtitle"></div>
                <div class="prefs-grid" id="prefs-grid"></div>
                <div class="prefs-msg" id="prefs-msg"></div>
                <div class="prefs-footer">
                    <span class="prefs-counter" id="prefs-counter"></span>
                    <div class="prefs-actions">
                        <button type="button" class="prefs-btn" id="prefs-cancel">Cancelar</button>
                        <button type="button" class="prefs-btn prefs-btn-primary" id="prefs-save">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('prefs-cancel').addEventListener('click', closePicker);
        document.getElementById('prefs-save').addEventListener('click', confirmSelection);

        // Cerrar al hacer click fuera del modal
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closePicker();
        });
    }

    // ── Abrir el selector ──
    function openPreferencesPicker(opts) {
        buildModal();

        state = {
            tipo:      opts.tipo,
            bannerMap: opts.bannerMap || {},
            selected:  new Set(opts.selected || []),
            max:       opts.max || 3,
            onSave:    opts.onSave || (() => {}),
        };

        document.getElementById('prefs-title').textContent =
            TITLES[state.tipo] || 'Elegí tus favoritos';
        document.getElementById('prefs-subtitle').textContent =
            `Podés elegir hasta ${state.max}.`;
        document.getElementById('prefs-msg').textContent = '';
        document.getElementById('prefs-msg').className = 'prefs-msg';

        renderGrid();
        updateFooter();

        document.getElementById('prefs-overlay').classList.remove('hidden');
    }

    // ── Renderizar la grilla de opciones ──
    function renderGrid() {
        const grid = document.getElementById('prefs-grid');
        grid.innerHTML = '';

        Object.entries(state.bannerMap).forEach(([nombre, banner]) => {
            const isSelected = state.selected.has(nombre);
            const atLimit    = state.selected.size >= state.max && !isSelected;

            const opt = document.createElement('div');
            opt.className = 'prefs-option' + (isSelected ? ' selected' : '') + (atLimit ? ' disabled' : '');
            opt.dataset.nombre = nombre;
            opt.innerHTML = `
                <img src="${banner}" alt="${nombre}">
                <div class="prefs-check">&#10003;</div>
                <div class="prefs-option-label">${nombre}</div>
            `;
            opt.addEventListener('click', () => toggleOption(nombre));
            grid.appendChild(opt);
        });
    }

    // ── Alternar selección ──
    function toggleOption(nombre) {
        if (state.selected.has(nombre)) {
            state.selected.delete(nombre);
        } else {
            if (state.selected.size >= state.max) return; // límite alcanzado
            state.selected.add(nombre);
        }
        renderGrid();
        updateFooter();
    }

    // ── Actualizar contador y estado del botón guardar ──
    function updateFooter() {
        const counter = document.getElementById('prefs-counter');
        const saveBtn = document.getElementById('prefs-save');
        counter.textContent = `${state.selected.size} / ${state.max} seleccionados`;
        saveBtn.disabled = state.selected.size === 0;
    }

    // ── Guardar selección (delega en onSave del caller) ──
    async function confirmSelection() {
        const msg     = document.getElementById('prefs-msg');
        const saveBtn = document.getElementById('prefs-save');

        if (state.selected.size === 0) return;

        saveBtn.disabled = true;
        msg.className = 'prefs-msg';
        msg.textContent = 'Guardando...';

        try {
            await state.onSave(state.tipo, Array.from(state.selected));
            closePicker();
        } catch (err) {
            msg.className = 'prefs-msg err';
            msg.textContent = (err && err.message) || 'No se pudo guardar. Intentá de nuevo.';
            saveBtn.disabled = false;
        }
    }

    // ── Cerrar modal ──
    function closePicker() {
        const overlay = document.getElementById('prefs-overlay');
        if (overlay) overlay.classList.add('hidden');
        state = null;
    }

    // Exponer globalmente
    window.openPreferencesPicker = openPreferencesPicker;
    window.closePreferencesPicker = closePicker;
})();