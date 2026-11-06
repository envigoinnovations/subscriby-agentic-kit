# Webhook events: Webhook Events, the `broadcast` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `broadcast`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `broadcast.queued` | `broadcast:send` | `audience`, `broadcast_id`, `expiring_within_days`, `parent_id`, `pass_window_id`, `plan_id`, `project_id`, `recipient_estimate` |
| `broadcast.completed` | `broadcast:send` | `audience`, `broadcast_id`, `expiring_within_days`, `failed`, `parent_id`, `pass_window_id`, `plan_id`, `project_id`, `sent` |

### `broadcast.queued`

A broadcast started sending, carrying the audience it resolved to and how many members it will reach.

### When this fires

A broadcast began sending. The audience has been resolved to a concrete set of recipients and the first message is on its way.

This fires for broadcasts started **anywhere**: the dashboard, the bot, the REST API, a Zap or an n8n workflow. The event is emitted by the sending job itself rather than by each entry point, so every route announces a broadcast identically.

> **This is the start, not the outcome.** Delivery runs at roughly 28 messages a second to stay inside the platform's rate limit, so a large broadcast is still sending long after this arrives. Subscribe to `broadcast.completed` for the tallies.

### Caveats

- `recipient_estimate` is the count **at the moment sending began**. Someone who joins mid-send is not included, and someone who blocks the bot mid-send is still counted here but will appear in `failed` on completion.
- A member is only a recipient if they have a linked chat **on that project's bot**. A member with no chat, or one attached to a different bot, is silently excluded, which is why the estimate can be far lower than the project's member count.
- The message body is **not** in the payload. Broadcasts are not persisted, and a body can be up to 4096 characters of arbitrary creator content; repeating it on every subscribed endpoint would leak it to integrations that only need to know a send happened.
- If the audience resolves to zero recipients this still fires, immediately followed by `broadcast.completed` with `sent: 0`.

### Related events

- `broadcast.completed`: the outcome, with sent and failed tallies.
- [Broadcasts](https://docs.subscriby.net/api/v1/reference/broadcasts): send one programmatically.

```json
{
  "id": "evt_01HX...",
  "type": "broadcast.queued",
  "created_at": "2026-09-01T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "broadcast_id": "0192f4a6-3c1e-7d2b-9a8f-4e5d6c7b8a90",
    "parent_id": null,
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "audience": "customer",
    "pass_window_id": null,
    "plan_id": null,
    "expiring_within_days": null,
    "recipient_estimate": 128
  }
}
```

### `broadcast.completed`

A broadcast finished sending, carrying the delivered and failed tallies.

### When this fires

Every recipient in a broadcast has been attempted and the send is over. The payload carries what actually happened.

> `sent` means **the platform accepted the message**, not that a human read it. There is no read receipt, and a delivered message sitting in a muted chat counts as sent.

### Reading the failure count

A steady trickle of failures is normal and not actionable: the overwhelming majority are members who blocked the bot or deleted their account on the platform. Those are permanent; the sender detects them and stops retrying that recipient rather than burning attempts.

What *is* worth alerting on is a sudden change in the ratio. `failed` climbing from ~2% to ~40% between two broadcasts usually means the bot's credentials were revoked or the bot was removed from the project's resources, not that forty percent of an audience left at once.

`sent + failed` can be lower than the `recipient_estimate` reported by `broadcast.queued`: a recipient with no chat row is skipped without counting as either.

### Caveats

- Fires once per broadcast, at the end. A broadcast the platform rate-limits heavily can take minutes to finish; there is no progress event in between.
- If the sending job is released and retried after a long rate-limit, the tallies count the **completed run** only.
- A broadcast aborted before sending (no connected bot, an unknown audience, an empty body after sanitisation, or an audience the plan no longer includes) emits neither this nor `broadcast.queued`. Nothing was sent, so nothing is announced. The REST API refuses those cases up front with a `422` rather than accepting a send that will never leave.

### Related events

- `broadcast.queued`: the start, with the recipient estimate.

```json
{
  "id": "evt_01HX...",
  "type": "broadcast.completed",
  "created_at": "2026-09-01T10:31:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "broadcast_id": "0192f4a6-3c1e-7d2b-9a8f-4e5d6c7b8a90",
    "parent_id": null,
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "audience": "customer",
    "pass_window_id": null,
    "plan_id": null,
    "expiring_within_days": null,
    "sent": 126,
    "failed": 2
  }
}
```
