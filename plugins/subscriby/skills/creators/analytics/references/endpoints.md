# REST endpoints: Analytics

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `analytics`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/analytics/composition` | `dashboard:read` | Revenue composition | `get_revenue_composition` |
| GET | `/v1/analytics/connectors` | `dashboard:read` | By connector | `get_connector_analytics` |
| GET | `/v1/analytics/dashboard` | `dashboard:read` | Headline figures | `get_dashboard_metrics` |
| GET | `/v1/analytics/earnings` | `dashboard:read` | Earnings report | `get_earnings_report` |
| GET | `/v1/analytics/plan-performance` | `dashboard:read` | Plan performance | `get_plan_performance` |
| GET | `/v1/analytics/subscribers` | `dashboard:read` | Subscriber analytics | `get_subscriber_analytics` |
| GET | `/v1/analytics/transactions` | `dashboard:read` | List transactions | `list_transactions` |
| GET | `/v1/analytics/transactions/breakdown` | `dashboard:read` | Transaction breakdown | `get_transaction_breakdown` |

### GET `/v1/analytics/composition`

How the window's revenue and payments are composed, as the five donuts the dashboards draw: transaction fees by payment provider, settled transactions by plan kind, gross revenue by currency, payment attempts by outcome, and the monthly recurring revenue split by plan.

```bash
curl "https://api.subscriby.net/v1/analytics/composition?project_id=$PROJECT_ID&period=30d" \
  -H "Authorization: Bearer <token>"
```

- Every dataset carries `total`, `unit` (`usd` or `count`) and `slices` sorted largest first; each slice has its `key`, `label`, `value`, `share_percent` and the `color` the dashboard draws it in, so a client can render the same donut.
- `fees_by_provider`, `transactions_by_kind` and `revenue_by_currency` read the same settled payments, so they agree with each other to the cent; `payment_outcomes` reads every attempt in the window, because a failed charge is exactly what it exists to show.
- `mrr_by_plan` ignores the window: MRR is a balance, not a flow. It counts every active subscription on a recurring plan, normalised to a monthly USD figure, filed under its plan.
- Labels come back in the creator's language.

**Parameters**

- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.


### GET `/v1/analytics/connectors`

Members, access and revenue per connector: one row for every connector the scope's projects run or ever granted access on. The figures behind the dashboards' **By Connector** panel.

```bash
curl "https://api.subscriby.net/v1/analytics/connectors?project_id=$PROJECT_ID&period=30d" \
  -H "Authorization: Bearer <token>"
```

- `installations` counts the live, not uninstalled, installations of the connector in the scope; `members` the members holding at least one account linked on it; `members_linked_in_window` those who linked one inside the window.
- `live_grants` and `pending_grants` read the access ledger now (pending covers `pending`, `pending_identity` and `held`); `granted_in_window` and `revoked_in_window` count the ledger's moves inside the window.
- `gross_usd` is every settled payment in the window whose purchase granted access on the connector, converted to USD; `share_percent` is its part of `total_gross_usd`. A purchase that grants access on two connectors counts toward both, so shares can exceed 100 in total; `attribution` says so in the creator's language.
- The filter allow-lists (`plan_ids`, `statuses`, `payment_method_ids`) do not apply here: installations and linked accounts are not subscriptions.

**Parameters**

- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.


### GET `/v1/analytics/dashboard`

Total revenue, total transactions, total users and MRR, each with a trend relative to the `compare_period` window and a sparkline. The **Recurring Monthly Income** tile counts only active subscriptions on recurring plans, normalised to a monthly figure; one-time and lifetime plans are excluded.

```bash
curl "https://api.subscriby.net/v1/analytics/dashboard?period=30d&compare_period=previous" \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `compare_period` (query, string): `previous` (the default) compares each tile with the window just before it and fills `trend`; `none` leaves the trend out.
- `plan_ids[]` (query, array): Count only these plans. Send it as `plan_ids[]=a&plan_ids[]=b` or as one comma-separated string.
- `statuses[]` (query, array): Count only payments in these states: `successful`, `failed`, `pending`, `refunded`. Send them as `statuses[]=a&statuses[]=b` or as one comma-separated string.
- `payment_method_ids[]` (query, array): Count only payments taken through these payment methods. Send them as `payment_method_ids[]=a&payment_method_ids[]=b` or as one comma-separated string.


### GET `/v1/analytics/earnings`

The full earnings breakdown (gross, fees, net, transaction count) plus a timeseries bucketed by `granularity`: `day` (the default), `week` or `month`.

```bash
curl "https://api.subscriby.net/v1/analytics/earnings?granularity=week" \
  -H "Authorization: Bearer <token>"
```

Every money figure is USD-normalised so buckets in different currencies add up; `totals.currency` says so.

**Parameters**

- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `granularity` (query, string): The bucket size of the timeseries: `day` (the default), `week` or `month`. Anything else is `422 VALIDATION_FAILED`.
- `plan_ids[]` (query, array): Count only these plans. Send it as `plan_ids[]=a&plan_ids[]=b` or as one comma-separated string.
- `statuses[]` (query, array): Count only payments in these states: `successful`, `failed`, `pending`, `refunded`. Send them as `statuses[]=a&statuses[]=b` or as one comma-separated string.
- `payment_method_ids[]` (query, array): Count only payments taken through these payment methods. Send them as `payment_method_ids[]=a&payment_method_ids[]=b` or as one comma-separated string.


### GET `/v1/analytics/plan-performance`

A per-plan breakdown for one project: active subscribers, revenue in the window, payments in the window and the average ticket. `project_id` is **required**.

