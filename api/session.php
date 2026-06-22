<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Configuracion de sesion
//  Incluir ANTES de session_start() en todos los endpoints.
//  Garantiza que la cookie PHPSESSID sea valida en todo
//  el proyecto y que el token CSRF sea consistente.
// ══════════════════════════════════════════════════════════

// Cookie accesible desde cualquier path del dominio
ini_set('session.cookie_path',     '/');
// Lax: la cookie viaja en navegacion normal pero no en cross-site POST
ini_set('session.cookie_samesite', 'Lax');
// Evita que PHP adopte IDs de sesion arbitrarios del cliente
ini_set('session.use_strict_mode', '1');
// Solo HTTP, no accesible desde JS
ini_set('session.cookie_httponly', '1');
