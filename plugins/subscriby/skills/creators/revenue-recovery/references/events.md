# Webhook events: Revenue Recovery

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

## Family `sequence`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `sequence.created` | `project-sequence:view` | `sequence` |
| `sequence.updated` | `project-sequence:view` | `sequence` |
| `sequence.deleted` | `project-sequence:view` | `sequence` |
| `sequence.enrolled` | `project-sequence:view` | `enrollment_id`, `next_due_at`, `plan_id`, `sequence_id`, `subscriber_id`, `subscription_id`, `trigger` |
| `sequence.step_sent` | `project-sequence:view` | `coupon_code`, `enrollment_id`, `position`, `sent_at`, `sequence_id`, `step_id`, `subscriber_id` |
| `sequence.converted` | `project-sequence:view` | `converted_at`, `enrollment_id`, `payment_id`, `sequence_id`, `subscriber_id` |
| `sequence.exited` | `project-sequence:view` | `enrollment_id`, `exited_at`, `reason`, `sequence_id`, `subscriber_id` |

### `sequence.created`

A recovery sequence was built in a project.

### When this fires

A creator built a sequence on the Revenue Recovery page: a name, a trigger and whether it runs. It fires on **authoring**, with no steps yet; the steps arrive one by one as `sequence.updated`. Nobody is enrolled by this event: enrolment waits for the trigger to fire for a member, and a sequence with no steps enrols nobody even then.

### Related events

- `sequence.updated`: the steps arrive, and every later change.
- `sequence.enrolled`: the first member enters it.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.created",
  "created_at": "2026-10-22T09:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-10-22T09:30:00+00:00",
      "deleted_at": null
    }
  }
}
```

### `sequence.updated`

A recovery sequence changed.

### When this fires

A creator renamed the sequence, moved it to another trigger, switched it on or off, or added, rewrote or removed a step on the Revenue Recovery page. Every save fires it, so a consumer always holds the snapshot after the latest write. Switching a sequence off also lets every member part-way through it go, each as `sequence.exited` with the reason `disabled`, and enrols nobody new until it runs again.

### Caveats

- **Positions move, enrolments do not.** A member who was due the removed step receives the step that took its place, and a member past the last remaining step completes on the next sweep. Read the steps by id if you track one.
- A sequence may hold up to 8 steps. The ninth is refused on the dashboard and fires nothing.

### Related events

- `sequence.created`: the sequence was built.
- `sequence.exited`: the members let go when the sequence was switched off.
- `sequence.deleted`: the sequence was deleted.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.updated",
  "created_at": "2026-10-22T09:45:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [
        {
          "id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
          "position": 1,
          "delay_days": 3,
          "coupon_id": null
        },
        {
          "id": "9d4e2a07-1b6c-4f58-8e3a-5c7f0d2b9e41",
          "position": 2,
          "delay_days": 7,
          "coupon_id": "c2d8e4f1-7a3b-4c9d-b5e6-1f0a9d8c7b65"
        }
      ],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-10-22T09:45:00+00:00",
      "deleted_at": null
    }
  }
}
```

### `sequence.deleted`

A recovery sequence was deleted.

### When this fires

A creator deleted the sequence on the Revenue Recovery page. Every member part-way through it is let go first, each as `sequence.exited` with the reason `deleted`, and only then does this fire with the final snapshot. The row is kept out of sight with its history: the messages already sent stay in the project's activity ledger and still count as converted when the member pays again.

### Related events

