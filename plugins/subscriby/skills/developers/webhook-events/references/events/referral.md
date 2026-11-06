# Webhook events: Webhook Events, the `referral` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `referral`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `referral.program_updated` | `project-referral:view` | `changes`, `program` |
| `referral.affiliate_joined` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.affiliate_approved` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.affiliate_suspended` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.captured` | `project-referral:view` | `affiliate_id`, `connector`, `expires_at`, `referral_id`, `source`, `subscriber_id` |
| `referral.converted` | `project-referral:view` | `affiliate_id`, `commission_ends_at`, `referral_id`, `subscriber_id`, `subscription_id` |
| `referral.reward_earned` | `project-referral:view` | `affiliate_id`, `amount`, `beneficiary`, `currency_id`, `days`, `hold_until`, `kind`, `payment_id`, `referral_id`, `reward_id`, `status` |
| `referral.reward_approved` | `project-referral:view` | `affiliate_id`, `amount`, `beneficiary`, `currency_id`, `days`, `hold_until`, `kind`, `payment_id`, `referral_id`, `reward_id`, `status` |
| `referral.reward_reversed` | `project-referral:view` | `affiliate_id`, `amount`, `clawback_reward_id`, `currency_id`, `reason`, `referral_id`, `reward_id` |
| `referral.payout_recorded` | `project-referral:view` | `affiliate_id`, `amount`, `currency_id`, `payout_id`, `reference`, `rewards_paid` |

### `referral.program_updated`

A project's Referral Program settings were written, with a field-by-field list of what moved.

### When this fires

A creator saved the programme's settings or switched it on or off, from whichever surface they used. A project holds one programme, so the first save creates it and every later save updates it: the first save reports every field in `changes`, and a switch reports only `active`.

> **A paused programme attributes and rewards nothing.** `active: false` stops links attributing and payments earning at once; the ledger and the payouts stay readable. A programme whose owner's plan no longer includes the Referral Program behaves the same way without any event, because nothing on the row changed.

### Caveats

- **An edit never changes what was already earned.** Every reward row copies the figures it was priced with, so a lowered rate or a longer hold applies to payments from here on, not to the ledger.
- **`plan_ids` is reported, unlike the coupon snapshot.** It is part of the programme's shape and changes to it appear in `changes`.
- **Deleting a programme emits nothing.** The ledger beneath it stays, and a delete is refused while affiliates are still owed commissions; the creator records their payouts or switches the programme off instead.

### Related events

- `referral.affiliate_joined`: the first thing that happens once a programme is live.

```json
{
  "id": "evt_01HX...",
  "type": "referral.program_updated",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "program": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "active": true,
      "customers_only": false,
      "approval_required": false,
      "reward_kind": "cash",
      "reward_days": null,
      "commission_type": "percentage",
      "commission_value": "20.0000",
      "commission_currency_id": null,
      "commission_period_months": 12,
      "hold_days": 14,
      "minimum_payout": null,
      "friend_reward_kind": "free_days",
      "friend_reward_days": 7,
      "friend_coupon_id": null,
      "payout_details_label": "PayPal email",
      "plan_ids": []
    },
    "changes": {
      "commission_value": {
        "from": "15.0000",
        "to": "20.0000"
      },
      "hold_days": {
        "from": 30,
        "to": 14
      }
    }
  }
}
```

### `referral.affiliate_joined`

A member joined the Referral Program and was handed a code.

### When this fires

A member asked to join from the portal or a connector's bot, or the creator enrolled them by hand. `status` says where they stand: `approved` means their code attributes from this moment, `pending` means the programme requires approval and the creator has been told. A member the creator enrols is approved whatever the programme's switches say.

> **A code is minted, never chosen.** Seven characters from an alphabet without `0`, `O`, `1` or `I`, unique within the project. The member shares it through the portal link and the deep link of every connector the project runs.

### Caveats

- **A member joins once.** A second attempt is refused and emits nothing.
- **A customers-only programme refuses a lead.** A member with no live membership is refused and emits nothing; nothing in this family announces a refusal.

### Related events

- `referral.affiliate_approved`: the creator lets a pending affiliate in.
- `referral.captured`: their first friend arrives.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_joined",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "pending",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": null
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "pending"
  }
}
```

