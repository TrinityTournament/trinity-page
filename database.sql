-- ══════════════════════════════════════════════════════════
--  TRINITY — Esquema MySQL
--  Motor recomendado: MySQL 8.0+ / MariaDB 10.5+
-- ══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS trinity
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE trinity;

-- ── TABLA: usuarios ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                      INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    nombre                  VARCHAR(120)      NOT NULL,
    fecha_nacimiento        DATE              NULL,
    usuario                 VARCHAR(60)       NOT NULL,
    tipo                    ENUM('deportes','videojuegos') NULL,
    deportes_seleccionados  JSON              NULL,
    password                VARCHAR(255)      NOT NULL,
    email                   VARCHAR(180)      NULL,
    telefono                VARCHAR(30)       NULL,
    pronouns                VARCHAR(30)       NULL,
    descripcion             VARCHAR(500)      NULL,
    foto_url                VARCHAR(500)      NULL,
    torneos_jugados         INT UNSIGNED      NOT NULL DEFAULT 0,
    torneos_ganados         INT UNSIGNED      NOT NULL DEFAULT 0,
    creado_en               TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_email    (email),
    UNIQUE KEY uq_usuario  (usuario),
    UNIQUE KEY uq_telefono (telefono)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── ÍNDICES ADICIONALES ──────────────────────────────────────
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

-- ── TABLA: seguidores ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguidores (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    seguidor_id INT UNSIGNED NOT NULL,
    seguido_id  INT UNSIGNED NOT NULL,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_seguidor_seguido (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id)  REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── TABLA: codigos_verificacion ──────────────────────────────
CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    destino     VARCHAR(180) NOT NULL,   -- email o telefono
    codigo      VARCHAR(10)  NOT NULL,
    tipo        VARCHAR(40)  NOT NULL,   -- 'registro', 'cambio_credencial', 'cambio_password'
    expira_en   DATETIME     NOT NULL,
    usado       TINYINT(1)   NOT NULL DEFAULT 0,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════
--  NOTA SOBRE CONTRASEÑAS
--  El campo `password` guarda el hash generado por
--  password_hash($plain, PASSWORD_BCRYPT) en PHP.
--  NUNCA guardar contraseñas en texto plano.
-- ══════════════════════════════════════════════════════════
