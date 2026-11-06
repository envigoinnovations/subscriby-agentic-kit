# Webhook events: Webhook Events, the `plan` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `plan`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `plan.created` | `project-subscription-plan:view` | `duplicated_from_plan_id`, `kind`, `plan`, `plan_id`, `plan_name` |
| `plan.updated` | `project-subscription-plan:view` | `changes`, `plan` |
| `plan.activated` | `project-subscription-plan:view` | `plan` |
| `plan.deactivated` | `project-subscription-plan:view` | `plan`, `plan_id`, `plan_name`, `reason`, `successor_plan_id`, `window_count` |
| `plan.sold_out` | `project-subscription-plan:view` | `plan`, `plan_id`, `plan_name`, `reason`, `sales_cap`, `sales_cap_sold` |
| `plan.order_changed` | `project-subscription-plan:view` | `plan_ids`, `project_id` |
| `plan.deleted` | `project-subscription-plan:view` | `plan` |
| `plan.sync_completed` | `project-subscription-plan:view` | `plan_id`, `providers`, `synced_at` |

### `plan.created`

A plan is first created on a project.

### When this fires

A plan is created through the REST API (`POST /v1/projects/{project}/plans`) or the `create_plan` MCP tool, or a finished pass season is duplicated into its next season. Plans created from the creator dashboard or the bot do not emit this event. The plan is immediately eligible for purchase if it was created in the active state.

> **The two shapes are disjoint.** The API and MCP path sends `data.plan` and nothing else; the season-duplication path sends the four flat keys and no `data.plan` object. Branch on whether `data.plan` or `data.plan_id` is present before reading any other field.

`billing_cycle` is only the unit. The multiplier lives in `billing_cycle_count` on the plan record and is **not** included in this payload: a "3 month" plan sends `billing_cycle: "month"` with no indication of the `3`. Nor is `trial_days`. Fetch the plan with `GET /v1/projects/{project}/plans/{plan}` when you need the full cadence or trial configuration.

### Caveats

- A `plan.created` event does not imply the plan has been synced to a payment-provider catalog. Listen for `plan.sync_completed` for that.
- Trial is configured at create time. A later trial-only edit is only applied, and only then fires `plan.updated`, when the PATCH also carries a `kind` key; without it the trial fields are dropped and no event is emitted.

### Related events

- `plan.updated`: subsequent edits.
- `plan.sync_completed`: provider catalog sync.

```json
{
  "id": "evt_01HX...",
  "type": "plan.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    }
  }
}
```

### `plan.updated`

Any mutable plan field changes.

### When this fires

A plan is edited through the REST API (`PATCH /v1/projects/{project}/plans/{plan}`): pricing, name, currency, billing cadence, eligibility filters. Edits made in the creator dashboard do not emit this event, and trial fields are only written (and only then reported) when the payload also carries `kind`. An `active` flag sent on a PATCH is reported here as an ordinary `changes.active` entry. The dedicated `plan.activated` and `plan.deactivated` events come only from the publish and unpublish endpoints.

### Caveats

- Existing subscriptions priced on the old terms are not retroactively re-priced. New checkouts use the new price; renewals follow the billing rules.
- An `active` flag sent on a PATCH is reported here as an ordinary `changes.active` entry. The dedicated `plan.activated` and `plan.deactivated` events come only from the publish and unpublish endpoints.

### Related events

- `plan.activated`, `plan.deactivated`: dedicated active-flag events.
- `plan.sync_completed`: fires after price changes propagate to the provider catalog.

```json
{
  "id": "evt_01HX...",
  "type": "plan.updated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    },
    "changes": {
      "price": {
        "from": "25.0000",
        "to": "29.00"
      }
    }
  }
}
```

### `plan.activated`

Inactive plan flipped active.

### When this fires

An inactive plan is flipped to active through the REST API (`POST /v1/projects/{project}/plans/{plan}/publish`) or the `publish_plan` MCP tool, and becomes purchasable on the project landing page. Toggling a plan on from the creator dashboard does not emit this event.

### Caveats

- Publishing a plan that is already active is a no-op: nothing is written and no event is emitted.
- Activation does not retroactively touch existing subscriptions on the plan; only checkout availability changes.
- Frequent flipping is permitted but produces noisy timelines; use `plan.updated` for non-state edits.

### Related events

- `plan.deactivated`: paired transition.
- `plan.created`: predecessor.

```json
{
  "id": "evt_01HX...",
  "type": "plan.activated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "active": true
    }
  }
}
```

### `plan.deactivated`

Active plan flipped inactive.

### When this fires

A plan is taken off sale through the REST API (`POST /v1/projects/{project}/plans/{plan}/unpublish`) or the `publish_plan` MCP tool; automatically when a pass series runs its last date; or when the free-plan entitlement sweep disables an unentitled zero-priced plan. The plan remains visible to existing subscribers and stays in the catalog, but new checkouts cannot select it. Deactivating from the creator dashboard does not emit this event.

