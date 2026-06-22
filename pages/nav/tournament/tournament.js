// BASE_URL ya está definida globalmente por /Trinity-page/components/nav.js

// ── Usuario logueado (si hay sesión activa) ──
function usuarioLogueado() {
    const raw = sessionStorage.getItem('trinity_user');
    return raw ? JSON.parse(raw) : null;
}

// ── Configuración de Clash Royale para el modal gameProfile ──
const JUEGO_CLASH_ROYALE = {
    id:     'clashroyale',
    nombre: 'Clash Royale',
    logo:   `${BASE_URL}/assets/tournament-banner/CRLogo.png`,
    campos: [
        {
            key:         'tag',
            label:       'Tag de jugador',
            placeholder: '#GPP2J0UL8',
            ayuda:       'Lo encontrás en tu perfil dentro del juego, debajo de tu nombre.',
        },
    ],
    torneo: null, // se completa más adelante cuando haya un torneo activo de CR
};

document.addEventListener('DOMContentLoaded', () => {
    // El enlace de "LINK A LOGIN" y el botón "¿Cómo me inscribo?" llevan al login/registro
    document.getElementById('loginLinkTag').href = `${BASE_URL}/pages/login/login.html`;

    document.getElementById('howToJoinBtn').addEventListener('click', () => {
        window.location.href = `${BASE_URL}/pages/login/login.html?m=register`;
    });

    // Cada tarjeta de juego abre su flujo correspondiente
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const gameId = card.dataset.gameId;

            if (gameId === 'clashroyale') {
                abrirFlujoClashRoyale();
                return;
            }
            if (gameId === 'fortnite') {
                abrirFlujoFortnite();
                return;
            }
            if (gameId === 'brawlstars') {
                abrirFlujoBrawlStars();
                return;
            }
            if (gameId === 'dota2') {
                abrirFlujoDota2();
                return;
            }
            if (gameId === 'minecraft') {
                abrirFlujoMinecraft();
                return;
            }

            // Resto de juegos: comportamiento original (listado del torneo)
            const juego = encodeURIComponent(card.dataset.game);
            window.location.href = `${BASE_URL}/pages/nav/tournament/tournament.html?juego=${juego}`;
        });
    });
});

// ── Flujo Clash Royale ──
// Si el usuario ya vinculó su cuenta → abre directamente las estadísticas.
// Si no → abre el modal para ingresar el tag.
async function abrirFlujoClashRoyale() {
    const user = usuarioLogueado();

    if (user) {
        // Verificar si ya tiene cuenta vinculada
        try {
            const res = await fetch(`${BASE_URL}/api/videogames/ClashRoyaleAPI/get-account.php`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.tag) {
                    // ✅ Ya tiene cuenta vinculada → ir directo a estadísticas
                    openClashRoyaleStats({ tag: data.tag });
                    return;
                }
            }
        } catch (err) {
            console.warn('[tournament] No se pudo verificar el tag guardado:', err);
        }
    }

    // No tiene cuenta vinculada (o no está logueado) → mostrar modal de vinculación
    openGameProfileModal(JUEGO_CLASH_ROYALE, {
        valoresGuardados: {},
        onGuardar: async (juegoId, datos) => {
            if (!usuarioLogueado()) {
                throw new Error('Necesitás iniciar sesión para vincular tu cuenta. Cerrá este cuadro e ingresá desde "Link a login".');
            }

            const res = await apiFetch(`${BASE_URL}/api/videogames/ClashRoyaleAPI/save-account.php`, {
                method: 'POST',
                body:   JSON.stringify({ tag: datos.tag }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'No se pudo guardar tu cuenta.');
            }

            // Tras guardar con éxito, abrir las estadísticas
            setTimeout(() => openClashRoyaleStats({ tag: data.tag }), 250);
        },
    });
}

// ── Flujo Fortnite ──
async function abrirFlujoFortnite() {
    const user = usuarioLogueado();

    if (user) {
        try {
            const res = await fetch(`${BASE_URL}/api/videogames/FortniteAPI/get-account.php`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.username) {
                    openFortniteStats({ username: data.username });
                    return;
                }
            }
        } catch (err) {
            console.warn('[tournament] No se pudo verificar la cuenta de Fortnite:', err);
        }
    }

    openGameProfileModal({
        id:     'fortnite',
        nombre: 'Fortnite',
        logo:   `${BASE_URL}/assets/tournament-banner/FortniteICON.png`,
        campos: [
            {
                key:         'username',
                label:       'Nombre de usuario de Epic Games',
                placeholder: 'MiraCertera3343',
                ayuda:       'Tu nombre de cuenta de Epic Games (sensible a mayúsculas).',
            },
        ],
        torneo: null,
    }, {
        valoresGuardados: {},
        onGuardar: async (juegoId, datos) => {
            if (!usuarioLogueado()) {
                throw new Error('Necesitás iniciar sesión para vincular tu cuenta.');
            }
            const res = await apiFetch(`${BASE_URL}/api/videogames/FortniteAPI/save-account.php`, {
                method: 'POST',
                body:   JSON.stringify({ username: datos.username }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'No se pudo guardar tu cuenta de Fortnite.');
            }
            setTimeout(() => openFortniteStats({ username: data.username }), 250);
        },
    });
}

