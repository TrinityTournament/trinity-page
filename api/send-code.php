<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Enviar código de verificación
//  Soporta dos flujos:
//    1. Email    → body: { email }
//    2. Teléfono → body: { telefono }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── LEER BODY ─────────────────────────────────────────────
$body            = json_decode(file_get_contents('php://input'), true);
$email           = trim($body['email']           ?? '');
$telefono        = trim($body['telefono']        ?? '');
$cambioPassword  = !empty($body['cambio_password']); // true cuando viene del perfil

// ── GENERAR CÓDIGO ────────────────────────────────────────
$code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

// ══════════════════════════════════════════════════════════
//  FLUJO 1: EMAIL
// ══════════════════════════════════════════════════════════
if ($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'El email no es válido.'], 400);
    }

    $pdo  = db();
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $existe = $stmt->fetch();

    if ($cambioPassword) {
        // Flujo cambio de contraseña: el email DEBE existir
        if (!$existe) {
            json_response(['error' => 'No encontramos una cuenta con ese email.'], 404);
        }
    } else {
        // Flujo registro: el email NO debe existir
        if ($existe) {
            json_response(['error' => 'Este email ya está registrado. Iniciá sesión.'], 409);
        }
    }

    $_SESSION['verification'][$email] = [
        'code'      => $code,
        'expiresAt' => time() + 600,
    ];

    $html = "
        <div style='font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0c1120;border-radius:12px;color:#f0f4ff;'>
            <h1 style='font-size:28px;margin-bottom:8px;'>ASTRAX</h1>
            <p style='color:#6b7a9f;margin-bottom:24px;'>Verificación de cuenta</p>
            <h2 style='font-size:20px;margin-bottom:16px;'>Tu código de verificación</h2>
            <div style='background:#1a6fff;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;'>
                <span style='font-size:36px;font-weight:700;letter-spacing:12px;'>{$code}</span>
            </div>
            <p style='color:#6b7a9f;font-size:14px;'>Expira en 10 minutos. Si no solicitaste este código, ignorá este mensaje.</p>
        </div>
    ";

    $ok = brevo_send($email, 'Tu código de verificación de Astrax', $html);
    if (!$ok) {
        json_response(['error' => 'No se pudo enviar el correo. Intentá nuevamente.'], 500);
    }

    json_response(['ok' => true]);
}

// ══════════════════════════════════════════════════════════
//  FLUJO 2: TELÉFONO (WhatsApp)
// ══════════════════════════════════════════════════════════
if ($telefono) {
    $telNorm = preg_replace('/[^0-9]/', '', $telefono);
    if (strlen($telNorm) < 7) {
        json_response(['error' => 'Número de teléfono inválido.'], 400);
    }

    $pdo  = db();
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE telefono = :tel LIMIT 1');
    $stmt->execute([':tel' => $telNorm]);
    if ($stmt->fetch()) {
        json_response(['error' => 'Este número ya está registrado. Iniciá sesión.'], 409);
    }

    $_SESSION['verification'][$telNorm] = [
        'code'      => $code,
        'expiresAt' => time() + 600,
    ];

    $sent = whatsapp_send($telNorm, "*TRINITY\n\nTu codigo de inicio es: *{$code}*\n\n⏱ Expira en 10 minutos.");
    if (!$sent) {
        json_response(['error' => 'No se pudo enviar el código por WhatsApp. ¿El bot está activo?'], 503);
    }

    json_response(['ok' => true]);
}

// Si no llegó email ni teléfono
json_response(['error' => 'Se requiere email o teléfono.'], 400);