> **The two shapes are disjoint.** The publish-state path sends `data.plan` and nothing else; an automatically retired series sends the five flat keys and no `data.plan` object. Branch on whether `data.plan` or `data.plan_id` is present before reading any other field.

### Caveats

- Existing subscriptions on the plan are unaffected and continue to renew until cancelled or expired.
- For permanent removal use `plan.deleted`.

### Related events

- `plan.activated`: paired transition.
- `plan.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "plan.deactivated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "active": false
    }
  }
}
```

### `plan.sold_out`

A plan hit its sales cap, or a pass series filled its last seat, and Subscriby paused it automatically.

### When this fires

A plan carrying a **sales cap** records its last allowed successful purchase, or a `pass_series` plan with a **seat cap** seats its last holder. Subscriby switches the plan off on the spot, records the reason, and fires this event once. The plan disappears from the portal and the bot until the creator switches it back on; existing subscribers are untouched.

A `plan.deactivated` event fires alongside it, carrying the same `reason`, so automations that only watch availability still see the change. Subscribe to this event when you care specifically about "sold out": a waitlist, a restock reminder, a celebratory post.

> Switching the plan back on from the dashboard, the API (publish) or the `publish_plan` tool clears the reason and, for a sales cap, restarts the counter at zero, so the same cap sells another batch. Raising or clearing the cap while the plan is on sale also restarts the counter. A seat-capped series keeps its seats taken; raise the seat cap before publishing it again.

### Related events

- `plan.deactivated`: fires at the same moment with the same `reason`.
- `plan.activated`: the creator switching the plan back on.
- `pass_series.seats_exhausted`: the season-level view of a filled seat cap.

```json
{
  "id": "evt_01HX...",
  "type": "plan.sold_out",
  "created_at": "2026-09-08T14:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Founding Members",
      "price": "49.00",
      "active": false
    },
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Founding Members",
    "reason": "sales_cap_reached",
    "sales_cap": 10,
    "sales_cap_sold": 10
  }
}
```

### `plan.order_changed`

The creator arranged the order plans appear in on the portal and in the bot, or reset it.

### When this fires

A creator drags plans into a new order in the dashboard's **Arrange Storefront Order** dialog and saves, calls `POST /v1/projects/{project}/plans/order`, or runs the `reorder_plans` MCP tool. Resetting to the built-in order fires it too. The event carries the resulting order of every plan currently on sale, so a mirror of the storefront can re-sort itself without a second read.

> The built-in order is passes first, then seasons, then subscriptions, each group cheapest first. Plans created after an arrangement join the end in that order until the creator arranges again, so `plan_ids` on this event may be shorter than the plan list read a week later.

### Related events

- `plan.created`: a new plan joins the end of the storefront.
- `plan.activated`, `plan.deactivated`: a plan entering or leaving the storefront.

```json
{
  "id": "evt_01HX...",
  "type": "plan.order_changed",
  "created_at": "2026-09-08T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_ids": [
      "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "b1a7c3d5-2e48-4f60-9a1b-7c5d3e820f94",
      "a9d2e4f6-1b3c-4d5e-8f70-2c4e6a8b0d1f"
    ]
  }
}
```

### `plan.deleted`

Plan soft-deleted (removed from the catalog).

> This is the final event you will receive for the given plan id.

### When this fires

The plan is removed from the project. It is soft-deleted: the row is retained with `deleted_at` set, so subscription rows that reference it are untouched and continue to honor their existing term. Only deletions made through the REST API (`DELETE /v1/projects/{project}/plans/{plan}`) emit this event; deleting a plan from the creator dashboard does not.

### Caveats

- Reads of the plan after this event return `404`. Existing subscriptions continue to reference the plan id internally.
- Deleting a plan makes no call to the payment providers. Catalog entries previously created by the plan sync (Stripe prices, PayPal plans, and so on) remain active at the provider and must be archived there manually.

### Related events

- `plan.deactivated`: typical predecessor.
- `plan.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "plan.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    }
  }
}
```

### `plan.sync_completed`

Plan synced to the payment-provider catalog (Stripe, PayPal, CoinPayments or Razorpay).

### When this fires

The plan finishes syncing to one or more external payment-provider catalogs (Stripe, PayPal, CoinPayments, Razorpay). Fires once per active plan per sync run: a run over a project with twelve active plans emits twelve events. A plan whose providers all failed emits nothing, and inactive plans are never synced.

### Caveats

- Partial failures retry on a follow-up run rather than emitting a separate event per provider; `providers` lists only the providers that succeeded for that plan.
- Errors during sync surface in the dashboard, not as webhook events.

### Related events

- `plan.created`: predecessor that typically triggers the first sync.
- `plan.updated`: re-sync trigger when pricing or cadence changes.

```json
{
  "id": "evt_01HX...",
  "type": "plan.sync_completed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "providers": [
      "stripe",
      "paypal"
    ],
    "synced_at": "2026-05-18T10:04:58Z"
  }
}
```
