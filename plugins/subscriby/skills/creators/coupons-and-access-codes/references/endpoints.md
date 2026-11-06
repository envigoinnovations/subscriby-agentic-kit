# REST endpoints: Coupons and Access Codes

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `coupons`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/coupons` | `project-coupon:view-any` | List a project's coupons | `list_coupons` |
| POST | `/v1/projects/{project}/coupons` | `project-coupon:create` | Create a coupon | `create_coupon` |
| DELETE | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:delete` | Delete a coupon | `delete_coupon` |
| GET | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:view` | Get a coupon | `get_coupon` |
| PATCH | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:update` | Update a coupon | `update_coupon` |
| POST | `/v1/projects/{project}/coupons/{coupon}/activate` | `project-coupon:update` | Activate a coupon | `activate_coupon` |
| POST | `/v1/projects/{project}/coupons/{coupon}/deactivate` | `project-coupon:update` | Deactivate a coupon | `deactivate_coupon` |

### GET `/v1/projects/{project}/coupons`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons?active=true&per_page=25&page=1" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's coupons, newest first. `active` filters on the creator's on/off switch only; `code` finds one exact code.

> `active=true` is not the same as redeemable. A coupon can be switched on and still not apply: outside its window, fully claimed, or capped for that subscriber. Read `redeemable` on each row for the combined answer.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `active` (query, boolean): Keep only coupons whose on/off switch is in this position. Not the same as redeemable: read `redeemable` on each row for the combined answer.
- `code` (query, string): Find one coupon by its exact code, compared in upper case.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/coupons`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BLACKFRIDAY",
    "name": "Black Friday 2026",
    "discount_type": "percentage",
    "discount_value": 25,
    "max_redemptions": 500,
    "max_redemptions_per_user": 1,
    "starts_at": "2026-11-27T00:00:00Z",
    "expires_at": "2026-12-01T00:00:00Z",
    "active": true
  }'
```

Answers `201` with the coupon. `duration` is not yours to set: only first-payment discounts exist today, so it is always `once` on the way out.

> **`code` is uppercased before the uniqueness check.** Sending `blackfriday` when `BLACKFRIDAY` exists in the project is a `422`, not a second coupon. Uniqueness is per project, so two different projects may both have `BLACKFRIDAY`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `code` (string, required): The code subscribers type, 3 to 64 letters, numbers and dashes. Stored and matched in upper case, and uppercased before the uniqueness check: `blackfriday` when `BLACKFRIDAY` exists in the project is refused, not a second coupon. Two projects may both hold the same code.
- `name` (string, required): A creator-facing label, 3 to 255 characters, never shown to subscribers.
- `discount_type` (one of `percentage`, `fixed`, required)
- `discount_value` (number, required): Greater than 0; at most 100 when `discount_type` is `percentage`.
- `currency_id` (string): Required when `discount_type` is `fixed`, and it must match the currency of the plans the coupon applies to. Refused as meaningless on a percentage coupon.
- `duration` (one of `once`): Accepted for forward compatibility but only `once` is honoured: first-payment discounts are the only kind that exist today.
- `max_redemptions` (integer): The total cap across everyone, 1 to 1,000,000. Omit or send null for unlimited.
- `max_redemptions_per_user` (integer): How many times one member may redeem the code, 1 to 1,000. Defaults to 1.
- `minimum_amount` (number): The order floor, in the plan's own currency; greater than 0.
- `starts_at` (string): When redemption opens, ISO 8601. Omit for immediately.
- `expires_at` (string): When redemption closes, ISO 8601; must be after `starts_at`. Omit for never.
- `active` (boolean): Whether the code can be redeemed from the start. Defaults to true.
- `plan_ids` (array of string): Restrict the code to these plans of the project, at most 200. Omit or send `[]` for every plan, including plans added later.


### DELETE `/v1/projects/{project}/coupons/{coupon}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons/4b9d3e08-a1f6-4275-9c83-7e01d6a2f594 \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

Removes the code and its redemption history; deactivating keeps both. Answers `204` with no body.

> **A delete can be refused.** If any subscriber holds a live reservation, a checkout in flight with this discount already quoted to a payment provider, the delete answers `422` and asks you to deactivate instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/coupons/{coupon}`

One coupon with its currency ISO code loaded. A coupon of another project, or a deleted one, is `404 RESOURCE_NOT_FOUND`.

### Three fields that are easy to misread

> **`plan_ids: []` means every plan, not no plans.** An empty array is how the coupon itself reads an empty plan relation: the code applies to **every** plan in the project, including plans added later. Treating it as "restricted to nothing" inverts the meaning.

**`redemptions.remaining` is derived, not stored.** Prefer it over computing `max_redemptions - count` yourself. The quota counts settled redemptions *plus* reservations whose hold has not expired, so an in-flight checkout is already accounted for, and an abandoned one returns its slot without any sweeper job. Your own subtraction will disagree.

**`discount.value` is a decimal string with four places**: `"25.0000"` for 25% off, `"10.0000"` for ten of the coupon's currency. Parse it as a decimal, never a float. `currency_id` is `null` on a percentage coupon and set on a fixed-amount one, because a percentage applies to a plan in any currency and a fixed amount only to plans priced in its own.

`currency` (the ISO code) is present only when the relation is loaded: on a single read, a create and an update, not on every list row.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/coupons/{coupon}`

Accepts the same fields as create, all optional. Changing terms is **not retroactive**: subscribers who already redeemed keep exactly what they paid, and the change applies to redemptions from that point on.

Raising `max_redemptions` on an exhausted coupon makes it redeemable again. Lowering it below the current count does not claw anything back; the coupon simply reports `remaining: 0`. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `code` (string): A new code, 3 to 64 letters, numbers and dashes, uppercased before the uniqueness check against the project's other live coupons.
- `name` (string): A new creator-facing label, 3 to 255 characters.
- `discount_type` (one of `percentage`, `fixed`)
- `discount_value` (number): Greater than 0; at most 100 when the coupon is, or becomes, a percentage.
- `currency_id` (string): Required when the coupon is, or becomes, `fixed` and it has no currency yet; refused as meaningless on a percentage coupon.
- `duration` (one of `once`): Accepted for forward compatibility but only `once` is honoured.
- `max_redemptions` (integer): The new total cap, 1 to 1,000,000, or null for unlimited. Raising it on an exhausted coupon makes it redeemable again; lowering it below the current count claws nothing back, the coupon simply reports `remaining: 0`.
- `max_redemptions_per_user` (integer): How many times one member may redeem the code, 1 to 1,000.
- `minimum_amount` (number): The order floor, in the plan's own currency; greater than 0, or null for none.
- `starts_at` (string): When redemption opens, ISO 8601, or null for immediately.
- `expires_at` (string): When redemption closes, ISO 8601, or null for never.
- `active` (boolean): The on/off switch; prefer the activate and deactivate endpoints, which fire their own events.
- `plan_ids` (array of string): The plans to restrict the code to, at most 200; `[]` opens it to every plan.


### POST `/v1/projects/{project}/coupons/{coupon}/activate`

Switches the code on so new redemptions are accepted again, within its window and cap. Emits `coupon.activated` rather than `coupon.updated`, so an automation watching availability has one event to subscribe to. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/coupons/{coupon}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons/4b9d3e08-a1f6-4275-9c83-7e01d6a2f594/deactivate \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The safe way to retire a code: new redemptions stop immediately and every redemption already recorded is kept. A checkout **already in flight** with the code still completes, so expect a late `coupon.redeemed` shortly after. Emits `coupon.deactivated`. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


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

