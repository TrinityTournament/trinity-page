// ══════════════════════════════════════════
//  TRINITY — RANKINGS
//  El nav, auth y sesión los maneja /components/nav.js
// ══════════════════════════════════════════

const RK_BASE = '/Trinity-page';

// ── CATEGORÍAS ────────────────────────────────────────────
// Mismo roster que la página de Torneos / el home: League of
// Legends, CS2, Valorant, Dota 2, Fortnite y Rocket League.
// TODO: ningún juego tiene logo real en /assets todavía (se
// borraron del repo) — quedan emojis como en index.html.
const CATEGORIAS = [
    { id: 'general',      nombre: 'General',          emoji: '🏆' },
    { id: 'lol',          nombre: 'League of Legends', emoji: '⚔️' },
    { id: 'cs2',          nombre: 'CS2',               emoji: '🎯' },
    { id: 'valorant',     nombre: 'Valorant',          emoji: '🔫' },
    { id: 'dota2',        nombre: 'Dota 2',            emoji: '🛡️' },
    { id: 'fortnite',     nombre: 'Fortnite',          emoji: '🏗️' },
    { id: 'rocketleague', nombre: 'Rocket League',     emoji: '🚗' },
];

// ── DATOS (mock determinístico) ───────────────────────────
// TODO: cuando exista el endpoint, reemplazar generarRanking()
// por un fetch a algo como
// `${RK_BASE}/api/tournaments/get-ranking.php?categoria=${id}`
// que devuelva esta misma forma: [{ usuario, jugados, ganados }, ...]

const HANDLES = [
    'ThiagoFR', 'ValeStorm', 'BrunoX', 'CamiNova', 'NicoBlitz', 'JoaquinTZ',
    'SofiPlay', 'MaxiRex', 'AguusGG', 'DelfiOnFire', 'FrancoWolf', 'RenataQ',
    'TomyShadow', 'ZoeFrost', 'BautiKing', 'MiaViper', 'LucasGhost', 'OliviaTZ',
    'IgnaPro', 'JuliBlaze', 'BenjaHawk', 'CataNinja', 'SantiNova', 'AbrilFox',
];

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

// PRNG determinístico (LCG) — mismos resultados en cada carga para una misma semilla.
function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function shuffleSeeded(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function statsParaPosicion(pos, rand) {
    const base       = Math.max(46 - pos * 1.8, 6);
    const jugados    = Math.round(base + rand() * 6);
    const winrateBase = Math.max(0.82 - pos * 0.022, 0.28);
    const winrate     = Math.min(0.95, Math.max(0.15, winrateBase + (rand() - 0.5) * 0.08));
    const ganados     = Math.min(jugados, Math.round(jugados * winrate));
    return { jugados, ganados };
}

// Genera la tabla de una categoría. Si hay un usuario logueado,
// se inserta su propia fila (determinística según su usuario)
// dentro del listado y se reordena todo por torneos ganados.
function generarRanking(categoriaId, usuarioActual) {
    const rand    = seededRandom(hashString(categoriaId) + 7);
    const handles = shuffleSeeded(HANDLES, rand);

    let filas = handles.map((handle, idx) => {
        const { jugados, ganados } = statsParaPosicion(idx + 1, rand);
        return { usuario: handle, jugados, ganados, esVos: false };
    });

    if (usuarioActual && usuarioActual.usuario) {
        const randVos   = seededRandom(hashString(categoriaId + ':' + usuarioActual.usuario));
        const posBase   = 1 + Math.floor(randVos() * 18);
        const { jugados, ganados } = statsParaPosicion(posBase, randVos);
        filas.push({
            usuario: usuarioActual.usuario,
            nombre:  usuarioActual.nombre,
            fotoUrl: usuarioActual.foto_url,
            jugados, ganados,
            esVos: true,
        });
    }

    filas.sort((a, b) => b.ganados - a.ganados || b.jugados - a.jugados);

    return filas.map((fila, idx) => ({
        ...fila,
        pos:     idx + 1,
        winrate: fila.jugados ? Math.round((fila.ganados / fila.jugados) * 100) : 0,
    }));
}

// ── ESTADO ────────────────────────────────────────────────
let categoriaActual = 'general';
let usuarioActual   = null;

// ── INIT ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    cargarUsuario();
    renderFiltros();
    renderRanking(categoriaActual);
    habilitarDragScroll();
});

function cargarUsuario() {
    const raw = sessionStorage.getItem('trinity_user');
    if (!raw) return;
    try { usuarioActual = JSON.parse(raw); } catch { usuarioActual = null; }
}

// ── FILTROS ───────────────────────────────────────────────

function renderFiltros() {
    const wrap = document.getElementById('filters-scroll');
    wrap.innerHTML = CATEGORIAS.map(cat => {
        const icon = cat.logo
            ? `<img src="${cat.logo}" alt="">`
            : `<span class="fp-emoji">${cat.emoji}</span>`;
        return `
            <button type="button" class="filter-pill ${cat.id === categoriaActual ? 'active' : ''}"
                    id="pill-${cat.id}" onclick="cambiarCategoria('${cat.id}')">
                ${icon}<span>${cat.nombre}</span>
            </button>
        `;
    }).join('');
}

