# Webhook events: Coupons and Access Codes

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `coupon`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `coupon.created` | `project-coupon:view` | `coupon` |
| `coupon.updated` | `project-coupon:view` | `changes`, `coupon` |
| `coupon.activated` | `project-coupon:view` | `coupon` |
| `coupon.deactivated` | `project-coupon:view` | `coupon` |
| `coupon.deleted` | `project-coupon:view` | `coupon` |
| `coupon.redeemed` | `project-coupon:view` | `code`, `coupon_id`, `currency_id`, `discount_amount`, `final_amount`, `max_redemptions`, `original_amount`, `plan_id`, `redemptions_count`, `subscriber_id`, `subscription_id` |
| `coupon.exhausted` | `project-coupon:view` | `code`, `coupon_id`, `max_redemptions`, `redemptions_count` |

### `coupon.created`

A new coupon code was authored in a project.

### When this fires

A creator authored a new coupon code over the REST API or via the `create_coupon` MCP tool. Coupons authored in the dashboard or through the bot do not currently emit this event; those surfaces write through the service layer directly.

It fires on **authoring**, not on availability. A coupon created with a future `starts_at` fires this immediately and only becomes redeemable later, so do not read this as "a discount is now live": check `starts_at` and `active`.

> There is no separate event for a coupon becoming redeemable when its `starts_at` passes. Schedule against `starts_at` from this payload if you need that moment.

### Caveats

- **The snapshot carries no redemption counts and no plan restriction.** Counts move independently of the coupon row, and the plan list is a separate relation. Read both from [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) if you need them.
- **A coupon can be created already switched off.** `active: false` here is legitimate, not a race: a creator can author a code ahead of a campaign and switch it on later, which emits `coupon.activated`.
- **`code` is uppercase regardless of what was typed.** A creator entering `blackfriday` gets `BLACKFRIDAY`. Compare case-sensitively against the uppercase form.
- Timestamps inside `data.coupon` are ISO 8601 **with offset** (`+00:00`), unlike the envelope's `created_at`, which uses `Z`. Both are UTC.

### Related events

- `coupon.updated`: the same snapshot after a change, plus a list of what moved.
- `coupon.activated` / `coupon.deactivated`: availability flips.
- `coupon.redeemed`: a subscriber actually used it.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.created",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.updated`

A coupon's terms changed, with a field-by-field list of what moved.

### When this fires

A creator changed a coupon's terms: its code, name, discount, caps, minimum, or window. Fires once per update through the REST API.

The dedicated activate and deactivate endpoints emit `coupon.activated` / `coupon.deactivated` rather than this event. An update that includes `active` is still an update, and emits `coupon.updated` with `active` in its `changes`, so handle `active` appearing in `changes` as well as subscribing to the flip events.

> **Editing terms is dashboard and API only.** The bot can create, inspect, switch off and delete a coupon, but not edit its terms; a multi-field edit is a form, not a chat. Dashboard edits do not currently emit this event (the dashboard writes through the service layer directly), so this event originates from the REST API.

`changes` only contains keys whose value differs. A save that changed nothing sends `"changes": {}`; the event still fires, because the creator did press save.

### Caveats

- **`changes` compares the snapshot, not the database columns.** It covers exactly the keys in `data.coupon`, so a change to the coupon's **plan restriction** does not appear; that lives in a separate relation the snapshot deliberately omits. Re-read [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) if you track which plans a code covers.
- **`from` and `to` keep their original types.** A decimal field gives you decimal strings, an integer field integers, a nullable field `null`. Don't assume both sides are strings.
- **Changing the code does not migrate past redemptions.** Redemptions already recorded stay attached to the coupon by id, so a renamed code keeps its history, but any subscriber who wrote the old string down now has a dead code.
- **A change is not retroactive.** Subscribers who already redeemed keep the terms they paid under; a reduced discount only affects checkouts from here on.

### Related events

