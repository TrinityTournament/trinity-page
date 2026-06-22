<?php
// TRINITY — Minecraft: vincular cuenta Java
// POST { username: 'MoonRealm_' } → { ok: true, username, uuid }
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
    json_response(['error' => 'Ingresá tu nametag de Minecraft.'], 400);
}

// Verificar contra la API de Mojang
$url = "https://api.mojang.com/users/profiles/minecraft/" . urlencode($username);
$raw = @file_get_contents($url);
if ($raw === false || $raw === '') {
    json_response(['error' => 'No se encontró ese nametag de Minecraft Java.'], 404);
}
$data = json_decode($raw, true);
if (!isset($data['id'])) {
    json_response(['error' => 'No se encontró ese nametag de Minecraft Java.'], 404);
}

$confirmedName = $data['name'];

$pdo  = db();
$stmt = $pdo->prepare(
    "INSERT INTO cuentas_videojuego (usuario_id, juego, identificador)
     VALUES (:uid, 'minecraft', :username)
     ON DUPLICATE KEY UPDATE identificador = VALUES(identificador)"
);
$stmt->execute([':uid' => $userId, ':username' => $confirmedName]);

json_response(['ok' => true, 'username' => $confirmedName]);
