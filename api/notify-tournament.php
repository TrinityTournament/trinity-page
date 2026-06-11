<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Notificaciones de torneos por WhatsApp
//  Envía un mensaje a todos los usuarios con teléfono registrado
//  (o a un número puntual para testear)
//
//  Seguridad: requiere ADMIN_KEY en el header X-Admin-Key
//  Configurá ADMIN_KEY en el .env de la raíz.
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

// ── AUTENTICACIÓN ADMIN ───────────────────────────────────
$adminKey = $_ENV['ADMIN_KEY'] ?? parse_ini_file(__DIR__ . '/../.env')['ADMIN_KEY'] ?? '';
$received = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';

if ($adminKey && $received !== $adminKey) {
    json_response(['error' => 'No autorizado.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

// ── LEER BODY ─────────────────────────────────────────────
$body    = json_decode(file_get_contents('php://input'), true);

// Campos del torneo
$titulo  = trim($body['titulo']      ?? '');
$desc    = trim($body['descripcion'] ?? '');
$fecha   = trim($body['fecha']       ?? '');   // ej: "15 de junio"
$deporte = trim($body['deporte']     ?? '');   // ej: "Fútbol"

// Target: "all" (todos con tel), o "deporte" (solo ese deporte), o "test" (un número fijo)
$target  = trim($body['target']      ?? 'all');
$testTel = trim($body['test_phone']  ?? '');   // solo cuando target === "test"

if (!$titulo || !$desc) {
    json_response(['error' => 'Se requieren "titulo" y "descripcion".'], 400);
}

// ── ARMAR MENSAJE ─────────────────────────────────────────
$emoji   = match(strtolower($deporte)) {
    'fútbol', 'futbol'  => '⚽',
    'basketball'        => '🏀',
    'volleyball'        => '🏐',
    'tenis'             => '🎾',
    'natación', 'natacion' => '🏊',
    'atletismo'         => '🏃',
    'valorant'          => '🎯',
    'lol'               => '🧙',
    'fortnite'          => '🔫',
    default             => '🏆',
};

$mensaje  = "{$emoji} *TRINITY* — Nuevo torneo\n\n";
$mensaje .= "*{$titulo}*\n";
$mensaje .= "{$desc}\n";
if ($fecha)   $mensaje .= "\n📅 Fecha: {$fecha}";
if ($deporte) $mensaje .= "\n🎮 Disciplina: {$deporte}";
$mensaje .= "\n\n¡Inscribite ahora en " . APP_URL . "!";

// ── OBTENER TELÉFONOS ─────────────────────────────────────
$pdo = db();

if ($target === 'test') {
    // Solo enviar al número de prueba
    if (!$testTel) {
        json_response(['error' => 'Indicá "test_phone" para el modo test.'], 400);
    }
    $phones = [$testTel];

} elseif ($target === 'deporte' && $deporte) {
    // Solo usuarios que tengan ese deporte en sus seleccionados
    $stmt = $pdo->prepare(
        "SELECT telefono FROM usuarios
         WHERE  telefono IS NOT NULL
           AND  telefono <> ''
           AND  JSON_CONTAINS(deportes_seleccionados, :deporte)"
    );
    $stmt->execute([':deporte' => json_encode($deporte)]);
    $phones = $stmt->fetchAll(\PDO::FETCH_COLUMN);

} else {
    // Todos los usuarios con teléfono registrado
    $stmt = $pdo->query(
        "SELECT telefono FROM usuarios WHERE telefono IS NOT NULL AND telefono <> ''"
    );
    $phones = $stmt->fetchAll(\PDO::FETCH_COLUMN);
}

if (empty($phones)) {
    json_response([
        'ok'      => true,
        'mensaje' => 'No hay usuarios con teléfono registrado para notificar.',
        'enviados' => 0
    ]);
}

// ── ENVIAR VIA WHATSAPP BOT ───────────────────────────────
$ok = whatsapp_broadcast($phones, $mensaje);

if (!$ok) {
    json_response([
        'error'  => 'El bot de WhatsApp no está disponible. ¿Está corriendo el bot?',
        'phones' => count($phones),
    ], 503);
}

json_response([
    'ok'       => true,
    'enviados' => count($phones),
    'mensaje'  => "Notificación enviada a " . count($phones) . " usuario(s).",
]);
