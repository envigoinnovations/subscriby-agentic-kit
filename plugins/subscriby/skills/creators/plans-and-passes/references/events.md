# Webhook events: Plans and Passes

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

## Family `pass`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `pass.window_scheduled` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `source`, `starts_at`, `timezone`, `window_id` |
| `pass.window_opened` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.window_closed` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.window_cancelled` | `project-subscription-plan:view` | `ends_at`, `legs_dropped`, `plan_id`, `rebound`, `refund_due`, `series_holders`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.holder_queued` | `project-subscription:view` | `ends_at`, `plan_id`, `plan_kind`, `source_plan_id`, `starts_at`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass.holder_moved` | `project-subscription:view` | `from_ends_at`, `from_starts_at`, `from_window_id`, `move_id`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `to_ends_at`, `to_starts_at`, `to_window_id`, `was_queued` |
| `pass.holder_missed` | `project-subscription:view` | `ends_at`, `join_requested`, `plan_id`, `starts_at`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass.holder_stranded` | `project-subscription:view` | `amount_paid`, `currency`, `from_ends_at`, `from_starts_at`, `from_window_id`, `payment_id`, `plan_id`, `refund_due`, `subscriber_id`, `subscription_id` |

### `pass.window_scheduled`

A new access window came into existence on a time-limited pass plan.

### When this fires

A dated access window was created on a pass plan: either generated from the plan's recurrence, or placed by hand from **Manage Access Windows** or [the pass windows endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows).

This is the event that lets you mirror a schedule outward without polling for it. Every other `pass.*` event describes something happening *to* a window that already exists; this one is the window arriving.

> **Why this matters more once a series is involved.** A [Pass Series](https://docs.subscriby.net/creators/pass-series) can be set to absorb new windows automatically as they are scheduled, and its holders are granted them at no charge. Without this event an integration has no way to learn a season grew except by re-reading the plan: the difference between a synced calendar and a stale one.

### Caveats

- **Editing a schedule regenerates windows in bulk.** Saving a pass plan rebuilds its unsold future windows, so a single edit can emit this many times in quick succession. Batch on your side rather than treating each as an isolated announcement.
- Regeneration never touches a window somebody bought, a window a series points at, or one a creator pinned, so those are not deleted and re-created, and do not re-emit.
- `source: manual` windows are never rebuilt by a schedule edit. They fire this once, when placed.
- Timestamps are UTC. `timezone` is on the payload precisely so you do not have to look the plan up to render them correctly.

### Related events

- `pass.window_opened`: the same window reaching its start time.
- `pass.window_cancelled`: a window being withdrawn.
- `pass_series.leg_added`: a rule absorbing a newly-scheduled window into a live season.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_scheduled",
  "created_at": "2026-09-01T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "timezone": "America/New_York",
    "source": "generated"
  }
}
```

### `pass.window_opened`

A time-limited pass access window opened and its holders were admitted.

### When this fires

A scheduled access window on a time-limited pass plan reached its start time. Everyone holding that window has been admitted to the plan's resources on the connector.

Windows are processed every minute, so this fires within roughly 60 seconds of the advertised start time rather than exactly on it.

> This describes the window, not an individual subscriber. For per-member grants, subscribe to `member.resource_added`, which fires once per subscriber per resource.

### Caveats

- Timestamps are UTC. A pass schedule is authored in the creator's timezone, so rendering these without converting will show the wrong local time to buyers.
- `subscribers_affected` counts holders who were eligible **at open time**, not at purchase time. Cancelled and paused passes are excluded, so this can be lower than the number sold.
- Anyone who buys **after** this fires is outside the count entirely; a plan whose sales cutoff is anchored to the window end keeps selling while the window runs. Those admissions arrive as `member.resource_added`, not as a second `pass.window_opened`.
- A window whose worker was down for its entire span is closed without ever opening. In that case this event never fires and only `pass.window_closed` is emitted.

### Related events

