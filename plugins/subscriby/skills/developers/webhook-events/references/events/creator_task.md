# Webhook events: Webhook Events, the `creator_task` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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
