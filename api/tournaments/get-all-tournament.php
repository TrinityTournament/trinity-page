<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Admin: listar todos los torneos
//  Solo accesible para rol 'admin'
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

requiere_rol('admin');

$pdo  = db();
$stmt = $pdo->query(
    "SELECT t.id, t.titulo, t.deporte, t.estado, t.fecha_inicio,
            t.max_participantes, t.creado_en,
            u.nombre  AS organizador_nombre,
            u.usuario AS organizador_usuario
     FROM   torneos  t
     JOIN   usuarios u ON u.id = t.organizador_id
     ORDER  BY t.creado_en DESC"
);

$labels = [
    'en_creacion' => 'En creación',
    'abierto'     => 'Abierto',
    'en_curso'    => 'En curso',
    'finalizado'  => 'Finalizado',
    'cancelado'   => 'Cancelado',
];

$torneos = $stmt->fetchAll();
foreach ($torneos as &$t) {
    $t['id']          = (int) $t['id'];
    $t['estado_label'] = $labels[$t['estado']] ?? ucfirst($t['estado']);
}

json_response(['ok' => true, 'torneos' => $torneos]);