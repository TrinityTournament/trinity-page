<?php
// ══════════════════════════════════════════════════════════
//  ASTRAX — Configuración global (MySQL / PDO)
// ══════════════════════════════════════════════════════════

// ── CREDENCIALES MYSQL ─────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_PORT',    '3306');
define('DB_NAME',    'astrax');
define('DB_USER',    'root');          // ← cambiá por tu usuario
define('DB_PASS',    '');              // ← cambiá por tu contraseña
define('DB_CHARSET', 'utf8mb4');

// ── CLAVE BREVO (email) ────────────────────────────────────
define('BREVO_KEY', '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');

// ── CONEXIÓN PDO (singleton) ───────────────────────────────
function db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            json_response(['error' => 'Error de conexión a la base de datos.'], 500);
        }
    }

    return $pdo;
}

// ── HELPER: ENVIAR EMAIL CON BREVO ────────────────────────
function brevo_send(string $to_email, string $subject, string $html_body): bool {
    $payload = json_encode([
        'sender'      => ['email' => 'astraxsupport@gmail.com', 'name' => 'Astrax'],
        'to'          => [['email' => $to_email]],
        'subject'     => $subject,
        'htmlContent' => $html_body,
    ]);

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST,           true);
    curl_setopt($ch, CURLOPT_POSTFIELDS,     $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER,     [
        'Content-Type: application/json',
        'api-key: ' . BREVO_KEY,
    ]);

    $raw       = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $http_code >= 200 && $http_code < 300;
}

// ── HELPER: RESPUESTA JSON ─────────────────────────────────
function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
