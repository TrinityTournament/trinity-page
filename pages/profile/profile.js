// ══════════════════════════════════════════
//  TRINITY — PERFIL v1
// ══════════════════════════════════════════

let USER = null;
let tipoActual = null;

// ── INIT ──────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('astrax_user');
    if (!raw) {
        window.location.href = '/astrax-page/pages/login/login.html';
        return;
    }

    USER = JSON.parse(raw);
    cargarDatos();
});

function cargarDatos() {
    // Header
    document.getElementById('ph-avatar').textContent  = (USER.nombre?.[0] || '?').toUpperCase();
    document.getElementById('ph-nombre').textContent  = USER.nombre   || '—';
    document.getElementById('ph-usuario').textContent = '@' + (USER.usuario || '—');
    document.getElementById('ph-email').textContent   = USER.email    || USER.telefono || '—';

    // Tab perfil
    document.getElementById('p-nombre').value   = USER.nombre   || '';
    document.getElementById('p-usuario').value  = USER.usuario  || '';
    document.getElementById('p-fecha').value    = USER.fecha_nacimiento || '';
    document.getElementById('p-email').value    = USER.email    || '';
    document.getElementById('p-telefono').value = USER.telefono || '';

    // Tab cuenta
    document.getElementById('c-nombre').value   = USER.nombre  || '';
    document.getElementById('c-usuario').value  = USER.usuario || '';

    // Tab deportes
    tipoActual = USER.tipo || null;
    if (tipoActual) {
        seleccionarTipo(tipoActual, false);
    }

    // Marcar deportes guardados
    const deportesGuardados = USER.deportes || [];
    document.querySelectorAll('.deporte-item input[type="checkbox"]').forEach(cb => {
        if (deportesGuardados.includes(cb.value)) {
            cb.checked = true;
            cb.closest('.deporte-item').classList.add('checked');
        }
    });

    // Eventos checkboxes
    document.querySelectorAll('.deporte-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('.deporte-item').classList.toggle('checked', cb.checked);
        });
    });
}

// ── TABS ──────────────────────────────────

function cambiarTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    btn.classList.add('active');
}

// ── TIPO DE JUGADOR ───────────────────────

function seleccionarTipo(tipo, resetCheckboxes = true) {
    tipoActual = tipo;

    document.getElementById('tipo-deportes').classList.toggle('active',    tipo === 'deportes');
    document.getElementById('tipo-videojuegos').classList.toggle('active', tipo === 'videojuegos');

    document.getElementById('panel-deportes-clasicos').style.display = tipo === 'deportes'    ? 'flex' : 'none';
    document.getElementById('panel-videojuegos').style.display       = tipo === 'videojuegos' ? 'flex' : 'none';

    if (resetCheckboxes) {
        document.querySelectorAll('.deporte-item input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.deporte-item').classList.remove('checked');
        });
    }
}

// ── GUARDAR PERFIL ────────────────────────

