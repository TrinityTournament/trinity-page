// ══════════════════════════════════════════
//  RECORTADOR DE FOTO DE PERFIL
//  Módulo independiente y reutilizable
// ══════════════════════════════════════════
//
// Uso:
//   openCropper(file, (blob, dataUrl) => {
//       // blob: imagen recortada (PNG, cuadrada)
//       // dataUrl: misma imagen en base64, lista para <img src="">
//   });
//
// No depende de nada del resto del proyecto, solo necesita
// que cropper.css esté cargado en la página.

(function () {
    const OUTPUT_SIZE = 512; // tamaño final del avatar (px)

    let state = null; // { img, scale, minScale, offsetX, offsetY, naturalW, naturalH }
    let onCropCallback = null;

    // ── Crear el DOM del modal (una sola vez) ──
    function buildModal() {
        if (document.getElementById('cropper-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'cropper-overlay';
        overlay.className = 'cropper-overlay hidden';
        overlay.innerHTML = `
            <div class="cropper-modal">
                <div class="cropper-title">Ajustar foto de perfil</div>
                <div class="cropper-stage" id="cropper-stage">
                    <img class="cropper-image" id="cropper-image" alt="">
                    <div class="cropper-mask"></div>
                </div>
                <div class="cropper-controls">
                    <span class="cropper-zoom-label">Zoom</span>
                    <input type="range" class="cropper-zoom" id="cropper-zoom" min="100" max="300" value="100">
                </div>
                <div class="cropper-actions">
                    <button type="button" class="cropper-btn" id="cropper-cancel">Cancelar</button>
                    <button type="button" class="cropper-btn cropper-btn-primary" id="cropper-confirm">Aplicar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Eventos
        document.getElementById('cropper-cancel').addEventListener('click', closeCropper);
        document.getElementById('cropper-confirm').addEventListener('click', confirmCrop);
        document.getElementById('cropper-zoom').addEventListener('input', onZoomChange);

        const stage = document.getElementById('cropper-stage');
        attachDragEvents(stage);
    }

    // ── Abrir el recortador con un archivo de imagen ──
    function openCropper(file, callback) {
        if (!file) return;
        buildModal();
        onCropCallback = callback;

        const reader = new FileReader();
        reader.onload = e => {
            const img = document.getElementById('cropper-image');
            img.onload = () => {
                document.getElementById('cropper-overlay').classList.remove('hidden');
                // Esperar a que el navegador aplique el layout (overlay visible)
                // antes de medir el tamaño del stage.
                requestAnimationFrame(() => {
                    initState(img);
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── Inicializar escala y posición ──
    function initState(img) {
        const stage = document.getElementById('cropper-stage');
        let stageSize = stage.clientWidth; // cuadrado
        if (!stageSize) stageSize = 300; // fallback de seguridad

        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        // Escala mínima: la imagen debe cubrir todo el stage
        const minScale = Math.max(stageSize / naturalW, stageSize / naturalH);

        state = {
            naturalW,
            naturalH,
            stageSize,
            minScale,
            scale: minScale,
            offsetX: 0,
            offsetY: 0
        };

        // Centrar imagen
        const dispW = naturalW * minScale;
        const dispH = naturalH * minScale;
        state.offsetX = (stageSize - dispW) / 2;
        state.offsetY = (stageSize - dispH) / 2;

        document.getElementById('cropper-zoom').value = 100;
        applyTransform();
    }

    // ── Aplicar transform a la imagen ──
    function applyTransform() {
        const img = document.getElementById('cropper-image');
        img.style.width = (state.naturalW * state.scale) + 'px';
        img.style.height = (state.naturalH * state.scale) + 'px';
        img.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px)`;
    }

    // ── Zoom con slider ──
    function onZoomChange(e) {
        const pct = parseFloat(e.target.value); // 100 - 300
        const newScale = state.minScale * (pct / 100);

        const stageSize = state.stageSize;
        const cx = stageSize / 2;
        const cy = stageSize / 2;

        // Punto en la imagen bajo el centro del stage, antes de cambiar escala
        const imgX = (cx - state.offsetX) / state.scale;
        const imgY = (cy - state.offsetY) / state.scale;

        state.scale = newScale;

        // Reajustar offset para mantener ese punto centrado
        state.offsetX = cx - imgX * state.scale;
        state.offsetY = cy - imgY * state.scale;

        clampOffsets();
        applyTransform();
    }

    // ── Restringir offsets para que la imagen siempre cubra el stage ──
    function clampOffsets() {
        const stageSize = state.stageSize;
        const dispW = state.naturalW * state.scale;
        const dispH = state.naturalH * state.scale;

        const minOffsetX = stageSize - dispW;
        const minOffsetY = stageSize - dispH;

        state.offsetX = Math.min(0, Math.max(minOffsetX, state.offsetX));
        state.offsetY = Math.min(0, Math.max(minOffsetY, state.offsetY));
    }

    // ── Arrastrar para reposicionar ──
    function attachDragEvents(stage) {
        let dragging = false;
        let startX = 0, startY = 0;
        let startOffsetX = 0, startOffsetY = 0;

        function pointerDown(x, y) {
            if (!state) return;
            dragging = true;
            startX = x;
            startY = y;
            startOffsetX = state.offsetX;
            startOffsetY = state.offsetY;
            stage.classList.add('dragging');
        }

        function pointerMove(x, y) {
            if (!dragging || !state) return;
            state.offsetX = startOffsetX + (x - startX);
            state.offsetY = startOffsetY + (y - startY);
            clampOffsets();
            applyTransform();
        }

        function pointerUp() {
            dragging = false;
            stage.classList.remove('dragging');
        }

        // Mouse
        stage.addEventListener('mousedown', e => pointerDown(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', pointerUp);

        // Touch
        stage.addEventListener('touchstart', e => {
            const t = e.touches[0];
            pointerDown(t.clientX, t.clientY);
        }, { passive: true });
        stage.addEventListener('touchmove', e => {
            const t = e.touches[0];
            pointerMove(t.clientX, t.clientY);
        }, { passive: true });
        stage.addEventListener('touchend', pointerUp);
    }

    // ── Confirmar: generar imagen recortada cuadrada ──
    function confirmCrop() {
        if (!state) return;

        const img = document.getElementById('cropper-image');
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');

        // Recorte circular
        ctx.save();
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Factor entre tamaño del stage y tamaño de salida
        const factor = OUTPUT_SIZE / state.stageSize;

        // Dibujar la imagen tal como se ve en el stage, escalada al output
        ctx.drawImage(
            img,
            0, 0, state.naturalW, state.naturalH,
            state.offsetX * factor,
            state.offsetY * factor,
            state.naturalW * state.scale * factor,
            state.naturalH * state.scale * factor
        );
        ctx.restore();

        canvas.toBlob(blob => {
            const dataUrl = canvas.toDataURL('image/png');
            if (typeof onCropCallback === 'function') {
                onCropCallback(blob, dataUrl);
            }
            closeCropper();
        }, 'image/png');
    }

    // ── Cerrar modal ──
    function closeCropper() {
        const overlay = document.getElementById('cropper-overlay');
        if (overlay) overlay.classList.add('hidden');
        state = null;
        onCropCallback = null;
    }

    // Exponer globalmente
    window.openCropper = openCropper;
    window.closeCropper = closeCropper;
})();