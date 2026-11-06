# REST endpoints: Tokens and Abilities

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `tokens`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/tokens` | `token:view-any` | List the caller's tokens | `list_tokens` |
| POST | `/v1/tokens` | `token:create` | Mint a token | `create_token` |
| DELETE | `/v1/tokens/{token}` | `token:delete` | Revoke a token | `revoke_token` |
| GET | `/v1/tokens/{token}` | `token:view` | Get a token | `get_token` |

### GET `/v1/tokens`

```bash
curl https://api.subscriby.net/v1/tokens \
  -H "Authorization: Bearer <token>"
```

Paginated, newest first. `per_page` accepts 1–100 and defaults to 25.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/tokens`

```bash
curl -X POST https://api.subscriby.net/v1/tokens \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Nightly reconciliation",
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "abilities": ["project-subscription:view-any", "payment:view-any"]
      }'
```

`token` sits alongside `data`, not inside it, the same shape webhook endpoints use for their one-time signing secret. Store it before you do anything else; there is no endpoint that will hand it back. Minting is deliberately not offered as an MCP tool.

**`team_id` is required here, and only here.** Everywhere else in v1 the team comes from the calling token's frozen scope and a `team_id` in the body is ignored. Minting is the exception: a token is created **for** a team, and you may belong to several. The minted token gets `scope:team:<team_id>` automatically. It cannot be widened later.

> **A token can never mint a stronger token.** The abilities you request must be a **subset** of the abilities the calling token holds, and `token:create` is withheld unconditionally from anything minted this way.

Minting used to be dashboard-only precisely so a leaked automation token could not spin up a higher-privilege one. That concern is real, and attenuation is the answer to it rather than a retreat from it: a compromised credential can produce nothing its holder could not already do directly. `token:create` is withheld on top of the subset rule for a separate reason: inherited, it would leave an unbounded ladder of tokens descending from one leak, with no single revocation that ends the chain. A human in the dashboard is not attenuated. They authenticated with a password and a second factor, not with a bearer string, so they can grant anything in the catalog.

If the calling token carries a **deprecated** coarse ability, it may still mint the precise abilities that ability covers; the split does not shrink what an existing token can delegate.

Asking for more than you hold returns `422`; `context.abilities` echoes back what you asked for, not what was refused, and the refused ones are named in `message`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "A token cannot grant abilities it does not hold: coupon:delete, project:delete.",
    "context": {
      "abilities": ["coupon:delete", "project:delete", "project:view-any"]
    }
  }
}
```

A retired ability keeps working on tokens that already carry it, but no new token can be given one. This is a field-level failure, so every offending entry in the array is reported at once under `fields`, and the message names the replacements; an ability that is simply unknown gets a different message pointing at the catalog, because a typo and a retirement need different fixes:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "webhook-endpoint:manage is retired and cannot be granted to a new token. Use webhook-delivery:retry, webhook-delivery:view-any, webhook-endpoint:create, webhook-endpoint:delete, webhook-endpoint:update, webhook-endpoint:view, webhook-endpoint:view-any instead.",
    "fields": {
      "abilities.0": [
        "webhook-endpoint:manage is retired and cannot be granted to a new token. Use webhook-delivery:retry, webhook-delivery:view-any, webhook-endpoint:create, webhook-endpoint:delete, webhook-endpoint:update, webhook-endpoint:view, webhook-endpoint:view-any instead."
      ]
    }
  }
}
```

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A label for the token, up to 255 characters, shown on Settings → API Tokens.
- `abilities` (array of string, required): The abilities the token holds, at least one. Each must be one the calling token holds itself (attenuation), and `token:create` is withheld unconditionally.
- `team_id` (string, required): The team the token is minted **for**; it receives `scope:team:<team_id>` automatically and cannot be widened later. Must be a team the caller owns or belongs to. Required here, unlike everywhere else in v1 where the team comes from the calling token's scope.


### DELETE `/v1/tokens/{token}`

```bash
curl -X DELETE https://api.subscriby.net/v1/tokens/$TOKEN_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. Revocation is immediate: in-flight requests already authenticated will finish, and the next one fails.

**Parameters**

- `token` (path, integer, required): One of the caller's tokens, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/tokens/{token}`

```bash
curl https://api.subscriby.net/v1/tokens/$TOKEN_ID \
  -H "Authorization: Bearer <token>"
```

One of the caller's tokens, without its value.

- `id` is an **integer** serialised as a string, the one identifier in the platform that is not a UUID. See [Identifiers](https://docs.subscriby.net/api/v1#identifiers).
- `abilities` is the gate strings only. Scope tuples (`scope:team:…`, `scope:project:…`) are split out into `scopes` for readability, so `abilities_count` counts real permissions rather than bookkeeping.
- The plaintext value is **never** returned here. Lose it and the only recovery is to revoke the token and mint another.

**Parameters**

- `token` (path, integer, required): One of the caller's tokens, resolved by the route binder.

