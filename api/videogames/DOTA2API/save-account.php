<?php
// TRINITY — Dota 2: vincular cuenta Steam
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

validar_csrf();
requiere_sesion();

$userId  = (int) $_SESSION['trinity_user']['id'];
$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$steamId = trim($body['steamId'] ?? '');

if ($steamId === '') {
    json_response(['error' => 'Ingresá tu usuario o Steam ID.'], 400);
}

$apiKey  = $_ENV['SWEBAPI'] ?? '';
$BASEAPI = 'https://api.steampowered.com';
$DOTAPI  = 'https://api.opendota.com';

function curl_get_d2(string $url): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
    $raw = curl_exec($ch);
    curl_close($ch);
    return ($raw !== false) ? $raw : null;
}

// Resolver: si ya es SteamID64 de 17 dígitos, guardarlo directo
$resolvedId = $steamId;

if (!preg_match('/^\d{17}$/', $steamId)) {
    // Intento 1: Steam API con key
    if ($apiKey !== '') {
        $raw = curl_get_d2("$BASEAPI/ISteamUser/ResolveVanityURL/v1/?key=$apiKey&vanityurl=" . urlencode($steamId));
        if ($raw !== null) {
            $data = json_decode($raw, true);
            if (($data['response']['success'] ?? 0) === 1) {
                $resolvedId = $data['response']['steamid'];
            } else {
                // Steam no lo encontró con key → no existe
                json_response(['error' => 'No se encontró ese usuario de Steam.'], 404);
            }
        }
    }

    // Si aún no está resuelto (sin key), intentar OpenDota search
    if ($resolvedId === $steamId) {
        $raw = curl_get_d2("$DOTAPI/api/search?q=" . urlencode($steamId));
        if ($raw !== null) {
            $results = json_decode($raw, true);
            if (!empty($results) && isset($results[0]['account_id'])) {
                $accId = $results[0]['account_id'];
                $resolvedId = function_exists('bcadd')
                    ? bcadd((string)$accId, '76561197960265728')
                    : (string)($accId + 76561197960265728);
            } else {
                json_response(['error' => 'No se encontró ese usuario en Steam/Dota 2. Verificá el nombre o usá tu SteamID64.'], 404);
            }
        } else {
            json_response(['error' => 'No se pudo verificar el usuario. Intentá de nuevo.'], 422);
        }
    }
}

$pdo  = db();
$stmt = $pdo->prepare(
    "INSERT INTO cuentas_videojuego (usuario_id, juego, identificador)
     VALUES (:uid, 'dota2', :sid)
     ON DUPLICATE KEY UPDATE identificador = VALUES(identificador)"
);
$stmt->execute([':uid' => $userId, ':sid' => $resolvedId]);

json_response(['ok' => true, 'steamId' => $resolvedId]);