### `referral.affiliate_approved`

A pending or suspended affiliate was approved and their code attributes from now on.

### When this fires

The creator approved an affiliate. Approving one already approved changes nothing and emits nothing.

The member is told, with their link and code, when the programme is live.

### Caveats

- **Re-approving a suspended affiliate restores their earning, not the past.** Payments that settled while they were suspended earned nothing and are not revisited.

### Related events

- `referral.affiliate_suspended`: the paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_approved",
  "created_at": "2026-11-21T10:02:40Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "approved",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": "2026-11-21T10:02:40+00:00"
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "approved"
  }
}
```

### `referral.affiliate_suspended`

An affiliate was suspended: their code stops attributing and their referrals stop earning.

### When this fires

The creator suspended an affiliate. Suspending one already suspended changes nothing and emits nothing.

> **Suspension is about the future.** What the affiliate already earned stays on their balance and can still be paid out; nothing is clawed back.

### Caveats

- **Touches already captured stay captured.** A friend who arrived through the code before the suspension keeps their referral row, but a payment of theirs earns nothing while the affiliate is suspended.

### Related events

- `referral.affiliate_approved`: the way back.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_suspended",
  "created_at": "2026-12-02T15:30:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "suspended",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": "2026-11-21T10:02:40+00:00"
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "suspended"
  }
}
```

### `referral.captured`

A member arrived through an affiliate's link or typed their code, and the touch was recorded.

### When this fires

A member opened the portal or a connector's deep link carrying an affiliate's code, or typed the code at checkout, and every capture rule passed: the programme is live, the code belongs to an approved affiliate of this project, the member is not the affiliate, holds no referral row yet, and has never settled a payment on the project.

> **First touch wins.** A member carries one referral for life on a project. A second code, from anyone, is refused and emits nothing. The touch lasts the attribution window (thirty days by default); a first payment inside it converts the touch, and a touch that sees none expires quietly.

### Caveats

- **A refused capture emits nothing**, whatever the reason: a self-referral, a suspended code, a paused programme, a member who already paid.
- **Expiry emits nothing either.** A touch past `expires_at` is closed by a nightly sweep and announced nowhere; schedule against `expires_at` if you need the moment.

### Related events

- `referral.converted`: the first payment inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "referral.captured",
  "created_at": "2026-11-22T18:45:09Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "subscriber_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "source": "connector_link",
    "connector": "telegram",
    "expires_at": "2026-12-22T18:45:09+00:00"
  }
}
```

### `referral.converted`

A referred member's first payment settled, locking the referral and fixing how long it earns.

### When this fires

The ledger recorded the first settled payment of a member who holds a touch inside its window, on a plan the programme covers, and the affiliate is approved. Fires once per referral, immediately before the `referral.reward_earned` events the same payment produces.

> **The commission period is fixed here, from the programme as it stands.** A later edit to the programme never shortens or lengthens what this affiliate was promised on this member.

### Caveats

- **A payment on a plan outside the programme's `plan_ids` converts nothing.** The touch stays open until its window closes.
- **A $0 settlement converts.** A first purchase fully covered by a coupon is a settled payment; a percentage of nothing earns nothing, but days and a fixed amount are earned as usual.

### Related events

- `referral.reward_earned`: what the conversion earned each side.

```json
{
  "id": "evt_01HX...",
  "type": "referral.converted",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "subscriber_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscription_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "commission_ends_at": "2027-11-28T14:07:52+00:00"
  }
}
```

### `referral.reward_earned`

A settled payment earned a referrer, or the referred friend, days or money.

### When this fires

The ledger recorded a settled payment that a live referral earns on: the conversion earns the referrer their days or their first commission and the friend their welcome days; every later payment inside the period earns a percentage referrer another commission. One event per reward row, so a conversion on a programme with a friend reward emits two.

> **Days land at once, money waits.** A days row is `applied` when the member holds an ordinary live membership (the days are banked on it) and `pending` when they hold nothing live, in which case they wait on the affiliate's balance for their next purchase. A money row is `pending` behind the programme's hold with `hold_until` set, or `approved` at once when the hold is zero.

### Caveats

- **A redelivered payment earns nothing twice.** The ledger records a payment once, and a payment that already earned a row writes no second one.
- **A friend's days need a purchase that can carry them.** A pass or a season cannot be moved, so a friend who converts on one receives no days row at all rather than one that never applies.
- **Days are never reversed.** A refund unwinds money rows only; days already banked stay banked.

### Related events

- `referral.reward_approved`: the hold passes.
- `referral.reward_reversed`: a refund takes it back.
- `payment.succeeded`: the payment itself, from the gateway's side.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_earned",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "beneficiary": "referrer",
    "kind": "cash",
    "days": null,
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "status": "pending",
    "hold_until": "2026-12-12T14:07:52+00:00",
    "payment_id": "b81c6e0f-27a9-4d3b-93a7-c4e82f164d5b"
  }
}
```