- `sequence.exited`: the members let go, with the reason `deleted`, just before this.
- `sequence.updated`: the sequence's earlier changes.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.deleted",
  "created_at": "2026-11-02T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [
        {
          "id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
          "position": 1,
          "delay_days": 3,
          "coupon_id": null
        },
        {
          "id": "9d4e2a07-1b6c-4f58-8e3a-5c7f0d2b9e41",
          "position": 2,
          "delay_days": 7,
          "coupon_id": "c2d8e4f1-7a3b-4c9d-b5e6-1f0a9d8c7b65"
        }
      ],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-11-02T14:10:00+00:00",
      "deleted_at": "2026-11-02T14:10:00+00:00"
    }
  }
}
```

### `sequence.enrolled`

A member entered a recovery sequence.

### When this fires

The sequence's trigger fired for a member of the project and nothing stood in the way. For `churned` that is `member.churned`: the member's last live membership ended, through its end date, a cancellation that ran out or the close of a failed-payment grace window. For `lead` it is `member.lead_created`; for `stalled_checkout` the hourly sweep's `checkout.stalled`; for `trial_ending` the hourly trial sweep, once a trial without a card is within the project's lead time of its end. The member is enrolled into every running sequence on that trigger, once each, provided the sequence has at least one step, the member holds nothing the trigger counts as a conversion (any live membership, or for `trial_ending` a paid one), they have not asked the project's sequences to stop, they are not already part-way through that sequence, and the project owner's plan includes sequences. `next_due_at` is the moment of the trigger plus the first step's delay; the step goes out on the first hourly sweep after it.

### Caveats

- A member who buys again before the first step is due never receives it: the sweep finds them holding a live membership and ends the passage as `sequence.converted` instead.
- A sequence switched off between the trigger and the first step lets the member go as `sequence.exited` with the reason `disabled`.

### Related events

- `member.churned`: the churn trigger.
- `sequence.step_sent`: the steps that follow.
- `sequence.converted`: how a passage ends well.
- `sequence.exited`: how a passage ends otherwise.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.enrolled",
  "created_at": "2026-10-25T08:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
    "trigger": "churned",
    "next_due_at": "2026-10-28T08:00:00+00:00"
  }
}
```

### `sequence.step_sent`

One step of a recovery sequence reached a member.

### When this fires

The hourly sweep found the step due and the member's connected account took the message: the creator's text with the placeholders filled for this member, the way back to the project as a button, and the step's coupon code in the text where the creator placed it. The message goes out as an announcement, so the member's channel choices and opt-outs apply. A platform that refuses for the moment (a rate limit, a passing fault, a misconfigured installation) fires nothing and the step stays due for the next hour; one that refuses for good, or a member with no account to reach, fires nothing and ends the passage as `sequence.exited` with the reason `opted_out`. After the last step the passage completes quietly: no event marks completion.

### Related events

- `sequence.enrolled`: the passage this step belongs to.
- `sequence.converted`: the member paid again after reading it.
- `coupon.redeemed`: the step's coupon used at checkout.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.step_sent",
  "created_at": "2026-10-28T08:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "step_id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
    "position": 1,
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "coupon_code": null,
    "sent_at": "2026-10-28T08:05:00+00:00"
  }
}
```

### `sequence.converted`

A member in a recovery sequence paid again.

### When this fires

A charge settled for the member in the project while they were part-way through one or more sequences, or the sweep found them holding a live membership again before a charge reached the ledger. Every open passage of theirs in the project ends as won back: the steps they received since enrolling are counted as converted by that payment, the creator is alerted, and this fires once per passage. The win is credited to the sequence whether or not the member used the coupon a step carried.

### Related events

- `payment.succeeded`: the charge behind it.
- `subscription.activated`: the membership the member bought back.
- `sequence.exited`: every other way a passage ends.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.converted",
  "created_at": "2026-11-01T17:20:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "payment_id": "f8e1c3a5-2d7b-4e96-b0c4-9a5d3f7e1b28",
    "converted_at": "2026-11-01T17:20:00+00:00"
  }
}
```

### `sequence.exited`

A member left a recovery sequence before its last step.

### When this fires

A passage ended for a reason other than the member paying again: the creator switched the sequence off (`disabled`) or deleted it (`deleted`), or the member could not be reached on any connected account and the platform refused for good (`opted_out`). It fires once per passage. A passage that ran through every step completes without an event, and one that ended because the member paid again fires `sequence.converted` instead.

### Related events

- `sequence.updated`: the switch-off behind a `disabled` exit.
- `sequence.deleted`: the deletion behind a `deleted` exit.
- `sequence.converted`: the one ending that is not an exit.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.exited",
  "created_at": "2026-11-02T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "reason": "disabled",
    "exited_at": "2026-11-02T14:10:00+00:00"
  }
}
```
