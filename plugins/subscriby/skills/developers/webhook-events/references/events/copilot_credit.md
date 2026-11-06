# Webhook events: Webhook Events, the `copilot_credit` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `copilot_credit`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `copilot_credit.purchased` | `account:read` | `balance_cents`, `bonus_cents`, `currency`, `pack`, `paid_cents`, `purchase_id` |
| `copilot_credit.granted` | `account:read` | `balance_cents`, `cents`, `expires_at`, `grant_id`, `kind` |
| `copilot_credit.low` | `account:read` | `balance_cents`, `threshold_cents` |
| `copilot_credit.refunded` | `account:read` | `balance_cents`, `bonus_voided_cents`, `pack`, `purchase_id`, `refunded_cents` |

### `copilot_credit.purchased`

A pack of Copilot Credits was paid for and credited.

### When this fires

Stripe reported the payment for a pack: a Checkout session the creator completed, or an off-session charge the auto top-up made when the balance fell under their threshold. The paid amount becomes a grant that never lapses and the pack's bonus, when it carries one, a free grant beside it. One event per pack, however many Stripe events describe the payment.

> **The bonus is free credit.** `bonus_cents` is granted by Subscriby, never charged by Stripe, and a refund of the pack takes it back.

### Caveats

- **Tax is not in `paid_cents`.** Stripe may have collected tax on top; the ledger is credited with the pack's price.
- **A short payment credits nothing.** A payment under the pack's price is left pending and never announced.

### Related events

- `copilot_credit.refunded`: the pack's money going back.
- `copilot_credit.low`: what the auto top-up answers.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.purchased",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "purchase_id": "0b1f7a2e-3c4d-4e5f-8a9b-1c2d3e4f5a6b",
    "pack": "regular",
    "paid_cents": 2500,
    "bonus_cents": 250,
    "currency": "USD",
    "balance_cents": 3250
  }
}
```

### `copilot_credit.granted`

Free Copilot Credits were granted to the creator.

### When this fires

A new account received its welcome credit at registration, or Subscriby granted a promotion or goodwill by hand. The paid part and the bonus of a pack are not announced here; they are the purchase.

### Caveats

- **A lapsed grant is not announced.** The welcome credit's remainder simply stops counting at `expires_at`.

### Related events

- `copilot_credit.purchased`: the paid way in.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.granted",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "grant_id": "7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f",
    "kind": "signup",
    "cents": 500,
    "expires_at": "2027-01-31T09:14:31Z",
    "balance_cents": 500
  }
}
```

### `copilot_credit.low`

The creator's Copilot Credits fell under the low-balance threshold.

### When this fires

A unit of Copilot usage was drawn from the credit and left the balance under the threshold, and the creator had not been told in the last day. The same moment sends the creator a notice and, when their auto top-up is on, queues the charge for their pack.

### Caveats

- **Once a day at most.** A balance that stays low fires again only after a day; a purchase or a grant resets the clock.
- **The free allowance does not count.** Units the plan includes draw nothing and never fire this.

### Related events

- `copilot_credit.purchased`: the top-up that follows.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.low",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "balance_cents": 420,
    "threshold_cents": 500
  }
}
```

### `copilot_credit.refunded`

Stripe refunded the charge for a pack and the credit was taken back.

### When this fires

A refund, partial or full, landed on the charge that paid for a pack. The refunded amount comes off the paid grant, past zero when the creator had already spent it; a refund that reaches the full price also takes the pack's bonus back. Stripe reports the refunded total cumulatively, so one event fires per refund with the running figure.

### Caveats

- **A negative balance closes the Copilot.** Nothing is invoiced for it; the next pack or grant covers it first.

### Related events

- `copilot_credit.purchased`: the pack that was refunded.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.refunded",
  "created_at": "2026-11-05T16:02:10Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "purchase_id": "0b1f7a2e-3c4d-4e5f-8a9b-1c2d3e4f5a6b",
    "pack": "regular",
    "refunded_cents": 2500,
    "bonus_voided_cents": 250,
    "balance_cents": -180
  }
}
```
