# Webhook events: Webhook Events, the `team` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `team`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `team.created` | `team:view` | `name`, `owner_id`, `team_id` |
| `team.updated` | `team:view` | `name`, `owner_id`, `team_id` |
| `team.deleted` | `team:view` | `name`, `team_id` |
| `team.member.invited` | `team:view` | `email`, `role_code`, `role_id`, `team_id` |
| `team.member.joined` | `team:view` | `team_id`, `user_id` |
| `team.member.removed` | `team:view` | `team_id`, `user_id` |
| `team.member.role_changed` | `team:view` | `role_id`, `team_id`, `user_id` |

### `team.created`

A team is created, including the personal team created alongside a new account.

### When this fires

A team is created, including the personal team created alongside a new account. Creating additional teams requires Growth tier or higher.

> **Not currently delivered.** Endpoints are scoped to a team, and an endpoint cannot exist for a team before that team does, so this event is not currently delivered to any subscriber. Poll [the teams list](https://docs.subscriby.net/api/v1/reference/teams) if you need to observe team creation.

### Caveats

- Creating an additional team requires the Growth tier or above. The personal team created at registration is not gated, so the event is emitted on every tier; it is the subsequent, explicit team creations that Free and Starter cannot reach.
- The personal team created with the account emits this too. Nothing in the payload distinguishes it from an explicitly created team.

### Related events

- `team.deleted`: terminal state.
- `team.member.invited`: typical follow-up.

```json
{
  "id": "evt_01HX...",
  "type": "team.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Research Team",
    "owner_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.updated`

A team is renamed.

### When this fires

A team's name changes. That is the whole of it today: `name` is the only mutable field on a team. Ownership does not transfer, and the tier a team sits on is a property of the owner's billing rather than of the team, so neither shows up here.

> **Fires however the rename happened.** The team model dispatches this from its own event map, not from any one code path. A rename through [the REST endpoint](https://docs.subscriby.net/api/v1/reference/teams), through the `update_team` MCP tool, or from a console fix that went near either, all emit it identically. The dashboard has no rename control today, so the API and MCP are the only routes.

### Caveats

- **No before value.** The payload carries the name the team has now, not the one it had. If your mirror needs the old name, keep it from the previous event or read it before applying.
- **A team has no code.** Unlike roles and groups, teams are addressed only by `team_id`, so a rename never breaks a reference.
- Renaming has no effect on membership, roles, groups, projects or billing.

### Related events

- `team.created`: predecessor.
- `team.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "team.updated",
  "created_at": "2026-08-31T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Northwind Studios",
    "owner_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.deleted`

A team is deleted; its projects are detached, not deleted.

### When this fires

A team is deleted. Projects that were scoped to it are detached: their `team_id` becomes null and they keep running under the owner's personal scope. Nothing about them is deleted and no `project.*` event fires.

> **Not delivered to the deleted team's endpoints.** An endpoint is scoped to a team, and deleting the team removes its endpoints in the same operation, so this event is not currently delivered to endpoints belonging to the deleted team.

### Caveats

- A team that still has collaborators cannot be deleted: the membership table's foreign key restricts it. Every `team.member.removed` for the team therefore precedes `team.deleted`, never follows it.
- The only team that cannot be deleted is your last one; an owner with more than one team may delete whichever they like, including the team created with the account. Nothing in the payload distinguishes them.

### Related events

- `team.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "team.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Research Team"
  }
}
```

### `team.member.invited`

An invitation is issued to a new collaborator.

### When this fires

A team owner or manager invites a collaborator by email. The collaborator becomes a member only once they accept and `team.member.joined` fires. The invitee has not yet accepted at this point.

### Caveats

- An invitation can be revoked without producing a follow-up event in this family. Invitations do not expire: a pending one stands until it is accepted or withdrawn.
- The collaborator does not have access until they accept; expect `team.member.joined`.

### Related events

- `team.member.joined`: fires on acceptance.
- `team.member.removed`: fires only if the collaborator accepts and is later removed. Withdrawing the invitation itself emits nothing.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.invited",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "email": "collaborator@example.com",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "role_code": "manager"
  }
}
```

### `team.member.joined`

An invited collaborator accepts and joins.

### When this fires

An invited collaborator accepts and joins the team.

### Caveats

- The collaborator's role was determined at invitation time; see the matching `team.member.invited` event for the role.
- A user can belong to multiple teams; this event is scoped per (team, user).

### Related events

- `team.member.invited`: predecessor.
- `team.member.role_changed`: typical follow-up over time.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.joined",
  "created_at": "2026-05-18T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.member.removed`

A collaborator is removed from a team by its owner.

### When this fires

A team owner removes a collaborator. There is no self-service leave, so this event always represents an action taken by the owner.

### Caveats

- Removal detaches the team membership row and nothing else. Roles are team-scoped, so there is no per-project assignment to revoke, and group memberships are left in place: re-adding the same user restores their old group memberships.

### Related events

- `team.member.invited`: predecessor in the lifecycle.
- `team.member.joined`: predecessor.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.removed",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.member.role_changed`

A collaborator's role within a team changes.

### When this fires

A collaborator's role within the team changes: promoted, demoted, or moved between custom roles. Nothing in Subscriby fired this before the team member role endpoint existed; that endpoint and the `update_team_member_role` MCP tool are what make it fire.

### Caveats

- For ability detail behind a role id, listen for `role.updated` or pull the role definition from the API.
- This event covers the team-level role on the membership pivot only. Groups carry permissions rather than roles, so a change to group membership emits `group.members_synced` instead and never this event.

### Related events

- `team.member.joined`: predecessor in the lifecycle.
- `role.updated`: emits when the role definition itself changes.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.role_changed",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "role_id": null
  }
}
```
