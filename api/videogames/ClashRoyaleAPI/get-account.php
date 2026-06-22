<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Clash Royale: obtener cuenta vinculada
//  GET → { ok: true, tag: '#ABC123' | null }
//  Usado por el modal (gameProfile.js) para precargar
//  el campo "Tag" con el valor ya guardado del usuario.
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

requiere_sesion();

$userId = (int) $_SESSION['trinity_user']['id'];

$pdo  = db();
$stmt = $pdo->prepare(
    'SELECT identificador FROM cuentas_videojuego
     WHERE usuario_id = :uid AND juego = :juego
     LIMIT 1'
);
$stmt->execute([':uid' => $userId, ':juego' => 'clashroyale']);
$row = $stmt->fetch();

json_response([
    'ok'  => true,
    'tag' => $row ? '#' . $row['identificador'] : null,
]);
