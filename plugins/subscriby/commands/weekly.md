---
description: The week in figures against the week before, read-only: revenue, payments, new and lost members, failed renewals and recoveries, trials ending, the inbox, the installations, the pass windows ahead.
argument-hint: "[project name or id]"
disable-model-invocation: true
---

Read the last seven days of the project `$ARGUMENTS` (or of the whole account when the argument is empty; ask when it matches more than one project) and present them against the week before. Everything here is a read; change nothing, and run independent reads in parallel.

1. `get_dashboard_metrics` with `period` `7d` and the previous period as the baseline: revenue, transactions, new subscribers, churn, trial conversion, net earnings.
2. `get_earnings_report` by day for the shape of the week, and `get_revenue_composition` for the split.
3. `list_recent_payments` with `status` `failed`, and `get_retention_stats` for the period: failed renewals, recoveries and what they were worth, cancellations and the reasons members gave.
4. `list_subscriptions` filtered to trialing, to find the trials ending within the next seven days (cap at twenty and say when more exist).
5. `list_support_conversations` open and unread, for the inbox.
6. `list_connector_installations` for anything not connected or degraded.
7. `list_pass_windows` from today to seven days ahead, when the project sells passes, with holders and the not-in-queue count per window.

Write it as a short briefing with these headings, each a few lines and the figures beside their comparison: **Money**, **Members**, **Failed renewals and recoveries**, **Trials ending**, **Inbox**, **Installations**, **Pass windows ahead**. Close with up to three actions worth taking this week, each naming the skill or the tool that does it (a broadcast to the not-in-queue holders, a reply to the oldest open thread, a verify on a degraded installation). Quote only figures the tools answered, state the period and the baseline once at the top, and leave out a heading whose tools refused with `TOKEN_MISSING_ABILITY`, saying which ability was missing.
