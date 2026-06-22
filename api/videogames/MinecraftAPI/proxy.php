<?php
// ══════════════════════════════════════════
//  Proxy para la API de Mojang
//  El browser no puede llamar a Mojang directo (CORS).
//  Este archivo corre en el servidor Apache, hace la
//  request server-side y devuelve el resultado al browser.
// ══════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$nick = trim($_GET['nick'] ?? '');

if (!$nick) {
    http_response_code(400);
    echo json_encode(['error' => 'Nick requerido']);
    exit;
}

// Validación básica: solo letras, números y guión bajo (formato Minecraft)
if (!preg_match('/^[a-zA-Z0-9_]{1,16}$/', $nick)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nick inválido']);
    exit;
}

$url = "https://api.mojang.com/users/profiles/minecraft/" . urlencode($nick);

$ctx = stream_context_create([
    'http' => [
        'timeout'       => 8,
        'ignore_errors' => true,
    ]
]);

$body = file_get_contents($url, false, $ctx);

// Mojang devuelve 204 o body vacío si el jugador no existe
if (!$body) {
    http_response_code(404);
    echo json_encode(['error' => 'Jugador no encontrado']);
    exit;
}

// Reenviar la respuesta de Mojang tal cual
echo $body;