<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Buscar usuarios
//  GET ?q=texto
//  Retorna hasta 8 usuarios que coincidan con nombre o usuario
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$q = trim($_GET['q'] ?? '');

if (strlen($q) < 2) {
    json_response(['ok' => true, 'users' => []]);
}

// Limitar largo de búsqueda para evitar abusos
$q = mb_substr($q, 0, 50);

$pdo  = db();
$like = '%' . $q . '%';

$stmt = $pdo->prepare(
    "SELECT id, nombre, usuario, foto_url
     FROM   usuarios
     WHERE  usuario LIKE :q OR nombre LIKE :q2
     ORDER BY
         CASE WHEN usuario LIKE :q3 THEN 0 ELSE 1 END,
         nombre ASC
     LIMIT 8"
);
$stmt->execute([
    ':q'  => $like,
    ':q2' => $like,
    ':q3' => $like,
]);

$users = $stmt->fetchAll();

json_response(['ok' => true, 'users' => $users]);
