<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Clash Royale: vincular cuenta
//  POST { tag: '#ABC123' } → { ok: true, tag, perfil: {...} }
//
//  Antes de guardar, valida contra la API externa que el tag
//  exista de verdad (evita guardar tags inválidos/inventados).
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../../session.php';
session_start();
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../middleware.php';
require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

validar_csrf();
requiere_sesion();

$userId = (int) $_SESSION['trinity_user']['id'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

$tagCrudo = trim($body['tag'] ?? '');
if ($tagCrudo === '') {
    json_response(['error' => 'Ingresá tu tag de Clash Royale.'], 400);
}

$tag = cr_normalizar_tag($tagCrudo);
if ($tag === null) {
    json_response(['error' => 'El tag no tiene un formato válido. Ejemplo: #GPP2J0UL8'], 400);
}

// ── Confirmar contra la API externa que el tag existe ────
try {
    $perfil = cr_fetch_profile($tag);
} catch (RuntimeException $e) {
    json_response(['error' => $e->getMessage()], 422);
}

// ── Guardar / actualizar (upsert) ─────────────────────────
$pdo  = db();
$stmt = $pdo->prepare(
    "INSERT INTO cuentas_videojuego (usuario_id, juego, identificador)
     VALUES (:uid, 'clashroyale', :tag)
     ON DUPLICATE KEY UPDATE identificador = VALUES(identificador)"
);

try {
    $stmt->execute([':uid' => $userId, ':tag' => $tag]);
} catch (PDOException $e) {
    json_response(['error' => 'No se pudo guardar la cuenta. Intentá de nuevo.'], 500);
}

json_response([
    'ok'     => true,
    'tag'    => '#' . $tag,
    'perfil' => cr_build_stats_payload($perfil),
]);
