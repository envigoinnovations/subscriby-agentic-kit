# Webhook events: Webhook Events, the `billing` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `billing`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `billing.invoice_created` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.invoice_paid` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.invoice_overdue` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.payment_failed` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id`, `reason` |
| `billing.trial_ending` | `billing:read` | `amount`, `amount_estimated`, `creator_id`, `currency`, `hours_remaining`, `plan_id`, `subscription_id`, `trial_ends_at` |
| `billing.grace_period_warning` | `billing:read` | `creator_id`, `days_until_lockdown`, `past_due_since` |
| `billing.account_locked` | `billing:read` | `creator_id`, `locked_at`, `past_due_since` |
| `billing.tier_upgraded` | `billing:read` | `creator_id`, `effective_at`, `from_tier`, `to_tier` |
| `billing.tier_downgraded` | `billing:read` | `creator_id`, `effective_at`, `from_tier`, `to_tier` |
| `billing.tier_cancelled` | `billing:read` | `canceled_at`, `creator_id`, `effective_at`, `plan_id`, `status`, `subscription_id` |

### `billing.invoice_created`

A new invoice is generated for the creator's Subscriby tier.

### When this fires

A new invoice is generated for the creator's Subscriby tier subscription. These events describe the creator's relationship with Subscriby itself, not their subscribers.

### Caveats

- This event is creator-side only. Subscriber invoices, if any, are not represented in `billing.*`.
- Pairs with `billing.invoice_paid` on success and `billing.payment_failed` when the first attempt fails.

### Related events

- `billing.invoice_paid`: successful collection.
- `billing.payment_failed`: failed collection attempt.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 0
  }
}
```

### `billing.invoice_paid`

An invoice is paid in full.

### When this fires

The creator's tier invoice is paid in full and the account is marked current.

### Caveats

- Expect two deliveries per payment. Subscriby maps both Stripe `invoice.paid` and `invoice.payment_succeeded` onto this event. De-duplicate on `data.invoice_id`.
- Recovery is not driven by this event. `past_due_since`, `locked_at` and the warning stamps are cleared when Stripe reports the subscription back at `active`/`trialing` on `customer.subscription.updated`, which emits no `billing.*` event of its own, so a consumer tracking lock state should treat this event as a hint, not the unlock signal.
- A creator's lockdown never suspends their subscribers' billing (only new signups are blocked), so there is nothing to resume here.

### Related events

- `billing.invoice_created`: predecessor.
- `billing.payment_failed`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_paid",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 1
  }
}
```

### `billing.invoice_overdue`

A creator invoice is marked overdue.

### When this fires

The creator's invoice is marked uncollectible by the payment provider. Coverage is partial: providers do not always send this signal for every overdue scenario.

> **Deferred coverage.** Wired only to Stripe's `invoice.marked_uncollectible` signal. Stripe does not send that for every overdue scenario, so gaps are possible. Pair this event with `billing.payment_failed` and `billing.grace_period_warning` to cover overdue states reliably.

### Caveats

- Deferred in practice: coverage depends on Stripe sending `invoice.marked_uncollectible`. For full coverage of overdue states, listen for `billing.payment_failed` and `billing.grace_period_warning`.
- The billing overdue policy drives lockdowns on its own daily cadence; see `billing.account_locked`.

### Related events

