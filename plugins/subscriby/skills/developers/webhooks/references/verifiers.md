# Reference scripts: Webhooks

Copy the file you need into the repository you are working in, keeping its name; each one is tested in the kit's own suite (`npm test` under `scripts/reference`) and rendered here by `npm run sync`, so `npm run check` fails on a hand edit.

## make-fixture.mjs

```js
#!/usr/bin/env node
/**
 * Writes a signed Subscriby webhook delivery fixture for testing a verifier:
 * a valid delivery, a stale one (an hour old), a tampered body, and one
 * signed with the next secret, so a handler that holds both secrets across a
 * rotation can be proved. The signature is HMAC-SHA256 over "<t>.<raw body>"
 * with the endpoint's secret, exactly as Subscriby sends it in SB-Signature.
 *
 *   node make-fixture.mjs [secret] [next-secret] > fixture.json
 */
import { createHmac, randomBytes } from "node:crypto";

const secret = process.argv[2] || `whsec_${randomBytes(24).toString("hex")}`;
const nextSecret = process.argv[3] || `whsec_${randomBytes(24).toString("hex")}`;
const now = Math.floor(Date.now() / 1000);

function sign(t, body, key) {
  return `t=${t},v1=${createHmac("sha256", key).update(`${t}.${body}`).digest("hex")}`;
}

function delivery(name, t, payload, key, mutate) {
  const body = JSON.stringify(payload);
  const header = sign(t, body, key);
  return {
    name,
    headers: {
      "SB-Signature": header,
      "SB-Event-Id": payload.id.replace(/^evt_/, ""),
      "SB-Event-Name": payload.type,
      "Content-Type": "application/json",
    },
    body: mutate ? mutate(body) : body,
  };
}

const payload = {
  id: "evt_01HXFIXTURE000000000000000",
  type: "subscription.created",
  created_at: new Date(now * 1000).toISOString(),
  api_version: "2026-05-01",
  project_id: "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  data: { synthetic: true, subscription: { id: "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b", status: "active" } },
};

const fixture = {
  generated_at: new Date(now * 1000).toISOString(),
  now,
  tolerance_seconds: 300,
  secret,
  next_secret: nextSecret,
  deliveries: [
    delivery("valid", now, payload, secret),
    delivery("stale", now - 3600, payload, secret),
    delivery("tampered", now, payload, secret, (body) => body.replace('"active"', '"canceled"')),
    delivery("rotated", now, payload, nextSecret),
  ],
  expectations: {
    valid: { current_only: true, both: true },
    stale: { current_only: false, both: false },
    tampered: { current_only: false, both: false },
    rotated: { current_only: false, both: true },
  },
};

process.stdout.write(JSON.stringify(fixture, null, 2) + "\n");
```
## verify.mjs

```js
/**
 * Verifies a Subscriby webhook delivery's SB-Signature header: HMAC-SHA256
 * over "<t>.<raw body>" with the endpoint's secret, compared in constant
 * time, with the timestamp within a tolerance (300 seconds by default).
 *
 * Pass several secrets while you roll a rotation: Subscriby signs with one
 * secret only and switches the instant you rotate, so holding the current and
 * the next secret on your side is what keeps deliveries verifying through the
 * deploy. Compute over the raw body bytes, never over re-serialised JSON.
 *
 * Self-test: node verify.mjs fixture.json   (make one with make-fixture.mjs)
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function verifySubscribySignature(header, rawBody, secrets, toleranceSeconds = 300, now = Math.floor(Date.now() / 1000)) {
  if (typeof header !== "string" || header.length === 0) return false;

  const parts = {};
  for (const pair of header.split(",")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    parts[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  }

  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > toleranceSeconds) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), "utf8");
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), body]);
  const candidates = [parts.v1, parts.v0].filter((value) => typeof value === "string" && /^[0-9a-f]{64}$/i.test(value));
  const secretList = (Array.isArray(secrets) ? secrets : [secrets]).filter((secret) => typeof secret === "string" && secret.length > 0);

  for (const secret of secretList) {
    const expected = createHmac("sha256", secret).update(signed).digest();
    for (const candidate of candidates) {
      const given = Buffer.from(candidate, "hex");
      if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
    }
  }

  return false;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const fixture = JSON.parse(readFileSync(process.argv[2] ?? "fixture.json", "utf8"));
  let failures = 0;
  for (const delivery of fixture.deliveries) {
    const expectation = fixture.expectations[delivery.name];
    const header = delivery.headers["SB-Signature"];
    const currentOnly = verifySubscribySignature(header, delivery.body, fixture.secret, fixture.tolerance_seconds, fixture.now);
    const both = verifySubscribySignature(header, delivery.body, [fixture.secret, fixture.next_secret], fixture.tolerance_seconds, fixture.now);
    const ok = currentOnly === expectation.current_only && both === expectation.both;
    if (!ok) failures += 1;
    console.log(`${ok ? "ok  " : "FAIL"} ${delivery.name.padEnd(9)} current-only=${currentOnly} both=${both}`);
  }
  process.exit(failures ? 1 : 0);
}
```
## verify.php

