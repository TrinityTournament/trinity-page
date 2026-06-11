-- ══════════════════════════════════════════════════════════
--  TRINITY — Migraciones adicionales
--  Ejecutar sobre la BD existente (astrax).
--  Cada bloque es idempotente (usa IF NOT EXISTS / IGNORE).
-- ══════════════════════════════════════════════════════════

USE astrax;

-- ──────────────────────────────────────────────────────────
--  1. Agregar columnas nuevas a la tabla usuarios
--     (pronouns, descripcion, foto_url, seguidos, seguidores,
--      torneos_jugados, torneos_ganados)
-- ──────────────────────────────────────────────────────────

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS pronouns         VARCHAR(30)  NULL  AFTER usuario,
    ADD COLUMN IF NOT EXISTS descripcion      TEXT         NULL  AFTER pronouns,
    ADD COLUMN IF NOT EXISTS foto_url         VARCHAR(512) NULL  AFTER descripcion,
    ADD COLUMN IF NOT EXISTS torneos_jugados  INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS torneos_ganados  INT UNSIGNED NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────
--  2. Tabla: seguidores
--     Relación muchos-a-muchos entre usuarios.
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seguidores (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    seguidor_id INT UNSIGNED NOT NULL COMMENT 'quien sigue',
    seguido_id  INT UNSIGNED NOT NULL COMMENT 'a quien se sigue',
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_follow (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id)  REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────
--  3. Tabla: torneos
--     Estado 'en_creacion' → fase de configuración antes
--     de abrir inscripciones. Solo en este estado se puede invitar.
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS torneos (
    id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    organizador_id      INT UNSIGNED NOT NULL,
    titulo              VARCHAR(200) NOT NULL,
    descripcion         TEXT         NULL,
    deporte             VARCHAR(80)  NULL,
    tipo                ENUM('deporte','videojuego') NULL,
    estado              ENUM('en_creacion','abierto','en_curso','finalizado','cancelado')
                            NOT NULL DEFAULT 'en_creacion',
    max_participantes   INT UNSIGNED NULL,
    fecha_inicio        DATE         NULL,
    fecha_fin           DATE         NULL,
    creado_en           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_organizador (organizador_id),
    INDEX idx_estado      (estado),
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────
--  4. Tabla: torneo_participantes
--     Inscripciones directas (sin invitación).
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS torneo_participantes (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    torneo_id   INT UNSIGNED NOT NULL,
    usuario_id  INT UNSIGNED NOT NULL,
    inscripto_en TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_participante (torneo_id, usuario_id),
    FOREIGN KEY (torneo_id)  REFERENCES torneos(id)  ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────
--  5. Tabla: torneo_invitaciones
--     Invitaciones enviadas desde el perfil de otro usuario.
--     Solo se crean cuando el torneo está en 'en_creacion'.
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS torneo_invitaciones (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    torneo_id       INT UNSIGNED NOT NULL,
    organizador_id  INT UNSIGNED NOT NULL,
    invitado_id     INT UNSIGNED NOT NULL,
    estado          ENUM('pendiente','aceptada','rechazada')
                        NOT NULL DEFAULT 'pendiente',
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    respondido_en   TIMESTAMP NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_invitacion (torneo_id, invitado_id),
    INDEX idx_invitado   (invitado_id),
    INDEX idx_torneo_inv (torneo_id),
    FOREIGN KEY (torneo_id)      REFERENCES torneos(id)  ON DELETE CASCADE,
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (invitado_id)    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────
--  6. Vista: v_seguidores_count
--     Para obtener conteos de seguidos/seguidores fácilmente.
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_seguidores_count AS
SELECT
    u.id,
    COUNT(DISTINCT sf.id)  AS seguidores,   -- cuántos ME siguen
    COUNT(DISTINCT sg.id)  AS seguidos       -- a cuántos sigo
FROM usuarios u
LEFT JOIN seguidores sf ON sf.seguido_id   = u.id
LEFT JOIN seguidores sg ON sg.seguidor_id  = u.id
GROUP BY u.id;

-- ══════════════════════════════════════════════════════════
--  NOTAS
--  • El campo send-code.php ya soporta { telefono, cambio_credencial: true }
--    gracias al nuevo flujo de update-credentials.php.
--  • Los conteos de seguidores/seguidos se calculan con la vista
--    v_seguidores_count o con subqueries en get-profile.php.
-- ══════════════════════════════════════════════════════════
