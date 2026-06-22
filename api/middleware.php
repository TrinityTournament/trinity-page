<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Middleware reutilizable
//
//  Uso en cualquier endpoint:
//      session_start();
//      require_once __DIR__ . '/../config.php';
//      require_once __DIR__ . '/../middleware.php';
//
//      requiere_sesion();                    // solo autenticados
//      requiere_rol('admin');                // solo admin
//      requiere_rol('admin', 'organizador'); // varios roles
//      $u = usuario_actual();                // array con los datos del usuario
//      validar_csrf();                       // verifica token CSRF en POST
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

// ── GENERAR TOKEN CSRF ─────────────────────────────────────
// Genera (o reutiliza) un token CSRF en sesión y lo devuelve.
// Llamar en cualquier endpoint GET que deba entregar el token al cliente.
function generar_token_csrf(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

// ── VALIDAR CSRF ───────────────────────────────────────────
// Verifica que el header X-CSRF-Token de la request coincida
// con el token guardado en sesión. Corta con 403 si no coincide.
// Solo aplica a métodos que modifican estado (POST, PUT, PATCH, DELETE).
function validar_csrf(): void {
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (in_array($metodo, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $tokenSesion = $_SESSION['csrf_token'] ?? '';
    $tokenHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (!$tokenSesion || !hash_equals($tokenSesion, $tokenHeader)) {
        json_response(['error' => 'Token CSRF inválido o ausente.'], 403);
    }
}