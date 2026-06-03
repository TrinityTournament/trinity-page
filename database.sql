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
    fecha_nacimiento        DATE              NOT NULL,
    usuario                 VARCHAR(60)       NOT NULL,
    tipo                    ENUM('deportes','videojuegos') NOT NULL,
    -- JSON array: ["Fútbol","Basketball",...] almacenado como texto
    deportes_seleccionados  JSON              NOT NULL,
    password                VARCHAR(255)      NOT NULL,   -- guardar hash (ver nota)
    email                   VARCHAR(180)      NOT NULL,
    creado_en               TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_email   (email),
    UNIQUE KEY uq_usuario (usuario)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── ÍNDICES ADICIONALES ──────────────────────────────────────
-- Útil para búsquedas frecuentes por email en login
CREATE INDEX idx_usuarios_email ON usuarios (email);

-- ══════════════════════════════════════════════════════════
--  NOTA SOBRE CONTRASEÑAS
--  El campo `password` guarda el hash generado por
--  password_hash($plain, PASSWORD_BCRYPT) en PHP.
--  NUNCA guardes contraseñas en texto plano.
--  La función verify-code.php ya aplica password_hash()
--  antes de insertar, y login.php usa password_verify().
-- ══════════════════════════════════════════════════════════

-- ── DATOS DE EJEMPLO (opcional, quitar en producción) ────────
-- INSERT INTO usuarios
--     (nombre, fecha_nacimiento, usuario, tipo, deportes_seleccionados, password, email)
-- VALUES
--     ('Demo User', '2000-01-15', 'demouser', 'deportes',
--      JSON_ARRAY('Fútbol', 'Basketball'),
--      '$2y$10$...hash_generado_con_password_hash...', 'demo@gmail.com');
