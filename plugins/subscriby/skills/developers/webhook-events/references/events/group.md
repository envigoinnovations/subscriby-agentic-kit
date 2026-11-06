# Webhook events: Webhook Events, the `group` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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
