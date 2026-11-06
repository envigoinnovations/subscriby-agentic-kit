---
name: rest-api
description: "This skill should be used when the user asks how to call the Subscriby REST API, what the base URL, bearer header or response envelopes look like, how to paginate, send an Idempotency-Key, honour rate limits, read the OpenAPI document, or build a client in TypeScript, PHP or Python."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Calling the REST API

`https://api.subscriby.net/v1` is every operation the creator dashboard can perform, behind a personal access token: a versioned, additive contract described by an OpenAPI 3.1 document and designed so that an agent or a script can self-correct from the error it receives. This skill is the contract; [references/endpoints.md](references/endpoints.md) is every operation by entity with its method, path, required ability and fields.

## The contract at a glance

- **Authentication**: `Authorization: Bearer sbt_live_…` on every request; sessions, cookies and keys in the query string are refused. The `tokens-and-abilities` skill covers the token's format, abilities and scope. The team is read from the token, never from the body.
- **Writes**: `POST`, `PATCH`, `PUT` and `DELETE` all require an `Idempotency-Key` header.
- **Envelopes**: one object answers `{"data": {…}}`; a list answers `{"data": [...], "links": {first, last, prev, next}, "meta": {current_page, from, last_page, per_page, to, total}}`; a failure answers `{"error": {code, message, docs_url, remediation, request_id, fields?, context?}}` (the `errors-and-retries` skill).
- **Identifiers**: a bare lowercase hyphenated UUID with no type prefix, stored as an opaque string and never parsed or sorted. Two exceptions, documented where they appear: the webhook envelope `id` is `evt_` plus a ULID (the `SB-Event-Id` header carries it without the prefix, and it sorts by creation time), and a token's `id` is a positive integer serialised as a string.
- **Timestamps** are ISO 8601 with an offset, such as `2026-02-14T07:12:33+00:00`.

## Reading

