<?php
// TRINITY — Fortnite: vincular cuenta
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

$userId = (int) $_SESSION['trinity_user']['id'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

$username = trim($body['username'] ?? '');
if ($username === '') {
    json_response(['error' => 'Ingresá tu nombre de usuario de Epic Games.'], 400);
}

// Verificar contra la API de Fortnite con curl
$apiKey = $_ENV['FNKEY'] ?? '';
$url    = 'https://fortnite-api.com/v2/stats/br/v2?name=' . urlencode($username);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => $apiKey !== '' ? ["Authorization: $apiKey"] : [],
]);
$raw      = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $httpCode === 0) {
    json_response(['error' => 'No se pudo verificar el usuario. Intentá de nuevo.'], 422);
}

$data = json_decode($raw, true);
if (($data['status'] ?? 0) !== 200) {
    $msg = $httpCode === 403
        ? 'Este perfil es privado. El jugador debe hacer públicas sus estadísticas en el juego.'
        : 'No se encontró ese usuario de Fortnite. Verificá el nombre exacto (sensible a mayúsculas).';
    json_response(['error' => $msg], 422);
}

// Usar el nombre exacto que devuelve la API (respeta mayúsculas)
$confirmedName = $data['data']['account']['name'] ?? $username;

$pdo  = db();
$stmt = $pdo->prepare(
    "INSERT INTO cuentas_videojuego (usuario_id, juego, identificador)
     VALUES (:uid, 'fortnite', :username)
     ON DUPLICATE KEY UPDATE identificador = VALUES(identificador)"
);
$stmt->execute([':uid' => $userId, ':username' => $confirmedName]);

json_response(['ok' => true, 'username' => $confirmedName]);
