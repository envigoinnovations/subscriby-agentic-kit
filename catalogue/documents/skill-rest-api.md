---
name: subscriby-rest-api
description: Call the Subscriby REST API: authenticate with a personal access token, page through lists, send an Idempotency-Key on every write, honour the rate limits and read the OpenAPI document.
---

# Subscriby REST API

Base URL `https://api.subscriby.net/v1`. Every request carries `Authorization: Bearer <token>`; sessions and keys in the query string are not accepted. The OpenAPI 3.1 document at `https://api.subscriby.net/openapi.json` describes every operation and every webhook event; the guide is at https://docs.subscriby.net/api/v1 and the API catalog at `https://www.subscriby.net/.well-known/api-catalog`.

## Tokens

- A personal access token reads `sbt_live_<id>_<secret>` on production and `sbt_test_<id>_<secret>` elsewhere; a token minted in one environment is refused by the other.
- The creator mints one under Settings → API Tokens, or over the API with `POST /v1/tokens` from a token that holds `token:create`. The plain-text token is shown once.
- A token carries an explicit list of abilities (catalogue: `https://api.subscriby.net/abilities.json`) and is frozen to one team; every operation names the ability it checks. Confirm a token with `GET /v1/teams/current`.

## Reading

- Projects are the root: `GET /v1/projects`, then under a project its plans and their access codes, pass windows, members, coupons, payment methods, resources, broadcasts, creator tasks, distribution, recovery and support. Team-wide lists sit at `/v1/subscriptions`, `/v1/support`, `/v1/teams`, `/v1/roles`, `/v1/groups`, `/v1/tokens`, `/v1/webhook-endpoints`, `/v1/webhook-deliveries`, `/v1/webhook-events`, `/v1/connectors`, `/v1/activity` and `/v1/analytics`; `/v1/me` is the signed-in account.
- A list answers `{"data": [...], "links": {...}, "meta": {...}}`, newest first, paged by `page` and `per_page` (at most 100; a few lists call it `limit`); each operation documents its default. Follow `links.next` until it is null.

## Writing

- Every `POST`, `PATCH`, `PUT` and `DELETE` needs an `Idempotency-Key` header, a fresh UUID per distinct operation. The same key within 24 hours returns the first response instead of repeating the write; a missing key is refused as `IDEMPOTENCY_KEY_MISSING`.
- A plan is kind-discriminated: `kind` is one of `subscription`, `pass`, `pass_series`, each with its own block of fields.

## Errors and limits

- An error is `{"error": {"code", "message", "docs_url", "request_id"}}`: branch on `code`, a stable string, and quote `request_id` when asking for help.
- Limits apply per token: 300 requests a minute and 10,000 an hour. Read `X-RateLimit-Limit` and `X-RateLimit-Remaining`; on a 429 wait the `Retry-After` seconds before retrying.

## Related

- Webhooks instead of polling: https://docs.subscriby.net/webhooks/v1 (skill `subscriby-webhooks`).
- The same operations over the Model Context Protocol: `https://mcp.subscriby.net` (skill `subscriby-mcp`).