Projects are the root: `GET /v1/projects`, then under a project its plans (and each plan's access codes), pass windows, members, coupons, payment methods, resources, broadcasts, creator tasks, distribution, recovery and support. Team-wide lists sit at `/v1/subscriptions`, `/v1/teams`, `/v1/roles`, `/v1/groups`, `/v1/tokens`, `/v1/webhook-endpoints`, `/v1/webhook-deliveries`, `/v1/webhook-events`, `/v1/connectors`, `/v1/activity` and `/v1/analytics`; `/v1/me` is the signed-in account, `/v1/teams/current` the team the token is frozen to, and `/v1/ping` answers without a token.

Lists are page-based: `page` (1-based) and `per_page` (default 25 on most lists, 50 on access codes, 3 on the webhook events sample; capped at 100 and clamped silently; `limit` is accepted as an alias where a list once documented it). `data` is newest first. Stop when `meta.current_page` reaches `meta.last_page`, or follow `links.next` until it is null; a page past the end is an empty `data` with `meta.total` still set. Filter first (`status`, `plan_id` and the filters each list documents) rather than paging a whole tenant. The REST API publishes no cursors; the one keyset-paged list is the MCP tool `list_transactions`, built for years of payment history. For a live feed of changes, subscribe to webhooks instead of polling (the `webhooks` skill).

## Writing

Every write carries a fresh UUID in `Idempotency-Key`, one per logical operation, reused across that operation's retries:

| The server sees | It answers |
| --- | --- |
| A key for the first time | A fresh response |
| The same key with the same body | The cached response, with `Idempotent-Replay: true` |
| The same key with a different body | `409 IDEMPOTENCY_KEY_REUSED` |
| The same key while the first request still runs | `425 IDEMPOTENCY_REPLAY_IN_PROGRESS`: wait, then send again |
| No key | `400 IDEMPOTENCY_KEY_MISSING` |

A successful response is cached for 24 hours under the token, method, path and key, with the body encrypted at rest, so the one-time secret of a token mint or an endpoint registration is safe in a replay. `4xx` and `5xx` answers are never cached, so a corrected request may reuse its key. Reuse detection hashes the raw body, so serialise once and resend the same bytes. `GET`, the public routes and the deliveries Subscriby makes to an endpoint need no key.

A plan is kind-discriminated: `kind` is `subscription`, `pass` or `pass_series`, each with its own block of fields, and a block belonging to another kind is refused rather than ignored (the `plans-and-passes` skill).

## Limits

| Bucket | Applies to | Limit |
| --- | --- | --- |
| `api-token` | Every authenticated `/v1/*` route | 300 requests a minute and 10,000 an hour per token |
| `access-codes-generate` | Bulk access-code generation | 10 operations a minute per token |
| `webhook-test` | Test deliveries | 5 a minute per endpoint |
| `mcp` | Tool calls on `mcp.subscriby.net` | 120 a minute per credential |

Buckets count per token, not per IP, and concurrency does not beat them. Every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`; a `429 RATE_LIMITED` carries `Retry-After` in seconds, to be honoured before the retry. The hourly cap allows a sustained 160 a minute or so, and support raises the ceiling per token on request. Poll no faster than every 15 seconds, chunk imports into batches of a hundred or two, and raise `quantity` on a bulk call rather than issuing more calls.

## Versioning

`v1` is the only contract. Additive changes ship at any time and a client must tolerate them: a new optional parameter, a new response field, a new enum case (a subscription status, a webhook event, a payment provider), a new endpoint, a new error code, a reworded `error.message`. Never on `v1`: a removed or renamed field, a changed type, a new required parameter, changed semantics, a renamed path, a changed status code. A breaking change would ship as `/v2/*` beside `/v1/*`, with `Sunset` and `Deprecation` headers (RFC 8594) through a long transition and `410 Gone` after it. Webhook envelopes carry `api_version`, and additive payload changes leave it unchanged.

## The OpenAPI document

| URL | What it is |
| --- | --- |
| `https://api.subscriby.net/openapi.json` | OpenAPI 3.1 for every operation and every webhook event, generated from the code on every deploy |
| `https://api.subscriby.net/postman.json` and `postman-environment.json` | The same document as a Postman collection: worked bodies, saved responses, chained ids, signed webhook simulations |
| `https://api.subscriby.net/abilities.json` | The ability catalogue |
| `https://api.subscriby.net/.well-known/ai-plugin.json` | The manifest that points an agent at the document |

Each operation carries `x-required-scopes` (the abilities the token needs), `x-webhook-events` (what it can fire) and `x-mcp-tools` (the tools that wrap it); each webhook entry carries the first. The `openapi-toolkits` skill covers Postman, Make, LangChain and code generation from it.

## A client that honours the contract

[references/client.md](references/client.md) carries `client.mjs`, a dependency-free Node module with the rules baked in: the bearer from a token the caller passes in (from the application's own secret store, never from source), a fresh `Idempotency-Key` on every write kept across that write's retries, a retry on `429` after `Retry-After`, on `425` and on `5xx` with capped backoff and jitter, never on another `4xx`, the error envelope raised as `SubscribyApiError` with `code`, `status`, `requestId`, `docsUrl`, `remediation` and `fields`, and `paginate()` as an async iterator over every page. Copy it into the repository; its self-test (`node client.mjs --self-test`) proves each rule against a local mock server and runs in the kit's own suite.

```js
import { createSubscribyClient, SubscribyApiError } from "./client.mjs";

const api = createSubscribyClient({ token: subscribyToken }); // the token from your application's secret store
const { data: team } = await api.get("teams/current");
for await (const project of api.paginate("projects")) console.log(project.name);
try {
  const { data: endpoint, secret } = await api.post("webhook-endpoints", {
    name: "CRM sync",
    url: "https://example.com/hooks/subscriby",
    events: ["subscription.activated"],
  });
} catch (error) {
  if (error instanceof SubscribyApiError && error.code === "VALIDATION_FAILED") console.error(error.fields);
  else throw error;
}
```

In PHP, Laravel's HTTP client carries the same rules in one chain; the key is set once on the pending request, so every retry resends it:

```php
$response = Http::withToken($token) // the token from the application's own configuration
    ->acceptJson()
    ->withHeaders(['Idempotency-Key' => (string) Str::uuid()])
    ->retry(times: 3, sleepMilliseconds: 500, when: fn ($exception) => in_array($exception?->response?->status(), [425, 429, 500, 502, 503, 504], true))
    ->post('https://api.subscriby.net/v1/webhook-endpoints', [
        'name' => 'CRM sync',
        'url' => 'https://example.com/hooks/subscriby',
        'events' => ['subscription.activated'],
    ]);
```

In Python, a `requests` session with a `urllib3` retry policy does the waiting, `Retry-After` included; the key is added per write:

```python
import uuid

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
session.headers["Authorization"] = f"Bearer {token}"  # the token from the application's secret store
session.mount("https://", HTTPAdapter(max_retries=Retry(
    total=3, backoff_factor=0.5, status_forcelist=[425, 429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST", "PATCH", "PUT", "DELETE"], respect_retry_after_header=True,
)))
response = session.post(
    "https://api.subscriby.net/v1/webhook-endpoints",
    json={"name": "CRM sync", "url": "https://example.com/hooks/subscriby", "events": ["subscription.activated"]},
    headers={"Idempotency-Key": str(uuid.uuid4())},
)
```

## REST, MCP or webhooks

- REST when code calls Subscriby: a backend, a workflow engine, a model that does not speak MCP.
- MCP (the `mcp-clients` and `custom-agents` skills) when a model drives the work: the same operations as typed tools, abilities enforced per tool, destructive ones flagged.
- Webhooks (the `webhooks` and `webhook-events` skills) whenever Subscriby should tell the application that something happened; polling a list for changes is the expensive way to learn what a signed delivery would have said.

## Do not

- Do not put a token in the query string, in source, in a log or in a URL.
- Do not retry a `4xx` other than `429` and `425`, and never without the same `Idempotency-Key`.
- Do not assume a list fits in one page, or that `per_page` above the cap is honoured.
- Do not parse, sort or infer from an id, and never invent a path: the reference is the contract.
- Do not call the dashboard or a portal from code; they are for people, and the API is the only supported door.

## References

- [references/endpoints.md](references/endpoints.md): every endpoint by entity with method, path, required ability and fields.
- [references/skill-rest-api.md](references/skill-rest-api.md): the skill the site publishes at `/.well-known/agent-skills/subscriby-rest-api/SKILL.md`, verbatim.
- [references/client.md](references/client.md): the Node client with its self-test, to copy into a repository.
- Documentation: [REST API](https://docs.subscriby.net/api/v1), [quickstart](https://docs.subscriby.net/api/v1/quickstart), [idempotency](https://docs.subscriby.net/api/v1/idempotency), [pagination](https://docs.subscriby.net/api/v1/pagination), [rate limiting](https://docs.subscriby.net/api/v1/rate-limiting), [versioning and deprecation](https://docs.subscriby.net/api/v1/versioning-and-deprecation), [OpenAPI](https://docs.subscriby.net/api/v1/openapi), [API reference](https://docs.subscriby.net/api/v1/reference).
