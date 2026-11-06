---
name: teams-and-roles
description: "This skill should be used when the user asks about teams, inviting or removing a collaborator, changing someone's role, creating or editing roles and groups, which permissions a teammate holds, or why a team action is refused on their plan."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Teams, roles and groups

A team is a container of people who collaborate on the creator's projects, each signing in with their own account and seeing the projects through the permissions granted. Four pieces: the team, its members (invited by email with a role), roles (named bundles of permissions, one per member) and groups (ad-hoc sets of members with permissions that add on top of roles). Teams are a Growth Plan feature (`TEAM_TIER_REQUIRED` below it); every creator has a personal team, the one a credential acts in by default.

The team owner can always do everything; a member can do only what their role or groups permit; a role can be deleted only by its creator or the owner; a group only by the owner.

## Teams and members

- `list_teams` (each row marked `personal`), `get_team`, `create_team` (`name`), `update_team`, `delete_team`.
- `list_team_members`, `get_team_member`, `invite_team_member` (`email`, `role`: a role code that exists on the team), `cancel_team_invitation`, `update_team_member_role` (the owner cannot be re-roled; ownership is not a membership row), `remove_team_member`.

A credential acts in one team at a time (`current_team` from `get_me`); a token minted by a team member never carries more than their role grants.

## Roles and groups

- `list_roles`, `get_role`, `create_role` (`team_id`, `code`: letters, digits, dashes and underscores, unique in the team and immutable afterwards, because permissions are addressed by it; `name`, `description`, `permissions`), `update_role`, `delete_role` (re-assign its members first, or they are left without a role). Every team starts with a default `member` role.
- `list_groups`, `get_group`, `create_group` (`team_id`, `code`, `name`, `permissions`), `update_group`, `delete_group`, `sync_group_members` (`user_ids` replaces the membership). A group only ever adds permissions; it never takes one away.
- On an update, `permissions` **replaces** the set rather than merging: read the role or group first and send the whole intended list.

The permissions are `entity:action` values grouped by entity (project, payment method, resource, access code, coupon, subscription, plan, user, support conversation, team member, and the rest); the full list is [references/team-permissions.md](references/team-permissions.md). Least privilege is the point: a bookkeeper gets the two view permissions over subscriptions and members in a group for the audit season, not a maximal role.

## Do not

- Do not invite, re-role or remove without naming the person and the role in front of the user.
- Do not send a partial `permissions` list to an update.
- Do not promise teams below the Growth Plan.

## References

- [references/tools.md](references/tools.md): the twenty-two tools with their arguments.
- [references/team-permissions.md](references/team-permissions.md): every permission a role or group can grant.
- [references/events.md](references/events.md): the `team.*`, `role.*` and `group.*` events.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/teams`, `/v1/roles` and `/v1/groups`.
- [references/abilities.md](references/abilities.md): the `teams`, `rbac` and `copilot` abilities (`copilot:use` is the permission that opens Subscriby Copilot in the dashboard and the platform bot).
- Documentation: [Teams and roles](https://docs.subscriby.net/teams), [roles](https://docs.subscriby.net/teams/roles), [groups](https://docs.subscriby.net/teams/groups), [the ability reference](https://docs.subscriby.net/teams/abilities).
