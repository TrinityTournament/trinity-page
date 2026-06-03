// ── DRAG TO SCROLL ──
document.querySelectorAll('.cards-scroll').forEach(slider => {
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
<<<<<<< HEAD
        isDown = true;
        slider.classList.add('grabbing');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mousemove', e => {
=======
        isDown     = true;
        slider.classList.add('grabbing');
        startX     = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mouseup',    () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mousemove',  e => {
>>>>>>> 5051747 (Prueba)
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        slider.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
});

function scrollCards(id, dir) {
    const el = document.getElementById('scroll-' + id);
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
}

// ── DROPDOWN ──
function toggleDropdown() {
<<<<<<< HEAD
    const trigger = document.getElementById('user-trigger');
=======
    const trigger  = document.getElementById('user-trigger');
>>>>>>> 5051747 (Prueba)
    const dropdown = document.getElementById('user-dropdown');
    trigger.classList.toggle('open');
    dropdown.classList.toggle('open');
}

document.addEventListener('click', e => {
    const menu = document.getElementById('nav-user');
<<<<<<< HEAD
    if (!menu.contains(e.target)) {
        document.getElementById('user-trigger').classList.remove('open');
        document.getElementById('user-dropdown').classList.remove('open');
=======
    if (menu && !menu.contains(e.target)) {
        document.getElementById('user-trigger')?.classList.remove('open');
        document.getElementById('user-dropdown')?.classList.remove('open');
>>>>>>> 5051747 (Prueba)
    }
});

// ── AUTH STATE ──
function setUserLoggedIn(user) {
    document.getElementById('nav-guest').style.display = 'none';
    document.getElementById('nav-user').classList.add('active');
<<<<<<< HEAD
    document.getElementById('nav-username').textContent = user.usuario;
    document.getElementById('nav-avatar').textContent = user.usuario[0].toUpperCase();
    document.getElementById('dropdown-username').textContent = user.usuario;
    document.getElementById('dropdown-avatar').textContent = user.usuario[0].toUpperCase();
    sessionStorage.setItem('astrax_user', JSON.stringify(user));
=======
    document.getElementById('nav-username').textContent      = user.usuario;
    document.getElementById('nav-avatar').textContent        = user.usuario[0].toUpperCase();
    document.getElementById('dropdown-username').textContent = user.usuario;
    document.getElementById('dropdown-avatar').textContent   = user.usuario[0].toUpperCase();

    // Actualizar links del dropdown al perfil y configuración
    const linkPerfil = document.querySelector('.dropdown-item[data-link="perfil"]');
    const linkConfig = document.querySelector('.dropdown-item[data-link="config"]');
    if (linkPerfil) linkPerfil.href = '/pages/options/profile/view.html';
    if (linkConfig) linkConfig.href = '/pages/options/config/edit.html';
>>>>>>> 5051747 (Prueba)
}

function logout() {
    sessionStorage.removeItem('astrax_user');
    document.getElementById('nav-guest').style.display = 'flex';
    document.getElementById('nav-user').classList.remove('active');
<<<<<<< HEAD
}

// Hamburger (son las 3 lineas horizontales ||| que funcionan como menú btw)
=======
    // Cerrar dropdown
    document.getElementById('user-trigger')?.classList.remove('open');
    document.getElementById('user-dropdown')?.classList.remove('open');
}

// ── HAMBURGER MÓVIL ──
>>>>>>> 5051747 (Prueba)
function toggleHamburger() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
}

document.addEventListener('click', e => {
    const hamburger = document.getElementById('hamburger');
<<<<<<< HEAD
    const menu = document.getElementById('mobile-menu');
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open')
    }
});

// Restaurar sesión al cargar
const savedUser = sessionStorage.getItem('astrax_user');
if (savedUser) setUserLoggedIn(JSON.parse(savedUser));
=======
    const menu      = document.getElementById('mobile-menu');
    if (hamburger && menu && !hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
    }
});

// ── RESTAURAR SESIÓN AL CARGAR ──
const savedUser = sessionStorage.getItem('astrax_user');
if (savedUser) setUserLoggedIn(JSON.parse(savedUser));
>>>>>>> 5051747 (Prueba)
