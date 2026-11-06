---
name: webhooks
description: "This skill should be used when the user asks to receive Subscriby webhooks, register or manage a webhook endpoint, verify the SB-Signature header, handle retries, dead deliveries or replays, rotate a signing secret, allow deliveries through a firewall, or debug a failing delivery."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Receiving Subscriby webhooks

Outbound webhooks are the only way Subscriby talks to an application unprompted: when something happens (a subscription activates, a payment fails, a member is banned) Subscriby POSTs a signed JSON envelope to every endpoint subscribed to the event. Delivery is at-least-once, not ordered, retried with backoff, dead-lettered after the last attempt, and replayable. The `webhook-events` skill carries the catalogue of events; this one carries the endpoint, the handler and the operations.

## Register an endpoint

Over REST, `POST /v1/webhook-endpoints` with `{name, url, events[]}` from a token that holds `webhook-endpoint:create`; over MCP, `create_webhook_endpoint` (`name`, `url`, `events`, optional `project_id` to deliver one project's events, `allowed_ips`, `is_active`). The response carries the signing `secret` **once**; store it in the handler's environment at once, because nothing can read it again. Only public `https://` targets are accepted: `http://`, loopback, private, link-local and reserved hosts, or a public name resolving to one, are refused. An endpoint can be paused and resumed, its secret rotated, a test delivery fired, and its deliveries listed with their attempts.

## Every delivery

A `POST` with `Content-Type: application/json` and these headers:

- `SB-Signature: t=<unix seconds>,v1=<hex>`: HMAC-SHA256 over `<t>.<raw body>` with the endpoint's secret. Exactly one `v1=` per delivery; the header never carries a `v0=`.
- `SB-Event-Id: <ulid>`: the event id; the body's `id` is the same ULID prefixed `evt_`, so strip the prefix before comparing. A retry carries the same id.
- `SB-Event-Name`: the same value as the body's `type`.
- `Signature-Agent`, `Signature-Input` and `Signature`: a Web Bot Auth signature (RFC 9421, Ed25519) over the request's authority and the agent header, verifiable without the secret against `https://www.subscriby.net/.well-known/http-message-signatures-directory`; Cloudflare verifies it for endpoints behind it. It proves the sender is Subscriby; the HMAC proves the delivery was made for this endpoint and covers the body. Verify the HMAC always.

The body is the envelope `{id, type, created_at, api_version, project_id, data}`; `project_id` is null for team-scoped events (`billing.*`); `data` is the event's payload, whose keys the catalogue lists. Member emails, card data, fee breakdowns and credentials are never in a payload.

## The handler, in order

1. **Read the raw body bytes** before any JSON parsing; canonicalisation differs between libraries and breaks the HMAC.
2. **Verify the signature** with a constant-time comparison and reject a `t` more than 300 seconds from now (the replay window). The reference verifiers in [references/verifiers.md](references/verifiers.md) do exactly this and take a list of secrets: `verify.mjs`, `verify.php` and `verify.py`, each self-testing against a fixture from the `make-fixture.mjs` beside them, all four to copy into a repository. The `/subscriby:verify-webhook` command does that copying.
3. **Deduplicate on `SB-Event-Id`** for at least 24 hours; retries deliver the same event again, and deliveries are not ordered (`subscription.expired` may arrive before its `subscription.cancelled` under retry), so reconcile from the most recent event per resource.
4. **Answer any 2xx quickly** (the budget is 30 seconds; aim for a few) and do the work afterwards on a queue of the application's own. A non-2xx, a timeout, a TLS or DNS failure counts as a failure; a 4xx is retried like a 5xx, so to drop an event deliberately answer 200 and ignore it.
5. **Branch on `data.synthetic`**: a test delivery is typed `subscription.created` with a marker payload and should skip business logic.

```ts
import { verifySubscribySignature } from "./verify.mjs";

app.post("/webhooks/subscriby", express.raw({ type: "application/json" }), async (request, response) => {
  const secrets = [currentSecret, previousSecret].filter(Boolean); // both from the application's secret store, the second during a rotation
  if (!verifySubscribySignature(request.get("SB-Signature"), request.body, secrets)) return response.status(400).end();
  const event = JSON.parse(request.body.toString("utf8"));
  if (await seen(request.get("SB-Event-Id"))) return response.status(200).end();
  await queue.push(event);
  response.status(200).end();
});
```

## Retries, dead letters, replay

Up to eight attempts with growing waits (10 seconds, 30 seconds, 2 minutes, 10 minutes, 1 hour, 6 hours, 24 hours, then 72 hours before the dead letter), about four days in all; after the last failure the delivery is `dead` and kept. An endpoint that fails twenty deliveries in a row is disabled until it is resumed. `list_webhook_deliveries` (`status` `pending`, `delivered`, `failed`, `dead`) and `get_webhook_delivery` read the log with the posted envelope, the handler's response excerpt and the next attempt; `retry_webhook_delivery` re-queues one dead or failed row; `retry_dead_webhook_deliveries` (`since`, default the last 24 hours) replays the recent dead ones after a fix, each posting its event again, so confirm the consumer is healthy first.

## Secrets, rotation and allowlists

- `rotate_webhook_endpoint_secret` replaces the secret **in place and at once**: there is no grace window and no dual signing. The safe order is deploy a handler that accepts both the current and the next secret, rotate, then drop the old value; the reference verifiers take an array for exactly this. Only the member who registered the endpoint or the team owner may rotate, pause, test or delete it (`FORBIDDEN` otherwise).
- `allowed_ips` restricts where Subscriby delivers: every address the endpoint's hostname resolves to must fall inside the list or the delivery is dead-lettered unposted. It does not authenticate what arrives; keep verifying.
- `test_webhook_endpoint` fires a synthetic delivery through the real queue (five a minute per endpoint); `pause_webhook_endpoint` and `resume_webhook_endpoint` stop and restart deliveries; `delete_webhook_endpoint` removes the endpoint. All but the test are destructive: confirm.

## Do not

- Do not parse the JSON before verifying, compare with `==`, or skip the timestamp check.
- Do not store the secret beside the URL in version control; it is a credential.
- Do not promise a grace window after a rotation; there is none.
- Do not rely on order or on exactly-once delivery.

## References

- [references/tools.md](references/tools.md): the twelve tools with their arguments.
- [references/endpoints.md](references/endpoints.md): the REST twins for endpoints, deliveries, the events catalogue and the subscription aliases.
- [references/abilities.md](references/abilities.md): the `webhooks` abilities (`webhook-endpoint:manage` is retired and still honoured).
- [references/skill-webhooks.md](references/skill-webhooks.md): the skill the site publishes, verbatim; its rotation paragraph still describes a grace window the platform does not have, and the documentation page above is the rule.
- [references/verifiers.md](references/verifiers.md): `make-fixture.mjs`, `verify.mjs`, `verify.php` and `verify.py`, tested in the kit's own suite, to copy into a repository.
- Documentation: [Outbound webhooks](https://docs.subscriby.net/webhooks/v1), [quickstart](https://docs.subscriby.net/webhooks/v1/quickstart), [signature verification](https://docs.subscriby.net/webhooks/v1/signature-verification), [retries and delivery](https://docs.subscriby.net/webhooks/v1/retries-and-delivery), [testing and debugging](https://docs.subscriby.net/webhooks/v1/testing-and-debugging), [security](https://docs.subscriby.net/webhooks/v1/security).
