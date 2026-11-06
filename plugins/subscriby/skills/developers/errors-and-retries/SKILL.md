---
name: errors-and-retries
description: "This skill should be used when the user asks what a Subscriby error code means, how to handle 401, 403, 404, 409, 422 or 429 answers, which errors to retry and how, what the error envelope carries, how to surface an error to a user or an agent, or how to report a problem with a request id."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Errors and retries

Every error from `api.subscriby.net` and `mcp.subscriby.net` uses one envelope:

```json
{
  "error": {
    "code": "TOKEN_MISSING_ABILITY",
    "message": "The presented API token does not carry the ability required to perform this action.",
    "docs_url": "https://docs.subscriby.net/api/v1/errors#token-missing-ability",
    "remediation": "Mint a new token including the ability listed in error.required_ability, or ask the team owner to grant it.",
    "request_id": "00-abc...",
    "context": { "required_ability": "project:view" }
  }
}
```

Branch on `code`, a stable contractual string; `message` is free to change. `docs_url` anchors into the documentation, `remediation` is the one-sentence fix, `request_id` is what support needs, `fields` appears on `VALIDATION_FAILED` (each offending key with its rule failures) and `context` carries extras such as `required_ability`. The MCP server answers the same envelope inside a tool error.

## The codes

The generated [references/error-codes.md](references/error-codes.md) lists every code with its HTTP status, default message, remediation and docs anchor. The ones every integration meets:

| Code | Status | Meaning and what to do |
| --- | --- | --- |
| `VALIDATION_FAILED` | 422 | A field failed a rule: read `fields`, fix the input, do not retry as is. |
| `AUTHENTICATION_REQUIRED` | 401 | No bearer, a revoked token, or a token from the other environment: mint or refresh. |
| `TOKEN_MISSING_ABILITY` | 403 | The token lacks `context.required_ability`: mint one that carries it; never retry. |
| `FORBIDDEN` | 403 | The ability is there but the holder may not change this object (webhook endpoints belong to their registrant or the owner). |
| `TENANT_MISMATCH`, `RESOURCE_NOT_FOUND` | 404 | The id is outside the token's team or project list, or does not exist; existence is never leaked. Do not retry with other ids. |
| `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_REPLAY_IN_PROGRESS` | 400, 409 | A write without a key; the same key with a different body; a replay while the first request is still running. |
| `RATE_LIMITED` | 429 | Wait `Retry-After` seconds, then retry the same request with the same idempotency key. |
| `TEAM_TIER_REQUIRED`, `CONNECTOR_TIER_REQUIRED` | 402 or 403 as listed | The creator's plan does not include the feature; the fix is an upgrade, not a retry. |
| `PLAN_CURRENCY_MISMATCH`, `PLAN_PROVIDER_UNSUPPORTED`, `PAYMENT_METHOD_NOT_CONFIGURED` | as listed | A plan and a payment method disagree; read the message. |
| `ACCESS_CODE_INVALID`, `ACCESS_CODE_EXPIRED`, `ACCESS_CODE_ALREADY_REDEEMED`, `ACCESS_CODE_CAP_EXCEEDED` | as listed | A code's state; tell the member. |
| `CONNECTOR_UNAVAILABLE`, `CONNECTOR_NOT_INSTALLED`, `CONNECTOR_NOT_CONNECTED`, `IDENTITY_NOT_LINKED` | as listed | The platform side is not ready; the fix is on the project's Connectors page or the member's account. |
| `SUBSCRIPTION_ALREADY_ACTIVE` | as listed | The state already is what the call asked for; treat as success. |
| `WEBHOOK_ENDPOINT_UNREACHABLE` | as listed | The endpoint could not be reached at registration or test. |
| `METHOD_NOT_ALLOWED`, `INTERNAL_SERVER_ERROR` | 405, 500 | A wrong verb; a fault on Subscriby's side, retried with backoff and reported with `request_id`. |

## The retry policy

- Retry `429` after `Retry-After`, and `5xx` with exponential backoff and jitter, a bounded number of times.
- Never retry a `4xx` that is not a `429`; the input or the credential is wrong and a retry repeats the refusal.
- Send the same `Idempotency-Key` across retries of the same logical write, so a replay is free and a double charge impossible; use a fresh key for a different operation.
- Read `X-RateLimit-Limit` and `X-RateLimit-Remaining` to pace a batch below the per-token limits.

## Surfacing errors

Echo `code`, `message` and `docs_url` to a user or an agent's failure output; quote `request_id` to support. An agent should read `remediation` and act on it (mint, fix the input, wait) rather than retry blindly, and should read the resource `subscriby://enums/error-code` once per session so a code is recognised when it arrives.

## Do not

- Do not pattern-match on `message`.
- Do not retry a `TOKEN_MISSING_ABILITY`, a `TENANT_MISMATCH` or a `VALIDATION_FAILED` as it was.
- Do not drop `request_id` from logs; it is the only key support can trace.

## References

- [references/error-codes.md](references/error-codes.md): every code with status, message, remediation and docs anchor.
- Documentation: [error codes](https://docs.subscriby.net/api/v1/errors), [rate limiting](https://docs.subscriby.net/api/v1/rate-limiting), [status codes](https://docs.subscriby.net/reference/status-codes), [troubleshooting](https://docs.subscriby.net/reference/troubleshooting).
