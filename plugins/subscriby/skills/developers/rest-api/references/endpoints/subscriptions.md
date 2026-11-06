# REST endpoints: Rest api, the `subscriptions` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `subscriptions`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/subscriptions` | `project-subscription:view-any` | List subscriptions | `list_subscriptions` |
| GET | `/v1/subscriptions/{subscription}` | `project-subscription:view` | Get a subscription | `get_subscription` |
| POST | `/v1/subscriptions/{subscription}/cancel` | `project-subscription:update` | Cancel a subscription | `cancel_subscription` |
| GET | `/v1/subscriptions/{subscription}/grants` | `project-subscription:view` | List a subscription's grants | `list_subscription_grants` |
| POST | `/v1/subscriptions/{subscription}/grants/reissue` | `project-subscription:update` | Reissue a subscription's access | `reissue_subscription_grants` |
| GET | `/v1/subscriptions/{subscription}/pass-moves` | `project-subscription:view` |  |  |
| POST | `/v1/subscriptions/{subscription}/pause` | `project-subscription:update` | Pause a subscription | `pause_subscription` |
| POST | `/v1/subscriptions/{subscription}/reactivate` | `project-subscription:update` | Reactivate a subscription | `reactivate_subscription` |
| POST | `/v1/subscriptions/{subscription}/remind` | `project-subscription:update` | Remind a pass holder | `remind_pass_holder` |
| POST | `/v1/subscriptions/{subscription}/remind-connection` | `project-subscription:update` | Remind a member to connect | `remind_member_to_connect` |
| POST | `/v1/subscriptions/{subscription}/unpause` | `project-subscription:update` | Unpause a subscription | `unpause_subscription` |

### GET `/v1/subscriptions`

```bash
curl "https://api.subscriby.net/v1/subscriptions?status=active" \
  -H "Authorization: Bearer <token>"
```

The held subscriptions across every project the token reaches, newest first, paged with `page` and `per_page` (default 25; `limit` is accepted as an alias). `status` matches a single payment status and `plan_id` scopes to one plan. Rows carry no `grants`.

A token minted with `scope:project:<uuid>` entries lists only the subscriptions of those projects, and a subscription of any other project is `404 RESOURCE_NOT_FOUND` on every endpoint of this resource.

**Parameters**

- `status` (query, string): Match a single payment status: `trialing`, `active`, `incomplete`, `expired`, `past_due`, `canceled`, `unpaid`, `paused`, `processing`, `succeeded`, `capturable` or `failed`. An unknown value is refused.
- `plan_id` (query, string or null): Scope to one plan.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/subscriptions/{subscription}`

One subscription with its `grants` embedded.

`payment_status` is one of `trialing`, `active`, `incomplete`, `expired`, `past_due`, `canceled`, `unpaid`, `paused`, `processing`, `succeeded`, `capturable` or `failed` (the `subscriby://enums/subscription-status` MCP resource lists them).

