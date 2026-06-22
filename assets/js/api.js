// ══════════════════════════════════════════════════════════
//  TRINITY — apiFetch: wrapper centralizado de fetch()
//
//  Uso:
//      import apiFetch from '/Trinity-page/assets/js/api.js';
//  O bien (sin módulos), incluir con <script> antes del script
//  que lo use — expone window.apiFetch.
//
//  apiFetch(url, options?)
//    - Agrega automáticamente el header X-CSRF-Token.
//    - Redirige al login en respuestas 401.
//    - Muestra un mensaje de error en respuestas 403.
//    - Devuelve la misma Promise<Response> que fetch().
// ══════════════════════════════════════════════════════════

const API_BASE_URL = '/Trinity-page';

// ── CSRF TOKEN ────────────────────────────────────────────
// El token se carga una sola vez por sesión de página.
// Primero intenta leer de la meta tag <meta name="csrf-token">,
// si no existe lo pide al endpoint /api/auth/csrf-token.php.

let _csrfToken = null;
let _csrfPromise = null; // evita múltiples requests simultáneos

async function getCsrfToken() {
    // 1. Ya lo tenemos en memoria
    if (_csrfToken) return _csrfToken;

    // 2. Hay una petición en vuelo — esperarla
    if (_csrfPromise) return _csrfPromise;

    // 3. Leer desde <meta name="csrf-token" content="...">
    const metaEl = document.querySelector('meta[name="csrf-token"]');
    if (metaEl && metaEl.content) {
        _csrfToken = metaEl.content;
        return _csrfToken;
    }

    // 4. Pedirlo al endpoint dedicado
    _csrfPromise = fetch(`${API_BASE_URL}/api/auth/csrf-token.php`, {
        credentials: 'include',
    })
        .then(r => r.json())
        .then(data => {
            _csrfToken = data.csrf_token || '';
            _csrfPromise = null;
            return _csrfToken;
        })
        .catch(() => {
            _csrfPromise = null;
            return '';
        });

    return _csrfPromise;
}

// ── LIMPIAR TOKEN ─────────────────────────────────────────
// Llamar tras recibir un nuevo csrf_token del servidor
// (p.ej. después de un login exitoso).
function setCsrfToken(token) {
    _csrfToken = token || null;
}

// ── apiFetch ─────────────────────────────────────────────
// Wrapper de fetch() que:
//   • Siempre manda credentials: 'include' (cookies de sesión).
//   • En métodos que mutan (POST, PUT, PATCH, DELETE) agrega
//     el header X-CSRF-Token de forma automática.
//   • En 401 redirige al login.
//   • En 403 muestra un alert y lanza un error.
//   • Devuelve la Response sin parsear (el llamador usa .json()).

async function apiFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const mutates = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Construir headers base
    const headers = {
        ...(options.headers || {}),
    };

    // Asegurar Content-Type JSON si hay body y no viene definido
    if (mutates && options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Agregar CSRF solo en métodos que mutan
    if (mutates) {
        const token = await getCsrfToken();
        if (token) {
            headers['X-CSRF-Token'] = token;
        }
    }

    const fetchOptions = {
        ...options,
        headers,
        credentials: 'include', // siempre enviar cookie de sesión
    };

    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (err) {
        // Error de red (sin conexión, CORS bloqueado, etc.)
        console.error('[apiFetch] Error de red:', err);
        throw err;
    }

    // ── Manejo de errores HTTP ────────────────────────────
    if (response.status === 401) {
        // No autenticado: redirigir al login
        sessionStorage.removeItem('trinity_user');
        window.location.href = `${API_BASE_URL}/pages/login/login.html`;
        throw new Error('No autenticado. Redirigiendo al login...');
    }

    if (response.status === 403) {
        // Sin permisos o token CSRF inválido
        let mensaje = 'No tenés permiso para realizar esta acción.';
        try {
            const clone = response.clone();
            const data = await clone.json();
            if (data.error) mensaje = data.error;
        } catch {}
        console.warn('[apiFetch] 403 Forbidden:', mensaje);
        alert(`⚠️ ${mensaje}`);
        throw new Error(mensaje);
    }

    return response;
}

// ── EXPORTAR ─────────────────────────────────────────────
// Funciona tanto como módulo ES como script clásico.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiFetch, setCsrfToken, getCsrfToken };
} else {
    window.apiFetch    = apiFetch;
    window.setCsrfToken = setCsrfToken;
    window.getCsrfToken = getCsrfToken;
}