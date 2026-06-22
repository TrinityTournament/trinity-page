<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Clash Royale: estadísticas del jugador
//
//  GET (sin params)   → usa la cuenta vinculada del usuario en sesión
//  GET ?tag=#ABC123   → consulta un tag puntual (no requiere que
//                       esté guardado, lo usa p.ej. el modal antes
//                       de confirmar el guardado)
//
//  Respuesta: { ok: true, perfil: {...} } | { error: string }
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';
require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$tagQuery = trim($_GET['tag'] ?? '');

if ($tagQuery !== '') {
    // Consulta puntual: no hace falta sesión ni cuenta guardada.
    $tag = cr_normalizar_tag($tagQuery);
    if ($tag === null) {
        json_response(['error' => 'El tag no tiene un formato válido.'], 400);
    }
} else {
    // Sin tag explícito: usar la cuenta vinculada del usuario logueado.
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

    if (!$row) {
        json_response(['error' => 'Todavía no vinculaste tu cuenta de Clash Royale.'], 404);
    }

    $tag = $row['identificador'];
}

try {
    $perfil = cr_fetch_profile($tag);
} catch (RuntimeException $e) {
    json_response(['error' => $e->getMessage()], 422);
}

json_response([
    'ok'     => true,
    'perfil' => cr_build_stats_payload($perfil),
]);
