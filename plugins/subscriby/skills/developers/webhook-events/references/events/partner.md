# Webhook events: Webhook Events, the `partner` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `partner`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `partner.referral_signed_up` | `account:read` | `expires_at`, `referral_id`, `referred_name`, `source` |
| `partner.referral_converted` | `account:read` | `commission_ends_at`, `commission_percent`, `plan`, `referral_id` |
| `partner.reward_earned` | `account:read` | `amount`, `base_amount`, `currency`, `hold_until`, `invoice_id`, `referral_id`, `reward_id`, `status` |
| `partner.reward_approved` | `account:read` | `amount`, `base_amount`, `currency`, `hold_until`, `invoice_id`, `referral_id`, `reward_id`, `status` |
| `partner.reward_credited` | `account:read` | `amount`, `balance_transaction_id`, `currency`, `referral_id`, `reward_id` |
| `partner.reward_reversed` | `account:read` | `amount`, `clawback_reward_id`, `currency`, `reason`, `referral_id`, `reward_id` |
| `partner.payout_recorded` | `account:read` | `amount`, `currency`, `method`, `payout_id`, `reference`, `rewards_paid` |
| `partner.application_approved` | `account:read` | `code`, `commission_percent`, `joined_at`, `partner_id`, `proof_due_at` |
| `partner.application_rejected` | `account:read` | `partner_id`, `reapply_at`, `reason` |
| `partner.rate_changed` | `account:read` | `commission_percent`, `commitment_points`, `partner_id`, `paying_referrals`, `previous_percent`, `reason`, `volume_points` |

### `partner.referral_signed_up`

A new creator account arrived through the partner's link, typed the partner's code at sign-up or came in through the platform bot's deep link, and the referral was recorded.

### When this fires

Someone registered a new creator account with the partner's cookie on their browser (set by the partner link for 60 days), typed the partner's code on the sign-up page with no cookie present, or started the platform bot through the partner's deep link, and every capture rule passed: the partner is active, the account is new, it is not the partner's own, and it holds no referral yet.

> **First touch wins.** An account carries one partner referral for life. The cookie beats a typed code, a second code from anyone is refused, and the referral stays open for 180 days: a first paid Starter or Growth invoice inside that window converts it, and one that sees none expires quietly.

### Caveats

- **A refused capture emits nothing**, whatever the reason: a self-referral, a suspended partner, an unknown code, an account that already carries a referral.
- **A held sign-up still emits this event.** A sign-up that looks like the partner themselves (their own network, an alias of their email, or one link bringing too many sign-ups in a day) is recorded and held for review from the start; it emits `partner.referral_signed_up` like any other, converts and earns silently, and the hold shows nowhere in this family until it is decided.
- **Expiry emits nothing either.** A referral past `expires_at` is closed by a nightly sweep and announced nowhere; schedule against `expires_at` if you need the moment.
- **The friend's discount is not in this event.** The referred creator's 20% off their first three months rides on their own account and shows on their invoices; the partner's commission is taken from the discounted total.

### Related events

- `partner.referral_converted`: the first paid invoice inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "partner.referral_signed_up",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "referred_name": "Ada Lovelace",
    "source": "link",
    "expires_at": "2027-05-19T09:14:02+00:00"
  }
}
```

### `partner.referral_converted`

The referred creator's first paid Starter or Growth invoice settled, locking the referral and fixing what it earns.

### When this fires

Stripe reported a platform invoice of the referred creator paid for more than $0 on a Starter or Growth subscription while the referral was open, and the partner was active. Fires once per referral, immediately before the `partner.reward_earned` the same invoice produces.

> **The $0 trial invoice converts nothing, and neither does the Free Plan.** A card on trial is invoiced $0 and a creator on Free is invoiced only fees; the referral waits for the first paid plan invoice inside its window.

### Caveats

- **A referral held for review converts quietly.** When the card that paid the converting invoice matches the partner's own, or when the sign-up was held from the start, the referral is held under review and this event waits: it fires when Subscriby clears the referral, and the commissions written meanwhile are first heard of as `partner.reward_approved`. A rejected review emits `partner.reward_reversed` for each of them instead.
- **A later move to Free does not end the period.** The creator's fee invoices keep earning until `commission_ends_at`.

### Related events

- `partner.reward_earned`: what the converting invoice earned.

```json
{
  "id": "evt_01HX...",
  "type": "partner.referral_converted",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "plan": "starter",
    "commission_percent": "30.00",
    "commission_ends_at": "2027-11-28T14:07:52+00:00"
  }
}
```

### `partner.reward_earned`

A paid platform invoice of a referred creator earned the partner a commission.

### When this fires

Stripe reported an invoice of a converted referral paid, inside the commission period: the converting invoice itself, every renewal after it, an addon invoice, and the fee invoices of a creator who later moved to Free. One event per invoice. The commission is priced from the invoice's total before tax and after any discount, so the referred creator's 20% off their first three months lowers the first three commissions: a Starter month earns `"9.3600"` on a `"31.2000"` base, then `"11.7000"` on `"39.0000"`.

> **Money waits.** A commission is born `pending` behind a 30-day hold, so a refund inside the window can take it back; `hold_until` says when it becomes payable.

### Caveats

- **A redelivered invoice earns nothing twice.** A second `invoice.paid` for the same invoice finds its row and writes no other.
- **A suspended partner earns nothing**, and the invoice is not revisited when they are reinstated.
- **A referral under review earns silently.** Its rows are written but not announced until the review is decided.

### Related events

- `partner.reward_approved`: the hold passes.
- `partner.reward_reversed`: a refund takes it back.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_earned",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "invoice_id": "in_1QmX8s2eZvKYlo2CkA9v4z1B",
    "base_amount": "31.2000",
    "amount": "9.3600",
    "currency": "USD",
    "status": "pending",
    "hold_until": "2026-12-28T14:07:52+00:00"
  }
}
```

