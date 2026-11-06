---
name: analytics
description: "This skill should be used when the user asks for figures, trends, revenue, MRR, churn, trial conversion, earnings by period, plan performance, where revenue comes from, subscriber counts, a report, the transaction ledger, or the activity log of a member, a subscription or a project."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Analytics and reports

The dashboard's figures are the tools' figures: a rolling snapshot refreshed every five minutes, scoped by a period, compared against a baseline, and filtered by plan, status and payment method. Two scopes exist: the account (every project the creator owns or shares; leave `project_id` out) and one project. Amounts in the figures are normalised to US dollars at a daily rate; amounts in the ledger are as paid, in the payment's currency.

## The tools

- `get_dashboard_metrics`: the KPI strip. `period` (`7d`, `14d`, `30d` default, `60d`, `90d`, `1y`, `mtd`, `qtd`, `ytd`, `all`) or `from` and `to`, `compare_period` (previous period, same period last year, last month, quarter, 6 or 12 months), `plan_ids`, `statuses`, `payment_method_ids`. Revenue, transactions, fees, users, MRR (active recurring subscriptions normalised to a month; one-time and lifetime plans excluded), new subscribers (trial or paid; a purchase pending at the gateway is not counted), churn rate and trial conversion (in percentage points against the baseline; falling churn is good), net earnings.
- `get_earnings_report` with `granularity`: revenue over time for a chart or a table.
- `get_plan_performance` (`project_id` required): revenue, subscribers and conversion per plan.
- `get_revenue_composition`: the split by project, plan kind, kept against fees.
- `get_subscriber_analytics`: active, new, churned, trialing, the member statuses over the period.
- `get_transaction_breakdown` with a `dimension` (provider, plan, currency, outcome, and the others the tool lists): the donuts.
- `get_connector_analytics`: what each connector's installations brought.
- `list_transactions` (`period` or `from`/`to`, `statuses`, `provider_ids`, `plan_ids`, `currency_ids`, `cursor`, `limit`) and `list_recent_payments` (`status`): the ledger itself, newest first.
- `get_activity_log` with `subject_type` and `subject_id` (a member, a subscription, a project) and `limit`: every sign-up, renewal, payment, cancellation and bot interaction recorded against it, with who or what did it (a person, a token, an agent, a webhook, the system). The first stop for a dispute or a "what happened to this member".

## Recipes

- "How did last month go?": `get_dashboard_metrics` with `period: mtd` or `from`/`to` for the month and `compare_period` previous; then `get_revenue_composition` for the split.
- "Which plan sells best?": `get_plan_performance` for the period; read conversion beside revenue.
- "Who lapsed this week?": `list_subscriptions` filtered to the cancelled and expired statuses (the `subscriptions-and-payments` skill) rather than a walk over members; cap at fifty.
- "Why did revenue dip?": `get_earnings_report` by day, `get_transaction_breakdown` by outcome for failed charges, `get_retention_stats` in `revenue-recovery` for failed renewals and recoveries.
- "Show me everything Claude did yesterday": `get_activity_log` on the subject, reading the actor kind.

State the period, the baseline and the scope beside every figure, and quote the tool's number, never a derived one the user cannot see. When a count needs a walk over pages, cap it and say that more exist.

## Exports

The dashboard exports the current view as PDF, Excel, CSV or plain text, with the period and filters baked in; that is a dashboard action, not a tool. The whole account is exported as an archive through `request_account_export` and `get_account_export` (the `account-and-billing` skill); a member list with emails is in that archive's `members.json`.

## Do not

- Do not add amounts in different currencies from the ledger; the dashboard tools already convert.
- Do not report a rate's change as a percentage of a percentage; it moves in points.
- Do not present a figure the tools did not answer, and do not quote one from an earlier session as current.

## References

- [references/tools.md](references/tools.md): the ten tools with their arguments, dimensions and periods.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/analytics` and `/v1/activity`.
- [references/abilities.md](references/abilities.md): `dashboard:read` and `activity:read`.
- Documentation: [Dashboard and analytics](https://docs.subscriby.net/creators/dashboard-analytics), [exporting data](https://docs.subscriby.net/creators/exporting-data), [the prompting guide](https://docs.subscriby.net/mcp/v1/prompting-guide).
