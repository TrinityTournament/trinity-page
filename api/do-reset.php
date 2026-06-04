<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Ejecutar reset de contraseña
//  Valida token, actualiza contraseña, invalida el token
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$body    = json_decode(file_get_contents('php://input'), true);
$token   = trim($body['token']           ?? '');
$newPass = trim($body['nueva_password']  ?? '');

if (!$token || !$newPass) {
    json_response(['error' => 'Faltan datos.'], 400);
}
if (strlen($newPass) < 6) {
    json_response(['error' => 'La contraseña debe tener al menos 6 caracteres.'], 400);
}

$pdo  = db();

// Buscar token válido (no usado, no expirado)
$stmt = $pdo->prepare(
    'SELECT pr.id, pr.usuario_id
     FROM   password_resets pr
     WHERE  pr.token = :token
       AND  pr.usado = 0
       AND  pr.expira_en > NOW()
     LIMIT 1'
);
$stmt->execute([':token' => $token]);
$reset = $stmt->fetch();

if (!$reset) {
    json_response(['error' => 'El link es inválido o ya expiró. Solicitá uno nuevo.'], 400);
}

// Actualizar contraseña
$hash = password_hash($newPass, PASSWORD_BCRYPT);
$pdo->prepare('UPDATE usuarios SET password = :pass WHERE id = :id')
    ->execute([':pass' => $hash, ':id' => $reset['usuario_id']]);

// Invalidar token (single-use)
$pdo->prepare('UPDATE password_resets SET usado = 1 WHERE id = :id')
    ->execute([':id' => $reset['id']]);

json_response(['ok' => true]);
