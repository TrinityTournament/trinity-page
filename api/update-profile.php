<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Actualizar perfil (MySQL / PDO)
//  Acepta: nombre, usuario, fecha_nacimiento, tipo, deportes
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── VERIFICAR SESIÓN ──────────────────────────────────────
if (empty($_SESSION['astrax_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = $_SESSION['astrax_user']['id'];
$body   = json_decode(file_get_contents('php://input'), true);

$campos = [];
$params = [':id' => $userId];

// Campos opcionales — solo se actualizan si vienen en el body
if (isset($body['nombre']) && trim($body['nombre']) !== '') {
    $nombre = trim($body['nombre']);

    // Solo letras (incluyendo acentos y ñ), números y espacios
    if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/u', $nombre)) {
        json_response(['error' => 'El nombre solo puede contener letras, números y espacios.'], 400);
    }

    $campos[]          = 'nombre = :nombre';
    $params[':nombre']  = $nombre;
}

if (isset($body['usuario']) && trim($body['usuario']) !== '') {
    $usuario = trim($body['usuario']);

    // Solo letras y números, sin espacios ni caracteres especiales
    if (!preg_match('/^[a-zA-Z0-9]+$/', $usuario)) {
        json_response(['error' => 'El usuario solo puede contener letras y números, sin espacios ni caracteres especiales.'], 400);
    }

    // Verificar que el usuario no esté tomado por otro
    $pdo   = db();
    $check = $pdo->prepare('SELECT id FROM usuarios WHERE usuario = :usuario AND id != :id LIMIT 1');
    $check->execute([':usuario' => $usuario, ':id' => $userId]);
    if ($check->fetch()) {
        json_response(['error' => 'El nombre de usuario ya está en uso.'], 409);
    }
    $campos[]          = 'usuario = :usuario';
    $params[':usuario'] = $usuario;
}

if (isset($body['fecha_nacimiento'])) {
    $campos[]                  = 'fecha_nacimiento = :fecha';
    $params[':fecha']           = $body['fecha_nacimiento'] ?: null;
}

if (isset($body['tipo'])) {
    if (!in_array($body['tipo'], ['deportes', 'videojuegos'], true)) {
        json_response(['error' => 'Tipo inválido.'], 400);
    }
    $campos[]       = 'tipo = :tipo';
    $params[':tipo'] = $body['tipo'];
}

if (isset($body['deportes'])) {
    $campos[]           = 'deportes_seleccionados = :deportes';
    $params[':deportes'] = json_encode($body['deportes'], JSON_UNESCAPED_UNICODE);
}

if (empty($campos)) {
    json_response(['error' => 'No hay datos para actualizar.'], 400);
}

$pdo  = $pdo ?? db();
$sql  = 'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = :id';
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute($params);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_response(['error' => 'El nombre de usuario ya está en uso.'], 409);
    }
    json_response(['error' => 'Error al actualizar el perfil.'], 500);
}

// Actualizar sesión
if (isset($body['nombre']))   $_SESSION['astrax_user']['nombre']  = $params[':nombre']  ?? $_SESSION['astrax_user']['nombre'];
if (isset($body['usuario']))  $_SESSION['astrax_user']['usuario'] = $params[':usuario'] ?? $_SESSION['astrax_user']['usuario'];
if (isset($body['tipo']))     $_SESSION['astrax_user']['tipo']    = $body['tipo'];

json_response(['ok' => true]);