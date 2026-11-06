# Tools: Connect

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_me` | read | `account:read` | Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). |
| `list_teams` | read | `team:view-any` | Lists every team the authenticated user owns or holds a membership in. |
| `get_team` | read | `team:view` | Fetches a single team by UUID. |
| `list_tokens` | read | `token:view-any` | Lists the authenticated user's own personal access tokens. |
| `get_token` | read | `token:view` | Fetches one of the authenticated user's own personal access tokens by UUID: its name, gate abilities, team and project scopes, last use and expiry. |

## `get_me`

Read · requires `account:read`

Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). Call it first to learn who you are acting as. Takes no input.

**Arguments**

- none

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

## `list_tokens`

Read · requires `token:view-any`

Lists the authenticated user's own personal access tokens. The plaintext token value is NEVER surfaced — only `id`, `name`, `abilities` (gate codes), `scopes` (`team_id` and `project_ids` extracted from the `scope:team:` / `scope:project:` ability prefixes), `last_used_at`, `expires_at`, and `created_at`. Token ownership IS the permission — no extra ability is required to call. Pair with `revoke_token` to retire a token.

**Arguments**

- none

## `get_token`

Read · requires `token:view`

Fetches one of the authenticated user's own personal access tokens by UUID: its name, gate abilities, team and project scopes, last use and expiry. Same row shape as `list_tokens`; the plaintext value is NEVER surfaced — it exists only in the mint's own answer. Unknown ids and other users' tokens surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `token_id` (string, required): UUID of the token to fetch, from `list_tokens`.