- `pass.window_closed`: paired transition.
- `member.resource_added`: per-subscriber grant.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_opened",
  "created_at": "2026-09-20T13:00:04Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "subscribers_affected": 47
  }
}
```

### `pass.window_closed`

A time-limited pass access window ended and its holders were removed.

### When this fires

A scheduled access window reached its end time. Everyone who held it has been removed from the plan's resources on the connector. For a single-window pass that also ends the purchase: one purchase buys one window, so there is no next window to roll into. For a Pass Series holder only this date's access is stripped; the subscription ends only when the window that closed was the last date they held.

This also fires for a window that never opened because the worker was unavailable for its entire span. Such a window is closed rather than opened late, so nobody is admitted to a window that has already finished.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- A subscription that this close *ends* also emits `subscription.expired`, and `member.churned` when it was the subscriber's last active subscription. A series holder mid-slate emits neither, only `pass_series.leg_completed`. De-duplicate if you consume several of these.
- A cancelled window does not emit this event. It emits `pass.window_cancelled` instead, with per-holder detail in `pass.holder_moved` and `pass.holder_stranded`.

### Related events

- `pass.window_opened`: paired transition.
- `member.resource_removed`: per-subscriber revocation.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_closed",
  "created_at": "2026-09-21T03:00:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "subscribers_affected": 47
  }
}
```

### `pass.window_cancelled`

A creator cancelled a time-limited pass access window, and its holders were resettled.

### When this fires

A creator cancelled a scheduled access window from **Manage Access Windows** or [the cancel endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows): a postponed match, a called-off session. This is never automatic: regeneration, slot edits and plan changes all leave sold windows alone, so cancelling is always a deliberate act.

By the time this fires every holder has already been resettled. A single-date holder was either moved to the next available window on the same plan, or, when nothing suitable was left, had their pass ended and was told what they paid. A season-ticket holder was moved the same way or lost the one date, as the creator chose (`series_holders`), and was told what the date was worth. The tallies are in the payload, and the per-holder detail arrives as `pass.holder_moved` and `pass.holder_stranded` for ordinary passes, or `pass_series.leg_substituted` and `pass_series.leg_dropped` for season-ticket holders.

> Cancelling cannot be undone. The window keeps its start time permanently, so the same instant can never be re-created on that plan: schedule regeneration skips it and adding it by hand is refused.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- **The counts exclude holders who were paused, past due, or had already cancelled their own pass.** Those are left bound to the cancelled window and are not resettled or messaged, so reconciling refunds from the tallies alone will miss them.
- `refund_due` and `legs_dropped` are counts, not lists. Consume `pass.holder_stranded` and `pass_series.leg_dropped` for the identities and amounts, or read `meta.refunds` on the cancel endpoint's response. The creator sees the same list in the dashboard's settlement dialog and in a notice to their inbox and email.
- No refund is issued by Subscriby. Every holder owed a decision is told the amount and that the decision is the creator's.
- Cancelling a window that is already **Open** evicts its holders immediately: anyone already admitted is removed from the connector's resources and their invite links stop working within seconds. They are not charged again and receive fresh links automatically ahead of their replacement window.
- A cancelled window never emits `pass.window_closed`.

### Related events

