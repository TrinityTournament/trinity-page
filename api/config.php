<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Configuración global
//  Lee credenciales desde variables de entorno (Docker) o
//  desde el archivo .env como fallback (desarrollo local).
// ══════════════════════════════════════════════════════════

// ── CARGAR .env SI NO ESTAMOS EN DOCKER ───────────────────
// En Docker las variables llegan por env_file/environment.
// En desarrollo local las leemos del archivo .env.
if (!getenv('DB_HOST')) {
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        foreach (parse_ini_file($envPath) ?: [] as $k => $v) {
            if (!getenv($k)) putenv("{$k}={$v}");
        }
    }
}

// ── CREDENCIALES MYSQL ─────────────────────────────────────
define('DB_HOST',    getenv('DB_HOST')    ?: 'localhost');
define('DB_PORT',    getenv('DB_PORT')    ?: '3306');
define('DB_NAME',    getenv('DB_NAME')    ?: 'trinity');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

// ── SERVICIOS EXTERNOS ─────────────────────────────────────
define('BREVO_KEY',   getenv('BREVO_KEY')   ?: '');
define('WA_BOT_PORT', getenv('WA_BOT_PORT') ?: getenv('WA_PORT') ?: '3001');
// En Docker el bot corre en el servicio "whatsapp"; en local es 127.0.0.1
define('WA_BOT_HOST', getenv('WA_BOT_HOST') ?: '127.0.0.1');
define('WA_SECRET',   getenv('WA_SECRET')   ?: '');
define('APP_URL',     getenv('APP_URL')     ?: 'http://localhost:3000');
define('ADMIN_KEY',   getenv('ADMIN_KEY')   ?: '');

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
    if (!BREVO_KEY) {
        error_log('[brevo_send] BREVO_KEY no configurada — email no enviado.');
        return false;
    }

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

    // WA_BOT_HOST es "127.0.0.1" en local y "whatsapp" en Docker
    $url     = 'http://' . WA_BOT_HOST . ':' . WA_BOT_PORT . '/api/whatsapp/send';
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

    $url     = 'http://' . WA_BOT_HOST . ':' . WA_BOT_PORT . '/api/whatsapp/broadcast';
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

// ── HELPER: CREAR NOTIFICACIÓN (in-app + email + WhatsApp opcional) ────────
function crear_notificacion(int $usuarioId, string $tipo, string $titulo, string $mensaje, ?string $link = null): void {
    try {
        $pdo = db();

        $stmt = $pdo->prepare(
            "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link)
             VALUES (:uid, :tipo, :titulo, :mensaje, :link)"
        );
        $stmt->execute([
            ':uid'     => $usuarioId,
            ':tipo'    => $tipo,
            ':titulo'  => $titulo,
            ':mensaje' => $mensaje,
            ':link'    => $link,
        ]);

        $uStmt = $pdo->prepare(
            "SELECT email, telefono, notif_whatsapp FROM usuarios WHERE id = :id LIMIT 1"
        );
        $uStmt->execute([':id' => $usuarioId]);
        $usuario = $uStmt->fetch();

        if (!$usuario) return;

        // Email — siempre, si tiene email y Brevo está configurado
        if (!empty($usuario['email'])) {
            $linkHtml = $link
                ? "<p style='margin-top:16px;'><a href='" . APP_URL . $link . "' style='color:#c0000a;font-weight:bold;'>Ver en Trinity →</a></p>"
                : '';
            $html = "
                <div style='font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f0000;color:#f5f0f0;border-radius:10px;overflow:hidden;'>
                    <div style='background:#c0000a;padding:16px 24px;'>
                        <h1 style='margin:0;font-size:20px;letter-spacing:3px;'>TRINITY</h1>
                    </div>
                    <div style='padding:24px;'>
                        <h2 style='margin:0 0 8px;font-size:17px;'>{$titulo}</h2>
                        <p style='margin:0;color:#c0a0a0;font-size:14px;'>{$mensaje}</p>
                        {$linkHtml}
                    </div>
                    <div style='padding:12px 24px;border-top:1px solid rgba(180,0,0,0.2);font-size:11px;color:#8a6a6a;'>
                        Recibiste esta notificación de Trinity. Para administrar tus preferencias, ingresá a Configuración.
                    </div>
                </div>
            ";
            brevo_send($usuario['email'], $titulo, $html);
        }

        // WhatsApp — solo con opt-in + teléfono + bot configurado
        if (!empty($usuario['notif_whatsapp']) && !empty($usuario['telefono'])) {
            $waMensaje = "*TRINITY* — {$titulo}\n\n{$mensaje}";
            if ($link) $waMensaje .= "\n\n" . APP_URL . $link;
            whatsapp_send($usuario['telefono'], $waMensaje);
        }

    } catch (\Throwable $e) {
        error_log('[crear_notificacion] Error: ' . $e->getMessage());
    }
}