---
name: n8n
description: This skill should be used when the user wants to run Subscriby from n8n, install the n8n-nodes-subscriby community node on Cloud or self-hosted, configure its credential, use the Subscriby Trigger or action node, fall back to the HTTP Request and Webhook nodes, or wants workflow recipes.
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# Subscriby on n8n

`n8n-nodes-subscriby` is a verified community node, installable on n8n Cloud and self-hosted alike. It ships a **Subscriby Trigger** node listing every webhook event and a **Subscriby** action node covering every operation of the REST API as a resource and an operation, in parity with the live surface; the [documentation page](https://docs.subscriby.net/integrations/n8n) carries the event families and the resource-and-operation matrix, generated from the node's source. This skill is how to install it, wire it and use the operations that need care.

## Install and connect

- **n8n Cloud**: open a workflow, press **+**, search **Subscriby**, drag it onto the canvas; verified nodes need no package install. If it does not appear, an admin enables **Verified Community Nodes** under Admin Panel → Settings and restarts the instance.
- **Self-hosted**: Settings → Community Nodes → Install → `n8n-nodes-subscriby`; n8n restarts and picks the nodes up. Or `npm install n8n-nodes-subscriby` inside `~/.n8n/custom`, then restart the process.
- **Credential**: Credentials → New → **Subscriby API**, paste a personal access token (everything after `Bearer `; `sbt_live_` on production, `sbt_test_` elsewhere). The credential test calls `GET /v1/teams/current`, so the token needs `team:view`; the trigger node needs `webhook-endpoint:create` and `webhook-endpoint:delete` to register and remove its endpoint (the page names the retired `webhook-endpoint:manage`, which a new token cannot carry); each operation dropped onto the canvas needs the ability its route requires (the `tokens-and-abilities` skill, and `/subscriby:mint-token` for the least set).

## The trigger node

Multi-select the events, optionally scope to one project, activate the workflow. On activation the node calls `POST /v1/webhook-subscriptions` and on deactivation the matching `DELETE`, with idempotency keys generated for it. Verification of `SB-Signature` is on by default and silently drops a delivery that fails it; switch it off only for local debugging, never in production. The families follow the webhook catalogue, and an event added to Subscriby appears on the node's next release (the `webhook-events` skill is how to choose).

## The action node

Pick a **Resource**, then an **Operation**. The resources cover the project side (Project, Resource, Plan, Pass Window, Payment Method, Portal Design, Distribution), the people side (Member, Subscriber, Subscription, Creator Task), growth and retention (Coupon, Access Code, Smart Link, Referral Program, Sequence, Revenue Recovery), communication (Broadcast, Support Conversation, Canned Reply, Support Inbox, Knowledge), operations (Connector, Recovery), the team (Team, Team Member, Role, Group, Token, Webhook Endpoint, Webhook Delivery) and the account (Account, Notification, Partner Program, Copilot Credit, Analytics, Activity). Every write sends a fresh `Idempotency-Key`, so re-running a node is safe. A non-2xx answer becomes a `NodeApiError` whose message carries `error.message` and whose description carries `error.remediation` and `error.docs_url`; branch on `error.code` in a downstream IF node (the `errors-and-retries` skill).

### Broadcast → Send

Three fields compose: **Audience** picks a segment, **Plan ID** optionally narrows it to one plan, and **Running Out Within (Days)** sets the horizon that Expiring Soon reads. The segments are the five member statuses (All Users, Customers Only, Trialing Users, Leads, Churned Users), five subscription states (Expiring Soon, Cancelled Still Inside Their Period, Paused Subscriptions, Trialing Without a Card, Waiting on a Connection) and four pass segments that need Time-Limited Passes. The plan narrows rather than replaces (Customers Only plus a plan is the people paying for it now; Churned Users plus a plan is the people who held it and left) and is refused for Leads and for the pass segments. An auto-renewing subscription is never Expiring Soon: its end date is rewritten on every renewal, so a member counts only once access genuinely lapses. Run **Preview** before **Send**: a broadcast cannot be recalled, and the Send response reports what was addressed, not delivered; the `broadcast.completed` trigger carries the tallies.

### Plan → Create and Update

Both take a **Plan Kind** (Recurring Subscription, Time-Limited Pass, Pass Series) and show that kind's fields: billing cycle, trial and renewal for a subscription; timezone, recurrence, sales cutoff and access windows for a pass; a slate of other pass plans' windows for a series. A series points at windows that already exist: **Pass Window → List** returns each window's id, local range, status, on-sale state and holder count (filter by plan, status, on-sale or date range); **Plan → Create** with Plan Kind Pass Series takes those ids in **Pass Window IDs** as a comma-separated list; **Automatic Inclusion Rules** keep matching after the save, so a window scheduled later joins the slate and is granted to everyone already holding the series at no charge. **Resource IDs** on a series is a lounge the holder keeps for the whole span.

## Fallback with built-in nodes

When the community node cannot be used (a locked-down instance, a policy against community nodes, an older n8n), the built-in nodes reach the same surface:

- **Webhook node** as the trigger: copy its production URL, register it as an endpoint in Subscriby (Settings → Webhooks, or `create_webhook_endpoint`), keep the secret, and add a Function node that verifies `SB-Signature` with the secret from a credential, over the raw body: enable the Webhook node's **Raw Body** option, because n8n re-serialises the body otherwise and the HMAC fails. The check is the one in the `webhooks` skill: HMAC-SHA256 over `<t>.<raw body>`, a constant-time comparison, the timestamp within tolerance.
- **HTTP Request node** as the action: the verb and `https://api.subscriby.net/v1/<path>`, Authentication → Generic Credential Type → Header Auth with `Authorization: Bearer sbt_…`, and an `Idempotency-Key` header with a fresh UUID on every write; import `https://api.subscriby.net/openapi.json` into the node for parameter auto-complete (the `rest-api` skill).

## Recipes

| Job | Trigger | Steps |
| --- | --- | --- |
| Welcome a paying member | `subscription.activated` | A mailer node. Most members have no `email`; `billing_email` is unverified, so it identifies rather than consents. |
| Keep the CRM current | `subscription.created` | HubSpot, Pipedrive or Attio create-or-update with plan and MRR. |
| Watch churn | `subscription.cancelled`, `subscription.expired` | Slack post with handle, plan and days subscribed. |
| Chase a failed payment | `payment.failed` | Slack post, a Wait node of 12 hours, **Subscription → Get**; if still unpaid, a reminder with a payment-update link. |
| Nudge a trial about to convert | `subscription.trial_converting` | Slack DM to the creator with the member's profile. |
| Log access codes | `access_code.generated`, `access_code.redeemed` | Airtable or Google Sheets rows. |
| Run a gift campaign | An Airtable row | **Access Code → Bulk Generate** (one code, file export), **Distribution → Get Deep Link** with the code, a DM with the one-tap link. |
| Keep an audit trail | `member.banned`, `team.member.role_changed` | A Telegram ops chat, a Notion database. |
| Catch a misused token | An hourly Schedule node | **Activity → List** filtered to `mcp` actors on sensitive resources in an IF node; above a threshold, **Token → Revoke** and a Slack alert. |
| Watch the creator's own billing | `billing.grace_period_warning`, `billing.account_locked`, `billing.tier_upgraded` | Email, PagerDuty, a CRM lifecycle update. |
| Send a weekly digest | A Monday Schedule node | **Analytics → Get Dashboard** and **Get Transaction Breakdown** over 7 days, combined into an email. |
| Export plan performance | A daily Schedule node | **Analytics → Get Plan Performance** per project in a SplitInBatches loop, rows to Google Sheets. |
| Prove the webhooks after a deploy | A GitHub release trigger | **Webhook Endpoint → Test** against every active endpoint in a loop, summary to Slack. |
| Rotate the signing secret | Every 90 days | **Webhook Endpoint → Rotate Secret**, the fresh secret into Vault or Secrets Manager, a notice to the platform channel. |

## Do not

- Do not switch signature verification off outside local debugging.
- Do not **Send** a broadcast without **Preview**, and do not read the Send response as a delivery result.
- Do not mint `webhook-endpoint:manage`; mint the two endpoint verbs.
- Do not treat `billing_email` as a mailing consent.

## References

- Documentation: [n8n](https://docs.subscriby.net/integrations/n8n), [the webhook events](https://docs.subscriby.net/webhooks/v1/events), [authentication](https://docs.subscriby.net/api/v1/authentication), [signature verification](https://docs.subscriby.net/webhooks/v1/signature-verification).
- The package: [`n8n-nodes-subscriby` on npm](https://www.npmjs.com/package/n8n-nodes-subscriby), source and changelog at [github.com/envigoinnovations/subscriby-n8n](https://github.com/envigoinnovations/subscriby-n8n).
- Related skills: `webhook-events`, `tokens-and-abilities`, `zapier`, `rest-api`, `webhooks`.
