<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Solicitar reset de contraseña
//  Genera token seguro, lo guarda en DB y envía email con link
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$body  = json_decode(file_get_contents('php://input'), true);
$email = trim($body['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Email inválido.'], 400);
}

$pdo  = db();

// Verificar que el email exista
$stmt = $pdo->prepare('SELECT id, telefono FROM usuarios WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// Respondemos igual aunque no exista — evita enumerar emails (seguridad)
if (!$user) {
    json_response(['ok' => true]);
}

$userId = $user['id'];

// Invalidar tokens anteriores del usuario
$pdo->prepare('UPDATE password_resets SET usado = 1 WHERE usuario_id = :uid')
    ->execute([':uid' => $userId]);

// Generar token seguro
$token    = bin2hex(random_bytes(32)); // 64 chars hex
$expira   = date('Y-m-d H:i:s', time() + 900); // 15 minutos

$ins = $pdo->prepare(
    'INSERT INTO password_resets (usuario_id, token, expira_en) VALUES (:uid, :token, :expira)'
);
$ins->execute([':uid' => $userId, ':token' => $token, ':expira' => $expira]);

// URL de reset — ajustá el dominio en producción
$baseUrl  = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$resetUrl = $baseUrl . '/astrax-page/pages/reset-password/index.html?token=' . $token;

$html = "
<div style='font-family:sans-serif;max-width:520px;margin:auto;padding:40px;background:#0c1120;border-radius:14px;color:#f0f4ff;'>
    <h1 style='font-size:26px;letter-spacing:6px;margin-bottom:4px;'>ASTRAX</h1>
    <p style='color:#6b7a9f;margin-bottom:28px;font-size:13px;'>Plataforma de competencia</p>
    <h2 style='font-size:18px;font-weight:700;margin-bottom:12px;'>Restablecer contraseña</h2>
    <p style='color:#a0aec0;font-size:14px;line-height:1.7;margin-bottom:24px;'>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br>
        Hacé click en el botón para continuar. El link expira en <strong>15 minutos</strong>.
    </p>
    <a href='{$resetUrl}' style='display:inline-block;background:#1a6fff;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;'>
        Restablecer contraseña →
    </a>
    <p style='color:#6b7a9f;font-size:12px;margin-top:24px;line-height:1.6;'>
        Si no solicitaste este cambio, ignorá este mensaje. Tu contraseña no será modificada.<br>
        Por seguridad, este link solo puede usarse una vez.
    </p>
</div>
";

$ok = brevo_send($email, 'Restablecer contraseña — Astrax', $html);

if (!$ok) {
    json_response(['error' => 'No se pudo enviar el correo.'], 500);
}

// ── ENVIAR TAMBIÉN POR WHATSAPP (si el usuario tiene teléfono) ──
$telefono = $user['telefono'] ?? '';
if ($telefono) {
    $waMsg = "*TRINITY*\n\n"
           . "Recibimos una solicitud para cambiar la contraseña de tu cuenta.\n\n"
           . "🔗 {$resetUrl}\n\n"
           . "⏱ Este link expira en 15 minutos y es de uso unico.\n"
           . "Si no fuiste vos, ignorá este mensaje.";
    whatsapp_send($telefono, $waMsg);
}

json_response(['ok' => true]);
