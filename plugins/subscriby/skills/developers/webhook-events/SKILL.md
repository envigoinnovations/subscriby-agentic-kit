---
name: webhook-events
description: "This skill should be used when the user asks which Subscriby webhook events exist or which to subscribe to for a job, what an event's payload carries, which ability it needs, when it fires, or how to react to a new member, a failed renewal, a cancellation, a pass window or an outage."
license: MIT
metadata:
  category: developers
  catalogue: 2026-05-01
---

# The webhook events

Every event is an entity in the singular followed by what happened: `subscription.created`, `member.churned`, `pass.window_opened`. They are grouped in families, each behind the ability that reads the family, and a token registers an endpoint for an event only when it holds that ability. The generated [references/events.md](references/events.md) indexes one file per family under `references/events/`, each carrying every event of the family with its ability, its payload keys, when it fires and an example delivery; this skill is how to choose.

## The families

| Family | What it announces |
| --- | --- |
| `project`, `project.resource`, `project.payment_method` | A project created, updated, archived, restored, deleted, its design published; a place created, linked, unlinked, updated, deleted or changing health; a payment method updated or deleted. |
| `plan`, `pass`, `pass_series` | Plans created, updated, activated, deactivated, sold out, reordered, deleted, synced; pass windows scheduled, opened, closed, cancelled, holders queued, moved, missed or stranded; a season purchased, its legs added, completed, substituted or dropped, seats exhausted, completed, its presale opened. |
| `member`, `creator_task` | A lead created, a member joined, trial joined, converted, churned, removed, banned, unbanned, kicked; a place added, pending, reissued, removed, access extended; an identity linked or unlinked; a hand-delivered perk opened or completed. |
| `subscription`, `payment`, `checkout` | The whole subscription lifecycle (created, activated, trial states, renewed, reactivated, paused, unpaused, past due, unpaid, cancelled, expired, refunded, upgraded, downgraded, payment recovered, access suspended or restored, cancellation feedback, an offer taken); a payment succeeded, failed, pending, refunded; a checkout stalled or recovered. |
| `coupon`, `access_code`, `referral`, `link`, `sequence` | Coupons created, updated, switched, deleted, redeemed, exhausted; access codes generated, redeemed, expired; the Referral Program's joins, captures, conversions, rewards and payouts; Smart Links created, updated, archived; sequences created, updated, deleted, enrolled, stepped, converted, exited. |
| `broadcast`, `support`, `knowledge` | A broadcast queued and completed; conversations opened, assigned, resolved, reopened, blocked, unblocked, messages received and sent, saved replies, settings; Knowledge entries created, updated, deleted (never the text). |
| `connector`, `recovery` | Installations installed, connected, disconnected, status changed, settings updated, uninstalled, the doctor completed, outages opened, closed and compensated; incidents opened and resolved, operations started, completed, failed, reverted, standbys registered and removed, failovers, replacements, relinks, readiness changed. |
| `team`, `role`, `group` | Teams and memberships, roles and groups. |
| `billing`, `partner`, `copilot_credit` | The creator's own Subscriby billing (invoices, failed payments, trial ending, grace, lock, tier changes); the Partner Program; Copilot Credits purchased, granted, low, refunded. |

## Choosing events for a job

- **A new paying member in the CRM**: `subscription.activated` (a paid checkout; `subscription.created` fires for the record and the trial states fire for trials), with `member.joined` for the person.
- **A failed renewal opens a task**: `payment.failed` and `subscription.past_due`; `subscription.payment_recovered` closes it.
- **Churn and win-back**: `subscription.cancelled` (renewal turned off; access runs on), `subscription.expired` (access ended), `member.churned`, `subscription.cancellation_feedback` for the reason.
- **Access changes a system must mirror**: `member.resource_added`, `member.resource_pending`, `member.resource_reissued`, `member.resource_removed`, `member.access_extended`.
- **A pass day**: `pass.window_opened` and `pass.window_closed`, `pass.holder_queued`, `pass.holder_missed`.
- **Operations and incidents**: `connector.outage_opened` and `connector.outage_closed`, `recovery.incident_opened`, `recovery.readiness_changed`, `project.resource.status_changed`.
- **Money reconciliation**: `payment.succeeded` and `payment.refunded` carry the payment; amounts are in the payment's currency.
- **The creator's own account**: `billing.*` needs `billing:read` and arrives with `project_id` null.

Subscribe to the few events a job needs rather than everything: every event the endpoint takes is a delivery to handle, retry and deduplicate. Each payload carries ids, not whole objects; fetch the object over REST or MCP when the job needs more than the keys the catalogue lists. Treat an unknown field as public-safe metadata that arrived in a newer version; the shape of an event is locked by `api_version` and a breaking change ships under a new version.

## Do not

- Do not infer order between events; reconcile from the most recent event per resource.
- Do not expect member emails, card data, fee breakdowns or message bodies in a payload; they are never there.
- Do not name an event that is not in the reference; the catalogue is generated from the running application.

## References

- [references/events.md](references/events.md): the index of the per-family files under `references/events/`, each with every event's ability, payload keys, when it fires, caveats and an example.
- Documentation: [the events reference](https://docs.subscriby.net/webhooks/v1/events), [receiving webhooks](https://docs.subscriby.net/webhooks/v1).