function cambiarCategoria(id) {
    if (id === categoriaActual) return;
    categoriaActual = id;

    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    const pill = document.getElementById(`pill-${id}`);
    if (pill) pill.classList.add('active');

    renderRanking(id);
}

// ── RENDER DEL RANKING ────────────────────────────────────

function iniciales(fila) {
    const base = fila.nombre || fila.usuario || '?';
    return base[0].toUpperCase();
}

function renderRanking(categoriaId) {
    const datos  = generarRanking(categoriaId, usuarioActual);
    const top3   = datos.slice(0, 3);
    const resto  = datos.slice(3);

    document.getElementById('section-hint').textContent =
        CATEGORIAS.find(c => c.id === categoriaId)?.nombre + ' · por torneos ganados';

    renderPodio(top3);
    renderLista(resto);
    renderBarraVos(datos);
}

function renderPodio(top3) {
    const orden = [2, 1, 3]; // 2do, 1ro, 3ro (para el layout en grid)
    const medallas = { 1: '🥇', 2: '🥈', 3: '🥉' };

    const podio = document.getElementById('podium');
    podio.innerHTML = orden.map(pos => {
        const fila = top3[pos - 1];
        if (!fila) return `<div class="podium-spot podium-spot--${pos}"></div>`;

        const avatar = fila.fotoUrl
            ? `<img src="${fila.fotoUrl}" alt="">`
            : iniciales(fila);

        return `
            <div class="podium-spot podium-spot--${pos} ${fila.esVos ? 'is-you' : ''}" id="podium-${fila.pos}">
                ${fila.esVos ? '<span class="podium-you-tag">VOS</span>' : ''}
                <span class="podium-medal">${medallas[pos]}</span>
                <div class="podium-avatar">${avatar}</div>
                <p class="podium-name">${fila.nombre ? fila.nombre : '@' + fila.usuario}</p>
                <p class="podium-stat"><strong>${fila.ganados}</strong> ganados</p>
            </div>
        `;
    }).join('');
}

function renderLista(filas) {
    const lista = document.getElementById('rank-list');

    if (!filas.length) {
        lista.innerHTML = '<p class="section-hint" style="text-align:center;padding:1.5rem 0;">No hay más jugadores en esta categoría todavía.</p>';
        return;
    }

    lista.innerHTML = filas.map(fila => {
        const avatar = fila.fotoUrl
            ? `<img src="${fila.fotoUrl}" alt="">`
            : iniciales(fila);

        return `
            <div class="rank-row ${fila.esVos ? 'is-you' : ''}" id="rank-row-${fila.pos}">
                <span class="rank-pos">#${fila.pos}</span>
                <div class="rank-avatar">${avatar}</div>
                <p class="rank-name">
                    ${fila.nombre ? fila.nombre : '@' + fila.usuario}
                    ${fila.esVos ? '<span class="rank-you-tag">VOS</span>' : ''}
                </p>
                <div class="rank-stats">
                    <div>
                        <span class="rank-stat-num">${fila.ganados}</span>
                        <span class="rank-stat-label">Ganados</span>
                    </div>
                    <div class="rank-stat-jugados">
                        <span class="rank-stat-num">${fila.jugados}</span>
                        <span class="rank-stat-label">Jugados</span>
                    </div>
                    <div>
                        <span class="rank-stat-num">${fila.winrate}%</span>
                        <span class="rank-stat-label">Win rate</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ── BARRA "TU POSICIÓN" ───────────────────────────────────

function renderBarraVos(datos) {
    let bar = document.getElementById('you-bar');

    if (!usuarioActual) {
        if (bar) bar.remove();
        return;
    }

    const vos = datos.find(f => f.esVos);
    if (!vos) { if (bar) bar.remove(); return; }

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'you-bar';
        bar.className = 'you-bar';
        document.body.appendChild(bar);
    }

    bar.innerHTML = `
        <span class="you-bar-text">Estás en el puesto <strong>#${vos.pos}</strong> · ${vos.ganados} ganados</span>
        <button type="button" class="you-bar-btn" onclick="irAMiPosicion(${vos.pos})">Ver</button>
    `;
}

function irAMiPosicion(pos) {
    const el = document.getElementById(`podium-${pos}`) || document.getElementById(`rank-row-${pos}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1900);
}

// ── DRAG TO SCROLL (pills) ─────────────────────────────────
// Mismo patrón que .cards-scroll en /main.js

function habilitarDragScroll() {
    const slider = document.getElementById('filters-scroll');
    if (!slider) return;
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
        isDown = true;
        slider.classList.add('grabbing');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mouseup',    () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mousemove',  e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        slider.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
}
