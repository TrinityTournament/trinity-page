<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Login (MySQL / PDO)
//  Acepta email o número de teléfono, sin restricción de dominio
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── LEER BODY ─────────────────────────────────────────────
$body       = json_decode(file_get_contents('php://input'), true);
$identifier = trim($body['identifier'] ?? '');  // email o teléfono
$password   = $body['password']         ?? '';

// ── VALIDAR ───────────────────────────────────────────────
if (!$identifier || !$password) {
    json_response(['error' => 'Faltan datos de usuario.'], 400);
}

// ── DETECTAR SI ES EMAIL O TELÉFONO ──────────────────────
$pdo = db();

if (str_contains($identifier, '@')) {
    // Es email
    $stmt = $pdo->prepare(
        'SELECT id, usuario, nombre, email, telefono, tipo,
                deportes_seleccionados, fecha_nacimiento, password
         FROM   usuarios WHERE email = :val LIMIT 1'
    );
} else {
    // Es teléfono
    $stmt = $pdo->prepare(
        'SELECT id, usuario, nombre, email, telefono, tipo,
                deportes_seleccionados, fecha_nacimiento, password
         FROM   usuarios WHERE telefono = :val LIMIT 1'
    );
}

$stmt->execute([':val' => $identifier]);
$user = $stmt->fetch();

// ── VERIFICAR CONTRASEÑA ──────────────────────────────────
if (!$user || !password_verify($password, $user['password'])) {
    json_response(['error' => 'Credenciales incorrectas.'], 401);
}

// ── GUARDAR SESIÓN ────────────────────────────────────────
unset($user['password']);
$_SESSION['astrax_user'] = $user;

// ── RESPONDER ─────────────────────────────────────────────
json_response([
    'ok'      => true,
    'usuario' => [
        'id'       => $user['id'],
        'usuario'  => $user['usuario'],
        'nombre'   => $user['nombre'],
        'email'    => $user['email'],
        'telefono' => $user['telefono'],
        'tipo'     => $user['tipo'],
        'deportes' => $user['deportes_seleccionados']
                        ? json_decode($user['deportes_seleccionados'], true)
                        : null,
        'fecha_nacimiento' => $user['fecha_nacimiento'],
        // Indica si el perfil está incompleto para redirigir al onboarding
        'perfil_completo'  => !empty($user['tipo']) && !empty($user['deportes_seleccionados']),
    ],
]);