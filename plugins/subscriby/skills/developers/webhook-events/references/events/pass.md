# Webhook events: Webhook Events, the `pass` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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
