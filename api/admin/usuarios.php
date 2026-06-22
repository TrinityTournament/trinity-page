<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Admin: gestión de usuarios
//
//  GET  → lista todos los usuarios
//  PATCH { id, rol } → cambia el rol de un usuario
//  Solo accesible para rol 'admin'
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../middleware.php';

header('Content-Type: application/json; charset=utf-8');

requiere_rol('admin');

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: listar usuarios ───────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query(
        "SELECT id, nombre, usuario, email, telefono, rol,
                torneos_jugados, torneos_ganados, creado_en
         FROM   usuarios
         ORDER  BY creado_en DESC"
    );
    $usuarios = $stmt->fetchAll();

    foreach ($usuarios as &$u) {
        $u['id'] = (int) $u['id'];
    }

    json_response(['ok' => true, 'usuarios' => $usuarios]);
}

// ── PATCH: cambiar rol ────────────────────────────────────
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($body['id']  ?? 0);
    $rol  = trim($body['rol']   ?? '');

    if (!$id || !$rol) {
        json_response(['error' => 'Se requieren "id" y "rol".'], 400);
    }

    $rolesValidos = ['admin', 'organizador', 'participante'];
    if (!in_array($rol, $rolesValidos, true)) {
        json_response(['error' => "Rol inválido. Válidos: " . implode(', ', $rolesValidos)], 400);
    }

    // Un admin no puede degradarse a sí mismo
    if ($id === (int) usuario_actual()['id'] && $rol !== 'admin') {
        json_response(['error' => 'No podés cambiar tu propio rol.'], 403);
    }

    $stmt = $pdo->prepare("UPDATE usuarios SET rol = :rol WHERE id = :id");
    $stmt->execute([':rol' => $rol, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        json_response(['error' => 'Usuario no encontrado.'], 404);
    }

    json_response(['ok' => true]);
}

json_response(['error' => 'Método no permitido.'], 405);