<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Obtener notificaciones del usuario logueado
//
//  GET /api/get-notifications.php
//      ?page=1          (default 1)
//      &limit=20        (default 20, max 50)
//
//  Respuesta: { ok, notificaciones: [...], no_leidas: int, total: int }
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = (int) $_SESSION['trinity_user']['id'];
$page   = max(1, (int) ($_GET['page']  ?? 1));
$limit  = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$pdo = db();

// Contador de no leídas
$stmtCount = $pdo->prepare(
    "SELECT COUNT(*) FROM notificaciones WHERE usuario_id = :uid AND leido = 0"
);
$stmtCount->execute([':uid' => $userId]);
$noLeidas = (int) $stmtCount->fetchColumn();

// Lista paginada
// CONVERT_TZ asegura que el timestamp salga en UTC real,
// así el 'Z' que se agrega es correcto y JS no suma offset.
$stmtList = $pdo->prepare(
    "SELECT id, tipo, titulo, mensaje, link, leido,
            DATE_FORMAT(
                CONVERT_TZ(creado_en, @@session.time_zone, '+00:00'),
                '%Y-%m-%dT%TZ'
            ) AS creado_en
     FROM   notificaciones
     WHERE  usuario_id = :uid
     ORDER  BY creado_en DESC
     LIMIT  :limit OFFSET :offset"
);
$stmtList->bindValue(':uid',    $userId, PDO::PARAM_INT);
$stmtList->bindValue(':limit',  $limit,  PDO::PARAM_INT);
$stmtList->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmtList->execute();
$notifs = $stmtList->fetchAll();

// Cast types
foreach ($notifs as &$n) {
    $n['id']    = (int) $n['id'];
    $n['leido'] = (bool) $n['leido'];
}
unset($n);

json_response([
    'ok'             => true,
    'notificaciones' => $notifs,
    'no_leidas'      => $noLeidas,
    'page'           => $page,
]);