// ══════════════════════════════════════════════════════════
//  TRINITY — Panel de Administración
// ══════════════════════════════════════════════════════════

const BASE_URL = window.location.origin + '/Trinity-page';
let ADMIN_USER  = null;
let allUsuarios = [];
let allTorneos  = [];

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await verificarAdmin();
    renderAdminInfo();
    initNav();
    cargarUsuarios();
});

// ── AUTH ───────────────────────────────────────────────────
async function verificarAdmin() {
    // 1. Chequeo rápido en sessionStorage
    const stored = sessionStorage.getItem('trinity_user');
    if (!stored) return redirigirLogin();

    const u = JSON.parse(stored);
    if (u.rol !== 'admin') return redirigirLogin();

    // 2. Confirmar con el servidor que la sesión PHP sigue activa
    try {
        const res  = await fetch(`${BASE_URL}/api/auth/check-session.php`, { credentials: 'include' });
        const data = await res.json();
        if (!data.ok || data.usuario?.rol !== 'admin') return redirigirLogin();
        ADMIN_USER = data.usuario;
        sessionStorage.setItem('trinity_user', JSON.stringify(data.usuario));
    } catch {
        // Sin red: confiar en sessionStorage si ya pasó el chequeo local
        ADMIN_USER = u;
    }
}

function redirigirLogin() {
    window.location.href = `${BASE_URL}/pages/login/login.html`;
}

function renderAdminInfo() {
    if (!ADMIN_USER) return;
    const inicial = (ADMIN_USER.usuario?.[0] || ADMIN_USER.nombre?.[0] || 'A').toUpperCase();
    const avatarEl = document.getElementById('admin-avatar');
    const nameEl   = document.getElementById('admin-name');
    if (avatarEl) {
        avatarEl.innerHTML = ADMIN_USER.foto_url
            ? `<img src="${ADMIN_USER.foto_url}" alt="">`
            : inicial;
    }
    if (nameEl) nameEl.textContent = ADMIN_USER.usuario || ADMIN_USER.nombre;
}

// ── NAVEGACIÓN LATERAL ─────────────────────────────────────
function initNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = btn.dataset.section;
            switchSection(sec);
        });
    });
}

function switchSection(nombre) {
    document.querySelectorAll('.nav-item').forEach(b =>
        b.classList.toggle('active', b.dataset.section === nombre));
    document.querySelectorAll('.section').forEach(s =>
        s.classList.toggle('active', s.id === `section-${nombre}`));

    if (nombre === 'torneos' && allTorneos.length === 0) cargarTorneos();
}

// ── SECCIÓN: USUARIOS ──────────────────────────────────────
async function cargarUsuarios() {
    try {
        const res  = await fetch(`${BASE_URL}/api/admin/usuarios.php`, { credentials: 'include' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        allUsuarios = data.usuarios;
        document.getElementById('usuarios-count').textContent =
            `${allUsuarios.length} usuario${allUsuarios.length !== 1 ? 's' : ''} registrado${allUsuarios.length !== 1 ? 's' : ''}`;

        renderUsuarios(allUsuarios);
        initUsuarioSearch();
    } catch (e) {
        document.getElementById('usuarios-tbody').innerHTML =
            `<tr><td colspan="5" class="table-loading">Error al cargar usuarios.</td></tr>`;
    }
}

function renderUsuarios(lista) {
    const tbody = document.getElementById('usuarios-tbody');
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-loading">Sin usuarios.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(u => {
        const inicial  = (u.nombre?.[0] || u.usuario?.[0] || '?').toUpperCase();
        const avatar   = u.foto_url
            ? `<div class="user-cell-avatar"><img src="${esc(u.foto_url)}" alt=""></div>`
            : `<div class="user-cell-avatar">${inicial}</div>`;
        const fecha    = u.creado_en ? formatFecha(u.creado_en) : '—';
        const esYo     = ADMIN_USER && u.id === ADMIN_USER.id;

        return `
        <tr>
            <td>
                <div class="user-cell">
                    ${avatar}
                    <div>
                        <div class="user-cell-name">${esc(u.nombre || u.usuario)}</div>
                        <div class="user-cell-user">@${esc(u.usuario)}</div>
                    </div>
                </div>
            </td>
            <td>${esc(u.email || '—')}</td>
            <td>
                <select class="rol-select" data-id="${u.id}" onchange="cambiarRol(this)"
                    ${esYo ? 'disabled title="No podés cambiar tu propio rol"' : ''}>
                    <option value="participante" ${u.rol === 'participante' ? 'selected' : ''}>Participante</option>
                    <option value="organizador"  ${u.rol === 'organizador'  ? 'selected' : ''}>Organizador</option>
                    <option value="admin"        ${u.rol === 'admin'        ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>${u.torneos_jugados ?? 0} / ${u.torneos_ganados ?? 0}</td>
            <td>${fecha}</td>
        </tr>`;
    }).join('');
}

