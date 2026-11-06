# Webhook events: Members

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `member`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `member.lead_created` | `project-user:view` | `created_at`, `project_id`, `smart_link_id`, `source`, `subscriber_id` |
| `member.joined` | `project-user:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `member.trial_joined` | `project-user:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `member.converted` | `project-user:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `member.churned` | `project-user:view` | `ends_at`, `last_plan_id`, `plan_id`, `subscriber_id`, `subscription_id` |
| `member.removed` | `project-user:view` | `reason`, `subscriber` |
| `member.banned` | `project-user:view` | `reason`, `subscriber` |
| `member.unbanned` | `project-user:view` | `subscriber` |
| `member.kicked` | `project-user:view` | `reason`, `subscriber` |
| `member.resource_added` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.resource_pending` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.resource_reissued` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.access_extended` | `project-user:view` | `applies_at`, `banked_seconds`, `connector`, `ends_at`, `extended_seconds`, `outage_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `member.resource_removed` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.identity_linked` | `project-user:view` | `connector`, `display_name`, `external_id`, `identity_id`, `preferred`, `source`, `subscriber_id` |
| `member.identity_unlinked` | `project-user:view` | `connector`, `external_id`, `identity_id`, `subscriber_id` |

### `member.lead_created`

A member row was created as a lead.

### When this fires

Somebody the project had never seen opened its bot, arrived through a Smart Link or a referral link, signed in to its portal or wrote to its support, and a member row was created for them with the status `lead`. It fires once per row, whichever door they came through, the moment the row is written; it never fires for a connected account adopted from a sibling project or linked by a backfill, because nobody just walked in. The lead sequences of Lead nurture enrol the member on the same event.

### Caveats

