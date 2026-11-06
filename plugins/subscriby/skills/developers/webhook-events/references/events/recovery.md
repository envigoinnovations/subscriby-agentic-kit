# Webhook events: Webhook Events, the `recovery` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `recovery`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `recovery.incident_opened` | `project-recovery:view` | `connector`, `detected_at`, `incident_id`, `kind`, `project_id`, `reason`, `resource_id` |
| `recovery.incident_resolved` | `project-recovery:view` | `connector`, `incident_id`, `kind`, `project_id`, `resolved_at`, `resolved_by_operation_id`, `resource_id` |
| `recovery.operation_started` | `project-recovery:view` | `automatic`, `connector`, `kind`, `on_demand`, `operation_id`, `project_id`, `started_at` |
| `recovery.operation_completed` | `project-recovery:view` | `automatic`, `completed_at`, `connector`, `kind`, `on_demand`, `operation_id`, `project_id`, `revert_window_ends_at`, `started_at` |
| `recovery.operation_failed` | `project-recovery:view` | `automatic`, `connector`, `failure_reason`, `kind`, `on_demand`, `operation_id`, `project_id`, `started_at` |
| `recovery.operation_reverted` | `project-recovery:view` | `connector`, `kind`, `operation_id`, `project_id`, `resource_id`, `reverted_at` |
| `recovery.standby_registered` | `project-recovery:view` | `connector`, `mirror`, `project_id`, `resource_id`, `standby` |
| `recovery.standby_removed` | `project-recovery:view` | `connector`, `project_id`, `reason`, `resource_id`, `standby` |
| `recovery.installation_failed_over` | `project-recovery:view` | `connector`, `installation_id`, `members_emailed`, `operation_id`, `project_id`, `replaced_at` |
| `recovery.resource_failed_over` | `project-recovery:view` | `connector`, `operation_id`, `project_id`, `replaced_at`, `resource_id`, `resource_title` |
| `recovery.resource_replaced` | `project-recovery:view` | `connector`, `on_demand`, `operation_id`, `project_id`, `replaced_at`, `resource_id`, `resource_title` |
| `recovery.identity_relinked` | `project-recovery:view` | `completed_at`, `connector`, `display_name`, `from_backup`, `identity_id`, `operation_id`, `started_at` |
| `recovery.readiness_changed` | `project-recovery:view` | `changed`, `complete`, `completed`, `items`, `total` |

### `recovery.incident_opened`

A health probe found the creator's sign-in account unreachable, a project's bot refused by the platform, or a channel or group gone or no longer administered.

### When this fires

The hourly probes check every bot, every channel and group a project sells, and the creator's own sign-in account. When one comes back banned, deleted, or stripped of the rights the bot needs, an **incident** opens in the recovery ledger and this event fires, once. A probe that finds the same broken thing on its next run reopens nothing and fires nothing; the incident stays open until it resolves. Undoing an account relink also opens an account incident (`reason: relink_disputed`) so support reviews the dispute.

### Caveats

- One event per incident. The ledger opens one incident per subject and keeps it open, so a subject that stays broken for a week fires this once, not hourly.
- A restriction the platform reports as "still reachable" opens nothing: only a verdict that warrants a replacement counts. See [How detection works](https://docs.subscriby.net/disaster-recovery/how-detection-works).

### Related events

- `recovery.incident_resolved`: the same incident healing or being fixed.
- `project.resource.status_changed`: the health verdict that precedes a resources incident.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.incident_opened",
  "created_at": "2026-09-12T03:19:04Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "incident_id": "6f1e9b27-4c3a-4d58-9e02-b7a1c5d38f64",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "reason": "chat_not_found",
    "detected_at": "2026-09-12T03:19:04Z"
  }
}
```

### `recovery.incident_resolved`

An open incident closed: a later probe found the thing healthy again, or a recovery replaced it.

### When this fires

An incident resolves in one of two ways: a later probe finds the account, bot or channel healthy again (the creator gave the bot its rights back, the platform lifted a restriction), or a recovery replaced the broken thing, in which case `resolved_by_operation_id` names it. Either way the incident row is marked resolved and this event fires once.

### Caveats

- A bot relink resolves every open bot incident the project had, whichever bot row each named: expect one event per incident.
- Resolution says the ledger no longer sees a problem; it does not say members have been re-admitted. Follow `recovery.operation_completed` and the roll call for that.

### Related events

- `recovery.incident_opened`: how the incident began.
- `recovery.operation_completed`: the recovery `resolved_by_operation_id` names.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.incident_resolved",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "incident_id": "6f1e9b27-4c3a-4d58-9e02-b7a1c5d38f64",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resolved_at": "2026-09-12T03:19:42Z",
    "resolved_by_operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21"
  }
}
```

