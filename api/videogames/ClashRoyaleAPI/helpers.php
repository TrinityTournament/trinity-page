<?php
// ══════════════════════════════════════════════════════════
//  TRINITY — Clash Royale: helpers compartidos
//  Porteado de clashroyale.js (script de testeo en Node) a PHP,
//  para que get-stats.php pueda reutilizar la misma lógica.
// ══════════════════════════════════════════════════════════

const CR_API_BASE = 'https://sprclll.vercel.app/royale/players/';

// ── Normalizar tag: acepta con o sin '#', mayúsculas, espacios ──
function cr_normalizar_tag(string $tagCrudo): ?string {
    $tag = strtoupper(trim($tagCrudo));
    $tag = ltrim($tag, '#');
    $tag = preg_replace('/\s+/', '', $tag);

    // Tags válidos de Clash Royale: A-Z0-9, normalmente 3-14 caracteres
    if (!preg_match('/^[A-Z0-9]{3,14}$/', $tag)) {
        return null;
    }
    return $tag;
}

// ── Arena: misma lógica que getArena() en clashroyale.js ──
// A partir de la arena 14 la API devuelve "Arena_L13" en vez de "Arena_14",
// por lo que hay que sumarle 13 al número que sigue a la "L".
function cr_get_arena_info(string $arenaRawName): array {
    $partes = explode('_', $arenaRawName);
    $arena  = $partes[1] ?? '1';

    if (str_starts_with($arena, 'L')) {
        $numero = (int) substr($arena, 1) + 13;
    } else {
        $numero = (int) $arena;
    }

    $ext = ($numero == 11 || $numero == 25) ? 'webp' : 'png';

    return [
        'numero' => $numero,
        // Ruta servida tal cual está en /assets/ArenasCR — el front la resuelve con BASE_URL
        'imagen' => "/assets/ArenasCR/Arena{$numero}.{$ext}",
    ];
}

// ── Evolución/héroe: misma lógica que getEvolution() en clashroyale.js ──
function cr_get_evolution_label(int $evolutionLevel): string {
    if ($evolutionLevel > 2) return 'HEROE_EVO';
    if ($evolutionLevel > 1) return 'HEROE';
    if ($evolutionLevel > 0) return 'EVO';
    return '';
}

// ── Elegir el ícono correcto de una carta según su slot y nivel de evolución ──
// Las primeras 3 cartas del mazo pueden tener versión evolucionada/héroe.
function cr_get_card_image(array $card, int $index): string {
    $evo  = $card['evolutionLevel'] ?? 0;
    $urls = $card['iconUrls'] ?? [];

    if ($index < 3) {
        if ($evo >= 3 && !empty($urls['heroMedium']))      return $urls['heroMedium'];
        if ($evo >= 1 && !empty($urls['evolutionMedium'])) return $urls['evolutionMedium'];
    }
    return $urls['medium'] ?? '';
}

// ── Llamar a la API externa de Clash Royale (server-side, sin key) ──
// Lanza RuntimeException con un mensaje apto para mostrar al usuario.
function cr_fetch_profile(string $tag): array {
    $url = CR_API_BASE . rawurlencode($tag);

    $ctx = stream_context_create([
        'http' => [
            'method'        => 'GET',
            'timeout'       => 10,
            'ignore_errors' => true,
            'header'        => "Accept: application/json\r\n",
        ],
    ]);

    $body = @file_get_contents($url, false, $ctx);

    $statusLine = $http_response_header[0] ?? '';
    preg_match('/\s(\d{3})\s/', $statusLine, $m);
    $status = isset($m[1]) ? (int) $m[1] : 0;

    if ($body === false) {
        throw new RuntimeException('No se pudo conectar con la API de Clash Royale.');
    }

    if ($status === 404) {
        throw new RuntimeException('No se encontró ningún jugador con ese tag.');
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('La API de Clash Royale no respondió correctamente. Intentá de nuevo en unos minutos.');
    }

    $json = json_decode($body, true);
    if (!is_array($json) || !isset($json['data'])) {
        throw new RuntimeException('Respuesta inesperada de la API de Clash Royale.');
    }

    return $json['data'];
}

// ── Armar el payload final que consume el front (card de estadísticas) ──
function cr_build_stats_payload(array $profile): array {
    $deckCrudo = $profile['currentDeck'] ?? [];
    $deck = [];
    foreach ($deckCrudo as $i => $card) {
        $deck[] = [
            'name'           => $card['name'] ?? '—',
            'level'          => $card['level'] ?? null,
            'maxLevel'       => $card['maxLevel'] ?? null,
            'elixirCost'     => $card['elixirCost'] ?? null,
            'rarity'         => $card['rarity'] ?? null,
            'evolutionLevel' => $card['evolutionLevel'] ?? 0,
            'evolutionLabel' => cr_get_evolution_label($card['evolutionLevel'] ?? 0),
            'image'          => cr_get_card_image($card, $i),
        ];
    }

    $torre = $profile['currentDeckSupportCards'][0] ?? null;
    $arenaInfo = cr_get_arena_info($profile['arena']['rawName'] ?? 'Arena_1');

    $wins   = $profile['wins']   ?? 0;
    $losses = $profile['losses'] ?? 0;

    return [
        'nombre'       => $profile['name'] ?? '—',
        'tag'          => $profile['tag'] ?? '',
        'nivelExp'     => $profile['expLevel'] ?? null,
        'trofeos'      => $profile['trophies'] ?? 0,
        'mejorTrofeos' => $profile['bestTrophies'] ?? 0,
        'victorias'    => $wins,
        'derrotas'     => $losses,
        'donaciones'   => $profile['donations'] ?? 0,
        'clan'         => isset($profile['clan']['name']) ? $profile['clan']['name'] : null,
        'arena'        => [
            'nombre'  => $profile['arena']['name'] ?? '—',
            'numero'  => $arenaInfo['numero'],
            'imagen'  => $arenaInfo['imagen'],
        ],
        'torre' => $torre ? [
            'nombre' => $torre['name']  ?? '—',
            'nivel'  => $torre['level'] ?? null,
            'imagen' => $torre['iconUrls']['medium'] ?? null,
        ] : null,
        'mazo' => $deck,
    ];
}
