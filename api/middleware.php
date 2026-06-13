<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Middleware reutilizable
//
//  Uso en cualquier endpoint:
//      session_start();
//      require_once __DIR__ . '/../config.php';
//      require_once __DIR__ . '/../middleware.php';
//
//      requiere_sesion();               // solo autenticados
//      requiere_rol('admin');           // solo admin
//      requiere_rol('admin','organizador'); // varios roles
//      $u = usuario_actual();           // array con los datos del usuario
// ══════════════════════════════════════════════════════════

// ── REQUIERE SESIÓN ACTIVA ─────────────────────────────────
// Corta con 401 si el usuario no está autenticado.
function requiere_sesion(): void {
    if (empty($_SESSION['trinity_user'])) {
        json_response(['error' => 'No autenticado.'], 401);
    }
}

// ── REQUIERE ROL ───────────────────────────────────────────
// Corta con 403 si el rol del usuario no está entre los permitidos.
// Llama a requiere_sesion() implícitamente.
function requiere_rol(string ...$roles): void {
    requiere_sesion();
    $rolActual = $_SESSION['trinity_user']['rol'] ?? 'participante';
    if (!in_array($rolActual, $roles, true)) {
        json_response(['error' => 'Sin permisos suficientes.'], 403);
    }
}

// ── USUARIO ACTUAL ─────────────────────────────────────────
// Devuelve el array completo del usuario en sesión.
function usuario_actual(): array {
    return $_SESSION['trinity_user'] ?? [];
}