<?php
// TRINITY — Fortnite: estadísticas del jugador
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$usernameQuery = trim($_GET['username'] ?? '');

if ($usernameQuery !== '') {
    $username = $usernameQuery;
} else {
    requiere_sesion();
    $userId = (int) $_SESSION['trinity_user']['id'];
    $pdo  = db();
    $stmt = $pdo->prepare(
        'SELECT identificador FROM cuentas_videojuego
         WHERE usuario_id = :uid AND juego = :juego LIMIT 1'
    );
    $stmt->execute([':uid' => $userId, ':juego' => 'fortnite']);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Todavía no vinculaste tu cuenta de Fortnite.'], 404);
    }
    $username = $row['identificador'];
}

// La key viene via $_ENV (cargado por Dotenv en config.php)
$apiKey = $_ENV['FNKEY'] ?? '';
$url    = 'https://fortnite-api.com/v2/stats/br/v2?name=' . urlencode($username);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => $apiKey !== '' ? ["Authorization: $apiKey"] : [],
]);
$raw     = curl_exec($ch);
$errCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $errCode === 0) {
    json_response(['error' => 'No se pudo contactar la API de Fortnite.'], 502);
}

$data = json_decode($raw, true);
if (($data['status'] ?? 0) !== 200) {
    // status 403 = perfil privado; 404 = usuario no existe
    $msg = $errCode === 403
        ? 'Este perfil de Fortnite es privado. El jugador debe hacer públicas sus estadísticas en el juego.'
        : 'No se encontró ese usuario de Fortnite. Verificá que el nombre sea exacto.';
    json_response(['error' => $msg], $errCode === 403 ? 403 : 404);
}

$profile  = $data['data'] ?? [];
$statsAll = $profile['stats']['all']           ?? [];
$statsKM  = $profile['stats']['keyboardMouse'] ?? [];
$statsGP  = $profile['stats']['gamepad']       ?? [];
$bp       = $profile['battlePass']             ?? [];

function extractMode($m) {
    if (!$m) return null;
    return [
        'matches'       => $m['matches']       ?? 0,
        'wins'          => $m['wins']           ?? 0,
        'kills'         => $m['kills']          ?? 0,
        'deaths'        => $m['deaths']         ?? 0,
        'kd'            => $m['kd']             ?? null,
        'winRate'       => $m['winRate']        ?? null,
        'minutesPlayed' => $m['minutesPlayed']  ?? 0,
    ];
}

json_response([
    'ok'     => true,
    'perfil' => [
        'nombre'          => $profile['account']['name'] ?? $username,
        'battlePassLevel' => $bp['level']    ?? null,
        'battlePassProg'  => $bp['progress'] ?? null,
        'overall'         => extractMode($statsAll['overall'] ?? null),
        'solo'            => extractMode($statsKM['solo']     ?? null),
        'duo'             => extractMode($statsKM['duo']      ?? null),
        'squad'           => extractMode($statsKM['squad']    ?? null),
        'ltm'             => extractMode($statsKM['ltm']      ?? null),
        'soloGP'          => extractMode($statsGP['solo']     ?? null),
        'duoGP'           => extractMode($statsGP['duo']      ?? null),
        'squadGP'         => extractMode($statsGP['squad']    ?? null),
    ],
]);
