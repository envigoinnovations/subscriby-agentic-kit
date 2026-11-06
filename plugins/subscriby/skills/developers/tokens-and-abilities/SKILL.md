---
name: tokens-and-abilities
description: "This skill should be used when the user asks which abilities a token needs, how to mint or scope a personal access token, what the sbt_ format is, how team and project scope work, how to rotate or revoke a token, or why a call answers TOKEN_MISSING_ABILITY or TENANT_MISMATCH."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Personal access tokens and abilities

A personal access token is the credential for scripts, workflows, Zapier, n8n and any client the creator configures with a secret; it works on the REST API and the MCP server. It carries an explicit list of abilities and is frozen to one team. The creator mints it under Settings → API Tokens; a token that holds `token:create` can mint a narrower one (`create_token`, `POST /v1/tokens`).

## The format

`sbt_<env>_<id>_<secret>`: `live` on production, `test` on any other environment (a token minted in one is refused by the other as `AUTHENTICATION_REQUIRED`); `<id>` the row's key for an O(1) lookup; `<secret>` 64 hex characters, the only secret part, stored hashed. The plaintext is shown once at creation and never again. A token does not expire on its own; the `sbt_` prefix is registered with secret scanning, so a leak into a public repository is flagged.

## Abilities

`<entity>:<action>`: most entities carry `view-any`, `view`, `create`, `update`, `delete`; `team-member` has `invite`, `remove`, `update-role`; `webhook-delivery` has `view-any` and `retry`; a few are plain reads or writes (`account:read`, `account:write`, `account:export`, `dashboard:read`, `distribution:read`, `activity:read`, `broadcast:read`, `broadcast:send`). An ability means the same on both transports: a tool requires exactly what its REST twin does, so mint for the operations, not for the channel. There is no channel ability: `mcp:full` was removed and `webhook-endpoint:manage` is retired (still honoured where held, refused on a new token).

The catalogue with every ability's status is [references/abilities.md](references/abilities.md): `enforced` (a live endpoint or tool checks it), `pending` (the surface is still to come), `no-api-surface` (opens something in the dashboard or subscribes to events only: `billing:read`, `billing:manage`, `copilot:use`), `deprecated`.

## Scope

- `scope:team:<uuid>` is frozen at mint time and mandatory; the dashboard adds it, and a hand-crafted token without it fails every request with `TENANT_MISMATCH`. Rotating the creator's current team never widens an existing token.
- `scope:project:<uuid>` entries restrict the token to a list of projects; anything outside answers `TENANT_MISMATCH` as a 404, so existence is never leaked.
- A team member's token is bounded by their role: it never carries an ability the role does not grant.

## Least privilege, by job

| Job | Abilities |
| --- | --- |
| Read-only analytics and research | `project:view-any`, `project:view`, `project-user:view-any`, `project-subscription:view-any`, `project-subscription-plan:view-any`, `dashboard:read`, `activity:read` |
| A webhook subscriber (Zapier, n8n, a receiver) | `team:view`, the `view-any` of the families it subscribes to (the event's `required_ability`), `webhook-endpoint:create`, `webhook-endpoint:view-any`, `webhook-endpoint:delete` |
| A support assistant | `support-conversation:view-any`, `support-conversation:view`, `support-conversation:update`, `support-canned-reply:view-any`, `project-user:view-any`, `project-user:view` |
| An access-code issuer | `project-subscription-plan:view-any`, `project-access-code:create`, `project-access-code:view-any` |
| An operator that may change plans and members | the `create`, `update` and `delete` of exactly those entities, added one at a time |

Keep a read token and a write token apart; a leaked read token shows what the dashboard shows and changes nothing.

## Minting, attenuation, revocation

- The dashboard pre-selects no ability; the creator ticks each. `create_token` (`name`, `abilities`, `team_id`) and `POST /v1/tokens` mint from a token that holds `token:create`: the abilities must be a subset of the caller's, `token:create` itself is never inherited, and the team becomes the frozen scope.
- `list_tokens` and `get_token` read the caller's rows without the plaintext; `revoke_token` and `DELETE /v1/tokens/{id}` revoke at once (`AUTHENTICATION_REQUIRED` on the next call).
- Rotation is manual: mint a replacement with the same abilities, deploy it, revoke the old one. The leaked-credential playbook: revoke, read the activity log for the last 24 hours under the token, contact support with the token id if unauthorised writes happened, mint a replacement, update the client.
- Confirm a token with `GET /v1/teams/current` (needs only `team:view`) or `get_me` over MCP.

## Do not

- Do not ask the user to paste a token into the conversation, a file or a commit.
- Do not grant every ability to save a round trip; a token with every ability is the creator's whole account.
- Do not mint through MCP when a dashboard mint with the right scope takes a minute; and never grant `token:create` casually.

## References

- [references/abilities.md](references/abilities.md): the full catalogue by category with each ability's status.
- [references/tools.md](references/tools.md): `list_tokens`, `get_token`, `create_token`, `revoke_token`.
- [references/endpoints.md](references/endpoints.md): the `/v1/tokens` endpoints.
- Documentation: [authentication](https://docs.subscriby.net/api/v1/authentication), [the ability catalogue](https://docs.subscriby.net/api/v1/abilities), [tenancy and scopes](https://docs.subscriby.net/api/v1/tenancy-and-scopes), [MCP security](https://docs.subscriby.net/mcp/v1/security).
