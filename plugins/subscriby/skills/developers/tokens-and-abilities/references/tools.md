# Tools: Tokens and Abilities

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_tokens` | read | `token:view-any` | Lists the authenticated user's own personal access tokens. |
| `get_token` | read | `token:view` | Fetches one of the authenticated user's own personal access tokens by UUID: its name, gate abilities, team and project scopes, last use and expiry. |
| `create_token` | destructive | `token:create` | Mints a personal access token: a `name`, the `abilities` it holds (each a value from the ability catalog, and never more than the calling token itself holds — "token:create" is refused unconditionally), and the `team_id` it is minted for, which must be a team the caller owns or belongs to and becomes the token's frozen scope. |
| `revoke_token` | destructive | `token:delete` | Revokes one of the authenticated user's own personal access tokens by id. |

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

## `create_token`

Destructive · requires `token:create` · open world

Mints a personal access token: a `name`, the `abilities` it holds (each a value from the ability catalog, and never more than the calling token itself holds — "token:create" is refused unconditionally), and the `team_id` it is minted for, which must be a team the caller owns or belongs to and becomes the token's frozen scope. The answer carries the token row plus `token`, the plaintext, THE ONLY TIME IT EXISTS outside your own storage — hand it to the person or store it immediately; every later read returns the row without it. A refused ability or a foreign team is `VALIDATION_FAILED` naming the reason.

**Arguments**

- `name` (string, required): A label for the token, up to 255 characters, shown on Settings under API Tokens.
- `abilities` (array of any, required): The abilities the token holds, at least one, each a value from the ability catalog resource. Must be a subset of what the calling token holds; "token:create" is never granted this way.
- `team_id` (string, required): UUID of the team the token is minted for; it becomes the token's frozen scope and must be a team the caller owns or belongs to.

## `revoke_token`

Destructive · requires `token:delete` · idempotent

Revokes one of the authenticated user's own personal access tokens by id. DESTRUCTIVE: you MUST confirm the target `token_id` with a human before calling — any external integration using the revoked token will start failing immediately on the next request. Refuses self-revocation; the token authenticating this call cannot delete its own row (returns `VALIDATION_FAILED`). Token ownership IS the permission — foreign token ids return `RESOURCE_NOT_FOUND` to prevent existence leaks. Idempotent — re-calling on an already-revoked id returns `RESOURCE_NOT_FOUND`.

**Arguments**

- `token_id` (string, required): UUID of the token to revoke. Must belong to the authenticated user. Cannot be the id of the token authenticating this call.