- The payload carries no name and no connected account. Resolve the member with [the member endpoint](https://docs.subscriby.net/api/v1/reference/members) using `data.subscriber_id`.
- A lead who buys later raises `subscription.activated` (a paid checkout) or `subscription.created` (an access code or a cardless trial) with the same `subscriber_id`; a lead who leaves without buying raises nothing more.

### Related events

- `sequence.enrolled`: the lead sequences the arrival enrols the member in, with `trigger` `lead`.
- `subscription.activated`: the paid-checkout join signal.

```json
{
  "id": "evt_01HX...",
  "type": "member.lead_created",
  "created_at": "2026-10-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "source": "bot",
    "smart_link_id": "a0c3e8d1-5f27-4b9e-8c64-3d1f2a7b6e95",
    "created_at": "2026-10-20T10:05:00+00:00"
  }
}
```

### `member.joined`

A subscriber joins by redeeming an access code against a paid plan.

### When this fires

A subscriber redeems an access code against a plan with no trial window, gaining access to the project.

That is the only path that emits this event. A card, wallet, or crypto checkout emits `subscription.activated` and `payment.succeeded`, but no `member.*` join event at all. If the redeemed plan carries a trial, `member.trial_joined` fires instead of this event.

> This event is **access-code-only**. Paid checkouts do not emit it. For a paying audience, use `subscription.activated` as the join signal.

### Caveats

- The payload does not carry the subscriber's connected accounts. Resolve them with [the member endpoint](https://docs.subscriby.net/api/v1/reference/members) using `data.subscriber_id`, which embeds `identities`, one row per connected account with the connector key and the platform's own id.
- Resource-level grants emit separate `member.resource_added` events as the dispatcher processes each invite.
- This event always accompanies `subscription.created` and `access_code.redeemed` for the same subscription.

### Related events

- `subscription.activated`: the paid-checkout join signal.
- `subscription.created`: fires alongside on this path.
- `member.trial_joined`: trial counterpart.

```json
{
  "id": "evt_01HX...",
  "type": "member.joined",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "access_code": "SLATE-SUNDAY-4F2A9"
  }
}
```

### `member.trial_joined`

A subscriber joins on a trial via cardless trial or access-code redemption.

### When this fires

Two paths emit this event:

- **Cardless trial start**: a subscriber begins a trial that took no payment method.
- **Access-code redemption on a trial plan**: the redeemed plan sets `trial_ends_at`, so this fires in place of `member.joined`.

A Stripe checkout that begins with a trial window emits `subscription.activated` and `subscription.trial_started`, but no `member.*` join event. Like `member.joined`, this event covers zero-payment acquisition only.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

### Caveats

- A trial-joined member emits `member.converted` if the trial converts to paid, or rolls into `member.churned` once the trial expires without converting.
- `member.converted` is currently emitted for **Stripe only**. Trials taken through other providers will not produce a conversion event.
- `subscription.created` and `subscription.trial_started` fire alongside this event on both paths.

### Related events

- `subscription.trial_started`: fires alongside.
- `member.converted`: fires on successful trial conversion (Stripe only).
- `member.joined`: non-trial counterpart.


### `member.converted`

A trial converts to a paying subscription.

### When this fires

A trial subscription successfully converts to a paying subscription: the subscription reaches `active` while the subscriber was previously in `trialing` status. Fires exactly once per conversion.

This event is currently emitted for **Stripe only**. Trials taken through PayPal, Paystack, Razorpay, Skrill, CeyPay, or CoinPayments do not produce a conversion event; detect those by watching `payment.succeeded` against a subscription you know began in trial.

### Caveats

- Pairs with `payment.succeeded` for the converting charge. `subscription.activated` does **not** fire at conversion; it already fired when the trialing subscription was first created.
- A subscriber who churns and starts a new trial later does not re-emit `member.converted` for the prior trial; each trial-conversion is its own bounded event.

### Related events

- `member.trial_joined`: predecessor.
- `subscription.activated`: fired earlier, when the trialing subscription was created; it does not repeat at conversion.

```json
{
  "id": "evt_01HX...",
  "type": "member.converted",
  "created_at": "2026-05-25T10:05:00Z",
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

### `member.churned`

A subscriber's last active subscription lapsed.

### When this fires

A subscriber's last subscription is expired (by the five-minute expiry sweep, by a refund that ends access, or by a cancelled pass window) and no other subscription of theirs is still active. A cancellation or a failed payment does not churn the member on its own; churn follows only once the subscription is actually expired.

### Caveats

- A subscriber with multiple overlapping subscriptions does not churn until the last one ends.
- `member.churned` does not delete the subscriber row; if they re-subscribe later, a paid checkout emits `subscription.activated` and an access-code redemption emits `member.joined`.

### Related events

- `subscription.expired`: typical predecessor.
- `member.joined`: only if they return via an access code.

```json
{
  "id": "evt_01HX...",
  "type": "member.churned",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "last_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `member.removed`

A subscriber is soft-deleted manually.

### When this fires

A creator manually removes a subscriber from the project. The subscriber is soft-deleted, their access is revoked, and any active subscription is cancelled.

### Caveats

- Distinct from a ban: removed subscribers can rejoin, banned subscribers cannot. See `member.banned`.
- Distinct from a kick, which moves the subscriber to churned without soft-deleting the row. See `member.kicked`.

### Related events

- `member.banned`, `member.kicked`: alternative discipline events.
- `subscription.cancelled`: fires alongside if there was an active subscription.

```json
{
  "id": "evt_01HX...",
  "type": "member.removed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "customer"
    },
    "reason": "creator_manual"
  }
}
```

### `member.banned`

A creator bans a subscriber.

### When this fires

A creator bans a subscriber. Their access is revoked, the connector removes them from all linked resources, and they cannot re-join the project until the ban is lifted.

### Caveats

- Bans persist across subscription cycles until explicitly lifted via `member.unbanned`.
- Active subscriptions are cancelled in the same flow; expect `subscription.cancelled`.

### Related events

- `member.unbanned`: paired transition.
- `member.kicked`: softer discipline.

```json
{
  "id": "evt_01HX...",
  "type": "member.banned",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "banned"
    },
    "reason": "spam"
  }
}
```

### `member.unbanned`

A ban is lifted; the subscriber returns to churned status.

### When this fires

A creator lifts a previously applied ban. The subscriber returns to a churned state: they can re-subscribe, but they do not automatically regain access to past subscriptions.

### Caveats

- Unbanning does not restore prior subscriptions; the subscriber must purchase a new one to regain access.
- A subsequent purchase fires `subscription.activated`; only an access-code redemption fires `member.joined`.

### Related events

- `member.banned`: paired transition.
- `subscription.activated`: fires if the subscriber repurchases.

```json
{
  "id": "evt_01HX...",
  "type": "member.unbanned",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "churned"
    }
  }
}
```

### `member.kicked`

A subscriber is kicked from the project without a ban.

### When this fires

A creator kicks a subscriber without banning them. The member's status moves to churned, every active subscription is cancelled, and the connector evicts them from every resource they held. The only difference from a ban is that a kick can be reversed by re-subscribing, whereas a ban blocks re-entry until it is lifted.

### Caveats

- A kick evicts the member from every resource their subscriptions granted; expect one `member.resource_removed` per resource.
- Every active subscription is cancelled in the same flow; expect `subscription.cancelled` for each.

### Related events

- `member.banned`: escalation path.
- `member.resource_removed`: paired resource event.

```json
{
  "id": "evt_01HX...",
  "type": "member.kicked",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "churned"
    },
    "reason": "off_topic"
  }
}
```

### `member.resource_added`

A subscriber gains access to a specific resource.

### When this fires

Subscriby asks the resource's connector to give a subscriber access to one of the resources their subscription grants (on a connector that grants by link, a join-request invite link named after them) and writes the grant to the access ledger. Each resource grant emits its own event. The event marks the grant, not the subscriber's arrival: they may not have opened the link yet; the ledger row named by `grant_id` moves from `pending` to `granted` when they do. A manual perk arrives here too, once the creator completes its task (`creator_task.completed` precedes it).

### Caveats

- Ordering against the join event is not guaranteed: the dispatcher is queued before `member.joined` is emitted on the access-code path, and paid joins emit no `member.*` join event at all. Treat resource events as independent.
- A manual perk emits this event only when its creator task is completed, never at purchase; until then the member's grant is `pending` and `creator_task.opened` is what fired.

### Related events

- `member.resource_removed`: paired transition.
- `member.resource_pending`: the earlier event for the same `grant_id` when the place waited for an account the member had not connected; this one follows the moment they connect it, so a workflow pairs the two on `grant_id`.
- `member.joined`, `member.trial_joined`: typical predecessors.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_added",
  "created_at": "2026-05-18T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.resource_pending`

A subscriber is entitled to a resource but has no account on its connector yet, so access waits for them to connect one.

### When this fires

A purchase entitles a subscriber to a resource on a connector where the subscriber has no connected account: a member who bought on the portal with only an email, or a plan that spans a connector the member has not linked. Nothing can be issued, so the access ledger records a grant in state `pending_identity` and this event says so. The moment the member connects an account on that connector (from the portal, by signing in through the connector, or by adopting an account from a sibling project), the grant is issued and `member.resource_added` follows with the same `grant_id`.

### Caveats

- One event per resource the purchase entitles the member to on that connector; a plan with three channels raises three, all waiting on the same account.
- The member sees the waiting place on the receipt, the membership page and the access screen of the bot they did connect, each with the door that connects the account, and a day after the purchase (or a day before the pass window it belongs to opens) they are reminded once, by mail and in that chat, with the door. A creator presses **Remind to connect** in the member's flyout; an integration sends the same nudge with `POST /v1/subscriptions/{subscription}/remind-connection`, lists everyone waiting with `GET /v1/projects/{project}/members?access=waiting`, and a broadcast reaches them as the `waiting_on_connection` audience. None of these raise an event; the next event for the grant is `member.resource_added`.
- A subscription that ends before the account is connected leaves the grant `pending_identity` in the ledger; no `member.resource_removed` is raised for access that was never given.

### Related events

- `member.resource_added`: raised for the same `grant_id` once the account is connected and access is issued.
- `member.identity_linked`: the act that releases the pending grants.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_pending",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.resource_reissued`

A subscriber's access to a resource is being reissued: the old grant is revoked and a fresh one follows.

### When this fires

A creator (over the API, an MCP agent, or the members page) asks for a subscriber's access to be reissued: the grant the subscriber held on a resource is revoked (on a connector that grants by link, the personal invite link dies) and the dispatcher that grants at purchase runs again to issue a fresh one. Each resource emits its own event, and `member.resource_added` follows for the new grant. The member's own **Refresh invite links** in the bot does the same and raises the same event.

### Caveats

- Revoking the old grant is best effort: a link the platform no longer knows is treated as already gone, and the reissue goes ahead regardless.
- The member is messaged the fresh links by the bot when it can reach them, so do not follow this event with a nudge of your own.

### Related events

- `member.resource_added`: the fresh grant, moments later.
- `member.resource_removed`: access taken away without a replacement.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_reissued",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.access_extended`

Outage Compensation banked the length of a connector outage on a member's purchase: one event per member, saying when they feel the extra time.

### When this fires

A [connector outage](https://docs.subscriby.net/disaster-recovery/connector-outages) that lasted an hour or more ended because the connector recovered or was replaced, and the project's **Outage Compensation** setting is on. Every purchase that grants access right now and unlocks a place on that connector has the outage's length banked, and this event fires once for each of them.

`applies_at` says when the member feels it:

- `now`: a one-time or lifetime-style purchase with a fixed end. `ends_at` has already moved later by `extended_seconds`.
- `membership_end`: a recurring plan. No gateway lets a renewal move by a few hours, so the time is banked instead: the member's access always runs `banked_seconds` past the period they last paid for, and they receive the time when the membership ends, whether they cancel, lapse or a renewal fails. Their renewal date and charges do not change.

`banked_seconds` is the purchase's running total across every outage it lived through; `extended_seconds` is what this outage added. The member is told in the chat their connector binds to them and by email; the same fact shows on their portal card and in the bot.

### Caveats

- Passes and series are never extended: a dated window cannot move, so no event fires for them.
- Perk-only plans are not affected by an outage and receive nothing.
- A project that switched **Outage Compensation** off, an outage shorter than an hour, or one that ended with an uninstall, fires no `member.access_extended` at all; `connector.outage_compensated` still fires with `members_extended: 0`.

### Related events

- `connector.outage_compensated`: the one-line settlement summary that follows these.
- `connector.outage_closed`: the outage this compensates.

```json
{
  "id": "evt_01HX...",
  "type": "member.access_extended",
  "created_at": "2026-09-13T13:21:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "applies_at": "membership_end",
    "banked_seconds": 11700,
    "connector": "telegram",
    "ends_at": "2026-10-13T13:20:00Z",
    "extended_seconds": 11700,
    "outage_id": "9c1e4d2a-7b3f-4e8a-a2d1-5f6b7c8d9e0f",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4"
  }
}
```

### `member.resource_removed`

A subscriber loses access to a specific resource.

### When this fires

A subscriber is evicted from a specific resource: after a subscription expires or is cancelled, after a ban, kick or removal, or when a pass window closes or is cancelled. Each resource revocation emits its own event. Nothing is emitted when another still-active subscription of theirs grants the same resource: the invite link is revoked but the member stays in.

### Caveats

- Multiple revocations for the same subscriber typically arrive in close succession when a subscription expires; use `SB-Event-Id` for dedupe.
- A manual perk emits this event only when its grant is revoked on the ledger; a place a connector gates emits it once the connector has been asked to remove the member.

### Related events

- `member.resource_added`: paired transition.
- `subscription.expired`, `subscription.cancelled`, `member.kicked`: typical triggers.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_removed",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.identity_linked`

A subscriber connects a platform account to their membership.

### When this fires

A member of the project gains a connected account on a connector: the platform account that signs them in to the portal and that the project's bot knows them by. Three doors raise it: the member completes **Connect …** from the portal's Account & Recovery screen and the project's bot confirms the account; the member signs in to the portal through a connector the project had not seen them on before; or the member taps **Use the same account** to adopt an account they already use in another of the creator's projects. Each connected account emits its own event. Nothing is emitted when an account the member already holds is confirmed again.

### Caveats

- `identity_id` is the account row, not the link: the same value appears in `member.identity_unlinked` and in the `identities` of [the member endpoint](https://docs.subscriby.net/api/v1/reference/members). The link's own `id` (what the disconnect endpoint takes) is only in the REST payloads.
- Accounts the bot creates on first contact are mirrored into the identity tables without raising this event; it is reserved for acts the member takes.

### Related events

- `member.identity_unlinked`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "member.identity_linked",
  "created_at": "2026-09-12T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "identity_id": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90",
    "connector": "telegram",
    "external_id": "123456789",
    "display_name": "Ada Lovelace",
    "source": "handshake",
    "preferred": true
  }
}
```

### `member.identity_unlinked`

A subscriber's connected platform account is disconnected from their membership.

### When this fires

A connected account is removed from a member: by the member on the portal's Account & Recovery screen (**Disconnect**), or by the creator over [the disconnect endpoint](https://docs.subscriby.net/api/v1/reference/members) or the `unlink_member_identity` MCP tool. The account stops signing the member in to the portal and the project's bot stops knowing them by it. Nothing is emitted when the removal is refused because the account was the member's last way to sign in.

### Caveats

- The member keeps their subscriptions and grants; only the way they sign in and are reached changes. A member with no connected account left is reached by email.
- The event does not say who asked. Read the activity log for the actor when it matters.

### Related events

- `member.identity_linked`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "member.identity_unlinked",
  "created_at": "2026-09-12T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "identity_id": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90",
    "connector": "telegram",
    "external_id": "123456789"
  }
}
```

## Family `creator_task`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `creator_task.opened` | `project-subscription:view` | `due_at`, `grant_id`, `instructions`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id`, `task_id` |
| `creator_task.completed` | `project-subscription:view` | `completed_at`, `completed_by_user_id`, `grant_id`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id`, `task_id` |

### `creator_task.opened`

A purchase entitles a subscriber to a manual perk, so the creator has something to do by hand.

### When this fires

A subscription becomes active (or a pass window opens) on a plan that includes a **manual** resource: a perk no connector can give, which the creator hands over themselves. The access ledger records a `creator_task` grant in state `pending` and opens a task naming the member and the perk; this event carries that task. One event per manual resource the purchase entitles the member to. Nothing is sent to the member by a bot for a manual perk; the portal shows the perk as arranged by the organiser.

### Caveats

- A task is opened once per purchase, resource and window; a retry of the granting job does not open a second one.
- A purchase that ends before the task is done revokes the grant; the task then drops out of the open list without a `creator_task.completed`.

### Related events

- `creator_task.completed`: the task is done and the grant issued.
- `member.resource_added`: raised for the same `grant_id` on completion.

```json
{
  "id": "evt_01HX...",
  "type": "creator_task.opened",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "task_id": "9e4b2c71-3d58-4a6f-b0e2-7c1d5f8a9b34",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "manual",
    "instructions": "Give Ada Lovelace access to Welcome packet.",
    "due_at": null
  }
}
```

### `creator_task.completed`

The creator marked a manual perk as handed over; the grant is issued.

### When this fires

The creator (or a teammate, an integration or an agent on their behalf) marks a creator task done: on the members page, through [the complete endpoint](https://docs.subscriby.net/api/v1/reference/creator-tasks) or the MCP tool [`complete_creator_task`](https://docs.subscriby.net/mcp/v1/tools/creator-task/complete-creator-task). The access ledger row moves from `pending` to `granted`, this event says who did it, and `member.resource_added` follows for the same `grant_id` with mode `creator_task`.

### Caveats

- Completing a task is not idempotent over the API: a second call for a completed task answers `422 VALIDATION_FAILED`.
- The member is not messaged by a bot on completion; tell them yourself, or let the portal show the perk as delivered.

### Related events

- `creator_task.opened`: the task being done.
- `member.resource_added`: raised for the same grant on completion.

```json
{
  "id": "evt_01HX...",
  "type": "creator_task.completed",
  "created_at": "2026-09-12T10:35:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "task_id": "9e4b2c71-3d58-4a6f-b0e2-7c1d5f8a9b34",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "manual",
    "completed_at": "2026-09-12T10:35:00Z",
    "completed_by_user_id": "0a7d3c1e-5b28-4f96-a3e1-6d9c2b8f4e10"
  }
}
```
