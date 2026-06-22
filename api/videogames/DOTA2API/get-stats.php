<?php
// TRINITY — Dota 2: estadísticas del jugador
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$apiKey  = $_ENV['SWEBAPI'] ?? '';
$BASEAPI = 'https://api.steampowered.com';
$DOTAPI  = 'https://api.opendota.com';

// ── curl helper ──────────────────────────────────────────────
function curl_get(string $url, array $headers = []): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => $headers,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    return ($raw !== false) ? $raw : null;
}

// ── SteamID64 → AccountID de Dota 2 ─────────────────────────
function steamid64_to_accountid(string $id64): string {
    if (function_exists('bcsub')) {
        return bcsub($id64, '76561197960265728');
    }
    // Fallback para PHP sin bcmath (funciona para la mayoría de IDs)
    return (string)((int)$id64 - 76561197960265728);
}

// ── Resolver vanity URL → SteamID64 ──────────────────────────
// 1. Si ya es SteamID64 de 17 dígitos, lo usa directo.
// 2. Si hay SWEBAPI key, intenta Steam ResolveVanityURL.
// 3. Fallback: OpenDota /api/search (no requiere key).
function resolve_steam_id(string $input, string $apiKey, string $BASEAPI, string $DOTAPI): ?string {
    $input = trim($input);

    // Ya es SteamID64
    if (preg_match('/^\d{17}$/', $input)) {
        return $input;
    }

    // Intento con Steam Web API
    if ($apiKey !== '') {
        $raw = curl_get("$BASEAPI/ISteamUser/ResolveVanityURL/v1/?key=$apiKey&vanityurl=" . urlencode($input));
        if ($raw !== null) {
            $data = json_decode($raw, true);
            if (($data['response']['success'] ?? 0) === 1) {
                return $data['response']['steamid'];
            }
        }
    }

    // Fallback: OpenDota search
    $raw = curl_get("$DOTAPI/api/search?q=" . urlencode($input));
    if ($raw !== null) {
        $results = json_decode($raw, true);
        if (!empty($results) && isset($results[0]['account_id'])) {
            $accId = $results[0]['account_id'];
            if (function_exists('bcadd')) {
                return bcadd((string)$accId, '76561197960265728');
            }
            return (string)($accId + 76561197960265728);
        }
    }

    return null;
}

// ── Obtener SteamID64 ─────────────────────────────────────────
$steamQuery = trim($_GET['steamId'] ?? '');

if ($steamQuery !== '') {
    $steamId64 = resolve_steam_id($steamQuery, $apiKey, $BASEAPI, $DOTAPI);
    if ($steamId64 === null) {
        json_response(['error' => 'No se encontró ese usuario de Steam. Verificá que el nombre sea exacto o usá tu SteamID64.'], 404);
    }
} else {
    requiere_sesion();
    $userId = (int) $_SESSION['trinity_user']['id'];
    $pdo    = db();
    $stmt   = $pdo->prepare(
        'SELECT identificador FROM cuentas_videojuego
         WHERE usuario_id = :uid AND juego = :juego LIMIT 1'
    );
    $stmt->execute([':uid' => $userId, ':juego' => 'dota2']);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Todavía no vinculaste tu cuenta de Dota 2.'], 404);
    }
    $steamId64 = resolve_steam_id($row['identificador'], $apiKey, $BASEAPI, $DOTAPI);
    if ($steamId64 === null) {
        json_response(['error' => 'No se pudo resolver tu cuenta de Steam. Intentá desvincularla y volver a ingresarla.'], 502);
    }
}

$accId = steamid64_to_accountid($steamId64);

// ── Perfil de Steam ───────────────────────────────────────────
$player = [];
if ($apiKey !== '') {
    $raw = curl_get("$BASEAPI/ISteamUser/GetPlayerSummaries/v0002/?key=$apiKey&steamids=$steamId64");
    if ($raw) {
        $profData = json_decode($raw, true);
        $player   = $profData['response']['players'][0] ?? [];
    }
}

// ── Perfil de OpenDota ────────────────────────────────────────
$dotaData = [];
$raw = curl_get("$DOTAPI/api/players/$accId");
if ($raw) $dotaData = json_decode($raw, true) ?? [];

