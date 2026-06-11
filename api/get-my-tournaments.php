<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Obtener torneos propios del organizador
//
//  Query param: ?estado=en_creacion  (o vacío para todos)
//  Respuesta: { ok: true, torneos: [...] } | { error: string }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── Verificar sesión ──────────────────────────────────────
if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = (int) $_SESSION['trinity_user']['id'];
$estado = trim($_GET['estado'] ?? '');

$estadosValidos = ['en_creacion', 'abierto', 'en_curso', 'finalizado', 'cancelado'];
$pdo = db();

// ── Construir query ───────────────────────────────────────
if ($estado && in_array($estado, $estadosValidos, true)) {
    $stmt = $pdo->prepare(
        "SELECT id, titulo, deporte, estado, fecha_inicio, max_participantes
         FROM torneos
         WHERE organizador_id = :uid AND estado = :estado
         ORDER BY creado_en DESC"
    );
    $stmt->execute([':uid' => $userId, ':estado' => $estado]);
} else {
    $stmt = $pdo->prepare(
        "SELECT id, titulo, deporte, estado, fecha_inicio, max_participantes
         FROM torneos
         WHERE organizador_id = :uid
         ORDER BY creado_en DESC"
    );
    $stmt->execute([':uid' => $userId]);
}

$torneos = $stmt->fetchAll();

// Agregar etiqueta legible del estado
$labels = [
    'en_creacion' => 'En creación',
    'abierto'     => 'Abierto',
    'en_curso'    => 'En curso',
    'finalizado'  => 'Finalizado',
    'cancelado'   => 'Cancelado',
];

foreach ($torneos as &$t) {
    $t['estado_label'] = $labels[$t['estado']] ?? ucfirst($t['estado']);
}
unset($t);

json_response(['ok' => true, 'torneos' => $torneos]);