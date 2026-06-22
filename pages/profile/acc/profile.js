// ══════════════════════════════════════════
//  TRINITY — Perfil público/propio v3
//  Deportes + Videojuegos en simultáneo
// ══════════════════════════════════════════

let USER        = null;   // usuario logueado (si hay sesión)
let PROFILE     = null;   // usuario cuyo perfil se está viendo
let IS_OWNER    = false;
let TARGET_ID   = null;   // id del perfil visto (viene en ?u=xxx)

// Assets map para banners verticales
const SPORT_BANNERS = {
    'Fútbol':     '../../../assets/banners-vertical/sports/Futbol.webp',
    'Tenis':      '../../../assets/banners-vertical/sports/Tenis.webp',
    'Basketball': '../../../assets/banners-main/Basketball.webp',
    'Volleyball': '../../../assets/banners-main/Volleyball.webp',
    'Natación':   '../../../assets/banners-main/Natacion.webp',
    'Atletismo':  '../../../assets/banners-main/Atletismo.png',
};
const GAME_BANNERS = {
    'Fortnite':          '../../../assets/banners-vertical/Fortnite.webp',
    'Clash Royale':      '../../../assets/banners-vertical/clashRoyale.webp',
    'Valorant':          '../../../assets/videogames/valorant.webp',
    'League of Legends': '../../../assets/videogames/lol.webp',
    'Call of Duty':      '../../../assets/videogames/cod.webp',
    'Rocket League':     '../../../assets/videogames/rocketleague.webp',
};

// ── INIT ──────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('trinity_user');
    if (raw) {
        USER = JSON.parse(raw);
        // Nav actualizado automáticamente por /components/nav.js
    }

    // Determinar perfil a mostrar
    const params = new URLSearchParams(window.location.search);
    TARGET_ID = params.get('u');

    if (!TARGET_ID && !USER) {
        window.location.href = '../../login/login.html';
        return;
    }

    if (!TARGET_ID && USER) {
        IS_OWNER = true;
        cargarPerfilLocal(USER);
    } else {
        cargarPerfilRemoto(TARGET_ID);
    }
});

// ── CARGAR PERFIL PROPIO (desde sessionStorage + contadores frescos de API) ──

function cargarPerfilLocal(u) {
    PROFILE = {
        ...u,
        deportes_seleccionados:    u.deportes_seleccionados    ?? u.deportes    ?? [],
        videojuegos_seleccionados: u.videojuegos_seleccionados ?? u.videojuegos ?? [],
    };
    IS_OWNER = true;
    renderPerfil();

    // Los contadores de seguidos/seguidores no están en sessionStorage — ir a la API
    (window.apiFetch || fetch)(`../../../api/users/get-profile.php?id=${encodeURIComponent(u.id)}`)
        .then(r => r.json())
        .then(data => {
            if (!data.ok || !data.user) return;
            PROFILE.seguidos   = data.user.seguidos   ?? 0;
            PROFILE.seguidores = data.user.seguidores ?? 0;
            // Actualizar counters en UI
            document.getElementById('ph-seg-own').textContent           = PROFILE.seguidos;
            document.getElementById('ph-flw-own').textContent           = PROFILE.seguidores;
            document.getElementById('fp-cnt-seguidos').textContent      = PROFILE.seguidos;
            document.getElementById('fp-cnt-seguidores').textContent    = PROFILE.seguidores;
        })
        .catch(() => {});
}

// ── CARGAR PERFIL REMOTO (desde API) ─────

async function cargarPerfilRemoto(userId) {
    try {
        const res  = await (window.apiFetch || fetch)(`../../../api/users/get-profile.php?id=${encodeURIComponent(userId)}}`);
        const data = await res.json();

        if (!data.ok || !data.user) {
            mostrarError('Perfil no encontrado.');
            return;
        }

        PROFILE  = data.user;
        IS_OWNER = USER && String(USER.id) === String(userId);
        renderPerfil();
    } catch {
        mostrarError('No se pudo cargar el perfil.');
    }
}

// ── RENDER ────────────────────────────────

function renderPerfil() {
    const u = PROFILE;

    // Foto / avatar
    const photoEl = document.getElementById('ph-photo');
    if (u.foto_url) {
        photoEl.innerHTML = `<img src="${u.foto_url}" alt="Foto de perfil">`;
    } else {
        photoEl.textContent = (u.nombre?.[0] || '?').toUpperCase();
    }

    // Datos básicos
    document.getElementById('ph-nombre').textContent   = u.nombre   || '—';
    document.getElementById('ph-usuario').textContent  = '@' + (u.usuario || '—');
    document.getElementById('ph-pronouns').textContent = u.pronouns || '';
    document.getElementById('ph-desc').textContent     = u.descripcion || '';

    document.title = `${u.nombre || u.usuario} — Trinity`;

    if (IS_OWNER) {
        renderOwner(u);
    } else {
        renderOther(u);
    }

    renderFavoritos(u);
}