- `pass.holder_moved`: one per resettled single-date holder.
- `pass.holder_stranded`: one per single-date holder owed a refund.
- `pass_series.leg_substituted`: one per season-ticket holder moved.
- `pass_series.leg_dropped`: one per season-ticket holder who lost the date, with the pro-rata figure.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_cancelled",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-20T19:00:00+00:00",
    "rebound": 38,
    "refund_due": 3,
    "legs_dropped": 4,
    "series_holders": "drop",
    "subscribers_affected": 45
  }
}
```

### `pass.holder_queued`

A pass holder tapped their invite link and their join request is now held.

### When this fires

A holder tapped their invite link for a dated window that has not opened yet. The platform holds the join request, and Subscriby records that they are queued: they will be admitted automatically the moment the window opens, whether or not they are at their phone.

This is the moment a buyer stops being a risk, and it is the one thing about a pass that a creator can still act on beforehand.

> **Bought is not the same as queued.** A purchase and a queued request are different events with different follow-up. Someone who bought but never tapped is relying on noticing a message on the day; someone queued needs nothing at all. Everything in the product that nudges a pass holder (the reminder ladder, the creator's roll call, the manual **Send Reminders** button) targets the first group and skips the second.

### Caveats

- **This fires per join request, not per purchase.** A season-ticket holder queues separately for each of their dates, so one series purchase produces at least one of these per date they tap, often spread over weeks, because the link for the next date is sent in the message that ends the previous one. A plan with more than one gated resource produces one per resource they tap, all carrying the same `window_id`.
- It does **not** fire when someone taps a link for a window that is already open. That is an immediate admission, not a queued request, and arrives as `member.resource_added`.
- A holder who never taps produces no event at all. Absence is the signal; see `pass.holder_missed` for the other end of that.
- Re-queuing does re-emit. The handler re-stamps the queue time and fires this event again on every join request it receives, so treat `subscription_id` + `window_id` as the idempotency key on your side.

### Related events

- `pass.holder_missed`: a holder whose window closed without them joining.
- `pass.window_opened`: the moment held requests are approved.
- `member.resource_added`: the per-resource grant that follows.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_queued",
  "created_at": "2026-09-17T18:42:10Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_kind": "pass",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00"
  }
}
```

### `pass.holder_moved`

A pass holder was moved from a cancelled access window to the next available one on the same plan.

### When this fires

One holder of a cancelled access window was moved onto another date. Fires once per resettled holder of an ordinary pass, alongside the single `pass.window_cancelled` for the window itself. A season-ticket holder's move emits `pass_series.leg_substituted` instead; the two are mutually exclusive.

The replacement is the soonest window on the **same plan** that is still on sale, has not started yet, and that this customer does not already hold a pass for. If the schedule has nothing future left, a window already in progress is used rather than stranding them. Every window on a plan sells for the same price, which is what makes the move an even swap rather than a substitution.

They are not charged again. If the cancelled window had not opened yet, their existing invite links stay valid for the replacement date; if they had already been admitted to a live window, that access and those links are revoked immediately and fresh links are sent when the replacement window opens.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- `was_queued` is the field worth branching on. A queued holder keeps their place and is admitted automatically on the new date; an unqueued one still has to tap their link, and is sent it again as a button.
- Nobody is moved onto a date they already hold. A customer with passes for two consecutive windows skips to the one after.
- The move is written quietly, so no `subscription.*` event accompanies it. This event is the only signal.
- Holders who were paused, past due, or had cancelled their own pass are not moved and emit nothing at all.

### Related events