- `billing.payment_failed`: typical earlier signal.
- `billing.grace_period_warning`, `billing.account_locked`: downstream signals.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_overdue",
  "created_at": "2026-04-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 3
  }
}
```

### `billing.payment_failed`

A recurring charge against the creator's payment method fails.

### When this fires

A scheduled charge against the creator's payment method fails. The platform will continue to retry inside the grace window.

### Caveats

- Multiple `billing.payment_failed` events can fire for the same `invoice_id` as Stripe retries.
- Repeated failures escalate through the grace window; see `billing.grace_period_warning` and `billing.account_locked` for that progression.

### Related events

- `billing.invoice_paid`: successful resolution.
- `billing.account_locked`: terminal state if recovery doesn't happen.

```json
{
  "id": "evt_01HX...",
  "type": "billing.payment_failed",
  "created_at": "2026-04-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 2,
    "reason": "Your card was declined."
  }
}
```

### `billing.trial_ending`

The creator's platform trial is about to convert and take its first payment.

### When this fires

The creator's own Subscriby trial crosses a reminder milestone on its way to converting. The trial collects a card at checkout and converts by itself, so this is the only advance notice a consumer gets before the first charge appears.

Milestones are configured per deployment and fire largest-first. The default ladder is **72 hours** then **24 hours** before `trial_ends_at`, so a standard 7-day trial produces exactly two events. A milestone wider than the trial itself is skipped rather than fired at signup, so a trial shorter than 72 hours emits only the 24-hour event. Fires once per milestone, not once per trial; read `hours_remaining` to tell the two apart.

Subscriby emails the creator alongside every emission, and mirrors it to their connected account when one is linked.

### Reading `amount` correctly

When `amount_estimated` is `false`, the figure comes from the upcoming Stripe invoice and already includes tax, any discount, and the transaction fees the creator's own sales metered during the trial. It is what will actually be taken.

When `amount_estimated` is `true`, Stripe could not be reached and the figure is the plan's current price including any promotion in force. Treat it as indicative: do not reconcile against it, and do not surface it as a confirmed charge.

A creator carrying a credit grant or account balance will legitimately see `"0.00"`; the trial still converts, the invoice is simply covered.

### Caveats

- **Not once per trial.** The default ladder emits twice. De-duplicate on `subscription_id` + `hours_remaining` if your consumer must act only once.
- A trial the creator cancels before it converts stops emitting: no further milestones fire and no charge is raised.
- The milestone ladder is deployment configuration, so do not hard-code `72` and `24`. Read `hours_remaining`.
- `hours_remaining` is the milestone that fired, not the exact time left. The sweep runs hourly, so the true remaining time is somewhere within an hour below the value.

### Related events

- `billing.invoice_created`: the invoice this warning was about, once the trial actually converts.
- `billing.payment_failed`: fires instead if the card on file is declined at conversion.
- `subscription.trial_converting`: the subscriber-tier equivalent, for a creator's own members.

```json
{
  "id": "evt_01HX...",
  "type": "billing.trial_ending",
  "created_at": "2026-08-23T09:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "trial_ends_at": "2026-08-26T09:00:00Z",
    "hours_remaining": 72,
    "amount": "19.00",
    "currency": "USD",
    "amount_estimated": false
  }
}
```

### `billing.grace_period_warning`

The creator is approaching automatic lockdown for an unpaid invoice.

### When this fires

The creator's account reaches the warning milestone on its overdue clock. That milestone depends on the plan's base price: **day 3** for a creator on a zero-base-price (Free) plan, whose lockdown lands on day 7, and **day 23** for a paid plan, whose lockdown lands on day 30. Fires once per past-due cycle.

Read `days_until_lockdown` from the payload rather than assuming a fixed offset; it carries the actual remaining days for that creator's tier.

### Caveats

- Each past-due cycle produces at most one `billing.grace_period_warning`. If the account recovers and re-enters past_due later, a new cycle and a new warning may issue.
- After lockdown the clock keeps running: a deletion warning at 53 days locked and account deletion at 60 days locked on paid/trial thresholds (3 and 7 days on Free). Neither stage emits a `billing.*` webhook; they surface as notifications only.

### Related events

- `billing.payment_failed`: the chain of failed collections leading here.
- `billing.account_locked`: fires when the lockdown day arrives: 7 days after this event on a paid tier, 4 on Free or an unconverted trial.

```json
{
  "id": "evt_01HX...",
  "type": "billing.grace_period_warning",
  "created_at": "2026-05-11T08:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "past_due_since": "2026-04-18T00:00:00Z",
    "days_until_lockdown": 7
  }
}
```

### `billing.account_locked`

The account hits its past-due lockdown.

### When this fires

The creator's account reaches its tier's past-due lockdown: day 30 on a paid tier, day 7 on Free or an unconverted trial. New signups on the project's portal pages are blocked and the dashboard surfaces a lockdown banner.

### Caveats

- Lockdown is reversible: a successful payment fires `billing.invoice_paid` and the lockdown is cleared automatically. There is no dedicated "account_unlocked" event.
- Existing subscribers retain access to project resources during lockdown; only new signups are blocked.

### Related events

- `billing.grace_period_warning`: the warning that precedes it, 7 days earlier on a paid tier and 4 on Free or an unconverted trial.
- `billing.invoice_paid`: automatic unlock signal.

```json
{
  "id": "evt_01HX...",
  "type": "billing.account_locked",
  "created_at": "2026-05-18T00:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "past_due_since": "2026-04-18T00:00:00Z",
    "locked_at": "2026-05-18T00:00:00Z"
  }
}
```

### `billing.tier_upgraded`

The creator upgrades to a higher Subscriby tier.

### When this fires

The creator switches their Subscriby subscription to a higher-priced tier. Pro-ration is applied through the payment provider, except when the creator is still inside their platform trial, where the switch is not prorated because nothing has been paid yet.

### Caveats

- Tier changes can unlock features (e.g. Teams on Growth+); event consumers should refresh tier caches on receipt.
- Pro-ration charges fire `billing.invoice_created` separately for the proration line (not on an upgrade taken during the platform trial).

### Related events

- `billing.tier_downgraded`: opposite direction.
- `billing.invoice_created`: proration invoice.

```json
{
  "id": "evt_01HX...",
  "type": "billing.tier_upgraded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_tier": "308eb3da-1eb6-11f0-b4f2-d8bbc173f8c3",
    "to_tier": "882b72bb-1eb6-11f0-b4f2-d8bbc173f8c3",
    "effective_at": "2026-05-18T10:05:00Z"
  }
}
```

### `billing.tier_downgraded`

The creator downgrades to a lower Subscriby tier.

### When this fires

The creator switches their Subscriby subscription to a lower tier. The change lands at the end of the period they have already paid for, not at `effective_at`: the current phase runs to its existing end date and the lower tier begins after it.

### Caveats

- `effective_at` is stamped at emission time and is never in the future, even when the provider defers the billing change to the next renewal boundary. Do not use it to schedule feature revocation.
- Tier-locked features (Teams, custom roles, etc.) may become read-only or hidden once the current paid period ends, never at `effective_at`.

### Related events

- `billing.tier_upgraded`: opposite direction.
- `billing.tier_cancelled`: terminal downgrade path.

```json
{
  "id": "evt_01HX...",
  "type": "billing.tier_downgraded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_tier": "882b72bb-1eb6-11f0-b4f2-d8bbc173f8c3",
    "to_tier": "308eb3da-1eb6-11f0-b4f2-d8bbc173f8c3",
    "effective_at": "2026-05-18T10:05:00Z"
  }
}
```

### `billing.tier_cancelled`

The creator cancels their Subscriby subscription.

### When this fires

The creator cancels their Subscriby tier subscription. The account remains usable until the current period ends.

This event has **two distinct payload shapes** depending on which side initiated the cancellation. Branch on the presence of `effective_at` versus `subscription_id`.

### Caveats

- **Expect this event twice for a single cancellation.** The dashboard shape fires when the creator cancels; the provider shape fires later, when the period actually ends and the provider deletes the subscription. De-duplicate on `data.creator_id` if you only want to act once.
- Cancellation does not refund the active period; there is a no-refunds policy on creator tier billing.
- The account does not auto-lock at `effective_at` unless past_due conditions also apply; it gracefully drops to the Free tier feature set.

### Related events

- `billing.tier_downgraded`: alternative path that retains paid features.
- `billing.invoice_paid`: last paid invoice before cancellation.