### `partner.reward_approved`

A held commission's hold passed and it is now payable.

### When this fires

The hourly sweep found a commission past its `hold_until` on a referral that is not under review, and marked it payable. Fires once per row.

### Caveats

- **Payable is not paid.** A partner on Subscriby Credit is credited in the same run, which `partner.reward_credited` announces; a partner paid in cash waits for the monthly run, which pays balances from $50 and announces `partner.payout_recorded`.
- **The sweep runs hourly**, so a row becomes payable up to an hour after `hold_until`.
- **A referral still under review approves nothing.** Its rows wait, past their hold, until Subscriby decides the review.

### Related events

- `partner.reward_credited`: settled as Subscriby Credit.
- `partner.payout_recorded`: settled in cash.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_approved",
  "created_at": "2026-12-28T15:00:03Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "invoice_id": "in_1QmX8s2eZvKYlo2CkA9v4z1B",
    "base_amount": "31.2000",
    "amount": "9.3600",
    "currency": "USD",
    "status": "approved",
    "hold_until": "2026-12-28T14:07:52+00:00"
  }
}
```

### `partner.reward_credited`

A payable commission was applied to the partner's Subscriby balance.

### When this fires

The hourly sweep, after approving what it could, applied a partner's whole payable balance to their Stripe customer balance in one transaction, for a partner who chose to be paid in Subscriby Credit. One event per ledger row the transaction covered, each carrying the same `balance_transaction_id`. Stripe draws a negative customer balance down on the partner's next invoice automatically, plan, addons and fees alike, so a partner on the Free Plan spends it on fees.

> **The credit rail opens separately.** Subscriby Credit is offered to partners once the balance has been verified live; until then a partner chooses a cash rail and this event never fires.

### Caveats

- **Nothing is credited while the balance is zero or negative.** Clawbacks are netted first; a partner who owes more than they are owed is credited nothing until commissions outgrow it.
- **A credit is final.** A refund after a credit writes a clawback against the next run; the balance already applied is not taken back from Stripe.

### Related events

- `partner.reward_approved`: what became payable.
- `partner.reward_reversed`: a clawback after a credit.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_credited",
  "created_at": "2026-12-28T15:00:04Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "amount": "9.3600",
    "currency": "USD",
    "balance_transaction_id": "cbtxn_1QmX8s2eZvKYlo2CkA9v4z1B"
  }
}
```

### `partner.reward_reversed`

A full refund, a dispute or a rejected review reversed a commission, or clawed back one already settled.

### When this fires

The platform charge that earned a commission was refunded in full (`reason: refund`) or disputed (`reason: dispute`), or Subscriby rejected a referral it had held for review (`reason: rejected`). A row never settled is reversed in place; a row already credited or paid is answered with a clawback, a second row carrying the negative amount, so the partner's balance drops and the next credit or payout nets it off. One event per commission touched.

> **A partial refund changes nothing.** Subscriby kept most of the money, and the rule a partner can be told is the simple one: only a full refund or a dispute takes a commission back.

### Caveats

- **A redelivered refund writes no second clawback.** The second delivery finds the rows reversed and the clawback written, and touches nothing.
- **A dispute reverses on the day it opens**, because the money is withheld from then; a dispute later won is not revisited.
- **A rejected review reverses every commission the referral earned**, and the referral earns nothing further.

### Related events

