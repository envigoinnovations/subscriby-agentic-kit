# Tools: Teams and Roles

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_teams` | read | `team:view-any` | Lists every team the authenticated user owns or holds a membership in. |
| `get_team` | read | `team:view` | Fetches a single team by UUID. |
| `create_team` | additive | `team:create` | Creates a team owned by the caller. |
| `update_team` | destructive | `team:update` | Renames a team. |
| `delete_team` | destructive | `team:delete` | Permanently deletes a team, owner only. |
| `list_team_members` | read | `team-member:view-any` | Lists the collaborators on one team. |
| `get_team_member` | read | `team-member:view` | Fetches one member of a team by the member's user UUID: their name, email, role and whether they own the team. |
| `invite_team_member` | additive | `team-member:invite` | Invites someone to a team by email and sends them an invitation message. |
| `cancel_team_invitation` | destructive | `team-member:remove` | Withdraws an invitation nobody has accepted yet, so its link stops working. |
| `update_team_member_role` | destructive | `team-member:update-role` | Moves an existing collaborator onto a different role within the team. |
| `remove_team_member` | destructive | `team-member:remove` | Removes a collaborator from a team. |
| `list_roles` | read | `role:view-any` | Lists roles across every team the authenticated user owns or holds a membership in. |
| `get_role` | read | `role:view` | Fetches one role by UUID: its team, code, name and the permission codes it grants. |
| `create_role` | additive | `role:create` | Creates a permission role inside a team. |
| `update_role` | destructive | `role:update` | Renames a role and replaces its permission set. |
| `delete_role` | destructive | `role:delete` | Deletes a team role and detaches its permissions. |
| `list_groups` | read | `group:view-any` | Lists groups across every team the authenticated user owns or holds a membership in. |
| `get_group` | read | `group:view` | Fetches one group by UUID: its team, code and name. |
| `create_group` | additive | `group:create` | Creates a permission group inside a team. |
| `update_group` | destructive | `group:update` | Renames a group and replaces its permission set. |
| `delete_group` | destructive | `group:delete` | Deletes a permission group and detaches its permissions and members. |
| `sync_group_members` | destructive | `group:update` | Replaces a group's membership wholesale with the supplied user ids. |

## `list_teams`

Read · requires `team:view-any`

Lists every team the authenticated user owns or holds a membership in. Each row carries `personal` so the personal team is identifiable. Useful before minting a token scoped to a specific team via the dashboard. Team CRUD stays dashboard-only — no `create_team` / `delete_team` tools exist.

**Arguments**

- none

## `get_team`

Read · requires `team:view`

Fetches a single team by UUID. Visibility is locked to teams the authenticated user owns or holds a membership in — out-of-scope ids surface as `RESOURCE_NOT_FOUND`. Pair with `list_teams` to discover the right id first.

**Arguments**

- `team_id` (string, required): UUID of the team to fetch.

## `create_team`

Additive · requires `team:create` · open world

Creates a team owned by the caller. Teams are the tenant every project, plan and subscription hangs off, and are a Growth-tier capability — on a lower tier this returns TEAM_TIER_REQUIRED rather than creating anything. The caller becomes the owner, which is not a membership row and cannot be removed or re-roled. Emits `team.created`.

**Arguments**

- `name` (string, required): Team name, 1..255 characters.

## `update_team`

Destructive · requires `team:update` · open world

Renames a team. Owner only — belonging to a team is not enough. Name is the only mutable field; ownership and membership move through their own tools. Emits `team.updated`.

**Arguments**

- `team_id` (string, required): UUID of the team to rename.
- `name` (string, required): New team name, 1..255 characters.

## `delete_team`

Destructive · requires `team:delete` · open world

Permanently deletes a team, owner only. DESTRUCTIVE: everything scoped to the team goes with it — projects, plans, subscriptions, members. There is no restore. The caller's last remaining team is refused, because an account with no tenant is a state no other path can produce. Emits `team.deleted`.

**Arguments**

- `team_id` (string, required): UUID of the team to delete. Irreversible.

## `list_team_members`

Read · requires `team-member:view-any`

Lists the collaborators on one team. The owner is prepended as a pseudo-row with `is_owner=true` and `role_id=null`; pivot members follow with their assigned `role_id`. Emails are returned verbatim — these are internal collaborators, not subscribers, so PII handling rules are looser, but still scrub before forwarding to third-party systems.

**Arguments**

- `team_id` (string, required): UUID of the team whose members to list.

## `get_team_member`

Read · requires `team-member:view`

Fetches one member of a team by the member's user UUID: their name, email, role and whether they own the team. Same row shape as `list_team_members`. Requires `team_id` and `member_id`. A team the caller does not belong to, and a user who is not on the team, both surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `team_id` (string, required): UUID of the team the member is on.
- `member_id` (string, required): The member's user UUID, from `list_team_members`.

## `invite_team_member`

Additive · requires `team-member:invite` · open world

Invites someone to a team by email and sends them an invitation message. Addressed by email rather than user id because the invitee may have no account yet — that is what separates inviting from adding. `role` is a role code that must already exist on the team; create it first with `create_role`. Someone already in the team is refused. Emits `team.member.invited`, and `team.member.joined` later when they accept.

**Arguments**

- `team_id` (string, required): UUID of the team to invite into.
- `email` (string, required): Email address of the invitee.
- `role` (string, required): Role code the invitee will hold. Must already exist on the team.

## `cancel_team_invitation`

Destructive · requires `team-member:remove` · open world

Withdraws an invitation nobody has accepted yet, so its link stops working. Distinct from `remove_team_member`: an invitee has no membership row, only a pending invitation, and the two fail on different things. Invitation ids come from the team-members listing.

**Arguments**

- `team_id` (string, required): UUID of the team.
- `invitation_id` (string, required): UUID of the pending invitation to withdraw.

## `update_team_member_role`

Destructive · requires `team-member:update-role` · open world

Moves an existing collaborator onto a different role within the team. The team owner cannot be re-roled — ownership is not a membership row — and someone who is not in the team is refused. `role` is a role code that must already exist on that team; create it first with `create_role`. Emits `team.member.role_changed`.

**Arguments**

- `team_id` (string, required): UUID of the team.
- `user_id` (string, required): UUID of the collaborator whose role is changing.
- `role` (string, required): Role code to move them onto. Must already exist on the team.

## `remove_team_member`

Destructive · requires `team-member:remove` · open world

Removes a collaborator from a team. DESTRUCTIVE: they immediately lose access to every project and setting scoped to it, though their user account itself is untouched. The team owner cannot be removed. To withdraw an invitation nobody has accepted yet, use `cancel_team_invitation` instead — an invitee has no membership row to remove. Emits `team.member.removed`.

**Arguments**

- `team_id` (string, required): UUID of the team.
- `user_id` (string, required): UUID of the collaborator to remove.

## `list_roles`

Read · requires `role:view-any`

Lists roles across every team the authenticated user owns or holds a membership in. Each role carries a flat list of `permissions` codes — the same strings the ApiAbility catalog uses as token abilities. Read this when reasoning about authorization or before issuing a new token; cross-reference codes with `subscriby://enums/ability` for human labels.