### `referral.reward_approved`

A held commission's refund window passed and it is now payable by the creator.

### When this fires

The hourly sweep found a money row past its `hold_until` and marked it payable. Fires once per row; a row approved at once because the programme has no hold emits `referral.reward_earned` with `status: approved` and never this event.

### Caveats

- **Payable is not paid.** The creator pays the affiliate outside Subscriby and records it; until then the row counts toward the affiliate's balance and nothing else moves.
- **The sweep runs hourly**, so a row becomes payable up to an hour after `hold_until`.

### Related events

- `referral.payout_recorded`: the creator pays it.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_approved",
  "created_at": "2026-12-12T15:00:03Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "beneficiary": "referrer",
    "kind": "cash",
    "days": null,
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "status": "approved",
    "hold_until": "2026-12-12T14:07:52+00:00",
    "payment_id": "b81c6e0f-27a9-4d3b-93a7-c4e82f164d5b"
  }
}
```

### `referral.reward_reversed`

A full refund reversed a commission, or clawed back one the creator had already paid.

### When this fires

A payment that had earned a commission was fully refunded or charged back, which Subscriby learns from the same gateway event that emits `payment.refunded`. A row never paid out is reversed in place; a row already paid is answered with a clawback, a second row carrying the negative amount, so the affiliate's balance drops and the creator's next payout nets it off.

> **A partial refund changes nothing.** The creator kept most of the money, and the rule an affiliate can be told is the simple one: only a full refund takes a commission back. Days are never taken back.

### Caveats

- **A redelivered refund writes no second clawback.** The second delivery finds the rows reversed and the clawback written, and touches nothing.
- **A refund that names its payment touches that payment's commission only.** One that names none unwinds every live commission on the subscription, which is what a refund of "the last charge" means.

### Related events

- `payment.refunded`: the refund this followed.
- `referral.payout_recorded`: where a clawback is netted off.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_reversed",
  "created_at": "2026-12-05T09:20:44Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "reason": "refund",
    "clawback_reward_id": "1a5d9e34-b628-4915-8c07-8f27a0d463be"
  }
}
```

### `referral.payout_recorded`

The creator recorded that they paid an affiliate.

### When this fires

The creator recorded a payout against an affiliate, in one currency, from whichever surface they used. The amount is checked against what the affiliate is owed in that currency, then the oldest payable commissions are marked paid while the amount lasts; `rewards_paid` says how many it covered.

> **Subscriby moved no money.** The payout is the creator's own statement that money left, however they agreed to pay the affiliate.

### Caveats

- **A payout above the balance is refused** and emits nothing, as is one of nothing.
- **A clawback is paid too.** A negative row is covered in its turn, which is how a refund after a payout nets off against the next one.

### Related events

- `referral.reward_approved`: what becomes payable.
- `referral.reward_reversed`: what gets netted off.

```json
{
  "id": "evt_01HX...",
  "type": "referral.payout_recorded",
  "created_at": "2026-12-15T11:40:27Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "payout_id": "63be4915-8c07-4d3b-1a5d-9e34b6288f27",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "amount": "25.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "reference": "PAYPAL-7G2K1",
    "rewards_paid": 3
  }
}
```
