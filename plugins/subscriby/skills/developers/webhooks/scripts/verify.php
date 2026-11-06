<?php

declare(strict_types=1);

/**
 * Verifies a Subscriby webhook delivery's SB-Signature header: HMAC-SHA256
 * over "<t>.<raw body>" with the endpoint's secret, compared in constant
 * time, with the timestamp within a tolerance (300 seconds by default).
 *
 * Pass several secrets while you roll a rotation: Subscriby signs with one
 * secret only and switches the instant you rotate, so holding the current and
 * the next secret on your side is what keeps deliveries verifying through the
 * deploy. Compute over the raw body, never over re-encoded JSON.
 *
 * Self-test: php verify.php fixture.json   (make one with make-fixture.mjs)
 *
 * @param  string|list<string>  $secrets
 */
function verifySubscribySignature(string $header, string $rawBody, string|array $secrets, int $toleranceSeconds = 300, ?int $now = null): bool
{
    $parts = [];
    foreach (explode(',', $header) as $pair) {
        $position = strpos($pair, '=');
        if ($position === false) {
            continue;
        }
        $parts[trim(substr($pair, 0, $position))] = trim(substr($pair, $position + 1));
    }

    if (! isset($parts['t']) || ! ctype_digit($parts['t'])) {
        return false;
    }

    $timestamp = (int) $parts['t'];
    if (abs(($now ?? time()) - $timestamp) > $toleranceSeconds) {
        return false;
    }

    $signed = $timestamp.'.'.$rawBody;
    $candidates = array_values(array_filter([$parts['v1'] ?? null, $parts['v0'] ?? null], static fn (?string $value): bool => is_string($value) && preg_match('/^[0-9a-f]{64}$/i', $value) === 1));
    $secretList = array_values(array_filter(is_array($secrets) ? $secrets : [$secrets], static fn ($secret): bool => is_string($secret) && $secret !== ''));

    foreach ($secretList as $secret) {
        $expected = hash_hmac('sha256', $signed, $secret);
        foreach ($candidates as $candidate) {
            if (hash_equals($expected, strtolower($candidate))) {
                return true;
            }
        }
    }

    return false;
}

if (PHP_SAPI === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__) {
    $fixture = json_decode((string) file_get_contents($argv[1] ?? 'fixture.json'), true, 512, JSON_THROW_ON_ERROR);
    $failures = 0;
    foreach ($fixture['deliveries'] as $delivery) {
        $expectation = $fixture['expectations'][$delivery['name']];
        $header = $delivery['headers']['SB-Signature'];
        $currentOnly = verifySubscribySignature($header, $delivery['body'], $fixture['secret'], $fixture['tolerance_seconds'], $fixture['now']);
        $both = verifySubscribySignature($header, $delivery['body'], [$fixture['secret'], $fixture['next_secret']], $fixture['tolerance_seconds'], $fixture['now']);
        $ok = $currentOnly === $expectation['current_only'] && $both === $expectation['both'];
        if (! $ok) {
            $failures++;
        }
        printf("%s %-9s current-only=%s both=%s\n", $ok ? 'ok  ' : 'FAIL', $delivery['name'], var_export($currentOnly, true), var_export($both, true));
    }
    exit($failures === 0 ? 0 : 1);
}
