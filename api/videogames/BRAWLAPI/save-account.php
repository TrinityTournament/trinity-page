<?php
// TRINITY — Brawl Stars: vincular cuenta
// POST { tag: '#VOYUUUO' } → { ok: true, tag }
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

$tagCrudo = strtoupper(trim($body['tag'] ?? ''));
$tag = ltrim($tagCrudo, '#');

if ($tag === '' || !preg_match('/^[0-9A-Z]{5,12}$/', $tag)) {
    json_response(['error' => 'El tag no tiene un formato válido. Ejemplo: #VOYUUUO'], 400);
}

// Verificar contra la API proxy de Brawl Stars
$url = "https://sprcll.vercel.app/brawl/players/$tag";
$raw = @file_get_contents($url);
if ($raw === false) {
    json_response(['error' => 'No se pudo verificar el tag. Intentá de nuevo.'], 422);
}
$data = json_decode($raw, true);
if (!isset($data['data']['tag'])) {
    json_response(['error' => 'No se encontró ese tag de Brawl Stars.'], 404);
}

$pdo  = db();
$stmt = $pdo->prepare(
    "INSERT INTO cuentas_videojuego (usuario_id, juego, identificador)
     VALUES (:uid, 'brawlstars', :tag)
     ON DUPLICATE KEY UPDATE identificador = VALUES(identificador)"
);
$stmt->execute([':uid' => $userId, ':tag' => $tag]);

json_response(['ok' => true, 'tag' => '#' . $tag]);