- `coupon.created`: the same snapshot shape, on authoring.
- `coupon.activated` / `coupon.deactivated`: the on/off flip this event deliberately excludes.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.updated",
  "created_at": "2026-11-24T16:41:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "30.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 1000,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    },
    "changes": {
      "discount_value": {
        "from": "25.0000",
        "to": "30.0000"
      },
      "max_redemptions": {
        "from": 500,
        "to": 1000
      }
    }
  }
}
```

### `coupon.activated`

A coupon was switched on and is being offered at checkout again.

### When this fires

A creator switched a coupon **on** through the activate endpoint. Flipping the switch in the dashboard or through the bot does not currently emit this event; those surfaces write through the service layer directly.

This is the availability flip, kept out of `coupon.updated` on purpose: an automation that cares whether a discount is live wants one event to subscribe to, not a diff of the `active` key on every save.

> **Switched on is not the same as redeemable.** `active: true` is one of four conditions. A coupon still will not apply if it is outside its `starts_at` / `expires_at` window, if every use is already spoken for, or if the buyer has hit their own per-subscriber cap. Check the window and the caps in the payload before announcing a live sale.

### Caveats

- **This is not scheduled.** It fires when a person flips the switch. A coupon whose `starts_at` simply arrived does **not** emit this; nothing changed on the row. If you need the moment a code becomes redeemable, schedule against `starts_at`.
- **Re-activating a switched-off coupon does not reset its counts.** Redemptions taken before it was switched off still count against `max_redemptions`, so a code that was exhausted before is still exhausted after.
- **Idempotent flips still emit.** Activating an already-active coupon over the API emits this again. De-dup on the event `id`.

### Related events

- `coupon.deactivated`: the paired transition.
- `coupon.updated`: a terms change, which deliberately excludes this flip.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.activated",
  "created_at": "2026-11-27T00:00:31Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.deactivated`

A coupon was switched off and stops being offered at checkout.

### When this fires

A creator switched a coupon **off** through the deactivate endpoint. Switching a code off in the dashboard or through the bot does not currently emit this event; those surfaces write through the service layer directly.

This is the safe way to retire a code, and the one Subscriby points creators at when a delete is refused. Switching off stops the code being offered immediately without touching the redemptions already recorded against it.

> **A checkout already in flight still completes.** Switching off blocks **new** redemptions. A subscriber who already applied the code and is sitting on a payment page still gets their discount; the hold was taken before the switch. Expect a `coupon.redeemed` to arrive shortly *after* this event, and do not treat that as an error.

### Caveats

- **Expiry does not emit this.** A coupon that runs past its `expires_at` stops applying but its `active` flag never changes, so no event fires. If you need the expiry moment, schedule against `expires_at`.
- **Exhaustion does not emit this either.** A coupon that runs out of uses emits `coupon.exhausted` and stays `active: true`. The two are distinct states: one is a decision, the other an outcome.
- **Nothing is refunded or revoked.** Subscribers who already redeemed keep what they paid, and their subscriptions are untouched.

### Related events

- `coupon.activated`: the paired transition.
- `coupon.exhausted`: ran out of uses rather than being switched off.
- `coupon.deleted`: the destructive alternative, which stops the code resolving.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.deactivated",
  "created_at": "2026-12-01T08:02:19Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": false
    }
  }
}
```

### `coupon.deleted`

A coupon was removed, carrying its final snapshot.

### When this fires

A creator deleted a coupon through the delete endpoint. Deletions from the dashboard or the bot do not currently emit this event; those surfaces write through the service layer directly.

The payload is a snapshot taken **before** the delete, so this is your last chance to record what the code was. Read it and store what you need; the code stops resolving at checkout the moment the delete goes through.

> **The code stops working, the history stays.** The coupon row is soft-deleted and its redemption records are left in place; attribution in your own reporting is not lost. What goes is the code itself: it stops resolving at checkout immediately. To retire a code while keeping it visible to creators, use `coupon.deactivated` instead.

### Caveats

- **A delete can be refused.** If any subscriber holds a live reservation (a checkout in flight with this discount already quoted to a payment provider) Subscriby refuses the delete and asks the creator to switch the code off instead. No event fires in that case, because nothing happened.
- **The coupon is soft-deleted, not erased.** [The coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) currently still resolves it, because the lookup runs unscoped, so do not use a 404 to detect deletion; treat this event as the authoritative signal and store what you need from this payload.
- **No counts.** As with every lifecycle event, the snapshot omits redemption counts. If you need a final tally, keep a running total from `coupon.redeemed` rather than trying to read one at delete time.

### Related events

- `coupon.deactivated`: the non-destructive way to retire a code.
- `coupon.created`: the same snapshot shape, at the other end of the life.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.deleted",
  "created_at": "2026-12-04T11:22:47Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.redeemed`

