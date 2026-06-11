<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Configuración global (MySQL / PDO)
// ══════════════════════════════════════════════════════════

// ── CREDENCIALES MYSQL ─────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_PORT',    '3306');
define('DB_NAME',    'trinity');
define('DB_USER',    'root');          // ← cambiá por tu usuario
define('DB_PASS',    '');              // ← cambiá por tu contraseña
define('DB_CHARSET', 'utf8mb4');

// ── VARIABLES DE ENTORNO ───────────────────────────────────
$env = @parse_ini_file(__DIR__ . '/../.env') ?: [];
define('BREVO_KEY',    $env['BREVO_KEY']    ?? '');
define('WA_BOT_PORT',  $env['WA_BOT_PORT']  ?? '3001');
define('WA_SECRET',    $env['WA_SECRET']    ?? '');
define('APP_URL',      $env['APP_URL']      ?? 'http://localhost');

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
        'sender'      => ['email' => 'trinitysupportteam@gmail.com', 'name' => 'Trinity'],
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
    $curl_err  = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $ok = $http_code >= 200 && $http_code < 300;

    if (!$ok) {
        // Log para debug: ver en el log de PHP por qué falló el envío
        // (clave inválida/revocada, remitente no verificado, límite excedido, etc.)
        error_log(sprintf(
            '[brevo_send] FALLÓ. HTTP %s. curl_error="%s". Respuesta: %s',
            $http_code, $curl_err, $raw
        ));
    }

    return $ok;
}

// ── HELPER: ENVIAR MENSAJE POR WHATSAPP ──────────────────
function whatsapp_send(string $phone, string $message): bool {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($phone) < 7) return false;

    $url     = 'http://127.0.0.1:' . WA_BOT_PORT . '/api/whatsapp/send';
    $payload = json_encode(['phone' => $phone, 'message' => $message]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-WA-Secret: ' . WA_SECRET,
        ],
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
    ]);

    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code === 200;
}

// ── HELPER: BROADCAST POR WHATSAPP ───────────────────────
function whatsapp_broadcast(array $phones, string $message): bool {
    if (empty($phones)) return false;

    $url     = 'http://127.0.0.1:' . WA_BOT_PORT . '/api/whatsapp/broadcast';
    $payload = json_encode(['phones' => $phones, 'message' => $message]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-WA-Secret: ' . WA_SECRET,
        ],
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_CONNECTTIMEOUT => 3,
    ]);

    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code === 200;
}

// ── HELPER: RESPUESTA JSON ─────────────────────────────────
function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}