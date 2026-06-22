<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Endpoint para obtener el token CSRF
//
//  GET /api/auth/csrf-token.php
//  Devuelve: { "csrf_token": "..." }
//
//  El frontend lo llama una vez al arrancar y guarda el token
//  en memoria para incluirlo en cada request POST via apiFetch().
// ══════════════════════════════════════════════════════════
require_once __DIR__ . '/../session.php';
session_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../middleware.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

json_response(['csrf_token' => generar_token_csrf()]);