// ══════════════════════════════════════════
//  TRINITY — Ventana de estadísticas: Fortnite
//
//  Uso:
//    openFortniteStats({ username: 'MiraCertera3343' });
//    openFortniteStats();   // usa la cuenta vinculada del usuario
//
//  Requiere: fortniteStats.css, apiFetch (assets/js/api.js), BASE_URL (components/nav.js).
// ══════════════════════════════════════════

(function () {
    function buildModal() {
        if (document.getElementById('fns-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'fns-overlay';
        overlay.className = 'fns-overlay hidden';
        overlay.innerHTML = `
            <div class="fns-modal">
                <button type="button" class="fns-close" id="fns-close">✕</button>

                <div class="fns-header">
                    <div class="fns-header-left">
                        <div class="fns-avatar" id="fns-avatar">
                            <img src="${BASE_URL}/assets/tournament-banner/FortniteICON.png" alt="Fortnite">
                        </div>
                        <div>
                            <div class="fns-header-name" id="fns-header-name">Cargando…</div>
                            <div class="fns-header-sub" id="fns-header-sub">Fortnite Battle Royale</div>
                        </div>
                    </div>
                    <div class="fns-header-badge">
                        <svg viewBox="0 0 24 24"><path d="M12 2l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.27l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 2z"/></svg>
                        Estadísticas
                    </div>
                </div>

                <div id="fns-body-wrap"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('fns-close').addEventListener('click', closeFn);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeFn(); });
    }

    function renderLoading() {
        document.getElementById('fns-body-wrap').innerHTML = `
            <div class="fns-state">Buscando estadísticas…</div>
        `;
        document.getElementById('fns-header-name').textContent = 'Cargando…';
    }

    function renderError(msg) {
        document.getElementById('fns-body-wrap').innerHTML = `
            <div class="fns-state err">${msg}</div>
        `;
        document.getElementById('fns-header-name').textContent = 'Fortnite';
    }

    function statBlock(icon, value, label, cls = '') {
        return `
            <div class="fns-stat ${cls}">
                <div class="fns-stat-icon">${icon}</div>
                <div class="fns-stat-value">${value}</div>
                <div class="fns-stat-label">${label}</div>
            </div>
        `;
    }

    function modeSection(titulo, mode) {
        if (!mode || mode.matches === 0) return '';
        const wr = mode.winRate != null ? mode.winRate.toFixed(1) + '%' : '—';
        const kd = mode.deaths > 0 ? (mode.kd ?? (mode.kills / mode.deaths)).toFixed(2) : '∞';
        const hrs = mode.minutesPlayed != null ? (mode.minutesPlayed / 60).toFixed(0) + 'h' : '—';
        return `
            <div class="fns-mode-card">
                <div class="fns-mode-title">${titulo}</div>
                <div class="fns-mode-stats">
                    <div class="fns-mstat"><span class="fns-mstat-val">${mode.matches ?? 0}</span><span class="fns-mstat-lbl">Partidas</span></div>
                    <div class="fns-mstat win"><span class="fns-mstat-val">${mode.wins ?? 0}</span><span class="fns-mstat-lbl">Victorias</span></div>
                    <div class="fns-mstat"><span class="fns-mstat-val">${wr}</span><span class="fns-mstat-lbl">Win Rate</span></div>
                    <div class="fns-mstat"><span class="fns-mstat-val">${mode.kills ?? 0}</span><span class="fns-mstat-lbl">Kills</span></div>
                    <div class="fns-mstat"><span class="fns-mstat-val">${kd}</span><span class="fns-mstat-lbl">K/D</span></div>
                    <div class="fns-mstat"><span class="fns-mstat-val">${hrs}</span><span class="fns-mstat-lbl">Horas</span></div>
                </div>
            </div>
        `;
    }

    function renderStats(perfil) {
        document.getElementById('fns-header-name').textContent = perfil.nombre || 'Jugador';
        document.getElementById('fns-header-sub').textContent  = `Nivel BP ${perfil.battlePassLevel ?? '—'}`;

        const all = perfil.overall || {};

        document.getElementById('fns-body-wrap').innerHTML = `
            <div class="fns-body">
                <div class="fns-banner" style="background-image:url('${BASE_URL}/assets/tournament-banner/FortBG.jpg');"></div>
                <div class="fns-content">

                    <div class="fns-section-label">RESUMEN GENERAL</div>
                    <div class="fns-global-stats">
                        ${statBlock('🏆', (all.wins ?? 0).toLocaleString('es'), 'Victorias', 'gold')}
                        ${statBlock('🎯', (all.kills ?? 0).toLocaleString('es'), 'Kills')}
                        ${statBlock('🎮', (all.matches ?? 0).toLocaleString('es'), 'Partidas')}
                        ${statBlock('📈', all.kd != null ? all.kd.toFixed(2) : '—', 'K/D')}
                        ${statBlock('⚡', all.winRate != null ? all.winRate.toFixed(1) + '%' : '—', 'Win Rate', 'green')}
                        ${statBlock('🕒', all.minutesPlayed != null ? Math.round(all.minutesPlayed / 60) + 'h' : '—', 'Horas')}
                    </div>

                    <div class="fns-section-label">POR MODO</div>
                    <div class="fns-modes">
                        ${modeSection('⌨️ Solo', perfil.solo)}
                        ${modeSection('⌨️ Dúo', perfil.duo)}
                        ${modeSection('⌨️ Escuadra', perfil.squad)}
                        ${modeSection('🎮 Solo (Gamepad)', perfil.soloGP)}
                        ${modeSection('🎮 Dúo (Gamepad)', perfil.duoGP)}
                        ${modeSection('🎮 Escuadra (GP)', perfil.squadGP)}
                    </div>

                </div>
            </div>
        `;
    }

    async function openFortniteStats(opts) {
        buildModal();
        renderLoading();
        document.getElementById('fns-overlay').classList.remove('hidden');

        const username = opts && opts.username ? opts.username.trim() : '';
        const url = username
            ? `${BASE_URL}/api/videogames/FortniteAPI/get-stats.php?username=${encodeURIComponent(username)}`
            : `${BASE_URL}/api/videogames/FortniteAPI/get-stats.php`;

        try {
            const res  = await apiFetch(url);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                renderError(data.error || 'No se pudieron cargar las estadísticas.');
                return;
            }
            renderStats(data.perfil);
        } catch (err) {
            console.error('[fortniteStats] Error:', err);
            renderError('Error al conectar con el servidor. Intentá de nuevo.');
        }
    }

    function closeFn() {
        const overlay = document.getElementById('fns-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.openFortniteStats  = openFortniteStats;
    window.closeFortniteStats = closeFn;
})();