- `pass.window_cancelled`: the window-level event, fired once.
- `pass.holder_stranded`: the other outcome, when no window was available.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_moved",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-09-20T13:00:00+00:00",
    "from_ends_at": "2026-09-20T19:00:00+00:00",
    "to_window_id": "9a41f0be-27d5-4c18-b3ea-70d5c8194ef2",
    "to_starts_at": "2026-09-27T13:00:00+00:00",
    "to_ends_at": "2026-09-27T19:00:00+00:00",
    "was_queued": true
  }
}
```

### `pass.holder_missed`

A window closed and one holder never turned up for it.

### When this fires

An access window closed and a specific holder was recorded as **Missed**: they paid, the window ran, and they never joined.

`pass.window_closed` already reports an aggregate `subscribers_affected`, which is the wrong half for outreach. Who did not turn up is the useful question, the answer is already computed and stored per holder, and this is that answer.

> **Missed is a claim about the customer, so it is made carefully.** A holder is only marked Missed when they were never admitted. If they bought so late that the window was effectively over before their payment cleared, the pass is settled as ended rather than missed and **this event does not fire**; Subscriby will not tell you a paying customer no-showed when the timing was ours. One exception runs the other way: when a window never opened at all because of a worker outage, its ungranted holders *are* recorded as Missed and this event fires for each of them, so treat a burst of these for a single window as an outage signal rather than as no-shows.

### Caveats

- `join_requested` is the field worth branching on. A holder who never queued probably never saw the message; that is a reachability problem. A holder who queued and still did not appear made a choice, and chasing them the same way reads as nagging.
- **On a series this fires per date.** Missing one date of a season affects nothing else: the rest of the slate runs as booked, so treat a single occurrence as a data point rather than a churn signal. `pass_series.completed` carries the final tally, which is the figure that actually means something.
- It fires alongside `pass.window_closed` for the same window. Both are correct (one is per holder, one is the aggregate) so an endpoint subscribed to both receives one of each.

### Related events

- `pass.holder_queued`: the engagement this is the absence of.
- `pass.window_closed`: the aggregate for the same window.
- `pass_series.leg_completed`: the same close, seen as progress through a season.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_missed",
  "created_at": "2026-09-21T03:00:07Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "join_requested": false
  }
}
```

### `pass.holder_stranded`

A pass holder's window was cancelled with no replacement available, so their pass ended and a refund is owed.

### When this fires

One holder of a cancelled access window could not be moved anywhere, so their pass was ended. Fires once per stranded holder of an ordinary pass, alongside the single `pass.window_cancelled` for the window itself. A season-ticket holder never reaches this state: cancelling one leg of a season emits `pass_series.leg_dropped` instead and leaves the rest of the slate intact.

They have paid for a date that is not happening and received nothing. Subscriby tells them so and asks them to contact the creator; **it does not issue a refund**.

> **This is the durable record of who is owed money.** The creator's dashboard shows the refund count once, in a toast that survives a single page load, and the ended subscriptions are afterwards indistinguishable from ordinary expiries. This event carries the identity, the amount and the gateway reference, so consuming it is the only reliable way to reconcile refunds automatically.

### Why a replacement can be missing

- The plan has no later window scheduled at all.
- The only later windows are already inside the plan's [sales cutoff](https://docs.subscriby.net/creators/time-limited-passes#use-the-sales-cutoff-to-control-this), so they are closed to sales and cannot take new holders; a later date can be visible on the calendar and still not qualify.
- The customer already holds a pass for every remaining window.
- The plan's repeating schedule has passed its recurrence end date, so no later window qualifies even if the calendar still shows dates.

### Caveats

- The subscription also emits `subscription.expired`, and `member.churned` when it was their last active subscription. De-duplicate if you consume several.
- No `subscription.refunded` follows unless the creator actually issues the refund in their payment provider, at which point the gateway's webhook records it.
- Holders who were paused, past due, or had already cancelled their own pass are **not** included, even though they may also have paid. Reconcile those separately.
- `amount_paid` is what the subscription recorded at purchase; it does not account for any partial refund already issued.

### Related events

