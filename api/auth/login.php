<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Login
//  Acepta email o número de teléfono
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$body       = json_decode(file_get_contents('php://input'), true);
$identifier = trim($body['identifier'] ?? '');
$password   = $body['password']        ?? '';

if (!$identifier || !$password) {
    json_response(['error' => 'Faltan datos de usuario.'], 400);
}

$pdo = db();

$campo = str_contains($identifier, '@') ? 'email' : 'telefono';
$stmt  = $pdo->prepare(
    "SELECT id, usuario, nombre, email, telefono, tipo,
            deportes_seleccionados, fecha_nacimiento, password,
            pronouns, descripcion, foto_url, notif_whatsapp, rol
     FROM   usuarios WHERE {$campo} = :val LIMIT 1"
);
$stmt->execute([':val' => $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    json_response(['error' => 'Credenciales incorrectas.'], 401);
}

unset($user['password']);
$_SESSION['trinity_user'] = $user;

// Regenerar token CSRF tras login exitoso (rotación de token)
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

json_response([
    'ok'      => true,
    'usuario' => [
        'id'               => $user['id'],
        'usuario'          => $user['usuario'],
        'nombre'           => $user['nombre'],
        'email'            => $user['email'],
        'telefono'         => $user['telefono'],
        'tipo'             => $user['tipo'],
        'deportes'         => $user['deportes_seleccionados']
                                ? json_decode($user['deportes_seleccionados'], true)
                                : null,
        'fecha_nacimiento' => $user['fecha_nacimiento'],
        'perfil_completo'  => !empty($user['tipo']) && !empty($user['deportes_seleccionados']),
        'pronouns'         => $user['pronouns']    ?? null,
        'descripcion'      => $user['descripcion'] ?? null,
        'foto_url'         => $user['foto_url']    ?? null,
        'notif_whatsapp'   => (bool) ($user['notif_whatsapp'] ?? false),
        'rol'              => $user['rol'] ?? 'participante',
    ],
    'csrf_token' => $_SESSION['csrf_token'],
]);