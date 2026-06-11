<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Verificar token de reset (GET)
//  La página lo llama al cargar para saber si el token es válido
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$token = trim($_GET['token'] ?? '');

if (!$token) {
    json_response(['valido' => false, 'error' => 'Token no proporcionado.']);
}

$pdo  = db();
$stmt = $pdo->prepare(
    'SELECT id FROM password_resets
     WHERE  token = :token AND usado = 0 AND expira_en > NOW()
     LIMIT  1'
);
$stmt->execute([':token' => $token]);

json_response(['valido' => (bool) $stmt->fetch()]);