// Usar nombre/avatar de OpenDota si no hay respuesta de Steam
if (empty($player['personaname'])) {
    $player['personaname'] = $dotaData['profile']['personaname'] ?? null;
    $player['avatarfull']  = $dotaData['profile']['avatarfull']  ?? null;
}

// ── Win / Loss ────────────────────────────────────────────────
$wlData = [];
$raw = curl_get("$DOTAPI/api/players/$accId/wl");
if ($raw) $wlData = json_decode($raw, true) ?? [];
$wins   = $wlData['win']  ?? 0;
$losses = $wlData['lose'] ?? 0;
$total  = $wins + $losses;
$wr     = $total > 0 ? round($wins / $total * 100, 1) : null;

// ── Últimas 20 partidas ───────────────────────────────────────
$matchesData = [];
$raw = curl_get("$DOTAPI/api/players/$accId/matches?limit=20");
if ($raw) $matchesData = json_decode($raw, true) ?? [];

// ── Mapa de héroes ────────────────────────────────────────────
$heroMap = [];
$raw = curl_get("$DOTAPI/api/heroes");
if ($raw) {
    foreach ((json_decode($raw, true) ?? []) as $h) {
        $heroMap[$h['id']] = $h['localized_name'];
    }
}

$lastMatches = [];
$totalK = $totalD = $totalA = 0;
foreach ($matchesData as $m) {
    $isRad = ($m['player_slot'] ?? 0) < 128;
    $won   = ($isRad && ($m['radiant_win'] ?? false)) || (!$isRad && !($m['radiant_win'] ?? false));
    $totalK += $m['kills']   ?? 0;
    $totalD += $m['deaths']  ?? 0;
    $totalA += $m['assists'] ?? 0;
    $lastMatches[] = [
        'heroe'       => $heroMap[$m['hero_id'] ?? 0] ?? '—',
        'kills'       => $m['kills']   ?? 0,
        'muertes'     => $m['deaths']  ?? 0,
        'asistencias' => $m['assists'] ?? 0,
        'gano'        => $won,
    ];
}
$cnt    = count($matchesData);
$avgKDA = $totalD > 0 ? round(($totalK + $totalA) / $totalD, 2) : null;

// ── Amigos (solo si hay key) ──────────────────────────────────
$friends = [];
if ($apiKey !== '') {
    $raw = curl_get("$BASEAPI/ISteamUser/GetFriendList/v0001/?key=$apiKey&steamid=$steamId64&relationship=friend");
    if ($raw) {
        $fd  = json_decode($raw, true);
        $top = array_slice($fd['friendslist']['friends'] ?? [], 0, 3);
        if ($top) {
            $ids  = implode(',', array_column($top, 'steamid'));
            $fRaw = curl_get("$BASEAPI/ISteamUser/GetPlayerSummaries/v0002/?key=$apiKey&steamids=$ids");
            if ($fRaw) {
                foreach ((json_decode($fRaw, true)['response']['players'] ?? []) as $f) {
                    $friends[] = ['nombre' => $f['personaname'], 'avatar' => $f['avatarfull']];
                }
            }
        }
    }
}

json_response([
    'ok'     => true,
    'perfil' => [
        'nombre'          => $player['personaname'] ?? ('Jugador #' . $accId),
        'steamId'         => $steamId64,
        'avatar'          => $dotaData['profile']['avatarfull'] ?? ($player['avatarfull'] ?? null),
        'rankTier'        => $dotaData['rank_tier']              ?? null,
        'mmr'             => $dotaData['mmr_estimate']['estimate'] ?? null,
        'totalPartidas'   => $total,
        'victorias'       => $wins,
        'derrotas'        => $losses,
        'winRate'         => $wr,
        'avgKills'        => $cnt > 0 ? round($totalK / $cnt, 1) : null,
        'avgDeaths'       => $cnt > 0 ? round($totalD / $cnt, 1) : null,
        'avgAssists'      => $cnt > 0 ? round($totalA / $cnt, 1) : null,
        'avgKDA'          => $avgKDA,
        'ultimasPartidas' => $lastMatches,
        'amigos'          => $friends,
    ],
]);
