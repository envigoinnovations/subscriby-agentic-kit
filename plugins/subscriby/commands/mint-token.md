---
description: "Propose the least set of abilities a personal access token needs for a purpose, and the steps to mint it, without ever handling the token itself."
argument-hint: "[purpose, e.g. read-only analytics, a webhook subscriber, a support assistant]"
disable-model-invocation: true
---

Work out the smallest personal access token for the purpose `$ARGUMENTS` (ask for the purpose when it is empty), following the `tokens-and-abilities` skill.

1. Name the operations the purpose needs, read or write, entity by entity. Read `${CLAUDE_PLUGIN_ROOT}/skills/developers/tokens-and-abilities/references/abilities.md` and pick only the abilities those operations enforce; prefer `view-any` and `view` first and add a write ability only for an operation the purpose must perform. For a webhook subscriber, include the `required_ability` of each event family it subscribes to (the `webhook-events` reference lists them) and the endpoint abilities.
2. Decide the scope: the team (always one), and whether `scope:project:` entries should restrict the token to the projects the purpose touches. Say when a separate read token and write token would be safer.
3. Answer with: the ability list as a copy-ready block, one line per ability with why it is there; the team and project scope; `live` or `test`; and the dashboard steps: Settings → API Tokens → New token, tick exactly these, choose the team and the projects, copy the token once into the environment variable the client reads, never into the conversation. When the user holds a token with `token:create`, mention `create_token` as the alternative, with the same list and `team_id`.
4. Close with the probe that proves it (`GET /v1/teams/current`, or `get_me` on an MCP client) and the revocation path if it ever leaks.

Never ask the user for a token and never suggest granting every ability.