function renderOwner(u) {
    document.getElementById('owner-actions').style.display = 'flex';
    document.getElementById('other-actions').style.display = 'none';
    document.getElementById('other-stats').style.display   = 'none';

    const seg = u.seguidos   ?? 0;
    const flw = u.seguidores ?? 0;
    document.getElementById('ph-seg-own').textContent = seg;
    document.getElementById('ph-flw-own').textContent = flw;
    document.getElementById('fp-cnt-seguidos').textContent   = seg;
    document.getElementById('fp-cnt-seguidores').textContent = flw;
}

function renderOther(u) {
    document.getElementById('owner-actions').style.display = 'none';
    document.getElementById('other-actions').style.display = 'flex';
    document.getElementById('other-stats').style.display   = 'block';

    const seg = u.seguidos   ?? 0;
    const flw = u.seguidores ?? 0;
    document.getElementById('ph-seg-other').textContent = seg;
    document.getElementById('ph-flw-other').textContent = flw;
    document.getElementById('fp-cnt-seguidos').textContent   = seg;
    document.getElementById('fp-cnt-seguidores').textContent = flw;

    document.getElementById('ph-torneos').textContent =
        `${u.torneos_jugados ?? 0} Torneos`;
    document.getElementById('ph-ganados').textContent =
        `${u.torneos_ganados ?? 0} Torneos ganados`;

    const btnFollow = document.getElementById('btn-follow');
    if (u.ya_sigue) {
        btnFollow.textContent = 'Siguiendo';
        btnFollow.classList.add('following');
    }
}

// ── FAVORITOS ─────────────────────────────

function renderFavoritos(u) {
    const deportes    = u.deportes_seleccionados    || [];
    const videojuegos = u.videojuegos_seleccionados || [];

    const secDep   = document.getElementById('section-deportes');
    const secVid   = document.getElementById('section-videojuegos');
    const secEmpty = document.getElementById('section-empty');
    const accDep   = document.getElementById('deportes-actions');
    const accVid   = document.getElementById('videojuegos-actions');

    // Limpiar botones de acción
    accDep.innerHTML = '';
    accVid.innerHTML = '';

    const hayDeportes    = deportes.length > 0;
    const hayVideojuegos = videojuegos.length > 0;

    secEmpty.style.display = 'none';

    if (!hayDeportes && !hayVideojuegos) {
        if (IS_OWNER) {
            // Owner sin preferencias: mostrar ambas con tarjetas "+"
            secDep.style.display = 'block';
            secVid.style.display = 'block';
            renderGrid('grid-deportes-fav',    [], SPORT_BANNERS, 'deporte');
            renderGrid('grid-videojuegos-fav', [], GAME_BANNERS,  'juego');
        } else {
            secDep.style.display   = 'none';
            secVid.style.display   = 'none';
            secEmpty.innerHTML = `<p>Este usuario todavía no configuró sus preferencias.</p>`;
            secEmpty.style.display = 'flex';
        }
        return;
    }

    // Mostrar deportes si los hay (o si es owner, para permitir agregarlos)
    if (hayDeportes || IS_OWNER) {
        secDep.style.display = 'block';
        renderGrid('grid-deportes-fav', deportes, SPORT_BANNERS, 'deporte');

        if (IS_OWNER) {
            const btnEditar = document.createElement('button');
            btnEditar.type      = 'button';
            btnEditar.className = 'btn-section-action primary';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', () => {
                abrirSelectorPreferencias('deportes', SPORT_BANNERS, deportes);
            });
            accDep.appendChild(btnEditar);
        }
    } else {
        secDep.style.display = 'none';
    }

    // Mostrar videojuegos si los hay (o si es owner, para permitir agregarlos)
    if (hayVideojuegos || IS_OWNER) {
        secVid.style.display = 'block';
        renderGrid('grid-videojuegos-fav', videojuegos, GAME_BANNERS, 'juego');

        if (IS_OWNER) {
            const btnEditar = document.createElement('button');
            btnEditar.type      = 'button';
            btnEditar.className = 'btn-section-action primary';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', () => {
                abrirSelectorPreferencias('videojuegos', GAME_BANNERS, videojuegos);
            });
            accVid.appendChild(btnEditar);
        }
    } else {
        secVid.style.display = 'none';
    }
}

