# REST endpoints: Rest api, the `roles` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

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
  -H "Authorization: Bearer <token>"
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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

