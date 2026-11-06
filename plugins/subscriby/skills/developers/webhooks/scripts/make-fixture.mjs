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