- `pass.window_cancelled`: the window-level event, fired once.
- `pass.holder_moved`: the other outcome, when a replacement existed.
- `subscription.expired`: also fires for this subscription.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_stranded",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-09-20T13:00:00+00:00",
    "from_ends_at": "2026-09-20T19:00:00+00:00",
    "refund_due": true,
    "amount_paid": "15.000",
    "currency": "GBP",
    "payment_id": "pi_3U9Jan4m40lWsKma0f3ntmnl"
  }
}
```

## Family `pass_series`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `pass_series.purchased` | `project-subscription:view` | `ends_at`, `passes_already_held`, `passes_granted`, `passes_total`, `plan_id`, `plan_name`, `seat_cap`, `seats_remaining`, `starts_at`, `subscriber_id`, `subscription_id` |
| `pass_series.leg_added` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `plan_name`, `source_plan_id`, `starts_at`, `timezone`, `window_count`, `window_id` |
| `pass_series.leg_completed` | `project-subscription:view` | `granted`, `joined`, `passes_attended`, `passes_missed`, `passes_remaining`, `passes_total`, `plan_id`, `source_plan_id`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass_series.leg_substituted` | `project-subscription:view` | `from_ends_at`, `from_starts_at`, `from_window_id`, `move_id`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `to_ends_at`, `to_starts_at`, `to_window_id`, `was_queued` |
| `pass_series.leg_dropped` | `project-subscription:view` | `amount_paid`, `currency`, `from_ends_at`, `from_starts_at`, `from_window_id`, `passes_remaining`, `plan_id`, `refund_per_holder`, `series_ended`, `subscriber_id`, `subscription_id` |
| `pass_series.seats_exhausted` | `project-subscription-plan:view` | `last_subscription_id`, `plan_id`, `plan_name`, `seat_cap`, `seats_taken` |
| `pass_series.completed` | `project-subscription:view` | `passes_attended`, `passes_missed`, `passes_total`, `plan_id`, `plan_name`, `subscriber_id`, `subscription_id`, `successor_plan_id` |
| `pass_series.presale_opened` | `project-subscription-plan:view` | `closes_at`, `eligible_holders`, `plan_id`, `plan_name`, `presale_hours`, `successor_plan_id` |

### `pass_series.purchased`

Someone bought a season ticket and their whole slate was issued.

### When this fires

A [Pass Series](https://docs.subscriby.net/creators/pass-series) was bought, or comped with an access code, and every date on the slate has been written into the buyer's ledger. They hold all of them from this moment; there is nothing further to claim.

> **This fires in addition to `subscription.activated`.** A series **is** a subscription row, so a purchase emits both. An endpoint subscribed to the two receives **two deliveries for one purchase** and must de-duplicate on `subscription_id`. That is not a quirk to work around: `subscription.activated` is what you want for revenue, and this is what you want for the slate. They answer different questions about the same event.

### Caveats

- **`passes_granted + passes_already_held = passes_total`.** Buying a date you already own is allowed on purpose; it is de-duplicated at grant time rather than refused, and the buyer is told so on their timeline. A non-zero `passes_already_held` is normal, not an error.
- `passes_total` counts what this buyer received, which on a mid-season purchase is **fewer than the slate holds**: dates that have already run are never issued. Read the plan if you need the full slate length.
- The span is the **series'**, not this buyer's. `starts_at` and `ends_at` are the plan's cached slate span, so on a mid-season purchase `starts_at` can precede every date the buyer actually holds. Only the `passes_*` counts are buyer-scoped.
- A series absorbing new dates later does not re-emit this. That is `pass_series.leg_added`.

### Related events

- `subscription.activated`: the same purchase as revenue. De-duplicate on `subscription_id`.
- `pass_series.leg_completed`: one date of this slate finishing.
- `pass_series.completed`: the final date finishing.
- `pass_series.seats_exhausted`: when a purchase takes the last seat.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.purchased",
  "created_at": "2026-09-01T11:03:44Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "passes_total": 10,
    "passes_granted": 9,
    "passes_already_held": 1,
    "starts_at": "2026-09-20T13:00:00Z",
    "ends_at": "2026-11-29T22:00:00Z",
    "seat_cap": 50,
    "seats_remaining": 13
  }
}
```

### `pass_series.leg_added`

An automatic rule absorbed a newly-scheduled window into a live series.

### When this fires

A [Pass Series](https://docs.subscriby.net/creators/pass-series) with **Automatic Passes Selection** matched a newly-scheduled window on one of its source plans, added it to the slate, and granted it to everyone currently holding the series, at no extra charge.

This is the event that makes an external calendar or CRM worth wiring up. A season composed with rules is not fixed at the point it sold: it grows, and holders are given what it grows by. Without this you would have to re-read the plan to notice.

> **Holders are messaged too.** Every current holder receives a message on the connector naming the new date, and it appears on their timetable and in their calendar feed. Nothing is asked of them; their invite link arrives before it opens, as usual.

### Caveats

- **This fires once per window.** One absorption run can take in several at a time, which arrives as several events rather than one carrying a list.
- **Absorption respects Prevent Overlapping Passes.** With the toggle on, a window that clashes with something already on the slate is refused rather than absorbed (the series will not hand holders two things at the same time) so a matching window can exist and never produce this event.
- A rule of type `next_n` stops once it has taken its count and **never tops itself back up**. A window becoming free later does not make it reach for another.
- A series is capped at 120 dates. A rule that would take the slate past the cap stops there.
- Holders who cancelled are not granted the new date.
- Manually handpicked dates never produce this event. Handpicking is a fixed list by design; only rules keep working after the save.
- A date the creator has excluded stays excluded. Unticking a rule-added pass records a permanent exclusion, and the rule will not put it back.

### Related events

- `pass.window_scheduled`: the window coming into existence, which is what a rule reacts to.
- `pass_series.leg_substituted`: a date being swapped rather than added.
- `pass_series.leg_dropped`: a date leaving a season.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_added",
  "created_at": "2026-10-04T07:15:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "starts_at": "2026-11-08T18:00:00Z",
    "ends_at": "2026-11-08T21:00:00Z",
    "timezone": "America/New_York",
    "window_count": 12
  }
}
```

