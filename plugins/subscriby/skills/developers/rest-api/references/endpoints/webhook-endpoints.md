# REST endpoints: REST API, the `webhook-endpoints` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `webhook-endpoints`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-endpoints` | `webhook-endpoint:view-any` | List webhook endpoints | `list_webhook_endpoints` |
| POST | `/v1/webhook-endpoints` | `webhook-endpoint:create` | Register a webhook endpoint | `create_webhook_endpoint` |
| DELETE | `/v1/webhook-endpoints/{endpoint}` | `webhook-endpoint:delete` | Delete a webhook endpoint | `delete_webhook_endpoint` |
| GET | `/v1/webhook-endpoints/{endpoint}` | `webhook-endpoint:view` | Get a webhook endpoint | `get_webhook_endpoint` |
| POST | `/v1/webhook-endpoints/{endpoint}/pause` | `webhook-endpoint:update` | Pause a webhook endpoint | `pause_webhook_endpoint` |
| POST | `/v1/webhook-endpoints/{endpoint}/resume` | `webhook-endpoint:update` | Resume a webhook endpoint | `resume_webhook_endpoint` |
| POST | `/v1/webhook-endpoints/{endpoint}/rotate-secret` | `webhook-endpoint:update` | Rotate a webhook endpoint's secret | `rotate_webhook_endpoint_secret` |
| POST | `/v1/webhook-endpoints/{endpoint}/test` | `webhook-endpoint:update` | Test-fire a webhook endpoint | `test_webhook_endpoint` |

### GET `/v1/webhook-endpoints`

```bash
curl https://api.subscriby.net/v1/webhook-endpoints \
  -H "Authorization: Bearer <token>"
```

The team's endpoints without their secrets, paged with `page` and `per_page`.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/webhook-endpoints`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-endpoints \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zapier trigger",
    "url": "https://hooks.zapier.com/hooks/catch/...",
    "events": ["subscription.created", "payment.succeeded"]
  }'
