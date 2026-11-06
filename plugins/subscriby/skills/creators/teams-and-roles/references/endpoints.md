# REST endpoints: Teams and Roles

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `teams`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/teams` | `team:view-any` | List teams | `list_teams` |
| POST | `/v1/teams` | `team:create` | Create a team | `create_team` |
| GET | `/v1/teams/current` | `team:view` | Get the current team | `get_me` |
| DELETE | `/v1/teams/{team}` | `team:delete` | Delete a team | `delete_team` |
| GET | `/v1/teams/{team}` | `team:view` | Get a team | `get_team` |
| PATCH | `/v1/teams/{team}` | `team:update` | Rename a team | `update_team` |

### GET `/v1/teams`

```bash
curl https://api.subscriby.net/v1/teams \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every team the caller owns or is a member of; teams belonging to other creators are invisible. Never paginated. Useful for a re-auth flow that wants to surface a team picker before the user mints a token scoped to a specific team.


### POST `/v1/teams`

```bash
curl -X POST https://api.subscriby.net/v1/teams \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Collective"}'
```

The caller becomes the team **owner**. Ownership is not a membership row: the owner cannot be removed from the team, cannot be re-roled, and is the only account permitted to rename or delete it.

A new team starts empty. Add people with [Team Members](https://docs.subscriby.net/api/v1/reference/team-members), and give them something to hold with [Roles](https://docs.subscriby.net/api/v1/reference/roles). Answers `201` with the team and emits `team.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): The team's name, up to 255 characters; the only mutable field.


### GET `/v1/teams/current`

```bash
curl https://api.subscriby.net/v1/teams/current \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Exactly the team the token is scoped to via `scope:team:<uuid>`. Zapier's connection test calls this on save to validate the bearer token.


### DELETE `/v1/teams/{team}`

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content` and emits `team.deleted`.

> **This takes everything with it.** Deleting a team deletes every project, plan, subscription and member scoped to it. There is no restore and no soft-delete. If you only want to stop selling, archive the projects instead.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The team if the caller belongs to it; `404 RESOURCE_NOT_FOUND` otherwise, never `403`, so foreign-team existence does not leak.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### PATCH `/v1/teams/{team}`

```bash
curl -X PATCH https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Collective (EU)"}'
```

`name` is the only mutable field. Ownership does not transfer through this endpoint, and membership moves through its own routes. Owner only. Answers `200` with the team and emits `team.updated`.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): The team's name, up to 255 characters; the only mutable field.


## `team-members`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| DELETE | `/v1/teams/{team}/invitations/{invitation}` | `team-member:remove` | Withdraw an invitation | `cancel_team_invitation` |
| GET | `/v1/teams/{team}/members` | `team-member:view-any` | List a team's members | `list_team_members` |
| POST | `/v1/teams/{team}/members` | `team-member:invite` | Invite a team member | `invite_team_member` |
| DELETE | `/v1/teams/{team}/members/{member}` | `team-member:remove` | Remove a team member | `remove_team_member` |
| GET | `/v1/teams/{team}/members/{member}` | `team-member:view` | Get a team member | `get_team_member` |
| PATCH | `/v1/teams/{team}/members/{member}/role` | `team-member:update-role` | Change a team member's role | `update_team_member_role` |

### DELETE `/v1/teams/{team}/invitations/{invitation}`

Requires `team-member:remove`, the same ability as removing a member, because withdrawing an invitation and removing a member revoke the same prospective access.

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID/invitations/$INVITATION_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

> **An invitee is not a member.** Someone who has not accepted has no membership row to remove, only a pending invitation. That is why this is a separate route: removing a member and withdrawing an invitation fail on different things, and using the wrong one returns `404` rather than doing something surprising.

Returns `204 No Content` and the invitation link stops working.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `invitation` (path, string, required): The pending invitation, resolved within the team by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}/members`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The team's owner as the first row followed by every member. Not paginated: a team's collaborator list is small by construction.

`email` is **omitted entirely** unless the token carries `team-member:view`. Listing who is on a team and reading how to reach them are different asks, and the fine-grained ability is what separates them. A roster-only token gets every other field and no `email` key at all: not `null`, absent.

The same `team-member:view-any` permission gates the dashboard's **Settings → Teams → Manage Members** page: only team owners and members holding the permission via their role can load it. Free-tier teams auto-assign everyone as owner, so this only matters on Growth-tier teams with multiple collaborators.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### POST `/v1/teams/{team}/members`

```bash
curl -X POST https://api.subscriby.net/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"email": "newcomer@example.com", "role": "support-agent"}'
```

Addressed by **email**, not user id: the invitee may not have a Subscriby account yet, which is what separates inviting from adding. They receive an invitation message with a link; the membership row appears when they accept.

`role` is a role **code** on that team, such as `support-agent`, not a role id. Create it first with [Roles](https://docs.subscriby.net/api/v1/reference/roles) if it does not exist.

Answers `201` with the invitation summary. Emits `team.member.invited`, then `team.member.joined` when they accept.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `email` (string, required): The invitee's email address, up to 255 characters. They receive an invitation message with a link; the membership appears when they accept.
- `role` (string, required): A role **code** on that team, such as `support-agent`, not a role id. Create it first if it does not exist; an unknown code is refused.


### DELETE `/v1/teams/{team}/members/{member}`

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. They lose access to every project and setting scoped to the team immediately; their own Subscriby account is untouched. Not gated by tier. Emits `team.member.removed`.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The membership, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}/members/{member}`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One collaborator, with their `email`, which this route always includes because it requires `team-member:view` by definition. `404 RESOURCE_NOT_FOUND` if the user is not on the team or the team is not in the caller's visibility set.

