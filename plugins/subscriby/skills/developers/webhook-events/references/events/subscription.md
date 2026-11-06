# Webhook events: Webhook Events, the `subscription` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `subscription`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `subscription.created` | `project-subscription:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.activated` | `project-subscription:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.trial_started` | `project-subscription:view` | `access_code`, `plan_id`, `project_id`, `provider`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.trial_converting` | `project-subscription:view` | `plan_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.trial_expired` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.renewed` | `project-subscription:view` | `amount`, `currency`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.reactivated` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.paused` | `project-subscription:view` | `paused_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.unpaused` | `project-subscription:view` | `plan_id`, `resumed_at`, `subscriber_id`, `subscription_id` |
| `subscription.past_due` | `project-subscription:view` | `external_payment_id`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.unpaid` | `project-subscription:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.cancelled` | `project-subscription:view` | `paypal_event`, `plan_id`, `provider`, `reason`, `subscriber_id`, `subscription_id` |
| `subscription.expired` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.refunded` | `project-subscription:view` | `amount`, `external_payment_id`, `full_refund`, `plan_id`, `reason`, `subscriber_id`, `subscription_id` |
| `subscription.upgraded` | `project-subscription:view` | `from_plan_id`, `proration_amount`, `subscriber_id`, `subscription_id`, `to_plan_id` |
| `subscription.downgraded` | `project-subscription:view` | `from_plan_id`, `proration_amount`, `subscriber_id`, `subscription_id`, `to_plan_id` |
| `subscription.payment_recovered` | `project-subscription:view` | `access_restored`, `payment_id`, `plan_id`, `provider`, `recovered_at`, `subscriber_id`, `subscription_id` |
| `subscription.access_suspended` | `project-subscription:view` | `grace_days`, `grace_ends_at`, `payment_failed_at`, `plan_id`, `subscriber_id`, `subscription_id`, `suspended_at` |
| `subscription.access_restored` | `project-subscription:view` | `plan_id`, `restored_at`, `subscriber_id`, `subscription_id`, `suspended_at` |
| `subscription.cancellation_feedback` | `project-subscription:view` | `cancellation_id`, `feedback`, `offer_shown`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `surface` |
| `subscription.offer_taken` | `project-subscription:view` | `cancellation_id`, `coupon_code`, `offer`, `plan_id`, `resumes_at`, `subscriber_id`, `subscription_id` |

### `subscription.created`

New subscription created via access-code redemption or cardless trial.

### When this fires

Exactly two paths emit this event:

- **Access-code redemption**: a subscriber redeems a code against a plan.
- **Cardless trial start**: a subscriber begins a trial that took no payment method.

Both are zero-payment acquisitions. Every paid acquisition (every payment provider, both recurring subscriptions and one-time passes) emits `subscription.activated` instead, and never emits `subscription.created`.

> This event does **not** fire for paid checkouts. A card, wallet, or crypto purchase emits `subscription.activated` instead. If you are building access control for a paying audience, subscribe to both.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

> `access_code` carries the complete code. It is already consumed and cannot be redeemed again, but treat it as you would any other customer identifier and avoid logging it into systems you do not control.

### Caveats

- Do not treat this as the universal "a subscription exists" signal. For paid projects it never fires. The reliable pattern is to subscribe to both `subscription.created` and `subscription.activated` and de-duplicate on `data.subscription_id`.
- The access-code path also emits `access_code.redeemed` and either `member.joined` or `member.trial_joined` for the same subscription.
- The cardless-trial path also emits `subscription.trial_started` and `member.trial_joined`.
- The `POST /v1/webhook-endpoints/{endpoint}/test` endpoint sends a synthetic `subscription.created` payload regardless of your project's payment configuration. A successful test does not prove this event will fire in production.

### Related events

- `subscription.activated`: the paid-checkout equivalent.
- `access_code.redeemed`: fires alongside on the access-code path.
- `subscription.trial_started`: fires alongside on the cardless-trial path.


### `subscription.activated`

