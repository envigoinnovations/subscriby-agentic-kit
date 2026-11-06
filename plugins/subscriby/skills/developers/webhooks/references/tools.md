# Tools: Webhooks

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_webhook_endpoints` | read | `webhook-endpoint:view-any` | Lists outbound webhook endpoints registered for the token's team. |
| `get_webhook_endpoint` | read | `webhook-endpoint:view` | Fetches one of the team's outbound webhook endpoints by UUID. |
| `create_webhook_endpoint` | additive | `webhook-endpoint:create` | Registers an outbound webhook endpoint for the token's team. |
| `delete_webhook_endpoint` | destructive | `webhook-endpoint:delete` | Removes an outbound webhook endpoint; deliveries to it stop at once and its delivery log is kept. |
| `pause_webhook_endpoint` | destructive | `webhook-endpoint:update` | Stops deliveries to an endpoint without removing it; events raised while paused are not queued for it. |
| `resume_webhook_endpoint` | destructive | `webhook-endpoint:update` | Starts deliveries to a paused endpoint again and clears its consecutive-failure streak, so a target that was fixed is not disabled again on its first miss. |
| `rotate_webhook_endpoint_secret` | destructive | `webhook-endpoint:update` | Replaces an endpoint's signing secret. |
| `test_webhook_endpoint` | additive | `webhook-endpoint:update` | Queues a synthetic test event to an endpoint so its consumer can be checked end to end. |
| `list_webhook_deliveries` | read | `webhook-delivery:view-any` | Lists the team's outbound webhook deliveries newest first, with each row's event, status, attempt count, the target's response status and excerpt, the payload that was posted and when it was delivered or dead-lettered. |
| `get_webhook_delivery` | read | `webhook-delivery:view-any` | Fetches one outbound webhook delivery by UUID: its event, status, attempts, the target's response status and excerpt, the payload that was posted and its timestamps. |
| `retry_webhook_delivery` | additive | `webhook-delivery:retry` | Replays one failed or dead-lettered webhook delivery from the start of the retry ladder, posting the same event to the same endpoint again. |
| `retry_dead_webhook_deliveries` | additive | `webhook-delivery:retry` | Replays every webhook delivery the team dead-lettered recently, once the consumer is fixed. |

## `list_webhook_endpoints`

Read · requires `webhook-endpoint:view-any`

Lists outbound webhook endpoints registered for the token's team. Optionally scoped by `project_id`, or trimmed by `active_only` to hide endpoints with `is_active=false` or `disabled_at` set. Webhook signing secrets are NEVER returned; only `url`, the `events` allow-list, `failure_count`, `consecutive_failures`, and `last_success_at` / `last_failure_at` timestamps. Cross-reference allowed `events` against `subscriby://enums/webhook-event` to confirm coverage.

**Arguments**

- `project_id` (string): Optional project UUID. Omit to list team-wide endpoints and all project-scoped endpoints within the team.
- `active_only` (boolean): When true, hides endpoints with is_active=false or disabled_at set.

## `get_webhook_endpoint`

Read · requires `webhook-endpoint:view`

Fetches one of the team's outbound webhook endpoints by UUID. Requires `endpoint_id`. Same row shape as `list_webhook_endpoints`; the signing secret is NEVER returned. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint to fetch.

## `create_webhook_endpoint`

Additive · requires `webhook-endpoint:create` · open world

Registers an outbound webhook endpoint for the token's team. Requires `name`, a public `https` `url` and a non-empty `events` list drawn from `subscriby://enums/webhook-event`; optional `project_id` (deliver only that project's events), `allowed_ips` and `is_active` (default true). The signing secret is returned in this response only, under `secret`, and can never be read again — store it immediately; rotate it later with `rotate_webhook_endpoint_secret`. Refused with `VALIDATION_FAILED` per field, including an http or private-network URL. Unknown, foreign or out-of-scope project ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `name` (string, required): A label for the endpoint, shown in the dashboard.
- `url` (string, required): The https URL Subscriby posts events to. Must resolve to a public address; http and private-network targets are refused.
- `events` (array of string, required): Event names to deliver, from subscriby://enums/webhook-event. At least one.
- `project_id` (string): Optional project UUID: deliver only that project's events. Omit for every project of the team.
- `allowed_ips` (array of string): Optional list of IP addresses or CIDR ranges the endpoint host may resolve to; a delivery whose host resolves outside the list is dead-lettered without being posted.
- `is_active` (boolean): Whether deliveries start right away. Defaults to true.

## `delete_webhook_endpoint`

Destructive · requires `webhook-endpoint:delete` · idempotent

