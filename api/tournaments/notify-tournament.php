<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Notificaciones de torneos (admin)
//  Crea notificaciones en-app + email + WhatsApp opt-in
//  para los usuarios objetivo.
//
//  Seguridad: requiere ADMIN_KEY en el header X-Admin-Key
//  Modo "test": envía WhatsApp directo a test_phone (útil
//  para probar el bot sin crear notificaciones reales).
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

// ── AUTENTICACIÓN ADMIN ───────────────────────────────────
$adminKey = $_ENV['ADMIN_KEY'] ?? parse_ini_file(__DIR__ . '/../.env')['ADMIN_KEY'] ?? '';
$received = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';

if ($adminKey && $received !== $adminKey) {
    json_response(['error' => 'No autorizado.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── LEER BODY ─────────────────────────────────────────────
$body    = json_decode(file_get_contents('php://input'), true);

$titulo  = trim($body['titulo']      ?? '');
$desc    = trim($body['descripcion'] ?? '');
$fecha   = trim($body['fecha']       ?? '');
$deporte = trim($body['deporte']     ?? '');
$target  = trim($body['target']      ?? 'all');
$testTel = trim($body['test_phone']  ?? '');

if (!$titulo || !$desc) {
    json_response(['error' => 'Se requieren "titulo" y "descripcion".'], 400);
}

// ── MODO TEST: envío directo al número de prueba ──────────
if ($target === 'test') {
    if (!$testTel) {
        json_response(['error' => 'Indicá "test_phone" para el modo test.'], 400);
    }

    $emoji = match(strtolower($deporte)) {
        'fútbol', 'futbol'       => '⚽',
        'basketball'             => '🏀',
        'volleyball'             => '🏐',
        'tenis'                  => '🎾',
        'natación', 'natacion'   => '🏊',
        'atletismo'              => '🏃',
        'valorant'               => '🎯',
        'lol'                    => '🧙',
        'fortnite'               => '🔫',
        default                  => '🏆',
    };

    $waMensaje  = "{$emoji} *TRINITY* — Nuevo torneo\n\n";
    $waMensaje .= "*{$titulo}*\n{$desc}";
    if ($fecha)   $waMensaje .= "\n📅 Fecha: {$fecha}";
    if ($deporte) $waMensaje .= "\n🎮 Disciplina: {$deporte}";
    $waMensaje .= "\n\n¡Inscribite ahora en " . APP_URL . "!";

    $ok = whatsapp_send($testTel, $waMensaje);
    json_response([
        'ok'      => $ok,
        'mensaje' => $ok ? "Mensaje de prueba enviado a {$testTel}." : 'El bot de WhatsApp no respondió.',
        'mode'    => 'test',
    ]);
}

// ── EMOJI DEL DEPORTE ─────────────────────────────────────
$emoji = match(strtolower($deporte)) {
    'fútbol', 'futbol'     => '⚽',
    'basketball'           => '🏀',
    'volleyball'           => '🏐',
    'tenis'                => '🎾',
    'natación', 'natacion' => '🏊',
    'atletismo'            => '🏃',
    'valorant'             => '🎯',
    'lol'                  => '🧙',
    'fortnite'             => '🔫',
    default                => '🏆',
};

// ── OBTENER USUARIOS OBJETIVO (id + email + telefono + notif_whatsapp) ────
$pdo = db();

if ($target === 'deporte' && $deporte) {
    $stmt = $pdo->prepare(
        "SELECT id, email, telefono, notif_whatsapp
         FROM   usuarios
         WHERE  JSON_CONTAINS(deportes_seleccionados, :deporte)"
    );
    $stmt->execute([':deporte' => json_encode($deporte)]);
} else {
    $stmt = $pdo->query(
        "SELECT id, email, telefono, notif_whatsapp FROM usuarios"
    );
}

$usuarios = $stmt->fetchAll();

if (empty($usuarios)) {
    json_response([
        'ok'       => true,
        'mensaje'  => 'No hay usuarios que cumplan el criterio.',
        'enviados' => 0,
    ]);
}

// ── CONSTRUIR TEXTOS ──────────────────────────────────────
$mensajeBase = $desc;
if ($fecha)   $mensajeBase .= " — Fecha: {$fecha}";
if ($deporte) $mensajeBase .= " — Disciplina: {$deporte}.";

// HTML para email
$linkHtml = "<p style='margin-top:16px;'><a href='" . APP_URL . "' style='color:#c0000a;font-weight:bold;'>Ver torneos en Trinity →</a></p>";
$htmlEmail = "
    <div style='font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f0000;color:#f5f0f0;border-radius:10px;overflow:hidden;'>
        <div style='background:#c0000a;padding:16px 24px;'>
            <h1 style='margin:0;font-size:20px;letter-spacing:3px;'>TRINITY</h1>
        </div>
        <div style='padding:24px;'>
            <h2 style='margin:0 0 8px;font-size:17px;'>{$emoji} {$titulo}</h2>
            <p style='margin:0;color:#c0a0a0;font-size:14px;'>{$mensajeBase}</p>
            {$linkHtml}
        </div>
        <div style='padding:12px 24px;border-top:1px solid rgba(180,0,0,0.2);font-size:11px;color:#8a6a6a;'>
            Recibiste esta notificación de Trinity. Para administrar tus preferencias, ingresá a Configuración.
        </div>
    </div>
";

// Mensaje de WhatsApp
$waMensaje  = "{$emoji} *TRINITY* — Nuevo torneo\n\n";
$waMensaje .= "*{$titulo}*\n{$desc}";
if ($fecha)   $waMensaje .= "\n📅 Fecha: {$fecha}";
if ($deporte) $waMensaje .= "\n🎮 Disciplina: {$deporte}";
$waMensaje .= "\n\n¡Inscribite ahora en " . APP_URL . "!";

// ── INSERTAR NOTIFICACIONES EN BATCH ─────────────────────
$insertStmt = $pdo->prepare(
    "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
     VALUES (:uid, 'torneo_anuncio', :titulo, :mensaje)"
);

$phonesWa = [];  // teléfonos de usuarios con opt-in de WhatsApp
$ok       = 0;

foreach ($usuarios as $u) {
    try {
        $insertStmt->execute([
            ':uid'     => (int) $u['id'],
            ':titulo'  => $titulo,
            ':mensaje' => $mensajeBase,
        ]);
        $ok++;

        // Email (si tiene)
        if (!empty($u['email'])) {
            brevo_send($u['email'], "{$emoji} {$titulo}", $htmlEmail);
        }

        // Acumular teléfonos WhatsApp
        if (!empty($u['notif_whatsapp']) && !empty($u['telefono'])) {
            $phoneClean = preg_replace('/[^0-9]/', '', $u['telefono']);
            if (strlen($phoneClean) >= 7) {
                $phonesWa[] = $phoneClean;
            }
        }
    } catch (\Throwable $e) {
        error_log('[notify-tournament] Error usuario ' . $u['id'] . ': ' . $e->getMessage());
    }
}

// ── BROADCAST WHATSAPP EN UNA SOLA LLAMADA ────────────────
$waSent = false;
if (!empty($phonesWa)) {
    $waSent = whatsapp_broadcast($phonesWa, $waMensaje);
}

json_response([
    'ok'         => true,
    'enviados'   => $ok,
    'wa_enviado' => $waSent,
    'wa_count'   => count($phonesWa),
    'mensaje'    => "Notificación enviada a {$ok} usuario(s). WhatsApp: " . count($phonesWa) . " opt-in(s).",
]);
