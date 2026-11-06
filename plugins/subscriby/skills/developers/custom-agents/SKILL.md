---
name: custom-agents
description: This skill should be used when the user is building their own agent or automation on Subscriby, asks whether to use MCP or the REST API, wants an agent to register itself and get a token with the creator's confirmation, or asks how an agent should authenticate, write safely and be audited.
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Building an agent of your own on Subscriby

Subscriby is built for agents as much as for people: a REST API described by an OpenAPI document, an MCP server, signed webhooks, and a credential flow in which a creator confirms the agent with a code. The pieces an agent of your own uses, in order: a credential, a way to read, a way to write safely, webhooks for what changes, and the activity log that shows what the agent did.

## MCP or REST

- **MCP** when the agent runs on a model that speaks MCP (Claude and the clients in `mcp-clients`): typed tools, abilities enforced per tool, destructive tools flagged for confirmation, catalogues as resources, no OpenAPI layer to build.
- **REST** when inference runs elsewhere (OpenAI, Google, Mistral, a self-hosted model) or the agent is a workflow rather than a conversation: `https://api.subscriby.net/openapi.json` into a typed client (the `openapi-toolkits` skill), `Idempotency-Key` on every write, the error envelope for self-correction.
- Both share the token, the tenancy and the abilities; nothing is possible through one that the other forbids.

## The credential

Three roads, each ending with the creator saying yes ([references/auth.md](references/auth.md), the `authentication` skill):

1. **Agent registration**, when the agent knows the creator's email and has no browser: `POST https://app.subscriby.net/agent/identity` with `{"type": "service_auth", "login_hint": "<email>", "client_name": "<agent>", "scope": "<abilities, space-separated>"}` (leave `scope` out for every read ability and no write; a value not in the catalogue is `invalid_scope`); show the creator `claim.user_code` and `claim.verification_uri`; poll `https://app.subscriby.net/oauth/token` with `grant_type=urn:workos:agent-auth:grant-type:claim&claim_token=…` every `interval` seconds until the creator has typed the code (`authorization_pending`, `slow_down`, `expired_token` are the polling answers; a code lasts ten minutes, a registration thirty). The answer is a personal access token with exactly those abilities, listed on the creator's tokens page under the agent's name, deletable there.
2. **OAuth 2.1**, when the agent is an MCP client the creator connects interactively: dynamic registration at `/oauth/register` (a public client, PKCE S256), the consent screen, `mcp:use`, access tokens of an hour and rotating refresh tokens of thirty days.
3. **A personal access token** the creator mints under Settings → API Tokens and configures the agent with.

A registered agent's token and a personal access token work on REST and MCP; an OAuth token on MCP. Never register for a creator who has not asked, never retry a refused code, never store a plaintext token where a log or a repository can carry it.

## Read first, write later

Start with a read-only credential (`project:view-any`, `project:view`, `project-user:view-any`, `project-subscription:view-any`, `project-subscription-plan:view-any`, `dashboard:read`) and build the retrieval and summary pipeline; mint a second credential with the exact write abilities only when the write paths exist. Keeping the two apart limits the blast radius of a leak. In code, treat every operation the catalogue flags destructive as needing a human's yes: a confirmation step in the workflow, a ticket, a message to the creator.

## Observe and audit

Every REST call and MCP tool call is recorded in the activity log with the actor kind (`api_token`, `mcp`, a person, a webhook, the system); the creator reads it in the dashboard, over `GET /v1/activity` or with `get_activity_log`, so an agent's actions are always attributable. Subscribe the agent's own inbox to the events it reacts to (the `webhooks` and `webhook-events` skills) rather than polling, and poll only for state that fires no event.

## Discovery, for an agent that starts from nothing

`https://www.subscriby.net/AGENTS.md` is the briefing; `/.well-known/api-catalog` (RFC 9727) names the APIs; `/.well-known/mcp/server-card.json` the MCP server; `/.well-known/agent-skills/index.json` the three skills the site serves; `/.well-known/ai-catalog.json` the rest; `https://www.subscriby.net/auth.md` the credential walkthrough; every marketing page answers as Markdown with `.md` appended.

## Do not

- Do not call the dashboard or the portal from an agent; they are for people.
- Do not fabricate a payload field; the OpenAPI document and the event catalogue are the contract.
- Do not retry a 4xx that is not a 429, and never a refused destructive call.

## References

- [references/auth.md](references/auth.md): the credential walkthrough the site publishes at `https://www.subscriby.net/auth.md`, verbatim, with the exact requests of the three roads.
- Documentation: [building custom agents](https://docs.subscriby.net/integrations/custom-agents), [agent readiness](https://docs.subscriby.net/api/v1/agent-readiness), [MCP authentication](https://docs.subscriby.net/mcp/v1/authentication), [the prompting guide](https://docs.subscriby.net/mcp/v1/prompting-guide).
