---
name: openapi-toolkits
description: "This skill should be used when the user wants to drive Subscriby from Make, LangChain or another OpenAPI agent toolkit, import the API into Postman or Insomnia, generate a typed client with openapi-generator, Stainless, Speakeasy or Fern, or asks what the OpenAPI document carries."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# The OpenAPI document and the toolkits built on it

Subscriby publishes one machine-readable description of the whole API and regenerates it on every deploy, so anything built from it (a Postman collection, a Make scenario, a LangChain toolkit, a generated SDK) describes the API as it is. The `rest-api` skill carries the contract itself; this skill is how to feed the document to tools.

## The document

| URL | What it is |
| --- | --- |
| `https://api.subscriby.net/openapi.json` | OpenAPI 3.1 for every operation and every outbound webhook event, generated from the code (validation rules, resources, return types, the event catalogue) with the prose kept beside that code |
| `https://api.subscriby.net/postman.json` | The same document as a Postman collection (Collection Format v2.1) |
| `https://api.subscriby.net/postman-environment.json` | Its environment: `baseUrl`, and `token` and `webhookSecret` as secrets |
| `https://api.subscriby.net/abilities.json` | The ability catalogue, for a token-minting UI |
| `https://api.subscriby.net/.well-known/ai-plugin.json` | The manifest that points an agent at the document |

What it carries: `paths`, each operation with a summary, a description covering tenancy, behaviour and refusals, every parameter and field with type and constraints, the error envelope on each failure status, and examples; `webhooks`, one entry per event keyed by name, described as the `POST` an endpoint receives, with the signed envelope, the `data` object field by field, named examples and the `SB-*` headers; `components.securitySchemes.bearerToken`; `servers` with `https://api.subscriby.net` alone. Every operation carries three vendor extensions and every webhook entry the first: `x-required-scopes` (the abilities the token must hold; on a webhook, the ability needed to subscribe to it), `x-webhook-events` (what the operation can fire) and `x-mcp-tools` (the MCP tools that wrap it). The documentation's API reference and event reference are rendered from this same document, so a page and a generated client never disagree.

## Postman and Insomnia

1. Postman → Import → paste the collection URL, then the environment URL the same way. Select the **Subscriby REST API** environment and paste the token into its `token` variable; the token lives in the environment, never in the collection, so the collection can be shared.
2. Send **Projects → List projects**; every request inherits `Authorization: Bearer {{token}}`.
3. Create something: the test script captures the new id into a variable such as `projectId`, and the requests below send it, so a folder runs top to bottom. Paste an existing id into the variable to work on a record you already have. Optional query parameters are present and unticked.

Each request carries a worked body in the shape the field descriptions prescribe, one saved response per documented status (the success shape, and each failure as the error envelope with its code, message and remediation), `Idempotency-Key: {{$guid}}` on every write (pin it to a fixed value to replay the original `2xx` instead of repeating the write), tests asserting the status and the `data` envelope (so the collection doubles as a smoke test in the Collection Runner or Newman), and a description ending with the abilities, the events it fires and the MCP tools, read from the three extensions.

The **Webhooks · simulated deliveries** folder posts every event's documented payload to `{{webhookReceiverUrl}}` with the real headers, and a pre-request script computes `SB-Signature` from `{{webhookSecret}}` exactly as the API does, so a handler under development sees a delivery it cannot tell from a real one. Set the two variables, send **Webhooks → Plan → plan.created**, and anything but a `2xx` is what a retry looks like in production.

Insomnia imports both files (Create → Import → URL) and the environment the same way. The raw OpenAPI document also imports as a Design Document, browsable by tag; it carries no scripts, so add a Before-Request script that sets `Idempotency-Key: {% uuid 'v4' %}`. Both files keep a stable id, so a re-import after a deploy replaces the previous copy instead of adding a second one.

## Make (Integromat)

