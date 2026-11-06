# Webhook events: Webhook Events, the `role` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `role`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `role.created` | `role:view` | `code`, `name`, `role_id`, `team_id` |
| `role.updated` | `role:view` | `code`, `name`, `role_id`, `team_id` |
| `role.deleted` | `role:view` | `code`, `role_id`, `team_id` |

### `role.created`

A new role is created within a team.

### When this fires

Any member of the team (or a token carrying `role:create`) creates a new role. It also fires three times when a team is first seeded, once for each default role.

### Caveats

- The full ability list is not embedded in this event; fetch the role from the API for complete detail.
- The three default roles a new team is seeded with (`admin`, `manager`, `viewer`) emit this event too, one per role, at the moment the team is created.

### Related events

- `role.updated`: subsequent edits.
- `role.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "role.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor",
    "name": "Plan Editor"
  }
}
```

### `role.updated`

A role's name or abilities change.

### When this fires

A role's name, description, or permission set is saved, including the default `admin`, `manager` and `viewer` roles. The event is emitted on every save, even one that changes nothing, so treat it as "the role was written" rather than "the role changed".

### Caveats

- This event fires on both name changes and ability-set changes; fetch the role from the API to determine what actually changed.
- Collaborators currently holding the role pick up the new abilities immediately on next request.

### Related events

- `role.created`: predecessor.
- `team.member.role_changed`: fires when a collaborator's role assignment changes (different surface).

```json
{
  "id": "evt_01HX...",
  "type": "role.updated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor",
    "name": "Plan Editor"
  }
}
```

### `role.deleted`

A role is deleted. Only roles no collaborator currently holds can be deleted.

### When this fires

A role that no collaborator currently holds is deleted. A role still assigned to someone cannot be deleted at all; the database refuses it.

### Caveats

- Deleting is restricted to the role's creator, unless the caller owns the team: a team owner can delete any role in their team, including the default `admin`, `manager` and `viewer` roles. The dashboard hides the action for roles you did not create; the API and MCP surfaces do not.

### Related events

- `role.created`: first event in the lifecycle.
- `team.member.role_changed`: emits for explicit role re-assignments.

```json
{
  "id": "evt_01HX...",
  "type": "role.deleted",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor"
  }
}
```