### `pass_series.leg_completed`

One date of a holder's season finished, with their running attendance.

### When this fires

One window on a season ticket closed for one holder. It fires per holder per date, so a ten-date season sold to forty people emits four hundred of these across its run.

It is the progress event. Where `pass.holder_missed` answers "did they turn up", this answers "where are they in the season", which is what an integration syncing a timetable or scoring engagement actually needs.

### Caveats

- **`granted` and `joined` are tracked separately on purpose.** Granted means Subscriby admitted them; joined means they actually appeared. A date can be granted and not joined (a held request approved into a channel the person never opened) and that distinction is the difference between a delivery problem and a disengaged customer.
- `passes_attended + passes_missed` will not equal `passes_total` mid-season. The remainder is dates still ahead, plus any marked as already covered because the holder owned them individually before buying the series.
- When `passes_remaining` reaches `0`, `pass_series.completed` fires for the same holder in the same pass. Both are emitted; de-duplicate if you only want one.
- Two holders of the same series reach the same date at different points in their own season if one bought mid-way; the counts are per purchase, never per plan.

### Related events

- `pass_series.completed`: the final date of a holder's season.
- `pass.holder_missed`: the same close, when they did not turn up.
- `pass.window_closed`: the window-level aggregate.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_completed",
  "created_at": "2026-10-25T21:00:06Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "granted": true,
    "joined": true,
    "passes_total": 10,
    "passes_attended": 4,
    "passes_missed": 1,
    "passes_remaining": 5
  }
}
```

### `pass_series.leg_substituted`

A cancelled date in a season was replaced, and one holder was moved to the replacement.

### When this fires

A creator cancelled a window that a season ticket points at, a replacement was available, and one holder was moved onto it. Their season carries on at the same length.

Fires **once per holder**, not once per cancellation. Each holder is resettled individually because the outcomes differ: someone already holding the replacement date skips past it to the next one they do not have, and someone with no replacement available is dropped instead.

### Caveats

- **`was_queued` is the field worth branching on.** A holder who was queued stays queued for the new date and is told there is nothing to do. One who was not usually gets their invite link attached, except a holder who had already been admitted to the cancelled window: they also report `was_queued: false`, but their access is revoked and they are told a fresh link arrives when the new window opens, so no link is attached. `was_queued: false` therefore covers two different situations; if you need to tell them apart, check whether the holder currently has access. If you send your own message alongside ours, match that split or you will ask half your audience to do something they have already done.
- The holder is **never** moved onto a date they already hold. The next one they do not have is chosen instead, so `to_window_id` can be further out than the immediate next window.
- Three groups are skipped entirely and produce no event: holders who are **paused**, **past due**, or who **cancelled their own series**. They still paid for a date that is not happening. Check subscriptions on that plan before reaching for a refund list.
- `plan_id` is the **source** plan. To identify the series, read `subscription_id`.

### Related events

- `pass.holder_moved`: the same resettlement on an ordinary single-window pass rather than a series.
- `pass_series.leg_dropped`: what happens when no replacement exists.
- `pass.window_cancelled`: fires once, last, carrying both tallies.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_substituted",
  "created_at": "2026-10-18T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-10-25T18:00:00Z",
    "from_ends_at": "2026-10-25T21:00:00Z",
    "to_window_id": "7c0b93af-4d61-42e8-95d3-18ba6e07c254",
    "to_starts_at": "2026-11-01T18:00:00Z",
    "to_ends_at": "2026-11-01T21:00:00Z",
    "was_queued": true
  }
}
```

