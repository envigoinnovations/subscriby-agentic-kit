# Webhook events: Teams and Roles

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

## Family `group`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `group.created` | `group:view` | `code`, `group_id`, `name`, `team_id` |
| `group.updated` | `group:view` | `code`, `group_id`, `name`, `team_id` |
| `group.members_synced` | `group:view` | `added_ids`, `code`, `group_id`, `member_count`, `member_ids`, `name`, `removed_ids`, `team_id` |
| `group.deleted` | `group:view` | `code`, `group_id`, `team_id` |

### `group.created`

A new team group is created.

### When this fires

A team owner or manager creates a new group. Groups bundle collaborators behind a shared permission set: several people in a team can be in the same group, and someone can be in more than one.

### Caveats

- Neither the permission set nor the member list is embedded in this event; read [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) for the group's current permissions, and expect `group.members_synced` when people are put into it.
- Changing who is in the group emits `group.members_synced`, not this event; `team.member.role_changed` covers a member's team role and is unrelated to groups.

### Related events

- `group.updated`: subsequent edits.
- `group.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "group.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community",
    "name": "Core Community"
  }
}
```

### `group.updated`

A group is renamed or its permission set replaced.

### When this fires

A group is renamed, or the permissions attached to it are replaced. Who is *in* the group is a separate event, `group.members_synced`, because the two changes have different consequences. A rename is cosmetic; changing the permission set silently re-scopes everyone already in the group.

### Caveats

- **The permission set is not in the payload**, so this event tells you a group changed without telling you into what. Read [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) for the current permissions.
- **Permissions replace, they do not merge.** An update that sends `permissions` sets them to exactly that list, so everyone in the group can gain and lose access in the same event.
- `code` is immutable, so a rename never breaks a reference held elsewhere.
- Membership is untouched here. See `group.members_synced`.

### Related events

- `group.members_synced`: who is in the group changed.
- `group.created`: predecessor.
- `group.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "group.updated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community",
    "name": "Core Community"
  }
}
```

### `group.members_synced`

The set of people in a group changed, with the deltas.

### When this fires

The membership of a group is replaced and the result differs from what was there before, via [the group members endpoint](https://docs.subscriby.net/api/v1/reference/groups) or the dashboard's group editor.

A group carries permissions, so who is in it decides who can do what. Until this event existed, renaming a group announced itself with `group.updated` while changing who it granted access to announced nothing at all; an integration mirroring access control could see the label change and miss the membership.

> **A no-op sync is silent.** Syncing the same set that is already there emits nothing. This event means the membership actually moved, so receiving one always implies at least one id in `added_ids` or `removed_ids`.

### Why the deltas are in the payload

An access-control mirror needs to know who *lost* the group, and diffing two snapshots on the far side is work it should not have to do: it requires having stored the previous state, and gets the answer wrong the first time it sees a group. `added_ids` and `removed_ids` are computed where the truth is, from the membership read immediately before the write and the list written immediately after it.

`member_ids` is still there for consumers that would rather replace their copy than apply a patch. Both are consistent with each other.

### Caveats

- **This is a replace, not an add.** Anyone absent from the request is removed. An empty list empties the group.
- **Permissions are not in the payload.** What the group grants is a property of the group, not of this event; read it from [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) if your mirror needs the effective permission set.
- **Users, not projects.** A group clusters collaborators. It is not a way to bundle projects.
- Removal from a group does not remove anyone from the team.

### Related events

- `group.updated`: the group was renamed or re-permissioned.
- `group.created`: predecessor.
- `group.deleted`: terminal state; everyone loses what it granted at once.

```json
{
  "id": "evt_01HX...",
  "type": "group.members_synced",
  "created_at": "2026-08-31T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "code": "core-community",
    "name": "Core Community",
    "member_ids": [
      "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "6f9b2e37-c184-4a05-8d72-30e16bc9f458"
    ],
    "added_ids": [
      "6f9b2e37-c184-4a05-8d72-30e16bc9f458"
    ],
    "removed_ids": [
      "d05e1a83-7c46-4f29-b613-8ae407c9d251"
    ],
    "member_count": 2
  }
}
```

### `group.deleted`

A group is deleted; its members lose the permissions it granted.

### When this fires

A group is deleted. Its permission and ability attachments are detached and its membership rows are removed; the people in it stay in the team but lose whatever the group granted. This is the final event you will receive for the given `group_id`.

### Caveats

- No per-collaborator event fires: the members' group rows cascade away with the group, and `group.members_synced` is emitted only by an explicit membership sync.
- Members of the group are not removed from the team; only the group and the access it granted go away.

### Related events

- `group.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "group.deleted",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community"
  }
}
```