function renderGrid(gridId, items, bannerMap, tipo) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    const MAX_VISIBLE = 3;
    const visible     = items.slice(0, MAX_VISIBLE);
    const extra       = items.length > MAX_VISIBLE ? items.length - MAX_VISIBLE : 0;

    visible.forEach((nombre) => {
        const banner = bannerMap[nombre] || null;
        const card   = document.createElement('div');

        if (banner) {
            card.className = 'fav-card';
            card.innerHTML = `
                <img src="${banner}" alt="${nombre}">
                ${!IS_OWNER
                    ? `<button class="btn-invite" data-nombre="${nombre}" onclick="abrirInvite('${nombre}', '${tipo}')">Invitar a torneo</button>`
                    : `<div class="fav-card-label">${nombre}</div>`
                }
            `;
        } else {
            card.className = 'fav-card';
            card.style.background      = 'var(--card-bg)';
            card.style.display         = 'flex';
            card.style.alignItems      = 'center';
            card.style.justifyContent  = 'center';
            card.style.fontSize        = '13px';
            card.style.color           = 'var(--text-muted)';
            card.textContent           = nombre;
            if (!IS_OWNER) {
                const btn = document.createElement('button');
                btn.className      = 'btn-invite';
                btn.style.position = 'absolute';
                btn.dataset.nombre = nombre;
                btn.textContent    = 'Invitar a torneo';
                btn.onclick        = () => abrirInvite(nombre, tipo);
                card.appendChild(btn);
            }
        }
        grid.appendChild(card);
    });

    if (extra > 0) {
        const stack = document.createElement('div');
        stack.className = 'fav-card-empty stacked';
        stack.innerHTML = `<div class="fav-plus">+${extra}</div>`;
        grid.appendChild(stack);
    } else if (visible.length < MAX_VISIBLE) {
        const faltantes = MAX_VISIBLE - visible.length;

        for (let i = 0; i < faltantes; i++) {
            const esStacked = i === faltantes - 1 && faltantes > 1;
            const ph = document.createElement(IS_OWNER ? 'button' : 'div');

            ph.className = esStacked ? 'fav-card-empty stacked' : 'fav-card-empty';
            ph.innerHTML = `<div class="fav-plus">+</div>`;

            if (IS_OWNER) {
                ph.type = 'button';
                const tipoEnum   = tipo === 'deporte' ? 'deportes' : 'videojuegos';
                const bannerMap2 = tipoEnum === 'deportes' ? SPORT_BANNERS : GAME_BANNERS;
                const itemsActuales = tipoEnum === 'deportes'
                    ? (PROFILE.deportes_seleccionados || [])
                    : (PROFILE.videojuegos_seleccionados || []);
                ph.addEventListener('click', () => abrirSelectorPreferencias(tipoEnum, bannerMap2, itemsActuales));
            }

            grid.appendChild(ph);
        }
    }
}

// ── SELECTOR DE PREFERENCIAS ─────────────

function abrirSelectorPreferencias(tipoEnum, bannerMap, itemsActuales) {
    openPreferencesPicker({
        tipo:      tipoEnum,
        bannerMap: bannerMap,
        selected:  itemsActuales || [],
        max:       3,
        onSave:    async (tipo, seleccion) => {
            // Determinar qué campo enviar según el tipo
            const body = tipo === 'deportes'
                ? { deportes:    seleccion }
                : { videojuegos: seleccion };

            const res  = await (window.apiFetch || fetch)('../../../api/users/update-profile.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });
            const data = await res.json();

            if (!data.ok) {
                throw new Error(data.error || 'No se pudo guardar.');
            }

            // Actualizar estado local
            if (tipo === 'deportes') {
                PROFILE.deportes_seleccionados = seleccion;
                if (USER) {
                    USER.deportes_seleccionados = seleccion;
                    USER.deportes = seleccion;
                }
            } else {
                PROFILE.videojuegos_seleccionados = seleccion;
                if (USER) {
                    USER.videojuegos_seleccionados = seleccion;
                    USER.videojuegos = seleccion;
                }
            }

            if (USER) {
                sessionStorage.setItem('trinity_user', JSON.stringify(USER));
            }

            renderFavoritos(PROFILE);
        },
    });
}

// ── FOLLOW / UNFOLLOW ─────────────────────

let _followPending = false; // flag anti-doble-click

async function toggleFollow() {
    if (!USER) {
        window.location.href = '../../login/login.html';
        return;
    }

    if (_followPending) return; // ignorar clicks mientras hay un request en vuelo
    _followPending = true;

    const btn       = document.getElementById('btn-follow');
    const siguiendo = btn.classList.contains('following');

    // Deshabilitar inmediatamente para evitar clicks fantasma
    btn.disabled = true;

    try {
        const res  = await (window.apiFetch || fetch)('../../../api/users/follow.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                target_id: PROFILE.id,
                accion:    siguiendo ? 'unfollow' : 'follow',
            }),
        });
        const data = await res.json();

        if (data.ok) {
            if (siguiendo) {
                btn.textContent = 'Seguir';
                btn.classList.remove('following');
                PROFILE.seguidores = Math.max(0, (PROFILE.seguidores || 0) - 1);
            } else {
                btn.textContent = 'Siguiendo';
                btn.classList.add('following');
                PROFILE.seguidores = (PROFILE.seguidores || 0) + 1;
            }
            const seg = PROFILE.seguidos   ?? 0;
            const flw = PROFILE.seguidores ?? 0;
            document.getElementById('ph-seg-other').textContent      = seg;
            document.getElementById('ph-flw-other').textContent      = flw;
            document.getElementById('fp-cnt-seguidos').textContent   = seg;
            document.getElementById('fp-cnt-seguidores').textContent = flw;
        }
    } catch {
        console.error('Error al seguir/dejar de seguir.');
    } finally {
        btn.disabled   = false;
        _followPending = false;
    }
}

