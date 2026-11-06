---
name: zapier
description: This skill should be used when the user wants to connect Subscriby to Zapier, build a Zap on a Subscriby trigger, action or search, asks which abilities the Zapier connection's token needs, why a Zap receives no events or fails test-auth, or wants Zap recipes.
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Subscriby on Zapier

The Subscriby Zapier app carries an instant trigger for every webhook event, an action for every write and a search for every read of the REST API, so a Zap drives the same code path as the creator dashboard. It is invite-only while it is validated for the public App Directory: the Subscriby team sends the invite link, and the connection step asks for a personal access token rather than an OAuth sign-in. The [documentation page](https://docs.subscriby.net/integrations/zapier) lists every trigger, action and search with the route it calls and the ability it needs, generated from the app's source; this skill is how to use them well.

## The connection and its token

Mint the token under Settings → API Tokens (the `tokens-and-abilities` skill) with exactly:

- `team:view`, which the connection test relies on;
- for each trigger, the ability the event family requires (the `webhook-events` reference carries it per event);
- `webhook-endpoint:create` and `webhook-endpoint:delete`, so a Zap can register its endpoint when it is switched on and remove it when it is switched off;
- for each action or search the Zap uses, the ability its route needs, as the page's line for it states.

Older pages name `webhook-endpoint:manage` for the endpoint step; that ability is retired and cannot be granted to a new token (a token that already carries it keeps working), so mint the two verbs. A production token starts `sbt_live_`, any other environment's `sbt_test_`, and Subscriby refuses a token on the wrong environment. Add `scope:project:` entries for a Zap that should see one project. To rotate, mint a replacement, reconnect, then revoke the old one.

## How a trigger works

1. Pick a trigger, say **New Subscription**. On activation Zapier registers an endpoint: `POST /v1/webhook-subscriptions` with `{name, url, events}` and an idempotency key scoped to the Zap.
2. The response carries `{data: {id}, secret}`; Zapier keeps both and verifies `SB-Signature` on every inbound delivery, so no Code step is needed for the signature.
3. When the event fires, Subscriby delivers to Zapier's inbound URL; Zapier decodes the envelope and hands `data.*` to the Zap's steps.
4. Switching the Zap off calls `DELETE /v1/webhook-subscriptions/{id}`; the endpoint is gone server-side.

Every trigger also carries a polling fallback against `GET /v1/webhook-events`, so the editor shows a sample before any live event has fired. One trigger is polling only, **New Notification**, which reads the unread entries of the notification centre, because the notification centre raises no webhook; Zapier's own floor for polling is 15 seconds.

## Actions

Every action sends a fresh `Idempotency-Key`, so a retried step never writes twice. Notes on the ones that need care:

- **Plans**: **Create Plan** and **Update Plan** open with a **Plan Kind** (Recurring Subscription, Time-Limited Pass, Pass Series) and show only that kind's fields, as the API refuses a block from another kind. The field keys changed with that release, so a Zap built before it re-maps its fields. A Pass Series points at windows that already exist: run **Find Pass Windows**, paste the ids into **Pass Window IDs** on **Create Plan**, and optionally add **Automatic Inclusion Rules**, which keep matching after the save, so a window scheduled later joins the slate and is granted to everyone already holding the series at no charge; **Resource IDs** on a series is a lounge kept for the whole span.
- **Broadcast**: sends one message to a segment of a project's members. The send is queued, so the action answers the audience it resolved and the recipient count, never a delivery result; the **Broadcast Completed** trigger carries `sent` and `failed`. **Test action sends for real**, and **Audience** defaults to All Users: set the audience, and the plan if wanted, before testing, or test against a project with no members. Three fields compose: **Audience** (the member statuses, the subscription states, the pass segments), **Narrow to a Plan** (the plan and the state describe the same subscription) and **Running Out Within (Days)** for Expiring Soon. A plan on Leads or on a pass segment is refused with a 422; an auto-renewing subscription is never Expiring Soon; the two single-window pass segments need a **Pass Window ID**.
- **Recovery**: the same operations the Disaster Recovery pages run, so a refusal (a teammate's action, a plan without the feature, a closed undo window) comes back as the dashboard's own sentence.
- **Roles and groups**: the permissions field on **Update Role** and **Update Group** replaces the whole list, so omit it to leave permissions alone; **Sync Group Members** is a sync, so anyone missing from the list is removed and an empty list empties the group. Creating and re-permissioning need the Growth Plan; deleting and removing do not.
- **Bulk Generate Access Codes** queues the batch and answers at once with the worst-case overage preview; the `access_code.generated` trigger says when the batch exists. **Create Webhook Endpoint** and **Rotate Webhook Secret** expose the secret once as an output field: map it into a secret store in the same Zap.

## Searches

A search answers one object (wrapped in a one-element list) or an array, and serves dynamic dropdowns, cross-Zap lookups and standalone fetch steps: finding a member, a subscription or a pass window, reading the dashboard figures, the transaction breakdown (its **dimension** must be one of plan, payment provider, currency or project), the earnings report, the activity log, the notification centre and the Partner Program ledgers.

## Recipes

| Job | Trigger | Steps |
| --- | --- | --- |
| Welcome a paying member | `subscription.activated` | A mailer step. Most members have no `email`; `billing_email` is unverified, so treat it as identification, not consent to mail. |
| Keep the CRM current | `subscription.created` | HubSpot, Pipedrive or Attio create-or-update with plan and MRR. |
| Watch churn | `subscription.cancelled`, `subscription.expired` | Slack post with handle, plan and days subscribed. |
| Chase a failed payment | `payment.failed` | Slack post, a 12-hour delay, the subscription search; if still unpaid, a reminder with a payment-update link. |
| Nudge a trial about to convert | `subscription.trial_converting` | Slack DM to the creator with the member's profile. |
| Log access codes | `access_code.generated`, `access_code.redeemed` | Airtable or Google Sheets rows. |
| Run a gift campaign | A new row in a sheet | **Bulk Generate Access Codes** (one code), `get_deep_link` with the code, a DM with the one-tap link. |
| Keep an audit trail | `member.banned`, `team.member.role_changed` | A Telegram ops chat, a Notion database. |
| Catch a misused token | An hourly schedule | The activity search filtered to `mcp` actors on sensitive resources; above a threshold, `revoke_token` and a Slack alert. |
| Watch the creator's own billing | `billing.grace_period_warning`, `billing.account_locked`, `billing.tier_upgraded` | Email, PagerDuty, a CRM lifecycle update. |
| Send a weekly digest | A Monday schedule | `get_dashboard_metrics` and `get_transaction_breakdown` over 7 days, combined into an email. |
| Prove the webhooks after a deploy | A release trigger | **Test Webhook Endpoint** against every active endpoint, summary to Slack. |
| Rotate the signing secret | Every 90 days | **Rotate Webhook Secret**, the secret into the vault, a notice to the platform channel. |

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Test-auth answers `401 AUTHENTICATION_REQUIRED` | The token was revoked or belongs to the other environment | Mint a new token |
| Test-auth answers `403 TOKEN_MISSING_ABILITY` | The token lacks `team:view` | Mint with `team:view` plus the abilities each step needs |
| Test-auth answers `404 TENANT_MISMATCH` | A hand-crafted token without `scope:team:` | Mint from the dashboard, which always appends the scope |
| Switching the Zap on answers `422 VALIDATION_FAILED` on the events | An event name the catalogue no longer has | Rebuild the trigger; the app follows the catalogue |
| The Zap receives no events | The endpoint was disabled after consecutive failures, or paused | Resume it from Settings → Webhooks (or `resume_webhook_endpoint`), then **Test Webhook Endpoint** |
| A breakdown search answers `400 VALIDATION_FAILED` on `dimension` | A dimension outside the four | Pick plan, payment provider, currency or project |

## When a Code step or a raw request is needed

Zapier verifies the signature and sends the idempotency key, so neither needs code. For an operation the app does not carry, a **Webhooks by Zapier** step calls the REST API directly with `Authorization: Bearer` and a fresh `Idempotency-Key` (the `rest-api` skill). For logic that spans several events, keep state in a storage step and reconcile from the newest event per resource (the `webhooks` skill's ordering rule).

## Do not

- Do not click **Test action** on **Broadcast** before setting the audience; it sends.
- Do not mint `webhook-endpoint:manage`, or every ability, for a Zap.
- Do not treat `billing_email` as a mailing consent.
- Do not expect a delivery result from **Broadcast**; the trigger carries it.

## References

- Documentation: [Zapier](https://docs.subscriby.net/integrations/zapier), [the webhook events](https://docs.subscriby.net/webhooks/v1/events), [authentication](https://docs.subscriby.net/api/v1/authentication), [rate limiting](https://docs.subscriby.net/api/v1/rate-limiting).
- Related skills: `webhook-events` for choosing events, `tokens-and-abilities` for the token, `n8n` for the other native node, `rest-api` for a raw request.
