<!-- Verbatim copy of skill-mcp.md as https://www.subscriby.net serves it; refreshed by npm run sync. -->

---
name: subscriby-mcp
description: Connect to the Subscriby MCP server over Streamable HTTP with OAuth 2.1 or a personal access token and run a creator's paid community through its tools.
---

# Subscriby MCP server

Endpoint `https://mcp.subscriby.net`: the Model Context Protocol over Streamable HTTP (JSON-RPC 2.0). Server card: `https://www.subscriby.net/.well-known/mcp/server-card.json`. Guide: https://docs.subscriby.net/mcp/v1. Tool catalogue with every tool's description and ability: `https://api.subscriby.net/mcp-tools.json`.

## Authenticate

Two credentials are accepted on the same endpoint, and there are three ways to obtain one:

1. **OAuth 2.1**, what Claude, ChatGPT, Cursor and VS Code use: authorization code with PKCE (S256), dynamic client registration and the scope `mcp:use`. Start from the protected-resource metadata at `https://mcp.subscriby.net/.well-known/oauth-protected-resource`, which names the authorization server; its metadata (`/.well-known/oauth-authorization-server`, also at `/.well-known/openid-configuration`) names the authorization, token and registration endpoints. The connection acts as the signed-in creator on the team they work in and refreshes itself.
2. **A personal access token** (`sbt_…`) as `Authorization: Bearer`, minted by the creator with only the abilities the agent needs; start with the `…:view-any` and `…:view` abilities and add writes as the work requires.
3. **Agent registration** (the auth.md profile), when the agent knows the creator's email address but no human is at a browser beside it: `POST https://app.subscriby.net/agent/identity` with `{"type": "service_auth", "login_hint": "<creator email>", "client_name": "<agent>", "scope": "<ability values, space-separated>"}` (leave `scope` out for every read ability and no write; a value not in `https://api.subscriby.net/abilities.json` is refused as `invalid_scope`), show the creator the `claim.user_code` and `claim.verification_uri` from the answer, then poll the token endpoint with `grant_type=urn:workos:agent-auth:grant-type:claim` and the `claim_token` every `interval` seconds until the creator has typed the code on the signed-in page, which lists the abilities you asked for. The answer is a personal access token for the creator's team with exactly those abilities, so it is the second credential by another road; the creator can delete it under Settings → API Tokens.

All three, with the discovery steps, the requests and the revocation rules, are walked through in prose at `https://www.subscriby.net/auth.md`.

## Work

- The server publishes 240 tools and 6 resources. `tools/list` returns the whole catalogue in one page; the resources are catalogues (abilities, error codes, connectors, payment providers, subscription statuses, webhook events) worth reading once.
- Every tool is gated by one ability. A refusal names the missing ability: ask the creator to grant it rather than retrying.
- A tool flagged `destructiveHint=true` in the listing (every change or removal of data that already exists: updates, cancellations, deletions, revocations, secret rotation) must be confirmed with a human before it runs: state the call, the target and the side effects, then wait. A create, an invitation, a reminder, a retry and a test delivery carry `destructiveHint=false`; a read carries `readOnlyHint=true`.
- Long-running work is handed back as a job to poll: https://docs.subscriby.net/mcp/v1/async-jobs.

## Related

- The same operations over REST, with the OpenAPI document: https://docs.subscriby.net/api/v1 (skill `subscriby-rest-api`).
- Webhooks for events you would otherwise poll for: https://docs.subscriby.net/webhooks/v1 (skill `subscriby-webhooks`).
