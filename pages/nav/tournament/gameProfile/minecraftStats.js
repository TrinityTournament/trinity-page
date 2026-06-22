// ══════════════════════════════════════════
//  TRINITY — Ventana de estadísticas: Minecraft Java
// ══════════════════════════════════════════

(function () {
    function buildModal() {
        if (document.getElementById('mc-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'mc-overlay';
        overlay.className = 'mc-overlay hidden';
        overlay.innerHTML = `
            <div class="mc-modal">
                <button type="button" class="mc-close" id="mc-close">✕</button>

                <div class="mc-header">
                    <div class="mc-header-left">
                        <div class="mc-avatar" id="mc-avatar">
                            <img src="${BASE_URL}/assets/tournament-banner/MinecraftLogo.png" alt="Minecraft">
                        </div>
                        <div>
                            <div class="mc-header-name" id="mc-header-name">Cargando…</div>
                            <div class="mc-header-sub"  id="mc-header-sub">Minecraft Java Edition</div>
                        </div>
                    </div>
                    <div class="mc-header-badge">
                        <svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.27l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 2z"/></svg>
                        Perfil
                    </div>
                </div>

                <div id="mc-body-wrap"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('mc-close').addEventListener('click', closeMc);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeMc(); });
    }

    function renderLoading() {
        document.getElementById('mc-body-wrap').innerHTML = `<div class="mc-state">Buscando perfil…</div>`;
        document.getElementById('mc-header-name').textContent = 'Cargando…';
    }

    function renderError(msg) {
        document.getElementById('mc-body-wrap').innerHTML = `<div class="mc-state err">${msg}</div>`;
        document.getElementById('mc-header-name').textContent = 'Minecraft';
    }

    // Tipos de vista disponibles para la skin, con su URL y etiqueta
    const SKIN_VIEWS = [
        { key: 'avatar', label: 'Avatar', url: uuid => `https://mc-heads.net/avatar/${uuid}/128` },
        { key: 'head',   label: 'Head',   url: uuid => `https://mc-heads.net/head/${uuid}/128`   },
        { key: 'body',   label: 'Body',   url: uuid => `https://mc-heads.net/body/${uuid}/200`   },
        { key: 'player', label: 'Full',   url: uuid => `https://mc-heads.net/player/${uuid}/200` },
    ];

    function renderStats(perfil) {
        document.getElementById('mc-header-name').textContent = perfil.nombre || 'Jugador';
        document.getElementById('mc-header-sub').textContent  = perfil.uuid
            ? `UUID: ${perfil.uuid.substring(0, 8)}…`
            : 'Minecraft Java Edition';

        // Avatar del header (cara pixelada)
        if (perfil.uuid) {
            document.getElementById('mc-avatar').innerHTML =
                `<img src="https://mc-heads.net/avatar/${perfil.uuid}/64" alt="">`;
        }

        // Renderizar el cuerpo completo
        document.getElementById('mc-body-wrap').innerHTML = `
            <div class="mc-body">
                <div class="mc-banner" style="background-image:url('${BASE_URL}/assets/tournament-banner/MineBG.jpg');"></div>
                <div class="mc-content">

                    <div class="mc-skin-block">
                        <div class="mc-skin-panel" id="mc-skin-panel">
                            ${perfil.uuid
                                ? `<img
                                    id="mc-skin-img"
                                    src="https://mc-heads.net/player/${perfil.uuid}/200"
                                    alt="Skin de ${perfil.nombre}"
                                    class="mc-skin-img"
                                   >`
                                : ''}
                        </div>

                        <div class="mc-profile-info">
                            <div class="mc-profile-name">${perfil.nombre}</div>

                            ${perfil.uuid ? `
                                <div class="mc-uuid-label">UUID</div>
                                <div class="mc-uuid">${perfil.uuid}</div>
                            ` : ''}

                            ${perfil.uuid ? `
                                <div class="mc-links-title">VISTA DE SKIN</div>
                                <div class="mc-links" id="mc-skin-btns">
                                    ${SKIN_VIEWS.map(v => `
                                        <button
                                            type="button"
                                            class="mc-link${v.key === 'player' ? ' active' : ''}"
                                            data-skin-key="${v.key}"
                                            data-skin-url="${v.url(perfil.uuid)}"
                                        >${v.label}</button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="mc-note">
                        <span class="mc-note-icon">ℹ️</span>
                        Minecraft Java Edition no expone estadísticas públicas de partidas a través de una API oficial.
                        Tu cuenta está vinculada y será verificada al momento del torneo.
                    </div>

                </div>
            </div>
        `;

        // Conectar los botones de vista de skin
        if (perfil.uuid) {
            document.getElementById('mc-skin-btns').addEventListener('click', e => {
                const btn = e.target.closest('[data-skin-key]');
                if (!btn) return;

                // Cambiar imagen
                const img = document.getElementById('mc-skin-img');
                if (img) {
                    img.src = btn.dataset.skinUrl;
                }

                // Actualizar estado activo del botón
                document.querySelectorAll('#mc-skin-btns .mc-link').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        }
    }

    async function openMinecraftStats(opts) {
        buildModal();
        renderLoading();
        document.getElementById('mc-overlay').classList.remove('hidden');

        const username = opts && opts.username ? opts.username.trim() : '';
        const url = username
            ? `${BASE_URL}/api/videogames/MinecraftAPI/get-stats.php?username=${encodeURIComponent(username)}`
            : `${BASE_URL}/api/videogames/MinecraftAPI/get-stats.php`;

        try {
            const res  = await apiFetch(url);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                renderError(data.error || 'No se pudo encontrar ese usuario de Minecraft.');
                return;
            }
            renderStats(data.perfil);
        } catch (err) {
            console.error('[minecraftStats] Error:', err);
            renderError('Error al conectar con el servidor. Intentá de nuevo.');
        }
    }

    function closeMc() {
        const overlay = document.getElementById('mc-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.openMinecraftStats  = openMinecraftStats;
    window.closeMinecraftStats = closeMc;
})();
