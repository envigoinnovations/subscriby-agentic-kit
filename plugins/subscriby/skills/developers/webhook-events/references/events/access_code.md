# Webhook events: Webhook Events, the `access_code` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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