```php
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
```
## verify.py

```python
"""Verifies a Subscriby webhook delivery's SB-Signature header.

HMAC-SHA256 over "<t>.<raw body>" with the endpoint's secret, compared in
constant time, with the timestamp within a tolerance (300 seconds by default).

Pass several secrets while you roll a rotation: Subscriby signs with one secret
only and switches the instant you rotate, so holding the current and the next
secret on your side is what keeps deliveries verifying through the deploy.
Compute over the raw body bytes, never over re-serialised JSON.

Self-test: python verify.py fixture.json   (make one with make-fixture.mjs)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import sys
import time
from collections.abc import Iterable

HEX64 = re.compile(r"^[0-9a-f]{64}$", re.IGNORECASE)


def verify_subscriby_signature(
    header: str,
    raw_body: bytes | str,
    secrets: str | Iterable[str],
    tolerance_seconds: int = 300,
    now: int | None = None,
) -> bool:
    if not isinstance(header, str) or not header:
        return False

    parts: dict[str, str] = {}
    for pair in header.split(","):
        key, separator, value = pair.partition("=")
        if separator:
            parts[key.strip()] = value.strip()

    timestamp_text = parts.get("t", "")
    if not timestamp_text.isdigit():
        return False
    timestamp = int(timestamp_text)
    if abs((now if now is not None else int(time.time())) - timestamp) > tolerance_seconds:
        return False

    body = raw_body if isinstance(raw_body, bytes) else str(raw_body).encode("utf-8")
    signed = f"{timestamp}.".encode("utf-8") + body
    candidates = [value for value in (parts.get("v1"), parts.get("v0")) if value and HEX64.match(value)]
    secret_list = [secrets] if isinstance(secrets, str) else [secret for secret in secrets if isinstance(secret, str) and secret]

    for secret in secret_list:
        expected = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
        for candidate in candidates:
            if hmac.compare_digest(expected, candidate.lower()):
                return True

    return False


if __name__ == "__main__":
    with open(sys.argv[1] if len(sys.argv) > 1 else "fixture.json", encoding="utf-8") as handle:
        fixture = json.load(handle)

    failures = 0
    for delivery in fixture["deliveries"]:
        expectation = fixture["expectations"][delivery["name"]]
        header = delivery["headers"]["SB-Signature"]
        current_only = verify_subscriby_signature(header, delivery["body"], fixture["secret"], fixture["tolerance_seconds"], now=fixture["now"])
        both = verify_subscriby_signature(header, delivery["body"], [fixture["secret"], fixture["next_secret"]], fixture["tolerance_seconds"], now=fixture["now"])
        ok = current_only == expectation["current_only"] and both == expectation["both"]
        if not ok:
            failures += 1
        print(f"{'ok  ' if ok else 'FAIL'} {delivery['name']:<9} current-only={current_only} both={both}")

    sys.exit(1 if failures else 0)
```