A paid subscription is acquired. Fires once, at first activation.

### When this fires

On the **first successful payment** for a subscription, across every payment provider: Stripe, PayPal, Paystack, Razorpay, Skrill, CeyPay, and CoinPayments. It covers both recurring subscriptions and one-time (non-recurring) passes.

It fires **once per subscription**, at acquisition. It is not a general "became active" signal:

| Transition                              | Event actually emitted       |
| --------------------------------------- | ---------------------------- |
| First paid checkout                     | `subscription.activated`     |
| Recurring renewal charge                | `subscription.renewed`       |
| Paused → resumed                        | `subscription.unpaused`      |
| Cancelled → reinstated before `ends_at` | `subscription.reactivated`   |
| Past-due → collected                    | `subscription.renewed`       |
| Trial → paying                          | `member.converted`           |
| Access code / cardless trial            | `subscription.created`       |

A Stripe subscription that begins in a trial still emits `subscription.activated` at acquisition, because the provider creates the subscription at that moment. The later trial-to-paid transition emits `member.converted` only.

> This is the paid-acquisition event. If you only subscribe to one subscription event for a paying audience, subscribe to this one, not `subscription.created`, which never fires for paid checkouts.

`data.provider` is never `access_code` on this event; code redemptions emit `subscription.created` instead.

### Caveats

- **Once per subscription.** Stripe and PayPal de-duplicate with a persistent guard key; the remaining providers emit only on the non-renewal branch of their payment handler. Renewals never re-emit it.
- To capture _every_ acquisition path (paid, comped code, and cardless trial) subscribe to both `subscription.activated` and `subscription.created`, then de-duplicate on `data.subscription_id`.
- Paid acquisitions do **not** emit `member.joined`. That event is access-code-only. Use `subscription.activated` as the paid-audience join signal.
- `payment.succeeded` fires for the same charge and carries the amount, currency, and external payment id, which this event does not.
- The `POST /v1/webhook-endpoints/{endpoint}/test` endpoint sends a synthetic `subscription.created` payload, never `subscription.activated`. Testing an endpoint does not exercise this event.

### Related events

- `subscription.created`: the zero-payment acquisition equivalent.
- `payment.succeeded`: the charge behind this activation.
- `subscription.renewed`: every subsequent cycle.
- `member.converted`: trial-to-paying transition.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.activated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.trial_started`

Trial-enabled plan starts free window.

### When this fires

A subscriber starts a trial on a trial-enabled plan. Three paths emit it: a cardless trial, an access-code redemption against a trial plan, or a **Stripe** checkout that begins in a trial window.

Trial checkouts through the other providers (PayPal, Paystack, Razorpay, Skrill, CeyPay, CoinPayments) do not currently emit this event; only Stripe reports the trialing status transition back to Subscriby.

> Pairs with `member.trial_joined`: both fire together when a subscriber starts a trial on the cardless-trial and access-code paths.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

### Caveats

- On the cardless-trial and access-code paths this is paired with `subscription.created` and `member.trial_joined` for the same `subscription_id`. On the Stripe path it is paired with `subscription.activated` instead, and no `member.*` join event fires.
- Plans with `trial_days = 0` skip this event entirely.

### Related events

- `subscription.trial_converting`: fires 24h before `trial_ends_at`.
- `subscription.trial_expired`: fires if no conversion occurs.


### `subscription.trial_converting`

Trial about to convert. Fires 24h before `trial_ends_at`.

### When this fires

Fires 24 hours before `trial_ends_at` to give consumers a window to send conversion-reminder messaging. Emitted once per trial, by the hourly trial-conversion notifier.

> Fires exactly once per trial, 24 hours before `trial_ends_at`.

### Caveats

- Idempotency is enforced server-side: each trial receives this event at most once.
- If `trial_ends_at` is moved closer than 24h after the trial has already started, the notice may not fire.

### Related events

- `subscription.trial_started`: predecessor.
- `subscription.activated`, `member.converted`: fire on successful conversion.
- `subscription.trial_expired`: alternative path if conversion fails.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.trial_converting",
  "created_at": "2026-05-24T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "trial_ends_at": "2026-05-25T10:05:00Z"
  }
}
```