// ── MODAL: INVITAR A TORNEO ──────────────

let inviteTarget = null;

async function abrirInvite(nombre, tipo) {
    if (!USER) {
        window.location.href = '../../login/login.html';
        return;
    }

    inviteTarget = { nombre, tipo };
    document.getElementById('modal-invitee-name').textContent = PROFILE.nombre || PROFILE.usuario;
    document.getElementById('msg-invite').textContent = '';
    document.getElementById('modal-invite').classList.add('open');

    const list = document.getElementById('modal-tournament-list');
    list.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res  = await (window.apiFetch || fetch)('../../../api/users/get-my-tournaments.php?estado=en_creacion');
        const data = await res.json();

        if (!data.ok || !data.torneos || data.torneos.length === 0) {
            list.innerHTML = `
                <div class="no-tournaments">
                    No tenés torneos en proceso de creación.<br>
                    <small>Solo podés invitar desde un torneo que estés organizando actualmente.</small>
                </div>`;
            return;
        }

        list.innerHTML = '';
        data.torneos.forEach(t => {
            const item = document.createElement('div');
            item.className = 'tournament-item';
            item.innerHTML = `
                <div class="tournament-item-info">
                    <div class="tournament-item-name">${escapeHtml(t.titulo)}</div>
                    <div class="tournament-item-meta">${escapeHtml(t.deporte || '')} · ${escapeHtml(t.estado_label || 'En creación')}</div>
                </div>
                <button class="btn-invite-send" onclick="enviarInvitacion(${t.id}, this)">
                    Invitar
                </button>`;
            list.appendChild(item);
        });
    } catch {
        list.innerHTML = `<div class="no-tournaments">No se pudo cargar los torneos. Intentá de nuevo.</div>`;
    }
}

async function enviarInvitacion(torneoId, btn) {
    if (!PROFILE || !USER) return;

    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    const msgEl = document.getElementById('msg-invite');
    msgEl.textContent = '';
    msgEl.className   = 'msg';

    try {
        const res  = await (window.apiFetch || fetch)('../../../api/tournaments/invite-tournament.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                torneo_id:   torneoId,
                invitado_id: PROFILE.id,
            }),
        });
        const data = await res.json();

        if (data.ok) {
            btn.textContent = '✓ Enviada';
            btn.classList.add('sent');
            msgEl.textContent = '✓ Invitación enviada correctamente.';
            msgEl.className   = 'msg ok';
        } else {
            btn.disabled    = false;
            btn.textContent = 'Invitar';
            msgEl.textContent = data.error || 'Error al enviar la invitación.';
            msgEl.className   = 'msg err';
        }
    } catch {
        btn.disabled    = false;
        btn.textContent = 'Invitar';
        msgEl.textContent = 'No se pudo conectar con el servidor.';
        msgEl.className   = 'msg err';
    }
}

function closeInviteModal(e) {
    if (e.target === document.getElementById('modal-invite')) {
        document.getElementById('modal-invite').classList.remove('open');
    }
}
function closeInviteModalBtn() {
    document.getElementById('modal-invite').classList.remove('open');
}

