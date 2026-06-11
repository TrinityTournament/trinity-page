// ══════════════════════════════════════════
//  TRINITY — EDITAR PERFIL v2
// ══════════════════════════════════════════

let USER = null;
let pendingPhone = ''; // número completo que espera verificación
let pendingPwdDestino = 'email'; // 'email' o 'telefono' — a dónde se envió el código de cambio de contraseña

// ── INIT ──────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('trinity_user');
    if (!raw) {
        window.location.href = '../../login/login.html';
        return;
    }

    USER = JSON.parse(raw);
    initNav();
    cargarDatos();
});

function cargarDatos() {
    // Preview card izquierda
    actualizarFotoPreview();
    document.getElementById('e-nombre').value      = USER.nombre      || '';
    document.getElementById('e-usuario').value     = USER.usuario     || '';
    document.getElementById('e-pronouns').value    = USER.pronouns    || '';
    document.getElementById('e-descripcion').value = USER.descripcion || '';

    // Credenciales
    document.getElementById('c-email').value    = USER.email    || '';
    document.getElementById('c-telefono').value = USER.telefono
        ? quitarPrefijo(USER.telefono)
        : '';

    // Selector "Enviar código a" — ocultar opciones no disponibles
    configurarDestinoPwd();
}

function configurarDestinoPwd() {
    const select = document.getElementById('pwd-destino');
    if (!select) return;

    const optEmail = select.querySelector('option[value="email"]');
    const optTel   = select.querySelector('option[value="telefono"]');

    if (optEmail) optEmail.disabled = !USER.email;
    if (optTel)   optTel.disabled   = !USER.telefono;

    // Seleccionar por defecto la primera opción disponible
    if (USER.email) {
        select.value = 'email';
    } else if (USER.telefono) {
        select.value = 'telefono';
    }

    // Si no hay ninguna forma de contacto, ocultar el selector entero
    const wrap = document.getElementById('pwd-destino-wrap');
    if (wrap) wrap.style.display = (USER.email || USER.telefono) ? '' : 'none';
}

function actualizarFotoPreview() {
    pintarAvatares(USER.foto_url);
}

// Pinta la misma imagen (o letra) en TODOS los avatares de la página:
// preview grande, avatar de nav y avatar del dropdown.
function pintarAvatares(fotoUrl) {
    const letra = (USER.usuario?.[0] || USER.nombre?.[0] || '?').toUpperCase();
    const ids = ['prev-photo', 'nav-avatar', 'dropdown-avatar'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (fotoUrl) {
            el.innerHTML = `<img src="${fotoUrl}" alt="Foto">`;
        } else {
            el.textContent = letra;
        }
    });
}

// ── PREVISUALIZAR FOTO ────────────────────

function previewPhoto(input) {
    const file = input.files?.[0];
    if (!file) return;

    openCropper(file, (blob, dataUrl) => {
        // Actualiza preview, nav y dropdown con la misma foto recortada
        pintarAvatares(dataUrl);
        // Sube la foto recortada al servidor y la guarda en USER
        subirFotoPerfil(dataUrl);
    });

    // Limpiar el input para poder volver a seleccionar el mismo archivo
    input.value = '';
}

// ── SUBIR FOTO DE PERFIL ───────────────────

