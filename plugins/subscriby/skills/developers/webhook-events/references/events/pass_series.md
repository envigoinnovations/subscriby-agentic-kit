# Webhook events: Webhook Events, the `pass_series` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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
