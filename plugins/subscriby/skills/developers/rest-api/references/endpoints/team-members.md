# REST endpoints: REST API, the `team-members` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>"
```

The team's owner as the first row followed by every member. Not paginated: a team's collaborator list is small by construction.

`email` is **omitted entirely** unless the token carries `team-member:view`. Listing who is on a team and reading how to reach them are different asks, and the fine-grained ability is what separates them. A roster-only token gets every other field and no `email` key at all: not `null`, absent.

The same `team-member:view-any` permission gates the dashboard's **Settings → Teams → Manage Members** page: only team owners and members holding the permission via their role can load it. Free-tier teams auto-assign everyone as owner, so this only matters on Growth-tier teams with multiple collaborators.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### POST `/v1/teams/{team}/members`

```bash
curl -X POST https://api.subscriby.net/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>"
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
  -H "Authorization: Bearer <token>" \
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