- `role_id` points at a [Role](https://docs.subscriby.net/api/v1/reference/roles) row on the same team, or `null` for the owner pseudo-row.
- `is_owner` is `true` only for the single team creator; the owner is returned alongside the members but bypasses the membership table entirely.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The person's place on the team, resolved by the route binder.


### PATCH `/v1/teams/{team}/members/{member}/role`

```bash
curl -X PATCH https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID/role \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"role": "manager"}'
```

Moves a collaborator onto another of the team's roles. The team **owner** cannot be re-roled: ownership is not a membership row and carries everything unconditionally. Answers `200` with the membership and emits `team.member.role_changed`.

Changing a member's role has **no dashboard equivalent**: the settings page offers invite, remove and cancel-invitation only, so this endpoint is the only way to move someone between roles without removing and re-inviting them.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The membership, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `role` (string, required): A role **code** on the team, such as `manager`, not a role id. An unknown code is refused.


## `roles`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/roles` | `role:view-any` | List roles | `list_roles` |
| POST | `/v1/roles` | `role:create` | Create a role | `create_role` |
| DELETE | `/v1/roles/{role}` | `role:delete` | Delete a role | `delete_role` |
| GET | `/v1/roles/{role}` | `role:view` | Get a role | `get_role` |
| PATCH | `/v1/roles/{role}` | `role:update` | Update a role | `update_role` |

### GET `/v1/roles`

```bash
curl https://api.subscriby.net/v1/roles \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every role across the teams the caller can see, with its permission codes. Visibility is the union of every team the caller owns or belongs to; a role from a team the caller cannot see answers `404 RESOURCE_NOT_FOUND` rather than `403`, so existence never leaks.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/roles`

```bash
curl -X POST https://api.subscriby.net/v1/roles \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "code": "support-agent",
        "name": "Support Agent",
        "description": "Answers tickets, cannot touch billing",
        "permissions": ["support-conversation:view-any", "support-conversation:update"]
      }'
```

> **Choose the code deliberately.** `code` is the stable identifier permissions are addressed by. It must be unique within the team and **cannot be changed afterwards**: renaming one would detach every assignment that referenced it. Only `name`, `description` and the permission set are mutable.

`permissions` accepts codes from the permission catalog in `entity:action` form. An unknown code is refused rather than silently dropped, so a typo fails loudly instead of creating a role that grants less than you think. Omit the field for a role that grants nothing yet.

Answers `201` with the role and emits `role.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the role in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a role cannot be moved between teams.
- `code` (string, required): The stable identifier permissions are addressed by, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards: renaming one would detach every assignment that referenced it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `description` (string): What the role is for, up to 255 characters; null clears it.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the role grants, in `entity:action` form. Sending it sets the role's permissions to exactly this list; omit the key to leave the existing set untouched. Omit it on create for a role that grants nothing yet.


### DELETE `/v1/roles/{role}`

```bash
curl -X DELETE https://api.subscriby.net/v1/roles/$ROLE_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`, and detaches the role's permissions on the way out. Anyone currently holding the role loses whatever it granted them; they stay in the team. Not gated by tier. Emits `role.deleted`.

Restricted to whoever **created** the role, unless the caller **owns** the team. Belonging to a team is not licence to dismantle how everyone else in it is permissioned.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/roles/{role}`

One role with its permission codes. `permissions` is a flat array of the exact ability strings granted by this role, the same strings used as token abilities, so you can match roles against tokens without a second round-trip.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.


### PATCH `/v1/roles/{role}`

```bash
curl -X PATCH https://api.subscriby.net/v1/roles/$ROLE_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Senior Support Agent", "permissions": ["support-conversation:view-any"]}'
```

> **Permissions replace, they do not merge.** Sending `permissions` sets the role's permissions to exactly that list; anything omitted is revoked. **Omit the key entirely** to leave the existing set untouched while changing only the name or description.

Answers `200` with the role and emits `role.updated`.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the role in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a role cannot be moved between teams.
- `code` (string, required): The stable identifier permissions are addressed by, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards: renaming one would detach every assignment that referenced it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `description` (string): What the role is for, up to 255 characters; null clears it.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the role grants, in `entity:action` form. Sending it sets the role's permissions to exactly this list; omit the key to leave the existing set untouched. Omit it on create for a role that grants nothing yet.


## `groups`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/groups` | `group:view-any` | List groups | `list_groups` |
| POST | `/v1/groups` | `group:create` | Create a group | `create_group` |
| DELETE | `/v1/groups/{group}` | `group:delete` | Delete a group | `delete_group` |
| GET | `/v1/groups/{group}` | `group:view` | Get a group | `get_group` |
| PATCH | `/v1/groups/{group}` | `group:update` | Update a group | `update_group` |
| PUT | `/v1/groups/{group}/members` | `group:update` | Replace a group's members | `sync_group_members` |

### GET `/v1/groups`

```bash
curl https://api.subscriby.net/v1/groups \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every group across the teams the caller sees, newest first. Rows carry neither `permissions` nor `member_ids`; read a group individually for those. Visibility is the union of every team the caller owns or belongs to; a group from a team the caller cannot see answers `404 RESOURCE_NOT_FOUND` rather than `403`, so the API cannot be used to discover that a group id exists.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/groups`

```bash
curl -X POST https://api.subscriby.net/v1/groups \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "code": "billing-team",
        "name": "Billing Team",
        "permissions": ["project-subscription:view-any"]
      }'
```

> **Choose the code deliberately.** `code` is unique within the team and **cannot be changed afterwards**: permissions are addressed by it. Only `name` and the permission set are mutable.

A group starts empty. Add people with the members endpoint; membership is deliberately not a field here, because replacing who is in a group and naming it are different operations with different consequences.

Answers `201` with the group and its permissions. Emits `group.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the group in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a group cannot be moved between teams.
- `code` (string, required): The machine name, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards because permissions are addressed by it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the group grants. Sending it sets the group's permissions to exactly this list; omit the key to leave the existing set untouched. Defaults to none on create.


### DELETE `/v1/groups/{group}`

```bash
curl -X DELETE https://api.subscriby.net/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. Everyone in the group loses whatever it granted them, but stays in the team. Not gated by tier. Emits `group.deleted`.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/groups/{group}`

One group with its `permissions` and `member_ids`, which are returned when the group is read individually or after a write and omitted from list responses so a listing stays one query.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.


### PATCH `/v1/groups/{group}`

```bash
curl -X PATCH https://api.subscriby.net/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Billing & Finance"}'
```

> **Permissions replace, they do not merge.** Sending `permissions` sets the group's permissions to exactly that list. **Omit the key entirely** to leave the existing set untouched while changing only the name.

`code` and `team_id` are prohibited: a group is neither renamed by code nor moved between teams. Answers `200` with the group and its permissions. Emits `group.updated`.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the group in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a group cannot be moved between teams.
- `code` (string, required): The machine name, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards because permissions are addressed by it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the group grants. Sending it sets the group's permissions to exactly this list; omit the key to leave the existing set untouched. Defaults to none on create.


### PUT `/v1/groups/{group}/members`

```bash
curl -X PUT https://api.subscriby.net/v1/groups/$GROUP_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80", "4b8e2f6a-1c3d-4e5f-9a7b-8c9d0e1f2a3b"]}'
```

This is a **sync**, not an add. The array replaces the membership entirely: anyone omitted is removed, and `[]` empties the group. That is deliberate and differs from the permission field above: clearing a group is a legitimate thing to ask for, whereas silently stripping every permission because a field was blank is not.

This is the one write in the identity surface whose tier gate depends on its argument: a sync that only removes people succeeds on any tier, and one that adds anybody needs Growth. Deciding from the route alone would leave a lapsed creator unable to take one person out of a group without deleting the whole group, and deleting is not gated, so the gate would only be pushing them toward the more destructive option.

Every id must already belong to the group's team. A group grants permissions inside one tenant, so an outsider is refused naming the offending ids; the whole call fails rather than partly applying, so you never end up with a membership you did not ask for.

Answers `200` with the group, its `permissions` and its `member_ids`. Emits `group.members_synced`, which carries `added_ids` and `removed_ids` as well as the final list, so an access-control mirror does not have to diff two snapshots to work out what moved. A sync that changes nothing emits nothing.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `user_ids` (array of string, required): Every user the group should have afterwards. Must be present; `[]` empties the group. Each id must already belong to the group's team, or the whole call is refused naming the outsiders.