`compensation_seconds` is the outage time [Outage Compensation](https://docs.subscriby.net/disaster-recovery/connector-outages#outage-compensation) has banked on the purchase, `0` for almost every subscription. `ends_at` already includes it: a one-time purchase simply ends later, while a recurring plan's `ends_at` runs that many seconds past the period the member last paid for, so the renewal the gateway bills is `ends_at` minus `compensation_seconds`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.


### POST `/v1/subscriptions/{subscription}/cancel`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Cancel is asynchronous: the endpoint answers `202 Accepted` once cancellation is queued. Provider-side cancellation (Stripe, PayPal, Razorpay, Paystack and the others) and the accompanying `subscription.cancelled` event happen on the background worker.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/subscriptions/{subscription}/grants`

```bash
curl https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/grants \
  -H "Authorization: Bearer <token>"
```

Every grant the purchase holds, one per resource and dated window, oldest first. Never paginated.

A **grant** is the access ledger's record that a purchase admits its holder to one resource: one row per resource, and per dated window for a pass. It says which connector gave the access, how (`mode`), where it stands (`state`) and, when it failed, why. Read it to know whether a member is actually in the channel rather than inferring it from the payment status.

- `mode` is `bearer_link` (a personal invite link the member comes through), `membership` (the connector added the member itself), `role` (a role was assigned) or `creator_task` (the creator has to do something by hand).
- `state` is `pending_identity` (the member has not linked an account on that connector yet; `member.resource_pending` was raised, and the grant is issued the moment they connect one), `pending` (issued, not yet used), `held` (issued ahead of a pass window and released when it opens), `granted`, `revoked` or `failed`.
- `identity_id` is the connector account admitted, the same id the [member's identities endpoint](https://docs.subscriby.net/api/v1/reference/members) returns, or `null` while none is linked or for a hand-arranged perk.
- `reference` is the connector's handle on the grant (the invite link on a connector that grants by link), `null` before anything was issued. Treat it as a secret: whoever holds a bearer link can use it.
- A `failed` grant carries `failure_kind` (`unreachable`, `not_permitted`, `target_missing`, `rate_limited`, `configuration`, `transient`, `other`) and `failure_detail`, the sentence the creator sees in the dashboard.

The ledger is written by the same job that mints invite links, so a purchase's grants appear moments after `member.resource_added` fires; a revoked link stays as a `revoked` row rather than disappearing, so history is never lost.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.


### POST `/v1/subscriptions/{subscription}/grants/reissue`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/grants/reissue \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "resource_id": "c9e21f37-8a4b-4d56-b1e0-2f7c9d3a6e15" }'
```

The members page's **Refresh invite links**, for integrations. The grants the member holds are revoked (their personal invite links die) and the job that grants at purchase runs again, issuing fresh grants the bot sends to the member. `resource_id` is optional: name one resource of the plan to reissue it alone, leave it out to reissue every resource the subscription grants.

Answers `202` once the reissue is queued, where `reissued` counts the grants revoked; the fresh grants appear on the grants endpoint seconds later. Each revoked grant raises `member.resource_reissued` and each fresh one `member.resource_added`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `resource_id` (string): A resource the plan grants, to reissue it alone; omit it to reissue every resource. A resource the plan does not grant answers 404.


### POST `/v1/subscriptions/{subscription}/pause`

Suspends access: the member is removed from every linked resource, `payment_status` becomes `paused` and `paused_at` is stamped. Billing continues. Answers `202` with the outcome and emits `subscription.paused`.

> **Pause suspends access, not billing.** The member's payment provider keeps charging on schedule. Subscriby settles through seven providers and only some can hold a recurring charge at all, so a pause meaning "stop billing" would work on some and silently not on others; access is what Subscriby controls directly, so it behaves identically everywhere. If billing must stop, cancel.

Only `active` and `trialing` subscriptions can be paused; only a `paused` one can be unpaused.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/reactivate`

Calls off a scheduled cancellation at the gateway and locally: the counterpart to cancel, and the win-back path. Answers `202` with the outcome (`outcome: reactivated`) and emits `subscription.reactivated`.

> **Stripe only.** On every other provider, cancelling ends the agreement outright, so there is nothing left to resume; the endpoint refuses and the member has to subscribe again. Flipping the record back to active would otherwise claim a recurring subscription the provider will never charge, and the member would keep access indefinitely for free.

An already-expired subscription cannot be reactivated regardless of provider.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/remind`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/remind \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The members page's nudge for a pass holder who bought a window but has not joined yet: their invite links are re-sent. Answers `200` with `reminded: true` when the connector accepted the message, and `reminded: false` when there was nothing to send: the subscription holds no window, the window has ended or been cancelled, the holder has already queued, or they cannot be reached on their connector. `false` is the dashboard's "Nothing sent" notice, not a fault, so it is never a `422`.

This messages a real person: read the subscription back first and do not repeat the nudge within the same window. To nudge everyone still missing from one window at once, use the [pass window remind endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows).

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/remind-connection`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/remind-connection \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The members flyout's "Remind to connect": a purchase that includes a place on a platform the member has not connected (a Discord role bought through Telegram, say) waits for that account, and this sends the member the reminder with the door that connects it, by mail and in their chat. Answers `200` with `reminded: true` when the message went out, and `reminded: false` when nothing was sent: no place waits, the member was reminded within the last day or stopped the project's follow-ups, or the purchase has ended. `false` is the dashboard's "Nothing Sent" notice, not a fault, so it is never a `422`. Find the candidates with `GET /v1/projects/{project}/members?access=waiting`; the daily reminder covers them once on its own.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/unpause`

Restores access with **fresh** invite links: the ones revoked at pause never come back. Answers `202` with the outcome (`outcome: active`) and emits `subscription.unpaused`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