### `recovery.operation_started`

A recovery began: run by the creator, by the platform on their behalf, or on demand for a healthy resource.

### When this fires

The moment a recovery is opened in the ledger: an account relink or a switch to the backup account, a bot replacement, or a channel swap. The row exists from this moment because it is the quota ledger too: the allowance is spent here, and given back only if the recovery fails before changing anything.

A channel recovery absorbs every swap made inside its grace period into one operation, so a second channel swapped an hour after the first fires no second start; it fires `recovery.resource_replaced` under the same `operation_id`.

### Caveats

- Once per operation. Swaps absorbed into a running channel recovery fire no second start.
- A recovery refused before the ledger row is written (quota spent, not the owner, plan lacks the feature) fires nothing.

### Related events

- `recovery.operation_completed`, `recovery.operation_failed`: how it ends.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_started",
  "created_at": "2026-09-12T03:19:10Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": true,
    "on_demand": false,
    "started_at": "2026-09-12T03:19:10Z"
  }
}
```

### `recovery.operation_completed`

A recovery finished and its changes stand; when it can be undone, the window is open from now.

### When this fires

When the recovery's changes are in place: the creator signs in with the new account, the project's bot answers under the new token, the resource points at its replacement and re-admission has been queued. For a channel recovery this fires once, when the first swap completes; later swaps absorbed into the same operation fire `recovery.resource_replaced` only.

### Caveats

- Completion means the changes stand, not that every member is back in. Read the roll call at [the roll call endpoint](https://docs.subscriby.net/api/v1/reference/disaster-recovery) for that.
- The creator also receives the recovery report by email a few minutes later, once the first re-admissions have landed.

### Related events

- `recovery.operation_reverted`: the creator undid it inside the window.
- `recovery.resource_failed_over`, `recovery.resource_replaced`, `recovery.identity_relinked`: what the recovery did.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_completed",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": true,
    "on_demand": false,
    "started_at": "2026-09-12T03:19:10Z",
    "completed_at": "2026-09-12T03:19:42Z",
    "revert_window_ends_at": "2026-09-13T03:19:42Z"
  }
}
```

### `recovery.operation_failed`

A recovery failed before changing anything; the allowance it spent is given back.

### When this fires

The recovery was opened in the ledger and then could not be carried out: the connector refused the new bot's credentials, the replacement chat could not be bound, the new account could not be linked. Nothing changed, so the operation is marked failed and its use of the rolling allowance is given back. The creator sees the refusal on the page that ran it; this event tells your systems.

### Caveats

- A swap that fails while a channel recovery is already absorbing swaps leaves that recovery standing: failing it would erase a swap that did happen. Only a recovery that failed on its first swap fires this.

### Related events

- `recovery.operation_started`: how it began.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_failed",
  "created_at": "2026-09-12T09:41:07Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "c2e8f1a9-6d47-4b3e-9f05-1a8d7c2e4b60",
    "kind": "bot",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": false,
    "on_demand": false,
    "started_at": "2026-09-12T09:41:05Z",
    "failure_reason": "The platform refused the token."
  }
}
```

### `recovery.operation_reverted`

The creator undid a recovery inside its window: a swapped channel put back, or the previous sign-in account restored.

### When this fires

Inside the undo window the creator can put a swapped resource back onto its old chat, or move their sign-in back to the previous account. A channel recovery is undone one swap at a time, so this fires once per resource put back, with `resource_id`; the operation itself is marked reverted when its last standing swap is undone. An account relink is undone whole, in one event with `resource_id: null`, and opens an account incident (`relink_disputed`) so support reviews it.

### Caveats

- Undoing a swap re-admits every active member into the old chat again; expect a second round of `member.resource_*` events for the same members.
- The undo window is 24 hours from completion by default; an attempt after it is refused and fires nothing.

### Related events

- `recovery.operation_completed`: the recovery being undone.
- `recovery.incident_opened`: the disputed-relink incident an account undo opens.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_reverted",
  "created_at": "2026-09-12T21:50:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "reverted_at": "2026-09-12T21:50:00Z"
  }
}
```

### `recovery.standby_registered`

A spare bot is kept ready for a project, or a spare channel or group is kept ready for one resource.

### When this fires

Active Disaster Prevention keeps two kinds of standby: a **standby bot** per project (a second token, stored without a webhook and probed like any bot) and a **standby chat** per resource (a spare channel or group the bot already administers, optionally mirrored). Registering either fires this event. Registering a new standby bot where one already existed also fires `recovery.standby_removed` with `reason: replaced` for the old one.

