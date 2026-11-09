# REST endpoints: REST API, the `teams` entity

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
  -H "Authorization: Bearer <token>"
```

Every team the caller owns or is a member of; teams belonging to other creators are invisible. Never paginated. Useful for a re-auth flow that wants to surface a team picker before the user mints a token scoped to a specific team.


### POST `/v1/teams`

```bash
curl -X POST https://api.subscriby.net/v1/teams \
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>"
```

Exactly the team the token is scoped to via `scope:team:<uuid>`. Zapier's connection test calls this on save to validate the bearer token.


### DELETE `/v1/teams/{team}`

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>"
```

The team if the caller belongs to it; `404 RESOURCE_NOT_FOUND` otherwise, never `403`, so foreign-team existence does not leak.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### PATCH `/v1/teams/{team}`

```bash
curl -X PATCH https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer <token>" \
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

