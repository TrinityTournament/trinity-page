<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Obtener perfil público de un usuario
//
//  Query param: ?id=123
//  Responde con datos del perfil + seguidores/seguidos +
//  torneos jugados/ganados + si el viewer ya lo sigue.
//
//  Respuesta: { ok: true, user: {...} } | { error: string }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$targetId = (int) ($_GET['id'] ?? 0);
if (!$targetId) {
    json_response(['error' => 'Se requiere el parámetro id.'], 400);
}

$viewerId = isset($_SESSION['trinity_user'])
    ? (int) $_SESSION['trinity_user']['id']
    : null;

$pdo = db();

// ── Datos del perfil ──────────────────────────────────────
$stmt = $pdo->prepare(
    "SELECT
        u.id,
        u.nombre,
        u.usuario,
        u.pronouns,
        u.descripcion,
        u.foto_url,
        u.tipo,
        u.deportes_seleccionados,
        u.videojuegos_seleccionados,
        u.torneos_jugados,
        u.torneos_ganados,
        -- Seguidores: cuántas personas siguen a este usuario
        (SELECT COUNT(*) FROM seguidores WHERE seguido_id  = u.id) AS seguidores,
        -- Seguidos: a cuántas personas sigue este usuario
        (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) AS seguidos
     FROM usuarios u
     WHERE u.id = :id
     LIMIT 1"
);
$stmt->execute([':id' => $targetId]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'Usuario no encontrado.'], 404);
}

// ── Decodificar JSON de deportes/juegos ───────────────────
if (isset($user['deportes_seleccionados'])) {
    $user['deportes_seleccionados'] = json_decode($user['deportes_seleccionados'], true) ?? [];
} else {
    $user['deportes_seleccionados'] = [];
}

if (isset($user['videojuegos_seleccionados'])) {
    $user['videojuegos_seleccionados'] = json_decode($user['videojuegos_seleccionados'], true) ?? [];
} else {
    $user['videojuegos_seleccionados'] = [];
}

// ── ¿El viewer ya sigue a este usuario? ──────────────────
$user['ya_sigue'] = false;
if ($viewerId && $viewerId !== $targetId) {
    $sigue = $pdo->prepare(
        'SELECT id FROM seguidores WHERE seguidor_id = :viewer AND seguido_id = :target LIMIT 1'
    );
    $sigue->execute([':viewer' => $viewerId, ':target' => $targetId]);
    $user['ya_sigue'] = (bool) $sigue->fetch();
}

// ── Quitar campos sensibles ───────────────────────────────
unset($user['email'], $user['telefono'], $user['password_hash']);

json_response(['ok' => true, 'user' => $user]);