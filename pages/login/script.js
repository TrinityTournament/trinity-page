<<<<<<< HEAD
let modoRegistro = false;
let datosUsuario = {};
let seleccionados = [];

const catalogoData = {
    deportes: [
        { nombre: 'Fútbol', img: '../../assets/sports/futbol.webp' },
        { nombre: 'Basketball', img: '../../assets/sports/basketball.webp' },
        { nombre: 'Tenis', img: '../../assets/sports/tenis.webp' },
        { nombre: 'Natación', img: '../../assets/sports/natacion.webp' },
        { nombre: 'Atletismo', img: '../../assets/sports/atletismo.webp' },
        { nombre: 'Volleyball', img: '../../assets/sports/volleyball.webp' }
    ],
    videojuegos: [
        { nombre: 'League of Legends', img: '../../assets/videogames/lol.webp' },
        { nombre: 'Call of Duty', img: '../../assets/videogames/cod.webp' },
        { nombre: 'Valorant', img: '../../assets/videogames/valorant.webp' },
        { nombre: 'Clash Royale', img: '../../assets/videogames/clasroyale.webp' },
        { nombre: 'Fortnite', img: '../../assets/videogames/fortnite.webp' },
        { nombre: 'Rocket League', img: '../../assets/videogames/rocketleague.webp' }
    ]
};

function toggleModo() {
    modoRegistro = !modoRegistro;
    const card = document.querySelector('.login-card');
    const enlace = document.getElementById('enlace-modo');
    const textoRegistro = document.getElementById('texto-registro');
    const titulo = document.getElementById('titulo');
    const subtitulo = document.getElementById('subtitulo');

    const msg = document.getElementById('mensaje');
    if (msg) msg.textContent = '';
    seleccionados = [];

    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    if (modoRegistro) {
        card.classList.add('wide');
        document.getElementById('step-datos').classList.add('active');
        document.getElementById('step-datos').style.display = 'flex';
        titulo.textContent = 'Creá tu cuenta';
        subtitulo.textContent = 'Completá tus datos para registrarte';
        textoRegistro.textContent = '¿Ya tenés cuenta?';
        enlace.textContent = ' Iniciá sesión';
    } else {
        card.classList.remove('wide');
        document.getElementById('step-login').classList.add('active');
        document.getElementById('step-login').style.display = 'flex';
        titulo.textContent = 'Bienvenido de nuevo';
        subtitulo.textContent = 'Ingresa tus datos para continuar';
        textoRegistro.textContent = '¿No tenés cuenta?';
        enlace.textContent = ' Registrate';
    }
}

function togglePassword(id, icon) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        icon.style.opacity = '1';
    } else {
        input.type = 'password';
        icon.style.opacity = '0.7';
    }
}

function mostrarCatalogo() {
    const tipo = document.getElementById('tipo-deporte').value;
    const container = document.getElementById('catalogo-container');
    const catalogo = document.getElementById('catalogo');

    seleccionados = [];
    catalogo.innerHTML = '';
    container.style.display = 'block';

    catalogoData[tipo].forEach(item => {
        const div = document.createElement('div');
        div.className = 'catalogo-item';
        div.innerHTML = `<img src="${item.img}" alt="${item.nombre}"><span>${item.nombre}</span>`;
        div.onclick = () => toggleSeleccion(div, item.nombre);
        catalogo.appendChild(div);
    });
}

function toggleSeleccion(div, nombre) {
    if (div.classList.contains('selected')) {
        div.classList.remove('selected');
        seleccionados = seleccionados.filter(s => s !== nombre);
    } else {
        div.classList.add('selected');
        seleccionados.push(nombre);
    }
}

async function accionPrincipal() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password-login').value;

    if (!email.endsWith('@gmail.com')) {
        alert('Solo se permiten cuentas Gmail.');
        return;
    }

    if (!password) {
        alert('Ingresá tu contraseña.');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    
        const data = await res.json();

        if (data.ok) {
            sessionStorage.setItem('astrax_user', JSON.stringify(data.usuario));
            window.location.href = '../../index.html'
        } else {
            alert(data.error || 'Error al iniciar sesión.');
        }
    } catch (err) {
        alert('No se pudo conectar con el servidor.')
    }
}

