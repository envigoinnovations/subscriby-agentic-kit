# Tools: Analytics

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_dashboard_metrics` | read | `dashboard:read` | Returns headline dashboard metrics for the authenticated creator: MRR, active subscribers, churn, and a plan-level breakdown, with a comparison-window delta. |
| `get_earnings_report` | read | `dashboard:read` | Returns a full earnings report for the authenticated creator — totals (gross, fees, net, transactions) plus a day / week / month timeseries via the `granularity` argument. |
| `get_plan_performance` | read | `dashboard:read` | Returns one row per plan within a project: active subscribers, payments-in-window, revenue-in-window, and average ticket size. |
| `get_revenue_composition` | read | `dashboard:read` | Returns how the window's revenue and payments are composed, as the five donuts the dashboards draw: transaction fees by payment provider, settled transactions by plan kind (subscription, one-time, lifetime, pass), gross revenue by currency in USD, payment attempts by outcome (succeeded, pending, failed), and, unwindowed because it is a balance, the monthly recurring revenue split by plan. |
| `get_subscriber_analytics` | read | `dashboard:read` | Returns subscriber-centric analytics for the authenticated creator — new signups, cancellations, churn rate, trial-to-paid conversion, and a status-distribution snapshot. |
| `get_transaction_breakdown` | read | `dashboard:read` | Splits USD-normalized successful-payment totals by one of `plan`, `payment_provider`, `currency`, or `project` for the requested window. |
| `get_connector_analytics` | read | `dashboard:read` | Returns members, access and revenue per connector for the authenticated creator — one row per connector their projects run or ever granted access on, with the live installations, the members holding a linked account (and how many linked one in the window), the live and pending grants, the grants issued and revoked in the window, the gross revenue in USD with its transaction count and its share of the scope's total. |
| `get_activity_log` | read | `activity:read` | Reads the activity log for one subject (project, project-user, plan, etc.) in reverse-chronological order. |
| `list_transactions` | read | `project-subscription:view-any` | Keyset-paginated transaction listing for one project, ordered reverse-chronologically. |
| `list_recent_payments` | read | `project-subscription:view-any` | Lists the most recent subscription payments for one project, ordered by `occurred_at` descending. |

## `get_dashboard_metrics`

Read · requires `dashboard:read`

Returns headline dashboard metrics for the authenticated creator: MRR, active subscribers, churn, and a plan-level breakdown, with a comparison-window delta. Accepts a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Pair with `get_earnings_report` for the timeseries view and `get_subscriber_analytics` for lifecycle detail. Backed by the same 5-minute cache the dashboard uses, so repeated calls within a window return the same numbers.

**Arguments**

- `project_id` (string): Optional project UUID to scope the metrics to. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d. Ignored when both from and to are supplied.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".
- `compare_period` (string): Baseline to compare against — "previous" (prior window) or "none". Defaults to "previous".
- `plan_ids` (array of any): Optional plan-UUID allow-list.
- `statuses` (array of any): Optional SubscriptionStatus allow-list.
- `payment_method_ids` (array of any): Optional payment-method UUID allow-list.

## `get_earnings_report`

Read · requires `dashboard:read`

Returns a full earnings report for the authenticated creator — totals (gross, fees, net, transactions) plus a day / week / month timeseries via the `granularity` argument. Accepts a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Explicit dates win when both are supplied. Pair with `get_dashboard_metrics` for headline KPIs and `get_transaction_breakdown` for per-dimension splits.

**Arguments**

- `project_id` (string): Optional project UUID to scope the report. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d. Ignored when both from and to are supplied.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".
- `granularity` (string): Timeseries bucket size — day, week, month. Defaults to day.
- `plan_ids` (array of any): Optional plan-UUID allow-list.
- `statuses` (array of any): Optional SubscriptionStatus allow-list applied to parent subscriptions.
- `payment_method_ids` (array of any): Optional payment-method UUID allow-list applied to parent subscriptions.

## `get_plan_performance`

Read · requires `dashboard:read`

Returns one row per plan within a project: active subscribers, payments-in-window, revenue-in-window, and average ticket size. Aggregates across a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Use to spot underperforming or breakout plans before reaching for `get_transaction_breakdown` (which pivots on dimensions other than plan).

**Arguments**

- `project_id` (string, required): UUID of the project to report on.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d. Ignored when both from and to are supplied.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".

## `get_revenue_composition`

Read · requires `dashboard:read`

Returns how the window's revenue and payments are composed, as the five donuts the dashboards draw: transaction fees by payment provider, settled transactions by plan kind (subscription, one-time, lifetime, pass), gross revenue by currency in USD, payment attempts by outcome (succeeded, pending, failed), and, unwindowed because it is a balance, the monthly recurring revenue split by plan. Every dataset carries `total`, `unit` (`usd` or `count`) and `slices` sorted largest first, each slice with its `key`, `label`, `value`, `share_percent` and chart `color`. Accepts an optional `project_id`, a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Answers "where do the fees go, what sells, in which currency, how many charges fail, and which plans carry the MRR?".

**Arguments**

- `project_id` (string): Optional project UUID to scope the figures. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d. MRR by plan ignores it: it is a balance, not a flow.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".

## `get_subscriber_analytics`

Read · requires `dashboard:read`

Returns subscriber-centric analytics for the authenticated creator — new signups, cancellations, churn rate, trial-to-paid conversion, and a status-distribution snapshot. Accepts a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Use to reason about lifecycle health before designing dunning, win-back, or referral campaigns.

**Arguments**

- `project_id` (string): Optional project UUID to scope the analytics. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".

## `get_transaction_breakdown`

Read · requires `dashboard:read`

Splits USD-normalized successful-payment totals by one of `plan`, `payment_provider`, `currency`, or `project` for the requested window. Returns `gross_usd`, `transactions`, and `share_percent` per group. Accepts a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Use to answer "where is my revenue concentrated?" — pair with `get_earnings_report` for the timeseries view.

**Arguments**

- `project_id` (string): Optional project UUID to scope the breakdown. Leave blank for all projects in the current team.
- `dimension` (string, required): Required. Grouping dimension — plan, payment_provider, currency, or project.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".
- `plan_ids` (array of any): Optional plan-UUID allow-list.
- `statuses` (array of any): Optional SubscriptionStatus allow-list applied to parent subscriptions.
- `payment_method_ids` (array of any): Optional payment-method UUID allow-list applied to parent subscriptions.

## `get_connector_analytics`

Read · requires `dashboard:read`

Returns members, access and revenue per connector for the authenticated creator — one row per connector their projects run or ever granted access on, with the live installations, the members holding a linked account (and how many linked one in the window), the live and pending grants, the grants issued and revoked in the window, the gross revenue in USD with its transaction count and its share of the scope's total. A purchase that grants access on two connectors counts toward both (`attribution` says so). Accepts an optional `project_id`, a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Answers "which connector earns, and which one do members actually use?".

**Arguments**

- `project_id` (string): Optional project UUID to scope the figures. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".

## `get_activity_log`

Read · requires `activity:read`

Reads the activity log for one subject (project, project-user, plan, etc.) in reverse-chronological order. Pass `subject_type` as a supported alias: `project`, `project-user`, `project-subscription`, `project-subscription-plan`, `member`, `subscription`, `plan`, `access-code`, `coupon`, `project-resource`. Anything else is refused, and a subject belonging to another creator returns RESOURCE_NOT_FOUND rather than its history. Each entry carries causer, event, and properties; keys matching `token|secret|password|api_key|api_secret` are scrubbed before return.

**Arguments**

- `subject_type` (string, required): Alias of the model the activity is attached to: one of project, subscription, project-subscription, member, project-user, plan, project-subscription-plan, access-code, coupon, project-resource, referral-program, referral-affiliate, smart-link, sequence, knowledge-entry. Model class names are refused.
- `subject_id` (string, required): UUID of the subject row.
- `limit` (integer): Maximum entries to return (1..200, default 50).

## `list_transactions`

Read · requires `project-subscription:view-any`

Keyset-paginated transaction listing for one project, ordered reverse-chronologically. Filter by `period` preset or explicit `from`/`to` ISO dates, plus allow-lists for `statuses`, `provider_ids`, `plan_ids`, and `currency_ids`. Pass `cursor` from the previous response's `meta.next_cursor` to continue. Each row carries its owning `project_id`/`project_name`, `plan_id`/`plan_name` and `subscriber_id`/`subscriber_name`, so a payment can be attributed without a follow-up lookup. Raw webhook payloads are never returned. Use this over `list_recent_payments` when walking a long history; reach for `get_earnings_report` when you only need totals.

**Arguments**

- `project_id` (string, required): UUID of the project whose transactions to list.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".
- `statuses` (array of any): Optional payment-status allow-list. Values: successful, failed, pending, refunded.
- `provider_ids` (array of any): Optional payment-method (provider) UUID allow-list.
- `plan_ids` (array of any): Optional plan-UUID allow-list applied to the parent subscription.
- `currency_ids` (array of any): Optional currency UUID allow-list.
- `cursor` (string): Opaque keyset cursor returned in a prior meta.next_cursor. Pass to continue pagination.
- `limit` (integer): Maximum rows to return (1..200, default 50).

## `list_recent_payments`

Read · requires `project-subscription:view-any`

Lists the most recent subscription payments for one project, ordered by `occurred_at` descending. Filter by `status` (`successful`, `pending`, `failed`, `refunded`, etc. — see `subscriby://enums/subscription-status`) and cap with `limit` (1..200, default 50). Rows include the external provider id and event id but never the raw webhook payload. Use for live activity feeds; reach for `list_transactions` when you need keyset pagination over a long window.

**Arguments**

- `project_id` (string, required): UUID of the project whose payments to list.
- `status` (one of `successful`, `failed`, `pending`, `refunded`): Payment status filter. One of: successful, failed, pending, refunded
- `limit` (integer): Maximum payments to return (1..200, default 50).