```bash
curl "https://api.subscriby.net/v1/analytics/plan-performance?project_id=$PROJECT_ID&period=30d" \
  -H "Authorization: Bearer <token>"
```

Figures are in the plan's own currency. `meta.range` is the window the preset resolved to.

**Parameters**

- `project_id` (query, string, required): The project whose plans to report on. Required: the figures are per plan of one project.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.


### GET `/v1/analytics/subscribers`

New sign-ups, cancellations, churn rate, trial-to-paid conversion and the status distribution of the window. The filter allow-lists do not apply: the figures describe the whole membership of the scope, which is what retention is measured against.

```bash
curl "https://api.subscriby.net/v1/analytics/subscribers?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.


### GET `/v1/analytics/transactions`

A keyset-paginated list of payments for one project. `project_id` is **required**.

```bash
curl "https://api.subscriby.net/v1/analytics/transactions?project_id=$PROJECT_ID&limit=100" \
  -H "Authorization: Bearer <token>"
```

Every row carries its owning project, plan and subscriber, so a payment can be attributed without a follow-up lookup. Follow `meta.next_cursor` on the next call to paginate. A `null` or missing cursor means the end of the range has been reached.

**Parameters**

- `project_id` (query, string, required): The project whose payments to list. Required: transactions are always read for one project.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `statuses[]` (query, array): Only payments in these states: `successful`, `failed`, `pending`, `refunded`. Send them as `statuses[]=a&statuses[]=b` or as one comma-separated string; an unknown state is ignored.
- `provider_ids[]` (query, array): Only payments taken through these payment methods. Send them as `provider_ids[]=a&provider_ids[]=b` or as one comma-separated string.
- `plan_ids[]` (query, array): Count only these plans. Send it as `plan_ids[]=a&plan_ids[]=b` or as one comma-separated string.
- `currency_ids[]` (query, array): Only payments in these currencies, by currency id. Send them as `currency_ids[]=a&currency_ids[]=b` or as one comma-separated string.
- `cursor` (query, string): The opaque keyset cursor a previous page returned as `meta.next_cursor`. Omit for the first page.
- `limit` (query, integer): Rows per page, 1 to 200; a value outside the range clamps. Defaults to 50.


### GET `/v1/analytics/transactions/breakdown`

USD-normalised successful-payment totals grouped by one `dimension`: `plan`, `payment_provider`, `currency` or `project`. `dimension` is **required**.

```bash
curl "https://api.subscriby.net/v1/analytics/transactions/breakdown?dimension=payment_provider&period=90d" \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `dimension` (query, string, required): What to group the settled revenue by: `plan`, `payment_provider`, `currency` or `project`. Required.
- `project_id` (query, string): Scope the figures to one project the token may see; omit for every project visible to it. A project outside the token's `scope:project:` allow-list is `404 TENANT_MISMATCH`, an unknown one `404 RESOURCE_NOT_FOUND`.
- `period` (query, string): The preset window: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y` or `all`. Ignored when both `from` and `to` are given; an unknown value falls back to the default rather than failing.
- `from` (query, string): The first day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `to` (query, string): The last day of an explicit window, `YYYY-MM-DD`. Both `from` and `to` are needed to override `period`.
- `plan_ids[]` (query, array): Count only these plans. Send it as `plan_ids[]=a&plan_ids[]=b` or as one comma-separated string.
- `statuses[]` (query, array): Count only payments in these states: `successful`, `failed`, `pending`, `refunded`. Send them as `statuses[]=a&statuses[]=b` or as one comma-separated string.
- `payment_method_ids[]` (query, array): Count only payments taken through these payment methods. Send them as `payment_method_ids[]=a&payment_method_ids[]=b` or as one comma-separated string.


## `activity`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/activity` | `activity:read` | Read a subject's activity | `get_activity_log` |

### GET `/v1/activity`

The newest entries recorded against one subject, `limit` at a time (50 by default, 200 at most), newest first. Name the subject by alias and id:

```bash
curl "https://api.subscriby.net/v1/activity?subject_type=project&subject_id=$PROJECT_ID&limit=20" \
  -H "Authorization: Bearer <token>"
```

There is no paging beyond `limit`: the endpoint is a recent-history read, not an export. The subject is resolved through its own tenant-scoped query before activity is read, so passing the id of a project (or subscription, plan, member) that belongs to another team returns `404 RESOURCE_NOT_FOUND` rather than an empty list; existence never leaks across tenants.

- `subject_type` and `causer_type` use short morph aliases (`project`, `project-subscription`, `project-subscription-plan`, `project-user`, `project-resource`, `user`, …) rather than internal class names. Treat them as opaque strings. The `subject_type` **query parameter** accepts only the aliases listed on the endpoint; a class name is `422 VALIDATION_FAILED`.
- `actor_kind` distinguishes the surface the change came through: `human` (dashboard click), `api_token` (REST), `mcp` (MCP tool), `zapier`, `webhook`, `system` (scheduled job). Filter on it client-side when you need "everything the agent did yesterday" separately from dashboard clicks.
- `properties` keys matching `token`, `secret`, `password`, `api_key` or `api_secret` (case-insensitive) are stripped at any depth before the response leaves the server, so LLM context windows never see credentials that were logged alongside a write.

**Parameters**

- `subject_type` (query, string, required): The kind of subject, as a short alias: `project`, `subscription` (or `project-subscription`), `member` (or `project-user`), `plan` (or `project-subscription-plan`), `access-code`, `coupon` or `project-resource`. A class name is refused.
- `subject_id` (query, string, required): The subject's id.
- `limit` (query, integer): How many of the newest entries to return, 1 to 200; defaults to 50. A value above 200 is refused rather than clamped.

