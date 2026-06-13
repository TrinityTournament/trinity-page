<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Invitar usuario a torneo
//
//  Valida que:
//    1. El torneo exista y pertenezca al usuario logueado.
//    2. El torneo esté en estado 'en_creacion' (abierto para invitar).
//    3. El invitado exista y no esté ya invitado/inscripto.
//    4. El invitado no sea el propio organizador.
//
//  Body: { torneo_id: int, invitado_id: int }
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
    json_response(['error' => 'Debés iniciar sesión para invitar a torneos.'], 401);
}

$organizadorId = (int) $_SESSION['trinity_user']['id'];

// ── Leer body ─────────────────────────────────────────────
$body       = json_decode(file_get_contents('php://input'), true);
$torneoId   = (int) ($body['torneo_id']   ?? 0);
$invitadoId = (int) ($body['invitado_id'] ?? 0);

if (!$torneoId || !$invitadoId) {
    json_response(['error' => 'Se requieren torneo_id e invitado_id.'], 400);
}

if ($invitadoId === $organizadorId) {
    json_response(['error' => 'No podés invitarte a vos mismo.'], 400);
}

$pdo = db();

// ── 1. Verificar que el torneo exista, pertenezca al organizador
//       y esté en estado 'en_creacion' ───────────────────────────
$stmtTorneo = $pdo->prepare(
    "SELECT id, titulo, estado
     FROM torneos
     WHERE id = :id AND organizador_id = :org_id
     LIMIT 1"
);
$stmtTorneo->execute([':id' => $torneoId, ':org_id' => $organizadorId]);
$torneo = $stmtTorneo->fetch();

if (!$torneo) {
    json_response([
        'error' => 'No encontramos ese torneo entre los que estás organizando.',
    ], 404);
}

if ($torneo['estado'] !== 'en_creacion') {
    $labels = [
        'abierto'    => 'abierto para inscripciones',
        'en_curso'   => 'en curso',
        'finalizado' => 'finalizado',
        'cancelado'  => 'cancelado',
    ];
    $label = $labels[$torneo['estado']] ?? $torneo['estado'];
    json_response([
        'error' => "Solo podés invitar cuando el torneo está en proceso de creación. Este torneo está {$label}.",
    ], 409);
}

// ── 2. Verificar que el invitado exista ──────────────────────
$stmtUser = $pdo->prepare(
    'SELECT id, nombre, usuario, telefono FROM usuarios WHERE id = :id LIMIT 1'
);
$stmtUser->execute([':id' => $invitadoId]);
$invitado = $stmtUser->fetch();

if (!$invitado) {
    json_response(['error' => 'El usuario al que querés invitar no existe.'], 404);
}

// ── 3. Verificar que no esté ya invitado o inscripto ─────────
$stmtCheck = $pdo->prepare(
    "SELECT id FROM torneo_invitaciones
     WHERE torneo_id = :torneo_id AND invitado_id = :invitado_id
     LIMIT 1"
);
$stmtCheck->execute([':torneo_id' => $torneoId, ':invitado_id' => $invitadoId]);
if ($stmtCheck->fetch()) {
    json_response(['error' => 'Este usuario ya fue invitado a ese torneo.'], 409);
}

// También verificar inscripción directa (si existe tabla participantes)
$stmtPartic = $pdo->prepare(
    "SELECT id FROM torneo_participantes
     WHERE torneo_id = :torneo_id AND usuario_id = :uid
     LIMIT 1"
);
try {
    $stmtPartic->execute([':torneo_id' => $torneoId, ':uid' => $invitadoId]);
    if ($stmtPartic->fetch()) {
        json_response(['error' => 'Este usuario ya está inscripto en ese torneo.'], 409);
    }
} catch (PDOException) {
    // Si la tabla no existe aún, ignoramos esta verificación
}

// ── 4. Insertar invitación ────────────────────────────────────
$stmtInsert = $pdo->prepare(
    "INSERT INTO torneo_invitaciones (torneo_id, organizador_id, invitado_id, estado)
     VALUES (:torneo_id, :org_id, :invitado_id, 'pendiente')"
);
try {
    $stmtInsert->execute([
        ':torneo_id'   => $torneoId,
        ':org_id'      => $organizadorId,
        ':invitado_id' => $invitadoId,
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        json_response(['error' => 'Este usuario ya fue invitado.'], 409);
    }
    json_response(['error' => 'Error al guardar la invitación.'], 500);
}

// ── 5. Notificación centralizada (email + WhatsApp si el invitado activó opt-in) ──
$orgNombre  = $_SESSION['trinity_user']['nombre']  ?? 'Un organizador';
$orgUsuario = $_SESSION['trinity_user']['usuario'] ?? '';

crear_notificacion(
    $invitadoId,
    'torneo_invitacion',
    "Te invitaron al torneo \"{$torneo['titulo']}\"",
    "{$orgNombre} (@{$orgUsuario}) te envió una invitación. ¡Ingresá para aceptarla o rechazarla!"
);

json_response([
    'ok'      => true,
    'mensaje' => "Invitación enviada a {$invitado['nombre']}.",
]);