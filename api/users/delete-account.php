<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Eliminar cuenta (MySQL / PDO)
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

if (empty($_SESSION['trinity_user'])) {
    json_response(['error' => 'No autenticado.'], 401);
}

$userId = $_SESSION['trinity_user']['id'];
$pdo    = db();
$stmt   = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');

try {
    $stmt->execute([':id' => $userId]);
} catch (PDOException $e) {
    json_response(['error' => 'Error al eliminar la cuenta.'], 500);
}

session_destroy();
json_response(['ok' => true]);