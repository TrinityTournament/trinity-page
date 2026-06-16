// ══════════════════════════════════════════
//  TRINITY — Nav compartido
//  Inyecta el nav en todas las páginas.
//  Para migrar de servidor: cambiá solo BASE_URL.
// ══════════════════════════════════════════

const BASE_URL = '/Trinity-page';

// ── INYECTAR NAV ──────────────────────────

(function injectNav() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
        <a href="${BASE_URL}/index.html" class="nav-logo">TRINITY</a>

        <button class="hamburger" id="hamburger">
            <span></span><span></span><span></span>
        </button>

        <ul class="nav-links">
            <li><a href="${BASE_URL}/pages/nav/tournament/tournament.html">Torneos</a></li>
            <li><a href="${BASE_URL}/pages/nav/ranking/ranking.html">Rankings</a></li>
            <li><a href="${BASE_URL}/pages/nav/news/news.html">Noticias</a></li>
            <li><a href="${BASE_URL}/pages/nav/contact/contact.html">Contacto</a></li>
        </ul>

        <div class="nav-actions">

            <!-- BUSCADOR DE USUARIOS -->
            <div class="nav-search" id="nav-search">
                <div class="nav-search-input-wrap">
                    <svg class="nav-search-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                    <input
                        type="text"
                        id="nav-search-input"
                        class="nav-search-input"
                        placeholder="Buscar usuarios..."
                        autocomplete="off"
                    >
                </div>
                <div class="nav-search-results" id="nav-search-results"></div>
            </div>

            <!-- GUEST -->
            <div id="nav-guest">
                <a href="${BASE_URL}/pages/login/login.html" class="btn-login">Iniciar sesión</a>
                <a href="${BASE_URL}/pages/login/login.html?m=register" class="btn-register">Registrarse</a>
            </div>

            <!-- CAMPANA DE NOTIFICACIONES (solo para usuarios logueados) -->
            <div class="notif-menu" id="notif-menu">
                <button class="notif-trigger" id="notif-trigger" aria-label="Notificaciones">
                    <svg class="notif-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="notif-badge" id="notif-badge" style="display:none;">0</span>
                </button>
                <div class="notif-dropdown" id="notif-dropdown">
                    <div class="notif-dropdown-header">
                        <span>Notificaciones</span>
                        <button class="notif-mark-all" id="notif-mark-all">Marcar todas como leídas</button>
                    </div>
                    <div class="notif-list" id="notif-list">
                        <div class="notif-empty">No tenés notificaciones.</div>
                    </div>
                </div>
            </div>

            <!-- USER LOGUEADO -->
            <div class="user-menu" id="nav-user">
                <div class="user-trigger" id="user-trigger">
                    <div class="user-avatar" id="nav-avatar">?</div>
                    <span class="user-name" id="nav-username">Usuario</span>
                    <span class="user-chevron">▼</span>
                </div>
                <div class="user-dropdown" id="user-dropdown">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar" id="dropdown-avatar">?</div>
                        <span class="dropdown-username" id="dropdown-username">Usuario</span>
                    </div>
                    <a href="${BASE_URL}/pages/profile/acc/view.html" class="dropdown-item">&nbsp; Perfil</a>
                    <a href="${BASE_URL}/pages/admin/index.html" class="dropdown-item dropdown-item--admin" id="nav-admin-link" style="display:none;">&nbsp; Admin</a>
                    <a href="${BASE_URL}/pages/profile/cfg/edit.html" class="dropdown-item">&nbsp; Configuración</a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item danger" id="nav-logout-btn">↩&nbsp; Cerrar sesión</button>
                </div>
            </div>
        </div>

        <!-- MOBILE MENU -->
        <div class="mobile-menu" id="mobile-menu">
            <a href="${BASE_URL}/pages/nav/tournament/tournament.html">Torneos</a>
            <a href="${BASE_URL}/pages/nav/ranking/ranking.html">Rankings</a>
            <a href="${BASE_URL}/pages/nav/news/news.html">Noticias</a>
            <a href="${BASE_URL}/pages/nav/contact/contact.html">Contacto</a>
            <div class="mobile-auth">
                <a href="${BASE_URL}/pages/login/login.html" class="btn-login">Iniciar sesión</a>
                <a href="${BASE_URL}/pages/login/login.html?m=register" class="btn-register">Registrarse</a>
            </div>
        </div>
    `;

    // Insertar al inicio del body
    document.body.insertBefore(nav, document.body.firstChild);

    // Eventos
    document.getElementById('hamburger').addEventListener('click', toggleHamburger);
    document.getElementById('user-trigger').addEventListener('click', toggleDropdown);
    document.getElementById('nav-logout-btn').addEventListener('click', logout);
    document.getElementById('notif-trigger').addEventListener('click', toggleNotifDropdown);
    document.getElementById('notif-mark-all').addEventListener('click', marcarTodasLeidas);

    // Cerrar dropdown al clickear fuera
    document.addEventListener('click', e => {
        const menu = document.getElementById('nav-user');
        if (menu && !menu.contains(e.target)) {
            document.getElementById('user-trigger')?.classList.remove('open');
            document.getElementById('user-dropdown')?.classList.remove('open');
        }
        // Cerrar campana al clickear fuera
        const notif = document.getElementById('notif-menu');
        if (notif && !notif.contains(e.target)) {
            document.getElementById('notif-dropdown')?.classList.remove('open');
            document.getElementById('notif-trigger')?.classList.remove('open');
        }
        // Cerrar buscador al clickear fuera
        const search = document.getElementById('nav-search');
        if (search && !search.contains(e.target)) {
            document.getElementById('nav-search-results').classList.remove('open');
        }
    });

    // Cerrar hamburger al clickear fuera
    document.addEventListener('click', e => {
        const ham  = document.getElementById('hamburger');
        const menu = document.getElementById('mobile-menu');
        if (ham && menu && !ham.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    // Restaurar sesión
    const saved = sessionStorage.getItem('trinity_user');
    if (saved) {
        try { setNavLoggedIn(JSON.parse(saved)); } catch {}
    }

    // Buscador
    initSearch();
})();

// ── AUTH ──────────────────────────────────

function setNavLoggedIn(u) {
    const guestEl = document.getElementById('nav-guest');
    const userEl  = document.getElementById('nav-user');
    const notifEl = document.getElementById('notif-menu');
    if (guestEl) guestEl.style.display = 'none';
    if (userEl)  userEl.classList.add('active');
    if (notifEl) notifEl.classList.add('active');

    const letra = (u.usuario?.[0] || u.nombre?.[0] || '?').toUpperCase();

    const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setTxt('nav-username',      u.usuario || u.nombre);
    setTxt('dropdown-username', u.usuario || u.nombre);

    const navAvatar      = document.getElementById('nav-avatar');
    const dropdownAvatar = document.getElementById('dropdown-avatar');
    if (u.foto_url) {
        if (navAvatar)      navAvatar.innerHTML      = `<img src="${u.foto_url}" alt="Foto">`;
        if (dropdownAvatar) dropdownAvatar.innerHTML = `<img src="${u.foto_url}" alt="Foto">`;
    } else {
        if (navAvatar)      navAvatar.textContent      = letra;
        if (dropdownAvatar) dropdownAvatar.textContent = letra;
    }

    // Mostrar link de Admin solo si el usuario tiene rol admin
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = u.rol === 'admin' ? '' : 'none';

    // Iniciar polling de notificaciones
    iniciarPollingNotifs();
}

function logout() {
    detenerPollingNotifs();
    sessionStorage.removeItem('trinity_user');
    window.location.href = `${BASE_URL}/index.html`;
}

function toggleDropdown() {
    document.getElementById('user-trigger').classList.toggle('open');
    document.getElementById('user-dropdown').classList.toggle('open');
}

function toggleHamburger() {
    document.getElementById('mobile-menu').classList.toggle('open');
}

// ── BUSCADOR DE USUARIOS ──────────────────

function initSearch() {
    const input   = document.getElementById('nav-search-input');
    const results = document.getElementById('nav-search-results');
    let   timer   = null;

    input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim();

        if (q.length < 2) {
            results.classList.remove('open');
            results.innerHTML = '';
            return;
        }

        // Pequeño delay para no disparar en cada tecla
        timer = setTimeout(() => buscarUsuarios(q), 280);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            results.classList.add('open');
        }
    });
}

async function buscarUsuarios(q) {
    const results = document.getElementById('nav-search-results');
    results.innerHTML = `<div class="search-loading">Buscando...</div>`;
    results.classList.add('open');

    try {
        const res  = await fetch(`${BASE_URL}/api/users/search-users.php?q=${encodeURIComponent(q)}`);
        const data = await res.json();

        if (!data.ok || !data.users || data.users.length === 0) {
            results.innerHTML = `<div class="search-empty">Sin resultados para "<strong>${escapeHtml(q)}</strong>"</div>`;
            return;
        }

        results.innerHTML = data.users.map(u => {
            const letra  = (u.usuario?.[0] || u.nombre?.[0] || '?').toUpperCase();
            const avatar = u.foto_url
                ? `<img src="${u.foto_url}" alt="${escapeHtml(u.nombre)}">`
                : `<span>${letra}</span>`;
            return `
                <a class="search-result-item" href="${BASE_URL}/pages/profile/acc/view.html?u=${u.id}">
                    <div class="search-result-avatar">${avatar}</div>
                    <div class="search-result-info">
                        <div class="search-result-name">${escapeHtml(u.nombre)}</div>
                        <div class="search-result-user">@${escapeHtml(u.usuario)}</div>
                    </div>
                </a>
            `;
        }).join('');

    } catch {
        results.innerHTML = `<div class="search-empty">No se pudo conectar.</div>`;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── NOTIFICACIONES ────────────────────────

let _notifPollInterval = null;
let _notifCache        = [];
let _notifPrevNoLeidas = 0;   // para detectar notificaciones nuevas entre polls
let _browserNotifAsked = false; // para pedir permiso solo una vez

function iniciarPollingNotifs() {
    // Pedir permiso de notificaciones del navegador (una sola vez)
    pedirPermisoBrowserNotif();

    // Fetch inmediato, luego cada 20 s
    fetchNotifCount();
    if (_notifPollInterval) clearInterval(_notifPollInterval);
    _notifPollInterval = setInterval(fetchNotifCount, 20000);
}

function detenerPollingNotifs() {
    if (_notifPollInterval) {
        clearInterval(_notifPollInterval);
        _notifPollInterval = null;
    }
    _notifPrevNoLeidas = 0;
}

function pedirPermisoBrowserNotif() {
    if (_browserNotifAsked) return;
    _browserNotifAsked = true;

    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        // Pedimos permiso con un pequeño delay para no interrumpir el login
        setTimeout(() => {
            Notification.requestPermission().catch(() => {});
        }, 3000);
    }
}

function dispararBrowserNotif(titulo, mensaje) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        const n = new Notification(`🔔 TRINITY — ${titulo}`, {
            body: mensaje,
            icon: `${BASE_URL}/assets/pageicon.png`,
        });
        // Cerrar automáticamente a los 6 segundos
        setTimeout(() => n.close(), 6000);
        // Al hacer click, enfocar la pestaña
        n.onclick = () => { window.focus(); n.close(); };
    } catch {}
}

async function fetchNotifCount() {
    try {
        const res  = await fetch(`${BASE_URL}/api/notifications/get-notifications.php?limit=20`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.ok) return;

        const nuevas        = data.notificaciones || [];
        const noLeidas      = data.no_leidas || 0;

        // Detectar si llegaron notificaciones nuevas comparando IDs del cache anterior
        const idsViejos = new Set(_notifCache.map(n => n.id));
        const llegaron  = nuevas.filter(n => !idsViejos.has(n.id) && !n.leido);

        // Disparar notificación del navegador por cada una nueva
        llegaron.forEach(n => dispararBrowserNotif(n.titulo, n.mensaje));

        // Actualizar cache
        _notifCache = nuevas;
        _notifPrevNoLeidas = noLeidas;

        actualizarBadge(noLeidas);

        // Refrescar la lista siempre si el dropdown está abierto
        if (document.getElementById('notif-dropdown')?.classList.contains('open')) {
            renderNotifList(_notifCache);
        }
    } catch {}
}

function actualizarBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    const trigger  = document.getElementById('notif-trigger');
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');

    // Cerrar user-dropdown si estuviera abierto
    document.getElementById('user-trigger')?.classList.remove('open');
    document.getElementById('user-dropdown')?.classList.remove('open');

    if (isOpen) {
        dropdown.classList.remove('open');
        trigger?.classList.remove('open');
    } else {
        dropdown.classList.add('open');
        trigger?.classList.add('open');
        renderNotifList(_notifCache);
        fetchNotifCount(); // refrescar al abrir
    }
}

function renderNotifList(notifs) {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (!notifs || notifs.length === 0) {
        list.innerHTML = '<div class="notif-empty">No tenés notificaciones.</div>';
        return;
    }

    list.innerHTML = notifs.map(n => {
        const icon  = notifIcon(n.tipo);
        const time  = notifRelTime(n.creado_en);
        const unread = !n.leido ? 'notif-item--unread' : '';
        const link  = n.link ? `href="${BASE_URL}${n.link}"` : 'href="#"';
        return `
            <a class="notif-item ${unread}" ${link}
               data-id="${n.id}" onclick="handleNotifClick(event,this)">
                <div class="notif-icon">${icon}</div>
                <div class="notif-info">
                    <div class="notif-title">${escapeHtml(n.titulo)}</div>
                    <div class="notif-msg">${escapeHtml(n.mensaje)}</div>
                    <div class="notif-time">${time}</div>
                </div>
                ${!n.leido ? '<span class="notif-dot"></span>' : ''}
            </a>
        `;
    }).join('');
}

async function handleNotifClick(e, el) {
    const id  = parseInt(el.dataset.id, 10);
    const href = el.getAttribute('href');

    // Marcar como leída
    if (el.classList.contains('notif-item--unread')) {
        el.classList.remove('notif-item--unread');
        el.querySelector('.notif-dot')?.remove();
        // Actualizar cache local
        const n = _notifCache.find(x => x.id === id);
        if (n) n.leido = true;
        const noLeidas = _notifCache.filter(x => !x.leido).length;
        actualizarBadge(noLeidas);
        // Persistir en servidor (fire & forget)
        fetch(`${BASE_URL}/api/notifications/mark-notifications-read.php`, {
            method:      'POST',
            credentials: 'include',
            headers:     {'Content-Type': 'application/json'},
            body:         JSON.stringify({ id }),
        }).catch(() => {});
    }

    // Navegar si tiene link válido
    if (href && href !== '#' && !href.endsWith('#')) {
        e.preventDefault();
        document.getElementById('notif-dropdown')?.classList.remove('open');
        document.getElementById('notif-trigger')?.classList.remove('open');
        window.location.href = href;
    }
}

async function marcarTodasLeidas() {
    try {
        await fetch(`${BASE_URL}/api/notifications/mark-notifications-read.php`, {
            method:      'POST',
            credentials: 'include',
            headers:     {'Content-Type': 'application/json'},
            body:        JSON.stringify({ all: true }),
        });
    } catch {}

    // Actualizar UI localmente
    _notifCache.forEach(n => { n.leido = true; });
    actualizarBadge(0);
    renderNotifList(_notifCache);
}

function notifIcon(tipo) {
    const icons = {
        seguidor:          '👤',
        torneo_invitacion: '🏆',
        torneo_anuncio:    '📢',
        general:           '🔔',
    };
    return icons[tipo] || '🔔';
}

function notifRelTime(isoString) {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60)   return 'Ahora mismo';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
}