// ── NAV: manejado por /components/nav.js ──

// ── FOLLOWERS POPUP ───────────────────────

let fpOpen      = false;
let fpActiveTab = 'seguidos';
let fpCache     = { seguidos: null, seguidores: null };

function toggleFollowersPopup(triggerEl) {
    const popup = document.getElementById('followers-popup');

    if (fpOpen) {
        closeFpPopup();
        return;
    }

    // Resetear caché al abrir para siempre tener datos frescos
    fpCache = { seguidos: null, seguidores: null };
    fpActiveTab = 'seguidos';

    // Posicionar popup bajo el botón
    const rect = triggerEl.getBoundingClientRect();
    const popupW = 260;
    let left = rect.left;
    let top  = rect.bottom + 8;

    // Ajuste si se sale por la derecha
    if (left + popupW > window.innerWidth - 12) {
        left = window.innerWidth - popupW - 12;
    }
    // Ajuste si se sale por abajo
    const popupH = 300;
    if (top + popupH > window.innerHeight - 12) {
        top = rect.top - popupH - 8;
    }

    popup.style.left    = left + 'px';
    popup.style.top     = top  + 'px';
    popup.style.display = 'block';
    fpOpen = true;

    // Activar tab y cargar
    setFpTabActive('seguidos');
    loadFpList('seguidos');

    // Cerrar al click fuera
    setTimeout(() => {
        document.addEventListener('click', fpOutsideClick);
    }, 0);
}

function closeFpPopup() {
    document.getElementById('followers-popup').style.display = 'none';
    fpOpen = false;
    document.removeEventListener('click', fpOutsideClick);
}

function fpOutsideClick(e) {
    const popup   = document.getElementById('followers-popup');
    const btnOwn  = document.getElementById('ph-followers-own');
    const btnOther = document.getElementById('ph-followers-other');
    if (!popup.contains(e.target) && e.target !== btnOwn && e.target !== btnOther
        && !btnOwn?.contains(e.target) && !btnOther?.contains(e.target)) {
        closeFpPopup();
    }
}

function switchFpTab(tab) {
    if (tab === fpActiveTab) return;
    fpActiveTab = tab;
    setFpTabActive(tab);
    if (!fpCache[tab]) {
        loadFpList(tab);
    } else {
        renderFpList(fpCache[tab]);
    }
}

function setFpTabActive(tab) {
    document.querySelectorAll('.fp-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
}

async function loadFpList(tab) {
    const list = document.getElementById('fp-list');
    list.innerHTML = '<div class="fp-spinner"></div>';

    const uid = PROFILE?.id ?? TARGET_ID;
    if (!uid) {
        list.innerHTML = '<div class="fp-empty">No hay datos disponibles.</div>';
        return;
    }

    try {
        const res  = await (window.apiFetch || fetch)(
            `../../../api/users/get-followers.php?user_id=${encodeURIComponent(uid)}&tipo=${tab}`
        );
        const data = await res.json();

        if (!data.ok) throw new Error(data.error || 'Error');

        fpCache[tab] = data.users;
        renderFpList(data.users);
    } catch {
        list.innerHTML = '<div class="fp-empty">No se pudo cargar la lista.</div>';
    }
}

function renderFpList(users) {
    const list = document.getElementById('fp-list');
    list.innerHTML = '';

    if (!users || users.length === 0) {
        const label = fpActiveTab === 'seguidos' ? 'seguidos' : 'seguidores';
        list.innerHTML = `<div class="fp-empty">Sin ${label} por ahora.</div>`;
        return;
    }

    users.forEach(u => {
        const a = document.createElement('a');
        a.className = 'fp-user';
        a.href      = `view.html?u=${encodeURIComponent(u.id)}`;

        const initial = (u.nombre?.[0] || u.usuario?.[0] || '?').toUpperCase();
        const avatarInner = u.foto_url
            ? `<img src="${escapeHtml(u.foto_url)}" alt="">`
            : initial;

        a.innerHTML = `
            <div class="fp-avatar">${avatarInner}</div>
            <div class="fp-info">
                <div class="fp-name">${escapeHtml(u.nombre || u.usuario)}</div>
                <div class="fp-username">@${escapeHtml(u.usuario)}</div>
            </div>`;

        a.addEventListener('click', () => closeFpPopup());
        list.appendChild(a);
    });
}

// ── HELPERS ───────────────────────────────

function mostrarError(msg) {
    document.querySelector('.profile-content').innerHTML =
        `<div class="empty-prefs" style="display:flex;"><p>${msg}</p></div>`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}