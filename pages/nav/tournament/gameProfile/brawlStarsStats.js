// ══════════════════════════════════════════
//  TRINITY — Ventana de estadísticas: Brawl Stars
//
//  Uso:
//    openBrawlStarsStats({ tag: '#VOYUUUO' });
//    openBrawlStarsStats();   // usa la cuenta vinculada del usuario
//
//  Requiere: brawlStarsStats.css, apiFetch, BASE_URL.
// ══════════════════════════════════════════

(function () {
    function buildModal() {
        if (document.getElementById('bs-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'bs-overlay';
        overlay.className = 'bs-overlay hidden';
        overlay.innerHTML = `
            <div class="bs-modal">
                <button type="button" class="bs-close" id="bs-close">✕</button>

                <div class="bs-header">
                    <div class="bs-header-left">
                        <div class="bs-avatar" id="bs-avatar">
                            <img src="${BASE_URL}/assets/tournament-banner/BSLogo.png" alt="Brawl Stars">
                        </div>
                        <div>
                            <div class="bs-header-name" id="bs-header-name">Cargando…</div>
                            <div class="bs-header-tag"  id="bs-header-tag"></div>
                        </div>
                    </div>
                    <div class="bs-header-badge">
                        <svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.27l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 2z"/></svg>
                        Estadísticas
                    </div>
                </div>

                <div id="bs-body-wrap"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('bs-close').addEventListener('click', closeBs);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeBs(); });
    }

    function renderLoading() {
        document.getElementById('bs-body-wrap').innerHTML = `<div class="bs-state">Buscando estadísticas…</div>`;
        document.getElementById('bs-header-name').textContent = 'Cargando…';
        document.getElementById('bs-header-tag').textContent  = '';
    }

    function renderError(msg) {
        document.getElementById('bs-body-wrap').innerHTML = `<div class="bs-state err">${msg}</div>`;
        document.getElementById('bs-header-name').textContent = 'Brawl Stars';
    }

    function statBlock(icon, value, label, cls = '') {
        return `
            <div class="bs-stat ${cls}">
                <div class="bs-stat-icon">${icon}</div>
                <div class="bs-stat-value">${value}</div>
                <div class="bs-stat-label">${label}</div>
            </div>
        `;
    }

    function renderStats(perfil) {
        document.getElementById('bs-header-name').textContent = perfil.nombre   || 'Jugador';
        document.getElementById('bs-header-tag').textContent  = perfil.tag ? `#${perfil.tag.replace('#','')}` : '';

        const clubHTML = perfil.club
            ? `<div class="bs-club">
                   <span class="bs-club-icon">🏰</span>
                   <span class="bs-club-name">${perfil.club.nombre}</span>
                   <span class="bs-club-tag">${perfil.club.tag}</span>
               </div>`
            : `<div class="bs-club muted">Sin club</div>`;

        const rankHTML = perfil.elo
            ? `<div class="bs-rank-row">
                   <div class="bs-rank-name">${perfil.rangoNombre || '—'}</div>
                   <div class="bs-rank-elo">${perfil.elo.toLocaleString('es')} ELO</div>
                   ${perfil.maxElo ? `<div class="bs-rank-max">Máx: ${perfil.maxElo.toLocaleString('es')}</div>` : ''}
               </div>`
            : '';

        document.getElementById('bs-body-wrap').innerHTML = `
            <div class="bs-body">
                <div class="bs-banner" style="background-image:url('${BASE_URL}/assets/tournament-banner/BSBG.png');"></div>
                <div class="bs-content">

                    <div class="bs-section-label">TROFEOS</div>
                    <div class="bs-trophy-row">
                        <div class="bs-trophy-main">
                            <span class="bs-trophy-icon">🏆</span>
                            <span class="bs-trophy-num">${(perfil.trofeos ?? 0).toLocaleString('es')}</span>
                        </div>
                        ${perfil.maxTrofeos ? `<div class="bs-trophy-max muted">Récord: ${perfil.maxTrofeos.toLocaleString('es')}</div>` : ''}
                    </div>

                    <div class="bs-section-label" style="margin-top:18px;">VICTORIAS</div>
                    <div class="bs-stats-grid">
                        ${statBlock('🤝', (perfil.victorias3v3 ?? 0).toLocaleString('es'), '3v3', 'orange')}
                        ${statBlock('🦸', (perfil.victoriasSolo ?? 0).toLocaleString('es'), 'Solo', 'orange')}
                        ${statBlock('👥', (perfil.victoriasDuo ?? 0).toLocaleString('es'), 'Dúo', 'orange')}
                        ${statBlock('⭐', `Nv. ${perfil.nivel ?? '—'}`, 'Nivel', '')}
                    </div>

                    ${rankHTML ? `<div class="bs-section-label" style="margin-top:18px;">COMPETITIVO</div>${rankHTML}` : ''}

                    <div class="bs-section-label" style="margin-top:18px;">CLUB</div>
                    ${clubHTML}

                </div>
            </div>
        `;
    }

    async function openBrawlStarsStats(opts) {
        buildModal();
        renderLoading();
        document.getElementById('bs-overlay').classList.remove('hidden');

        const tag = opts && opts.tag ? opts.tag.trim() : '';
        const url = tag
            ? `${BASE_URL}/api/videogames/BRAWLAPI/get-stats.php?tag=${encodeURIComponent(tag)}`
            : `${BASE_URL}/api/videogames/BRAWLAPI/get-stats.php`;

        try {
            const res  = await apiFetch(url);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                renderError(data.error || 'No se pudieron cargar las estadísticas.');
                return;
            }
            renderStats(data.perfil);
        } catch (err) {
            console.error('[brawlStarsStats] Error:', err);
            renderError('Error al conectar con el servidor. Intentá de nuevo.');
        }
    }

    function closeBs() {
        const overlay = document.getElementById('bs-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.openBrawlStarsStats  = openBrawlStarsStats;
    window.closeBrawlStarsStats = closeBs;
})();
