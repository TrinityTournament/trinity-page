<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Seguir / dejar de seguir un usuario
//
//  Body: { target_id: int, accion: "follow" | "unfollow" }
//  Respuesta: { ok: true } | { error: string }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── Verificar sesión ──────────────────────────────────────
if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'Debés iniciar sesión para seguir usuarios.'], 401);
}

$followerId = (int) $_SESSION['trinity_user']['id'];
$body       = json_decode(file_get_contents('php://input'), true);
$targetId   = (int) ($body['target_id'] ?? 0);
$accion     = trim($body['accion'] ?? '');

if (!$targetId) {
    json_response(['error' => 'Se requiere target_id.'], 400);
}
if (!in_array($accion, ['follow', 'unfollow'], true)) {
    json_response(['error' => 'Acción inválida. Usá "follow" o "unfollow".'], 400);
}
if ($followerId === $targetId) {
    json_response(['error' => 'No podés seguirte a vos mismo.'], 400);
}

$pdo = db();

// ── Verificar que el target exista ───────────────────────
$check = $pdo->prepare('SELECT id FROM usuarios WHERE id = :id LIMIT 1');
$check->execute([':id' => $targetId]);
if (!$check->fetch()) {
    json_response(['error' => 'Usuario no encontrado.'], 404);
}

// ── Follow / Unfollow ─────────────────────────────────────
if ($accion === 'follow') {
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO seguidores (seguidor_id, seguido_id) VALUES (:follower, :target)'
    );
    $stmt->execute([':follower' => $followerId, ':target' => $targetId]);

    // Notificar solo si realmente se insertó (rowCount > 0 significa que era un follow nuevo)
    if ($stmt->rowCount() > 0) {
        $uStmt = $pdo->prepare('SELECT nombre, usuario FROM usuarios WHERE id = :id LIMIT 1');
        $uStmt->execute([':id' => $followerId]);
        $follower = $uStmt->fetch();

        if ($follower) {
            $nombre  = $follower['nombre'];
            $usuario = $follower['usuario'];
            crear_notificacion(
                $targetId,
                'seguidor',
                "{$nombre} empezó a seguirte",
                "@{$usuario} se sumó a tus seguidores en Trinity.",
                '/pages/profile/acc/view.html?u=' . $followerId
            );
        }
    }
} else {
    $stmt = $pdo->prepare(
        'DELETE FROM seguidores WHERE seguidor_id = :follower AND seguido_id = :target'
    );
    $stmt->execute([':follower' => $followerId, ':target' => $targetId]);
}

json_response(['ok' => true]);