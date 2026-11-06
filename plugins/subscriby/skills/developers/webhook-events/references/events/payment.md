# Webhook events: Webhook Events, the `payment` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `payment`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `payment.succeeded` | `project-subscription:view` | `amount`, `billing_reason`, `currency`, `external_payment_id`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `payment.failed` | `project-subscription:view` | `amount`, `currency`, `external_payment_id`, `plan_id`, `provider`, `reason`, `subscriber_id`, `subscription_id` |
| `payment.pending` | `project-subscription:view` | `order_id`, `plan_id`, `provider`, `session_id`, `subscriber_id` |
| `payment.refunded` | `project-subscription:view` | `amount`, `external_payment_id`, `full_refund`, `plan_id`, `reason`, `subscriber_id`, `subscription_id` |

### `payment.succeeded`

A provider confirms a successful charge.

### When this fires

A payment provider confirms a successful charge against a subscriber. Fires for both initial checkouts and recurring renewals.

### Caveats

- For first-time paid checkouts, `subscription.activated` is the matching subscription-level event, not `subscription.created`, which never fires for paid purchases.
- Renewals pair `payment.succeeded` with `subscription.renewed`.
- Card numbers, PAN, and CVV are never included in payloads.

### Related events

- `subscription.activated` (first payment), `subscription.renewed` (renewals): paired subscription events.
- `payment.failed`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "payment.succeeded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "external_payment_id": "pi_3Nxy..",
    "amount": "29.00",
    "currency": "USD",
    "billing_reason": "subscription_create"
  }
}
```

### `payment.failed`

A provider rejects a charge.

### When this fires

A payment provider rejects a charge: invalid card, insufficient funds, gateway risk, expired source. Emitted by Stripe, CeyPay, CoinPayments, Paystack, Razorpay and Skrill. PayPal does not emit `payment.failed`; a failed PayPal charge surfaces only through the subscription-level events.

### Caveats

- The paired subscription event differs by provider: Razorpay emits `subscription.past_due` alongside; CeyPay, CoinPayments and Skrill instead cancel the subscription and emit `subscription.cancelled`; Paystack emits nothing alongside; for Stripe, `subscription.past_due` arrives separately when Stripe next syncs the subscription's status. Do not assume a subscription event accompanies every `payment.failed`.
- A single billing cycle can produce multiple `payment.failed` events as the provider retries.

### Related events

- `payment.succeeded`: alternative outcome.
- `subscription.past_due`: paired subscription event for recurring failures.

```json
{
  "id": "evt_01HX...",
  "type": "payment.failed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "external_payment_id": "pi_3Nxy..",
    "reason": "Your card was declined.",
    "amount": "29.00",
    "currency": "USD"
  }
}
```

### `payment.pending`

A payment is initiated, awaiting provider confirmation.

### When this fires

A subscriber initiates checkout and is redirected to the provider, but the charge is not yet confirmed (bank transfer, crypto settlement, hosted-checkout sessions).

PayPal carries **neither** `session_id` nor `order_id`: a PayPal `payment.pending` gives you only `provider`, `plan_id`, and `subscriber_id`, so it cannot be correlated to a specific checkout attempt. Absent keys are omitted entirely rather than sent as `null`; the one exception is Stripe's `session_id`, which is always present on the Stripe path but may be `null`.

### Caveats

- A pending payment is not yet a subscription. `subscription_id` is intentionally absent.
- The same checkout may emit one `payment.pending` followed by either `payment.succeeded` or `payment.failed`. Correlate on `session_id` or `order_id` where the provider supplies one; for PayPal, fall back to `subscriber_id` plus `plan_id`.
- Subscribers who close the provider page without completing will not produce a final outcome event; pending sessions can hang indefinitely.

### Related events

- `payment.succeeded`, `payment.failed`: terminal outcomes.
- `subscription.activated`: fires alongside the `payment.succeeded` that completes a first checkout.

```json
{
  "id": "evt_01HX...",
  "type": "payment.pending",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "provider": "stripe",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "session_id": "cs_test_.."
  }
}
```

### `payment.refunded`

A specific charge is refunded, fully or partially.

### When this fires

A per-payment refund settles. Pairs with `subscription.refunded` when the refund covers the entire subscription.

> **Settled refunds only.** A refund a provider has queued but not yet paid out raises nothing; access is never revoked for money that has not actually moved.

### Caveats

- Emitted by Stripe, PayPal, Paystack, Razorpay and Skrill. CoinPayments and CeyPay expose no refund notification.
- Raised for partial refunds as well as full ones. Read `full_refund` to tell them apart; a partial refund leaves the subscription and its access untouched.
- Stripe reports a running total across refunds; the `amount` here is **this** refund, not the cumulative figure.
- Distinct from `subscription.refunded`, which represents the subscription's reaction. A refund may emit only `payment.refunded` if the subscription itself is unaffected.
- Partial refunds are represented by `amount` being less than the original charge.

### Related events

- `payment.succeeded`: predecessor.
- `subscription.refunded`: subscription-level analogue.

```json
{
  "id": "evt_01HX...",
  "type": "payment.refunded",
  "created_at": "2026-05-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "external_payment_id": "pi_3Nxy..",
    "amount": "29.00",
    "full_refund": true
  }
}
```
