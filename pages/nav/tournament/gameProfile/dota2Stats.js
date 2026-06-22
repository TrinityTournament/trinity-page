// ══════════════════════════════════════════
//  TRINITY — Ventana de estadísticas: Dota 2
//
//  Uso:
//    openDota2Stats({ steamId: 'usuario_steam' });
//    openDota2Stats();   // usa la cuenta vinculada del usuario
//
//  Requiere: dota2Stats.css, apiFetch, BASE_URL.
// ══════════════════════════════════════════

(function () {
    function buildModal() {
        if (document.getElementById('d2-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'd2-overlay';
        overlay.className = 'd2-overlay hidden';
        overlay.innerHTML = `
            <div class="d2-modal">
                <button type="button" class="d2-close" id="d2-close">✕</button>

                <div class="d2-header">
                    <div class="d2-header-left">
                        <div class="d2-avatar" id="d2-avatar">
                            <img src="${BASE_URL}/assets/tournament-banner/Dota2Logo.png" alt="Dota 2">
                        </div>
                        <div>
                            <div class="d2-header-name" id="d2-header-name">Cargando…</div>
                            <div class="d2-header-sub"  id="d2-header-sub">Dota 2 · Steam</div>
                        </div>
                    </div>
                    <div class="d2-header-badge">
                        <svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.27l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 2z"/></svg>
                        Estadísticas
                    </div>
                </div>

                <div id="d2-body-wrap"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('d2-close').addEventListener('click', closeD2);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeD2(); });
    }

    function renderLoading() {
        document.getElementById('d2-body-wrap').innerHTML = `<div class="d2-state">Buscando estadísticas…</div>`;
        document.getElementById('d2-header-name').textContent = 'Cargando…';
        document.getElementById('d2-header-sub').textContent  = 'Dota 2 · Steam';
    }

    function renderError(msg) {
        document.getElementById('d2-body-wrap').innerHTML = `<div class="d2-state err">${msg}</div>`;
        document.getElementById('d2-header-name').textContent = 'Dota 2';
    }

    function statBlock(icon, value, label, cls = '') {
        return `
            <div class="d2-stat ${cls}">
                <div class="d2-stat-icon">${icon}</div>
                <div class="d2-stat-value">${value}</div>
                <div class="d2-stat-label">${label}</div>
            </div>
        `;
    }

    function renderStats(perfil) {
        const el = name => document.getElementById(name);

        el('d2-header-name').textContent = perfil.nombre || 'Jugador';
        el('d2-header-sub').textContent  = `Steam ID: ${perfil.steamId || '—'}`;

        if (perfil.avatar) {
            el('d2-avatar').innerHTML = `<img src="${perfil.avatar}" alt="">`;
        }

        const rankLabel = perfil.rankTier
            ? renderRank(perfil.rankTier)
            : '—';

        const amigosHTML = (perfil.amigos || []).map(f => `
            <div class="d2-friend">
                <img src="${f.avatar || ''}" alt="" class="d2-friend-avatar">
                <span class="d2-friend-name">${f.nombre}</span>
            </div>
        `).join('') || '<div class="d2-muted">Lista de amigos privada</div>';

        const matchesHTML = (perfil.ultimasPartidas || []).map(m => {
            const win = m.gano;
            const kda = `${m.kills}/${m.muertes}/${m.asistencias}`;
            return `
                <div class="d2-match ${win ? 'win' : 'loss'}">
                    <div class="d2-match-hero">${m.heroe || '—'}</div>
                    <div class="d2-match-kda">${kda}</div>
                    <div class="d2-match-result">${win ? '✓' : '✗'}</div>
                </div>
            `;
        }).join('') || '<div class="d2-muted">Sin partidas recientes</div>';

        el('d2-body-wrap').innerHTML = `
            <div class="d2-body">
                <div class="d2-banner" style="background-image:url('${BASE_URL}/assets/tournament-banner/D2BG.jpg');"></div>
                <div class="d2-content">

                    <div class="d2-rank-block">
                        <div class="d2-rank-badge">${rankLabel}</div>
                        <div class="d2-mmr">${perfil.mmr != null ? perfil.mmr.toLocaleString('es') + ' MMR' : ''}</div>
                    </div>

                    <div class="d2-section-label">HISTORIAL GLOBAL</div>
                    <div class="d2-stats-grid">
                        ${statBlock('🎮', (perfil.totalPartidas ?? 0).toLocaleString('es'), 'Partidas')}
                        ${statBlock('✅', (perfil.victorias ?? 0).toLocaleString('es'), 'Victorias', 'green')}
                        ${statBlock('❌', (perfil.derrotas ?? 0).toLocaleString('es'), 'Derrotas', 'red')}
                        ${statBlock('📈', perfil.winRate != null ? perfil.winRate + '%' : '—', 'Win Rate')}
                    </div>

                    <div class="d2-section-label" style="margin-top:18px;">ÚLTIMAS 20 PARTIDAS</div>
                    <div class="d2-stats-grid">
                        ${statBlock('⚔️', perfil.avgKills ?? '—', 'Kills/prom.')}
                        ${statBlock('💀', perfil.avgDeaths ?? '—', 'Muertes/p.')}
                        ${statBlock('🤝', perfil.avgAssists ?? '—', 'Asist./p.')}
                        ${statBlock('🏅', perfil.avgKDA ?? '—', 'KDA ratio')}
                    </div>

                    <div class="d2-section-label" style="margin-top:18px;">PARTIDAS RECIENTES</div>
                    <div class="d2-matches">${matchesHTML}</div>

                    ${perfil.amigos && perfil.amigos.length
                        ? `<div class="d2-section-label" style="margin-top:18px;">AMIGOS</div>
                           <div class="d2-friends">${amigosHTML}</div>`
                        : ''}

                </div>
            </div>
        `;
    }

    // Convierte el rank_tier de la API de OpenDota a texto legible
    function renderRank(tier) {
        const ranks = ['Sin rango','Heraldo','Guardián','Cruzado','Arconte','Leyenda','Anciano','Divino'];
        const main  = Math.floor(tier / 10);
        const star  = tier % 10;
        const name  = ranks[main] || `Rango ${main}`;
        if (main === 8) return '⭐ Inmortal';
        return `${name} ${star ? '★'.repeat(star) : ''}`.trim();
    }

    async function openDota2Stats(opts) {
        buildModal();
        renderLoading();
        document.getElementById('d2-overlay').classList.remove('hidden');

        const steamId = opts && opts.steamId ? opts.steamId.trim() : '';
        const url = steamId
            ? `${BASE_URL}/api/videogames/DOTA2API/get-stats.php?steamId=${encodeURIComponent(steamId)}`
            : `${BASE_URL}/api/videogames/DOTA2API/get-stats.php`;

        try {
            const res  = await apiFetch(url);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                renderError(data.error || 'No se pudieron cargar las estadísticas.');
                return;
            }
            renderStats(data.perfil);
        } catch (err) {
            console.error('[dota2Stats] Error:', err);
            renderError('Error al conectar con el servidor. Intentá de nuevo.');
        }
    }

    function closeD2() {
        const overlay = document.getElementById('d2-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.openDota2Stats  = openDota2Stats;
    window.closeDota2Stats = closeD2;
})();