A subscriber's discounted payment settled and the redemption was recorded.

### When this fires

A payment that carried a coupon **settled**. The reservation taken at checkout has been converted into a recorded redemption, and the money has actually moved.

This is the money event in the family. It is the only `coupon.*` event that carries amounts, and the only one that tells you the code was really used rather than merely offered.

> **It fires on settlement, not on apply.** A subscriber typing a code into checkout does not emit anything. If they abandon the payment, the hold expires and no event ever fires, which is exactly why a `coupon.redeemed` can be trusted as revenue and a "code applied" signal could not.

### This is the amount your reporting should use

`final_amount` is what the payment provider charged and what Subscriby's own transaction fee is calculated from. If you mirror revenue into a spreadsheet or a warehouse, use `final_amount`: not the plan's list price, and not `original_amount`.

Fires alongside `payment.succeeded` and `subscription.activated` for the same purchase. All three describe one checkout from three angles; only this one knows a discount was involved.

### Caveats

- **Only the first payment is discounted.** Coupons are first-payment-only today, so a renewal on the same subscription charges list price and emits no coupon event. Do not carry `discount_amount` forward into MRR.
- **`redemptions_count` is read fresh, so it can jump.** Under concurrent checkouts two events may report counts that are not consecutive. Treat it as a gauge, not a sequence number, and never derive ordering from it.
- **Amounts are decimal strings in the coupon redemption's currency**, which is the plan's currency, not necessarily your dashboard's display currency. Convert before summing across plans.
- **A redemption can arrive after the code was switched off**, because a checkout already in flight is allowed to complete. This is expected, not a leak.
- **Percentage and fixed discounts are both rounded to the currency's precision** before charging, so `discount_amount` is the rounded figure that actually moved, not a raw percentage of `original_amount`.

### Related events

- `coupon.exhausted`: emitted immediately after this one when the redemption takes the last use.
- `payment.succeeded`: the payment itself.
- `subscription.activated`: the subscription it bought.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.redeemed",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon_id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
    "code": "BLACKFRIDAY",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "original_amount": "40.0000",
    "discount_amount": "10.0000",
    "final_amount": "30.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "redemptions_count": 137,
    "max_redemptions": 500
  }
}
```

### `coupon.exhausted`

The last remaining use of a capped coupon was taken.

### When this fires

A settled redemption took the **last remaining use** of a capped coupon. Fires immediately after the `coupon.redeemed` that consumed it, in the same emission.

Use it to close a campaign automatically: pull the code out of a landing page, stop an ad, post "sold out", or notify the creator that the cap they set has been reached.

> **Only capped coupons can fire this.** A coupon with `max_redemptions: null` is unlimited and never emits this event.

### Exhaustion counts live reservations, so it can un-exhaust

This is the one behaviour that surprises people. The quota is enforced against settled redemptions **plus reservations whose hold has not expired**, so a coupon can report exhausted while the last few uses are still only held by checkouts in progress.

If one of those checkouts is abandoned, the hold expires and its use returns to the pool. The coupon becomes redeemable again, and **no event fires for that**, because nothing changed on the coupon row.

That design is deliberate: it means an abandoned checkout never permanently burns a use, and no sweeper job is needed to reclaim one. The consequence for you is that `coupon.exhausted` is a strong signal but not a permanent state. If your automation does something hard to undo (pausing an ad spend, emailing a list) verify the current state with [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) first, and read `redemptions.remaining` rather than comparing counts yourself.

> **`redemptions_count` can exceed `max_redemptions`.** The counter is bumped when a checkout takes a hold, not when it settles, and is only decremented when a hold is explicitly released. Lapsed holds the stale-reservation sweep has not yet reclaimed still sit in it, so on this event `redemptions_count` is equal to or greater than `max_redemptions`, never below it. Read `redemptions.remaining` from the API if you need the reservation-aware figure.

### Caveats

- **It can fire more than once for the same coupon.** Exhausted → a hold expires → redeemable → exhausted again is a legitimate sequence. De-dup on the event `id`, not on the coupon id.
- **A creator raising `max_redemptions` does not emit a matching "un-exhausted" event.** That is a `coupon.updated` with `max_redemptions` in its `changes`.
- **Expiry is a different thing entirely.** A coupon that runs past `expires_at` stops applying without ever being exhausted, and emits nothing.

### Related events

- `coupon.redeemed`: the redemption that consumed the last use; always precedes this.
- `coupon.updated`: where a raised cap shows up.
- `coupon.deactivated`: switched off by decision rather than run out by use.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.exhausted",
  "created_at": "2026-11-30T21:15:08Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon_id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
    "code": "BLACKFRIDAY",
    "max_redemptions": 500,
    "redemptions_count": 500
  }
}
```

