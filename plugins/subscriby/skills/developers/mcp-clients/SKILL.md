---
name: mcp-clients
description: "This skill should be used when the user asks how to connect Subscriby to claude.ai, Claude Desktop, Cursor, ChatGPT Desktop, VS Code or another MCP client, how the OAuth handshake works, what the MCP resources are, how async tools are polled, the MCP limits, or why a client cannot connect."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Connecting any MCP client

`https://mcp.subscriby.net` is the Model Context Protocol over Streamable HTTP (JSON-RPC 2.0). Two credentials work on the same endpoint: an OAuth 2.1 sign-in (what Claude, ChatGPT, Cursor and VS Code use; the connection acts as the creator on the team selected at consent) or a personal access token (`Authorization: Bearer sbt_…`, only the abilities the creator ticked). In Claude Code this plugin already declares the server; this skill is for every other client and for the protocol's own facts.

## Per client

- **claude.ai and Claude Desktop**: Settings → Connectors → Add custom connector, name `Subscriby`, URL `https://mcp.subscriby.net`, Connect, sign in, Authorize. Connectors are shared across claude.ai and Desktop on one account. A token instead: Claude Desktop's config file speaks stdio, so bridge with `mcp-remote` and hand the token to the bridge through its environment entry rather than inline in the command (on Windows `npx` splits an inline `Bearer <token>` on the space); the documentation page shows the entry.
- **Claude Code without the plugin**: `claude mcp add --transport http subscriby https://mcp.subscriby.net`, then `/mcp` → Authenticate; a token as `--header "Authorization: Bearer sbt_live_…"`.
- **Cursor**: Cursor's MCP settings file (the global one under the user's Cursor folder, or a workspace one) with `{"mcpServers": {"subscriby": {"url": "https://mcp.subscriby.net"}}}`, restart, Settings → MCP → the entry shows Needs login → sign in; a token as a `headers.Authorization` value.
- **ChatGPT Desktop**: Settings → Connectors → Create (developer mode), name `Subscriby`, the URL exactly, Authentication OAuth; a token as No authentication plus a custom `Authorization` header.
- **VS Code**: MCP: Add Server → HTTP → the URL, name `subscriby`, written to `.vscode/mcp.json` or the user profile; VS Code asks to authenticate; a token as a `headers` entry, preferably through an input variable in a committed workspace file.

The URL must be exactly `https://mcp.subscriby.net`, no trailing slash or path: a client compares it to the address the server publishes and refuses a mismatch before any sign-in page appears.

## Under the hood

An unauthenticated call answers `401` with `WWW-Authenticate: Bearer resource_metadata="https://mcp.subscriby.net/.well-known/oauth-protected-resource", scope="mcp:use"`; the protected-resource metadata names `https://app.subscriby.net` as the authorization server, whose metadata (`/.well-known/oauth-authorization-server`, also at `/.well-known/openid-configuration`) lists the authorization, token and registration endpoints, PKCE `S256` only and the one scope `mcp:use`. Clients register dynamically as public clients; an access token lasts an hour and the refresh token thirty days from its last use, rotated on every renewal. The server card at `https://www.subscriby.net/.well-known/mcp/server-card.json` carries the endpoint, the protocol versions and the counts for a client that discovers before it connects.

## The surface

- Tools: every operation the dashboard offers, each gated by one ability; `tools/list` returns the whole catalogue in one page; every tool carries `title`, `readOnlyHint` for a read, `destructiveHint` true for a change or removal of existing data and false for an additive write, so a client can ask before a destructive one.
- Resources: `subscriby://connectors/catalog`, `subscriby://enums/ability`, `subscriby://enums/error-code`, `subscriby://enums/payment-provider`, `subscriby://enums/subscription-status`, `subscriby://enums/webhook-event` ([references/resources.md](references/resources.md)); read-only JSON keyed by its own collection name, no shared envelope, no version field (the `{version, count, items[]}` envelope belongs to the HTTP catalogues at `api.subscriby.net/*.json`).
- No prompts are published.
- Async: a tool that answers a `job_id` (`bulk_generate_access_codes`, `request_account_export`, a channel revert) has not finished; poll `get_job_status` every second for ten seconds, then every five, then every thirty, until `completed` or `failed`; job ids are stable across sessions for the same creator.
- Limits: tool calls are capped at 120 a minute per credential, unauthenticated probes at 5 a minute per IP, the OAuth discovery documents and registration at 60 a minute per IP. `RATE_LIMITED` carries `Retry-After`.
- CORS: `Access-Control-Allow-Origin: *` with bearer auth and no cookies, for browser-based clients.

## Troubleshooting

- Never asked to sign in: the URL is not exact, or a proxy rewrites `app.subscriby.net/.well-known/…`.
- An empty tool list with a token: the token lacks the abilities; with an OAuth connection, the handshake failed, read the client's MCP log.
- A `403` on one tool with a token: `error.context.required_ability` names what to mint; with OAuth the team role lacks the permission.
- A `404`: the id is outside the credential's team or project list, or does not exist.
- A `401` after hours of chat: the refresh lapsed; disconnect and connect again.
- The agent loops asking for confirmation: the client auto-denies writes; toggle auto-approve for the namespace, keeping confirmation on destructive tools.

## Do not

- Do not add a path or a slash to the URL.
- Do not put a token inline in a config file that is committed; use an environment variable or an input variable.
- Do not expect prompts or a shared envelope on resources.

## References

- [references/resources.md](references/resources.md): the six resources.
- [references/tools.md](references/tools.md): `get_job_status`.
- [references/skill-mcp.md](references/skill-mcp.md): the skill the site publishes, verbatim.
- Documentation: [the MCP guide](https://docs.subscriby.net/mcp/v1), [quickstart](https://docs.subscriby.net/mcp/v1/quickstart), [Claude](https://docs.subscriby.net/mcp/v1/connecting-claude-desktop), [Cursor](https://docs.subscriby.net/mcp/v1/connecting-cursor), [ChatGPT Desktop](https://docs.subscriby.net/mcp/v1/connecting-chatgpt-desktop), [VS Code](https://docs.subscriby.net/mcp/v1/connecting-vscode-claude), [resources](https://docs.subscriby.net/mcp/v1/resources-reference), [async jobs](https://docs.subscriby.net/mcp/v1/async-jobs), [troubleshooting](https://docs.subscriby.net/mcp/v1/troubleshooting).
