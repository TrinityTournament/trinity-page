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
            <li><a href="${BASE_URL}/index.html">Inicio</a></li>
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
                    <a href="${BASE_URL}/pages/profile/cfg/edit.html" class="dropdown-item">&nbsp; Configuración</a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item danger" id="nav-logout-btn">↩&nbsp; Cerrar sesión</button>
                </div>
            </div>
        </div>

        <!-- MOBILE MENU -->
        <div class="mobile-menu" id="mobile-menu">
            <a href="${BASE_URL}/index.html">Inicio</a>
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

    // Cerrar dropdown al clickear fuera
    document.addEventListener('click', e => {
        const menu = document.getElementById('nav-user');
        if (menu && !menu.contains(e.target)) {
            document.getElementById('user-trigger')?.classList.remove('open');
            document.getElementById('user-dropdown')?.classList.remove('open');
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
    if (guestEl) guestEl.style.display = 'none';
    if (userEl)  userEl.classList.add('active');

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
}

function logout() {
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
        const res  = await fetch(`${BASE_URL}/api/search-users.php?q=${encodeURIComponent(q)}`);
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
