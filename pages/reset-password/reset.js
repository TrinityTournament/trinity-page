// ══════════════════════════════════════════
//  ASTRAX — RESET PASSWORD
// ══════════════════════════════════════════

const params = new URLSearchParams(window.location.search);
const TOKEN  = params.get('token');

// ── VERIFICAR TOKEN AL CARGAR ─────────────

document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) {
        mostrarStep('invalid');
        return;
    }

    try {
        const res  = await fetch(`/astrax-page/api/verify-token.php?token=${encodeURIComponent(TOKEN)}`);
        const data = await res.json();
        mostrarStep(data.valido ? 'form' : 'invalid');
    } catch {
        mostrarStep('invalid');
    }
});

// ── HACER RESET ───────────────────────────

async function hacerReset() {
    const nueva   = document.getElementById('pwd-nueva').value;
    const confirm = document.getElementById('pwd-confirm').value;
    const msg     = document.getElementById('msg-form');

    if (!nueva || !confirm) {
        mostrarMsg(msg, 'Completá ambos campos.'); return;
    }
    if (nueva.length < 6) {
        mostrarMsg(msg, 'La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (nueva !== confirm) {
        mostrarMsg(msg, 'Las contraseñas no coinciden.'); return;
    }

    try {
        const res  = await fetch('/astrax-page/api/do-reset.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token: TOKEN, nueva_password: nueva }),
        });
        const data = await res.json();

        if (data.ok) {
            mostrarStep('ok');
        } else {
            mostrarMsg(msg, data.error || 'Error al restablecer. Intentá nuevamente.');
        }
    } catch {
        mostrarMsg(msg, 'No se pudo conectar con el servidor.');
    }
}

// ── TOGGLE PASSWORD ───────────────────────

function togglePwd(id, icon) {
    const input    = document.getElementById(id);
    input.type     = input.type === 'password' ? 'text' : 'password';
    icon.style.opacity = input.type === 'text' ? '1' : '0.55';
}

// ── HELPERS ───────────────────────────────

function mostrarStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + step).classList.add('active');
}

function mostrarMsg(el, texto) {
    el.textContent = texto;
    el.className   = 'msg';
}