Make has no native Subscriby app; its **HTTP** and **Webhooks** modules reach every route.

- **Inbound**: a **Webhooks → Custom webhook** listener at the top of the scenario. Register its URL as an endpoint in Subscriby (`create_webhook_endpoint`, or Settings → Webhooks) and keep the secret. Verify `SB-Signature` in a Serverless JavaScript module over `context.raw`, never `context.body`: Make normalises JSON bodies, and a signature over re-serialised JSON fails. The check is HMAC-SHA256 of `<t>.<raw body>` compared in constant time with the timestamp within tolerance, as the `webhooks` skill's verifiers do.
- **Outbound**: an **HTTP → Make a request** module with `https://api.subscriby.net/v1/<path>`, the verb the operation needs, `Authorization: Bearer sbt_…` and `Idempotency-Key: {{uuid}}`, body type JSON for writes.

Typed triggers and actions without HTTP modules are what the `zapier` and `n8n` skills cover.

## LangChain and other OpenAPI agents

LangChain's OpenAPI toolkit (Python and TypeScript) turns the document into tools an agent calls: in Python, `planner.create_openapi_agent(api_spec=spec, requests_wrapper=RequestsWrapper(headers={"Authorization": "Bearer …"}), llm=…, allow_dangerous_requests=True)`; in TypeScript, `createOpenAPIAgent({ spec, llm, requestOptions: { headers: { Authorization: "Bearer …" } } })`. Three rules the toolkits do not apply on their own:

- **Idempotency**: nothing injects `Idempotency-Key`. Wrap the request layer so every `POST`, `PATCH`, `PUT` and `DELETE` sets a fresh UUID (a session hook, or a thin subclass of the requests wrapper), and retry a `429` after `Retry-After`.
- **Narrowing**: the planner loads every operation. For a scoped agent, filter `spec["paths"]` to an allow-list of paths before building the toolkit, and drop the write operations entirely for an agent that should only read. A token holding only the read abilities makes the narrowing enforceable rather than advisory.
- **Confirmation**: an operation whose MCP twin is flagged destructive (a cancellation, a deletion, a ban, a rotation, a refund) needs a human's yes in the agent's loop; `x-mcp-tools` names the twin and the tool catalogue carries the flag.

A Claude-family model should connect to the MCP server instead (the `mcp-clients` and `custom-agents` skills): typed responses, abilities enforced per tool, no OpenAPI layer to build.

## Code generation

Use the raw document, never the collection, as input to `openapi-generator` (open source, many languages) or to Stainless, Speakeasy or Fern (commercial SDKs). `x-required-scopes` survives as a comment on each generated operation. Generate the webhook payload types from the `webhooks` object as well, so a renamed field is a compile error rather than a silent `undefined`. Regenerate after a Subscriby deploy: additive changes (a new field, a new operation, a new enum case) are the only ones `v1` ships, so a regenerated client keeps compiling.

## Do not

- Do not import the collection for code generation, or the raw document when the collection's worked bodies and scripts are what is wanted; each file has its purpose.
- Do not verify a webhook signature against a re-serialised body, in Make or anywhere else.
- Do not hand a write-capable token to an agent toolkit without a confirmation step on the destructive operations.
- Do not hand-write a client from memory; the document and the `rest-api` skill's endpoint reference are the contract.

## References

- Documentation: [OpenAPI specification](https://docs.subscriby.net/api/v1/openapi), [Postman and Insomnia](https://docs.subscriby.net/integrations/postman-insomnia), [Make](https://docs.subscriby.net/integrations/make), [LangChain](https://docs.subscriby.net/integrations/langchain), [API reference](https://docs.subscriby.net/api/v1/reference), [event reference](https://docs.subscriby.net/webhooks/v1/events).
- Related skills: `rest-api` for the contract, `webhooks` for the receiver, `custom-agents` for an agent of your own, `zapier` and `n8n` for the native integrations.