**Arguments**

- none

## `get_role`

Read · requires `role:view`

Fetches one role by UUID: its team, code, name and the permission codes it grants. Same row shape as `list_roles`. Unknown ids and roles of teams the caller does not belong to surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `role_id` (string, required): UUID of the role to fetch.

## `create_role`

Additive · requires `role:create` · open world

Creates a permission role inside a team. `code` is the stable identifier permissions are addressed by — it must be unique within the team and cannot be changed afterwards, so choose it deliberately. `permissions` are codes from the permission catalog; read `subscriby://enums/ability` or GET /abilities.json for the accepted list, and note these are the team permission codes (entity:action) rather than token abilities. Growth-tier capability. Emits `role.created`.

**Arguments**

- `team_id` (string, required): UUID of the team the role belongs to.
- `code` (string, required): Stable identifier, alpha-dash. Unique per team and immutable once created.
- `name` (string, required): Human-readable role name.
- `description` (string): Optional description of what the role is for.
- `permissions` (array of any): Permission codes (entity:action) to grant. Omit for a role with none.

## `update_role`

Destructive · requires `role:update` · open world

Renames a role and replaces its permission set. `permissions` is a REPLACE, not a merge — send the complete list you want the role to end up with, and omit the key entirely to leave the existing set untouched. `code` cannot be changed; permissions are addressed by it, so a rename would detach every assignment. Emits `role.updated`.