// ── Flujo Brawl Stars ──
async function abrirFlujoBrawlStars() {
    const user = usuarioLogueado();

    if (user) {
        try {
            const res = await fetch(`${BASE_URL}/api/videogames/BRAWLAPI/get-account.php`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.tag) {
                    openBrawlStarsStats({ tag: data.tag });
                    return;
                }
            }
        } catch (err) {
            console.warn('[tournament] No se pudo verificar la cuenta de Brawl Stars:', err);
        }
    }

    openGameProfileModal({
        id:     'brawlstars',
        nombre: 'Brawl Stars',
        logo:   `${BASE_URL}/assets/tournament-banner/BSLogo.png`,
        campos: [
            {
                key:         'tag',
                label:       'Tag de jugador',
                placeholder: '#VOYUUUO',
                ayuda:       'Encontralo en tu perfil dentro del juego, debajo de tu nombre.',
            },
        ],
        torneo: null,
    }, {
        valoresGuardados: {},
        onGuardar: async (juegoId, datos) => {
            if (!usuarioLogueado()) {
                throw new Error('Necesitás iniciar sesión para vincular tu cuenta.');
            }
            const res = await apiFetch(`${BASE_URL}/api/videogames/BRAWLAPI/save-account.php`, {
                method: 'POST',
                body:   JSON.stringify({ tag: datos.tag }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'No se pudo guardar tu cuenta de Brawl Stars.');
            }
            setTimeout(() => openBrawlStarsStats({ tag: data.tag }), 250);
        },
    });
}

// ── Flujo Dota 2 (Steam) ──
async function abrirFlujoDota2() {
    const user = usuarioLogueado();

    if (user) {
        try {
            const res = await fetch(`${BASE_URL}/api/videogames/DOTA2API/get-account.php`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.steamId) {
                    openDota2Stats({ steamId: data.steamId });
                    return;
                }
            }
        } catch (err) {
            console.warn('[tournament] No se pudo verificar la cuenta de Dota 2:', err);
        }
    }

    openGameProfileModal({
        id:     'dota2',
        nombre: 'Dota 2',
        logo:   `${BASE_URL}/assets/tournament-banner/Dota2Logo.png`,
        campos: [
            {
                key:         'steamId',
                label:       'Usuario o Steam ID',
                placeholder: 'Usuario o Steam ID',
                ayuda:       'Tu nombre de usuario de Steam (vanity URL) o tu Steam ID de 17 dígitos.',
            },
        ],
        torneo: null,
    }, {
        valoresGuardados: {},
        onGuardar: async (juegoId, datos) => {
            if (!usuarioLogueado()) {
                throw new Error('Necesitás iniciar sesión para vincular tu cuenta.');
            }
            const res = await apiFetch(`${BASE_URL}/api/videogames/DOTA2API/save-account.php`, {
                method: 'POST',
                body:   JSON.stringify({ steamId: datos.steamId }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'No se pudo guardar tu cuenta de Dota 2.');
            }
            setTimeout(() => openDota2Stats({ steamId: data.steamId }), 250);
        },
    });
}

// ── Flujo Minecraft ──
async function abrirFlujoMinecraft() {
    const user = usuarioLogueado();

    if (user) {
        try {
            const res = await fetch(`${BASE_URL}/api/videogames/MinecraftAPI/get-account.php`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.username) {
                    openMinecraftStats({ username: data.username });
                    return;
                }
            }
        } catch (err) {
            console.warn('[tournament] No se pudo verificar la cuenta de Minecraft:', err);
        }
    }

    openGameProfileModal({
        id:     'minecraft',
        nombre: 'Minecraft',
        logo:   `${BASE_URL}/assets/tournament-banner/MinecraftLogo.png`,
        campos: [
            {
                key:         'username',
                label:       'Nametag de Minecraft Java',
                placeholder: 'MoonRealm_',
                ayuda:       'Tu nombre de usuario de Minecraft Java Edition (sensible a mayúsculas).',
            },
        ],
        torneo: null,
    }, {
        valoresGuardados: {},
        onGuardar: async (juegoId, datos) => {
            if (!usuarioLogueado()) {
                throw new Error('Necesitás iniciar sesión para vincular tu cuenta.');
            }
            const res = await apiFetch(`${BASE_URL}/api/videogames/MinecraftAPI/save-account.php`, {
                method: 'POST',
                body:   JSON.stringify({ username: datos.username }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'No se pudo guardar tu cuenta de Minecraft.');
            }
            setTimeout(() => openMinecraftStats({ username: data.username }), 250);
        },
    });
}
