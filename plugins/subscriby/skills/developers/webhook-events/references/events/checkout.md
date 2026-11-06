# Webhook events: Webhook Events, the `checkout` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `checkout`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `checkout.stalled` | `project-subscription:view` | `checkout_id`, `enrollment_id`, `plan_id`, `provider`, `stalled_at`, `started_at`, `subscriber_id`, `surface` |
| `checkout.recovered` | `project-subscription:view` | `checkout_id`, `enrollment_id`, `payment_id`, `plan_id`, `provider`, `recovered_at`, `stalled_at`, `subscriber_id`, `subscription_id`, `surface` |

### `checkout.stalled`

A checkout stayed open past the project's window.

### When this fires

The hourly sweep found a checkout started more than the project's window ago (`checkout_stall_hours`, 1 hour by default) with no charge settled for the member and no live membership held, and had not counted a stall for that member in the last day. The row is stamped, the event goes out, and the member enters every running sequence on the `stalled_checkout` trigger with the plan they were buying, so the step's button reopens that plan; `enrollment_id` names the first passage opened, or is `null` when the project runs no such sequence.

### Caveats

- A member who starts a checkout three times inside a day stalls once; the two later rows are stamped without an event.
- A stall says nothing about why. Stripe's session may have expired, the member may have changed their mind, or the gateway may have refused the card; the ledger only knows no charge settled.

### Related events

- `payment.pending`: the start of the checkout.
- `sequence.enrolled`: the passage the stall opened.
- `checkout.recovered`: how it ends well.

```json
{
  "id": "evt_01HX...",
  "type": "checkout.stalled",
  "created_at": "2026-10-20T11:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "checkout_id": "c7e1a9d4-2b63-4f58-9a07-5d8e3c1b6f24",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "surface": "bot",
    "started_at": "2026-10-20T09:52:00+00:00",
    "stalled_at": "2026-10-20T11:00:00+00:00",
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03"
  }
}
```

### `checkout.recovered`

A charge settled for a member whose checkout had stalled.

### When this fires

The payment ledger recorded a successful charge for the member, through any door and on any rail, while one of their checkouts stood stalled. Every open checkout of the member closes on that charge; the event fires for each one that had stalled, with the charge and the membership it became, and the passage that was running when they came back. The passage itself ends as `sequence.converted` through the same charge.

### Caveats

- The charge need not be for the stalled plan: a member who stalled on the monthly plan and bought the annual one is recovered all the same.
- A member who holds a live membership before the window passes never stalls, so never recovers; their checkouts close without an event.

### Related events

- `checkout.stalled`: the stall this recovers.
- `payment.succeeded`: the charge.
- `sequence.converted`: the passage ending as a win on the same charge.

```json
{
  "id": "evt_01HX...",
  "type": "checkout.recovered",
  "created_at": "2026-10-21T08:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "checkout_id": "c7e1a9d4-2b63-4f58-9a07-5d8e3c1b6f24",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "surface": "bot",
    "payment_id": "9f2c7b1e-4d83-4a56-b0e9-7c5d2a8f3b61",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "stalled_at": "2026-10-20T11:00:00+00:00",
    "recovered_at": "2026-10-21T08:30:00+00:00"
  }
}
```
