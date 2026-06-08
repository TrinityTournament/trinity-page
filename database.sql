-- ══════════════════════════════════════════════════════════
--  ASTRAX — Esquema MySQL
--  Motor recomendado: MySQL 8.0+ / MariaDB 10.5+
-- ══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS astrax
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE astrax;

-- ── TABLA: usuarios ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                      INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    nombre                  VARCHAR(120)      NOT NULL,
    fecha_nacimiento        DATE              NULL,     -- se completa desde perfil
    usuario                 VARCHAR(60)       NOT NULL,
    tipo                    ENUM('deportes','videojuegos') NULL,  -- se completa desde perfil
    -- JSON array: ["Fútbol","Basketball",...] almacenado como texto
    deportes_seleccionados  JSON              NULL,     -- se completa desde perfil
    password                VARCHAR(255)      NOT NULL,   -- guardar hash (ver nota)
    email                   VARCHAR(180)      NULL,
    telefono                VARCHAR(30)       NULL,    -- número con código de país, sin "+"
    creado_en               TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_email    (email),
    UNIQUE KEY uq_usuario  (usuario),
    UNIQUE KEY uq_telefono (telefono)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── ÍNDICES ADICIONALES ──────────────────────────────────────
-- Útil para búsquedas frecuentes por email en login
CREATE INDEX idx_usuarios_email    ON usuarios (email);
CREATE INDEX idx_usuarios_telefono ON usuarios (telefono);

-- ── TABLA: password_resets ───────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NOT NULL,
    token       VARCHAR(64)  NOT NULL,
    expira_en   DATETIME     NOT NULL,
    usado       TINYINT(1)   NOT NULL DEFAULT 0,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_token (token),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════
--  NOTA SOBRE CONTRASEÑAS
--  El campo `password` guarda el hash generado por
--  password_hash($plain, PASSWORD_BCRYPT) en PHP.
--  NUNCA guardar contraseñas en texto plano.
--  La función verify-code.php ya aplica password_hash()
--  antes de insertar, y login.php usa password_verify().
-- ══════════════════════════════════════════════════════════

-- ── DATOS DE EJEMPLO ───
-- INSERT INTO usuarios
--     (nombre, fecha_nacimiento, usuario, tipo, deportes_seleccionados, password, email)
-- VALUES
--     ('Demo User', '2000-01-15', 'demouser', 'deportes',
--      JSON_ARRAY('Fútbol', 'Basketball'),
--      '$2y$10$...hash_generado_con_password_hash...', 'demo@gmail.com');
