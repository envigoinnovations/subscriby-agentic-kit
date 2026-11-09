# REST endpoints: REST API, the `groups` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

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
  -H "Authorization: Bearer <token>"
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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

