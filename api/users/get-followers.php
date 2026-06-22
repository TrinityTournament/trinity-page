<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Obtener lista de seguidos / seguidores
//
//  GET ?user_id=int&tipo=seguidos|seguidores&page=int
//  Respuesta: { ok: true, users: [...], total: int }
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$userId = (int) ($_GET['user_id'] ?? 0);
$tipo   = trim($_GET['tipo']    ?? 'seguidores');
$page   = max(1, (int) ($_GET['page'] ?? 1));
$limit  = 30;
$offset = ($page - 1) * $limit;

if (!$userId) {
    json_response(['error' => 'Se requiere user_id.'], 400);
}
if (!in_array($tipo, ['seguidos', 'seguidores'], true)) {
    json_response(['error' => 'tipo debe ser "seguidos" o "seguidores".'], 400);
}

$pdo = db();

if ($tipo === 'seguidores') {
    // Usuarios que ME siguen (seguidor_id → ellos, seguido_id → yo)
    $sql = '
        SELECT u.id, u.nombre, u.usuario, u.foto_url
        FROM seguidores s
        JOIN usuarios u ON u.id = s.seguidor_id
        WHERE s.seguido_id = :uid
        ORDER BY s.creado_en DESC
        LIMIT :lim OFFSET :off
    ';
    $cntSql = 'SELECT COUNT(*) FROM seguidores WHERE seguido_id = :uid';
} else {
    // Usuarios a los que YO sigo (seguidor_id → yo, seguido_id → ellos)
    $sql = '
        SELECT u.id, u.nombre, u.usuario, u.foto_url
        FROM seguidores s
        JOIN usuarios u ON u.id = s.seguido_id
        WHERE s.seguidor_id = :uid
        ORDER BY s.creado_en DESC
        LIMIT :lim OFFSET :off
    ';
    $cntSql = 'SELECT COUNT(*) FROM seguidores WHERE seguidor_id = :uid';
}

// Total
$cntStmt = $pdo->prepare($cntSql);
$cntStmt->execute([':uid' => $userId]);
$total = (int) $cntStmt->fetchColumn();

// Lista paginada
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
$stmt->bindValue(':lim', $limit,  PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response([
    'ok'    => true,
    'users' => $rows,
    'total' => $total,
    'page'  => $page,
]);