async function subirFotoPerfil(dataUrl) {
    const msg = document.getElementById('msg-perfil');
    mostrarMsg(msg, 'Subiendo foto...', 'ok');

    try {
        const res  = await fetch('../../../api/update-profile.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ foto_url: dataUrl }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.foto_url = dataUrl;
            sessionStorage.setItem('trinity_user', JSON.stringify(USER));
            mostrarMsg(msg, '✓ Foto de perfil actualizada.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'No se pudo guardar la foto.', 'err');
            // Revertir preview si falló
            pintarAvatares(USER.foto_url || null);
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
        pintarAvatares(USER.foto_url || null);
    }
}

// ── GUARDAR PERFIL (info básica) ──────────

async function guardarPerfil() {
    const nombre      = document.getElementById('e-nombre').value.trim();
    const usuario     = document.getElementById('e-usuario').value.trim();
    const pronouns    = document.getElementById('e-pronouns').value;
    const descripcion = document.getElementById('e-descripcion').value.trim();
    const msg         = document.getElementById('msg-perfil');

    if (!nombre || !usuario) {
        mostrarMsg(msg, 'Completá nombre y usuario.', 'err'); return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/.test(nombre)) {
        mostrarMsg(msg, 'El nombre solo puede contener letras, números y espacios.', 'err'); return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(usuario)) {
        mostrarMsg(msg, 'El usuario solo puede contener letras y números.', 'err'); return;
    }

    mostrarMsg(msg, 'Guardando...', 'ok');

    try {
        const res  = await fetch('../../../api/update-profile.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, usuario, pronouns, descripcion }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.nombre      = nombre;
            USER.usuario     = usuario;
            USER.pronouns    = pronouns;
            USER.descripcion = descripcion;
            sessionStorage.setItem('trinity_user', JSON.stringify(USER));
            initNav();
            mostrarMsg(msg, '✓ Perfil actualizado.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al guardar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── GUARDAR CREDENCIALES ──────────────────

async function guardarCredenciales() {
    const email    = document.getElementById('c-email').value.trim();
    const prefix   = document.getElementById('c-prefix').value;
    const telLocal = document.getElementById('c-telefono').value.trim().replace(/\s/g, '');
    const msg      = document.getElementById('msg-cred');

    const emailInput = document.getElementById('c-email');
    const telInput   = document.getElementById('c-telefono');

    emailInput.classList.remove('input-error', 'input-ok');
    telInput.classList.remove('input-error', 'input-ok');

    let cambioEmail = email && email !== (USER.email || '');
    let cambioTel   = telLocal && (prefix + telLocal) !== (USER.telefono || '');

    if (!cambioEmail && !cambioTel) {
        mostrarMsg(msg, 'No hay cambios para guardar.', 'err'); return;
    }

    // ── Validar y guardar email ──
    if (cambioEmail) {
        if (!validarEmail(email)) {
            emailInput.classList.add('input-error');
            mostrarMsg(msg, 'El email no tiene un formato válido.', 'err'); return;
        }

        mostrarMsg(msg, 'Verificando email...', 'ok');
        try {
            const res  = await fetch('../../../api/check-email.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!data.ok) {
                emailInput.classList.add('input-error');
                mostrarMsg(msg, data.error || 'Email ya en uso.', 'err'); return;
            }

            // Email disponible: guardar
            const res2  = await fetch('../../../api/update-credentials.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            const data2 = await res2.json();

            if (data2.ok) {
                USER.email = email;
                sessionStorage.setItem('trinity_user', JSON.stringify(USER));
                emailInput.classList.add('input-ok');
            } else {
                emailInput.classList.add('input-error');
                mostrarMsg(msg, data2.error || 'Error al guardar email.', 'err'); return;
            }
        } catch {
            mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err'); return;
        }
    }

    // ── Validar y verificar teléfono (WhatsApp) ──
    if (cambioTel) {
        if (telLocal.length < 6) {
            telInput.classList.add('input-error');
            mostrarMsg(msg, 'Número de teléfono inválido.', 'err'); return;
        }

        const telCompleto = prefix + telLocal;
        mostrarMsg(msg, 'Enviando código por WhatsApp...', 'ok');

        try {
            const res  = await fetch('../../../api/send-code.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ telefono: telCompleto, cambio_credencial: true }),
            });
            const data = await res.json();

            if (data.ok) {
                pendingPhone = telCompleto;
                mostrarMsg(msg, '✓ Código enviado. Revisá WhatsApp.', 'ok');
                abrirModalWa(telCompleto);
            } else {
                telInput.classList.add('input-error');
                mostrarMsg(msg, data.error || 'No se pudo enviar el código.', 'err');
            }
        } catch {
            mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
        }
        return; // El flujo continúa en el modal
    }

    if (cambioEmail && !cambioTel) {
        mostrarMsg(msg, '✓ Credenciales actualizadas.', 'ok');
    }
}

// ── MODAL WHATSAPP ────────────────────────

function abrirModalWa(phone) {
    document.getElementById('wa-phone-display').textContent = '+' + phone;
    document.getElementById('msg-wa-modal').textContent = '';
    document.getElementById('msg-wa-modal').className   = 'msg';
    document.querySelectorAll('#otp-wa input').forEach(i => {
        i.value = ''; i.classList.remove('filled');
    });
    document.getElementById('modal-wa').classList.add('open');
    setTimeout(() => document.querySelector('#otp-wa input')?.focus(), 100);
}

async function verificarCodigoWa() {
    const codigo = [...document.querySelectorAll('#otp-wa input')].map(i => i.value).join('');
    const msg    = document.getElementById('msg-wa-modal');

    if (codigo.length < 6) {
        mostrarMsg(msg, 'Ingresá el código completo.', 'err'); return;
    }

    mostrarMsg(msg, 'Verificando...', 'ok');

    try {
        const res  = await fetch('../../../api/update-credentials.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                telefono: pendingPhone,
                code:     codigo,
            }),
        });
        const data = await res.json();

        if (data.ok) {
            USER.telefono = pendingPhone;
            sessionStorage.setItem('trinity_user', JSON.stringify(USER));
            document.getElementById('c-telefono').classList.add('input-ok');
            closeWaModalBtn();
            mostrarMsg(document.getElementById('msg-cred'), '✓ Teléfono actualizado correctamente.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Código incorrecto.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

async function reenviarCodigoWa() {
    const msg = document.getElementById('msg-wa-modal');
    mostrarMsg(msg, 'Reenviando código...', 'ok');

    try {
        const res  = await fetch('../../../api/send-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ telefono: pendingPhone, cambio_credencial: true }),
        });
        const data = await res.json();
        if (data.ok) {
            mostrarMsg(msg, '✓ Código reenviado.', 'ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al reenviar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar.', 'err');
    }
}

function closeWaModal(e) {
    if (e.target === document.getElementById('modal-wa')) {
        document.getElementById('modal-wa').classList.remove('open');
    }
}
function closeWaModalBtn() {
    document.getElementById('modal-wa').classList.remove('open');
    pendingPhone = '';
}

// ── CAMBIAR CONTRASEÑA — PASO 1 ───────────

async function solicitarCodigoPwd() {
    const msg     = document.getElementById('msg-pwd-req');
    const destino = document.getElementById('pwd-destino')?.value || 'email';

    if (!USER.email && !USER.telefono) {
        mostrarMsg(msg, 'No tenés email ni teléfono registrado.', 'err'); return;
    }
    if (destino === 'telefono' && !USER.telefono) {
        mostrarMsg(msg, 'No tenés un teléfono registrado.', 'err'); return;
    }
    if (destino === 'email' && !USER.email) {
        mostrarMsg(msg, 'No tenés un email registrado.', 'err'); return;
    }

    mostrarMsg(msg, 'Enviando código...', 'ok');

    const body = destino === 'telefono'
        ? { telefono: USER.telefono, cambio_password: true }
        : { email: USER.email, cambio_password: true };

    try {
        const res  = await fetch('../../../api/send-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });
        const data = await res.json();

        if (data.ok) {
            pendingPwdDestino = destino;
            const lugar = destino === 'telefono' ? 'tu WhatsApp' : 'tu correo';
            mostrarMsg(msg, `✓ Código enviado. Revisá ${lugar}.`, 'ok');
            document.getElementById('pwd-paso1').style.display = 'none';
            document.getElementById('pwd-paso2').style.display = 'block';
            setTimeout(() => document.querySelector('#otp-pwd input')?.focus(), 100);
        } else {
            mostrarMsg(msg, data.error || 'Error al enviar.', 'err');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.', 'err');
    }
}

// ── CAMBIAR CONTRASEÑA — PASO 2 ───────────

async function cambiarPassword() {
    const codigo  = [...document.querySelectorAll('#otp-pwd input')].map(i => i.value).join('');
    const nueva   = document.getElementById('pwd-nueva').value;
    const confirm = document.getElementById('pwd-confirm').value;
    const msg     = document.getElementById('msg-pwd');

    if (codigo.length < 6) { mostrarMsg(msg, 'Ingresá el código completo.', 'err'); return; }
    if (!nueva || !confirm) { mostrarMsg(msg, 'Completá ambas contraseñas.', 'err'); return; }
    if (nueva !== confirm)  { mostrarMsg(msg, 'Las contraseñas no coinciden.', 'err'); return; }
    if (nueva.length < 6)   { mostrarMsg(msg, 'Mínimo 6 caracteres.', 'err'); return; }

    mostrarMsg(msg, 'Actualizando...', 'ok');

    try {
        const verifBody = pendingPwdDestino === 'telefono'
            ? { telefono: USER.telefono, code: codigo, nueva_password: nueva }
            : { email: USER.email, code: codigo, nueva_password: nueva };

        const res  = await fetch('../../../api/change-password.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(verifBody),
        });
        const data = await res.json();

        if (data.ok) {
            mostrarMsg(msg, '✓ Contraseña actualizada. Iniciá sesión nuevamente.', 'ok');
            setTimeout(() => {
                sessionStorage.removeItem('trinity_user');
                window.location.href = '../../login/login.html';
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
    document.querySelectorAll('#otp-pwd input').forEach(i => {
        i.value = ''; i.classList.remove('filled');
    });
    document.getElementById('pwd-nueva').value = '';
    document.getElementById('pwd-confirm').value = '';
    document.getElementById('msg-pwd-req').textContent = '';
    document.getElementById('msg-pwd').textContent = '';
}

// ── ELIMINAR CUENTA ───────────────────────

async function confirmarEliminar() {
    if (!confirm('¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) return;

    try {
        const res  = await fetch('../../../api/delete-account.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (data.ok) {
            sessionStorage.removeItem('trinity_user');
            window.location.href = '../../../index.html';
        } else {
            alert(data.error || 'Error al eliminar la cuenta.');
        }
    } catch {
        alert('No se pudo conectar con el servidor.');
    }
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

// ── NAV ───────────────────────────────────

function initNav() {
    if (!USER) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('nav-username',      USER.usuario || USER.nombre);
    set('dropdown-username', USER.usuario || USER.nombre);
    // Los avatares (nav, dropdown, preview) se pintan en actualizarFotoPreview()
}

// Nav manejado por /components/nav.js



// ── HELPERS ───────────────────────────────

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function quitarPrefijo(tel) {
    // Quita prefijos comunes (Uruguay 598, Argentina 54, etc.)
    const prefijos = ['598','54','55','56','57','51','52','34','1'];
    for (const p of prefijos) {
        if (tel.startsWith(p)) return tel.slice(p.length);
    }
    return tel;
}

function mostrarMsg(el, texto, tipo) {
    el.textContent = texto;
    el.className   = 'msg ' + tipo;
    if (tipo === 'ok') setTimeout(() => { if (el.textContent === texto) el.textContent = ''; }, 4000);
}