```

Answers `201` with the endpoint and, at the top level beside `data`, the plaintext signing `secret`.

> **The secret appears once.** The plaintext `secret` (prefixed `whsec_`) appears at the top level of the response **only** here and on rotate-secret. Subsequent reads never surface it; copy it into your consumer's secret storage immediately.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A label for the endpoint, 3 to 100 characters.
- `url` (string, required): The target, `https://` only, up to 2,048 characters, pointing at a public host: loopback, private, link-local and reserved addresses are refused, as is a public hostname that resolves to one.
- `project_id` (string): Confine the endpoint to one project's events; omit it for a team-wide subscription.
- `events` (array of one of `project.created`, `project.updated`, `project.archived`, `project.restored`, `project.deleted`, `project.design_published`, `project.resource.created`, `project.resource.linked`, `project.resource.unlinked`, `project.resource.deleted`, `project.resource.updated`, `project.resource.status_changed`, `project.payment_method.updated`, `project.payment_method.deleted`, `plan.created`, `plan.updated`, `plan.activated`, `plan.deactivated`, `plan.sold_out`, `plan.order_changed`, `plan.deleted`, `plan.sync_completed`, `pass.window_scheduled`, `pass.window_opened`, `pass.window_closed`, `pass.window_cancelled`, `pass.holder_queued`, `pass.holder_moved`, `pass.holder_missed`, `pass.holder_stranded`, `pass_series.purchased`, `pass_series.leg_added`, `pass_series.leg_completed`, `pass_series.leg_substituted`, `pass_series.leg_dropped`, `pass_series.seats_exhausted`, `pass_series.completed`, `pass_series.presale_opened`, `coupon.created`, `coupon.updated`, `coupon.activated`, `coupon.deactivated`, `coupon.deleted`, `coupon.redeemed`, `coupon.exhausted`, `referral.program_updated`, `referral.affiliate_joined`, `referral.affiliate_approved`, `referral.affiliate_suspended`, `referral.captured`, `referral.converted`, `referral.reward_earned`, `referral.reward_approved`, `referral.reward_reversed`, `referral.payout_recorded`, `partner.referral_signed_up`, `partner.referral_converted`, `partner.reward_earned`, `partner.reward_approved`, `partner.reward_credited`, `partner.reward_reversed`, `partner.payout_recorded`, `partner.application_approved`, `partner.application_rejected`, `partner.rate_changed`, `copilot_credit.purchased`, `copilot_credit.granted`, `copilot_credit.low`, `copilot_credit.refunded`, `knowledge.created`, `knowledge.updated`, `knowledge.deleted`, `link.created`, `link.updated`, `link.archived`, `subscription.created`, `subscription.activated`, `subscription.trial_started`, `subscription.trial_converting`, `subscription.trial_expired`, `subscription.renewed`, `subscription.reactivated`, `subscription.paused`, `subscription.unpaused`, `subscription.past_due`, `subscription.unpaid`, `subscription.cancelled`, `subscription.expired`, `subscription.refunded`, `subscription.upgraded`, `subscription.downgraded`, `subscription.payment_recovered`, `subscription.access_suspended`, `subscription.access_restored`, `subscription.cancellation_feedback`, `subscription.offer_taken`, `sequence.created`, `sequence.updated`, `sequence.deleted`, `sequence.enrolled`, `sequence.step_sent`, `sequence.converted`, `sequence.exited`, `payment.succeeded`, `payment.failed`, `payment.pending`, `payment.refunded`, `checkout.stalled`, `checkout.recovered`, `member.lead_created`, `member.joined`, `member.trial_joined`, `member.converted`, `member.churned`, `member.removed`, `member.banned`, `member.unbanned`, `member.kicked`, `member.resource_added`, `member.resource_pending`, `member.resource_reissued`, `member.access_extended`, `member.resource_removed`, `member.identity_linked`, `member.identity_unlinked`, `creator_task.opened`, `creator_task.completed`, `connector.installed`, `connector.connected`, `connector.disconnected`, `connector.status_changed`, `connector.settings_updated`, `connector.uninstalled`, `connector.doctor_completed`, `connector.outage_opened`, `connector.outage_closed`, `connector.outage_compensated`, `recovery.incident_opened`, `recovery.incident_resolved`, `recovery.operation_started`, `recovery.operation_completed`, `recovery.operation_failed`, `recovery.operation_reverted`, `recovery.standby_registered`, `recovery.standby_removed`, `recovery.installation_failed_over`, `recovery.resource_failed_over`, `recovery.resource_replaced`, `recovery.identity_relinked`, `recovery.readiness_changed`, `broadcast.queued`, `broadcast.completed`, `access_code.generated`, `access_code.redeemed`, `access_code.expired`, `support.conversation.opened`, `support.conversation.assigned`, `support.conversation.resolved`, `support.conversation.reopened`, `support.conversation.blocked`, `support.conversation.unblocked`, `support.message.received`, `support.message.sent`, `support.canned_reply.created`, `support.canned_reply.updated`, `support.canned_reply.deleted`, `support.settings.updated`, `team.created`, `team.updated`, `team.deleted`, `team.member.invited`, `team.member.joined`, `team.member.removed`, `team.member.role_changed`, `role.created`, `role.updated`, `role.deleted`, `group.created`, `group.updated`, `group.members_synced`, `group.deleted`, `billing.invoice_created`, `billing.invoice_paid`, `billing.invoice_overdue`, `billing.payment_failed`, `billing.trial_ending`, `billing.grace_period_warning`, `billing.account_locked`, `billing.tier_upgraded`, `billing.tier_downgraded`, `billing.tier_cancelled`, required): The events to subscribe to, at least one.
- `allowed_ips` (array of string): IPv4/IPv6 addresses or CIDR ranges the target must resolve to. Enforced on every delivery: when the endpoint's host resolves to an address outside the list, the delivery is dead-lettered without being posted.
- `is_active` (boolean): Whether deliveries flow from the start. Defaults to true.


### DELETE `/v1/webhook-endpoints/{endpoint}`

```bash
curl -X DELETE https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The endpoint's delivery log stays readable.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/webhook-endpoints/{endpoint}`

```bash
curl https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID \
  -H "Authorization: Bearer <token>"
```

The endpoint and its delivery health. The signing secret is never part of it; it exists in the create and rotate-secret responses only.

`disabled_at` populates when Subscriby auto-disables an endpoint after too many consecutive failures, or when the creator pauses it. `last_success_at` / `last_failure_at` track the most recent delivery outcomes. `project_id` is `null` for team-wide endpoints.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.


### POST `/v1/webhook-endpoints/{endpoint}/pause`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID/pause \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The dashboard's on/off switch, off. A paused endpoint keeps its secret, its event subscriptions and its delivery log, but events raised while it is paused are **not** queued for it and are not replayed on resume; use the [deliveries API](https://docs.subscriby.net/api/v1/reference/webhook-deliveries) to replay rows that dead-lettered before the pause. Answers `200` with the endpoint; idempotent, pausing a paused endpoint changes nothing.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/webhook-endpoints/{endpoint}/resume`

The switch, on. Resuming also clears the consecutive-failure streak, so a target that was fixed while paused is not disabled again on its first miss. Answers `200` with the endpoint; idempotent.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/webhook-endpoints/{endpoint}/rotate-secret`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID/rotate-secret \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with the endpoint and a brand-new `secret` alongside `data`. The old secret is revoked immediately: deploy the new one to your handler before calling this endpoint.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/webhook-endpoints/{endpoint}/test`

Enqueues a synthetic `subscription.created`-shaped delivery against the endpoint and answers `202 Accepted`. The row is handed to the delivery worker immediately, so it shows up in **Settings → Webhook Deliveries** and moves to `delivered` or `failed` as soon as your handler answers. Rate-limited to 5 fires per minute per endpoint.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