### `subscription.trial_expired`

Trial ended without conversion.

### When this fires

A trial ends without conversion. Emitted alongside `subscription.expired` for the same subscription.

### Caveats

- Successful conversions fire `subscription.activated` and `member.converted` instead.
- Expect `subscription.expired` and `member.churned` to follow for the same subscriber.

### Related events

- `subscription.trial_started`: predecessor.
- `subscription.expired`: fires alongside.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.trial_expired",
  "created_at": "2026-05-25T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "trial_ends_at": "2026-05-25T10:05:00Z",
    "ends_at": "2026-05-25T10:05:00Z"
  }
}
```

### `subscription.renewed`

Recurring billing successfully charged the subscriber.

### When this fires

Recurring billing successfully charges the subscriber and the subscription is renewed for another period.

### Caveats

- A `subscription.renewed` is always paired with a `payment.succeeded` for the same charge.
- Currency may differ from the plan's nominal currency for providers that auto-convert at the gateway.

### Related events

- `payment.succeeded`: paired payment event.
- `subscription.past_due`, `subscription.unpaid`: failure paths.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.renewed",
  "created_at": "2026-06-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "amount": "29.00",
    "currency": "USD"
  }
}
```

### `subscription.reactivated`

Cancelled subscription re-activated before `ends_at`.

### When this fires

A previously cancelled subscription is reactivated before its `ends_at`. The subscription returns to the active state and the next billing cycle resumes.

### Caveats

- Reactivation is only possible while `ends_at` is in the future. After expiration, a new subscription must be created instead.
- Pairs with a renewed provider subscription for paid plans; the next charge will follow normal cadence.

### Related events

- `subscription.cancelled`: predecessor.
- `subscription.expired`: alternative path if reactivation does not occur.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.reactivated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `subscription.paused`

A member's access was suspended. Billing is unaffected and continues on schedule.

### When this fires

A creator suspended a member's **access**. `payment_status` becomes `paused`, `paused_at` is stamped, and the member is removed from every linked resource.

> **This is an access pause, not a billing pause.** The member's payment provider keeps charging them on schedule. Subscriby does not pause collection, suspend the PayPal agreement, or otherwise hold the charge. If you need billing to stop, cancel instead.
>
> The split is deliberate: Subscriby settles through seven providers and only some can hold a recurring charge at all, so a pause meaning "stop billing" would work on some providers and silently not on others. Access is something Subscriby controls directly, so it behaves identically everywhere.

Before 1 September 2026 this event fired without anything happening: no provider was called _and_ no access was removed. If you built on the old behaviour, note that a paused member now genuinely loses access.

### Caveats

- Pausing does not change `ends_at`, and does not stop the clock. The member is still being billed, so a long pause costs them money for access they do not have. Tell them, or cancel instead.
- Access removal is queued, one call per linked resource, so it completes shortly after this event rather than atomically with it.
- Pausing does not detach resources, so no `member.resource_removed` events follow. Revocation happens only on expiry or cancellation.

### Related events

- `subscription.unpaused`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.paused",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "paused_at": "2026-05-18T10:05:00Z"
  }
}
```

### `subscription.unpaused`

Paused subscription resumes; resource invite links re-issued.

### When this fires

A suspended member has their access restored, with **fresh** invite links: an invite link revoked on pause cannot be un-revoked.

Billing is not mentioned here because it never stopped: pausing suspends access only, so there is nothing on the provider side to resume.

### Caveats

- Expect `member.resource_added` entries as resources are re-attached. `subscription.activated` does **not** follow an unpause; it fires only once, at first paid acquisition.
- Renewal cadence resumes from the original `ends_at` boundary, not the unpause moment.

### Related events

- `subscription.paused`: paired transition.
- `member.resource_added`: re-grant signal.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.unpaused",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resumed_at": "2026-05-22T10:05:00Z"
  }
}
```