### `pass_series.leg_dropped`

A cancelled date left a holder's season with no replacement, carrying the pro-rata figure.

### When this fires

A creator cancelled a window that a season ticket points at, **no replacement was available**, and that date simply left one holder's season. The rest of their slate is untouched.

This is the event that carries money information, and it is the one worth wiring up: it is the only durable record of who is owed what.

> **`refund_per_holder` is a figure, not an action.** Subscriby works out what the date was worth as a share of what the holder paid, and reports it. It does **not** move any money. Nothing is charged or refunded automatically, and nothing in the dashboard marks the subscription as owing. A Zap that reads this as "already refunded" will double-refund. A Zap that reads it as "this is what you owe" is correct.

### Caveats

- **The figure is per holder, not per cancellation.** Two people can be owed different amounts for the same cancelled date: a mid-season buyer paid the same price for fewer dates, so each of theirs is worth more. Sum the events; do not multiply one by a headcount.
- `series_ended: true` is worth handling separately. That holder's season is over, and an upsell to "the next date" is exactly wrong for someone who has just been told there is not one.
- The same three groups skipped by substitution are skipped here too: **paused**, **past due**, and holders who cancelled their own series. They produce no event and are absent from any total you compute from these.
- Refunds are issued from your payment provider's dashboard. See [Refunds](https://docs.subscriby.net/creators/managing-subscriptions#refunds).

### Related events

- `pass.holder_stranded`: the equivalent on an ordinary single-window pass, where the whole purchase ends rather than one date of it.
- `pass_series.leg_substituted`: what happens when a replacement exists.
- `pass.window_cancelled`: fires once, last, carrying both tallies.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_dropped",
  "created_at": "2026-10-18T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-11-29T18:00:00Z",
    "from_ends_at": "2026-11-29T21:00:00Z",
    "passes_remaining": 3,
    "refund_per_holder": "9.90",
    "currency": "USD",
    "amount_paid": "99.00",
    "series_ended": false
  }
}
```

### `pass_series.seats_exhausted`

A capped season ticket sold its last seat.

### When this fires

A purchase took the last seat on a series with a **Seat Limit**. The season is now sold out: its portal card reads **Sold out**, but a checkout already in flight is not blocked; the seat cap is only claimed once the payment lands, so a late buyer can pay, be given nothing, and be told to ask the organiser for a refund. Treat this event as the cue to stop promoting the season yourself.

Fires at the transition, once. An endpoint told this on every subsequent read would be told a fact rather than an event.

### Caveats

- **Sold out is not permanent.** A seat is released when a holder cancels or is refunded, and the series goes back on sale, at which point a later purchase can exhaust it again and emit this a second time. Treat it as a state change, not a terminal state.
- Only holders who actually hold the series consume a seat. A checkout that was started and abandoned, or a payment that never cleared, does not.
- A series with no **Seat Limit** never emits this at all.
- Raising the cap does not emit anything. If you are tracking availability, read `seats_remaining` on the plan rather than inferring it from this event alone.

### Related events

- `pass_series.purchased`: every purchase, each carrying `seats_remaining`.
- `plan.deactivated`: the series coming off sale for good once its dates have run.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.seats_exhausted",
  "created_at": "2026-09-12T14:22:51Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "seat_cap": 50,
    "seats_taken": 50,
    "last_subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4"
  }
}
```