### Caveats

- The standby's own identifiers on the platform (the bot's token, the chat's id) are never in the payload.
- Turning the mirror on or off later fires nothing; read the standby's state from the Prevention page.

### Related events

- `recovery.standby_removed`: the standby removed, replaced or used.
- `recovery.resource_failed_over`: the standby chat doing its job.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.standby_registered",
  "created_at": "2026-09-01T14:22:09Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "standby": "resource",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "connector": "telegram",
    "mirror": true
  }
}
```

### `recovery.standby_removed`

A standby is no longer kept: the creator removed it, registered another in its place, or a recovery consumed it.

### When this fires

A standby bot or standby chat leaves the reserve. `reason` says why: `removed` when the creator took it away, `replaced` when a new standby bot took the slot, `used` when a recovery consumed it (a bot relink from the standby, a one-click Swap & Grant onto the standby chat, or an automatic failover).

### Caveats

- A standby consumed by a recovery fires this beside the recovery's own events (`recovery.resource_failed_over` or `recovery.resource_replaced`, or the bot recovery's `recovery.operation_completed`); use `reason: used` to tell it from a deliberate removal.
- The readiness checklist counts standbys, so a `removed` or `used` standby lowers the score until a new one is registered.

### Related events

- `recovery.standby_registered`: the standby being kept.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.standby_removed",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "standby": "resource",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "connector": "telegram",
    "reason": "used"
  }
}
```

### `recovery.installation_failed_over`

Automatic failover switched a project onto its standby bot without the creator, because the platform refused the live one: the bot-side twin of `recovery.resource_failed_over`.

### When this fires

A probe finds the platform refusing a project's live installation outright (the token revoked or regenerated, the bot deleted), the project has **Automatic Failover** switched on, a standby bot is registered and its last probe found it healthy, and the Project Bot allowance permits: the platform writes the standby's credentials into the project's installation, resolves the incident, closes the [connector outage](https://docs.subscriby.net/disaster-recovery/connector-outages) as `replaced`, and emails every member reachable by email their new link on the creator's behalf, at the per-email fee accepted when the switch was armed. This event fires the moment the switch completes; it sits under a recovery whose `recovery.operation_started` carries `automatic: true`, and the Project Bot allowance is spent exactly as by a manual relink.

> The switch cannot be undone from the dashboard: the refused bot is gone as far as the platform is concerned. The standby slot is empty afterwards, so the creator is asked to register a new standby bot.

### Caveats

- Fires only for a platform-caused refusal. A rate limit or a passing API error marks the installation degraded but never triggers a failover.
- When a condition fails (plan lapsed, no healthy standby, allowance spent, or the switch refused), nothing fires here; the creator receives *Automatic failover did not run for <project>'s bot* by email and on their connected account, and the incident stays open.

### Related events

- `recovery.resource_failed_over`: the channel-side twin.
- `recovery.operation_started` / `recovery.operation_completed`: the recovery around the switch.
- `connector.outage_closed`: the outage this switch ends as `replaced`.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.installation_failed_over",
  "created_at": "2026-09-14T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "members_emailed": 214,
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "replaced_at": "2026-09-14T03:19:41Z"
  }
}
```

### `recovery.resource_failed_over`

Automatic failover swapped a banned channel or group for its standby without the creator: the failover you sleep through.

### When this fires

A probe finds a channel gone or the bot removed from it, the project has **Automatic Failover** switched on, a healthy standby is linked, and the allowance permits: the platform points the resource at its standby, revokes the old links and queues every active member's re-admission, all without the creator. This event fires the moment the resource points at the standby; it sits under a recovery whose `recovery.operation_started` carries `automatic: true`.

> **Members the bot cannot reach.** A failover emails the members the bot can no longer message, at a per-email fee the creator accepted when switching failover on. The roll call's `emailed` counter says how many.

### Caveats

- The standby that was consumed fires `recovery.standby_removed` with `reason: used` beside this event.
- `project.resource.updated` also fires for the same resource with `changes.space_id`, as it does for any swap.

### Related events

- `recovery.resource_replaced`: the same swap made by the creator.
- `recovery.operation_reverted`: the creator put the old chat back.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.resource_failed_over",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_title": "Lounge",
    "connector": "telegram",
    "replaced_at": "2026-09-12T03:19:41Z"
  }
}
```

### `recovery.resource_replaced`