async function cambiarRol(select) {
    const id  = parseInt(select.dataset.id);
    const rol = select.value;
    const prev = [...select.options].find(o => o.selected)?.value;

    select.classList.add('saving');

    try {
        const res  = await fetch(`${BASE_URL}/api/admin/usuarios.php`, {
            method:      'PATCH',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ id, rol }),
        });
        const data = await res.json();

        if (data.ok) {
            // Actualizar en el array local
            const u = allUsuarios.find(u => u.id === id);
            if (u) u.rol = rol;
            toast(`Rol actualizado a "${rolLabel(rol)}"`, 'ok');
        } else {
            select.value = prev;
            toast(data.error || 'No se pudo actualizar el rol.', 'error');
        }
    } catch {
        select.value = prev;
        toast('Error de conexión.', 'error');
    } finally {
        select.classList.remove('saving');
    }
}

function initUsuarioSearch() {
    document.getElementById('usuarios-search').addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) { renderUsuarios(allUsuarios); return; }
        const filtrados = allUsuarios.filter(u =>
            u.nombre?.toLowerCase().includes(q) ||
            u.usuario?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
        renderUsuarios(filtrados);
    });
}

// ── SECCIÓN: TORNEOS ───────────────────────────────────────
async function cargarTorneos() {
    try {
        const res  = await fetch(`${BASE_URL}/api/tournaments/get-all-tournaments.php`, { credentials: 'include' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        allTorneos = data.torneos;
        document.getElementById('torneos-count').textContent =
            `${allTorneos.length} torneo${allTorneos.length !== 1 ? 's' : ''} en total`;

        renderTorneos(allTorneos);
        initTorneoFilter();
    } catch {
        document.getElementById('torneos-tbody').innerHTML =
            `<tr><td colspan="6" class="table-loading">Error al cargar torneos.</td></tr>`;
    }
}

function renderTorneos(lista) {
    const tbody = document.getElementById('torneos-tbody');
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-loading">Sin torneos.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(t => `
        <tr>
            <td><strong>${esc(t.titulo)}</strong></td>
            <td>${esc(t.deporte || '—')}</td>
            <td><span class="badge badge-${t.estado}">${esc(t.estado_label)}</span></td>
            <td>
                <div class="user-cell-name">${esc(t.organizador_nombre || '—')}</div>
                <div class="user-cell-user">@${esc(t.organizador_usuario || '')}</div>
            </td>
            <td>${t.fecha_inicio ? formatFecha(t.fecha_inicio) : '—'}</td>
            <td style="text-align:center">${t.max_participantes ?? '—'}</td>
        </tr>`
    ).join('');
}

function initTorneoFilter() {
    document.getElementById('torneos-filter').addEventListener('change', e => {
        const estado = e.target.value;
        const filtrados = estado
            ? allTorneos.filter(t => t.estado === estado)
            : allTorneos;
        renderTorneos(filtrados);
    });
}

// ── HELPERS ────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatFecha(str) {
    const d = new Date(str.replace(' ', 'T'));
    return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function rolLabel(rol) {
    return { admin: 'Admin', organizador: 'Organizador', participante: 'Participante' }[rol] ?? rol;
}

let toastTimer = null;
function toast(msg, tipo = 'ok') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = `toast toast-${tipo} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}