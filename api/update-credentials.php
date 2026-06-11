<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Actualizar credenciales
//
//  Flujo EMAIL:
//    Body: { email: string }
//    → Solo verifica disponibilidad y actualiza. Sin código.
//
//  Flujo TELÉFONO:
//    Paso 1 — send-code.php envía el código por WhatsApp.
//    Paso 2 — Body: { telefono: string, code: string }
//    → Verifica el código OTP en sesión y actualiza.
//
//  Respuesta: { ok: true } | { error: string }
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── Verificar sesión ──────────────────────────────────────
if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = $_SESSION['trinity_user']['id'];
$body   = json_decode(file_get_contents('php://input'), true);

$email    = trim($body['email']    ?? '');
$telefono = trim($body['telefono'] ?? '');
$code     = trim($body['code']     ?? '');

$pdo = db();

// ══════════════════════════════════════════════════════════
//  FLUJO EMAIL — Solo actualizar, sin enviar correo
// ══════════════════════════════════════════════════════════
if ($email && !$telefono) {

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'El email no tiene un formato válido.'], 400);
    }

    // Verificar que no esté tomado por otra cuenta
    $check = $pdo->prepare(
        'SELECT id FROM usuarios WHERE email = :email AND id != :id LIMIT 1'
    );
    $check->execute([':email' => $email, ':id' => $userId]);
    if ($check->fetch()) {
        json_response(['error' => 'Este email ya está vinculado a otra cuenta.'], 409);
    }

    // Actualizar
    $stmt = $pdo->prepare('UPDATE usuarios SET email = :email WHERE id = :id');
    try {
        $stmt->execute([':email' => $email, ':id' => $userId]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_response(['error' => 'Este email ya está registrado.'], 409);
        }
        json_response(['error' => 'Error al actualizar el email.'], 500);
    }

    $_SESSION['trinity_user']['email'] = $email;
    json_response(['ok' => true]);
}

// ══════════════════════════════════════════════════════════
//  FLUJO TELÉFONO — Verificar código OTP y actualizar
// ══════════════════════════════════════════════════════════
if ($telefono && $code) {

    // Normalizar teléfono (solo dígitos)
    $telNorm = preg_replace('/[^0-9]/', '', $telefono);
    if (strlen($telNorm) < 7) {
        json_response(['error' => 'Número de teléfono inválido.'], 400);
    }

    // Verificar código en sesión
    $stored = $_SESSION['verification'][$telNorm] ?? null;

    if (!$stored) {
        json_response(['error' => 'No hay un código pendiente para este número.'], 400);
    }
    if (time() > $stored['expiresAt']) {
        unset($_SESSION['verification'][$telNorm]);
        json_response(['error' => 'El código ha expirado. Solicitá uno nuevo.'], 400);
    }
    if ($stored['code'] !== $code) {
        json_response(['error' => 'Código incorrecto. Intentá de nuevo.'], 400);
    }

    // Código válido: limpiar sesión
    unset($_SESSION['verification'][$telNorm]);

    // Verificar que el número no esté tomado por otra cuenta
    $check = $pdo->prepare(
        'SELECT id FROM usuarios WHERE telefono = :tel AND id != :id LIMIT 1'
    );
    $check->execute([':tel' => $telNorm, ':id' => $userId]);
    if ($check->fetch()) {
        json_response(['error' => 'Este número ya está vinculado a otra cuenta.'], 409);
    }

    // Actualizar
    $stmt = $pdo->prepare('UPDATE usuarios SET telefono = :tel WHERE id = :id');
    try {
        $stmt->execute([':tel' => $telNorm, ':id' => $userId]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_response(['error' => 'Este número ya está registrado.'], 409);
        }
        json_response(['error' => 'Error al actualizar el teléfono.'], 500);
    }

    $_SESSION['trinity_user']['telefono'] = $telNorm;
    json_response(['ok' => true]);
}

// Si no llegó ningún campo reconocido
json_response(['error' => 'Datos insuficientes. Se requiere email o (telefono + code).'], 400);