The creator pointed a resource at a replacement channel or group: in a recovery after a ban, or on demand for a healthy resource.

### When this fires

The creator swaps a resource onto another chat: a replacement channel after a ban, the standby in one click, or a healthy resource moved to a new supergroup on demand (**Swap & Grant**, which spends no allowance). The resource is re-pointed, the old links revoked and every active member's re-admission queued. One event per resource swapped, each under the `operation_id` of the recovery absorbing it.

### Caveats

- A swap onto the standby chat also fires `recovery.standby_removed` with `reason: used`.
- `project.resource.updated` fires for the same resource with `changes.space_id`, as it does for any swap.

### Related events

- `recovery.resource_failed_over`: the same swap made by the platform.
- `recovery.operation_reverted`: the swap put back inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.resource_replaced",
  "created_at": "2026-06-20T18:04:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "d4b7a2c9-1e58-4f36-8a0d-6c2e9b7f1a45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_title": "Members",
    "connector": "telegram",
    "replaced_at": "2026-06-20T18:04:11Z",
    "on_demand": true
  }
}
```

### `recovery.identity_relinked`

The creator's sign-in account moved to another account on the connector: a newly detected one, or the backup switched in.

### When this fires

After a ban on the creator's own account, recovery moves their Subscriby identity to another account on the connector: one they prove control of through a handshake, or the backup account they registered ahead of time (`from_backup: true`). Sign-in and alerts follow the new account at once; the previous one becomes the backup when a backup was switched in. This is an account-level event: `project_id` is null and it reaches the endpoints of the team the creator owns.

### Caveats

- The platform's own account identifiers (numeric ids, usernames) are deliberately absent; `identity_id` is the neutral id the rest of the API uses.
- Every browser session of the creator is signed out by the relink. The undo, inside 24 hours, fires `recovery.operation_reverted` and opens a `relink_disputed` incident.

### Related events

- `recovery.operation_completed`: the same recovery, as an operation.
- `recovery.operation_reverted`: the relink undone.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.identity_relinked",
  "created_at": "2026-08-01T11:12:30Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "operation_id": "e7c3d9a1-2f64-4b08-9d5e-4a1b8c6f2d73",
    "connector": "telegram",
    "identity_id": "3c9e1f7a-8b25-4d60-a1f4-7e2c5b9d0a18",
    "display_name": "Ada (new)",
    "from_backup": false,
    "started_at": "2026-08-01T11:12:29Z",
    "completed_at": "2026-08-01T11:12:30Z"
  }
}
```

### `recovery.readiness_changed`

A line of the Disaster Recovery readiness checklist changed state, and here is the whole checklist as it stands now.

### When this fires

The readiness checklist is what a creator has in place before anything happens: a second factor on the account, a backup sign-in account, and, per connector, the standbys, mirrors and automatic failover the platform can verify. Subscriby records the checklist's state after every event that could move a line (a standby registered or removed, a resource failed over or replaced, an account relinked, a connector installed, connected, disconnected or uninstalled) and once a night for the things that fire no event (a second factor, a passkey, a plan change). When the state differs from the last one recorded, this event fires with the checklist as it stands. Recording the same state twice fires nothing. Readiness is the creator's, not one project's, so the envelope `project_id` is null.

### Caveats

- The first checklist ever recorded for a creator fires nothing: there is no earlier state to differ from.
- Reminders (a copy of the content elsewhere, a second human administrator) never appear here; they cannot be verified.
- The labels, descriptions and fix links of each line are not in the payload; read them from [the readiness endpoint](https://docs.subscriby.net/api/v1/reference/disaster-recovery).

### Related events

- `recovery.standby_registered`: one of the changes that leads here.
- `recovery.standby_removed`: another.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.readiness_changed",
  "created_at": "2026-09-01T14:22:09Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "completed": 4,
    "total": 6,
    "complete": false,
    "items": [
      {
        "key": "second_factor",
        "connector": null,
        "done": true,
        "locked": false
      },
      {
        "key": "backup_identity",
        "connector": null,
        "done": true,
        "locked": false
      },
      {
        "key": "standby_installation",
        "connector": "telegram",
        "done": true,
        "locked": false
      },
      {
        "key": "standby_spaces",
        "connector": "telegram",
        "done": false,
        "locked": false
      },
      {
        "key": "auto_failover",
        "connector": "telegram",
        "done": true,
        "locked": false
      },
      {
        "key": "live_mirror",
        "connector": "telegram",
        "done": false,
        "locked": false
      }
    ],
    "changed": [
      "telegram:standby_spaces",
      "telegram:live_mirror"
    ]
  }
}
```