### `pass_series.completed`

A holder reached the last date of their season, with the final attendance tallies.

### When this fires

The last date on one holder's season ticket closed. Their season is over.

Fires **per holder**, not per series, because "finished" is a fact about a purchase: two people holding the same season reach its end on different dates when one of them bought in late.

> **This is the renewal signal.** The tallies are the half worth acting on. A completion with two of ten attended is a churn signal; the same completion with ten of ten is a renewal one. If the creator linked a next season, the holders-only presale opens around the same moment; see `pass_series.presale_opened`.

### Caveats

- The subscription is expired at this point, which is normal and not a failure. A dated purchase ends when its dates run out.
- `passes_total` is **this holder's** slate, not the plan's. A mid-season buyer received fewer dates for the same price and their totals reflect that.
- `passes_attended + passes_missed` can be less than `passes_total` when some dates were already covered by passes the holder owned individually; those were not issued twice.
- `successor_plan_id` being present does **not** mean the holder has been invited yet. The presale opens when the series retires, which is a separate event.
- The plan itself is deactivated automatically once its last date has run for everybody. That arrives as `plan.deactivated` with `reason: series_exhausted`.

### Related events

- `pass_series.leg_completed`: each date along the way, including this one.
- `pass_series.presale_opened`: the invitation to the next season.
- `plan.deactivated`: the series taking itself off sale.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.completed",
  "created_at": "2026-11-29T21:00:06Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "passes_total": 10,
    "passes_attended": 8,
    "passes_missed": 2,
    "successor_plan_id": "b3e70d21-5f94-4a6c-8127-cd4a91e6f508"
  }
}
```

### `pass_series.presale_opened`

A finished season's holders were given first refusal on the next one.

### When this fires

A season ticket ran its last date, the creator had linked a **Next Series**, and the holders-only window on that successor opened. Every eligible holder has been messaged with a link straight to it.

For the length of the window, nobody who did not hold the finished season can buy the successor; the portal and the bot both turn them away and say when it goes on general sale.

> **Who is invited is worked out now, not at checkout.** Nothing is stamped onto a purchase when someone pays. Eligibility is resolved at the moment the presale opens, which is what lets a creator link a successor **months after** the season sold out and still reach everyone who bought it.

### Caveats

- **Fires once per season, ever.** The window's opening is stamped, so a repeated sweep does not re-invite anybody. If you need to reach these people again, do it from your own side.
- `eligible_holders` counts everyone who bought the finished season and did **not** cancel it, whether or not their subscription has expired; by this point most have, which is the normal case and not a disqualification. Someone who cancelled partway through is excluded: they said they did not want the season.
- It counts holders resolved for invitation, not messages the platform accepted. A holder who has blocked the bot is included here and did not receive anything.
- Nothing closes the window explicitly. It lapses at `closes_at` and the successor sells to everyone from then on, with no further event.
- A successor with no `presale_hours` set produces no presale and no event.

### Related events

- `pass_series.completed`: each holder reaching the end of the finished season.
- `plan.deactivated`: the finished season coming off sale, with `reason: series_exhausted`.
- `pass_series.purchased`: a holder taking up the offer.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.presale_opened",
  "created_at": "2026-11-29T21:00:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "successor_plan_id": "b3e70d21-5f94-4a6c-8127-cd4a91e6f508",
    "eligible_holders": 38,
    "presale_hours": 48,
    "closes_at": "2026-12-01T21:00:11Z"
  }
}
```
