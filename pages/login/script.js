// ══════════════════════════════════════════
//  ASTRAX — LOGIN v2
// ══════════════════════════════════════════

let metodoActual  = null; // 'email' | 'telefono'
let canalActual   = null; // 'whatsapp'
let datosUsuario  = {};

// ── NAVEGACIÓN ENTRE VISTAS ───────────────────────────────

function mostrarLogin() {
    document.getElementById('step-login').classList.add('active');
    document.getElementById('step-registro').classList.remove('active');
    document.getElementById('card').classList.remove('wide');
    resetRegistro();
}

function mostrarRegistro() {
    document.getElementById('step-login').classList.remove('active');
    document.getElementById('step-registro').classList.add('active');
    document.getElementById('card').classList.add('wide');
}

// ── RESET ─────────────────────────────────────────────────

function resetRegistro() {
    metodoActual = null;
    canalActual  = null;

    document.querySelectorAll('.metodo-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('visible'));
    document.querySelectorAll('.canal-btn').forEach(b => {
        b.classList.remove('active');
        b.disabled = false;
    });
    document.getElementById('col-der').classList.remove('visible');
    limpiarOtp('otp-email');
    limpiarOtp('otp-tel');
    document.getElementById('msg-email').textContent = '';
    document.getElementById('msg-tel').textContent   = '';
}

function limpiarOtp(groupId) {
    document.querySelectorAll(`#${groupId} input`).forEach(i => {
        i.value = '';
        i.classList.remove('filled');
    });
}

// ── MÉTODO DE VERIFICACIÓN ────────────────────────────────

function seleccionarMetodo(metodo) {
    metodoActual = metodo;

    document.getElementById('btn-email').classList.toggle('active',    metodo === 'email');
    document.getElementById('btn-telefono').classList.toggle('active', metodo === 'telefono');

    document.getElementById('card').classList.add('wide');
    document.getElementById('col-der').classList.add('visible');

    document.getElementById('panel-email').classList.toggle('visible',    metodo === 'email');
    document.getElementById('panel-telefono').classList.toggle('visible', metodo === 'telefono');

    if (metodo !== 'telefono') {
        canalActual = null;
        document.querySelectorAll('.canal-btn').forEach(b => {
            b.classList.remove('active');
            b.disabled = false;
        });
    }
}

// ── CANAL ───────────────────────────────────────────────

function seleccionarCanal(canal) {
    canalActual = canal;
    const btnWa = document.getElementById('btn-whatsapp');
    btnWa.classList.toggle('active', canal === 'whatsapp');
}

// ── TOGGLE PASSWORD ───────────────────────────────────────

function togglePassword(id, icon) {
    const input = document.getElementById(id);
    input.type        = input.type === 'password' ? 'text' : 'password';
    icon.style.opacity = input.type === 'text' ? '1' : '0.6';
}

// ── OTP ───────────────────────────────────────────────────

function otpNext(input, groupId) {
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value) {
        input.classList.add('filled');
        const inputs = [...document.querySelectorAll(`#${groupId} input`)];
        const idx    = inputs.indexOf(input);
        if (idx < inputs.length - 1) inputs[idx + 1].focus();

        const completo = inputs.every(i => i.value.length === 1);
        if (completo) {
            const codigo = inputs.map(i => i.value).join('');
            if (groupId === 'otp-email') verificarCodigoEmail(codigo);
            if (groupId === 'otp-tel')   verificarCodigoTel(codigo);
        }
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

// ── LOGIN ─────────────────────────────────────────────────

async function accionLogin() {
    const identifier = document.getElementById('login-identifier').value.trim();
    const password   = document.getElementById('password-login').value;

    if (!identifier) { alert('Ingresá tu email o número de teléfono.'); return; }
    if (!password)   { alert('Ingresá tu contraseña.'); return; }

    try {
        const res  = await fetch('../../api/login.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ identifier, password }),
        });
        const data = await res.json();

        if (data.ok) {
            sessionStorage.setItem('astrax_user', JSON.stringify(data.usuario));
            window.location.href = '/astrax-page/index.html';
        } else {
            alert(data.error || 'Email o contraseña incorrectos.');
        }
    } catch {
        alert('No se pudo conectar con el servidor.');
    }
}

// ── REGISTRO — SOLICITAR CÓDIGO EMAIL ────────────────────

async function solicitarCodigoEmail() {
    const nombre   = document.getElementById('nombre').value.trim();
    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password-registro').value;
    const email    = document.getElementById('email-registro').value.trim();
    const msg      = document.getElementById('msg-email');

    if (!nombre || !usuario || !password || !email) {
        msg.textContent = 'Completá todos los campos.'; return;
    }

    datosUsuario = { nombre, usuario, password, email, metodo: 'email' };
    msg.textContent = 'Enviando código...';

    try {
        const res  = await fetch('../../api/send-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });
        const data = await res.json();

        msg.textContent = data.ok
            ? 'Código enviado. Revisá tu correo.'
            : (data.error || 'Error al enviar el código.');
    } catch {
        msg.textContent = 'No se pudo conectar con el servidor.';
    }
}

// ── REGISTRO — VERIFICAR CÓDIGO EMAIL ────────────────────

async function verificarCodigoEmail(codigo) {
    const msg = document.getElementById('msg-email');
    msg.textContent = 'Verificando...';

    try {
        const res  = await fetch('../../api/verify-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                email:    datosUsuario.email,
                code:     codigo,
                nombre:   datosUsuario.nombre,
                usuario:  datosUsuario.usuario,
                password: datosUsuario.password,
            }),
        });
        const data = await res.json();

        if (data.ok) {
            msg.textContent = '¡Cuenta creada! Iniciando sesión...';
            setTimeout(() => mostrarLogin(), 1800);
        } else {
            msg.textContent = data.error || 'Código incorrecto.';
            limpiarOtp('otp-email');
        }
    } catch {
        msg.textContent = 'Error al verificar. Intentá nuevamente.';
        limpiarOtp('otp-email');
    }
}

