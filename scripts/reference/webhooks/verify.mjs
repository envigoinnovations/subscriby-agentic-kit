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
