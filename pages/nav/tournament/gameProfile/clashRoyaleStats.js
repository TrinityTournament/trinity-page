// ══════════════════════════════════════════
//  TRINITY — Ventana de estadísticas: Clash Royale
//  Módulo independiente y reutilizable.
//
//  Uso:
//    openClashRoyaleStats({ tag: '#ABC123' });   // tag puntual
//    openClashRoyaleStats();                      // usa la cuenta vinculada del usuario
//
//  Requiere: clashRoyaleStats.css cargado en la página,
//  apiFetch (assets/js/api.js) y BASE_URL (components/nav.js).
// ══════════════════════════════════════════

(function () {
    function buildModal() {
        if (document.getElementById('crs-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'crs-overlay';
        overlay.className = 'crs-overlay hidden';
        overlay.innerHTML = `
            <div class="crs-modal">
                <button type="button" class="crs-close" id="crs-close">✕</button>
                <div class="crs-header">
                    <div class="crs-header-user">
                        <div class="crs-avatar" id="crs-avatar"></div>
                        <div>
                            <div class="crs-header-name" id="crs-header-name">Cargando…</div>
                            <div class="crs-header-tag" id="crs-header-tag"></div>
                        </div>
                    </div>
                    <div class="crs-header-title">
                        <svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.27l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 2z"/></svg>
                        Estadísticas
                    </div>
                </div>
                <div id="crs-body-wrap"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('crs-close').addEventListener('click', closeClashRoyaleStats);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeClashRoyaleStats();
        });
    }

    function renderLoading() {
        document.getElementById('crs-body-wrap').innerHTML = `
            <div class="crs-state">Buscando estadísticas…</div>
        `;
        document.getElementById('crs-header-name').textContent = 'Cargando…';
        document.getElementById('crs-header-tag').textContent = '';
        document.getElementById('crs-avatar').innerHTML = '';
    }

    function renderError(mensaje) {
        document.getElementById('crs-body-wrap').innerHTML = `
            <div class="crs-state err">${mensaje}</div>
        `;
        document.getElementById('crs-header-name').textContent = 'Clash Royale';
        document.getElementById('crs-header-tag').textContent = '';
    }

    function cardBadge(card) {
        if (card.evolutionLabel === 'HEROE_EVO' || card.evolutionLabel === 'HEROE') {
            return '<span class="crs-card-badge hero">Héroe</span>';
        }
        if (card.evolutionLabel === 'EVO') {
            return '<span class="crs-card-badge">Evo</span>';
        }
        return '';
    }

    function renderStats(perfil, fotoUrl) {
        const wins    = perfil.victorias ?? 0;
        const losses  = perfil.derrotas ?? 0;

        document.getElementById('crs-header-name').textContent = perfil.nombre || 'Jugador';
        document.getElementById('crs-header-tag').textContent  = perfil.tag ? `#${perfil.tag.replace('#', '')}` : '';

        const avatarBox = document.getElementById('crs-avatar');
        avatarBox.innerHTML = fotoUrl
            ? `<img src="${fotoUrl}" alt="">`
            : `<span style="font-size:18px;">👤</span>`;

        const deckHTML = (perfil.mazo || []).map(card => `
            <div class="crs-card">
                <div class="crs-card-img-wrap">
                    <img src="${card.image}" alt="" loading="lazy">
                    ${cardBadge(card)}
                    ${card.elixirCost != null ? `<span class="crs-card-elixir">${card.elixirCost}</span>` : ''}
                </div>
                <div class="crs-card-name">${card.name}</div>
            </div>
        `).join('');

        // perfil.arena = { nombre, numero, imagen }  — ej: { nombre: "Musketeer Street", imagen: "/assets/ArenasCR/Arena26.png" }
        const arenaHTML = perfil.arena && perfil.arena.imagen ? `
            <div class="crs-arena">
                <div class="crs-arena-img">
                    <img src="${perfil.arena.imagen}" alt="${perfil.arena.nombre || 'Arena'}">
                </div>
                <div class="crs-arena-label">${perfil.arena.nombre || ''}</div>
            </div>
        ` : '';

        document.getElementById('crs-body-wrap').innerHTML = `
            <div class="crs-body">
                <div class="crs-banner" style="background-image:url('${BASE_URL}/assets/banners-vertical/clashRoyale.webp');"></div>
                <div class="crs-content">
                    <div class="crs-stats">
                        <div class="crs-stat gold">
                            <div class="crs-stat-icon">🏆</div>
                            <div class="crs-stat-value">${(perfil.trofeos ?? 0).toLocaleString('es')}</div>
                            <div class="crs-stat-label">Trofeos</div>
                        </div>
                        <div class="crs-stat">
                            <div class="crs-stat-icon">🎁</div>
                            <div class="crs-stat-value">${(perfil.donaciones ?? 0).toLocaleString('es')}</div>
                            <div class="crs-stat-label">Donaciones</div>
                        </div>
                        <div class="crs-stat green">
                            <div class="crs-stat-icon">👑</div>
                            <div class="crs-stat-value">${wins.toLocaleString('es')}</div>
                            <div class="crs-stat-label">Victorias</div>
                        </div>
                        <div class="crs-stat red">
                            <div class="crs-stat-icon"></div>
                            <div class="crs-stat-value">${losses.toLocaleString('es')}</div>
                            <div class="crs-stat-label">Derrotas</div>
                        </div>
                    </div>

                    <div class="crs-deck-title">Mazo actual</div>
                    <div class="crs-deck-row">
                        <div class="crs-deck-grid">${deckHTML}</div>
                        ${arenaHTML}
                    </div>
                </div>
            </div>
        `;
    }

    async function openClashRoyaleStats(opts) {
        buildModal();
        renderLoading();
        document.getElementById('crs-overlay').classList.remove('hidden');

        const tag = opts && opts.tag ? opts.tag.trim() : '';
        const url = tag
            ? `${BASE_URL}/api/videogames/ClashRoyaleAPI/get-stats.php?tag=${encodeURIComponent(tag)}`
            : `${BASE_URL}/api/videogames/ClashRoyaleAPI/get-stats.php`;

        try {
            const res  = await apiFetch(url);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                renderError(data.error || 'No se pudieron cargar las estadísticas.');
                return;
            }

            const userRaw     = sessionStorage.getItem('trinity_user');
            const fotoUsuario = userRaw ? (JSON.parse(userRaw).foto_url || null) : null;
            renderStats(data.perfil, fotoUsuario);
        } catch (err) {
            console.error('[clashRoyaleStats] Error:', err);
            renderError('Error al conectar con el servidor. Intentá de nuevo.');
        }
    }

    function closeClashRoyaleStats() {
        const overlay = document.getElementById('crs-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.openClashRoyaleStats  = openClashRoyaleStats;
    window.closeClashRoyaleStats = closeClashRoyaleStats;
})();