### `subscription.past_due`

Billing fails but grace period is active.

### When this fires

A scheduled charge fails but the subscription remains within its grace window. The platform will continue to attempt collection.

Coverage is partial: only **Stripe** and **Razorpay** report the past-due transition back to Subscriby. Failed renewals on PayPal, Paystack, Skrill, CeyPay, and CoinPayments emit `payment.failed` without a matching `subscription.past_due`, so treat `payment.failed` as the reliable cross-provider signal.

### Caveats

- Pairs with a `payment.failed` event for the underlying charge.
- If retries succeed, `subscription.renewed` follows. If grace expires, `subscription.unpaid` fires instead.

### Related events

- `payment.failed`: paired payment event.
- `subscription.unpaid`: grace-window terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.past_due",
  "created_at": "2026-06-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "razorpay",
    "external_payment_id": "pay_NxYz.."
  }
}
```

### `subscription.unpaid`

Billing permanently failed; grace expired.

### When this fires

A subscription's grace period ends without successful collection. The provider has given up retrying. Resource access is typically revoked shortly after.

This event is emitted for **Stripe only**; it depends on the provider reporting an `unpaid` subscription status. On every other provider, an abandoned subscription surfaces as `subscription.expired` once `ends_at` passes, with no preceding `subscription.unpaid`.

### Caveats

- After this event, the subscription is non-recoverable on its current terms; the subscriber must restart with a new subscription.
- Expect `subscription.expired` and `member.churned` to follow.

### Related events

- `subscription.past_due`: predecessor inside the grace window.
- `subscription.expired`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.unpaid",
  "created_at": "2026-07-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.cancelled`

Cancellation recorded; access continues until `ends_at`.

### When this fires

Cancellation is recorded by the subscriber, by the creator, or by the payment provider (a gateway-side cancellation, or a terminal payment failure on CeyPay, CoinPayments or Skrill). If the paid period still has time left, the subscription stays active and the subscriber keeps access until `ends_at`, after which `subscription.expired` fires. If no paid period remains, `ends_at` is set to the cancellation moment and resource access is revoked straight away.

### Caveats

- Cancellation is reversible until `ends_at`; see `subscription.reactivated`.
- A renewal does not occur after cancellation; `subscription.renewed` will not fire.

### Related events

- `subscription.expired`: fires when the period ends.
- `subscription.reactivated`: reverse path.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.cancelled",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.expired`

`ends_at` reached; access revoked.

### When this fires

The subscription's `ends_at` has passed. Resource access is revoked and the subscription transitions to its terminal state.

### Caveats

- Pairs with `member.churned` when this is the subscriber's last active subscription.
- Resource access is revoked as part of expiry; expect `member.resource_removed` events for each granted resource.

### Related events

- `subscription.cancelled`, `subscription.unpaid`, `subscription.trial_expired`: predecessors.
- `member.churned`: paired member-level event.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.expired",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `subscription.refunded`

Refund recorded against a subscription.

### When this fires

