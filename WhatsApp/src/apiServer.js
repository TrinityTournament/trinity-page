// ══════════════════════════════════════════════════════════
//  TRINITY Bot — Servidor HTTP interno (Express)
//  Recibe llamados desde PHP y los convierte en mensajes WA
//  Escucha en http://localhost:{WA_PORT}
// ══════════════════════════════════════════════════════════

import express from 'express';
import { getSock, isReady } from './lib/botState.js';

const app = express();
app.use(express.json());

// ── MIDDLEWARE: Clave secreta compartida con PHP ───────────
// PHP envía el header X-WA-Secret; el bot lo valida.
app.use((req, res, next) => {
    const expected = process.env.WA_SECRET || '';
    if (!expected) return next();

    const received = req.headers['x-wa-secret'] || '';
    if (received !== expected) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    next();
});

// ── HELPER: Normalizar número ─────────────────────────────
// Acepta: "+598 99 123 456", "098123456", "598099123456", etc.
function normalizePhone(raw) {
    return raw.toString().replace(/[^0-9]/g, '');
}

// ── POST /api/whatsapp/send ───────────────────────────────
// Body: { "phone": "598991234567", "message": "Hola!" }
app.post('/api/whatsapp/send', async (req, res) => {
    if (!isReady()) {
        return res.status(503).json({
            error: 'El bot de WhatsApp aún no está conectado. Intentá de nuevo en unos segundos.'
        });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Se requieren "phone" y "message".' });
    }

    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 7) {
        return res.status(400).json({ error: 'Número de teléfono inválido.' });
    }

    try {
        const sock = getSock();
        const jid  = `${normalized}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });

        console.log(`Mensaje enviado a ${normalized}`);
        res.json({ ok: true });
    } catch (err) {
        console.error('Error enviando mensaje de WhatsApp:', err.message);
        res.status(500).json({ error: 'No se pudo enviar el mensaje.' });
    }
});

// ── POST /api/whatsapp/broadcast ─────────────────────────
// Body: { "phones": ["598991234567", ...], "message": "..." }
// Envía el mismo mensaje a múltiples números (torneos, etc.)
app.post('/api/whatsapp/broadcast', async (req, res) => {
    if (!isReady()) {
        return res.status(503).json({ error: 'Bot no conectado.' });
    }

    const { phones, message } = req.body;

    if (!Array.isArray(phones) || !phones.length || !message) {
        return res.status(400).json({ error: 'Se requieren "phones" (array) y "message".' });
    }

    const sock    = getSock();
    const results = { ok: 0, fail: 0, errors: [] };

    for (const phone of phones) {
        const normalized = normalizePhone(phone);
        if (!normalized) continue;
        try {
            await sock.sendMessage(`${normalized}@s.whatsapp.net`, { text: message });
            results.ok++;
            // Pequeña pausa para evitar spam/ban
            await new Promise(r => setTimeout(r, 800));
        } catch (err) {
            results.fail++;
            results.errors.push({ phone: normalized, error: err.message });
        }
    }

    console.log(`Broadcast enviado: ${results.ok} OK, ${results.fail} fallidos.`);
    res.json({ ok: true, results });
});

// ── GET /api/whatsapp/status ──────────────────────────────
// Health check — PHP puede verificar si el bot está vivo
app.get('/api/whatsapp/status', (_req, res) => {
    res.json({ connected: isReady() });
});

// ── Iniciar servidor ──────────────────────────────────────
export function startApiServer(port = 3001) {
    app.listen(port, '127.0.0.1', () => {
        console.log(`API interna del bot escuchando en http://127.0.0.1:${port}`);
    });
}