Removes an outbound webhook endpoint; deliveries to it stop at once and its delivery log is kept. Requires `endpoint_id`. DESTRUCTIVE: you MUST confirm the target `endpoint_id` with a human before calling — an integration listening on it goes dark. Only the creator who registered the endpoint or the team owner may remove it; a fellow team member is refused with `FORBIDDEN`. Idempotent — an already-deleted id surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or foreign id does.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint to remove.

## `pause_webhook_endpoint`

Destructive · requires `webhook-endpoint:update` · idempotent

Stops deliveries to an endpoint without removing it; events raised while paused are not queued for it. Requires `endpoint_id`. Resume with `resume_webhook_endpoint`; the secret is unchanged. Only the creator who registered the endpoint or the team owner may pause it; a fellow team member is refused with `FORBIDDEN`. Idempotent — an already-paused endpoint is a no-op. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint to pause.

## `resume_webhook_endpoint`

Destructive · requires `webhook-endpoint:update` · idempotent

Starts deliveries to a paused endpoint again and clears its consecutive-failure streak, so a target that was fixed is not disabled again on its first miss. Requires `endpoint_id`. Events raised while it was paused are not replayed; use `retry_dead_webhook_deliveries` for rows that dead-lettered before the pause. Only the creator who registered the endpoint or the team owner may resume it; a fellow team member is refused with `FORBIDDEN`. Idempotent — an already-active endpoint is a no-op. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint to resume.

## `rotate_webhook_endpoint_secret`

Destructive · requires `webhook-endpoint:update`

Replaces an endpoint's signing secret. Requires `endpoint_id`. The new secret is returned in this response only, under `secret`, and can never be read again — hand it to the consumer immediately, because deliveries are signed with it from now on and the previous secret stops verifying. DESTRUCTIVE: you MUST confirm the target `endpoint_id` with a human before calling. Only the creator who registered the endpoint or the team owner may rotate it; a fellow team member is refused with `FORBIDDEN`. Not idempotent — every call mints another secret. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint whose secret to replace.

## `test_webhook_endpoint`

Additive · requires `webhook-endpoint:update` · open world

Queues a synthetic test event to an endpoint so its consumer can be checked end to end. Requires `endpoint_id`. Returns the queued delivery in the `get_webhook_delivery` row shape; poll that tool for the target's `response_status` once the worker has posted it. Only the creator who registered the endpoint or the team owner may fire a test; a fellow team member is refused with `FORBIDDEN`. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `endpoint_id` (string, required): UUID of the webhook endpoint to send a test event to.

## `list_webhook_deliveries`

Read · requires `webhook-delivery:view-any`

Lists the team's outbound webhook deliveries newest first, with each row's event, status, attempt count, the target's response status and excerpt, the payload that was posted and when it was delivered or dead-lettered. Optional `status` tab: `all` (default), `pending`, `delivered`, `failed` or `dead`; any other value is `VALIDATION_FAILED`. Paginates with `limit` (1..100, default 25) and `page`. Use it to see why a consumer rejected an event before calling `retry_webhook_delivery` or `retry_dead_webhook_deliveries`.

**Arguments**

- `status` (string): Tab of the delivery log: all, pending, delivered, failed or dead. Defaults to all.
- `limit` (integer): Maximum deliveries to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_webhook_delivery`

Read · requires `webhook-delivery:view-any`

Fetches one outbound webhook delivery by UUID: its event, status, attempts, the target's response status and excerpt, the payload that was posted and its timestamps. Requires `delivery_id`. Same row shape as `list_webhook_deliveries`. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `delivery_id` (string, required): UUID of the webhook delivery to fetch.

## `retry_webhook_delivery`

Additive · requires `webhook-delivery:retry` · open world

Replays one failed or dead-lettered webhook delivery from the start of the retry ladder, posting the same event to the same endpoint again. Requires `delivery_id`. A pending or already-delivered row is refused with `VALIDATION_FAILED`, because replaying it would post the event twice. Returns the delivery row, pending again. Unknown or foreign ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `delivery_id` (string, required): UUID of the failed or dead-lettered delivery to replay.

## `retry_dead_webhook_deliveries`

Additive · requires `webhook-delivery:retry` · open world

Replays every webhook delivery the team dead-lettered recently, once the consumer is fixed. Optional `since` (ISO 8601, not in the future) names the instant the window opens at; omit it for the last 24 hours, the same window the dashboard's Replay button uses. Answers with how many rows were `retried` and the `since` used. Each replayed row posts its event again, so confirm the consumer is healthy first. Refused with `VALIDATION_FAILED` for a malformed or future `since`.

**Arguments**

- `since` (string): ISO 8601 instant; rows dead-lettered at or after it are replayed. Defaults to 24 hours ago.