async function sendCode() {
    const nombre = document.getElementById('nombre').value.trim();
    const fecha = document.getElementById('fecha').value;
    const usuario = document.getElementById('usuario').value.trim();
    const tipo = document.getElementById('tipo-deporte').value;
    const password = document.getElementById('password-registro').value;
    const email = document.getElementById('email-registro').value.trim();
    const mensaje = document.getElementById('mensaje');

    if (!nombre || !fecha || !usuario || !tipo || !password || !email) {
        mensaje.textContent = 'Completá todos los campos.';
        return;
    }

    if (!email.endsWith('@gmail.com')) {
        mensaje.textContent = 'Solo se permiten cuentas Gmail.';
        return;
    }

    if (seleccionados.length < 2) {
        mensaje.textContent = 'Seleccioná al menos 2 deportes o juegos.';
        return;
    }

    datosUsuario = { nombre, fecha, usuario, tipo, deportes: seleccionados, password, email };
    mensaje.textContent = 'Enviando código...';

    try {
        const res = await fetch('http://localhost:3000/api/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.ok) {
            document.getElementById('step-datos').style.display = 'none';
            document.getElementById('step-datos').classList.remove('active');
            document.getElementById('step-code').style.display = 'flex';
            document.getElementById('step-code').classList.add('active');
            mensaje.textContent = '';
            document.getElementById('mensaje-code').textContent = 'Código enviado. Revisá tu Gmail.';
        } else {
            mensaje.textContent = 'Error al enviar el código.';
        }
    } catch (err) {
        mensaje.textContent = 'No se pudo conectar con el servidor.';
    }
}

async function verifyCode() {
    const code = document.getElementById('code').value;
    const mensaje = document.getElementById('mensaje-code');

    if (code.length !== 6) {
        mensaje.textContent = 'El código debe tener 6 dígitos.';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: datosUsuario.email,
                code,
                nombre: datosUsuario.nombre,
                fecha: datosUsuario.fecha,
                usuario: datosUsuario.usuario,
                tipo: datosUsuario.tipo,
                deportes: datosUsuario.deportes,
                password: datosUsuario.password
            })
        });

        const data = await res.json();

        if (data.ok) {
            mensaje.textContent = '¡Cuenta creada! Ya podés acceder.';
            setTimeout(() => toggleModo(), 2000);
        } else {
            mensaje.textContent = data.error || 'Código incorrecto.';
        }
    } catch (err) {
        mensaje.textContent = 'No se pudo conectar con el servidor.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('step-login').classList.add('active');
    document.getElementById('step-login').style.display = 'flex';

    const params = new URLSearchParams(window.location.search);
    if (params.get('m') === 'register') {
        toggleModo();
    }
});
=======
// ══════════════════════════════════════════
//  ASTRAX — LOGIN / REGISTRO
// ══════════════════════════════════════════

let metodoActual = null; // 'email' | 'telefono'
let canalActual  = null; // 'whatsapp' | 'telegram'
let datosUsuario = {};

// ── FUNCIÓN CENTRAL DE NAVEGACIÓN ────────────────────────
// Toda visibilidad de steps pasa por aquí, solo con clases.
// Nunca se toca style.display para evitar el bug del OG
// donde el inline override pisaba al CSS y ambos steps
// quedaban visibles al mismo tiempo.

function activarStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function mostrarLogin() {
    activarStep('step-login');
    document.getElementById('card').classList.remove('wide');
    resetRegistro();
}

function mostrarRegistro() {
    activarStep('step-registro');
    // contraseña siempre oculta al entrar al registro
    document.getElementById('field-password').classList.remove('pwd-visible');
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
    document.getElementById('field-password').classList.remove('pwd-visible');
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

    // Mostrar contraseña con clase (no style inline)
    document.getElementById('field-password').classList.add('pwd-visible');

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

// ── CANAL (WhatsApp / Telegram) ───────────────────────────

function seleccionarCanal(canal) {
    if (canalActual === canal) return;
    canalActual = canal;

    const btnWa = document.getElementById('btn-whatsapp');
    const btnTg = document.getElementById('btn-telegram');

    btnWa.classList.toggle('active', canal === 'whatsapp');
    btnTg.classList.toggle('active', canal === 'telegram');
    btnWa.disabled = canal !== 'whatsapp';
    btnTg.disabled = canal !== 'telegram';
}

// ── TOGGLE PASSWORD ───────────────────────────────────────

function togglePassword(id, icon) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
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
            window.location.href = '/astrax/index.html';
        } else {
            alert(data.error || 'Email o contraseña incorrectos.');
        }
    } catch {
        alert('No se pudo conectar con el servidor.');
    }
}

// ── SOLICITAR CÓDIGO EMAIL ────────────────────────────────

async function solicitarCodigoEmail() {
    const nombre   = document.getElementById('nombre').value.trim();
    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password-registro').value;
    const email    = document.getElementById('email-registro').value.trim();
    const msg      = document.getElementById('msg-email');

    if (!nombre || !usuario || !password || !email) {
        msg.textContent = 'Completá todos los campos.'; return;
    }

    datosUsuario    = { nombre, usuario, password, email, metodo: 'email' };
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

// ── VERIFICAR CÓDIGO EMAIL ────────────────────────────────

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

// ── VERIFICAR CÓDIGO TELÉFONO ─────────────────────────────

async function verificarCodigoTel(codigo) {
    const msg = document.getElementById('msg-tel');
    msg.textContent = 'Verificando...';
    // TODO: integrar con bot de WhatsApp / Telegram
    msg.textContent = 'Verificación por teléfono próximamente.';
    limpiarOtp('otp-tel');
}

// ── INIT ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('m') === 'register') mostrarRegistro();
});
>>>>>>> 5051747 (Prueba)
