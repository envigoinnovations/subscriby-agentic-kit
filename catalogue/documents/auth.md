# Subscriby auth.md

Written for agents. Subscriby runs paid memberships for creators' communities. Its REST API is at https://api.subscriby.net/v1, its MCP server at https://mcp.subscriby.net, and the authorization server for both is https://app.subscriby.net. Every address, scope, limit and lifetime below is read from the running application; the protected resource metadata at https://mcp.subscriby.net/.well-known/oauth-protected-resource is authoritative if anything here disagrees with it.

## Who gets a credential

A credential always belongs to a creator, a person with a Subscriby account, and the agent holding it acts as that creator on one team. Three ways lead there, and each ends with the creator saying yes: you may register yourself by naming the creator's email and having them confirm a short code (the agent registration below), an MCP client may be connected through OAuth 2.1 on a consent screen, or the creator may mint a personal access token by hand. There is no anonymous registration, no identity assertion from a provider (ID-JAG) and no account created for an agent; a person opens the account at https://www.subscriby.net first.

## Discover

1. Call https://mcp.subscriby.net without a credential. The `401` carries `WWW-Authenticate: Bearer resource_metadata="https://mcp.subscriby.net/.well-known/oauth-protected-resource", scope="mcp:use"`.
2. GET https://mcp.subscriby.net/.well-known/oauth-protected-resource answers the protected resource metadata: `resource`, `resource_name`, `authorization_servers`, `scopes_supported` (`mcp:use`) and `bearer_methods_supported` (`header`).
3. GET https://app.subscriby.net/.well-known/oauth-authorization-server answers the authorization server metadata, also served at `/.well-known/openid-configuration`: the OAuth fields (`authorization_endpoint`, `token_endpoint`, `registration_endpoint`, `response_types_supported` with `code`, `code_challenge_methods_supported` with `S256`, `grant_types_supported`, `scopes_supported`) and the `agent_auth` block: `identity_endpoint` (also named `register_uri`), `claim_endpoint` (also `claim_uri`), `identity_types_supported` (`service_auth` and `identity_assertion`), `identity_assertion.assertion_types_supported` (`verified_email` only) and `credential_types_supported` (`access_token`). `events_supported` is empty: no event endpoint is served.

## Pick a method

| If you | Use |
| --- | --- |
| know the creator's email and have no browser of your own | agent registration (below): the creator confirms a code you show them, and you collect a token |
| are an MCP client the creator connects interactively (Claude, ChatGPT, Cursor, VS Code) | OAuth 2.1: the creator approves you once in a browser |
| are a script, a workflow or an agent the creator configures with a secret | a personal access token the creator mints |

Every credential travels as `Authorization: Bearer <token>`. A registered agent's token and a personal access token work on the MCP server and the REST API; an OAuth token works on the MCP server.

## Register as an agent

### 1. Register

```http
POST https://app.subscriby.net/agent/identity
Content-Type: application/json

{"type": "service_auth", "login_hint": "creator@example.com", "client_name": "<your agent>", "scope": "project:view-any project-user:view-any"}
```

The older shape is accepted too: `{"type": "identity_assertion", "assertion_type": "verified_email", "assertion": "creator@example.com"}`. No credential is needed. `scope` is optional: a space-separated list of ability values from https://api.subscriby.net/abilities.json, each one a token can be minted with. Leave it out and the token carries every ability that only reads (the `view-any`, `view` and `read` actions) and no write, so ask for a write explicitly when you need one. One address may start 10 registrations an hour and one creator's email may be named 10 times an hour. The answer:

```json
{
  "registration_id": "reg_…",
  "registration_type": "service_auth",
  "claim_url": "https://app.subscriby.net/agent/identity/claim",
  "claim_token": "clm_…",
  "claim_token_expires": "<ISO 8601, 30 minutes from now>",
  "post_claim_scopes": ["<the abilities the token will carry: what scope asked for, or every read ability>"],
  "claim": {"user_code": "123456", "verification_uri": "https://app.subscriby.net/agent/claim?claim_attempt_token=…", "expires_in": 100, "interval": 5}
}
```

Keep `claim_token`; it is shown once. `"type": "anonymous"` answers `400 anonymous_not_enabled`, any assertion type but `verified_email` answers `400 unsupported_assertion_type`, a `login_hint` that is not an address answers `400 invalid_request`, and a `scope` value that is not a mintable ability answers `400 invalid_scope`.

### 2. Show the creator the code

Tell the creator to open `claim.verification_uri` (they sign in to Subscriby if they are not) and type `claim.user_code`. The page names you by your `client_name`, lists the abilities the token will carry, says which team it will act in, and tells them the token will appear on their tokens page. The signed-in account must be the one you named; the page refuses any other without saying which address it was. The code lasts 10 minutes and 5 wrong codes end the registration. When the code has run out, ask for a new one:

```http
POST https://app.subscriby.net/agent/identity/claim
Content-Type: application/json

{"claim_token": "clm_…", "email": "creator@example.com"}
```

The answer carries a fresh `claim_attempt` block (also under `claim`) with a new code and a new address. `400 claim_expired` means the 30 minutes are over or too many codes were wrong: register again. `400 email_mismatch` means the address is not the one you registered, `400 claimed_or_in_flight` that the creator already confirmed and you should poll.

### 3. Collect the token

Poll the token endpoint every `interval` seconds with the claim grant:

```http
POST https://app.subscriby.net/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:workos:agent-auth:grant-type:claim&claim_token=clm_…
```

`400 authorization_pending` until the creator confirms, `400 slow_down` when you poll faster than the interval, `400 expired_token` once the 30 minutes are over or the token was already collected. The one successful answer:

```json
{"access_token": "sbt_…", "token_type": "Bearer", "scope": "<the abilities, space-separated>", "registration_id": "reg_…"}
```

The token is a personal access token: it carries exactly the abilities `post_claim_scopes` listed, acts as the creator on the team they were working in when they confirmed, does not expire on its own, has no refresh token, and is listed on the creator's tokens page under your name marked "(agent registration)", where they can delete it. There is no assertion to exchange: the token is the credential.

## OAuth 2.1, approved by the creator

### 1. Register a client

```http
POST https://app.subscriby.net/oauth/register
Content-Type: application/json

{"client_name": "<your agent>", "redirect_uris": ["https://agent.example/callback"]}
```

No credential is needed. `redirect_uris` must be absolute `https` addresses (or `http` on localhost), or addresses on the private-use schemes native clients register (`cursor`, `vscode`, `vscode-insiders`, `windsurf`). The answer is `201` with `client_id`, `grant_types`, `response_types` (`["code"]`), `redirect_uris`, `scope` (`mcp:use`) and `token_endpoint_auth_method` (`none`): a public client, so PKCE is required and there is no client secret. A `400` with `invalid_redirect_uri` or `invalid_client_metadata` names what was refused.

### 2. Send the creator to approve

```
https://app.subscriby.net/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<one of yours>&scope=mcp:use&state=<random>&code_challenge=<S256 of your verifier>&code_challenge_method=S256
```

The creator signs in and approves on Subscriby's consent screen; nothing is granted without them. Your redirect URI receives `code` and `state`.

### 3. Exchange the code

```http
POST https://app.subscriby.net/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&client_id=<client_id>&code=<code>&redirect_uri=<the same>&code_verifier=<your verifier>
```

The answer carries `access_token`, `refresh_token`, `expires_in` and `token_type` (`Bearer`). An access token lives 1 hour; refresh it at the same endpoint with `grant_type=refresh_token&refresh_token=<token>&client_id=<client_id>`. The token acts as the creator on the team they are working in and satisfies every ability in the catalogue; a creator who belongs to no team is refused as `TENANT_MISMATCH`.

## A personal access token, minted by the creator

The creator opens https://app.subscriby.net/settings/tokens, picks the abilities the agent needs (the catalogue is at https://docs.subscriby.net/api/v1/abilities), the team the token is bound to and, optionally, the projects it may see, then copies the token once. It starts with `sbt_`, carries only those abilities and never widens. A token that holds `token:create` can also mint one with `POST https://api.subscriby.net/v1/tokens`.

## Use the credential

- REST: `Authorization: Bearer sbt_…` on https://api.subscriby.net/v1, `300` requests a minute and `10,000` an hour per token, an `Idempotency-Key` on every write (remembered for 24 hours). The OpenAPI document is https://api.subscriby.net/openapi.json and the guide https://docs.subscriby.net/api/v1.
- MCP: the same header on https://mcp.subscriby.net, the Model Context Protocol over Streamable HTTP (JSON-RPC 2.0, protocol version `2026-07-28`), with any of the three credentials. The guide is https://docs.subscriby.net/mcp/v1.

## Errors

| Answer | Meaning | What to do |
| --- | --- | --- |
| `401` with `WWW-Authenticate: Bearer resource_metadata="…"` | no credential, or one that expired or was revoked | follow Discover; refresh an OAuth token, or ask the creator for a new token |
| `403` `TOKEN_MISSING_ABILITY` | the personal access token lacks the ability the call needs | ask the creator for a token that holds it; the body's `docs_url` names the ability |
| `404` `RESOURCE_NOT_FOUND` or `TENANT_MISMATCH` | the id is outside the token's team or its project allow-list | do not retry with other ids |
| `422` `VALIDATION_FAILED` | the input was refused | read `message` and the per-field context |
| `429` | the rate limit, or too many registrations | wait for `Retry-After` |
| `400` `anonymous_not_enabled`, `unsupported_assertion_type`, `invalid_request`, `invalid_scope` | the identity endpoint refused the registration shape or a `scope` value | register with `service_auth`, the creator's email and ability values a token can be minted with |
| `400` `invalid_claim_token`, `claim_expired`, `email_mismatch`, `claimed_or_in_flight` | the claim endpoint refused a renewal | as each code says above |
| `400` `authorization_pending`, `slow_down`, `expired_token` | the token endpoint's polling answers | wait the interval; register again once expired |

Every REST and MCP error body is `{"error": {"code": "…", "message": "…", "docs_url": "…", "remediation": "…"}}`; the codes are listed at https://docs.subscriby.net/api/v1/errors. The registration endpoints answer `{"error": "…", "error_description": "…"}`.

## Revocation

- A registered agent's token and a personal access token are deleted by the creator on https://app.subscriby.net/settings/tokens, or with `DELETE https://api.subscriby.net/v1/tokens/{id}` from a token that holds `token:delete`; they stop working at once.
- An OAuth connection ends when you discard its refresh token; the access token then expires on its own after 1 hour. There is no token revocation endpoint (RFC 7009) and no event endpoint; a creator who wants an OAuth connection gone asks Subscriby support.

## Read next

- https://docs.subscriby.net/mcp/v1/authentication and https://docs.subscriby.net/api/v1/authentication, the guides behind this file.
- https://www.subscriby.net/.well-known/agent-card.json, https://www.subscriby.net/.well-known/mcp/server-card.json, https://www.subscriby.net/.well-known/agent-skills/index.json and https://www.subscriby.net/.well-known/ai-catalog.json, the other discovery documents.
