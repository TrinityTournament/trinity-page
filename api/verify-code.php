<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Verificar código y crear cuenta (MySQL / PDO)
//  Registro mínimo: nombre, usuario, password, email/tel + código
//  fecha_nacimiento, tipo y deportes quedan NULL → se completan desde perfil
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── LEER BODY ─────────────────────────────────────────────
$body    = json_decode(file_get_contents('php://input'), true);

$email   = trim($body['email']    ?? '');
$tel     = trim($body['telefono'] ?? '');
$code    = trim($body['code']     ?? '');
$nombre  = trim($body['nombre']   ?? '');
$usuario = trim($body['usuario']  ?? '');
$password = $body['password']      ?? '';

// ── VALIDAR CAMPOS MÍNIMOS ────────────────────────────────
// Validar formato nombre: letras, números y espacios
if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/u', $nombre)) {
    json_response(['error' => 'El nombre solo puede contener letras, números y espacios.'], 400);
}

// Validar formato usuario: solo letras y números, sin espacios ni especiales
if (!preg_match('/^[a-zA-Z0-9]+$/', $usuario)) {
    json_response(['error' => 'El usuario solo puede contener letras y números, sin espacios ni caracteres especiales.'], 400);
}

if (!$code || !$nombre || !$usuario || !$password) {
    json_response(['error' => 'Faltan datos obligatorios.'], 400);
}
if (!$email && !$tel) {
    json_response(['error' => 'Se requiere email o teléfono.'], 400);
}

// ── CLAVE DE SESIÓN (email tiene prioridad) ───────────────
$sessionKey = $email ?: $tel;

// ── VERIFICAR CÓDIGO EN SESIÓN ────────────────────────────
$stored = $_SESSION['verification'][$sessionKey] ?? null;

if (!$stored) {
    json_response(['error' => 'No hay un código pendiente para este contacto.'], 400);
}
if (time() > $stored['expiresAt']) {
    unset($_SESSION['verification'][$sessionKey]);
    json_response(['error' => 'El código ha expirado. Solicitá uno nuevo.'], 400);
}
if ($stored['code'] !== $code) {
    json_response(['error' => 'Código incorrecto.'], 400);
}

// ── CÓDIGO VÁLIDO: BORRAR DE SESIÓN ──────────────────────
unset($_SESSION['verification'][$sessionKey]);

// ── INSERTAR USUARIO EN MYSQL ─────────────────────────────
$pdo = db();

// Verificar duplicados
$check = $pdo->prepare(
    'SELECT id FROM usuarios WHERE usuario = :usuario
     OR (:email <> \'\' AND email = :email2)
     OR (:tel   <> \'\' AND telefono = :tel2)
     LIMIT 1'
);
$check->execute([
    ':usuario' => $usuario,
    ':email'   => $email,
    ':email2'  => $email,
    ':tel'     => $tel,
    ':tel2'    => $tel,
]);
if ($check->fetch()) {
    json_response(['error' => 'El usuario, email o teléfono ya están registrados.'], 409);
}

// Hashear contraseña
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO usuarios (nombre, usuario, password, email, telefono)
     VALUES (:nombre, :usuario, :password, :email, :telefono)'
);

try {
    $stmt->execute([
        ':nombre'    => $nombre,
        ':usuario'   => $usuario,
        ':password'  => $passwordHash,
        ':email'     => $email    ?: null,
        ':telefono'  => $tel      ?: null,
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_response(['error' => 'El usuario, email o teléfono ya están registrados.'], 409);
    }
    json_response(['error' => 'Error al guardar los datos del usuario.'], 500);
}

// ── MENSAJE DE BIENVENIDA POR WHATSAPP ────────────────────
// Solo si el usuario registró un número de teléfono
$telefonoBienvenida = $tel ?: '';
if ($telefonoBienvenida) {
    $waMsg = "¡Bienvenido/a a *TRINITY*, {$nombre}! 🎉\n\n"
           . "Tu cuenta fue creada exitosamente.\n"
           . "Entrá a la plataforma y completá tu perfil para empezar a competir.\n\n"
           . "🌐 " . APP_URL;
    whatsapp_send($telefonoBienvenida, $waMsg);
}

json_response(['ok' => true]);