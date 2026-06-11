<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Actualizar perfil (MySQL / PDO)
//  Acepta: nombre, usuario, fecha_nacimiento, tipo, deportes
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── VERIFICAR SESIÓN ──────────────────────────────────────
if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = $_SESSION['trinity_user']['id'];
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
    $deportes = $body['deportes'];

    if (!is_array($deportes)) {
        json_response(['error' => 'Formato de preferencias inválido.'], 400);
    }
    if (count($deportes) > 10) {
        json_response(['error' => 'Demasiadas preferencias seleccionadas.'], 400);
    }

    $opcionesDeportes = ['Fútbol', 'Tenis', 'Basketball', 'Volleyball', 'Natación', 'Atletismo'];

    foreach ($deportes as $item) {
        if (!is_string($item) || !in_array($item, $opcionesDeportes, true)) {
            json_response(['error' => 'Selección de deportes inválida.'], 400);
        }
    }

    $campos[]           = 'deportes_seleccionados = :deportes';
    $params[':deportes'] = json_encode(array_values($deportes), JSON_UNESCAPED_UNICODE);
}

if (isset($body['videojuegos'])) {
    $videojuegos = $body['videojuegos'];

    if (!is_array($videojuegos)) {
        json_response(['error' => 'Formato de preferencias inválido.'], 400);
    }
    if (count($videojuegos) > 10) {
        json_response(['error' => 'Demasiadas preferencias seleccionadas.'], 400);
    }

    $opcionesJuegos = ['Fortnite', 'Clash Royale', 'Valorant', 'League of Legends', 'Call of Duty', 'Rocket League'];

    foreach ($videojuegos as $item) {
        if (!is_string($item) || !in_array($item, $opcionesJuegos, true)) {
            json_response(['error' => 'Selección de videojuegos inválida.'], 400);
        }
    }

    $campos[]               = 'videojuegos_seleccionados = :videojuegos';
    $params[':videojuegos']  = json_encode(array_values($videojuegos), JSON_UNESCAPED_UNICODE);
}

// ── Nuevos campos: pronombres y descripción ──────────────
if (array_key_exists('pronouns', $body)) {
    $allowed = ['', 'He/him', 'She/her', 'He/they', 'She/they', 'They/them', 'Any'];
    $pro = trim($body['pronouns'] ?? '');
    if (!in_array($pro, $allowed, true)) {
        json_response(['error' => 'Pronombres no válidos.'], 400);
    }
    $campos[]           = 'pronouns = :pronouns';
    $params[':pronouns'] = $pro ?: null;
}

if (array_key_exists('descripcion', $body)) {
    $desc = mb_substr(trim($body['descripcion'] ?? ''), 0, 500);
    $campos[]             = 'descripcion = :descripcion';
    $params[':descripcion'] = $desc ?: null;
}

// ── Foto de perfil (base64, recortada en el cliente) ─────
if (array_key_exists('foto_url', $body)) {
    $foto = $body['foto_url'];

    if ($foto === null || $foto === '') {
        // Permite borrar la foto de perfil
        $campos[]            = 'foto_url = :foto_url';
        $params[':foto_url'] = null;
    } else {
        // Debe ser un data URL de imagen en base64
        if (!preg_match('/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+\/=]+)$/', $foto, $m)) {
            json_response(['error' => 'Formato de imagen inválido.'], 400);
        }

        // Límite ~2MB en base64 (~1.5MB de imagen real)
        if (strlen($foto) > 2 * 1024 * 1024) {
            json_response(['error' => 'La imagen es demasiado grande.'], 400);
        }

        $campos[]            = 'foto_url = :foto_url';
        $params[':foto_url'] = $foto;
    }
}

if (empty($campos)) {
    json_response(['error' => 'No hay datos para actualizar.'], 400);
}

$pdo = $pdo ?? db();
$sql = 'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = :id';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_response(['error' => 'El nombre de usuario ya está en uso.'], 409);
    }
    json_response(['error' => 'Error al actualizar el perfil.'], 500);
}

// Actualizar sesión
if (isset($body['nombre']))   $_SESSION['trinity_user']['nombre']  = $params[':nombre']  ?? $_SESSION['trinity_user']['nombre'];
if (isset($body['usuario']))  $_SESSION['trinity_user']['usuario'] = $params[':usuario'] ?? $_SESSION['trinity_user']['usuario'];
if (isset($body['tipo']))       $_SESSION['trinity_user']['tipo']       = $body['tipo'];
if (isset($body['deportes']))   $_SESSION['trinity_user']['deportes']   = array_values($body['deportes']);
if (isset($body['videojuegos'])) $_SESSION['trinity_user']['videojuegos'] = array_values($body['videojuegos']);
if (isset($body['pronouns']))  $_SESSION['trinity_user']['pronouns']  = $body['pronouns'] ?? null;
if (isset($body['descripcion'])) $_SESSION['trinity_user']['descripcion'] = $body['descripcion'] ?? null;
if (array_key_exists('foto_url', $body)) $_SESSION['trinity_user']['foto_url'] = $params[':foto_url'] ?? null;

json_response(['ok' => true]);