**Arguments**

- `role_id` (string, required): UUID of the role to update.
- `name` (string): New role name. Omit to keep the current one.
- `description` (string): New description. Omit to keep the current one.
- `permissions` (array of any): Complete replacement permission set. Omit to leave permissions untouched.

## `delete_role`

Destructive · requires `role:delete` · open world

Deletes a team role and detaches its permissions. DESTRUCTIVE: anyone currently holding this role loses whatever it granted. Restricted to whoever created the role, unless the caller owns the team — belonging to a team is not licence to dismantle how everyone else in it is permissioned. Emits `role.deleted`.

**Arguments**

- `role_id` (string, required): UUID of the role to delete. Irreversible.

## `list_groups`

Read · requires `group:view-any`

Lists groups across every team the authenticated user owns or holds a membership in. Groups cluster users for organization but carry no permission payload of their own — lighter-weight than roles. Pair with `list_roles` when reasoning about authorization.

**Arguments**

- none

## `get_group`

Read · requires `group:view`

Fetches one group by UUID: its team, code and name. Same row shape as `list_groups`. Groups cluster users for organization but carry no permission payload of their own. Unknown ids and groups of teams the caller does not belong to surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `group_id` (string, required): UUID of the group to fetch.

## `create_group`

Additive · requires `group:create` · open world

Creates a permission group inside a team. A group differs from a role in how it is applied: a role is what one collaborator is, a group is a named bundle several people can be put into. `code` is unique per team and immutable. Membership is not set here — use `sync_group_members`, because replacing who is in a group and naming it are separate operations. Growth-tier capability. Emits `group.created`.

**Arguments**

- `team_id` (string, required): UUID of the team the group belongs to.
- `code` (string, required): Stable identifier, alpha-dash. Unique per team and immutable once created.
- `name` (string, required): Human-readable group name.
- `permissions` (array of any): Permission codes (entity:action) the group grants.

## `update_group`

Destructive · requires `group:update` · open world

Renames a group and replaces its permission set. `permissions` is a REPLACE, not a merge — send the complete list, or omit the key to leave the current set alone. `code` cannot change. Membership is untouched here; use `sync_group_members`. Emits `group.updated`.

**Arguments**

- `group_id` (string, required): UUID of the group to update.
- `name` (string): New group name. Omit to keep the current one.
- `permissions` (array of any): Complete replacement permission set. Omit to leave permissions untouched.

## `delete_group`

Destructive · requires `group:delete` · open world

Deletes a permission group and detaches its permissions and members. DESTRUCTIVE: everyone in the group loses whatever it granted them. The people themselves stay in the team. Emits `group.deleted`.

**Arguments**

- `group_id` (string, required): UUID of the group to delete. Irreversible.

## `sync_group_members`

Destructive · requires `group:update` · open world

Replaces a group's membership wholesale with the supplied user ids. This is a SYNC, not an add: anyone absent from the list is removed, and an empty array empties the group. Every id must already belong to the group's team — a group grants permissions inside one tenant, so an outsider is refused rather than silently skipped. Emits `group.members_synced`, carrying who was added and who was removed.

**Arguments**

- `group_id` (string, required): UUID of the group whose membership is being replaced.
- `user_ids` (array of any, required): Complete list of user UUIDs the group should contain. An empty array clears it.