async function guardarPerfil() {
    const nombre  = document.getElementById('p-nombre').value.trim();
    const usuario = document.getElementById('p-usuario').value.trim();
    const fecha   = document.getElementById('p-fecha').value;
    const msg     = document.getElementById('msg-perfil');

    if (!nombre || !usuario) {
        mostrarMsg(msg, 'Completá nombre y usuario.', 'err'); return;
    }

    // Solo letras, números y espacios en el nombre (sin caracteres especiales)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/.test(nombre)) {
        mostrarMsg(msg, 'El nombre solo puede contener letras, números y espacios.', 'err'); return;
    }

    // Usuario: solo letras y números, sin espacios ni especiales
    if (!/^[a-zA-Z0-9]+$/.test(usuario)) {
        mostrarMsg(msg, 'El usuario solo puede contener letras y números, sin espacios ni caracteres especiales.', 'err'); return;
    }

    try {
        const res  = await fetch('/astrax-page/api/update-profile.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, usuario, fecha_nacimiento: fecha }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.nombre  = nombre;
            USER.usuario = usuario;
            USER.fecha_nacimiento = fecha;
            sessionStorage.setItem('astrax_user', JSON.stringify(USER));
            cargarDatos();
            mostrarMsg(msg, '✓ Perfil actualizado.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al guardar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── GUARDAR CUENTA ────────────────────────

async function guardarCuenta() {
    const nombre  = document.getElementById('c-nombre').value.trim();
    const usuario = document.getElementById('c-usuario').value.trim();
    const msg     = document.getElementById('msg-cuenta');

    if (!nombre || !usuario) {
        mostrarMsg(msg, 'Completá todos los campos.', 'err'); return;
    }

    // Solo letras, números y espacios en el nombre
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/.test(nombre)) {
        mostrarMsg(msg, 'El nombre solo puede contener letras, números y espacios.', 'err'); return;
    }

    // Usuario: solo letras y números, sin espacios ni especiales
    if (!/^[a-zA-Z0-9]+$/.test(usuario)) {
        mostrarMsg(msg, 'El usuario solo puede contener letras y números, sin espacios ni caracteres especiales.', 'err'); return;
    }

    try {
        const res  = await fetch('/astrax-page/api/update-profile.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, usuario }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.nombre  = nombre;
            USER.usuario = usuario;
            sessionStorage.setItem('astrax_user', JSON.stringify(USER));
            cargarDatos();
            mostrarMsg(msg, '✓ Datos actualizados.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al guardar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── GUARDAR DEPORTES ──────────────────────

async function guardarDeportes() {
    const msg = document.getElementById('msg-deportes');

    if (!tipoActual) {
        mostrarMsg(msg, 'Seleccioná un tipo de jugador primero.', 'err'); return;
    }

    const seleccionados = [...document.querySelectorAll('.deporte-item input[type="checkbox"]:checked')]
        .map(cb => cb.value);

    if (seleccionados.length === 0) {
        mostrarMsg(msg, 'Seleccioná al menos un deporte o juego.', 'err'); return;
    }

    try {
        const res  = await fetch('/astrax-page/api/update-profile.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ tipo: tipoActual, deportes: seleccionados }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.tipo     = tipoActual;
            USER.deportes = seleccionados;
            sessionStorage.setItem('astrax_user', JSON.stringify(USER));
            mostrarMsg(msg, '✓ Preferencias guardadas.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al guardar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── CAMBIAR CONTRASEÑA — PASO 1 ───────────

async function solicitarCodigoPwd() {
    const msg = document.getElementById('msg-pwd-req');

    if (!USER.email && !USER.telefono) {
        mostrarMsg(msg, 'No tenés email ni teléfono registrado.', 'err'); return;
    }

    mostrarMsg(msg, 'Enviando código...', 'ok');

    try {
        const res  = await fetch('/astrax-page/api/send-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email: USER.email, cambio_password: true }),
        });
        const data = await res.json();

        if (data.ok) {
            mostrarMsg(msg, '✓ Código enviado. Revisá tu correo.', 'ok');
            document.getElementById('pwd-paso1').style.display = 'none';
            document.getElementById('pwd-paso2').style.display = 'block';
        } else {
            mostrarMsg(msg, data.error || 'Error al enviar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── CAMBIAR CONTRASEÑA — PASO 2 ───────────

async function cambiarPassword() {
    const codigo   = [...document.querySelectorAll('#otp-pwd input')].map(i => i.value).join('');
    const nueva    = document.getElementById('pwd-nueva').value;
    const confirm  = document.getElementById('pwd-confirm').value;
    const msg      = document.getElementById('msg-pwd');

    if (codigo.length < 6)   { mostrarMsg(msg, 'Ingresá el código completo.', 'err'); return; }
    if (!nueva || !confirm)   { mostrarMsg(msg, 'Completá los campos de contraseña.', 'err'); return; }
    if (nueva !== confirm)    { mostrarMsg(msg, 'Las contraseñas no coinciden.', 'err'); return; }
    if (nueva.length < 6)     { mostrarMsg(msg, 'Mínimo 6 caracteres.', 'err'); return; }

    try {
        const res  = await fetch('/astrax-page/api/change-password.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email: USER.email, code: codigo, nueva_password: nueva }),
        });
        const data = await res.json();

        if (data.ok) {
            mostrarMsg(msg, '✓ Contraseña actualizada. Iniciá sesión nuevamente.', 'ok');
            setTimeout(() => {
                sessionStorage.removeItem('astrax_user');
                window.location.href = '/astrax-page/pages/login/login.html';
            }, 2000);
        } else {
            mostrarMsg(msg, data.error || 'Código incorrecto.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

function resetPwd() {
    document.getElementById('pwd-paso1').style.display = 'block';
    document.getElementById('pwd-paso2').style.display = 'none';
    document.querySelectorAll('#otp-pwd input').forEach(i => { i.value = ''; i.classList.remove('filled'); });
    document.getElementById('pwd-nueva').value   = '';
    document.getElementById('pwd-confirm').value = '';
    document.getElementById('msg-pwd-req').textContent = '';
    document.getElementById('msg-pwd').textContent = '';
}

// ── OTP ───────────────────────────────────

function otpNext(input, groupId) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value) {
        input.classList.add('filled');
        const inputs = [...document.querySelectorAll(`#${groupId} input`)];
        const idx    = inputs.indexOf(input);
        if (idx < inputs.length - 1) inputs[idx + 1].focus();
    } else {
        input.classList.remove('filled');
    }
}

function otpBack(event, input, groupId) {
    if (event.key === 'Backspace' && !input.value) {
        const inputs = [...document.querySelectorAll(`#${groupId} input`)];
        const idx    = inputs.indexOf(input);
        if (idx > 0) inputs[idx - 1].focus();
    }
}

// ── ELIMINAR CUENTA ───────────────────────

async function confirmarEliminar() {
    if (!confirm('¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) return;

    try {
        const res  = await fetch('/astrax-page/api/delete-account.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (data.ok) {
            sessionStorage.removeItem('astrax_user');
            window.location.href = '/astrax-page/index.html';
        } else {
            alert(data.error || 'Error al eliminar la cuenta.');
        }
    } catch {
        alert('No se pudo conectar con el servidor.');
    }
}

// ── LOGOUT ────────────────────────────────

function logout() {
    sessionStorage.removeItem('astrax_user');
    window.location.href = '/astrax-page/index.html';
}

// ── HELPER MSG ────────────────────────────

function mostrarMsg(el, texto, tipo) {
    el.textContent = texto;
    el.className   = 'msg ' + tipo;
    if (tipo === 'ok') setTimeout(() => el.textContent = '', 3500);
}