// ── REGISTRO — VERIFICAR CÓDIGO TELÉFONO ─────────────────

// ── REGISTRO — SOLICITAR CÓDIGO TELÉFONO ─────────────────

async function solicitarCodigoTel() {
    const nombre   = document.getElementById('nombre').value.trim();
    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password-registro').value;
    const telefono = document.getElementById('telefono-registro').value.trim();
    const msg      = document.getElementById('msg-tel');

    if (!nombre || !usuario || !password || !telefono) {
        msg.textContent = 'Completá todos los campos antes de solicitar el código.'; return;
    }
    if (!canalActual) {
        msg.textContent = 'Elegí WhatsApp antes de continuar.'; return;
    }

    datosUsuario = { nombre, usuario, password, telefono, canal: canalActual, metodo: 'telefono' };
    msg.textContent = 'Enviando código...';

    try {
        const res  = await fetch('../../api/send-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ telefono, canal: canalActual }),
        });
        const data = await res.json();

        if (!data.ok) {
            msg.textContent = data.error || 'Error al enviar el código.';
            return;
        }

        msg.textContent = 'Código enviado por WhatsApp. Revisá tu app.';

    } catch {
        msg.textContent = 'No se pudo conectar con el servidor.';
    }
}

// ── REGISTRO — VERIFICAR CÓDIGO TELÉFONO ─────────────────

async function verificarCodigoTel(codigo) {
    const msg = document.getElementById('msg-tel');
    msg.textContent = 'Verificando...';

    try {
        const res  = await fetch('../../api/verify-code.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                telefono: datosUsuario.telefono,
                code:     codigo,
                nombre:   datosUsuario.nombre,
                usuario:  datosUsuario.usuario,
                password: datosUsuario.password,
            }),
        });
        const data = await res.json();

        if (data.ok) {
            msg.textContent = '¡Cuenta creada! Iniciando sesión...';
            setTimeout(() => mostrarLogin(), 1800);
        } else {
            msg.textContent = data.error || 'Código incorrecto.';
            limpiarOtp('otp-tel');
        }
    } catch {
        msg.textContent = 'Error al verificar. Intentá nuevamente.';
        limpiarOtp('otp-tel');
    }
}

// ── FORGOT PASSWORD ───────────────────────────────────────

function mostrarForgot() {
    document.getElementById('forgot-email').value      = '';
    document.getElementById('msg-forgot').textContent  = '';
    document.getElementById('modal-forgot').classList.add('visible');
}

function cerrarForgot(e) {
    // Si se llama desde onclick del overlay, solo cerrar si el click fue en el overlay
    if (e && e.target !== document.getElementById('modal-forgot')) return;
    document.getElementById('modal-forgot').classList.remove('visible');
}

async function enviarReset() {
    const email = document.getElementById('forgot-email').value.trim();
    const msg   = document.getElementById('msg-forgot');

    if (!email) { msg.textContent = 'Ingresá tu email.'; msg.className = 'msg err'; return; }

    msg.textContent = 'Enviando...';
    msg.className   = 'msg';

    try {
        const res  = await fetch('../../api/request-reset.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });
        const data = await res.json();

        if (data.ok) {
            msg.textContent = '✓ Si el email existe, recibirás el link en breve.';
            msg.className   = 'msg ok';
        } else {
            msg.textContent = data.error || 'Error al enviar.';
            msg.className   = 'msg err';
        }
    } catch {
        msg.textContent = 'No se pudo conectar con el servidor.';
        msg.className   = 'msg err';
    }
}

// ── INIT ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('m') === 'register') mostrarRegistro();
});
