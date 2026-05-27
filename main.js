// ── DRAG TO SCROLL ──
document.querySelectorAll('.cards-scroll').forEach(slider => {
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
        isDown = true;
        slider.classList.add('grabbing');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mousemove', e => {
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
    const trigger = document.getElementById('user-trigger');
    const dropdown = document.getElementById('user-dropdown');
    trigger.classList.toggle('open');
    dropdown.classList.toggle('open');
}

document.addEventListener('click', e => {
    const menu = document.getElementById('nav-user');
    if (!menu.contains(e.target)) {
        document.getElementById('user-trigger').classList.remove('open');
        document.getElementById('user-dropdown').classList.remove('open');
    }
});

// ── AUTH STATE ──
function setUserLoggedIn(user) {
    document.getElementById('nav-guest').style.display = 'none';
    document.getElementById('nav-user').classList.add('active');
    document.getElementById('nav-username').textContent = user.usuario;
    document.getElementById('nav-avatar').textContent = user.usuario[0].toUpperCase();
    document.getElementById('dropdown-username').textContent = user.usuario;
    document.getElementById('dropdown-avatar').textContent = user.usuario[0].toUpperCase();
    sessionStorage.setItem('astrax_user', JSON.stringify(user));
}

function logout() {
    sessionStorage.removeItem('astrax_user');
    document.getElementById('nav-guest').style.display = 'flex';
    document.getElementById('nav-user').classList.remove('active');
}

// Hamburger (son las 3 lineas horizontales ||| que funcionan como menú btw)
function toggleHamburger() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
}

document.addEventListener('click', e => {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open')
    }
});

// Restaurar sesión al cargar
const savedUser = sessionStorage.getItem('astrax_user');
if (savedUser) setUserLoggedIn(JSON.parse(savedUser));