# Subscriby AGENTS.md

> Subscriby runs paid memberships for creators' communities on connected platforms. This file is the briefing for an agent that works with it: the surfaces, the way in, the rules every surface shares, what needs a human, and where the longer documents are. Every address, count and limit here is read from the running service.

## Scope

This file covers the public surfaces of Subscriby as a service: the REST API at https://api.subscriby.net/v1, the MCP server at https://mcp.subscriby.net, the outbound webhooks, and the discovery documents on https://www.subscriby.net. It is not a source repository; there is nothing to install, build or test. The creator dashboard and the member portal are for people and are not for agents to drive.

## What Subscriby is

A creator connects a community platform, publishes plans, and Subscriby runs the subscriber lifecycle: payment through the creator's own gateway, admission, renewals, reminders and removal. Everything the dashboard does is also an API operation, an MCP tool and, where something changes, a webhook event. The marketing site describes the product for language models at https://www.subscriby.net/llms.txt and lists every page at https://www.subscriby.net/sitemap.md; any page is served as Markdown at its address with .md appended or to a request whose Accept header prefers text/markdown.

## Agent access

Every credential belongs to a creator and acts as that creator on one team. Three ways lead to one, each ending with the creator saying yes; https://www.subscriby.net/auth.md walks all three with the exact requests:

1. **Agent registration.** You know the creator's email and have no browser: POST https://app.subscriby.net/agent/identity with `{"type": "service_auth", "login_hint": "<creator email>", "client_name": "<you>", "scope": "<ability values, space-separated>"}`, show the creator the code and the page address you are handed, then poll the token endpoint with `grant_type=urn:workos:agent-auth:grant-type:claim` until they have confirmed. Leave `scope` out to receive every read ability and no write.
2. **OAuth 2.1.** You are an MCP client the creator connects interactively: start from https://mcp.subscriby.net/.well-known/oauth-protected-resource, register dynamically, use PKCE (S256) and the scope `mcp:use`; the creator approves you once in a browser at https://app.subscriby.net.
3. **A personal access token.** The creator mints one at https://app.subscriby.net/settings/tokens with only the abilities you need and configures you with it.

A credential travels as `Authorization: Bearer <token>`. A personal access token (`sbt_…`) works on the REST API and the MCP server; an OAuth token works on the MCP server. Abilities are listed at https://api.subscriby.net/abilities.json; ask for the least you need.

## REST API

Base URL https://api.subscriby.net/v1, described by the OpenAPI 3.1 document at https://api.subscriby.net/openapi.json and the guide at https://docs.subscriby.net/api/v1. Lists are paged (`page`, `per_page` up to 100), newest first; follow `links.next`. Every POST, PATCH, PUT and DELETE needs an `Idempotency-Key` header, a fresh UUID per distinct operation, honoured for 24 hours. An error is `{"error": {"code", "message", "docs_url", "request_id"}}`; branch on `code`. Limits are 300 requests a minute and 10,000 an hour per token; on a 429, wait `Retry-After` seconds.

## MCP server

https://mcp.subscriby.net speaks the Model Context Protocol over Streamable HTTP with 238 tools and 6 resources, each tool gated by one ability. Every tool's description and ability is at https://api.subscriby.net/mcp-tools.json and the server card at https://www.subscriby.net/.well-known/mcp/server-card.json. A tool flagged `destructiveHint: true` must be confirmed with a human before it runs. Long-running work comes back as a job to poll.

## Webhooks

191 event types, each behind the ability that reads the family it belongs to, delivered with the `SB-Signature` HMAC header and a Web Bot Auth signature, retried 8 times with backoff; the guide is at https://docs.subscriby.net/webhooks/v1. Verify the signature before trusting a payload, and answer 2xx quickly.

## Conventions

- Prefer the Markdown twin of a page (`.md`) or Markdown negotiation over scraping HTML.
- Read counts, abilities, events and tools from the catalogues at https://api.subscriby.net; never hard-code them.
- Send one `Idempotency-Key` per distinct write and reuse it only to retry that write.
- Retry a 429 after `Retry-After` and a 5xx with backoff; never retry a 4xx that is not a 429.
- Quote `request_id` when reporting a problem.

## Safety and approvals

- Confirm with a human before any tool or endpoint that changes or removes existing data: updates, cancellations, deletions, revocations, secret rotation, refunds.
- Ask for the narrowest abilities; a token with every ability is a creator's whole account.
- Tokens are never minted over MCP, and a leaked token is revoked by the creator at https://app.subscriby.net/settings/tokens.
- Members' data belongs to the creator's community; read what the task needs and nothing more.

## Don't

- Don't store a plaintext token anywhere a log or a repository could carry it.
- Don't call the dashboard or portal hosts, or submit their forms; they are for people.
- Don't register for a creator who has not asked you to, and don't retry a refused code.
- Don't fabricate a payload field: the OpenAPI document and the webhook catalogue are the contract.

## Agent skills and further reading

- Skills: https://www.subscriby.net/.well-known/agent-skills/index.json (REST API, MCP server, webhooks; one SKILL.md each).
- Claude Code: the Agentic Kit, a plugin marketplace with a skill for every job a creator, a developer or a connector author brings, slash commands, read-only subagents, a guard on every destructive tool and the MCP server bundled: `/plugin marketplace add envigoinnovations/subscriby-agentic-kit` then `/plugin install subscriby@envigo` (https://docs.subscriby.net/integrations/agentic-kit); other agents take the skills alone with `npx skills add envigoinnovations/subscriby-agentic-kit`.
- Credentials: https://www.subscriby.net/auth.md.
- Discovery: https://www.subscriby.net/.well-known/api-catalog (API catalog), https://www.subscriby.net/.well-known/agent-card.json (A2A agent card), https://www.subscriby.net/.well-known/mcp/server-card.json (MCP server card), https://www.subscriby.net/.well-known/ai-catalog.json (capability manifest).
- Documentation: https://docs.subscriby.net; for language models https://www.subscriby.net/llms.txt; every page https://www.subscriby.net/sitemap.md.