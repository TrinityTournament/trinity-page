<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Cambiar contraseña (MySQL / PDO)
//  Flujo: código enviado por send-code.php → verificar → actualizar
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

if (empty($_SESSION['astrax_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$body     = json_decode(file_get_contents('php://input'), true);
$email    = trim($body['email']            ?? '');
$code     = trim($body['code']             ?? '');
$newPass  = $body['nueva_password']         ?? '';

if (!$email || !$code || !$newPass) {
    json_response(['error' => 'Faltan datos.'], 400);
}
if (strlen($newPass) < 6) {
    json_response(['error' => 'La contraseña debe tener al menos 6 caracteres.'], 400);
}

// ── VERIFICAR CÓDIGO EN SESIÓN ────────────────────────────
$stored = $_SESSION['verification'][$email] ?? null;

if (!$stored) {
    json_response(['error' => 'No hay un código pendiente. Solicitá uno nuevo.'], 400);
}
if (time() > $stored['expiresAt']) {
    unset($_SESSION['verification'][$email]);
    json_response(['error' => 'El código expiró. Solicitá uno nuevo.'], 400);
}
if ($stored['code'] !== $code) {
    json_response(['error' => 'Código incorrecto.'], 400);
}

// ── CÓDIGO OK: ACTUALIZAR CONTRASEÑA ─────────────────────
unset($_SESSION['verification'][$email]);

$hash = password_hash($newPass, PASSWORD_BCRYPT);
$pdo  = db();
$stmt = $pdo->prepare('UPDATE usuarios SET password = :pass WHERE id = :id');

try {
    $stmt->execute([':pass' => $hash, ':id' => $_SESSION['astrax_user']['id']]);
} catch (PDOException $e) {
    json_response(['error' => 'Error al actualizar la contraseña.'], 500);
}

json_response(['ok' => true]);