- `partner.reward_credited`: where a clawback is netted off on the credit rail.
- `partner.payout_recorded`: where a clawback is netted off in cash.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_reversed",
  "created_at": "2026-12-05T09:20:44Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "amount": "9.3600",
    "currency": "USD",
    "reason": "refund",
    "clawback_reward_id": "1a5d9e34-b628-4915-8c07-8f27a0d463be"
  }
}
```

### `partner.payout_recorded`

Subscriby recorded a cash payout to the partner.

### When this fires

Subscriby paid a partner who chose a cash rail and recorded it: payouts run monthly for balances of $50 or more, by PayPal, Wise, Remitly or USDT, to the details the partner saved, less the rail's own transfer fee. The amount is checked against what the partner is owed, then the oldest payable rows are marked paid while the amount lasts; `rewards_paid` says how many it covered, clawbacks included.

### Caveats

- **The payout details never travel.** Where the money went, a PayPal email, a wallet address or the bank account a Wise or Remitly transfer was made to, is stored encrypted on the partner's account and appears in no event.
- **A payout above the balance is refused** and emits nothing, as is one to a partner who chose Subscriby Credit.

### Related events

- `partner.reward_approved`: what becomes payable.
- `partner.reward_reversed`: what gets netted off.

```json
{
  "id": "evt_01HX...",
  "type": "partner.payout_recorded",
  "created_at": "2027-01-05T11:40:27Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "payout_id": "63be4915-8c07-4d3b-1a5d-9e34b6288f27",
    "amount": "58.5000",
    "currency": "USD",
    "method": "paypal",
    "reference": "PAYPAL-7G2K1",
    "rewards_paid": 5
  }
}
```

### `partner.application_approved`

Subscriby approved the creator's application to the Partner Program: their code is minted, their starting rate is set and their link attributes from this moment.

### When this fires

The owner approved the application on the console. Fires once per approval; a creator whose application was turned down and who applied again gets it on the later approval.

> **Nothing fires when the application is filed.** The creator filed it themselves and the page says it is under review; this event is the first thing an integration hears.

### Caveats

- **The rate here is the floor.** Each commitment the owner verifies and each volume tier reached raises it; listen to `partner.rate_changed` for the moves.
- **The application's answers never travel.** Who the partner is, where their audience lives and what they committed to stay on the account.

### Related events

- `partner.rate_changed`: every later move of the rate.
- `partner.referral_signed_up`: the first creator the link brings.

```json
{
  "id": "evt_01HX...",
  "type": "partner.application_approved",
  "created_at": "2026-11-18T10:02:41Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "code": "K7PQ2MX",
    "commission_percent": "5.00",
    "joined_at": "2026-11-18T10:02:41+00:00",
    "proof_due_at": "2027-01-17T10:02:41+00:00"
  }
}
```

### `partner.application_rejected`

Subscriby turned the creator's application down, with the reason they were given and the day they may apply again.

### When this fires

The owner rejected the application on the console with a reason. Fires once per rejection; nothing else changes on the account, and a fresh application after the cooling period starts from the creator's answers again.

### Caveats

- **An application inside the cooling period is refused on the page** and emits nothing.

### Related events

- `partner.application_approved`: the other verdict.

```json
{
  "id": "evt_01HX...",
  "type": "partner.application_rejected",
  "created_at": "2026-11-18T10:02:41Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "reason": "Your audience is outside the communities we serve today.",
    "reapply_at": "2027-02-16T10:02:41+00:00"
  }
}
```

### `partner.rate_changed`

The partner's commission rate moved, and the reason: a commitment was verified or lapsed, or their paying referrals reached a volume tier.

### When this fires

Every time the stored rate changes: the owner verified a commitment (`commitment_verified`), the owner or the nightly sweep lapsed one (`commitment_lapsed`), or a conversion carried the partner across a volume tier (`volume_tier`), whether it converted on its own or the owner cleared it from review. A verification that lands on the cap moves nothing and emits nothing.

> **Every move reaches every referral still earning**, written onto each one's `commission_percent`. A drop, which only a withdrawn commitment causes, also recalculates the commissions not yet credited or paid out. The `partner.referral_converted` that crosses a tier carries the rate before the raise, and this event follows it at once.

> **The paying count the tiers read is every referral that converted**, for life: a creator who later cancels, or whose commission months end, still counts, and a refund reverses the commission without un-counting them; only a referral the owner refuses on review is left out. So a volume tier, once reached, is kept.

### Caveats

- **The sum can pass the cap on paper.** `commitment_points` and `volume_points` are the raw points; `commission_percent` is what is paid.
- **A raise never re-prices a reward already written**: it changes what the next invoice of each earning referral pays. A drop re-prices every pending or approved commission at the lower rate, lowering only; a reward written at a rate below the new one keeps its amount, and nothing credited or paid out is touched.

### Related events

- `partner.referral_converted`: the rate copied onto one referral.
- `partner.reward_earned`: what an invoice pays at that rate.

```json
{
  "id": "evt_01HX...",
  "type": "partner.rate_changed",
  "created_at": "2026-12-03T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "previous_percent": "5.00",
    "commission_percent": "15.00",
    "reason": "commitment_verified",
    "commitment_points": 10,
    "volume_points": 0,
    "paying_referrals": 3
  }
}
```
