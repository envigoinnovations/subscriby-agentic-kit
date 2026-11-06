---
name: authentication
description: This skill should be used when the user asks to connect Claude to Subscriby, sign in, authenticate the server, whether Claude is signed in or which account the connection acts as, use or mint a personal access token, pick abilities, fix TOKEN_MISSING_ABILITY, or what the connection can do.
license: MIT
metadata:
  category: foundation
  catalogue: 2026-05-01
---

# Connecting to Subscriby

Two credentials open the same MCP server, and there are three roads to one. Pick the road by what the user wants the connection to be able to do, then prove the connection with `get_me`.

## The bundled server and the sign-in

The plugin declares `https://mcp.subscriby.net` as the server `subscriby`. Nothing is connected until the user signs in:

1. Run `/mcp` in Claude Code. The server appears as `subscriby` (under the plugin). Choose **Authenticate**.
2. The browser opens Subscriby. The user signs in if they are not already (two-factor and passkeys apply as usual), reads the consent screen, which names Claude Code, the account and the team, and presses **Authorize**.
3. Claude Code holds a short-lived access token and renews it silently; the tools appear in the session. Nothing is copied or typed.

What the connection can do: it acts as the user, on the team they had selected when they authorized, with every ability their role grants there, the same reach as the dashboard and the same tenant boundary. Every tool still enforces its own ability, and destructive tools still ask. An access token lasts an hour; the refresh token lasts thirty days from its last use and rotates on every renewal; disconnecting the server inside `/mcp` discards both.

If the user wants a connection that can only read, or only reach one project, the OAuth road is the wrong one: use a token.

## The token road

A personal access token is minted by the user under **Settings → API Tokens** in the dashboard (an existing token can also mint a narrower one with `create_token`, never a wider one, and never one that can mint tokens). It reads `sbt_live_<id>_<secret>` on production and `sbt_test_<id>_<secret>` on any other environment; a token minted in one environment is refused by the other; the plain text is shown once.

A token carries an explicit list of abilities (`entity:action`, catalogued in [references/abilities.md](references/abilities.md) and in the `tokens-and-abilities` skill) and is frozen to one team through `scope:team:<uuid>`, optionally to a list of projects through `scope:project:<uuid>`. The minting screen pre-selects nothing; help the user pick the least set:

- Research and figures only: the `*:view-any` and `*:view` abilities of the entities involved (`project:view-any`, `project:view`, `project-user:view-any`, `project-subscription:view-any`, `project-subscription-plan:view-any`, `dashboard:read`, `activity:read`), nothing else.
- A connection that may change things: add the exact write abilities the task needs, one entity at a time; never "everything".

Configure Claude Code with the token as a header on a second server, so the bundled OAuth server stays as it is:

```bash
claude mcp add --transport http subscriby-token https://mcp.subscriby.net --header "Authorization: Bearer sbt_live_YOUR_TOKEN"
```

Both servers expose the same tool names under different prefixes; while the token server is in use, disable the bundled `subscriby` server from `/mcp` so each tool exists once in the session, and re-enable it afterwards. Never paste a token into a file, a commit or a chat message; if one has been exposed, the user revokes it under Settings → API Tokens and mints a replacement.

## The agent road

An agent running without a browser beside it, which knows the creator's email address, registers itself and asks the creator to confirm (the auth.md profile, verbatim in [references/auth.md](references/auth.md)): it posts the address, its name and the abilities it needs to `https://app.subscriby.net/agent/identity`, shows the creator the six-digit code and the confirmation address it is handed, and polls the token endpoint with the claim grant until the creator has typed the code on a signed-in page. The answer is a personal access token for that team with exactly the abilities asked for (every read ability and no write when none were named); it works on the MCP server and the REST API and appears under Settings → API Tokens, where the creator can delete it. A code lasts ten minutes, five wrong codes end the request, and a registration not confirmed within thirty minutes lapses. Never register for a creator who has not asked, never retry a refused code.

## Prove the connection

- `get_me` answers the creator (id, name, email, locale), the platform plan and its capabilities, `current_team` (the team every other tool acts in), every team they belong to, the accounts linked on the connectors and where alerts go. Call it first in every session.
- `list_projects` confirms the team's reach; `list_teams` shows the other teams; a token's own row is `get_token`.
- Over REST the probe is `GET /v1/teams/current` (needs only `team:view`); `GET /v1/ping` needs nothing ([references/endpoints.md](references/endpoints.md)).

## When a tool refuses

- `AUTHENTICATION_REQUIRED`: no credential reached the server, the token was revoked, or an OAuth connection lapsed; sign in again from `/mcp`.
- `TOKEN_MISSING_ABILITY`: the error names the ability. With a token, the user mints one that carries it; with an OAuth connection, their team role lacks the permission and the team owner grants it. Never retry the call as it was.
- `RESOURCE_NOT_FOUND` on an id the user is sure of: the row belongs to another team than `current_team`, or lies outside the token's `scope:project:` list. Existence is never leaked across teams.
- `TEAM_TIER_REQUIRED`: teams, roles and groups need the Growth Plan.
- `RATE_LIMITED`: the MCP bucket is 120 calls a minute per credential; wait the `Retry-After` seconds. A tight loop is the usual cause.

## Revocation and hygiene

A personal access token does not expire on its own: it is revoked under Settings → API Tokens, and the next call from a client still holding it answers `AUTHENTICATION_REQUIRED`. An OAuth connection ends when the user disconnects the server inside `/mcp`; the access token it held expires within the hour. Every tool call is recorded in the activity log with the credential kind, readable with `get_activity_log` or under Settings → Activity Log, so an audit of what an agent did is one read away.

## References

- [references/auth.md](references/auth.md): the three roads with the exact requests, as the site serves it.
- [references/abilities.md](references/abilities.md): the account abilities; the full catalogue is in `tokens-and-abilities`.
- [references/tools.md](references/tools.md): `get_me`, `list_teams`, `get_team`, `list_tokens`, `get_token`.
- [references/endpoints.md](references/endpoints.md): `/v1/ping` and the `/v1/me` endpoints.
- Documentation: [MCP authentication](https://docs.subscriby.net/mcp/v1/authentication), [connecting Claude](https://docs.subscriby.net/mcp/v1/connecting-claude-desktop), [REST authentication](https://docs.subscriby.net/api/v1/authentication), [MCP security](https://docs.subscriby.net/mcp/v1/security), [troubleshooting](https://docs.subscriby.net/mcp/v1/troubleshooting).