A **full** subscription-level refund settles. The subscription is always expired as a result: resource access is revoked and `subscription.expired` (plus `member.churned` when this was the subscriber's last active subscription) follows for the same subscription.

> Fires only for a **settled** refund. A refund a provider has queued but not yet paid out raises nothing; access is never revoked for money that has not actually moved.

### Caveats

- Emitted by Stripe, PayPal, Paystack, Razorpay and Skrill. CoinPayments and CeyPay expose no refund notification, so a refund taken there is invisible to this event.
- A **partial** refund raises `payment.refunded` only. This event means the whole charge came back, and access is revoked with it.
- Skrill reports a chargeback rather than a merchant refund, and only if the creator's Skrill account is configured to post one.
- Subscriby expires the subscription itself on a full refund; it does not wait for the provider's own cancellation to arrive.
- For per-payment refunds (no subscription mutation), see `payment.refunded`.

### Related events

- `payment.refunded`: payment-level analogue.
- `subscription.cancelled`: often paired in practice.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.refunded",
  "created_at": "2026-05-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "amount": "29.00",
    "full_refund": true,
    "external_payment_id": "pi_3Nxy..",
    "reason": "requested_by_customer"
  }
}
```

### `subscription.upgraded`

Subscriber moved to a higher-priced plan.

### When this fires

A subscriber is switched to a higher-priced plan on the same project. The plan assignment, currency, and stored price on the Subscriby subscription record are updated, and this event reports the move.

The switch does not itself perform a provider-side pro-ration or issue a charge. Any billing adjustment is whatever the provider does on the next cycle.

### Caveats

- Direction is decided by comparing the two plan prices, normalised to USD, at switch time. Only a strictly higher new price emits `subscription.upgraded`; an **equal-price switch emits `subscription.downgraded`**, which is worth guarding for if you offer same-price plan swaps.
- Trial windows do not carry across switches; if the destination plan has a trial it does not start.

### Related events

- `subscription.downgraded`: opposite direction.
- `payment.succeeded`: the next successful charge on the new plan.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.upgraded",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "to_plan_id": "e07b4a29-51c6-4d83-9f10-2b8ac635d174",
    "proration_amount": null
  }
}
```

### `subscription.downgraded`

Subscriber moved to a lower-priced plan.

### When this fires

A subscriber is switched to a lower-priced plan on the same project. The plan assignment, currency, and stored price on the Subscriby subscription record are updated, and this event reports the move.

The switch does not itself perform a provider-side pro-ration or issue a credit. Any billing adjustment is whatever the provider does on the next cycle.

### Caveats

- No credit or refund is issued by this action. If you owe subscribers a mid-cycle credit on downgrade, apply it yourself through the provider.
- Direction is decided by comparing the two plan prices, normalised to USD. Anything that is not strictly more expensive lands here, so a **switch between two equally-priced plans emits this event**, not `subscription.upgraded`.
- Resource access tied to the higher tier may be revoked on the next renewal cycle.

### Related events

- `subscription.upgraded`: opposite direction.
- `member.resource_removed`: emitted when premium-tier resources are detached.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.downgraded",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_plan_id": "e07b4a29-51c6-4d83-9f10-2b8ac635d174",
    "to_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "proration_amount": null
  }
}
```

### `subscription.payment_recovered`

A failed renewal was settled, and the grace clock on the subscription closed.

### When this fires

A renewal that had failed is paid: the rail's next charge settles, or the rail reports the subscription active again before the money reaches the ledger. Either closes the clock Revenue Recovery opened at the failure, converts every notice sent during the window and stamps `recovered_at`. When the window had already closed and access had been paused, the member's invite links are reissued and they are welcomed back, which `subscription.access_restored` reports separately.

Only a renewal of a membership that has paid before opens a clock, so this never fires for a first purchase or for a one-time rail. A charge that settles on a subscription with no open clock fires `subscription.renewed` alone.

### Related events

- `subscription.access_suspended`: the pause this may be undoing.
- `subscription.access_restored`: the reissued links, when `access_restored` is `true`.
- `payment.succeeded`: the charge behind it.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.payment_recovered",
  "created_at": "2026-10-14T10:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "payment_id": "f8e1c3a5-2d7b-4e96-b0c4-9a5d3f7e1b28",
    "access_restored": true,
    "recovered_at": "2026-10-14T10:00:00+00:00"
  }
}
```

### `subscription.access_suspended`

A failed renewal's grace window closed unpaid, and the member's access was paused.

### When this fires

The grace window the project gives a failed renewal (0 to 30 days, set per project; a new project starts at 0, which pauses at the failure itself) ran out with no settled charge. The member is removed from the project's resources and told that their access is paused and how to pay, the subscription stays `past_due` so the rail's own retries can still settle it, and the next settled charge brings them back. A window of zero days pauses at the failure itself.

A membership that never paid is revoked at the failure without a window, as it always was, and fires `subscription.expired` instead.

### Caveats

