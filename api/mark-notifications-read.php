<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Marcar notificaciones como leídas
//
//  POST /api/mark-notifications-read.php
//  Body: { id: int }        → marca una sola
//        { all: true }      → marca todas las del usuario
//
//  Respuesta: { ok: true }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = (int) $_SESSION['trinity_user']['id'];
$body   = json_decode(file_get_contents('php://input'), true);
$pdo    = db();

if (!empty($body['all'])) {
    // Marcar todas como leídas
    $stmt = $pdo->prepare(
        "UPDATE notificaciones SET leido = 1 WHERE usuario_id = :uid AND leido = 0"
    );
    $stmt->execute([':uid' => $userId]);

} elseif (!empty($body['id'])) {
    // Marcar una sola (verificar que pertenezca al usuario)
    $stmt = $pdo->prepare(
        "UPDATE notificaciones SET leido = 1 WHERE id = :id AND usuario_id = :uid"
    );
    $stmt->execute([':id' => (int) $body['id'], ':uid' => $userId]);

} else {
    json_response(['error' => 'Se requiere "id" o "all".'], 400);
}

json_response(['ok' => true]);
