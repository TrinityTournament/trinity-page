<?php
// TRINITY — Minecraft: perfil del jugador (UUID + skin links)
// GET ?username=MoonRealm_ → { ok: true, perfil: { nombre, uuid } }
// GET (sin params) → usa la cuenta vinculada
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
    $stmt->execute([':uid' => $userId, ':juego' => 'minecraft']);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Todavía no vinculaste tu cuenta de Minecraft.'], 404);
    }
    $username = $row['identificador'];
}

$url = "https://api.mojang.com/users/profiles/minecraft/" . urlencode($username);
$raw = @file_get_contents($url);
if ($raw === false || $raw === '') {
    json_response(['error' => 'No se encontró ese nametag de Minecraft Java.'], 404);
}
$data = json_decode($raw, true);
if (!isset($data['id'])) {
    json_response(['error' => 'No se encontró ese nametag de Minecraft Java.'], 404);
}

// Formatear UUID con guiones
$rawUuid = $data['id'];
$uuid = preg_replace('/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/', '$1-$2-$3-$4-$5', $rawUuid);

json_response([
    'ok'     => true,
    'perfil' => [
        'nombre' => $data['name'],
        'uuid'   => $uuid,
    ],
]);
