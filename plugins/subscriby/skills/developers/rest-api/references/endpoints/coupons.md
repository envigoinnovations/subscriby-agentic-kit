# REST endpoints: Rest api, the `coupons` entity

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

