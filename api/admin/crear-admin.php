<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Promover primer administrador
//
//  Permite asignar rol 'admin' sin estar logueado,
//  autenticado únicamente con la ADMIN_KEY del .env.
//  Útil para el primer despliegue.
//
//  POST con header X-Admin-Key: <tu_clave>
//  Body: { "id": 5 }          (por ID de usuario)
//     o: { "usuario": "smoky" } (por @usuario)
//     o: { "email": "a@b.com" } (por email)
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── Verificar ADMIN_KEY ────────────────────────────────────
$adminKey = ADMIN_KEY;
if (!$adminKey) {
    json_response(['error' => 'ADMIN_KEY no configurada en el servidor.'], 500);
}

$recibida = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if (!hash_equals($adminKey, $recibida)) {
    json_response(['error' => 'Clave de administrador incorrecta.'], 401);
}

// ── Leer body ──────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);

$pdo = db();

if (!empty($body['id'])) {
    $stmt = $pdo->prepare("SELECT id, usuario FROM usuarios WHERE id = :v LIMIT 1");
    $stmt->execute([':v' => (int) $body['id']]);
} elseif (!empty($body['usuario'])) {
    $stmt = $pdo->prepare("SELECT id, usuario FROM usuarios WHERE usuario = :v LIMIT 1");
    $stmt->execute([':v' => trim($body['usuario'])]);
} elseif (!empty($body['email'])) {
    $stmt = $pdo->prepare("SELECT id, usuario FROM usuarios WHERE email = :v LIMIT 1");
    $stmt->execute([':v' => trim($body['email'])]);
} else {
    json_response(['error' => 'Indicá "id", "usuario" o "email" del usuario a promover.'], 400);
}

$user = $stmt->fetch();
if (!$user) {
    json_response(['error' => 'Usuario no encontrado.'], 404);
}

$upd = $pdo->prepare("UPDATE usuarios SET rol = 'admin' WHERE id = :id");
$upd->execute([':id' => $user['id']]);

json_response([
    'ok'      => true,
    'mensaje' => "@{$user['usuario']} ahora es administrador.",
]);