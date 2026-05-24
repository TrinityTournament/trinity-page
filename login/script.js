let modoRegistro = false;
let datosUsuario = {};
let seleccionados = [];

const catalogoData = {
    deportes: [
        { nombre: 'Fútbol', img: '../assets/sports/futbol.webp' },
        { nombre: 'Basketball', img: '../assets/sports/basketball.webp' },
        { nombre: 'Tenis', img: '../assets/sports/tenis.webp' },
        { nombre: 'Natación', img: '../assets/sports/natacion.webp' },
        { nombre: 'Atletismo', img: '../assets/sports/atletismo.webp' },
        { nombre: 'Volleyball', img: '../assets/sports/volleyball.webp' }
    ],
    videojuegos: [
        { nombre: 'League of Legends', img: '../assets/videogames/lol.webp' },
        { nombre: 'Call of Duty', img: '../assets/videogames/cod.webp' },
        { nombre: 'Valorant', img: '../assets/videogames/valorant.webp' },
        { nombre: 'Clash Royale', img: '../assets/videogames/clasroyale.webp' },
        { nombre: 'Fortnite', img: '../assets/videogames/fortnite.webp' },
        { nombre: 'Rocket League', img: '../assets/videogames/rocketleague.webp' }
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

    window.location.href = '../index.html';
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