<?php
// TRINITY — Brawl Stars: estadísticas del jugador
// GET ?tag=#VOYUUUO → { ok: true, perfil: {...} }
// GET (sin params)  → usa la cuenta vinculada del usuario en sesión
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$tagQuery = strtoupper(trim($_GET['tag'] ?? ''));

if ($tagQuery !== '') {
    $tag = ltrim($tagQuery, '#');
} else {
    requiere_sesion();
    $userId = (int) $_SESSION['trinity_user']['id'];
    $pdo  = db();
    $stmt = $pdo->prepare(
        'SELECT identificador FROM cuentas_videojuego
         WHERE usuario_id = :uid AND juego = :juego LIMIT 1'
    );
    $stmt->execute([':uid' => $userId, ':juego' => 'brawlstars']);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Todavía no vinculaste tu cuenta de Brawl Stars.'], 404);
    }
    $tag = $row['identificador'];
}

$url = "https://sprcll.vercel.app/brawl/players/$tag";
$raw = @file_get_contents($url);
if ($raw === false) {
    json_response(['error' => 'No se pudo contactar la API de Brawl Stars.'], 502);
}
$data = json_decode($raw, true);
$b = $data['data'] ?? null;
if (!$b) {
    json_response(['error' => 'No se encontró ese tag de Brawl Stars.'], 404);
}

$club = isset($b['club']['name']) ? ['nombre' => $b['club']['name'], 'tag' => $b['club']['tag'] ?? ''] : null;

json_response([
    'ok'     => true,
    'perfil' => [
        'nombre'         => $b['name']               ?? null,
        'tag'            => $b['tag']                ?? null,
        'nivel'          => $b['expLevel']           ?? null,
        'trofeos'        => $b['trophies']           ?? 0,
        'maxTrofeos'     => $b['highestTrophies']    ?? null,
        'victorias3v3'   => $b['3vs3Victories']      ?? 0,
        'victoriasSolo'  => $b['soloVictories']      ?? 0,
        'victoriasDuo'   => $b['duoVictories']       ?? 0,
        'rangoNombre'    => $b['rankedRankName']      ?? null,
        'elo'            => $b['rankedElo']           ?? null,
        'maxElo'         => $b['highestAllTimeRankedElo'] ?? null,
        'club'           => $club,
    ],
]);
