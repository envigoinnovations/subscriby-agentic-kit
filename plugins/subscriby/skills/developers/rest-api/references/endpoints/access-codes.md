# REST endpoints: REST API, the `access-codes` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `access-codes`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/plans/{plan}/access-codes` | `project-access-code:view-any` | List a plan's access codes | `list_access_codes` |
| POST | `/v1/projects/{project}/plans/{plan}/access-codes/bulk-generate` | `project-access-code:create` | Generate a batch of codes | `bulk_generate_access_codes` |
| GET | `/v1/projects/{project}/plans/{plan}/access-codes/preview` | `project-access-code:view-any` | Price a batch | `preview_access_code_cost` |
| DELETE | `/v1/projects/{project}/plans/{plan}/access-codes/{accessCode}` | `project-access-code:delete` | Revoke an access code | `revoke_access_code` |

### GET `/v1/projects/{project}/plans/{plan}/access-codes`

Pages the plan's codes, newest first, fifty per page unless you say otherwise. `status` narrows the list to `unredeemed`, `redeemed` or `expired` codes; the default `all` returns every state.

Raw `access_code` values are **always masked** in API responses to the last 5 characters. Plaintext codes ship only through the creator dashboard CSV export or the per-code messages a batch can be delivered as.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.
- `status` (query, string): Which codes to list: `all` (the default), `unredeemed`, `redeemed` or `expired`. An unknown value reads as `all`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/plans/{plan}/access-codes/bulk-generate`

Queues a batch of codes for the plan and answers `202 Accepted` at once; the codes are written by a background job and delivered the way `export_type` names. Poll the list endpoint, or subscribe to `access_code.generated`, to know when the batch is ready.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT/plans/$PLAN/access-codes/bulk-generate \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "export_type": "file",
    "expiry_preset": "1_month"
  }'
```

Answers `202` with the job's key, the plan, the quantity and the cost preview the pricing endpoint describes. Bulk generation is limited to **10 batches per minute per token** in its own bucket, on top of the token's general limits; the eleventh answers `429 RATE_LIMITED` with `Retry-After`.

The validation rules are identical to the creator dashboard's: `quantity` 1 to 1,000; `export_type` `file` or `messages`, with `consent: true` required for `messages` because one bot message per code can trip the connector's rate limits; `expiry_preset` one of `no_expiry`, `1_day`, `1_week`, `1_month`, `1_year` or `custom`, the last needing `custom_expiry_amount` and `custom_expiry_type` (`days`, `weeks`, `months` or `years`).

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `quantity` (integer, required): How many codes to generate, 1 to 1,000 per batch.
- `export_type` (one of `file`, `messages`, required): How a generated batch of access codes is handed to the creator. Both routes go through the creator's chat with the platform bot, because the batch is generated on a queue after the request returned and the bot is the one channel every creator already has open. | | |---| | `file` <br/> One CSV with every code, for spreadsheets and automation. | | `messages` <br/> One forwardable message per code, capped so a batch cannot flood the chat. |
- `consent` (one of `yes`, `on`, `1`, `1`, `true`, `true`): Must be `true` when `export_type` is `messages`: one message per code is high volume and can trip the connector's rate limits, so you acknowledge it explicitly. Ignored otherwise.
- `expiry_preset` (one of `no_expiry`, `1_day`, `1_week`, `1_month`, `1_year`, `custom`, required): When a generated access code stops being redeemable. The presets cover what creators pick nearly every time; `Custom` takes an amount and a unit for the rest. The instant is resolved when the batch is generated, so every code in a batch shares one expiry. | | |---| | `no_expiry` <br/> The code stays redeemable until it is used or revoked. | | `1_day` <br/> | | `1_week` <br/> | | `1_month` <br/> | | `1_year` <br/> | | `custom` <br/> An amount of a unit, supplied alongside the preset. |
- `custom_expiry_amount` (integer): How many units the codes live for; required when `expiry_preset` is `custom`, at least 1.
- `custom_expiry_type` (any or null): The unit of `custom_expiry_amount`: `days`, `weeks`, `months` or `years`. Required when `expiry_preset` is `custom`. No minutes or hours: a code that dies within the hour it was generated is a support ticket, not a feature.


### GET `/v1/projects/{project}/plans/{plan}/access-codes/preview`

Prices a batch of `quantity` codes without queuing it, so a caller can show the worst-case charge before generating.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT/plans/$PLAN/access-codes/preview?quantity=50" \
  -H "Authorization: Bearer <token>"
```

> **Generation is free.** The metered overage is billed at **redemption time**, and only when your tier's free access-code allotment is already exhausted. Hand out codes freely; you only pay for the ones subscribers actually activate beyond the free quota.

The preview and the bulk-generate endpoint both return this cost breakdown so callers can surface the worst case ("if every one of these codes is redeemed, here is what you would owe").

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `quantity` (query, integer, required): How many codes the batch would hold, 1 to 1,000.


### DELETE `/v1/projects/{project}/plans/{plan}/access-codes/{accessCode}`

Deletes an unredeemed code so it can no longer be claimed. The code is resolved within the plan, so an id from another plan is `404 RESOURCE_NOT_FOUND`. Answers `204` with no body; no webhook fires.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `accessCode` (path, string, required): The unredeemed code, resolved within the plan by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

