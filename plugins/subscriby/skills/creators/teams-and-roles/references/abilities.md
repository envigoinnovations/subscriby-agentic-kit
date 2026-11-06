# Abilities: Teams and Roles

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An ability is `entity:action`; a token carries an explicit list and is frozen to one team. `enforced` means an endpoint or a tool checks it today; `pending` means it exists for a surface still to come; `no-api-surface` means it opens something in the dashboard or subscribes to events only; `deprecated` cannot be granted to a new token.

## `teams`

| Ability | Status | Note |
| --- | --- | --- |
| `team:view-any` | enforced |  |
| `team:view` | enforced |  |
| `team:create` | enforced |  |
| `team:update` | enforced |  |
| `team:delete` | enforced |  |
| `team-member:view-any` | enforced |  |
| `team-member:view` | enforced |  |
| `team-member:invite` | enforced |  |
| `team-member:remove` | enforced |  |
| `team-member:update-role` | enforced |  |

## `rbac`

| Ability | Status | Note |
| --- | --- | --- |
| `role:view-any` | enforced |  |
| `role:view` | enforced |  |
| `role:create` | enforced |  |
| `role:update` | enforced |  |
| `role:delete` | enforced |  |
| `group:view-any` | enforced |  |
| `group:view` | enforced |  |
| `group:create` | enforced |  |
| `group:update` | enforced |  |
| `group:delete` | enforced |  |

## `copilot`

| Ability | Status | Note |
| --- | --- | --- |
| `copilot:use` | no-api-surface | The team permission that opens Subscriby Copilot in the dashboard and the platform bot. The Copilot runs in-app and has no REST or MCP surface of its own; the MCP server is the door for outside agents. |
