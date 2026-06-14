<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Verificar disponibilidad de email
//  No envía correo. Solo chequea que no esté vinculado
//  a otra cuenta diferente a la del usuario logueado.
//
//  Body: { email: string }
//  Respuesta: { ok: true } | { error: string }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── Verificar sesión ──────────────────────────────────────
if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = $_SESSION['trinity_user']['id'];

// ── Leer body ─────────────────────────────────────────────
$body  = json_decode(file_get_contents('php://input'), true);
$email = trim($body['email'] ?? '');

if (!$email) {
    json_response(['error' => 'Se requiere un email.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'El email no tiene un formato válido.'], 400);
}

// ── Verificar que no pertenezca a OTRA cuenta ─────────────
$pdo  = db();
$stmt = $pdo->prepare(
    'SELECT id FROM usuarios WHERE email = :email AND id != :id LIMIT 1'
);
$stmt->execute([':email' => $email, ':id' => $userId]);

if ($stmt->fetch()) {
    json_response(['error' => 'Este email ya está vinculado a otra cuenta.'], 409);
}

// El email está disponible (o ya es el propio del usuario)
json_response(['ok' => true]);