- The subscription's status does not change on this event: it was already `past_due`, and stays so until a charge settles or the rail gives up (`subscription.unpaid`).
- A creator's own pause (`subscription.paused`) is a different thing and never collides with this: a subscription the creator paused is left out of the grace sweep.

### Related events

- `subscription.past_due`: the failure that opened the window.
- `subscription.payment_recovered`: the charge that ends it.
- `subscription.access_restored`: the member let back in.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.access_suspended",
  "created_at": "2026-10-19T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "payment_failed_at": "2026-10-12T10:00:00+00:00",
    "grace_days": 7,
    "grace_ends_at": "2026-10-19T10:00:00+00:00",
    "suspended_at": "2026-10-19T10:30:00+00:00"
  }
}
```

### `subscription.access_restored`

A member whose access was paused for non-payment was let back in.

### When this fires

A charge settled, or the rail reported the subscription active, for a member whose access had been paused at the close of a grace window. Their bearer links are revoked and reissued, they are welcomed back, and the clock is cleared. It fires beside `subscription.payment_recovered`, which carries the payment; this one carries the pause it undid.

### Related events

- `subscription.access_suspended`: the pause.
- `subscription.payment_recovered`: the charge, raised beside this.
- `member.resource_added`: the resources the member rejoins.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.access_restored",
  "created_at": "2026-10-21T08:15:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "suspended_at": "2026-10-19T10:30:00+00:00",
    "restored_at": "2026-10-21T08:15:00+00:00"
  }
}
```

### `subscription.cancellation_feedback`

A cancelling member said why they are leaving.

### When this fires

A member reached the cancellation screen, on the portal or in a connector chat, and answered the question the project asks on the way out: a reason from the fixed list and, if they wrote one, a sentence of their own. It fires the moment the reason is recorded, before the member sees the offer or confirms, so a member who then takes the offer and stays still appears here. The creator is alerted at the same time. A project that switched the question off asks nothing and fires nothing; its offers are still counted, through `subscription.offer_taken` and the cancellation records.

### Related events

- `subscription.offer_taken`: the member took the offer instead of cancelling.
- `subscription.cancelled`: the member went on and cancelled.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.cancellation_feedback",
  "created_at": "2026-10-22T09:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "cancellation_id": "9d2c6b71-3e48-4f0a-a5d7-1b8e4c9f2a36",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "reason": "too_expensive",
    "feedback": "Money is tight this quarter.",
    "offer_shown": "pause",
    "surface": "portal"
  }
}
```

### `subscription.offer_taken`

A cancelling member took the offer the cancellation screen made.

### When this fires

A member on the cancellation screen accepted the one offer the project makes for their rail: a pause for one billing cycle where the rail can hold the charge (Stripe, PayPal), a discount on the renewals where the rail can carry a coupon (Stripe), or a coupon to come back with everywhere else. A pause holds the charge at the gateway and pauses access, and the hourly sweep lets the member back in when `resumes_at` passes; a discount is minted once at the gateway and applied to the subscription; a return coupon is handed to the member on the screen and in a chat message, and the cancellation goes on. The offer is re-derived when the member accepts, so a stale screen cannot claim an offer the project no longer makes.

### Caveats

- A pause taken here keeps the subscription: it reads as `paused` until `resumes_at`, and no `subscription.cancelled` follows. A return coupon does not: the cancellation goes on and `subscription.cancelled` fires as usual.
- A member sees one offer per cancellation. Declining it fires nothing; the shown offer is still counted on the cancellation record.

### Related events

- `subscription.cancellation_feedback`: the reason recorded just before.
- `subscription.paused` / `subscription.unpaused`: the pause's two ends.
- `coupon.redeemed`: a return coupon used at checkout.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.offer_taken",
  "created_at": "2026-10-22T09:31:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "cancellation_id": "9d2c6b71-3e48-4f0a-a5d7-1b8e4c9f2a36",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "offer": "pause",
    "coupon_code": null,
    "resumes_at": "2026-11-22T09:31:00+00:00"
  }
}
```
