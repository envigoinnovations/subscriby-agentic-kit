---
name: subscriby-webhooks
description: Receive Subscriby webhooks: register an endpoint, verify the SB-Signature HMAC, deduplicate by SB-Event-Id and respond fast so retries stop.
---

# Subscriby webhooks

Event catalogue: `https://api.subscriby.net/webhook-events.json` (191 event names, each described in the OpenAPI document under `webhooks`). Guide: https://docs.subscriby.net/webhooks/v1.

## Subscribe

- Create an endpoint with `POST https://api.subscriby.net/v1/webhook-endpoints` from a token that holds `webhook-endpoint:create`, choosing its events; the response carries the signing `secret` once, so store it.
- An endpoint can be paused and resumed, its secret rotated (deliveries carry both signatures during a grace window), a test event sent, and its deliveries listed with their attempts under `/v1/webhook-deliveries`.

## Receive

Every delivery is a `POST` with a JSON body and these headers:

- `SB-Signature: t=<unix seconds>,v1=<hex>`: an HMAC-SHA256 over `<t>.<raw body>` with the endpoint's secret; during a rotation a `v0=` signed with the previous secret precedes it. Compute over the raw bytes before parsing, compare in constant time, and reject a `t` more than 300 seconds from now.
- `SB-Event-Id: <ulid>`: the event id; the body's `id` is the same ULID prefixed `evt_`. Deduplicate on it, because a retry carries the same id.
- `SB-Event-Name`: the same value as the body's `type`.
- `Signature-Agent`, `Signature-Input` and `Signature`: a Web Bot Auth signature (RFC 9421, Ed25519) over the request's authority and the agent header, verifiable without the secret against the key directory at `https://www.subscriby.net/.well-known/http-message-signatures-directory`; Cloudflare verifies it for endpoints behind it. The `SB-Signature` header stays the one you must check.

Answer any `2xx` within a few seconds and do the work afterwards. A non-2xx or a timeout is retried with growing delays, 8 attempts over about 4 days, then the delivery is marked dead; a dead delivery is replayed with `POST /v1/webhook-deliveries/{id}/retry`, the recent ones together with `POST /v1/webhook-deliveries/retry-dead`, or from the dashboard. An endpoint that fails 20 deliveries in a row is disabled until it is resumed.

## Related

- Signature verification with code in TypeScript, PHP and Python: https://docs.subscriby.net/webhooks/v1/signature-verification.
- Retries, dead-lettering and replay: https://docs.subscriby.net/webhooks/v1/retries-and-delivery.