## Family `access_code`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `access_code.generated` | `project-access-code:view` | `count`, `expires_at`, `plan_id`, `plan_name` |
| `access_code.redeemed` | `project-access-code:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `access_code.expired` | `project-access-code:view` | `expired_at`, `plan_id`, `subscription_id` |

### `access_code.generated`

A bulk-generate job completes.

### When this fires

A bulk-generation run for access codes completes. The batch is materialized in the database and is now redeemable. Batch-level only: this fires once per generation job, not per code. A 10,000-code batch produces one event.

### Caveats

- Codes themselves are never delivered through this event. The batch is delivered to the creator's chat on the connector as a CSV document or as one message per code, depending on the export type chosen at generation; to fetch them programmatically use [the access codes list](https://docs.subscriby.net/api/v1/reference/access-codes).
- There is no batch identifier in the payload. Correlate a run by `plan_id` plus `created_at`, or list codes via the access codes endpoint.
- Per-code redemption fires `access_code.redeemed`; per-code expiry fires `access_code.expired`.

### Related events

- `access_code.redeemed`: fires per code on redemption.
- `access_code.expired`: fires per code on expiry.

```json
{
  "id": "evt_01HX...",
  "type": "access_code.generated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Premium Monthly",
    "count": 250,
    "expires_at": "2026-08-18T00:00:00Z"
  }
}
```

### `access_code.redeemed`

A code is successfully redeemed by a subscriber.

### When this fires

A subscriber successfully redeems an access code. The placeholder subscription row created with that code at generation time is claimed for the subscriber and activated (or put into trial) on the associated plan.

### Caveats

- `access_code` is the complete code, not a masked fragment. It is already consumed and cannot be redeemed again, but treat it as a customer identifier and avoid forwarding it to systems you do not control.
- Pairs with `subscription.created` and either `member.joined` or `member.trial_joined`, depending on whether the redeemed plan carries a trial.

### Related events

- `access_code.generated`: predecessor (batch-level).
- `access_code.expired`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "access_code.redeemed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "access_code": "9c1a7b3f-5d80-4e62-a4f1-0b83d2e6c517"
  }
}
```

### `access_code.expired`

A code passes its expiry without redemption.

### When this fires

An access code passes its expiry without being redeemed. The placeholder subscription row holding it is hard-deleted immediately after this event is emitted.

The code string itself is **not** included on this event; only `access_code.redeemed` carries `access_code`. The placeholder row referenced by `subscription_id` is hard-deleted immediately after this event is emitted, so it will not resolve through the API.

### Caveats

- Expiry is detected by a sweep that runs every five minutes, so `created_at` trails `expired_at` by up to five minutes plus queue latency.
- Large batches may produce a sustained burst of `access_code.expired` events when the batch hits its expiry. Plan capacity accordingly.
- Codes that were already redeemed do not produce this event regardless of the batch's `expires_at`.

### Related events

- `access_code.redeemed`: alternative outcome.
- `access_code.generated`: predecessor (batch-level).

```json
{
  "id": "evt_01HX...",
  "type": "access_code.expired",
  "created_at": "2026-08-18T00:04:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "expired_at": "2026-08-18T00:00:00Z"
  }
}
```
