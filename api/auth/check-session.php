<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Verificar sesión activa
//  Devuelve los datos del usuario logueado o 401 si no hay sesión.
//  Usado por el panel de admin y otras páginas para confirmar
//  que la sesión PHP sigue activa en el servidor.
// ══════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['trinity_user'])) {
    json_response(['ok' => false, 'error' => 'No autenticado.'], 401);
}

$u = $_SESSION['trinity_user'];

json_response([
    'ok'      => true,
    'usuario' => [
        'id'             => $u['id'],
        'usuario'        => $u['usuario'],
        'nombre'         => $u['nombre'],
        'email'          => $u['email'],
        'foto_url'       => $u['foto_url']  ?? null,
        'rol'            => $u['rol']        ?? 'participante',
        'notif_whatsapp' => (bool) ($u['notif_whatsapp'] ?? false),
    ],
]);