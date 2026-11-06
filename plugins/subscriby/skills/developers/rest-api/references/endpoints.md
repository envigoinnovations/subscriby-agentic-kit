# REST endpoints: Rest api

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `activity`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/activity` | `activity:read` | Read a subject's activity | `get_activity_log` |

### GET `/v1/activity`

The newest entries recorded against one subject, `limit` at a time (50 by default, 200 at most), newest first. Name the subject by alias and id:

```bash
curl "https://api.subscriby.net/v1/activity?subject_type=project&subject_id=$PROJECT_ID&limit=20" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

There is no paging beyond `limit`: the endpoint is a recent-history read, not an export. The subject is resolved through its own tenant-scoped query before activity is read, so passing the id of a project (or subscription, plan, member) that belongs to another team returns `404 RESOURCE_NOT_FOUND` rather than an empty list; existence never leaks across tenants.

- `subject_type` and `causer_type` use short morph aliases (`project`, `project-subscription`, `project-subscription-plan`, `project-user`, `project-resource`, `user`, …) rather than internal class names. Treat them as opaque strings. The `subject_type` **query parameter** accepts only the aliases listed on the endpoint; a class name is `422 VALIDATION_FAILED`.
- `actor_kind` distinguishes the surface the change came through: `human` (dashboard click), `api_token` (REST), `mcp` (MCP tool), `zapier`, `webhook`, `system` (scheduled job). Filter on it client-side when you need "everything the agent did yesterday" separately from dashboard clicks.
- `properties` keys matching `token`, `secret`, `password`, `api_key` or `api_secret` (case-insensitive) are stripped at any depth before the response leaves the server, so LLM context windows never see credentials that were logged alongside a write.

**Parameters**

- `subject_type` (query, string, required): The kind of subject, as a short alias: `project`, `subscription` (or `project-subscription`), `member` (or `project-user`), `plan` (or `project-subscription-plan`), `access-code`, `coupon` or `project-resource`. A class name is refused.
- `subject_id` (query, string, required): The subject's id.
- `limit` (query, integer): How many of the newest entries to return, 1 to 200; defaults to 50. A value above 200 is refused rather than clamped.


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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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


## `connectors`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/connectors` | `project-connector:view-any` | List the connector directory | `list_connectors` |
| GET | `/v1/connectors/{key}` | `project-connector:view-any` | Get one connector | `get_connector` |

### GET `/v1/connectors`

Every connector Subscriby knows, lane by lane, installable connectors first, each with its badges and, for a registered one, its whole manifest and the connect form. `?status=` narrows to one lane.

```bash
curl https://api.subscriby.net/v1/connectors \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Cards come lane by lane, installable connectors first; within a lane the most installed connector comes first (`installations`, the number of projects running it today, uninstalled rows excluded) and the name breaks ties. The public and in-app directories offer the same order plus Newest (`added_at`) and Name, and filter on `official`, `installable` and `category`; a client sorts and filters on the same fields.

### Lanes and badges

| `status`         | `status_label`    | Meaning                                                                                        |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `available`      | Available Now     | A package is present and configuration offers it; `installable` is `true`.                     |
| `beta`           | Experimental      | Available, and flagged so; a badge on the card, never a gate. `installable` is `true`.         |
| `paused`         | Paused            | Switched off during an incident. Nothing new is installed and sends queue until it is back.    |
| `in_development` | Under Development | A package exists but configuration does not offer it yet (built, on staging, dark).            |
| `coming_soon`    | Coming Soon       | A roadmap entry with no package behind it: the card, the category and an `eta` sentence only.  |

`badges` are facts the platform stamps, never a package's own claim: `official` or `community` (who publishes it), `new` while the listing was added within the last sixty days, `trending` for the connector(s) creators installed most in the last thirty days. A `coming_soon` card carries none.

**Parameters**

- `status` (query, string): Narrow the directory to one lane: `available`, `beta`, `paused`, `in_development` or `coming_soon`. Omit for every lane. An unknown lane is `422 VALIDATION_FAILED` naming the accepted values.


### GET `/v1/connectors/{key}`

One card by key, registered or on the roadmap, in the shape the directory lists.

```bash
curl https://api.subscriby.net/v1/connectors/example \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

### The manifest

Every key from `install_mode` onward describes what a registered connector can do; a roadmap card has them `null` or empty.

- `install_mode`: `paste_credential` (the creator pastes a token the platform issued), `oauth` (the creator authorises an app), `shared_platform` (Subscriby runs one shared presence; nothing to connect).
- `scopes`: `project` for an installation a creator sets up on a project; `platform` for a presence Subscriby itself runs on the connector.
- `resource_kinds`: the kinds of place the connector gates, with the creator-facing `label`, the `portal_label` members see, an `icon` slug, the `grant_mode` (`bearer_link`: a single-use link; `membership`: the connector admits the member itself; `role`: a role is granted; `creator_task`: the creator hands access over by hand), whether a grant can be held ahead of a pass window (`supports_early_admission_hold`), the kind of the same connector a place of this kind can be an in-place upgrade of (`upgrades_from`, or `null`), and the shapes of plan a place of the kind can be sold under (`plan_kinds`: `one_time`, `recurring`, `pass`, `pass_series`, in that order). A resource's `kind` on the [Resources endpoints](https://docs.subscriby.net/api/v1/reference/resources) is `<key>:<kind>`, and the same spelling is what a link request takes. Labels are translated into the token holder's language.
- `capabilities`: the port families the connector implements: `messaging`, `broadcasts`, `access_control`, `early_admission_hold`, `support_relay`, `native_payments`, `portal_login`, `creator_registration`, `management_surface`, `copilot`, `recovery_probes`, `recovery_standby_installations`, `recovery_resource_standby`, `recovery_mirror`, `recovery_identity_relink`.
- `messaging` and `pacing`: the limits every message and every bulk send is checked against.
- `management_commands` and `missing_commands`: which core commands the connector's in-chat surface renders and which it does not; the docs' capability matrix and the Connectors tab show the gaps from these.
- `recovery`: which Disaster Recovery facets the connector implements.
- `portal_cta`: the button the member portal shows to open the connector (`label`, translated, and `icon`), or `null` when the connector has nowhere to open; the portal addresses it through the installation's start link.
- `brand_color`: the platform's brand colour (`#RRGGBB`) for the buttons that open or sign in with the connector, or `null` when the connector declares none.
- `install_fields` and `settings_fields`: the declarative forms. Each field carries `type` (`text`, `secret`, `select`, `toggle`, `instructions`, `link`), a translated `label` and `help`, `required`, the validation `rules`, `options` for a select, a default `value`, the numbered walkthrough `steps` (with `:app` and `:button` placeholders for the app's name and the submit button's label) and `links` naming the text a renderer turns into a link. Render them in order and you have the connect form the dashboard shows.

**Parameters**

- `key` (path, string, required): The connector key from the route.


## `groups`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/groups` | `group:view-any` | List groups | `list_groups` |
| POST | `/v1/groups` | `group:create` | Create a group | `create_group` |
| DELETE | `/v1/groups/{group}` | `group:delete` | Delete a group | `delete_group` |
| GET | `/v1/groups/{group}` | `group:view` | Get a group | `get_group` |
| PATCH | `/v1/groups/{group}` | `group:update` | Update a group | `update_group` |
| PUT | `/v1/groups/{group}/members` | `group:update` | Replace a group's members | `sync_group_members` |

### GET `/v1/groups`

```bash
curl https://api.subscriby.net/v1/groups \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every group across the teams the caller sees, newest first. Rows carry neither `permissions` nor `member_ids`; read a group individually for those. Visibility is the union of every team the caller owns or belongs to; a group from a team the caller cannot see answers `404 RESOURCE_NOT_FOUND` rather than `403`, so the API cannot be used to discover that a group id exists.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/groups`

```bash
curl -X POST https://api.subscriby.net/v1/groups \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "code": "billing-team",
        "name": "Billing Team",
        "permissions": ["project-subscription:view-any"]
      }'
```

> **Choose the code deliberately.** `code` is unique within the team and **cannot be changed afterwards**: permissions are addressed by it. Only `name` and the permission set are mutable.

A group starts empty. Add people with the members endpoint; membership is deliberately not a field here, because replacing who is in a group and naming it are different operations with different consequences.

Answers `201` with the group and its permissions. Emits `group.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the group in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a group cannot be moved between teams.
- `code` (string, required): The machine name, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards because permissions are addressed by it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the group grants. Sending it sets the group's permissions to exactly this list; omit the key to leave the existing set untouched. Defaults to none on create.


### DELETE `/v1/groups/{group}`

```bash
curl -X DELETE https://api.subscriby.net/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. Everyone in the group loses whatever it granted them, but stays in the team. Not gated by tier. Emits `group.deleted`.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/groups/{group}`

One group with its `permissions` and `member_ids`, which are returned when the group is read individually or after a write and omitted from list responses so a listing stays one query.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.


### PATCH `/v1/groups/{group}`

```bash
curl -X PATCH https://api.subscriby.net/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Billing & Finance"}'
```

> **Permissions replace, they do not merge.** Sending `permissions` sets the group's permissions to exactly that list. **Omit the key entirely** to leave the existing set untouched while changing only the name.

`code` and `team_id` are prohibited: a group is neither renamed by code nor moved between teams. Answers `200` with the group and its permissions. Emits `group.updated`.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the group in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a group cannot be moved between teams.
- `code` (string, required): The machine name, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards because permissions are addressed by it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the group grants. Sending it sets the group's permissions to exactly this list; omit the key to leave the existing set untouched. Defaults to none on create.


### PUT `/v1/groups/{group}/members`

```bash
curl -X PUT https://api.subscriby.net/v1/groups/$GROUP_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80", "4b8e2f6a-1c3d-4e5f-9a7b-8c9d0e1f2a3b"]}'
```

This is a **sync**, not an add. The array replaces the membership entirely: anyone omitted is removed, and `[]` empties the group. That is deliberate and differs from the permission field above: clearing a group is a legitimate thing to ask for, whereas silently stripping every permission because a field was blank is not.

This is the one write in the identity surface whose tier gate depends on its argument: a sync that only removes people succeeds on any tier, and one that adds anybody needs Growth. Deciding from the route alone would leave a lapsed creator unable to take one person out of a group without deleting the whole group, and deleting is not gated, so the gate would only be pushing them toward the more destructive option.

Every id must already belong to the group's team. A group grants permissions inside one tenant, so an outsider is refused naming the offending ids; the whole call fails rather than partly applying, so you never end up with a membership you did not ask for.

Answers `200` with the group, its `permissions` and its `member_ids`. Emits `group.members_synced`, which carries `added_ids` and `removed_ids` as well as the final list, so an access-control mirror does not have to diff two snapshots to work out what moved. A sync that changes nothing emits nothing.

**Parameters**

- `group` (path, string, required): The group, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `user_ids` (array of string, required): Every user the group should have afterwards. Must be present; `[]` empties the group. Each id must already belong to the group's team, or the whole call is refused naming the outsiders.


## `me`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/me` | `account:read` | Get the caller's account | `get_me` |
| GET | `/v1/me/alert-destinations` | `account:read` | List your alert destinations | `get_alert_destinations` |
| PUT | `/v1/me/alert-destinations` | `account:write` | Replace your alert destinations | `update_alert_destinations` |
| GET | `/v1/me/copilot-credits` | `account:read` | Your Copilot Credits | `get_copilot_credits` |
| POST | `/v1/me/copilot-credits/packs` | `account:write` | Buy a pack | `create_copilot_credits_pack` |
| PATCH | `/v1/me/copilot-credits/settings` | `account:write` | Change the auto top-up and the cap | `update_copilot_credits_settings` |
| GET | `/v1/me/copilot-credits/statement` | `account:read` | Your statement | `list_copilot_credits_statement` |
| GET | `/v1/me/export` | `account:export` | Read the latest export | `get_account_export` |
| POST | `/v1/me/export` | `account:export` | Ask for an account export | `request_account_export` |
| GET | `/v1/me/identities` | `account:read` | List the caller's linked accounts | `get_me` |
| DELETE | `/v1/me/identities/{identity}` | `account:write` | Unlink an account |  |
| GET | `/v1/me/notifications` | `account:read` | List the caller's notifications | `list_notifications` |
| POST | `/v1/me/notifications/read-all` | `account:write` | Mark every notification read | `mark_all_notifications_read` |
| POST | `/v1/me/notifications/{notification}/read` | `account:write` | Mark a notification read | `mark_notification_read` |
| GET | `/v1/me/partner` | `account:read` | Get your partnership | `get_partner_program` |
| PUT | `/v1/me/partner/payout-details` | `account:write` | Set your payout details | `update_partner_payout_details` |
| GET | `/v1/me/partner/payouts` | `account:read` | List your payouts | `list_partner_payouts` |
| GET | `/v1/me/partner/referrals` | `account:read` | List your referrals | `list_partner_referrals` |
| GET | `/v1/me/partner/referrals/{referral}` | `account:read` | Get a referral | `get_partner_referral` |
| GET | `/v1/me/partner/rewards` | `account:read` | List your commissions | `list_partner_rewards` |
| POST | `/v1/me/partner/terms/accept` | `account:write` | Accept the Partner Program Terms | `accept_partner_terms` |
| GET | `/v1/me/recovery` | `project-recovery:view` | Get the caller's recovery account |  |
| DELETE | `/v1/me/recovery/backup-identity` | `project-recovery:delete` | Remove the backup account |  |
| POST | `/v1/me/recovery/backup-identity` | `project-recovery:create` | Register a backup account |  |
| POST | `/v1/me/recovery/backup-identity/switch` | `project-recovery:create` | Switch to the backup account |  |
| POST | `/v1/me/recovery/handshakes` | `project-recovery:create` | Open a recovery handshake |  |
| DELETE | `/v1/me/recovery/handshakes/{handshake}` | `project-recovery:delete` | Cancel a recovery handshake |  |
| GET | `/v1/me/recovery/handshakes/{handshake}` | `project-recovery:view` | Poll a recovery handshake |  |
| POST | `/v1/me/recovery/handshakes/{handshake}/confirm` | `project-recovery:create` | Confirm a relink handshake |  |
| GET | `/v1/me/transaction-fees` | `account:read` | List your transaction fees | `list_transaction_fees` |
| GET | `/v1/me/transaction-fees/summary` | `account:read` | Get a month's fee summary | `get_transaction_fee_summary` |

### GET `/v1/me`

```bash
curl https://api.subscriby.net/v1/me \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The caller's account; never paginated.

> **Read it once per session.** Nothing here changes under a running client except by an action the client itself takes (linking an account, changing alert destinations, switching plan). Read it on sign-in and after those actions; there is no need to poll it.

- `plan` is the platform tier's type (`free`, `starter`, `growth`, …) while the subscription is active, or `null` without one. It is the plan that gates what you can do, not the one still being billed while past due.
- `capabilities` lists every capability the tiers can grant, each `true` when your plan or an active add-on grants it. The set is fixed by the platform, so a client can render toggles from the keys without knowing them in advance.
- `current_team` is the team the token is scoped to (`scope:team:<uuid>`), when you still belong to it; `null` when the token carries no team scope. Its `id` is the value every project call resolves against.
- `teams` is every team you own or are a member of, the same list as [`GET /v1/teams`](https://docs.subscriby.net/api/v1/reference/teams/list-teams).
- `identities` is the same list as [`GET /v1/me/identities`](https://docs.subscriby.net/api/v1/reference/identities).
- `alert_destinations` is the same list as [`GET /v1/me/alert-destinations`](https://docs.subscriby.net/api/v1/reference/alert-destinations); `alert_destinations_default` is `true` while no destination has been written and the default routing applies (every class to your primary connected account, critical classes by email).
- `unread_notifications` is how many entries of your [Notifications Center](https://docs.subscriby.net/api/v1/reference/notifications) you have not opened, the number on the sidebar entry.
- `partner_code` and `partner_link` are your [Partner Program](https://docs.subscriby.net/api/v1/reference/partner-program) code and the web link it rides on, once Subscriby approved you as a partner; `null` before. The full standing, the referrals, the ledger and the payouts are at `GET /v1/me/partner`.


### GET `/v1/me/alert-destinations`

Your destinations, primary first.

- `kind` is `connector_identity` or `email` (`push_device` is reserved for the creator apps).
- `target` is the connector account's id for `connector_identity`, the same value `GET /v1/me/identities` returns as the account behind a linked identity, or the email address for `email`.
- `classes` lists the alert classes routed here, is `null` for every class, or is `[]` for none (the account is kept but receives nothing).
- `is_primary` marks the destination of your primary connected account. It is derived from your linked identities, never set through this API.

Until you write a destination, you are on the **default**: every class of alert goes to your primary connected account, and the critical classes go to your email as well. The list is empty while the default applies, and the dashboard grid shows the default as every cell ticked on that account. Linking a primary account writes the default down as rows and adds the new account to them, so from then on the rows lead.

> **Critical classes always reach your email.** Recovery, billing and security alerts are sent to your email whatever the destinations say, because they arrive when the connector you would otherwise read them on may have just failed. Routing them to a connected account adds a message there; it never removes the email.


### PUT `/v1/me/alert-destinations`

Takes the complete list you want to keep; anything not in it is removed. Each entry names a `kind`, a `target` and optional `classes`:

```bash
curl -X PUT https://api.subscriby.net/v1/me/alert-destinations \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": [
      { "kind": "connector_identity", "target": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90", "classes": ["sales", "support", "passes"] },
      { "kind": "email", "target": "ada@example.com", "classes": null }
    ]
  }'
```

The response is the resulting list. `PUT` is a replacement, not a patch: send an empty `destinations` list to remove every row and return to the default. `is_primary` in the payload is ignored; the service derives it from your linked identities.

When a creator alert is sent, every connected account routed to its class receives a message through that connector, and email is used when an email destination routes the class, when no connected account does, or when the class is critical. The same routing decides whether the bot messages you at all about a sale, a waiting member or a pass window: a class you route away from an account is never sent there. A newly linked primary account receives a destination for every class automatically, so linking keeps working as it did; unlinking the account removes its destination.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `destinations` (array of object, required): Every destination you want, at most 20. The key must be present; an empty list removes every row and restores the default.
  - `kind` (any, required): `connector_identity` for a connected account or `email` for an address.
  - `target` (string, required): The connected account's id or the email address. It must be one of your own linked accounts or your own address; anything else is refused with `404 RESOURCE_NOT_FOUND` and nothing is written.
  - `classes` (array of any): The alert classes to route here, any of `sales`, `support`, `recovery`, `billing`, `security`, `passes`, `onboarding`. Send `null` for every class or `[]` for none. `is_primary` is not accepted; the service derives it.


### GET `/v1/me/copilot-credits`

```bash
curl https://api.subscriby.net/v1/me/copilot-credits \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One object: the `balance` split into free and paid with what lapses next, this month's free `allowance` used and left, this month's usage per kind, the per-unit prices, the `packs` on sale in this environment and the `settings` the write below changes. An agent asking whether it can afford a turn needs only this.

`exhausted` is true when the pool has nothing left; the monthly allowance may still cover a turn, which is why the Copilot keeps answering on a Free Plan with an empty pool. `paid_spent_this_month_cents` is the figure the cap in `settings` is measured against.


### POST `/v1/me/copilot-credits/packs`

```bash
curl -X POST https://api.subscriby.net/v1/me/copilot-credits/packs \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "pack": "regular" }'
```

Answers `201` with the pack and the Stripe Checkout URL to send the creator to. The session pays with their card and saves it for the auto top-up; the pending purchase is credited, bonus included, when Stripe reports the session paid, and `copilot_credit.purchased` fires then. A session nobody pays expires on its own and grants nothing.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `pack` (one of `starter`, `regular`, `plus`, `max`, required): The four Copilot Credits packs a creator can buy, from the smallest to the largest. Each pack is one Stripe price; what it pays into the ledger and the free bonus that comes with it are configuration, read here so a price change never touches code. The bonus is a free grant, never money on Stripe.


### PATCH `/v1/me/copilot-credits/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/me/copilot-credits/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "auto_topup_pack": "regular", "auto_topup_below_cents": 500 }'
```

Answers `200` with the settings after the change. **Every field is optional and an omitted one keeps its stored value**, so `{ "auto_topup_pack": null }` switches the auto top-up off and changes nothing else. The bounds are the Billing dialog's: a threshold of $1 to $100 and a cap of $0 to $10,000, in cents. Saving the settings resumes an auto top-up a failed charge had paused.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `auto_topup_pack` (any or null): The pack the auto top-up buys when the balance falls under the threshold, one of the packs on sale; null switches the auto top-up off. Switching it on needs a card on file.
- `auto_topup_below_cents` (integer): The balance under which the auto top-up buys, 100 to 10,000 (US cents).
- `monthly_spend_cap_cents` (integer): The paid credit the Copilot may draw in a calendar month before it stops, 0 to 1,000,000 (US cents); the free allowance is never capped.


### GET `/v1/me/copilot-credits/statement`

```bash
curl "https://api.subscriby.net/v1/me/copilot-credits/statement?per_page=50" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Pages the last twelve months of lines, newest first: every pack bought and its bonus, every promotion and goodwill grant, every refund and lapse, and each month's usage per kind. Credits are positive and debits negative, so summing `cents` follows the balance. `sort_by` and `sort_direction` are accepted and ignored: a statement is always newest first.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/export`

```bash
curl https://api.subscriby.net/v1/me/export -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The caller's most recent export, whatever its state; `404 RESOURCE_NOT_FOUND` when none was ever requested. Poll it after a `POST` until `status` is `ready`, then download the zip from `download_url`, a signed link that works until `download_url_expires_at`; every read of a ready export mints a fresh link. The archive itself is removed at `expires_at`, after which `status` reads `expired` and a new export must be requested.

- `status` is `queued`, `building`, `ready`, `failed` or `expired`; only `ready` carries `download_url`.
- `reason` is `manual` for a request from Settings or this endpoint, `deletion` for the archive a scheduled account deletion builds on its own.


### POST `/v1/me/export`

```bash
curl -X POST https://api.subscriby.net/v1/me/export -H "Authorization: Bearer $SUBSCRIBY_TOKEN" -H "Idempotency-Key: 7c1b2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e"
```

Queues an archive of everything the caller's account holds: the account as `GET /v1/me` describes it, the webhook endpoints (never their signing secrets), the platform subscription with its invoices, and for every project the plans, resources, payment methods (never their keys), members, subscriptions, payments, coupons, dated windows and support conversations, each as a JSON file in the shape this API publishes, plus one workbook per project with a sheet per table. Answers `202` with the queued export. The build runs in the background and takes from seconds to a few minutes; the creator is also emailed a signed link when it is ready.

One export may be in flight per account and one may be requested a day; a second request is `422 VALIDATION_FAILED` with the reason and, for the daily limit, when the next one is allowed. Read the existing export instead.

> **The archive holds the members' personal data.** Hand the link only to the creator who owns the token, and treat the file as you would their database.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/identities`

```bash
curl https://api.subscriby.net/v1/me/identities \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every account linked to the caller's creator account, by connector then purpose. Never paginated.

- `purpose` is `primary` (the account that signs you in and receives alerts) or `backup` (the account registered for [Disaster Recovery](https://docs.subscriby.net/account/account-recovery)).
- `source` says how the link was proven: `handshake` (you completed a link from Settings), `bot` (the account came in through the connector's own flow), `backfill` (migrated from before connectors), `portal` or `adopted`.
- `external_id` is the platform's own id for the account, `username` its handle when the platform has one. Secrets and chat rows are never returned.

> **Linking has no endpoint.** Linking is a two-sided proof: you open it from **Settings → Security → Linked accounts** and finish it from the account itself, by opening the link or sending the code to the connector's bot. A token cannot stand in for a person on the connector, so there is nothing to POST here.


### DELETE `/v1/me/identities/{identity}`

```bash
curl -X DELETE https://api.subscriby.net/v1/me/identities/$IDENTITY_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Drops a **primary** link at once and answers an empty `204`. You keep your password and passkeys, so nothing locks you out; what you lose until you link again is the connector side: its bot can no longer reach you or manage your projects, and its sign-in button no longer signs you in.

**Parameters**

- `identity` (path, string, required): One of the caller's links, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/notifications`

```bash
curl "https://api.subscriby.net/v1/me/notifications?unread=1&class=support" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Newest first, paginated with `page` and `per_page` like every list. `unread=1` narrows to entries not yet read (`unread=0` to the ones already read); `class` narrows to one class; `q` to entries whose title or body contains the words.

- `class` is the alert class the creator routes on **Settings → Notifications**: `sales`, `support`, `recovery`, `billing`, `security`, `passes` or `onboarding`; `class_label` is its name in the creator's language.
- `title` and `body` are the alert's heading and one sentence of context, the same words the email used, in the creator's language at the time it was sent.
- `route` and `params` name the dashboard screen the entry opens, as a named route and its parameters, for a client that maps routes to screens; `url` is the same place resolved, for a client that does not. All three are `null` when the alert points nowhere.
- `read` is whether the creator opened it; `read_at` says when.

Every creator alert is written to the notification centre beside whatever else it sends (the email, the message on a connected account the creator routed it to on **Settings → Notifications**). The entry is shaped from the alert's email: its subject becomes the title, its first line the body, its call to action the route and URL. There is no webhook for a new entry; the alerts that matter to an integration already fire their own events (`recovery.*`, `connector.*`, `support.*`), and a Zap that wants the inbox itself polls the `notification_received` trigger.

**Parameters**

- `unread` (query, boolean or null): `1` narrows to entries not yet read, `0` to the ones already read; omit it for both.
- `class` (query, string): Narrow to one alert class: `sales`, `support`, `recovery`, `billing`, `security`, `passes` or `onboarding`. An unknown class is refused.
- `q` (query, string or null): Words the title or body must contain, up to 120 characters.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/me/notifications/read-all`

```bash
curl -X POST https://api.subscriby.net/v1/me/notifications/read-all \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with how many entries were unread and are read now. A second call marks nothing and answers `0`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/notifications/{notification}/read`

```bash
curl -X POST https://api.subscriby.net/v1/me/notifications/$NOTIFICATION_ID/read \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with the entry, `read` now `true`. Idempotent: an entry already read keeps its first `read_at`.

**Parameters**

- `notification` (path, string, required): The row, resolved by the route binder as the caller's.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/partner`

```bash
curl https://api.subscriby.net/v1/me/partner \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Where you stand, whole. `status` is `applied` while Subscriby reviews the application, `active` once approved, `rejected` with `reapply_available_at` when it was declined, or `suspended`. Until approval the computed parts are `null`: there is no `code`, no `links`, no `commission_percent`, no `balance`.

Once approved:

- `code` is the seven-character partner code and `links.web` the address to hand out; `links.connectors` carries one deep link per connector whose bot signs creators up, each opening the sign-up conversation with the code attached.
- `commission_percent` is the rate a creator who converts **from now on** is locked to, as a decimal string with two places. It is a ladder: `base_percent` plus `commitment_points` (the verified promotion commitments) plus `volume_points` (the volume tiers reached at `paying_referrals`), capped at `max_percent`; `next_tier_at` and `next_tier_points` say what the next tier takes and adds. A referral keeps the rate it was promised at conversion; a raise reaches every referral still inside its commission period, a drop only new conversions.
- `referrals` tallies the creators brought in by state, and `balance` carries the ledger's sums as decimal strings with four places in `currency`: `pending` (inside the hold), `payable` (approved and not yet settled, clawbacks netted), `credited`, `paid` and `earned` (all of them together).
- `commitments` lists every promotion commitment with its proof state; a commitment is made and its proof submitted on the dashboard or in the bot, where the rules are explained.


### PUT `/v1/me/partner/payout-details`

```bash
curl -X PUT https://api.subscriby.net/v1/me/partner/payout-details \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "paypal",
    "details": "ada@example.com",
    "legal_name": "Ada Lovelace",
    "tax_country": "GB",
    "us_person": false,
    "accept_terms": true
  }'
```

Writes how you are paid: the rail, what it pays to, and the tax declaration every cash rail needs. `paypal` and `crypto` take their one `details` (the PayPal email, the USDT TRC20 wallet address); `wise` and `remitly` take the bank account (`bank_holder`, `bank_name`, `bank_country`, `bank_account_number`, and `bank_swift`, `bank_branch_code`, `bank_address` when the transfer needs them); `credit` takes nothing and is accepted while that rail is open. Only the destination the chosen rail uses is kept, encrypted; a rail you leave behind keeps nothing on file. The response is the partner object with `payout_method` and `payout_details_complete` updated and the destination absent.

> **The terms come first.** A rail cannot be saved until you have accepted the Partner Program Terms: send `accept_terms: true` here, or call the terms endpoint before.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `method` (one of `credit`, `paypal`, `wise`, `remitly`, `crypto`, required): How a partner takes what the Partner Program owes them. Credit needs nothing typed: an approved commission is applied to the partner's own Stripe balance and offsets their next invoices. The four cash rails are paid by the owner by hand: PayPal and USDT to one typed detail (an email, a wallet address), Wise and Remitly into a bank account (the holder, the bank, its country, the account number, and the codes some transfers need). Either is the partner's money, so it is stored encrypted and never announced. Whatever a rail charges to carry the money comes out of the payout, which the terms say in so many words.
- `details` (string): What a single-detail rail pays to: the PayPal email for `paypal`, the wallet address for `crypto`. Required on those rails, ignored on the others. At most 190 characters.
- `bank_holder` (string): The name on the bank account, for `wise` and `remitly`. At most 120 characters.
- `bank_name` (string): The bank, for `wise` and `remitly`. At most 120 characters.
- `bank_country` (string): Where the bank is, as an ISO 3166-1 alpha-2 code, for `wise` and `remitly`.
- `bank_account_number` (string): The account number or IBAN, for `wise` and `remitly`: letters, digits, spaces and dashes, at most 40 characters.
- `bank_swift` (string): The SWIFT or BIC code, when the bank has one: 8 or 11 characters.
- `bank_branch_code` (string): The branch, routing, sort or IFSC code, when the transfer needs one: letters, digits, spaces and dashes, at most 20 characters.
- `bank_address` (string): The account holder's address, when the transfer needs one. At most 200 characters.
- `legal_name` (string): The name a payment is made out to. Required on every cash rail. At most 120 characters.
- `tax_country` (string): The country of tax residence, as an ISO 3166-1 alpha-2 code. Required on every cash rail.
- `us_person` (boolean): Whether you are a US person for tax purposes.
- `accept_terms` (boolean): Send `true` to accept the Partner Program Terms with this save. A rail cannot be saved until the terms are accepted, here or through the terms endpoint.


### GET `/v1/me/partner/payouts`

Pages the cash Subscriby paid you, newest first: the `amount`, the rail it went by (`method` is `paypal`, `wise`, `remitly` or `crypto`), the transfer's `reference`, when it left and how many commissions it covered (`rewards_paid`). Commissions settled as Subscriby Credit are not payouts; they read as `credited` on the rewards list.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/partner/referrals`

```bash
curl "https://api.subscriby.net/v1/me/partner/referrals?status=converted&per_page=25" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Pages the creators you brought to Subscriby, newest first. `status` is `signed_up`, `converted`, `under_review`, `expired` or `rejected`. Each row names the referred creator by display name alone: they are a Subscriby customer, not yours, so their email and id never appear. An application still under review has no referrals and answers an empty page.

**Parameters**

- `status` (query, string): Keep only referrals in this state: `signed_up`, `converted`, `under_review`, `expired` or `rejected`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/partner/referrals/{referral}`

One referral: how the creator arrived (`source` is `link`, `code_at_signup` or `bot_deep_link`), whether their first paid invoice converted them and on which `plan`, the `commission_percent` locked onto them at conversion, and `commission_ends_at`, when you stop earning on them. Another partner's referral is `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `referral` (path, string, required): The referral, resolved within the caller's partnership by the route binder.


### GET `/v1/me/partner/rewards`

```bash
curl "https://api.subscriby.net/v1/me/partner/rewards?status=approved" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Pages the commission ledger, newest first: one `commission` row per paid platform invoice of a referred creator, priced from the invoice's total before tax and after discount (`base_amount`) at the referral's locked rate (`amount`), plus the `clawback` rows that answer a reversal of money already settled, each with a negative `amount`. `status` is `pending` (inside the hold), `approved` (payable), `credited` (applied as Subscriby Credit), `paid` (covered by a cash payout) or `reversed`; `note` says why a row was reversed or re-priced. The ledger is read-only on every surface: rows are written by invoices, moved by the hold, settled by a credit or a payout and reversed by a refund or a dispute.

**Parameters**

- `status` (query, string): Keep only rows in this state: `pending`, `approved`, `credited`, `paid` or `reversed`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/me/partner/terms/accept`

```bash
curl -X POST https://api.subscriby.net/v1/me/partner/terms/accept \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Records that you accept the [Partner Program Terms](https://www.subscriby.net/legal/partners) as they stand today, with their version; accepting again after the terms change is the same call. Answers the partner object with `terms_accepted_at` and `terms_version` set. Emits no event.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/recovery`

```bash
curl https://api.subscriby.net/v1/me/recovery \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Recovering the creator's sign-in account, and keeping a backup account ahead of a ban, are two-sided **handshakes**: the API mints a code, the creator taps the link (or types the code) from the account to detect, the connector records which account that was, and the API confirms. Both sides have to agree, which is what keeps a leaked link from binding a stranger. These endpoints live under `/v1/me` because they are about the caller, never a project, and the actions behind them refuse anyone but the account holder.

These flows are deliberately not offered as MCP tools: moving a sign-in is a human act, and [`get_me`](https://docs.subscriby.net/mcp/v1/tools/account/get-me) already shows which accounts are linked.

- `primary_display_name` and `backup_display_name` name the accounts as the connector reported them; their identifiers on the connector never appear.
- `relink_handshake` and `backup_handshake` are the newest handshake of each kind, in whatever state, so a client can pick up a flow the creator started on the dashboard or in the bot.


### DELETE `/v1/me/recovery/backup-identity`

Stops keeping a backup. Answers `204`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/recovery/backup-identity`

```bash
curl -X POST https://api.subscriby.net/v1/me/recovery/backup-identity \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"handshake_id": "0c4f9e2a-7b31-4d68-a5e2-9f1c3b7d6e80"}'
```

Registers the account a **completed backup** handshake detected as the backup (Growth Plan). Answers `200` with the account summary.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `handshake_id` (string, required): A `backup` handshake of the caller's in state `completed`; the account that tapped it becomes the backup.


### POST `/v1/me/recovery/backup-identity/switch`

Moves the sign-in to the backup right now, keeping the previous account as the new backup; spends the account allowance and offers the same undo as a relink. Answers `200` with the recovery operation and raises `recovery.identity_relinked` beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/recovery/handshakes`

```bash
curl -X POST https://api.subscriby.net/v1/me/recovery/handshakes \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"kind": "relink"}'
```

`kind` is `relink` (move the sign-in to a new account; needs the account recovery allowance) or `backup` (register a backup account; needs the Growth Plan). Answers `201` with the pending handshake: `code` is the eight-character code to type into the bot, `start_link` the link that opens the bot on it (`null` when the creator cannot be reached on the connector), and the handshake expires fifteen minutes after it was minted.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `relink`, `backup`, required): What a completed identity handshake is for. The same deep link and the same bot-side verification serve two purposes: replacing the creator's identity after a ban (`Relink`), and registering a second identity ahead of time so a later ban is a one-click switch (`Backup`). The kind is fixed when the handshake opens, so a link minted to register a backup can never be used to replace the primary identity.


### DELETE `/v1/me/recovery/handshakes/{handshake}`

Cancels a pending handshake so its code stops working. Answers `204`.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/recovery/handshakes/{handshake}`

`status` moves from `pending` to `completed` when an account taps, with `detected_display_name` and `detected_identity_id` filled; `expired` when the code ran out or was cancelled; `consumed` once confirmed.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.


### POST `/v1/me/recovery/handshakes/{handshake}/confirm`

Confirms a **completed relink**: the sign-in moves to the account that tapped, every browser session is signed out, the account allowance is spent, and the undo mail goes out. Answers `200` with the recovery operation (`kind: account`, `revertible: true`) and raises `recovery.identity_relinked` beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/transaction-fees`

```bash
curl "https://api.subscriby.net/v1/me/transaction-fees?month=2026-10&channel=metered" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Pages the ledger, the most recently incurred first. `month` keeps one calendar month (`YYYY-MM`, UTC) and wins over `from` and `to`, which bound the window by instant; `project_id` keeps one project's lines; `channel` is `connect_at_source` or `metered`; `kind` is `payment_fee`, `access_code_fee`, `trial_usage`, `outage_emails` or `processing_recovery`. Sort with `sort_by` (`occurred_at` by default, or `fee_amount`, `units`, `kind`, `channel`, `created_at`) and `sort_direction`.

Each row names what the fee was for and, for a payment's fee, the project, the member, the purchase and the payment it was priced from with the gross amount, the currency and the rate applied. `fee_amount` is in `fee_currency`, your billing currency; `units` are the cents the meter counted, zero on a fee taken at source. A line of a different kind (a trial's waived fees, a recovery's emails, an invoice's processing recovery) carries its `meter_identifier` and no payment.

**Parameters**

- `month` (query, string): Keep only the lines of one calendar month, as `YYYY-MM` in UTC, such as `2026-10`; wins over `from` and `to`.
- `from` (query, string): Keep only lines incurred at or after this instant, ISO 8601.
- `to` (query, string): Keep only lines incurred before this instant, ISO 8601.
- `project_id` (query, string): Keep only the lines earned on this project.
- `channel` (query, string): Keep only lines collected one way: `connect_at_source` (deducted from the member's payment by Stripe Connect) or `metered` (billed on your own Subscriby invoice).
- `kind` (query, string): Keep only lines of one kind: `payment_fee`, `access_code_fee`, `trial_usage`, `outage_emails` or `processing_recovery`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/transaction-fees/summary`

```bash
curl "https://api.subscriby.net/v1/me/transaction-fees/summary?month=2026-10" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Adds up one calendar month, the current one when `month` is left out. `total_fee` is every line; `at_source_fee` is what Stripe Connect deducted from members' payments and never invoiced; `metered_fee` is what reached the usage meter, the figure to hold against that month's Transaction Fees line on your Subscriby invoice, split into `invoiced_fee` (a paid invoice has collected it) and `awaiting_invoice_fee` (it lands on the next one). `by_kind` lists the month per kind of fee, `by_project` per project largest first (the fees no project carries pool under a null id), and `invoices` the Subscriby invoices that billed the month's metered lines. Pass `project_id` to add up one project alone; `by_project` is then empty.

**Parameters**

- `month` (query, string): The calendar month to add up, as `YYYY-MM` in UTC, such as `2026-10`; the current month when left out.
- `project_id` (query, string): Add up one project's lines alone; every project when left out, in which case the per-project shares are returned too.


## `ping`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/ping` | none | Check the API is up |  |

### GET `/v1/ping`

```bash
curl https://api.subscriby.net/v1/ping
```

Answers `200` with `data.status` of `ok`, the API version and the current server time in ISO 8601. No `Authorization` header is read and no rate limit applies, so a monitor may call it on a schedule.


## `projects`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects` | `project:view-any` | List projects | `list_projects` |
| POST | `/v1/projects` | `project:create` | Create a project | `create_project` |
| DELETE | `/v1/projects/{project}` | `project:delete` | Delete a project | `delete_project` |
| GET | `/v1/projects/{project}` | `project:view` | Get a project | `get_project` |
| PATCH | `/v1/projects/{project}` | `project:update` | Update a project | `update_project` |
| POST | `/v1/projects/{project}/archive` | `project:update` | Archive a project | `archive_project` |
| GET | `/v1/projects/{project}/connectors` | `project-connector:view-any` | List a project's installations | `list_connector_installations` |
| DELETE | `/v1/projects/{project}/connectors/{key}` | `project-connector:delete` | Uninstall a connector | `uninstall_connector` |
| POST | `/v1/projects/{project}/connectors/{key}` | `project-connector:create` | Install a connector | `install_connector` |
| DELETE | `/v1/projects/{project}/connectors/{key}/installation` | `project-connector:delete` | Disconnect an installation | `disconnect_connector` |
| GET | `/v1/projects/{project}/connectors/{key}/installation` | `project-connector:view` | Get a project's installation of a connector | `get_connector_installation` |
| GET | `/v1/projects/{project}/connectors/{key}/installation/actions` | `project-connector:view` | List what an installation can do for the creator | `list_connector_installation_actions` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/actions/{actionKey}` | `project-connector:update` | Have an installation do one of the things it offers | `run_connector_installation_action` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/doctor` | `project-connector:update` | Run the connector doctor | `run_connector_doctor` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/restore-access` | `project-connector:update` | Restore access after a reinstall | `restore_connector_access` |
| PATCH | `/v1/projects/{project}/connectors/{key}/installation/settings` | `project-connector:update` | Change an installation's settings | `update_connector_installation_settings` |
| GET | `/v1/projects/{project}/connectors/{key}/installation/spaces` | `project-connector:view` | List the places an installation could gate | `list_connector_spaces` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/verify` | `project-connector:update` | Verify an installation | `verify_connector_installation` |
| GET | `/v1/projects/{project}/connectors/{key}/uninstall-preview` | `project-connector:view` | Preview an uninstall | `get_connector_uninstall_preview` |
| POST | `/v1/projects/{project}/restore` | `project:update` | Restore a project | `restore_project` |

### GET `/v1/projects`

```bash
curl https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every project visible to the token, newest first, paged with `page` and `per_page` (default 25). A token minted with `scope:project:<uuid>` entries lists only those projects.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects`

```bash
curl -X POST https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research Premium",
    "description": "Weekly deep-dive research notes.",
    "handle": "research-premium"
  }'
```

Banner and photo are optional image uploads. Send `multipart/form-data` when you want the API to accept the raw image:

```bash
curl -X POST https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -F "name=Research Premium" \
  -F "description=Weekly deep-dive research notes." \
  -F "banner=@./banner.jpg" \
  -F "photo=@./avatar.jpg"
```

Answers `201` with the project and emits `project.created`. Creating a project enforces the creator's tier project limit; exceeding it is `403 TEAM_TIER_REQUIRED` with a `required_capability` hint in `error.context`.

### Validation rules

Enforced on both create and update (every field is optional on update):

- `name`: required on create. String, 5–255 characters.
- `description`: optional. String, max 1,000 characters. HTML is filtered to a safe subset before storage.
- `terms`, `privacy`: optional. URLs, max 255 characters each.
- `banner`, `photo`: optional. Image uploads, max **5 MB** each, sent as `multipart/form-data`.
- `handle`: optional, on every tier. Lowercase alpha-dash ASCII, 5–255 characters, unique across every project's current and former handles. Omitted, a random handle is assigned; it can be changed later, and every former handle keeps redirecting to the current one.
- `active`: optional boolean.
- `storefront_arrangement`: optional, `manual` or `live`. `live` is refused with `TEAM_TIER_REQUIRED` when the project owner's plan or addons do not include time-limited passes; `manual` is always accepted.
- `outage_compensations`: optional boolean, `true` on every new project. **Outage Compensation**: when a platform refuses the project's connector for an hour or more and later answers again, every member whose paid access overlapped the gap gets the lost time added to the end of their access automatically, so nobody pays for days they could not use. Set it to `false` when the creator would rather settle outages themselves, for example with refunds or coupons. See [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages).
- `team_id`: optional UUID; must be a team the token's owner belongs to. Defaults to the token's scoped team.

> **Artwork is processed after the request.** The response body returns the project's metadata only, not the hosted image URLs. Image processing (resize, re-encode, upload to storage) runs on the server after a successful create or update; clients that need the hosted URL should fetch the project once upload is complete.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}`

Deletes the project and everything under it. Returns `204 No Content` and emits `project.deleted`. Prefer archiving when you want to pause intake without losing history.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}`

One project. A project outside the token's team or its project scope is `404 RESOURCE_NOT_FOUND`.

`outage_compensations` is the project's **Outage Compensation** switch, `terms` and `privacy` the URLs members are asked to accept, and `banner_url` / `photo_url` the hosted artwork (null until uploaded). `storefront_arrangement` says how the portal, the embed and the bot order the plans on offer: `manual` is the order pinned through [Arrange the storefront order](https://docs.subscriby.net/api/v1/reference/plans/arrange-the-storefront-order), with passes, seasons and then subscriptions, cheapest first, behind anything unpinned; `live` puts the passes and seasons whose access is on now first, the one ending soonest at the top, then those opening soonest, then everything else in the pinned order, so a creator selling dated passes never has to re-arrange. `live` needs the owner's time-limited passes capability (Growth, or the Passes Addon on any plan): setting it without one is refused with `TEAM_TIER_REQUIRED`, and when the capability lapses the storefronts fall back to the pinned order at once while the stored value is reset to `manual` with a `project.updated` event. A project has no platform field: it installs [connectors](https://docs.subscriby.net/api/v1/reference/connectors), and the project's connectors list names them. Clients that read a `type` on projects before 5.0 must switch to the connectors list; the field is gone.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}`

Every field is optional; only the fields present in the body change, under the same validation rules as create. Sending a new `handle` moves the portal URL at once, and every address the project answered on before keeps redirecting to the current one; a blank handle switches the portal page off. Answers `200` with the project and emits `project.updated`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/archive`

Switches the project off: `active` becomes `false`, the portal stops selling, and every plan, member and payment method is kept. Archive and restore are RPC-style actions separate from the update: they preserve the project's data while flipping `active`, so prefer them over delete when you want to pause intake without losing history. Answers `200` with the project and emits `project.archived`. Gated on `project:update`, not `project:delete`, because it flips one column of the project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors`

Every installation the project holds, live and standby, oldest first.

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

`role` is `live` for the one that acts and `standby` for the spare the Disaster Recovery Program keeps; `state` is `pending`, `connected`, `degraded` (the health probe found something wrong, `state_reason` and `state_detail` say what, `creator_actionable` whether the creator can fix it), `revoked` (the platform withdrew it) or `disconnected` (the creator did); `operational` is the one-word answer to "can it act right now?". `external_id`, `display_name`, `handle` and `avatar_url` are the platform's own account for the installation. Credentials and settings are never serialised.

`sales_paused` and `outage` describe a connector outage: the platform refused this live installation outright (token revoked or regenerated, bot deleted). While `sales_paused` is `true`, `outage` carries the outage's `id`, the connector's `reason` code and `started_at`, and every plan that unlocks a place on this connector is refused at checkout with `422 VALIDATION_FAILED`; both go back to `false` and `null` when the installation answers again, is replaced or is uninstalled. [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages) describes what members see and how they are compensated; [`connector.outage_opened`](https://docs.subscriby.net/webhooks/v1/events/connector/connector-outage-opened) and [`connector.outage_closed`](https://docs.subscriby.net/webhooks/v1/events/connector/connector-outage-closed) announce both ends.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### DELETE `/v1/projects/{project}/connectors/{key}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"unpublish_emptied_plans": true, "cancel_recurring_subscriptions": false}'
```

In order: the connector puts every member outside while its credentials still work, the rows are retired in one transaction (grants revoked, resources detached, the installation kept with `uninstalled_at`), the connector withdraws the installation, and the two opt-ins run. `unpublish_emptied_plans` (default `true`) takes the emptied plans off sale, firing `plan.deactivated` per plan; `cancel_recurring_subscriptions` (default `true`) cancels their live recurring subscriptions at the end of the paid period, firing `subscription.cancelled` per subscription and emailing each member that their subscription will not renew. One-time and lifetime purchases are never cancelled; a refund stays the creator's call. Identities are never removed. `connector.uninstalled` fires with the counts. Installing the connector again brings the same installation back as pending with its settings kept.

The two opt-ins travel in the JSON body or as query parameters; on by default, they only need sending to switch one off.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `unpublish_emptied_plans` (query, boolean): Take the plans the uninstall leaves with nothing to grant off sale, firing `plan.deactivated` per plan. Defaults to true; send `false` to leave them on sale.
- `cancel_recurring_subscriptions` (query, boolean): Cancel the live recurring subscriptions on those plans at the end of their paid period, firing `subscription.cancelled` per subscription and emailing each member. Defaults to true; one-time and lifetime purchases are never cancelled.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/connectors/{key}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Installing and connecting are two acts. Installing says "this project runs this connector" and opens a **pending** installation with no credentials (`201` with the installation; `200` with the existing one when it was already installed, nothing changed). Connecting, which hands the connector the creator's credentials, stays on the dashboard, where the connector's declared `install_fields` are rendered and the platform is asked to describe the installation before anything is bound; a REST client cannot prove a credential is its own to bind. An uninstalled connector installed again comes back as pending with its settings kept.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/connectors/{key}/installation`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The connector withdraws the installation on its platform, the credentials are wiped and the installation turns `disconnected`; the row stays and can be connected again from the dashboard. Grants, resources, plans and identities are untouched, and members keep the access they hold. Answers `204`; an installation already disconnected is left alone. Disconnecting is not uninstalling: uninstalling, with its impact preview over the plans it would empty, is the separate act below.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors/{key}/installation`

The project's installation of that connector in the live role, in whatever state, in the shape the installations list describes.

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### GET `/v1/projects/{project}/connectors/{key}/installation/actions`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/actions \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

A connector declares the things its installation can set up on its platform as data, so every surface offers them the same way: each action carries its `key`, the `label` a button says, a `description` of what will happen, the `fields` the creator fills in first (the same shape as the connector's `install_fields`) and the `confirm` question a client asks before running, with `needs_confirmation` saying whether to ask. The list is empty for a connector that offers none, while the connector is paused, and while the installation cannot act. Run one with the endpoint below.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### POST `/v1/projects/{project}/connectors/{key}/installation/actions/{actionKey}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/actions/setup_members_area \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "fields": { "category_name": "Inner Circle" } }'
```

Runs one action the actions endpoint listed, on the platform. `fields` is an object keyed by the names the action declares; each answer is checked against the field's rules before the connector acts, and a name the action never declared is refused. The answer says what happened in the creator's words: `done` true with a `message` and whatever the connector reports in `details`, or `done` false with the reason and, when the platform refused, the classified `failure`. This changes the platform itself (it may create channels, roles or categories), so an action whose `confirm` is set is run only once the creator has agreed. The dashboard's row menu, the `run_connector_installation_action` tool and the automation surfaces run the same action.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `actionKey` (path, string, required): The action key from the route, as the actions endpoint lists it.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `fields` (array of string): The answers as an object keyed by the field names the action lists under `fields`; a name the action never declared is refused, and each declared rule runs.


### POST `/v1/projects/{project}/connectors/{key}/installation/doctor`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/doctor \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The **Run Doctor** button of the dashboard. The installation is verified exactly as the verify endpoint does it, then the connector is asked about every resource the installation gates, and the answer is one report: a finding for the installation, then one per resource, each with a `severity` (`ok`, `warning`, `critical`), the connector's own `state` word, a sentence in the creator's language, whether the creator can fix it (`creator_actionable`) and where (`fix_url`). A resource the connector has no place for is a `warning`, never silence. `healthy` is `true` when every finding is `ok`.

The report is kept on the installation (`doctor_ran_at` and `doctor_healthy` on the installation object) and `connector.doctor_completed` fires only when the findings differ from the previous run's.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/connectors/{key}/installation/restore-access`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/restore-access \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The **Restore Access** item of the dashboard's Connectors tab, offered while an uninstall has left the project detached places on the connector. Once the connector is installed and connected again, every detached place is asked about through the connector; the ones it still controls are made active and healthy again, and every live purchase of a plan that grants them is handed fresh access: only the grants the purchase lacks are issued, which are exactly the ones the uninstall took away, and `member.resource_added` fires per grant. A place the connector no longer controls stays detached for the doctor to explain. Plans the uninstall took off sale stay off sale until you publish them again.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### PATCH `/v1/projects/{project}/connectors/{key}/installation/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"settings": {"greeting": "Welcome aboard"}, "capabilities": {"broadcasts": false}}'
```

`settings` is an object keyed by the field names the connector declares in its `settings_fields` (read them from the card). Every declared rule runs; a key the connector never declared is `422 VALIDATION_FAILED` naming it; fields left out keep their value.

`capabilities` is an object keyed by capability to `true` or `false`: the project's switches for what the connector may do on this installation. A project keeps a connector for access alone by switching off `messaging`, `broadcasts`, `support_relay`, `native_payments` or any `recovery_*` facet; every core surface asks the switch before it invokes the connector, so a switched-off broadcast is refused before it is queued and a switched-off health check is skipped. A capability the connector does not declare, or one that cannot be switched off (`access_control`, `early_admission_hold`, `management_surface`, `portal_login`, `creator_registration`), is `422 VALIDATION_FAILED` naming it; switches left out keep their value. At least one of `settings` and `capabilities` is required.

Answers `200` with the installation, which never carries the settings themselves because a settings field may be a secret, but does carry `capabilities`: every capability the connector declares, each with `enabled` and `toggleable`. `connector.settings_updated` fires naming the fields and the switches (`capabilities.<key>`) that changed, only when something did.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `settings` (array of string): An object keyed by the field names the connector declares in its `settings_fields` (read them from the connector's card). Every declared rule runs; a key the connector never declared is `422 VALIDATION_FAILED` naming it.
- `capabilities` (array of boolean): An object keyed by capability to `true` or `false`: the project's switches for what the connector may do on this installation. A capability the connector does not declare, or one that cannot be switched off (`access_control`, `early_admission_hold`, `management_surface`, `portal_login`, `creator_registration`), is `422 VALIDATION_FAILED` naming it.


### GET `/v1/projects/{project}/connectors/{key}/installation/spaces`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/spaces?kind=role" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

A connector whose installation can list the places it administers (a server's roles and channels) lets a creator pick one instead of answering a picker on the platform; its directory card declares `space_browsing`. This is that list, read from the platform on every call: a place made a moment ago is on it, a deleted one is not. `kind` is one of the connector's `resource_kinds`, as a bare word (`role`) or spelled `connector:kind` (`example:role`). Pass a place's `external_id` to the from-space endpoint of the Resources API to sell it. A connector that cannot list its places answers `422 VALIDATION_FAILED`; the link request is its door.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `kind` (query, string, required): The kind of place to list: one of the connector's `resource_kinds` as the connector directory spells them, either the bare kind word (`role`) or spelled `connector:kind` with this connector's key (`discord:role`).


### POST `/v1/projects/{project}/connectors/{key}/installation/verify`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/verify \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

A fresh probe rather than the hourly one: the connector is asked whether the installation still answers and the verdict is recorded, so `state` becomes `connected`, `degraded` (with `state_reason`, `state_detail` and `creator_actionable`) or `revoked`, and `health_checked_at` is stamped. Answers `200` with the installation. A `pending` installation has nothing to verify and is returned as it is. `connector.status_changed` fires only when the state moved.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors/{key}/uninstall-preview`

Uninstall deletes nothing and touches no money by itself, and it is always previewed first:

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/uninstall-preview \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

- `resources` are the connector's on the project (manual perks are never among them); they will be deactivated and marked `detached`, their external ids kept.
- `live_grants` are the pending, held and granted grants on those resources; each is revoked with reason `connector_uninstalled` and fires `member.resource_removed`.
- `emptied_plans` are the plans that would keep no active grantable resource; `recurring_subscriptions` and `one_time_subscriptions` are the live purchases on them, `affected_subscription_ids` names them.
- `upcoming_windows`, `open_support_threads` and `member_identities` are informational: pass windows are never cancelled for you (cancel them from the pass window endpoints, which handle refunds), support threads lose their reach, and member accounts are never removed.
- `options` are the two opt-ins with their defaults, exactly the names the `DELETE` takes.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### POST `/v1/projects/{project}/restore`

Switches an archived project back on. Answers `200` with the project and emits `project.restored`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `broadcasts`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/broadcasts` | `broadcast:read` | List broadcasts | `list_broadcasts` |
| POST | `/v1/projects/{project}/broadcasts` | `broadcast:send` | Send a broadcast | `broadcast_message` |
| GET | `/v1/projects/{project}/broadcasts/audiences` | `broadcast:send` | List every audience | `list_broadcast_audiences` |
| GET | `/v1/projects/{project}/broadcasts/preview` | `broadcast:send` | Preview an audience | `preview_broadcast_audience` |
| GET | `/v1/projects/{project}/broadcasts/{broadcast}` | `broadcast:read` | Read a broadcast | `get_broadcast` |
| GET | `/v1/projects/{project}/broadcasts/{broadcast}/failures` | `broadcast:read` | List the members a broadcast missed | `get_broadcast` |
| POST | `/v1/projects/{project}/broadcasts/{broadcast}/retry` | `broadcast:send` | Retry a broadcast | `retry_broadcast` |

### GET `/v1/projects/{project}/broadcasts`

Every broadcast the project sent since history began, newest first, with who sent it and from where, the audience, the tallies and `progress.line`, the sentence the creator reads on the dashboard's Broadcasts page. `filter` keeps to one face (`sending` for the ones still moving, `completed`, `failed`); `status` keeps to one exact status. Pages with `per_page`, `page`, `sort_by` (`created_at`, `status`, `sent_count`, `failed_count`, `finished_at`) and `sort_direction`.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts?filter=completed" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

A send made before the release that introduced the ledger has no row, so a `broadcast_id` remembered from an older `broadcast.queued` event answers `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `filter` (query, string): Keep to one face: `sending` (queued, sending or paused), `completed` or `failed`. Omit for every broadcast.
- `status` (query, string): Keep to one exact status: `queued`, `sending`, `paused`, `completed` or `failed`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/broadcasts`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "<b>New drop is live</b>\nDoors open at 19:00 UTC.",
    "audience": "customer"
  }'
```

`202`, not `200`: the send is queued and runs in the background at roughly 28 messages a second to stay inside the platform's rate limit. The response describes what was *addressed*, not what was delivered.

### Audience segments

| Segment                          | Who it addresses                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `all`                            | Every member reachable on the project's connector, whatever their status.                 |
| `customer`                       | Members holding a paid subscription right now.                                            |
| `trialing`                       | Members currently inside a free trial.                                                    |
| `lead`                           | Members who have used the project's bot but never subscribed.                             |
| `churned`                        | Members who were customers and are not any more.                                          |
| `expiring_soon`                  | Members whose subscription genuinely lapses within `expiring_within_days`.                |
| `cancelled_still_active`         | Members who cancelled but have not run out yet: still reachable, still winnable.          |
| `paused`                         | Members who paused their subscription rather than ending it.                              |
| `trialing_cardless`              | Members trialing without a card on file, who will not convert on their own.               |
| `waiting_on_connection`          | Members whose purchase includes a place on a platform they have not connected yet.        |
| `all_pass_holders`               | Everyone holding a valid pass for any upcoming window.                                    |
| `all_pass_holders_not_in_queue`  | Everyone who has not tapped their invite link, across every upcoming window.              |
| `pass_holders`                   | Everyone holding a valid pass for one access window you choose (`pass_window_id`).        |
| `pass_holders_not_in_queue`      | Holders of one window you choose who have not tapped their invite link yet.               |

A member is a recipient only if they have a linked chat **on that project's connector**. Members with no chat, or whose chat belongs to a different installation, are excluded silently, which is why `recipient_estimate` is frequently well below a project's total membership.

> **An auto-renewing subscription is never `expiring_soon`.** A subscription's `ends_at` is rewritten to the new period end on every renewal, so a date inside the horizon describes an auto-renewing member's next **invoice** rather than an expiry. Counting it would place every monthly subscriber in this segment once a month. A member is counted only when their access genuinely lapses: they have cancelled, or the plan is not recurring.

### Narrowing a segment to a plan

`plan_id` **composes** with `audience` rather than replacing it:

| Request                                     | Who it addresses                         |
| ------------------------------------------- | ---------------------------------------- |
| `audience=customer` + `plan_id=<gold>`      | People paying for Gold right now.        |
| `audience=churned` + `plan_id=<gold>`       | People who held Gold and left.           |
| `audience=paused` + `plan_id=<gold>`        | People whose *paused* plan is Gold.      |
| `audience=expiring_soon` + `plan_id=<gold>` | Gold members lapsing inside the horizon. |

The plan and the state describe the **same subscription**, so a member paying for Silver who once trialled Gold is not matched by the first row. `churned` is the deliberate exception in the other direction: the subscription proving they held the plan is the one that ended, so it is not required to be live.

A `plan_id` sent with `lead` or a pass segment is **refused with `422` and `reason: plan_filter_unsupported`**, not ignored. Silently dropping it would return a recipient count for a different audience than the request described, and a caller has no way to notice.

### Message formatting

The body is reduced to the HTML subset the delivering connector accepts before sending; for the messaging connector that is `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<ins>`, `<s>`, `<strike>`, `<del>`, `<a>`, `<code>`, `<pre>`, `<blockquote>` and `<tg-spoiler>`. Anything else is **stripped, not escaped**: the platform rejects an entire message containing an unknown tag, so removing it is what keeps the message deliverable.

The 4,096-character limit is the platform's own. A longer body is refused here rather than being truncated per recipient.

### Refusals

Every `422` is refused **before** anything is queued. The underlying job re-checks the same conditions and aborts silently, which is correct for a background job and wrong for an API caller, so the endpoint rejects them up front rather than returning `202` for a send that could never leave. A segment that resolves to zero recipients is the send action's own refusal, shared with the dashboard: it is not queued.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `message` (string, required): The message body, 1 to 4,096 characters, in the HTML subset the delivering connector accepts. Unknown tags are stripped rather than escaped, because the platform rejects a whole message that holds one.
- `audience` (one of `all`, `customer`, `trialing`, `lead`, `churned`, `expiring_soon`, `cancelled_still_active`, `paused`, `trialing_cardless`, `waiting_on_connection`, `all_pass_holders`, `all_pass_holders_not_in_queue`, `pass_holders`, `pass_holders_not_in_queue`): Who a broadcast is addressed to. Previously a bare string that BroadcastMessageJob fed to `ProjectUserStatus::tryFrom()`, which quietly meant "anything unrecognised * broadcasts to everyone" — a typo in the audience widened the send rather than refusing it. The pass segments cannot be expressed as a status at all: they are a fact about a subscription bound to a window, not about the member. Declaration order is the order the picker offers them, so each pass segment's every-window form sits above the one that asks for a single date. The backing values of the status-derived cases match ProjectUserStatus so a broadcast queued before this enum existed still resolves.
- `pass_window_id` (string): The access window for `pass_holders` and `pass_holders_not_in_queue`; required by those two, ignored by every other segment.
- `plan_id` (string): Narrow the segment to members whose subscription is on this plan; it composes with `audience` rather than replacing it. Refused, not ignored, for `lead` and the pass segments.
- `expiring_within_days` (integer): The horizon `expiring_soon` counts within, 1 to 90; defaults to 7. Read by no other segment.


### GET `/v1/projects/{project}/broadcasts/audiences`

All thirteen segments with labels, descriptions and current counts, so a UI can offer them without hard-coding the list. Segments that address a single window report `recipient_estimate: null`; they cannot be sized without a window id.

| Field                           | Type            | Meaning                                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `value`                         | string          | The segment key to send as `audience`.                                           |
| `label`, `description`          | string          | The words the dashboard shows, in the creator's language.                        |
| `requires_pass_window`          | boolean         | Whether the segment needs a `pass_window_id`.                                    |
| `supports_plan_filter`          | boolean         | Whether `plan_id` is accepted. False for `lead` and the pass segments.           |
| `requires_expiring_within_days` | boolean         | Whether the segment reads a horizon. True only for `expiring_soon`.              |
| `recipient_estimate`            | integer or null | Who the segment reaches right now; null where a window must be named first.      |

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### GET `/v1/projects/{project}/broadcasts/preview`

Sizes a broadcast without sending it. The dashboard shows this before the confirm button, and an API caller needs the same safety rail.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/preview?audience=customer&plan_id=$PLAN_ID" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The preview accepts the same `audience`, `pass_window_id`, `plan_id` and `expiring_within_days` as the send, and applies them identically, segments, plan narrowing and recipient rules alike, so a preview and the send it precedes can never describe different audiences. The fields answer the same as the send's, minus `status`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `audience` (query, string): The segment to size: `all` (the default), `customer`, `trialing`, `lead`, `churned`, `expiring_soon`, `cancelled_still_active`, `paused`, `trialing_cardless`, `waiting_on_connection`, `all_pass_holders`, `all_pass_holders_not_in_queue`, `pass_holders` or `pass_holders_not_in_queue`. An unknown value is `422` with `reason: unknown_audience` and the supported list.
- `pass_window_id` (query, string): The access window for `pass_holders` and `pass_holders_not_in_queue`; ignored by every other segment.
- `plan_id` (query, string): Narrow the segment to members whose subscription is on this plan. Refused for `lead` and the pass segments with `reason: plan_filter_unsupported`; a plan of another project is `reason: unknown_plan`.
- `expiring_within_days` (query, integer): The horizon `expiring_soon` counts within, 1 to 90; a value outside the range clamps. Defaults to 7. Read by no other segment.


### GET `/v1/projects/{project}/broadcasts/{broadcast}`

One broadcast by the `broadcast_id` the send answered with. `progress` is where the send stands: `status` in the five words every tracked piece of work on this API uses (`queued`, `running`, `paused`, `completed`, `failed`), `done` of `total`, `failed`, and `line`. `failures_by_kind` splits the failed count by the connector's reading of why. Poll it while `progress.status` is `queued`, `running` or `paused`, or wait for `broadcast.completed`, which carries the same id.

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The broadcast, resolved within the project by the route binder.


### GET `/v1/projects/{project}/broadcasts/{broadcast}/failures`

The members the walk could not reach, newest first, each with `kind` (`unreachable` for a member who blocked the bot or left, `not_permitted`, `target_missing` for a member with no account to reach, `rate_limited` for one still throttled after the retries, `configuration`, `transient`, `other`) and the platform's `detail` when it gave one. Nothing is kept per successful recipient, so this is the whole record of who missed the message. Pages with `per_page`, `page`, `sort_by` (`failed_at`, `kind`) and `sort_direction`.

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID/failures \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The broadcast, resolved within the project by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `failed_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/broadcasts/{broadcast}/retry`

Sends a finished broadcast again, to the members it could not reach and nobody else, as a new broadcast under the old one: the child walks the parent's missed members alone, posts no announcement, and carries the parent's message and audience for the history. Refused with `422 VALIDATION_FAILED` while the parent is still sending, when it missed nobody, when none of the missed can be reached now, or when the project has no connected bot.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID/retry \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The finished broadcast, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `coupons`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/coupons` | `project-coupon:view-any` | List a project's coupons | `list_coupons` |
| POST | `/v1/projects/{project}/coupons` | `project-coupon:create` | Create a coupon | `create_coupon` |
| DELETE | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:delete` | Delete a coupon | `delete_coupon` |
| GET | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:view` | Get a coupon | `get_coupon` |
| PATCH | `/v1/projects/{project}/coupons/{coupon}` | `project-coupon:update` | Update a coupon | `update_coupon` |
| POST | `/v1/projects/{project}/coupons/{coupon}/activate` | `project-coupon:update` | Activate a coupon | `activate_coupon` |
| POST | `/v1/projects/{project}/coupons/{coupon}/deactivate` | `project-coupon:update` | Deactivate a coupon | `deactivate_coupon` |

### GET `/v1/projects/{project}/coupons`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons?active=true&per_page=25&page=1" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's coupons, newest first. `active` filters on the creator's on/off switch only; `code` finds one exact code.

> `active=true` is not the same as redeemable. A coupon can be switched on and still not apply: outside its window, fully claimed, or capped for that subscriber. Read `redeemable` on each row for the combined answer.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `active` (query, boolean): Keep only coupons whose on/off switch is in this position. Not the same as redeemable: read `redeemable` on each row for the combined answer.
- `code` (query, string): Find one coupon by its exact code, compared in upper case.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/coupons`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BLACKFRIDAY",
    "name": "Black Friday 2026",
    "discount_type": "percentage",
    "discount_value": 25,
    "max_redemptions": 500,
    "max_redemptions_per_user": 1,
    "starts_at": "2026-11-27T00:00:00Z",
    "expires_at": "2026-12-01T00:00:00Z",
    "active": true
  }'
```

Answers `201` with the coupon. `duration` is not yours to set: only first-payment discounts exist today, so it is always `once` on the way out.

> **`code` is uppercased before the uniqueness check.** Sending `blackfriday` when `BLACKFRIDAY` exists in the project is a `422`, not a second coupon. Uniqueness is per project, so two different projects may both have `BLACKFRIDAY`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `code` (string, required): The code subscribers type, 3 to 64 letters, numbers and dashes. Stored and matched in upper case, and uppercased before the uniqueness check: `blackfriday` when `BLACKFRIDAY` exists in the project is refused, not a second coupon. Two projects may both hold the same code.
- `name` (string, required): A creator-facing label, 3 to 255 characters, never shown to subscribers.
- `discount_type` (one of `percentage`, `fixed`, required)
- `discount_value` (number, required): Greater than 0; at most 100 when `discount_type` is `percentage`.
- `currency_id` (string): Required when `discount_type` is `fixed`, and it must match the currency of the plans the coupon applies to. Refused as meaningless on a percentage coupon.
- `duration` (one of `once`): Accepted for forward compatibility but only `once` is honoured: first-payment discounts are the only kind that exist today.
- `max_redemptions` (integer): The total cap across everyone, 1 to 1,000,000. Omit or send null for unlimited.
- `max_redemptions_per_user` (integer): How many times one member may redeem the code, 1 to 1,000. Defaults to 1.
- `minimum_amount` (number): The order floor, in the plan's own currency; greater than 0.
- `starts_at` (string): When redemption opens, ISO 8601. Omit for immediately.
- `expires_at` (string): When redemption closes, ISO 8601; must be after `starts_at`. Omit for never.
- `active` (boolean): Whether the code can be redeemed from the start. Defaults to true.
- `plan_ids` (array of string): Restrict the code to these plans of the project, at most 200. Omit or send `[]` for every plan, including plans added later.


### DELETE `/v1/projects/{project}/coupons/{coupon}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons/4b9d3e08-a1f6-4275-9c83-7e01d6a2f594 \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

Removes the code and its redemption history; deactivating keeps both. Answers `204` with no body.

> **A delete can be refused.** If any subscriber holds a live reservation, a checkout in flight with this discount already quoted to a payment provider, the delete answers `422` and asks you to deactivate instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/coupons/{coupon}`

One coupon with its currency ISO code loaded. A coupon of another project, or a deleted one, is `404 RESOURCE_NOT_FOUND`.

### Three fields that are easy to misread

> **`plan_ids: []` means every plan, not no plans.** An empty array is how the coupon itself reads an empty plan relation: the code applies to **every** plan in the project, including plans added later. Treating it as "restricted to nothing" inverts the meaning.

**`redemptions.remaining` is derived, not stored.** Prefer it over computing `max_redemptions - count` yourself. The quota counts settled redemptions *plus* reservations whose hold has not expired, so an in-flight checkout is already accounted for, and an abandoned one returns its slot without any sweeper job. Your own subtraction will disagree.

**`discount.value` is a decimal string with four places**: `"25.0000"` for 25% off, `"10.0000"` for ten of the coupon's currency. Parse it as a decimal, never a float. `currency_id` is `null` on a percentage coupon and set on a fixed-amount one, because a percentage applies to a plan in any currency and a fixed amount only to plans priced in its own.

`currency` (the ISO code) is present only when the relation is loaded: on a single read, a create and an update, not on every list row.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/coupons/{coupon}`

Accepts the same fields as create, all optional. Changing terms is **not retroactive**: subscribers who already redeemed keep exactly what they paid, and the change applies to redemptions from that point on.

Raising `max_redemptions` on an exhausted coupon makes it redeemable again. Lowering it below the current count does not claw anything back; the coupon simply reports `remaining: 0`. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `code` (string): A new code, 3 to 64 letters, numbers and dashes, uppercased before the uniqueness check against the project's other live coupons.
- `name` (string): A new creator-facing label, 3 to 255 characters.
- `discount_type` (one of `percentage`, `fixed`)
- `discount_value` (number): Greater than 0; at most 100 when the coupon is, or becomes, a percentage.
- `currency_id` (string): Required when the coupon is, or becomes, `fixed` and it has no currency yet; refused as meaningless on a percentage coupon.
- `duration` (one of `once`): Accepted for forward compatibility but only `once` is honoured.
- `max_redemptions` (integer): The new total cap, 1 to 1,000,000, or null for unlimited. Raising it on an exhausted coupon makes it redeemable again; lowering it below the current count claws nothing back, the coupon simply reports `remaining: 0`.
- `max_redemptions_per_user` (integer): How many times one member may redeem the code, 1 to 1,000.
- `minimum_amount` (number): The order floor, in the plan's own currency; greater than 0, or null for none.
- `starts_at` (string): When redemption opens, ISO 8601, or null for immediately.
- `expires_at` (string): When redemption closes, ISO 8601, or null for never.
- `active` (boolean): The on/off switch; prefer the activate and deactivate endpoints, which fire their own events.
- `plan_ids` (array of string): The plans to restrict the code to, at most 200; `[]` opens it to every plan.


### POST `/v1/projects/{project}/coupons/{coupon}/activate`

Switches the code on so new redemptions are accepted again, within its window and cap. Emits `coupon.activated` rather than `coupon.updated`, so an automation watching availability has one event to subscribe to. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/coupons/{coupon}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/coupons/4b9d3e08-a1f6-4275-9c83-7e01d6a2f594/deactivate \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The safe way to retire a code: new redemptions stop immediately and every redemption already recorded is kept. A checkout **already in flight** with the code still completes, so expect a late `coupon.redeemed` shortly after. Emits `coupon.deactivated`. Answers `200` with the coupon.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `coupon` (path, string, required): The coupon, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `creator-tasks`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/creator-tasks` | `project-subscription:view` | List a project's creator tasks | `list_creator_tasks` |
| POST | `/v1/projects/{project}/creator-tasks/{task}/complete` | `project-subscription:update` | Complete a creator task | `complete_creator_task` |

### GET `/v1/projects/{project}/creator-tasks`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks?status=open" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

`status` is `open` (the default: tasks not yet done whose grant still stands), `completed`, or `all`. Paged like every list but **oldest first** by default, so the longest-waiting member is at the top.

- `grant_id` is the access ledger row the task belongs to; read it with the [subscription's grants](https://docs.subscriby.net/api/v1/reference/subscriptions/list-a-subscriptions-grants), where its `mode` is `creator_task`.
- `instructions` is the sentence the dashboard shows the creator, in the creator's locale.
- `due_at` is null for continuous access and the window's start for a dated pass.
- `completed_at` and `completed_by_user_id` are set once the task is done.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): The tab: `open` (the default) lists tasks not yet done whose grant still stands, `completed` the ones marked done, `all` both.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `asc`.


### POST `/v1/projects/{project}/creator-tasks/{task}/complete`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Marks the task done by the token's user, moves the grant to `granted`, and raises `creator_task.completed` followed by `member.resource_added` for the same grant. Answers `200` with the completed task.

> **Nobody messages the member for you.** A manual perk is yours to hand over. Completing the task records that you did and tells your integrations; it does not send the member anything.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `task` (path, string, required): The task, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `distribution`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/distribution/deep-link` | `distribution:read` | Build a deep link | `get_deep_link` |
| GET | `/v1/projects/{project}/distribution/portal-url` | `distribution:read` | Get the portal URL | `get_portal_url` |

### GET `/v1/projects/{project}/distribution/deep-link`

Builds a start link against the project's connected installation. The payload depends on which query parameter you pass (at most one; an access code wins over a plan, and a plan over a custom parameter):

| Query parameter | Resulting payload           | Acted on by the bot?                                         |
| --------------- | --------------------------- | ------------------------------------------------------------ |
| `access_code`   | the code verbatim           | Yes: redeemed on open.                                       |
| `plan_id`       | the plan's bare UUID        | Yes: opens that plan's checkout flow.                        |
| `custom`        | the caller-supplied string  | No, see below.                                               |
| *(none)*        | `project_<uuid>`            | No: falls through to the project home, which is the intent.  |

> **Only a bare UUID is acted on.** The bot acts on a start payload only when it is a bare UUID: it is matched against the project's plans first, then tried as an access code. `custom` payloads and the default `project_<uuid>` do not match that shape, so the bot ignores them and opens its home screen. `custom` is therefore a passthrough for **your own** tracking: the platform delivers it and you can read it off the update in a webhook consumer, but Subscriby neither stores it nor attaches it to the member.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/distribution/deep-link?plan_id=$PLAN_ID" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): A plan of this project; the link then opens that plan's checkout. Answers 404 for a plan outside the project. Ignored when `access_code` is also sent.
- `access_code` (query, string or null): An access code, carried verbatim and redeemed when the link is opened. Wins over `plan_id` and `custom`.
- `custom` (query, string or null): Your own tracking string, 1 to 64 characters of letters, digits, underscore or hyphen. Delivered by the platform but not acted on or stored by Subscriby. Used only when neither `access_code` nor `plan_id` is sent.


### GET `/v1/projects/{project}/distribution/portal-url`

The portal URL always uses the project's current `handle`. If you change the handle the portal URL updates in lock-step; any old link answers 404 on the portal host.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


## `knowledge`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/knowledge` | `project-knowledge:view-any` | List a project's Knowledge | `list_knowledge_entries` |
| POST | `/v1/projects/{project}/knowledge` | `project-knowledge:create` | Create a Knowledge entry | `create_knowledge_entry` |
| DELETE | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:delete` | Delete a Knowledge entry | `delete_knowledge_entry` |
| GET | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:view` | Get a Knowledge entry | `get_knowledge_entry` |
| PATCH | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:update` | Update a Knowledge entry | `update_knowledge_entry` |

### GET `/v1/projects/{project}/knowledge`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge?per_page=50" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Pages the entries, newest first. Each row names the entry's `kind`, its `audience`, its `status` with a label beside each, its title and how many passages it became; `body` is `null` on every row. Sort with `sort_by` (`created_at` by default, or `updated_at`, `title`) and `sort_direction`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/knowledge`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "document",
    "title": "House rules",
    "body": "# House rules\n\nClasses start on the hour. Arrive five minutes early…",
    "audience": "members"
  }'
```

Answers `201` with the entry, its `body` included, already cut into passages and in the index: a member can be answered from it the moment this returns. `kind` is fixed once the entry exists; a guide that should have been a question is a new entry. `audience` defaults to `members`, because most of what a creator writes down is written for members; `team` keeps it to the creator's own surfaces.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `question`, `document`, required): The two shapes a Knowledge entry takes: a question with its answer, or an uploaded document. A question is written on the Knowledge page and is one passage; a document is a file whose text is cut into passages when it is uploaded. Both cases are declared from the first migration because `knowledge_entries.kind` is an enum whose check constraint cannot be widened once it exists.
- `title` (string, required): The question, or the document's name, 2 to 160 characters; written at the head of every passage so one read on its own still says where it came from.
- `body` (string, required): The answer, or the document's text, 2 to 50,000 characters. The Copilot quotes from here and never invents a fact; a Markdown document keeps its headings.
- `audience` (one of `team`, `members`): Who Subscriby Copilot may be answering when it reads a Knowledge entry. Every entry serves the creator's own surfaces, the operator and the inbox suggester. Only an entry marked for members serves the member-facing answerer, in the project bot and on the portal, so a creator's private notes never reach a member by construction: the member search filters on this value and nothing else can widen it. Both cases are declared from the first migration because the column is an enum whose check constraint cannot be widened once it exists.


### DELETE `/v1/projects/{project}/knowledge/{entry}`

Answers `204`. The entry, its passages and its file go in one step, so the Copilot stops answering from it at once. A second `DELETE` of the same id is `404 RESOURCE_NOT_FOUND`; a token whose owner's role may not remove Knowledge is `403 TOKEN_MISSING_ABILITY`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/knowledge/{entry}`

The entry with its `body`: the answer, or the document's text as it was read out of the file or sent in, headings included for a Markdown document. `status` is `ready` once the passages are in the index, `indexing` while they are cut, `failed` when the text could not be read, in which case `failure` says why.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.


### PATCH `/v1/projects/{project}/knowledge/{entry}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge/3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "audience": "team" }'
```

Answers `200` with the complete entry after the change. **Every field is optional and an omitted one keeps its stored value**, so the request above changes who may be answered from the entry and nothing else. New words in `title` or `body` are cut into passages again in the same step, and the old passages go with them, so the Copilot never reads a mix of old and new; a new `audience` alone retags the passages without rewriting them.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The question, or the document's name, 2 to 160 characters.
- `body` (string): The answer, or the document's text, 2 to 50,000 characters; new words are cut into passages again in the same step.
- `audience` (one of `team`, `members`): Who Subscriby Copilot may be answering when it reads a Knowledge entry. Every entry serves the creator's own surfaces, the operator and the inbox suggester. Only an entry marked for members serves the member-facing answerer, in the project bot and on the portal, so a creator's private notes never reach a member by construction: the member search filters on this value and nothing else can widen it. Both cases are declared from the first migration because the column is an enum whose check constraint cannot be widened once it exists.


## `links`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/links` | `project-link:view-any` | List a project's links | `list_links` |
| POST | `/v1/projects/{project}/links` | `project-link:create` | Create a link | `create_link` |
| GET | `/v1/projects/{project}/links/funnel` | `project-link:view-any` | The project's funnel | `get_link_funnel` |
| DELETE | `/v1/projects/{project}/links/{smartLink}` | `project-link:delete` | Archive a link | `archive_link` |
| GET | `/v1/projects/{project}/links/{smartLink}` | `project-link:view` | Get a link | `get_link` |
| PATCH | `/v1/projects/{project}/links/{smartLink}` | `project-link:update` | Change a link | `update_link` |
| GET | `/v1/projects/{project}/links/{smartLink}/funnel` | `project-link:view` | One link's funnel | `get_link_funnel` |

### GET `/v1/projects/{project}/links`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links?archived=false&per_page=25&page=1" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's links, newest first, live and archived alike unless `archived` says otherwise; `search` finds links whose name or slug contains the text. Every row carries the three addresses in `urls`.

> `archived=false` keeps expired links too: they are still the creator's and still carry their figures. Read `state` on each row, which is `live`, `expired` or `archived`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `archived` (query, string): Keep only archived links (`true`) or only links still in use (`false`), expired ones included. Omit for every link.
- `search` (query, string): Find links whose name or slug contains this text, case-insensitively.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/links`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"name":"YouTube description","slug":"youtube","destination":"plan","plan_id":"0c9d8e7f-6a5b-4c3d-8e2f-1a2b3c4d5e6f"}'
```

Answers `201` with the new link, its code minted and its three addresses built. `destination` is `portal` (the portal home), `plan` (the checkout of one plan, which needs `plan_id`) or `bot` (the project's bot; the portal home when no bot is connected). `expires_at`, in the future, stops the link counting after that moment.

The slug is lowercased before it is stored and checked, so `Promo` when `promo` exists is `422 VALIDATION_FAILED`, not a second link; `go`, `embed`, `portal`, `bot`, `direct`, `new` and `edit` are reserved. Emits `link.created`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A creator-facing label, 2 to 120 characters, never shown to visitors; such as `YouTube description`.
- `slug` (string, required): The address segment after `/go/`: 2 to 32 letters, digits and hyphens, lowercased before it is stored and checked. Unique within the project; `go`, `embed`, `portal`, `bot`, `direct`, `new` and `edit` are reserved. Such as `youtube`.
- `destination` (one of `portal`, `plan`, `bot`, required): Where a Smart Link sends the person who follows it. The destination decides the redirect and the bot payload: the portal's plan list, the checkout of one plan, or a conversation with the project's bot. The click and the attribution are recorded the same way whichever it is, so a creator can move a link between destinations without losing its figures.
- `plan_id` (string): The plan a `plan` destination opens; one of this project's plans. Refused as meaningless on the other destinations.
- `expires_at` (string): When the link stops counting and crediting, ISO 8601, in the future. Omit for never; the address keeps landing on the portal home after it.


### GET `/v1/projects/{project}/links/funnel`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links/funnel \
  -H "Authorization: Bearer sbt_..."
```

Every link, live and archived, each with its lifetime `clicks`, `leads` (the members it brought), `checkouts` (those who started a purchase, in any state), `paid` (those who made a successful payment), `conversion_rate` (paid per hundred clicks) and `revenue` (everything those members ever paid, per currency and restated in US dollars); the `direct` row for the members no link brought; and `totals`, which equal the project's own figures, so the rows add up.

> The figures are lifetime by design and count removed members and ended purchases, so two channels compare on everything each ever brought. The dashboard's date window never narrows them.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### DELETE `/v1/projects/{project}/links/{smartLink}`

Answers `204`. The address keeps landing on the portal home, so a flyer or a bio that carries it never shows anyone an error; the figures stay on the funnel; the link cannot be put back in use. Emits `link.archived` the first time; a second `DELETE` changes nothing and answers `204` again.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/links/{smartLink}`

One link with its plan's name loaded. A link of another project is `404 RESOURCE_NOT_FOUND`.

### Three fields that are easy to misread

**`urls.bot` is null without a bot.** The deep link exists only while the project runs a bot that hands out start links; the web address and the embed page are always there.

**`code` never changes, `slug` may.** Share `urls.web` where the slug is fine to change later; print `urls.bot` or a QR of `urls.web` and rely on the code, which survives every rename because the slug's redirect runs through the portal, where the code takes over.

**`clicks.total` is one per visitor address per hour.** A creator reading their own page a dozen times adds one, and no analytics cookie is set on a stranger.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/links/{smartLink}`

Any subset of the create shape; omitted fields keep their stored value. Renaming `slug` moves the web address and nothing else. `expires_at: null` clears an expiry. A `plan_id` is dropped when the destination stops being a plan. Emits `link.updated` with the fields that moved.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string): A new label, 2 to 120 characters.
- `slug` (string): A new address segment, 2 to 32 letters, digits and hyphens, lowercased before the uniqueness check against the project's other links; the old address stops answering.
- `destination` (one of `portal`, `plan`, `bot`): Where a Smart Link sends the person who follows it. The destination decides the redirect and the bot payload: the portal's plan list, the checkout of one plan, or a conversation with the project's bot. The click and the attribution are recorded the same way whichever it is, so a creator can move a link between destinations without losing its figures.
- `plan_id` (string): The plan a `plan` destination opens; one of this project's plans. Ignored when the destination is not, or stops being, a plan.
- `expires_at` (string): When the link stops counting, ISO 8601 and in the future, or null to run until archived.


### GET `/v1/projects/{project}/links/{smartLink}/funnel`

The same row for one link, under `data`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.


## `members`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/members` | `project-user:view-any` | List a project's members | `find_member_by_identity`, `list_subscribers` |
| GET | `/v1/projects/{project}/members/{member}` | `project-user:view` | Get a member | `get_subscriber` |
| POST | `/v1/projects/{project}/members/{member}/ban` | `project-user:update` | Ban a member | `ban_member` |
| GET | `/v1/projects/{project}/members/{member}/identities` | `project-user:view` | List a member's connected accounts | `list_member_identities` |
| DELETE | `/v1/projects/{project}/members/{member}/identities/{link}` | `project-user:update` | Disconnect a member's account | `unlink_member_identity` |
| POST | `/v1/projects/{project}/members/{member}/kick` | `project-user:update` | Kick a member | `kick_member` |
| POST | `/v1/projects/{project}/members/{member}/unban` | `project-user:update` | Unban a member | `unban_member` |

### GET `/v1/projects/{project}/members`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/members?status=customer" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Newest first, paged with `page` and `per_page` (default 25; `limit` is accepted as an alias). `status` narrows to one lifecycle state. `identity` looks one member up by the account they connected, `connector:external_id`, for a workflow that starts from a platform event and needs the member behind an account id; the page then holds that one member with their `identities` embedded, or no rows. `access=waiting` keeps the members whose live purchase includes a place waiting for an account they have not connected (a Discord role bought through Telegram, say), the ones the [connection reminder](https://docs.subscriby.net/api/v1/reference/subscriptions) nudges.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Narrow the page to one lifecycle state: `lead`, `trialing`, `customer`, `churned` or `banned`. Any other value is refused rather than answered with an empty page, so a typo in an automation is noticed.
- `access` (query, string or null): Narrow the page to the members whose live purchase includes a place waiting for an account they have not connected (a place on one platform bought through the bot of another, say): `waiting`. Any other value is refused.
- `identity` (query, string or null): Find the member who connected a given account: the connector key and the platform's own id for the account joined by a colon, `connector:123456789`. The page then holds that one member with their `identities` embedded, or no rows when nobody in the project connected that account. A value with no connector before the colon is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/members/{member}`

One member with their connected accounts embedded as `identities`.

`email` and `billing_email` are present only when the calling token carries `project-user:view`, which this route requires; a roster-only token (`project-user:view-any`) never sees them on the list, where the keys are absent, not null. The two are not interchangeable:

| Field           | Where it comes from                                                                                       | Safe to contact?             |
| --------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `email`         | The member chose it themselves and verified it. It is their portal sign-in credential.                    | Yes                          |
| `billing_email` | Whatever address they gave a payment provider at checkout. Never verified, never used for authentication. | Treat as identification only |

Members join through a bot and are never asked for an email, so for most of them `email` is `null` and `billing_email` is the only address on record, which is what makes it useful for matching a refund request to a subscription.

`billing_email` is populated automatically from the payment provider on every new payment (Stripe, PayPal, Paystack, Razorpay and Skrill). Members who last paid before that capture existed may have `null` until their next payment, and members who joined by redeeming an access code never had a payment at all, so they have no billing address to record.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.


### POST `/v1/projects/{project}/members/{member}/ban`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/ban \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Repeated spam in the research channel."}'
```

Moves a `lead`, `customer`, `trialing` or `churned` member to `banned`, removes their access on every connector and emits `member.banned` with the optional `reason`. Answers `200` with the member; a member already banned is answered unchanged and emits nothing.

Connector-side eviction (kicks from the gated spaces, revoked invite links) runs asynchronously on the connector pipeline after the flip. The call returns as soon as Subscriby's state has been updated and the webhook event has been fired; the platform actions complete in the background.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `reason` (string): Why the member is banned; carried on the `member.banned` event and shown in the dashboard, never sent to the member.


### GET `/v1/projects/{project}/members/{member}/identities`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/identities \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The member's connected accounts, preferred first. Never paginated. A member can connect one account per platform the project is on, from the portal's **Account & Recovery** screen or by talking to the project's bot; the member read embeds the same rows as `identities`. Connecting has no endpoint: it is a two-sided proof the member completes on the connector.

- `id` is the link, which is what the disconnect endpoint takes; `external_id` is the platform's own id for the account.
- `source` says how the link was proven: `handshake` (connected from the portal and confirmed by the bot, or a portal sign-in), `adopted` (taken over from another of the creator's projects), `portal`, `bot` (the bot met the account first) or `backfill` (migrated from before connectors).
- `preferred` marks the account the project reaches first; a member's first account is, and the member can move it on the portal.
- `notify` marks a further account the member switched the project's notices on for, from the portal. The preferred account always hears them, so it reads `false` there too; a grant notice stays on the connector of the grant and a support reply on the connector the member wrote from, whatever the switches say.

**Parameters**

- `project` (path, string, required): The project, resolved by the binder.
- `member` (path, string, required): The member, resolved within the project.


### DELETE `/v1/projects/{project}/members/{member}/identities/{link}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/identities/$LINK_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Disconnects an account on the creator's behalf, the counterpart of the member's own Disconnect on the portal: it no longer signs the member in and the bot no longer knows them by it. Answers an empty `204` and emits `member.identity_unlinked`.

**Parameters**

- `project` (path, string, required): The project, resolved by the binder.
- `member` (path, string, required): The member, resolved within the project.
- `link` (path, string, required): The member's link, resolved within the member.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/members/{member}/kick`

Moves the member to `churned`, removes them from every resource and emits `member.kicked` with the optional `reason`. Unlike a ban, a kicked member may come back by subscribing again. Answers `200` with the member; a `banned` member is answered unchanged, since a ban already says more. As with a ban, the connector-side eviction completes in the background after the call returns.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `reason` (string): Why the member is removed; carried on the `member.kicked` event and shown in the dashboard, never sent to the member.


### POST `/v1/projects/{project}/members/{member}/unban`

Moves a `banned` member to `churned` and emits `member.unbanned`. Access is not restored: the member subscribes again from the portal or the bot. Answers `200` with the member; a member who is not banned is answered unchanged and emits nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `pass-windows`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/pass-windows` | `pass-window:view-any` | List a project's pass windows | `list_pass_windows` |
| GET | `/v1/projects/{project}/pass-windows/{window}` | `pass-window:view` | Get a pass window | `get_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/cancel` | `pass-window:delete` | Cancel a pass window | `cancel_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/remind` | `pass-window:update` | Remind a window's holders | `remind_pass_window_queue` |
| POST | `/v1/projects/{project}/plans/{plan}/pass-windows` | `pass-window:create` | Place a pass window by hand | `create_pass_window` |

### GET `/v1/projects/{project}/pass-windows`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows?status=scheduled&sellable_only=true" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The project's windows across every pass plan, **soonest first**, 50 per page (`per_page` 1 to 100; `limit` is accepted as an alias). Filters are validated before they reach the query: an unknown status or a malformed date is a `422 VALIDATION_FAILED` naming the field, not an empty page.

> **The list also opens to `project-subscription-plan:view-any`.** The list shipped under the plan ability before the `pass-window:*` family had any surface, and it is what the n8n node and the MCP tool docs named. A token holding only `project-subscription-plan:view-any` therefore still satisfies the `pass-window:view-any` gate. Mint new tokens with the precise ability; the alias exists so old ones keep working.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): One pass plan of the project only.
- `status` (query, string): One state only: `scheduled`, `open`, `closed` or `canceled`. Anything else is refused.
- `from` (query, string or null): Only windows starting at or after this moment, ISO 8601.
- `to` (query, string or null): Only windows starting at or before this moment, ISO 8601.
- `sellable_only` (query, boolean): Keep only windows a buyer could still purchase.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 50.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/pass-windows/{window}`

One window, with `sellable` and `holders` resolved for it. A window is resolved **within the project**: a window id that belongs to another project, another team, or to nothing at all is a `404 RESOURCE_NOT_FOUND`, so an id's existence never leaks.

| Field              | Type    | Notes                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `starts_at`        | string  | ISO 8601, **UTC**. Store this.                                                                                                                 |
| `ends_at`          | string  | ISO 8601, UTC.                                                                                                                                 |
| `timezone`         | string  | The IANA zone the plan's schedule was authored in. Render window times in this, never in UTC.                                                  |
| `local_range`      | string  | The same window as a person reads it, already in `timezone`: what the dashboard, the portal and the bot all print.                             |
| `duration_minutes` | integer | Derived from the two instants.                                                                                                                 |
| `status`           | string  | `scheduled`, `open`, `closed` or `canceled`. Set by the scheduler as the window's start and end pass; `canceled` only by an explicit cancel.   |
| `source`           | string  | `generated` from the plan's slots, or `manual` when placed by hand. Manual windows survive a schedule rebuild; generated ones are regenerated. |
| `sellable`         | boolean | Whether a buyer could purchase this window right now: the plan's sales cutoff, resolved for the whole page in one query rather than per row.   |
| `holders`          | integer | How many purchases currently hold the window.                                                                                                  |

> **Why both UTC and a local range.** A pass schedule is authored in the creator's zone and rendered in it everywhere else in the product. Returning only UTC would leave every consumer converting, and getting it wrong across a daylight-saving boundary. `starts_at` is for storing and comparing; `local_range` is for showing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project with its holder count and sale flag.


### POST `/v1/projects/{project}/pass-windows/{window}/cancel`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The body is optional. `series_holders` is the choice the dashboard's cancellation dialog asks for season-ticket holders: `substitute` (the default) moves them to the plan's next window on sale, keeping their season at the same length; `drop` removes the cancelled date from their season, leaves the rest standing and reports what the date was worth per holder. A weekly season always has a next date on sale, so without `drop` a day with no event hands its season-ticket holders a free date the following week while the single-date holders rightly roll forward. Single-date holders are always moved where a window is on sale.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"series_holders": "drop"}'
```

By the time the response arrives every holder has been resettled, and `meta` says how:

| Tally          | What happened to those holders                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rebound`      | Moved to the plan's next window on sale, and told so. Their invite links are re-issued ahead of the new window.                                                   |
| `refund_due`   | The schedule had nothing left to offer, so their pass was ended. Their message states what they paid and that the refund is the creator's decision.               |
| `legs_dropped` | Season-ticket holders who lost this one date and keep the rest of their series. Their message states what they paid, what the date was worth, and the same.        |

`meta.refunds` lists every holder the cancellation left owed a decision, one row each (a holder who paid nothing is settled and counted in the tallies but listed nowhere, since there is nothing to decide): the member's name, the `reason` (`stranded` or `leg_dropped`), `amount_paid` and `amount` (what the cancelled date was worth) with their `_formatted` twins in the holder's own currency, the `currency`, and `passes_remaining`. `meta.refund_totals` adds the rows up per currency. These are the figures the holders were told, so the creator reads the same number the member will ask about.

> **Subscriby never moves the refunds.** `refund_due`, `legs_dropped` and `refunds` are statements, not actions. The money stays where it is until the creator refunds it at the gateway. An integration that wants to act on them can read `meta.refunds` here, or subscribe to `pass.holder_stranded` and `pass_series.leg_dropped`, which carry the amount per holder.

Cancelling is a `POST` verb and not a `DELETE` on purpose: it resettles every holder, moving them on or ending their pass, which is far too consequential to read as removing a row. It also cannot be undone: the window keeps its start permanently, so the same instant can never be re-created on that plan.

Raises `pass.window_cancelled` carrying the tallies, plus one event per holder: `pass.holder_moved` or `pass.holder_stranded` for ordinary passes, `pass_series.leg_substituted` or `pass_series.leg_dropped` for season-ticket holders. A window that is already cancelled is answered `200` with every tally at zero, so a retry after a lost response changes nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `series_holders` (one of `substitute`, `drop`): What cancelling a date does to the season-ticket holders who hold it. A single-date holder is always moved to the plan's next date on sale, because their purchase was that one date. A season-ticket holder bought a slate, so the creator decides per cancellation whether the date is replaced, which keeps their season at the same length, or dropped, which leaves the rest of the season standing and states what the date was worth. A weekly season always has a next date on sale, so without the choice its holders could never be dropped: a day with no event handed them a free date the following week while the single-date holders rightly rolled forward.


### POST `/v1/projects/{project}/pass-windows/{window}/remind`

Nudges everyone who bought the window but has not yet joined, re-attaching their invite links. It is the panel's **Send Reminder** button; the automatic reminders a day and an hour before a window opens still run regardless.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/remind \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

`reminded` is how many holders the **connector accepted** a message for, not how many were attempted: a holder who has blocked the bot is skipped without costing the rest their nudge. A window that has ended or been cancelled reminds nobody and answers `0` rather than refusing. No event fires: the reminder is a message on the connector, not a state change.

This messages real people. Do not repeat it within the same window, and to nudge one holder rather than a whole window use the [subscription remind endpoint](https://docs.subscriby.net/api/v1/reference/subscriptions/remind-a-pass-holder).

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/pass-windows`

Places a window by hand on a `kind: pass` plan. This is how `schedule_mode: fixed` gets its dates, and how a repeating plan gets the one-off that does not fit its pattern.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans/$PLAN_ID/pass-windows \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "starts_at": "2026-09-20 09:00",
    "duration_minutes": 180
  }'
```

Answers `201` with the new window: `status: scheduled`, `source: manual`, `holders: 0`. The request above and `"starts_at": "2026-09-20T09:00:00-04:00"` describe the same instant for a plan in `America/New_York`, and both come back as `"2026-09-20T13:00:00+00:00"`. Raises `pass.window_scheduled` with `source: manual`.

A manual window is never touched by regeneration: editing `pass.slots` on the plan rebuilds the generated windows and leaves this one where you put it. Every pass series with a rule is asked to look at the new date afterwards, so a matching series absorbs it as described on the [Plans](https://docs.subscriby.net/api/v1/reference/plans) page.

Each refusal below is a `422 VALIDATION_FAILED` naming the field, the same wording the dashboard's panel shows.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `starts_at` (string, required): When access opens, ISO 8601. **A value with no offset is read as wall-clock time in the plan's `timezone`**, exactly as the dashboard authors it; a value with an offset or `Z` is the instant it names. Must be in the future, judged in the plan's own zone.
- `duration_minutes` (integer, required): How long the window lasts, a whole number of minutes, at least 1. The plan's configured floor and ceiling apply: 5 minutes and 30 days by default.


## `payment-methods`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/payment-methods` | `project-payment-method:view-any` | List a project's payment methods | `list_payment_methods` |
| DELETE | `/v1/projects/{project}/payment-methods/{method}` | `project-payment-method:delete` | Delete a payment method | `delete_payment_method` |
| GET | `/v1/projects/{project}/payment-methods/{method}` | `project-payment-method:view` | Get a payment method | `get_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/activate` | `project-payment-method:update` | Activate a payment method | `activate_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/deactivate` | `project-payment-method:update` | Deactivate a payment method | `deactivate_payment_method` |
| POST | `/v1/projects/{project}/payment-methods/{method}/sync` | `project-payment-method:update` | Sync a payment method's plans | `sync_payment_method_plans` |

### GET `/v1/projects/{project}/payment-methods`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every payment method attached to the project, newest first.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### DELETE `/v1/projects/{project}/payment-methods/{method}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The row is soft-deleted: subscriptions sold through it keep their gateway for refunds and history, and configuring the same provider and mode again later revives the row instead of creating a duplicate. Buyers lose that way to pay at once. Emits `project.payment_method.deleted` with a credential-free snapshot; an already-deleted id is a `404`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/payment-methods/{method}`

The method without its credentials. A method is resolved within the project: a method id that does not belong to the project, or a project outside the caller's tenant, is `404 RESOURCE_NOT_FOUND`, so foreign rows never leak.

- `provider` is the stored provider key: a gateway slug (`stripe`, `paypal`, `razorpay`, `paystack`, `ceypay`, `skrill`, `coinpayments`, `accesscode`) or a `connector:provider` key for a currency a connector brings (`telegram:stars` for Telegram Stars). A project carries one method per provider key and mode, so two connectors can each bring their own currency to the same project. Rows created before provider keys existed carried `platformcurrency`; the connector's data migration rewrites them, and until it has run that word still reads as the native method of the project's connector.
- `connector` is the connector behind a native payment method (`telegram` for a `telegram:stars` row), `null` for every gateway and for access codes. A connector declares its native providers through its manifest's `native_payments` capability, and the dashboard offers one option per provider of every connector that is connected on the project.
- `mode` is `test` or `live`. Drives which set of provider credentials is used.
- `linked` is true once the provider handshake (OAuth callback, API-key verify, etc.) has completed successfully.
- `active` is the creator's toggle. A linked-but-inactive method cannot be used to charge subscribers.

> **Credentials never leave.** Provider credentials (API keys, webhook secrets, connected account ids, Stripe Connect onboarding state) live in the encrypted configuration and are **never** serialised through REST or MCP, even for tokens with `view` ability. The dashboard is the only surface that reveals them, and only to the creator.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.


### POST `/v1/projects/{project}/payment-methods/{method}/activate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/activate \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Offers the method at checkout again and re-queues the plan sync for that gateway. Answers `200` with the method. Idempotent: switching a method to the state it is already in writes nothing and emits nothing; when the switch flips, `project.payment_method.updated` fires once with `changes.active`.

> **Stripe needs its Connect handshake first.** A Stripe method whose Connect onboarding never finished is refused: the row exists only so the creator can resume onboarding, and switching it on would offer buyers a gateway that fails at checkout. Finish onboarding from the dashboard, the only place the Connect handshake can complete.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/payment-methods/{method}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/deactivate \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The creator's switch. A deactivated method is no longer offered at checkout; the subscriptions already sold through it keep renewing with their gateway. Re-queues the plan sync like activating does. Answers `200` with the method; idempotent, and `project.payment_method.updated` fires once with `changes.active` when the switch flips.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/payment-methods/{method}/sync`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/payment-methods/$METHOD_ID/sync \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Queues a push of the project owner's plans into the gateway's catalogue (Stripe products and prices, PayPal, Razorpay or CoinPayments plans) and answers `202 Accepted`. The work runs in the background; each plan reports through `plan.sync_completed` as it lands. Queuing twice pushes the same catalogue twice, which is harmless.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `method` (path, string, required): The method, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `plans`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/plans` | `project-subscription-plan:view-any` | List a project's plans | `list_plans` |
| POST | `/v1/projects/{project}/plans` | `project-subscription-plan:create` | Create a plan | `create_plan` |
| POST | `/v1/projects/{project}/plans/order` | `project-subscription-plan:update` | Arrange the storefront order | `reorder_plans` |
| DELETE | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:delete` | Delete a plan | `delete_plan` |
| GET | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:view` | Get a plan | `get_plan` |
| PATCH | `/v1/projects/{project}/plans/{plan}` | `project-subscription-plan:update` | Update a plan | `update_plan` |
| POST | `/v1/projects/{project}/plans/{plan}/publish` | `project-subscription-plan:update` | Publish a plan | `publish_plan` |
| POST | `/v1/projects/{project}/plans/{plan}/successor` | `project-subscription-plan:create` | Start the next season | `start_next_season` |
| POST | `/v1/projects/{project}/plans/{plan}/unpublish` | `project-subscription-plan:update` | Unpublish a plan | `publish_plan` |

### GET `/v1/projects/{project}/plans`

Pages the project's plans, every kind together, newest first. Read `kind` on each row to know which of `billing`, `pass` or `pass_series` it carries; `resources` is loaded on every row. `pass.upcoming_windows` is not served here: the pass windows endpoints list a plan's dates.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/plans`

`POST` takes the **same shape it returns**: `kind` plus the one matching block. Sending a block that does not match the kind is refused with `VALIDATION_FAILED` naming the offending key; silently ignoring it would let a caller believe they had set a billing cycle on a pass. Answers `201` with the plan in the same discriminated shape the read endpoint shows for each kind. A plan created on sale (`active: true`, the default) is queued for the push to the payment methods that keep a product catalogue (Stripe, PayPal, CoinPayments, Razorpay), so it is sellable through them within a minute; a draft is pushed when it is published.

### Create a subscription

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "subscription",
    "name": "Premium Monthly",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 29.00,
    "resources": ["b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"],
    "billing": { "billing_cycle": "month", "billing_cycle_count": 1, "trial_days": 7 }
  }'
```

### Create a pass

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "pass",
    "name": "Sunday Slate Pass",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 15.00,
    "resources": ["b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"],
    "pass": {
      "timezone": "America/New_York",
      "schedule_mode": "repeating",
      "recurrence": "weekly",
      "sales_cutoff_minutes": 60,
      "sales_cutoff_anchor": "before_start",
      "slots": [
        { "weekday": 4, "start_time": "19:00", "duration_minutes": 180 },
        { "weekday": 0, "start_time": "09:00", "duration_minutes": 840 }
      ]
    }
  }'
```

Sending `pass.slots` **replaces the whole schedule** and rebuilds future windows. Windows a customer has already bought keep their original times and are never moved or deleted; only unsold future windows are regenerated. `pass.windows` is different: it *adds* explicitly dated windows for `schedule_mode: fixed` and never replaces anything.

### Create a pass series

A series needs window ids, and those come from windows that already exist. Read them from `pass.upcoming_windows` on the source plan, from the pass windows endpoints, or from the [`list_pass_windows`](https://docs.subscriby.net/mcp/v1/tools/plan/list-pass-windows) MCP tool.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "pass_series",
    "name": "Autumn Season Ticket",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "price": 99.00,
    "pass_series": {
      "prevent_overlaps": true,
      "seat_cap": 50,
      "presale_hours": 48,
      "window_ids": ["3d5a8c72-b016-4e94-8fa7-61c209d4e738", "9c1f4e27-5a8b-4d63-b2e0-8f7a6c5d4e31"],
      "rules": [
        { "source_plan_id": "0b8e6a2f-4c1d-4e3a-9f52-7d6c1b2a3e45", "kind": "date_range", "from_at": "2026-09-01T00:00:00Z", "to_at": "2026-12-01T00:00:00Z" }
      ]
    }
  }'
```

> **`resources` is optional on a series only.** Every other kind must link at least one resource, or a purchase buys nothing. A series is the exception: each of its windows grants **that window's own plan's** resources, so a series with none still delivers exactly what was sold. Anything you do link here is a **lounge**, open for the whole span.

> **Never put a slate window's resource in a series `resources`.** A lounge is granted **at purchase with no window** and kept until the season ends. Send a resource that one of your slate windows already opens and every holder is handed it permanently the moment they pay: the dates it was scheduled for stop gating anything, and a season ticket becomes a permanent key to that channel. The API accepts it, because a genuinely permanent room is a legitimate thing to sell. It is simply almost never what was meant. Keep `resources` for a holders-only room nothing on the slate opens; the slate's own channels are already granted by their own pass plans on their own dates. The dashboard warns when the two overlap. Over the API, checking is yours to do.

Rules keep working after the save: a matching window scheduled later is absorbed into the slate **and granted to everyone already holding the series**, at no charge. That emits [`pass_series.leg_added`](https://docs.subscriby.net/webhooks/v1/events/pass-series/pass-series-leg-added). Handpicked `window_ids` never grow on their own. The two compose; most real seasons use both.

### Validation

The field-by-field rules are on each request field below. The rules that cross fields:

- `name` must be unique within the project, compared without regard to case or surrounding spaces; a duplicate is refused on `name`.
- `price` must be at least the **$1.00 USD equivalent** in `currency_id`, converted at the current rate. Payment providers reject dust amounts, so anything below that is unbuyable and is refused; the error names the minimum in both the plan's currency and USD.
- `price` of exactly `0` publishes a **free plan**. Plans priced at zero can only be sold by a **Starter** or **Growth** account, never on Free: the platform fee is a share of what you charge, so a zero-priced plan earns nothing to share. On Free the call is refused on `price`. The rule enforced is that a plan may not be **simultaneously active and priced at `0`** on a creator whose plan cannot sell one, so an update that leaves a zero-priced plan off sale is allowed.
- `currency_id` must be supported by at least one active payment method on the project.
- At most one of `eligibility.newcomers_only`, `eligibility.customers_only` and `eligibility.churned_only` may be `true`.
- `resources` is required with at least one id, **except on `kind: pass_series`**, where it is optional and means a lounge.
- `billing.billing_cycle_count` must be `1` when `billing.billing_cycle` is `lifetime`; `billing.recurring` is refused as `true` when the currency is a crypto or platform currency.
- `pass.sales_cutoff_anchor: before_end` requires `pass.sales_cutoff_minutes` of at least `5` and under the shortest slot's `duration_minutes`, and is refused outright when that shortest slot is `5` minutes or less. `before_first_end` and `before_last_start` are **series-only** anchors and are rejected on a pass plan, where a lone window is both the first and the last.
- `pass_series.window_ids` needs **at least two** windows unless a rule will supply them; every id must belong to a pass plan on this project; with `prevent_overlaps` on, two windows that run at the same time are refused. `pass_series.rules[].take` is **required when `kind` is `next_n`**, because a count rule with no count is incomplete rather than "all of them". `pass_series.successor_plan_id` must be **another** `kind: pass_series` plan on the same project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `subscription`, `pass`, `pass_series`, required): What a purchase of a creator's plan actually buys. Plan shape had no discriminator before this. It was inferred from `pass_enabled` plus `recurring` plus `billing_cycle`, which is why a third shape kept falling through filters written as `where('pass_enabled', false)`: a boolean cannot express three things, so every query site had to remember which combination it meant and one of them always forgot. A `match` over this enum with no `default` is exhaustive, so a fourth shape later fails loudly at every site that has to care rather than silently taking whichever branch happened to be last. | | |---| | `subscription` <br/> Access starts at payment and runs on a billing cycle. | | `pass` <br/> One purchase buys one of the plan's own scheduled access windows. | | `pass_series` <br/> One purchase buys a curated slate of *other* plans' access windows. |
- `name` (string, required): The name buyers see, 5 to 255 characters, unique within the project without regard to case or surrounding spaces. Required on create.
- `description` (string): The pitch under the name, up to 1,000 characters. HTML is filtered to a safe subset before it is stored.
- `currency_id` (string, required): The id of a currency that at least one of the project's active payment methods can charge. Required on create.
- `price` (number, required): What one purchase costs: at least the $1.00 USD equivalent in `currency_id` at the current rate, or exactly `0` for a free plan, which only a Starter or Growth account may put on sale. Required on create.
- `active` (boolean): Whether the plan is on sale. Defaults to true on create; prefer the publish and unpublish endpoints to change it later.
- `sales_cap` (integer): Pause the plan after this many purchases, 1 to 100,000; null for no limit. Changing it restarts `sales_cap_sold` at 0.
- `eligibility` (object): Who may buy. At most one of the first three may be true, counting what the plan already holds on an update.
  - `newcomers_only` (boolean): Only members who never held a subscription on the project.
  - `customers_only` (boolean): Only members who currently hold one.
  - `churned_only` (boolean): Only members who held one and let it lapse.
  - `single_use` (boolean): Each member may buy the plan once.
  - `access_codes_only` (boolean): The plan cannot be bought, only granted by redeeming an access code.
- `resources` (array of string, required): Ids of the project's resources the plan grants: at least one, required on create, except on `kind: pass_series`, where it is optional and names a lounge open for the whole span. Omit on an update to keep the existing links.
- `billing` (object, required): Cycle, trial and renewal. Send it on `kind: subscription` only; on any other kind it is refused.
  - `billing_cycle` (one of `day`, `week`, `month`, `year`, `lifetime`, required): The unit a creator's own subscription plan renews in. Not the platform cycle: this is what a creator sells to their members, and it pairs with a count (`billing_cycle_count`) so "3 months" and "2 weeks" are both expressible. `Lifetime` is a one-time purchase that never renews.
  - `billing_cycle_count` (integer, required): How many cycles one period spans, 1 to 99; must be 1 when the cycle is `lifetime`. Required on create.
  - `recurring` (boolean): Whether the subscription renews itself. Refused as true when the currency is a crypto or platform currency.
  - `disabled_renewal` (boolean): Charge once, then lapse at the end of the period instead of renewing.
  - `trial_days` (integer): Free days before the first charge, 0 to 365.
  - `trial_cardless` (boolean): Whether the trial starts without a payment method on file.
  - `trial_type` (one of `project`, `plan`)
- `pass` (object): The plan's own dated schedule. Send it on `kind: pass` only; on any other kind it is refused.
  - `timezone` (one of `GMT`, `UTC`, `Africa/Abidjan`, `Africa/Accra`, `Africa/Bamako`, `Africa/Banjul`, `Africa/Bissau`, `Africa/Casablanca`, `Africa/Conakry`, `Africa/Dakar`, `Africa/El_Aaiun`, `Africa/Freetown`, `Africa/Lome`, `Africa/Monrovia`, `Africa/Nouakchott`, `Africa/Ouagadougou`, `Africa/Sao_Tome`, `Africa/Algiers`, `Africa/Bangui`, `Africa/Brazzaville`, `Africa/Ceuta`, `Africa/Douala`, `Africa/Kinshasa`, `Africa/Lagos`, `Africa/Libreville`, `Africa/Luanda`, `Africa/Malabo`, `Africa/Ndjamena`, `Africa/Niamey`, `Africa/Porto-Novo`, `Africa/Tunis`, `Africa/Blantyre`, `Africa/Bujumbura`, `Africa/Cairo`, `Africa/Gaborone`, `Africa/Harare`, `Africa/Johannesburg`, `Africa/Juba`, `Africa/Khartoum`, `Africa/Kigali`, `Africa/Lubumbashi`, `Africa/Lusaka`, `Africa/Maputo`, `Africa/Maseru`, `Africa/Mbabane`, `Africa/Tripoli`, `Africa/Windhoek`, `Africa/Addis_Ababa`, `Africa/Asmara`, `Africa/Dar_es_Salaam`, `Africa/Djibouti`, `Africa/Kampala`, `Africa/Mogadishu`, `Africa/Nairobi`, `America/Adak`, `America/Anchorage`, `America/Juneau`, `America/Metlakatla`, `America/Nome`, `America/Sitka`, `America/Yakutat`, `America/Los_Angeles`, `America/Tijuana`, `America/Boise`, `America/Cambridge_Bay`, `America/Ciudad_Juarez`, `America/Creston`, `America/Dawson`, `America/Dawson_Creek`, `America/Denver`, `America/Fort_Nelson`, `America/Hermosillo`, `America/Mazatlan`, `America/Phoenix`, `America/Vancouver`, `America/Whitehorse`, `America/Bahia_Banderas`, `America/Belize`, `America/Chicago`, `America/Chihuahua`, `America/Costa_Rica`, `America/Edmonton`, `America/El_Salvador`, `America/Guatemala`, `America/Indiana/Knox`, `America/Indiana/Tell_City`, `America/Inuvik`, `America/Managua`, `America/Matamoros`, `America/Menominee`, `America/Merida`, `America/Mexico_City`, `America/Monterrey`, `America/North_Dakota/Beulah`, `America/North_Dakota/Center`, `America/North_Dakota/New_Salem`, `America/Ojinaga`, `America/Rankin_Inlet`, `America/Regina`, `America/Resolute`, `America/Swift_Current`, `America/Tegucigalpa`, `America/Atikokan`, `America/Bogota`, `America/Cancun`, `America/Cayman`, `America/Detroit`, `America/Eirunepe`, `America/Grand_Turk`, `America/Guayaquil`, `America/Havana`, `America/Indiana/Indianapolis`, `America/Indiana/Marengo`, `America/Indiana/Petersburg`, `America/Indiana/Vevay`, `America/Indiana/Vincennes`, `America/Indiana/Winamac`, `America/Iqaluit`, `America/Jamaica`, `America/Kentucky/Louisville`, `America/Kentucky/Monticello`, `America/Lima`, `America/Nassau`, `America/New_York`, `America/Panama`, `America/Port-au-Prince`, `America/Rio_Branco`, `America/Toronto`, `America/Winnipeg`, `America/Anguilla`, `America/Antigua`, `America/Aruba`, `America/Barbados`, `America/Blanc-Sablon`, `America/Boa_Vista`, `America/Campo_Grande`, `America/Caracas`, `America/Cuiaba`, `America/Curacao`, `America/Dominica`, `America/Glace_Bay`, `America/Goose_Bay`, `America/Grenada`, `America/Guadeloupe`, `America/Guyana`, `America/Halifax`, `America/Kralendijk`, `America/La_Paz`, `America/Lower_Princes`, `America/Manaus`, `America/Marigot`, `America/Martinique`, `America/Moncton`, `America/Montserrat`, `America/Port_of_Spain`, `America/Porto_Velho`, `America/Puerto_Rico`, `America/Santo_Domingo`, `America/St_Barthelemy`, `America/St_Kitts`, `America/St_Lucia`, `America/St_Thomas`, `America/St_Vincent`, `America/Thule`, `America/Tortola`, `America/St_Johns`, `America/Araguaina`, `America/Argentina/Buenos_Aires`, `America/Argentina/Catamarca`, `America/Argentina/Cordoba`, `America/Argentina/Jujuy`, `America/Argentina/La_Rioja`, `America/Argentina/Mendoza`, `America/Argentina/Rio_Gallegos`, `America/Argentina/Salta`, `America/Argentina/San_Juan`, `America/Argentina/San_Luis`, `America/Argentina/Tucuman`, `America/Argentina/Ushuaia`, `America/Asuncion`, `America/Bahia`, `America/Belem`, `America/Cayenne`, `America/Coyhaique`, `America/Fortaleza`, `America/Maceio`, `America/Miquelon`, `America/Montevideo`, `America/Paramaribo`, `America/Punta_Arenas`, `America/Recife`, `America/Santarem`, `America/Santiago`, `America/Sao_Paulo`, `America/Noronha`, `America/Nuuk`, `America/Scoresbysund`, `America/Danmarkshavn`, `Antarctica/Palmer`, `Antarctica/Rothera`, `Antarctica/Troll`, `Antarctica/Syowa`, `Antarctica/Mawson`, `Antarctica/Vostok`, `Antarctica/Davis`, `Antarctica/Casey`, `Antarctica/DumontDUrville`, `Antarctica/Macquarie`, `Antarctica/McMurdo`, `Arctic/Longyearbyen`, `Asia/Beirut`, `Asia/Famagusta`, `Asia/Gaza`, `Asia/Hebron`, `Asia/Jerusalem`, `Asia/Nicosia`, `Asia/Aden`, `Asia/Amman`, `Asia/Baghdad`, `Asia/Bahrain`, `Asia/Damascus`, `Asia/Kuwait`, `Asia/Qatar`, `Asia/Riyadh`, `Asia/Tehran`, `Asia/Baku`, `Asia/Dubai`, `Asia/Muscat`, `Asia/Tbilisi`, `Asia/Yerevan`, `Asia/Kabul`, `Asia/Almaty`, `Asia/Aqtau`, `Asia/Aqtobe`, `Asia/Ashgabat`, `Asia/Atyrau`, `Asia/Dushanbe`, `Asia/Karachi`, `Asia/Oral`, `Asia/Qostanay`, `Asia/Qyzylorda`, `Asia/Samarkand`, `Asia/Tashkent`, `Asia/Yekaterinburg`, `Asia/Colombo`, `Asia/Kolkata`, `Asia/Kathmandu`, `Asia/Bishkek`, `Asia/Dhaka`, `Asia/Omsk`, `Asia/Thimphu`, `Asia/Urumqi`, `Asia/Yangon`, `Asia/Bangkok`, `Asia/Barnaul`, `Asia/Ho_Chi_Minh`, `Asia/Hovd`, `Asia/Jakarta`, `Asia/Krasnoyarsk`, `Asia/Novokuznetsk`, `Asia/Novosibirsk`, `Asia/Phnom_Penh`, `Asia/Pontianak`, `Asia/Tomsk`, `Asia/Vientiane`, `Asia/Brunei`, `Asia/Hong_Kong`, `Asia/Irkutsk`, `Asia/Kuala_Lumpur`, `Asia/Kuching`, `Asia/Macau`, `Asia/Makassar`, `Asia/Manila`, `Asia/Shanghai`, `Asia/Singapore`, `Asia/Taipei`, `Asia/Ulaanbaatar`, `Asia/Chita`, `Asia/Dili`, `Asia/Jayapura`, `Asia/Khandyga`, `Asia/Pyongyang`, `Asia/Seoul`, `Asia/Tokyo`, `Asia/Yakutsk`, `Asia/Ust-Nera`, `Asia/Vladivostok`, `Asia/Magadan`, `Asia/Sakhalin`, `Asia/Srednekolymsk`, `Asia/Anadyr`, `Asia/Kamchatka`, `Atlantic/Bermuda`, `Atlantic/Stanley`, `Atlantic/South_Georgia`, `Atlantic/Azores`, `Atlantic/Cape_Verde`, `Atlantic/Canary`, `Atlantic/Faroe`, `Atlantic/Madeira`, `Atlantic/Reykjavik`, `Atlantic/St_Helena`, `Australia/Perth`, `Australia/Eucla`, `Australia/Darwin`, `Australia/Brisbane`, `Australia/Lindeman`, `Australia/Adelaide`, `Australia/Broken_Hill`, `Australia/Hobart`, `Australia/Lord_Howe`, `Australia/Melbourne`, `Australia/Sydney`, `Europe/Dublin`, `Europe/Guernsey`, `Europe/Isle_of_Man`, `Europe/Jersey`, `Europe/Lisbon`, `Europe/London`, `Europe/Amsterdam`, `Europe/Andorra`, `Europe/Belgrade`, `Europe/Berlin`, `Europe/Bratislava`, `Europe/Brussels`, `Europe/Budapest`, `Europe/Busingen`, `Europe/Copenhagen`, `Europe/Gibraltar`, `Europe/Ljubljana`, `Europe/Luxembourg`, `Europe/Madrid`, `Europe/Malta`, `Europe/Monaco`, `Europe/Oslo`, `Europe/Paris`, `Europe/Podgorica`, `Europe/Prague`, `Europe/Rome`, `Europe/San_Marino`, `Europe/Sarajevo`, `Europe/Skopje`, `Europe/Stockholm`, `Europe/Tirane`, `Europe/Vaduz`, `Europe/Vatican`, `Europe/Vienna`, `Europe/Warsaw`, `Europe/Zagreb`, `Europe/Zurich`, `Europe/Athens`, `Europe/Bucharest`, `Europe/Chisinau`, `Europe/Helsinki`, `Europe/Kaliningrad`, `Europe/Kyiv`, `Europe/Mariehamn`, `Europe/Riga`, `Europe/Sofia`, `Europe/Tallinn`, `Europe/Vilnius`, `Europe/Istanbul`, `Europe/Kirov`, `Europe/Minsk`, `Europe/Moscow`, `Europe/Simferopol`, `Europe/Volgograd`, `Europe/Astrakhan`, `Europe/Samara`, `Europe/Saratov`, `Europe/Ulyanovsk`, `Indian/Antananarivo`, `Indian/Comoro`, `Indian/Mayotte`, `Indian/Mahe`, `Indian/Mauritius`, `Indian/Reunion`, `Indian/Kerguelen`, `Indian/Maldives`, `Indian/Chagos`, `Indian/Cocos`, `Indian/Christmas`, `Pacific/Midway`, `Pacific/Niue`, `Pacific/Pago_Pago`, `Pacific/Honolulu`, `Pacific/Rarotonga`, `Pacific/Tahiti`, `Pacific/Marquesas`, `Pacific/Gambier`, `Pacific/Pitcairn`, `Pacific/Galapagos`, `Pacific/Easter`, `Pacific/Palau`, `Pacific/Chuuk`, `Pacific/Guam`, `Pacific/Port_Moresby`, `Pacific/Saipan`, `Pacific/Bougainville`, `Pacific/Efate`, `Pacific/Guadalcanal`, `Pacific/Kosrae`, `Pacific/Noumea`, `Pacific/Pohnpei`, `Pacific/Fiji`, `Pacific/Funafuti`, `Pacific/Kwajalein`, `Pacific/Majuro`, `Pacific/Nauru`, `Pacific/Norfolk`, `Pacific/Tarawa`, `Pacific/Wake`, `Pacific/Wallis`, `Pacific/Apia`, `Pacific/Auckland`, `Pacific/Fakaofo`, `Pacific/Kanton`, `Pacific/Tongatapu`, `Pacific/Chatham`, `Pacific/Kiritimati`, `null`): The IANA zone the schedule is authored in. Legacy names are resolved, so `Asia/Calcutta` is stored as `Asia/Kolkata`. Required on create.
  - `schedule_mode` (any or null): `repeating` (the default) generates windows from `slots`; `fixed` takes explicitly dated `windows`.
  - `recurrence` (any or null): `daily`, `weekly` or `monthly`. Decides which slot fields apply.
  - `recurrence_ends_at` (string): When window generation stops; omit to keep generating.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names; omit to sell until the window begins. With `before_end` it must be at least 5 and under the shortest slot's `duration_minutes`.
  - `sales_cutoff_anchor` (one of `before_start`, `before_end`, `null`): `before_start` (the default) or `before_end`. `before_end` is refused when the shortest slot lasts 5 minutes or less. The series anchors `before_first_end` and `before_last_start` are refused on a pass.
  - `slots` (array of object): The repeating schedule, at most 60 slots. Sending it replaces the whole schedule and rebuilds unsold future windows; windows a customer has bought keep their times.
  - `windows` (array of object): Explicitly dated windows for `schedule_mode: fixed`, at most 200 per call. Added to the schedule, never replacing it.
- `pass_series` (object): The season ticket's slate, rules and seats. Send it on `kind: pass_series` only; on any other kind it is refused.
  - `prevent_overlaps` (boolean): Refuse a window that clashes with one already on the slate. Defaults to true.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names, measured against the whole season.
  - `sales_cutoff_anchor` (any or null): `before_start` (the default), `before_first_end`, `before_last_start` or `before_end`. `before_first_end` needs `sales_cutoff_minutes` of at least 5, so a buyer arriving late in the opening window is still admitted to it.
  - `seat_cap` (integer): How many holders may hold the season at once, at least 1; null for unlimited. Zero is refused: take the plan off sale with unpublish instead.
  - `presale_hours` (integer): How long the next season is offered to current holders only, 1 to 8760.
  - `successor_plan_id` (string): Another `kind: pass_series` plan on the same project to offer holders when this one finishes. A series cannot lead to itself.
  - `window_ids` (array of string): Ids of pass windows on this project to put on the slate, at most 120. A slate needs at least two unless a rule will supply them; with `prevent_overlaps` on, two that run at the same time are refused.
  - `blackout_window_ids` (array of string): Windows a rule matches but you want permanently excluded.
  - `rules` (array of object): Rules that keep absorbing matching windows into the slate, at most 20. A matching window scheduled later is added and granted to every current holder at no charge.


### POST `/v1/projects/{project}/plans/order`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/plans/order \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"plan_ids": ["c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b", "b1a7c3d5-2e48-4f60-9a1b-7c5d3e820f94"]}'
```

Pins the order plans appear in on the public portal and in the bot; `plan_ids` is every plan you want pinned, first to last. Plans left out keep the built-in order (passes, then seasons, then subscriptions, cheapest first) after the pinned ones. Send an empty `plan_ids` to clear every pin. Answers `200` with the project's active plans in their new order, each in the same shape as a read, with `position` set on the pinned ones. The same list produces the same order and one `plan.order_changed` event per call.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `plan_ids` (array of string, required): Plan ids in storefront order, at most 200, each a plan of this project and none repeated. An empty list clears every pin.


### DELETE `/v1/projects/{project}/plans/{plan}`

Removes the plan and emits `plan.deleted` with a snapshot taken before the row disappears. Members who already hold it keep their access until it runs out; to stop selling while keeping the plan on the books, unpublish it instead. A pass or series plan is refused while a customer still holds an unfinished window on it, because deleting it would cascade away access that was paid for.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/plans/{plan}`

One plan in the same discriminated shape as the list. `kind` names the one block the plan carries, `billing`, `pass` or `pass_series`; the other two are absent. A plan of another project is `404 RESOURCE_NOT_FOUND`, because `{plan}` is resolved within `{project}`.

### Common fields

Present on every kind.

| Field         | Type   | Notes                                                                                                                                                                       |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | string | `subscription`, `pass` or `pass_series`. Names the one block below it.                                                                                                      |
| `price`       | string | What **one purchase** costs. On a pass that buys one window; on a series it buys the whole slate, once.                                                                    |
| `currency`    | object | `{ id, iso, symbol }`.                                                                                                                                                      |
| `cadence`     | string | The human-readable duration string: `"Per Month"`, `"Per 3 Hours"`, `"For all 10 passes"`.                                                                                |
| `eligibility` | object | Audience restrictions. The first three are mutually exclusive.                                                                                                              |
| `resources`   | array  | Present when the relation is loaded: each resource's `id`, `name`, `kind` (`manual` or `connector:kind`) and `connector`. On a series these are the **lounge**, not the thing being sold. |

> **Why `cadence` exists.** Both the portal and the bot already compute exactly this string, and every integrator without it reinvents it, wrongly for a dated plan, printing "1 Month" beside a three-hour window. Use it rather than deriving a duration from the cycle fields.

### kind: subscription

| Field                         | Type    | Notes                                                 |
| ----------------------------- | ------- | ----------------------------------------------------- |
| `billing.billing_cycle`       | string  | `day`, `week`, `month`, `year`, `lifetime`.           |
| `billing.billing_cycle_count` | integer | 1–99. Must be `1` when `billing_cycle` is `lifetime`. |
| `billing.recurring`           | boolean | Rejected as `true` for crypto or platform currencies. |
| `billing.disabled_renewal`    | boolean | Charges once, then lapses rather than renewing.       |
| `billing.trial_days`          | integer | 0–365.                                                |
| `billing.trial_cardless`      | boolean | Whether the trial starts without a payment method.    |
| `billing.trial_type`          | string  | `project` or `plan`: whose trial rule applies.        |

### kind: pass

A plan that owns its own dated windows and sells one per purchase.

| Field                           | Type              | Notes                                                                                                                                                                       |
| ------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass.timezone`                 | string            | IANA zone the schedule was authored in. Render window times in this, never UTC.                                                                                             |
| `pass.schedule_mode`            | string            | `repeating` or `fixed`.                                                                                                                                                     |
| `pass.recurrence`               | string \| null    | `daily`, `weekly` or `monthly`. Null in `fixed` mode.                                                                                                                       |
| `pass.recurrence_ends_at`       | timestamp \| null | When window generation stops. **Renamed**, see the note below.                                                                                                              |
| `pass.sales_cutoff_minutes`     | integer \| null   | Stops sales this many minutes before the moment `sales_cutoff_anchor` names.                                                                                                |
| `pass.sales_cutoff_anchor`      | string            | `before_start` or `before_end`. Never null: a plan that never set it reads as `before_start`. `before_first_end` and `before_last_start` are series-only and refused here. |
| `pass.slots[].start_time`       | string `HH:MM`    | Local wall-clock time in `timezone`.                                                                                                                                        |
| `pass.slots[].duration_minutes` | integer           | Each slot carries its own length, so one plan can mix a 3-hour and a 14-hour window.                                                                                        |
| `pass.upcoming_windows[]`       | array             | Present only when the relation is loaded. Timestamps are **UTC**. The pass windows endpoints list and manage a plan's dates.                                              |

> **`series_ends_at` was renamed to `recurrence_ends_at`.** Same field, same meaning: how long this plan keeps generating windows from its recurrence. It never had anything to do with a Pass Series, but now that a series is a real plan kind, a field called `series_ends_at` sitting on a pass read as "when this plan's series ends", which is a different thing and one that does not exist here. Update any reader to the new key; there is no alias.

### kind: pass_series

A season ticket. It **owns no windows**: it points at windows that already exist on your pass plans, which is the whole distinction from `kind: pass`.

| Field                                 | Type              | Notes                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass_series.timezone`                | string            | Borrowed from the source plans; a series has no zone of its own. A series whose sources disagree is refused at authoring time.                                                                                                                                                                      |
| `pass_series.prevent_overlaps`        | boolean           | Refuses to absorb a window clashing with one already on the slate.                                                                                                                                                                                                                                   |
| `pass_series.sales_cutoff_minutes`    | integer           | Measured against the **whole season**, not one window.                                                                                                                                                                                                                                               |
| `pass_series.sales_cutoff_anchor`     | string            | Four anchors, earliest deadline first. `before_start` closes before the **first** window opens. `before_first_end` closes during that opening window. `before_last_start` closes as the **last** window opens, so a buyer always gets one whole window. `before_end` closes as the last window ends. |
| `pass_series.seat_cap`                | integer \| null   | Concurrent holder limit. `null` is unlimited.                                                                                                                                                                                                                                                        |
| `pass_series.seats_taken`             | integer           | Holders currently counted against the cap.                                                                                                                                                                                                                                                           |
| `pass_series.seats_remaining`         | integer \| null   | `null` when uncapped.                                                                                                                                                                                                                                                                                |
| `pass_series.starts_at`               | timestamp \| null | First window's start, **UTC**.                                                                                                                                                                                                                                                                       |
| `pass_series.ends_at`                 | timestamp \| null | Last window's end, UTC.                                                                                                                                                                                                                                                                              |
| `pass_series.window_count`            | integer           | Slate length. Capped at **120**.                                                                                                                                                                                                                                                                     |
| `pass_series.successor_plan_id`       | string \| null    | The next season, offered to holders first when this one finishes.                                                                                                                                                                                                                                    |
| `pass_series.presale_hours`           | integer \| null   | How long that offer is held for holders only. 1–8760.                                                                                                                                                                                                                                                |
| `pass_series.windows[]`               | array             | The slate. Each entry names the **plan the window belongs to**; a series can mix several.                                                                                                                                                                                                            |
| `pass_series.windows[].added_by_rule` | boolean           | `true` when a rule absorbed it rather than the creator picking it by hand.                                                                                                                                                                                                                           |
| `pass_series.rules[]`                 | array             | Automatic inclusion rules. `kind` is `date_range` or `next_n`; `take` is required on `next_n`.                                                                                                                                                                                                       |
| `pass_series.blackout_window_ids`     | array             | Windows a rule matches but the creator has permanently excluded.                                                                                                                                                                                                                                     |

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/plans/{plan}`

The same discriminated shape as create, with every field optional. Omit `kind` to keep the plan's current kind; a block you send must match it. Where a cross-field rule needs a value you did not send, the billing cycle behind a lifetime count check, the currency behind the price floor, the eligibility flags behind the exclusivity check, the plan's stored value stands in, so a partial update is validated against the plan it will actually produce.

- `resources` is optional; omitting it preserves the existing links, sending it replaces them.
- Every update of a plan on sale queues its push to the payment methods that keep a product catalogue, so a changed price or name reaches Stripe, PayPal, CoinPayments and Razorpay within a minute.
- `sales_cap` may be set, raised, lowered or cleared with `null`; any change restarts `sales_cap_sold` at `0`.
- `pass.slots` **replaces** the whole schedule and rebuilds unsold future windows; `pass.windows` **adds** dated windows and never replaces.
- Setting an active plan's `price` to `0` on a Free account is refused; editing a zero-priced plan that is **off sale** is allowed on any account.
- `sales_cap_sold`, `position` and `paused` are read-only.

Answers `200` with the whole plan after the change.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `subscription`, `pass`, `pass_series`): What a purchase of a creator's plan actually buys. Plan shape had no discriminator before this. It was inferred from `pass_enabled` plus `recurring` plus `billing_cycle`, which is why a third shape kept falling through filters written as `where('pass_enabled', false)`: a boolean cannot express three things, so every query site had to remember which combination it meant and one of them always forgot. A `match` over this enum with no `default` is exhaustive, so a fourth shape later fails loudly at every site that has to care rather than silently taking whichever branch happened to be last. | | |---| | `subscription` <br/> Access starts at payment and runs on a billing cycle. | | `pass` <br/> One purchase buys one of the plan's own scheduled access windows. | | `pass_series` <br/> One purchase buys a curated slate of *other* plans' access windows. |
- `name` (string): The name buyers see, 5 to 255 characters, unique within the project without regard to case or surrounding spaces. Required on create.
- `description` (string): The pitch under the name, up to 1,000 characters. HTML is filtered to a safe subset before it is stored.
- `currency_id` (string): The id of a currency that at least one of the project's active payment methods can charge. Required on create.
- `price` (number): What one purchase costs: at least the $1.00 USD equivalent in `currency_id` at the current rate, or exactly `0` for a free plan, which only a Starter or Growth account may put on sale. Required on create.
- `active` (boolean): Whether the plan is on sale. Defaults to true on create; prefer the publish and unpublish endpoints to change it later.
- `sales_cap` (integer): Pause the plan after this many purchases, 1 to 100,000; null for no limit. Changing it restarts `sales_cap_sold` at 0.
- `eligibility` (object): Who may buy. At most one of the first three may be true, counting what the plan already holds on an update.
  - `newcomers_only` (boolean): Only members who never held a subscription on the project.
  - `customers_only` (boolean): Only members who currently hold one.
  - `churned_only` (boolean): Only members who held one and let it lapse.
  - `single_use` (boolean): Each member may buy the plan once.
  - `access_codes_only` (boolean): The plan cannot be bought, only granted by redeeming an access code.
- `resources` (array of string): Ids of the project's resources the plan grants: at least one, required on create, except on `kind: pass_series`, where it is optional and names a lounge open for the whole span. Omit on an update to keep the existing links.
- `billing` (object): Cycle, trial and renewal. Send it on `kind: subscription` only; on any other kind it is refused.
  - `billing_cycle` (one of `day`, `week`, `month`, `year`, `lifetime`): The unit a creator's own subscription plan renews in. Not the platform cycle: this is what a creator sells to their members, and it pairs with a count (`billing_cycle_count`) so "3 months" and "2 weeks" are both expressible. `Lifetime` is a one-time purchase that never renews.
  - `billing_cycle_count` (integer): How many cycles one period spans, 1 to 99; must be 1 when the cycle is `lifetime`. Required on create.
  - `recurring` (boolean): Whether the subscription renews itself. Refused as true when the currency is a crypto or platform currency.
  - `disabled_renewal` (boolean): Charge once, then lapse at the end of the period instead of renewing.
  - `trial_days` (integer): Free days before the first charge, 0 to 365.
  - `trial_cardless` (boolean): Whether the trial starts without a payment method on file.
  - `trial_type` (one of `project`, `plan`)
- `pass` (object): The plan's own dated schedule. Send it on `kind: pass` only; on any other kind it is refused.
  - `timezone` (one of `GMT`, `UTC`, `Africa/Abidjan`, `Africa/Accra`, `Africa/Bamako`, `Africa/Banjul`, `Africa/Bissau`, `Africa/Casablanca`, `Africa/Conakry`, `Africa/Dakar`, `Africa/El_Aaiun`, `Africa/Freetown`, `Africa/Lome`, `Africa/Monrovia`, `Africa/Nouakchott`, `Africa/Ouagadougou`, `Africa/Sao_Tome`, `Africa/Algiers`, `Africa/Bangui`, `Africa/Brazzaville`, `Africa/Ceuta`, `Africa/Douala`, `Africa/Kinshasa`, `Africa/Lagos`, `Africa/Libreville`, `Africa/Luanda`, `Africa/Malabo`, `Africa/Ndjamena`, `Africa/Niamey`, `Africa/Porto-Novo`, `Africa/Tunis`, `Africa/Blantyre`, `Africa/Bujumbura`, `Africa/Cairo`, `Africa/Gaborone`, `Africa/Harare`, `Africa/Johannesburg`, `Africa/Juba`, `Africa/Khartoum`, `Africa/Kigali`, `Africa/Lubumbashi`, `Africa/Lusaka`, `Africa/Maputo`, `Africa/Maseru`, `Africa/Mbabane`, `Africa/Tripoli`, `Africa/Windhoek`, `Africa/Addis_Ababa`, `Africa/Asmara`, `Africa/Dar_es_Salaam`, `Africa/Djibouti`, `Africa/Kampala`, `Africa/Mogadishu`, `Africa/Nairobi`, `America/Adak`, `America/Anchorage`, `America/Juneau`, `America/Metlakatla`, `America/Nome`, `America/Sitka`, `America/Yakutat`, `America/Los_Angeles`, `America/Tijuana`, `America/Boise`, `America/Cambridge_Bay`, `America/Ciudad_Juarez`, `America/Creston`, `America/Dawson`, `America/Dawson_Creek`, `America/Denver`, `America/Fort_Nelson`, `America/Hermosillo`, `America/Mazatlan`, `America/Phoenix`, `America/Vancouver`, `America/Whitehorse`, `America/Bahia_Banderas`, `America/Belize`, `America/Chicago`, `America/Chihuahua`, `America/Costa_Rica`, `America/Edmonton`, `America/El_Salvador`, `America/Guatemala`, `America/Indiana/Knox`, `America/Indiana/Tell_City`, `America/Inuvik`, `America/Managua`, `America/Matamoros`, `America/Menominee`, `America/Merida`, `America/Mexico_City`, `America/Monterrey`, `America/North_Dakota/Beulah`, `America/North_Dakota/Center`, `America/North_Dakota/New_Salem`, `America/Ojinaga`, `America/Rankin_Inlet`, `America/Regina`, `America/Resolute`, `America/Swift_Current`, `America/Tegucigalpa`, `America/Atikokan`, `America/Bogota`, `America/Cancun`, `America/Cayman`, `America/Detroit`, `America/Eirunepe`, `America/Grand_Turk`, `America/Guayaquil`, `America/Havana`, `America/Indiana/Indianapolis`, `America/Indiana/Marengo`, `America/Indiana/Petersburg`, `America/Indiana/Vevay`, `America/Indiana/Vincennes`, `America/Indiana/Winamac`, `America/Iqaluit`, `America/Jamaica`, `America/Kentucky/Louisville`, `America/Kentucky/Monticello`, `America/Lima`, `America/Nassau`, `America/New_York`, `America/Panama`, `America/Port-au-Prince`, `America/Rio_Branco`, `America/Toronto`, `America/Winnipeg`, `America/Anguilla`, `America/Antigua`, `America/Aruba`, `America/Barbados`, `America/Blanc-Sablon`, `America/Boa_Vista`, `America/Campo_Grande`, `America/Caracas`, `America/Cuiaba`, `America/Curacao`, `America/Dominica`, `America/Glace_Bay`, `America/Goose_Bay`, `America/Grenada`, `America/Guadeloupe`, `America/Guyana`, `America/Halifax`, `America/Kralendijk`, `America/La_Paz`, `America/Lower_Princes`, `America/Manaus`, `America/Marigot`, `America/Martinique`, `America/Moncton`, `America/Montserrat`, `America/Port_of_Spain`, `America/Porto_Velho`, `America/Puerto_Rico`, `America/Santo_Domingo`, `America/St_Barthelemy`, `America/St_Kitts`, `America/St_Lucia`, `America/St_Thomas`, `America/St_Vincent`, `America/Thule`, `America/Tortola`, `America/St_Johns`, `America/Araguaina`, `America/Argentina/Buenos_Aires`, `America/Argentina/Catamarca`, `America/Argentina/Cordoba`, `America/Argentina/Jujuy`, `America/Argentina/La_Rioja`, `America/Argentina/Mendoza`, `America/Argentina/Rio_Gallegos`, `America/Argentina/Salta`, `America/Argentina/San_Juan`, `America/Argentina/San_Luis`, `America/Argentina/Tucuman`, `America/Argentina/Ushuaia`, `America/Asuncion`, `America/Bahia`, `America/Belem`, `America/Cayenne`, `America/Coyhaique`, `America/Fortaleza`, `America/Maceio`, `America/Miquelon`, `America/Montevideo`, `America/Paramaribo`, `America/Punta_Arenas`, `America/Recife`, `America/Santarem`, `America/Santiago`, `America/Sao_Paulo`, `America/Noronha`, `America/Nuuk`, `America/Scoresbysund`, `America/Danmarkshavn`, `Antarctica/Palmer`, `Antarctica/Rothera`, `Antarctica/Troll`, `Antarctica/Syowa`, `Antarctica/Mawson`, `Antarctica/Vostok`, `Antarctica/Davis`, `Antarctica/Casey`, `Antarctica/DumontDUrville`, `Antarctica/Macquarie`, `Antarctica/McMurdo`, `Arctic/Longyearbyen`, `Asia/Beirut`, `Asia/Famagusta`, `Asia/Gaza`, `Asia/Hebron`, `Asia/Jerusalem`, `Asia/Nicosia`, `Asia/Aden`, `Asia/Amman`, `Asia/Baghdad`, `Asia/Bahrain`, `Asia/Damascus`, `Asia/Kuwait`, `Asia/Qatar`, `Asia/Riyadh`, `Asia/Tehran`, `Asia/Baku`, `Asia/Dubai`, `Asia/Muscat`, `Asia/Tbilisi`, `Asia/Yerevan`, `Asia/Kabul`, `Asia/Almaty`, `Asia/Aqtau`, `Asia/Aqtobe`, `Asia/Ashgabat`, `Asia/Atyrau`, `Asia/Dushanbe`, `Asia/Karachi`, `Asia/Oral`, `Asia/Qostanay`, `Asia/Qyzylorda`, `Asia/Samarkand`, `Asia/Tashkent`, `Asia/Yekaterinburg`, `Asia/Colombo`, `Asia/Kolkata`, `Asia/Kathmandu`, `Asia/Bishkek`, `Asia/Dhaka`, `Asia/Omsk`, `Asia/Thimphu`, `Asia/Urumqi`, `Asia/Yangon`, `Asia/Bangkok`, `Asia/Barnaul`, `Asia/Ho_Chi_Minh`, `Asia/Hovd`, `Asia/Jakarta`, `Asia/Krasnoyarsk`, `Asia/Novokuznetsk`, `Asia/Novosibirsk`, `Asia/Phnom_Penh`, `Asia/Pontianak`, `Asia/Tomsk`, `Asia/Vientiane`, `Asia/Brunei`, `Asia/Hong_Kong`, `Asia/Irkutsk`, `Asia/Kuala_Lumpur`, `Asia/Kuching`, `Asia/Macau`, `Asia/Makassar`, `Asia/Manila`, `Asia/Shanghai`, `Asia/Singapore`, `Asia/Taipei`, `Asia/Ulaanbaatar`, `Asia/Chita`, `Asia/Dili`, `Asia/Jayapura`, `Asia/Khandyga`, `Asia/Pyongyang`, `Asia/Seoul`, `Asia/Tokyo`, `Asia/Yakutsk`, `Asia/Ust-Nera`, `Asia/Vladivostok`, `Asia/Magadan`, `Asia/Sakhalin`, `Asia/Srednekolymsk`, `Asia/Anadyr`, `Asia/Kamchatka`, `Atlantic/Bermuda`, `Atlantic/Stanley`, `Atlantic/South_Georgia`, `Atlantic/Azores`, `Atlantic/Cape_Verde`, `Atlantic/Canary`, `Atlantic/Faroe`, `Atlantic/Madeira`, `Atlantic/Reykjavik`, `Atlantic/St_Helena`, `Australia/Perth`, `Australia/Eucla`, `Australia/Darwin`, `Australia/Brisbane`, `Australia/Lindeman`, `Australia/Adelaide`, `Australia/Broken_Hill`, `Australia/Hobart`, `Australia/Lord_Howe`, `Australia/Melbourne`, `Australia/Sydney`, `Europe/Dublin`, `Europe/Guernsey`, `Europe/Isle_of_Man`, `Europe/Jersey`, `Europe/Lisbon`, `Europe/London`, `Europe/Amsterdam`, `Europe/Andorra`, `Europe/Belgrade`, `Europe/Berlin`, `Europe/Bratislava`, `Europe/Brussels`, `Europe/Budapest`, `Europe/Busingen`, `Europe/Copenhagen`, `Europe/Gibraltar`, `Europe/Ljubljana`, `Europe/Luxembourg`, `Europe/Madrid`, `Europe/Malta`, `Europe/Monaco`, `Europe/Oslo`, `Europe/Paris`, `Europe/Podgorica`, `Europe/Prague`, `Europe/Rome`, `Europe/San_Marino`, `Europe/Sarajevo`, `Europe/Skopje`, `Europe/Stockholm`, `Europe/Tirane`, `Europe/Vaduz`, `Europe/Vatican`, `Europe/Vienna`, `Europe/Warsaw`, `Europe/Zagreb`, `Europe/Zurich`, `Europe/Athens`, `Europe/Bucharest`, `Europe/Chisinau`, `Europe/Helsinki`, `Europe/Kaliningrad`, `Europe/Kyiv`, `Europe/Mariehamn`, `Europe/Riga`, `Europe/Sofia`, `Europe/Tallinn`, `Europe/Vilnius`, `Europe/Istanbul`, `Europe/Kirov`, `Europe/Minsk`, `Europe/Moscow`, `Europe/Simferopol`, `Europe/Volgograd`, `Europe/Astrakhan`, `Europe/Samara`, `Europe/Saratov`, `Europe/Ulyanovsk`, `Indian/Antananarivo`, `Indian/Comoro`, `Indian/Mayotte`, `Indian/Mahe`, `Indian/Mauritius`, `Indian/Reunion`, `Indian/Kerguelen`, `Indian/Maldives`, `Indian/Chagos`, `Indian/Cocos`, `Indian/Christmas`, `Pacific/Midway`, `Pacific/Niue`, `Pacific/Pago_Pago`, `Pacific/Honolulu`, `Pacific/Rarotonga`, `Pacific/Tahiti`, `Pacific/Marquesas`, `Pacific/Gambier`, `Pacific/Pitcairn`, `Pacific/Galapagos`, `Pacific/Easter`, `Pacific/Palau`, `Pacific/Chuuk`, `Pacific/Guam`, `Pacific/Port_Moresby`, `Pacific/Saipan`, `Pacific/Bougainville`, `Pacific/Efate`, `Pacific/Guadalcanal`, `Pacific/Kosrae`, `Pacific/Noumea`, `Pacific/Pohnpei`, `Pacific/Fiji`, `Pacific/Funafuti`, `Pacific/Kwajalein`, `Pacific/Majuro`, `Pacific/Nauru`, `Pacific/Norfolk`, `Pacific/Tarawa`, `Pacific/Wake`, `Pacific/Wallis`, `Pacific/Apia`, `Pacific/Auckland`, `Pacific/Fakaofo`, `Pacific/Kanton`, `Pacific/Tongatapu`, `Pacific/Chatham`, `Pacific/Kiritimati`, `null`): The IANA zone the schedule is authored in. Legacy names are resolved, so `Asia/Calcutta` is stored as `Asia/Kolkata`. Required on create.
  - `schedule_mode` (any or null): `repeating` (the default) generates windows from `slots`; `fixed` takes explicitly dated `windows`.
  - `recurrence` (any or null): `daily`, `weekly` or `monthly`. Decides which slot fields apply.
  - `recurrence_ends_at` (string): When window generation stops; omit to keep generating.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names; omit to sell until the window begins. With `before_end` it must be at least 5 and under the shortest slot's `duration_minutes`.
  - `sales_cutoff_anchor` (one of `before_start`, `before_end`, `null`): `before_start` (the default) or `before_end`. `before_end` is refused when the shortest slot lasts 5 minutes or less. The series anchors `before_first_end` and `before_last_start` are refused on a pass.
  - `slots` (array of object): The repeating schedule, at most 60 slots. Sending it replaces the whole schedule and rebuilds unsold future windows; windows a customer has bought keep their times.
  - `windows` (array of object): Explicitly dated windows for `schedule_mode: fixed`, at most 200 per call. Added to the schedule, never replacing it.
- `pass_series` (object): The season ticket's slate, rules and seats. Send it on `kind: pass_series` only; on any other kind it is refused.
  - `prevent_overlaps` (boolean): Refuse a window that clashes with one already on the slate. Defaults to true.
  - `sales_cutoff_minutes` (integer): Stop sales this many minutes before the moment `sales_cutoff_anchor` names, measured against the whole season.
  - `sales_cutoff_anchor` (any or null): `before_start` (the default), `before_first_end`, `before_last_start` or `before_end`. `before_first_end` needs `sales_cutoff_minutes` of at least 5, so a buyer arriving late in the opening window is still admitted to it.
  - `seat_cap` (integer): How many holders may hold the season at once, at least 1; null for unlimited. Zero is refused: take the plan off sale with unpublish instead.
  - `presale_hours` (integer): How long the next season is offered to current holders only, 1 to 8760.
  - `successor_plan_id` (string): Another `kind: pass_series` plan on the same project to offer holders when this one finishes. A series cannot lead to itself.
  - `window_ids` (array of string): Ids of pass windows on this project to put on the slate, at most 120. A slate needs at least two unless a rule will supply them; with `prevent_overlaps` on, two that run at the same time are refused.
  - `blackout_window_ids` (array of string): Windows a rule matches but you want permanently excluded.
  - `rules` (array of object): Rules that keep absorbing matching windows into the slate, at most 20. A matching window scheduled later is added and granted to every current holder at no charge.


### POST `/v1/projects/{project}/plans/{plan}/publish`

Puts the plan on sale: `active` becomes `true`, `sales_cap_sold` restarts at `0`, and `plan.activated` fires. Publishing also queues the push of the plan to the payment methods that keep a product catalogue (Stripe, PayPal, CoinPayments, Razorpay), the same push a create or update of a plan on sale queues, so a plan created as a draft is sellable through them within a minute of going on sale. A plan that is already on sale is answered as it is and emits nothing. Answers `200` with the plan.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/successor`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/plans/$SERIES_PLAN/successor \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The plan list's "start next season" button. For a `kind: pass_series` plan only: creates a **new** `pass_series` plan copied from the one named, its price, currency, description, eligibility, linked resources, overlap rule, sales cutoff and seat cap, with two deliberate differences: it is created **inactive**, and its slate is **empty**, because a season that went straight on sale with last year's dates would be selling something that has already happened. Rules are carried forward with their date bounds shifted by the length of the finished season; the slate itself and any blackouts are not, since both name windows that have run.

The old season's `successor_plan_id` is pointed at the new plan (and a presale window is set if the old season had none), which is what lets current holders be offered the next season first. Answers `201` with the new plan in the same discriminated shape as any other read and emits `plan.created` for it. Compose it with a `PATCH` (`pass_series.window_ids` or `pass_series.rules`) and put it on sale with publish.

> **Not idempotent across calls. Call it once per season.** Every call creates another plan, named after the source with a season number appended, and re-points the old season's successor at the newest one. Read the source plan first: if `pass_series.successor_plan_id` is already set, the next season exists. The `Idempotency-Key` protects a retry of the same call, not a second call with a new key.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The finished season, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/unpublish`

Takes the plan off sale: `active` becomes `false` and `plan.deactivated` fires. Members who already joined keep their access; the plan stays fully editable and can be published again. A plan that is already off sale is answered as it is and emits nothing. Answers `200` with the plan.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `access-codes`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/plans/{plan}/access-codes` | `project-access-code:view-any` | List a plan's access codes | `list_access_codes` |
| POST | `/v1/projects/{project}/plans/{plan}/access-codes/bulk-generate` | `project-access-code:create` | Generate a batch of codes | `bulk_generate_access_codes` |
| GET | `/v1/projects/{project}/plans/{plan}/access-codes/preview` | `project-access-code:view-any` | Price a batch | `preview_access_code_cost` |
| DELETE | `/v1/projects/{project}/plans/{plan}/access-codes/{accessCode}` | `project-access-code:delete` | Revoke an access code | `revoke_access_code` |

### GET `/v1/projects/{project}/plans/{plan}/access-codes`

Pages the plan's codes, newest first, fifty per page unless you say otherwise. `status` narrows the list to `unredeemed`, `redeemed` or `expired` codes; the default `all` returns every state.

Raw `access_code` values are **always masked** in API responses to the last 5 characters. Plaintext codes ship only through the creator dashboard CSV export or the per-code messages a batch can be delivered as.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.
- `status` (query, string): Which codes to list: `all` (the default), `unredeemed`, `redeemed` or `expired`. An unknown value reads as `all`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/plans/{plan}/access-codes/bulk-generate`

Queues a batch of codes for the plan and answers `202 Accepted` at once; the codes are written by a background job and delivered the way `export_type` names. Poll the list endpoint, or subscribe to `access_code.generated`, to know when the batch is ready.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT/plans/$PLAN/access-codes/bulk-generate \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "export_type": "file",
    "expiry_preset": "1_month"
  }'
```

Answers `202` with the job's key, the plan, the quantity and the cost preview the pricing endpoint describes. Bulk generation is limited to **10 batches per minute per token** in its own bucket, on top of the token's general limits; the eleventh answers `429 RATE_LIMITED` with `Retry-After`.

The validation rules are identical to the creator dashboard's: `quantity` 1 to 1,000; `export_type` `file` or `messages`, with `consent: true` required for `messages` because one bot message per code can trip the connector's rate limits; `expiry_preset` one of `no_expiry`, `1_day`, `1_week`, `1_month`, `1_year` or `custom`, the last needing `custom_expiry_amount` and `custom_expiry_type` (`days`, `weeks`, `months` or `years`).

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `quantity` (integer, required): How many codes to generate, 1 to 1,000 per batch.
- `export_type` (one of `file`, `messages`, required): How a generated batch of access codes is handed to the creator. Both routes go through the creator's chat with the platform bot, because the batch is generated on a queue after the request returned and the bot is the one channel every creator already has open. | | |---| | `file` <br/> One CSV with every code, for spreadsheets and automation. | | `messages` <br/> One forwardable message per code, capped so a batch cannot flood the chat. |
- `consent` (one of `yes`, `on`, `1`, `1`, `true`, `true`): Must be `true` when `export_type` is `messages`: one message per code is high volume and can trip the connector's rate limits, so you acknowledge it explicitly. Ignored otherwise.
- `expiry_preset` (one of `no_expiry`, `1_day`, `1_week`, `1_month`, `1_year`, `custom`, required): When a generated access code stops being redeemable. The presets cover what creators pick nearly every time; `Custom` takes an amount and a unit for the rest. The instant is resolved when the batch is generated, so every code in a batch shares one expiry. | | |---| | `no_expiry` <br/> The code stays redeemable until it is used or revoked. | | `1_day` <br/> | | `1_week` <br/> | | `1_month` <br/> | | `1_year` <br/> | | `custom` <br/> An amount of a unit, supplied alongside the preset. |
- `custom_expiry_amount` (integer): How many units the codes live for; required when `expiry_preset` is `custom`, at least 1.
- `custom_expiry_type` (any or null): The unit of `custom_expiry_amount`: `days`, `weeks`, `months` or `years`. Required when `expiry_preset` is `custom`. No minutes or hours: a code that dies within the hour it was generated is a support ticket, not a feature.


### GET `/v1/projects/{project}/plans/{plan}/access-codes/preview`

Prices a batch of `quantity` codes without queuing it, so a caller can show the worst-case charge before generating.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT/plans/$PLAN/access-codes/preview?quantity=50" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

> **Generation is free.** The metered overage is billed at **redemption time**, and only when your tier's free access-code allotment is already exhausted. Hand out codes freely; you only pay for the ones subscribers actually activate beyond the free quota.

The preview and the bulk-generate endpoint both return this cost breakdown so callers can surface the worst case ("if every one of these codes is redeemed, here is what you would owe").

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `quantity` (query, integer, required): How many codes the batch would hold, 1 to 1,000.


### DELETE `/v1/projects/{project}/plans/{plan}/access-codes/{accessCode}`

Deletes an unredeemed code so it can no longer be claimed. The code is resolved within the plan, so an id from another plan is `404 RESOURCE_NOT_FOUND`. Answers `204` with no body; no webhook fires.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project by the route binder.
- `accessCode` (path, string, required): The unredeemed code, resolved within the plan by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `portal-design`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/portal-design` | `project:view` | Get a project's portal design | `get_portal_design` |
| PUT | `/v1/projects/{project}/portal-design` | `project:update` | Save portal design changes | `update_portal_design` |
| POST | `/v1/projects/{project}/portal-design/discard` | `project:update` | Discard the portal design draft | `discard_portal_design_draft` |
| POST | `/v1/projects/{project}/portal-design/images/{slot}` | `project:update` | Store a portal design picture |  |
| POST | `/v1/projects/{project}/portal-design/publish` | `project:update` | Publish the portal design | `publish_portal_design` |

### GET `/v1/projects/{project}/portal-design`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The published document, the draft when there is one, when each last moved, and a fresh preview address, or null for a project without a handle. Every key of the fourteen sections comes back in the stored shape `PUT` takes, so a design read here can be changed and sent back. `draft` is `null` and `has_draft` false while nothing is drafted.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/portal-design`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 7c1f0d3a-6b2e-4f88-9a41-2d5e6c7b8a90" \
  -H "Content-Type: application/json" \
  -d '{"preset": "midnight", "accent": "#22d3ee", "font_display": "space-grotesk"}'
```

Changes the keys sent in the draft, starting one from the published design when none exists; every key is optional and an omitted one keeps its drafted value. Members keep seeing the published design until `publish`. Pictures are stored first through the images endpoint and their addresses written into `gallery`, a quote's `avatar_url` or `social_card_url`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `preset` (one of `classic`, `dark`, `midnight`, `paper`, `pastel`, `bold`): The starting palettes a portal design is built from. A preset sets every colour of the design at once and stays editable afterwards; `Classic` is the exact look every portal had before the designer existed, which is why its light palette is the design's default. Each preset carries a light and a dark palette drawn by hand, because an inverted light palette reads as broken on a dark screen: the dark half keeps the accent and re-draws the backgrounds and the text.
- `color_mode` (one of `light`, `dark`, `system`): Which of a preset's two palettes the portal paints with. `System` paints the light palette and switches to the dark one when the visitor's browser asks for a dark scheme, through a media query the layout emits beside the light declarations; the other two paint one palette whatever the visitor prefers. Every preset carries a drawn dark palette, so the dark half is never an inversion of the light one.
- `accent` (string): The accent, on the buttons, the highlights and the chosen plan's ring, as a six-digit lowercase hex such as `#a3e635`. The text drawn on it is picked by luminance.
- `accent_secondary` (string): The second accent, on the pass-series and pass strips, as a hex colour; `null` paints the preset's own.
- `background` (string): The page colour behind the cards, as a hex colour.
- `grid` (boolean): Whether the faint dotted grid is drawn over the page colour.
- `surface` (string): The cards' colour, as a hex colour.
- `text` (string): The body text colour, as a hex colour. It must read on the surface and on the background: a pair under a 3:1 contrast ratio is refused.
- `heading` (string): The colour of the project's name and every heading, as a hex colour, under the same contrast rule as `text`.
- `muted` (string): The colour of the captions, the labels and the small print, as a hex colour, under the same contrast rule as `text`.
- `tagline` (string): One line under the project's name, up to 80 characters, or `null` for none.
- `social_links` (array of string): Up to 12 links under the card, each `{network, url, label}`: `network` one of {social_networks}; `url` an https address; `label` the name shown for a `custom` link, up to 40 characters, ignored on the others.
- `font_display` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The curated faces a portal may set its display and body type in. Twelve faces, every one an open licence and self-hosted as a latin subset, so a member's browser never calls a font service; the two the portal always had head the list. A face names itself rather than a translated word, as a brand does, and says whether it is a serif so the fallback stack behind it reads the same way while it loads.
- `font_body` (one of `asap-condensed`, `inter`, `poppins`, `montserrat`, `space-grotesk`, `bebas-neue`, `oswald`, `dm-serif-display`, `playfair-display`, `lora`, `manrope`, `sora`): The curated faces a portal may set its display and body type in. Twelve faces, every one an open licence and self-hosted as a latin subset, so a member's browser never calls a font service; the two the portal always had head the list. A face names itself rather than a translated word, as a brand does, and says whether it is a serif so the fallback stack behind it reads the same way while it loads.
- `heading_case` (one of `uppercase`, `as_written`): How the portal's headings set their letters. The portal always shouted its headings in capitals; a serif or a script face reads better as written, so the case is a choice of its own rather than a property of the face.
- `type_scale` (one of `compact`, `regular`, `large`): How large the portal sets its type. One factor over every text size the templates use, so the page keeps its proportions; the regular scale is exactly the size every portal had, and emits nothing.
- `radius` (one of `sharp`, `soft`, `round`): How rounded the portal's corners are. One choice moves every corner together, the two surface cards and the plan cards included, through the bundle's own radius tokens; the round setting is exactly the look every portal had and emits nothing.
- `button_style` (one of `pill`, `rounded`, `square`): The shape of the portal's buttons. The pill is the shape every portal had; the rounded button follows the corner radius the design chose, and the square one is nearly sharp whatever the corners do.
- `button_fill` (one of `accent`, `dark`, `outline`): How the portal's buttons are filled. The dark fill every portal had reads the palette's heading colour and the surface it sits on, so it stays a dark button on a light palette and a light one on a dark palette; the accent fill reads the accent and the foreground picked for it; the outline keeps the surface and draws the heading colour around and inside the button.
- `button_case` (one of `uppercase`, `as_written`): How the portal's headings set their letters. The portal always shouted its headings in capitals; a serif or a script face reads better as written, so the case is a choice of its own rather than a property of the face.
- `shadow` (one of `none`, `soft`, `strong`): How much the portal's surfaces lift off the page. Three shadows move together: the one under the surface and plan cards, the one under anything that floats (a modal, a menu) and the soft one under small things like the project photo; the strong setting is the depth every portal had.
- `card_border` (boolean): Whether the cards carry a hairline border.
- `arrangement` (one of `sidebar_left`, `sidebar_right`, `stacked`, `hero`): Where the portal's sidebar card sits against the main card. The sidebar on the left is the arrangement every portal had; on the right the two columns swap; stacked puts the sidebar card above the main card, centred and narrow; the hero does the same with the banner at full width and taller, so the page opens on the image.
- `content_width` (one of `narrow`, `regular`, `wide`): How wide the portal's column is on a large screen. Regular is the width every portal had; narrow suits a page with little beside the plans, wide a page with several plan columns. The classes that draw each width live in the page template, where the bundle reads them.
- `sticky_sidebar` (boolean): Whether the sidebar card stays in view while the plans scroll.
- `plan_grid` (one of `list`, `two`, `three`): How many columns the plan cards fill on a wide screen. The list is the one column every portal had; two and three columns fold back to one on a phone, as the cards were drawn for that width from the start.
- `plan_density` (one of `compact`, `roomy`): How much room a plan card takes. Roomy is the padding every portal had; compact tightens the card and the space between cards, for a portal with many plans or several columns.
- `plans_heading` (boolean): Whether the heading over the plans is shown.
- `metrics_subscribers` (boolean): Whether the member count is shown on the card.
- `metrics_followers` (boolean): Whether the follower count is shown on the card.
- `metrics_threshold` (integer): The count a figure must reach before it is shown, 0 to 1,000,000, so a young project never shows a small number.
- `plans_title` (string): The heading over the plans, up to 60 characters; `null` for the built-in wording.
- `plans_subtitle` (string): The line under that heading, up to 120 characters; `null` for the built-in wording.
- `label_login` (string): The Login button's label, up to 24 characters; `null` for the built-in wording.
- `label_share` (string): The Share button's label, up to 24 characters; `null` for the built-in wording.
- `label_subscribe` (string): The button on every plan card, up to 24 characters; `null` for the built-in wording.
- `checkout_title` (string): The checkout's heading, up to 60 characters; `null` for the built-in wording.
- `checkout_subtitle` (string): The line under the checkout's heading, up to 120 characters; `null` for the built-in wording.
- `checkout_note` (string): A note under the checkout, up to 240 characters; `null` for none.
- `success_title` (string): The heading of the thank-you screen, up to 60 characters; `null` for the built-in wording.
- `success_message` (string): The thank-you screen's message, up to 400 characters; `null` for the built-in wording.
- `perks_title` (string): The heading over the perks, up to 60 characters; `null` for the built-in one.
- `perks` (array of string): Up to 12 perks, each a line of up to 120 characters; the block shows only with at least one.
- `faq_title` (string): The heading over the questions, up to 60 characters; `null` for the built-in one.
- `faq` (array of string): Up to 12 questions, each `{question, answer}`, the question up to 160 characters and the answer up to 800, both required.
- `about_name` (string): The name on the card about the creator, up to 60 characters, or `null`; the card shows when a name or a bio is set.
- `about_bio` (string): The bio on the card about the creator, up to 600 characters, or `null`.
- `custom_button_label` (string): The second button's label, up to 24 characters, sent together with `custom_button_url` or both `null`.
- `custom_button_url` (string): Where the second button leads, an https or http address up to 255 characters, sent together with `custom_button_label` or both `null`.
- `footer_refund_url` (string): The refund policy link in the footer, an https or http address, or `null`.
- `footer_contact_url` (string): The contact link in the footer, an https, http or `mailto:` address, or `null`.
- `footer_imprint_url` (string): The imprint link in the footer, an https or http address, or `null`.
- `footer_line` (string): A line of small print in the footer, up to 120 characters, or `null`.
- `footer_help` (boolean): Whether the Help link is shown in the footer.
- `announcement_text` (string): The strip across the top of the page, up to 160 characters, or `null` for no strip.
- `announcement_url` (string): Where the strip leads, an https or http address, or `null`.
- `announcement_starts_at` (string): When the strip starts showing, ISO 8601 in any zone and stored in UTC, or `null` for at once.
- `announcement_ends_at` (string): When the strip comes down, ISO 8601 and after the start, or `null` for never.
- `video_url` (string): A YouTube or Vimeo address in any shape the share button gives, stored as the canonical watch address, or `null` for no video.
- `gallery_title` (string): The heading over the gallery, up to 60 characters; `null` for the built-in one.
- `gallery` (array of string): Up to 8 picture addresses, each stored through `POST /v1/projects/{project}/portal-design/images/gallery`.
- `testimonials_title` (string): The heading over the quotes, up to 60 characters; `null` for the built-in one.
- `testimonials` (array of string): Up to 12 quotes from members, each `{quote, name, subtitle, avatar_url}`: the words up to 300 characters and the name up to 60, both required; `subtitle` what they are, up to 60 characters, or `null`; `avatar_url` a photo stored through `POST /v1/projects/{project}/portal-design/images/avatar`, or `null` for the first letter of the name.
- `sidebar_items` (array of string): The sidebar card's parts in order, each `{key, shown}` with `key` one of `tagline`, `metrics`, `buttons`, `description`, `social_links`, `footer`, every key exactly once; a part left out is appended, shown.
- `content_blocks` (array of string): The blocks under the plans in order, each `{key, shown}` with `key` one of `perks`, `about`, `faq`, `video`, `gallery`, `testimonials`, every key exactly once; a block left out is appended, shown.
- `locale_switcher` (boolean): Whether the list of languages under the card is shown.
- `featured_plan_id` (string): The plan that carries the Most popular badge, one of the project's own plan ids, or `null` for none.
- `coupon_box` (one of `always`, `link`): When the checkout offers the coupon box. A box on every checkout invites a buyer to go looking for a code; a box that opens only once a coupon arrived with the visit keeps the price plain for everyone else.
- `share_button` (boolean): Whether the Share button is shown in the header.
- `share_networks` (array of string): Which networks the share sheet offers, kept in the sheet's own order: {share_networks}.
- `login_button` (boolean): Whether the Login button is shown in the header.
- `social_proof` (boolean): Whether a line over the plans says how many members joined in the last seven days; it shows only from three up.
- `seats_badges` (boolean): Whether a pass series card shows how many seats are left.
- `seo_indexable` (boolean): Whether search engines may list the portal; `false` adds a noindex directive. A portal the project's own readiness keeps out stays unlisted either way.
- `seo_social_card` (boolean): Whether a shared link unfurls with a card image; `false` leaves the title and the description alone.
- `pixel_meta` (string): The creator's own Meta Pixel id, 10 to 20 digits, or `null`.
- `pixel_ga4` (string): The creator's own Google Analytics 4 measurement id, `G-` followed by 4 to 15 letters or digits, or `null`.
- `pixel_tiktok` (string): The creator's own TikTok Pixel id, 10 to 30 letters or digits, or `null`.
- `pixel_google_ads` (string): The creator's own Google Ads conversion id, `AW-` followed by 6 to 12 digits, or `null`.
- `custom_css` (string): A stylesheet of up to 16,384 characters printed after the theme so its rules win; refused when it would load, run or escape (`@import`, `url(`, `expression(`, `javascript:`, a closing `style` tag and the like); `null` for none.
- `seo_title_suffix` (string): The words after the project's name in the page title, up to 60 characters, or `null` for the built-in ones.
- `seo_description` (string): The description search engines and shared links show, up to 160 characters, or `null` for one cut from the project's text.
- `social_card_url` (string): A card image of the creator's own, stored through `POST /v1/projects/{project}/portal-design/images/card` and sent in the generated card's place, or `null` for the generated card.
- `default_locale` (any or null): The language the portal's own address opens in, as a code from `locales`, or `null` for the platform's default.
- `locales` (array of string): The languages the switcher offers, as codes from `en`, `fr`, `es`, `it`, `hi`, `bn`, `de`, `pt`, `tr`, `si`, never empty and always carrying `default_locale`.


### POST `/v1/projects/{project}/portal-design/discard`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/discard \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d"
```

Throws the draft away and keeps what members see; a picture only the draft named is removed with it. Answers the design, the published document alone.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/portal-design/images/{slot}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/images/gallery \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e" \
  -F "image=@lounge.jpg"
```

Stores a picture for the design, cut from the centre to the slot's size: `gallery` to 1200 by 800, `avatar` to 160 by 160, `card` to 1200 by 630. The answer carries the address to write into the design with `PUT`; a picture nothing names any longer is removed on the next save, publish or discard. The banner and the project photo are not slots here; they live on the project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `slot` (path, string, required): The slot the picture is for: `gallery`, `avatar` or `card`; it sets the size.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/portal-design/publish`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/portal-design/publish \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: 9e2b4c6d-1a3f-4e5b-8c7d-0f1a2b3c4d5e"
```

Makes the draft the design members see; the portal, the plan embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. Answers the design with no draft left.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `recovery`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/recovery/members/export` | `project-recovery:view-any` | Export a project's member list |  |
| GET | `/v1/projects/{project}/recovery/settings` | `project-recovery:view` | Get a project's recovery settings | `get_recovery_settings` |
| PATCH | `/v1/projects/{project}/recovery/settings` | `project-recovery:update` | Update a project's recovery settings | `update_recovery_settings` |
| DELETE | `/v1/projects/{project}/recovery/standby-installation` | `project-recovery:delete` | Remove a project's standby installation | `remove_standby_installation` |
| DELETE | `/v1/projects/{project}/resources/{resource}/replacement/request` | `project-recovery:delete` | Withdraw a replacement request | `withdraw_resource_replacement_request` |
| POST | `/v1/projects/{project}/resources/{resource}/replacement/request` | `project-recovery:create` | Request a replacement for a resource | `request_resource_replacement` |
| DELETE | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:delete` | Remove a resource's standby | `remove_resource_standby` |
| GET | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:view` | Get a resource's standby | `get_resource_standby` |
| PATCH | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:update` | Switch a standby's live mirror | `set_resource_standby_mirror` |
| DELETE | `/v1/projects/{project}/resources/{resource}/standby/request` | `project-recovery:delete` | Withdraw a standby request | `withdraw_resource_standby_request` |
| POST | `/v1/projects/{project}/resources/{resource}/standby/request` | `project-recovery:create` | Request a standby for a resource | `request_resource_standby` |
| POST | `/v1/projects/{project}/resources/{resource}/standby/use` | `project-recovery:create` | Use a resource's standby now | `use_resource_standby` |
| GET | `/v1/recovery/allowances` | `project-recovery:view-any` | Get the recovery allowances | `get_recovery_allowances` |
| GET | `/v1/recovery/incidents` | `project-recovery:view-any` | List incidents | `list_recovery_incidents` |
| GET | `/v1/recovery/incidents/{incident}` | `project-recovery:view` | Get an incident | `get_recovery_incident` |
| GET | `/v1/recovery/operations` | `project-recovery:view-any` | List recovery operations | `list_recovery_operations` |
| GET | `/v1/recovery/operations/{operation}` | `project-recovery:view` | Get a recovery operation | `get_recovery_operation` |
| POST | `/v1/recovery/operations/{operation}/notify-members` | `project-recovery:update` | Tell members about a bot replacement | `notify_members_of_recovery` |
| POST | `/v1/recovery/operations/{operation}/nudge` | `project-recovery:update` | Remind a recovery's stragglers | `nudge_pending_readmissions` |
| POST | `/v1/recovery/operations/{operation}/revert` | `project-recovery:update` | Undo a recovery | `revert_recovery_operation` |
| GET | `/v1/recovery/operations/{operation}/roll-call` | `project-recovery:view` | Get a recovery's roll call | `get_recovery_roll_call` |
| GET | `/v1/recovery/readiness` | `project-recovery:view-any` | Get the readiness checklist | `get_recovery_readiness` |

### GET `/v1/projects/{project}/recovery/members/export`

```bash
curl -L https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/members/export \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" -o members.csv
```

The member list a creator keeps before replacing a bot, as a CSV download (`text/csv`, one member per row: name, email, connector id, active plans, when access ends, resources, whether the bot can still reach them). REST only; there is no MCP tool for a file.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### GET `/v1/projects/{project}/recovery/settings`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

- `auto_failover_enabled` says whether the platform may swap a banned channel for its standby on its own; `auto_failover_email_consented_at` when the creator accepted the per-email fee a failover may charge for the members the bot cannot reach.
- `email_delivery` says how members are told after a channel swap the creator ran: `self` (the creator tells them) or `platform` (Subscriby emails them at the fee).
- `standby_installation_registered` says whether a spare bot is kept; its credentials never appear.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}/recovery/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"auto_failover": true, "accepts_email_fee": true, "email_delivery": "platform"}'
```

Every field is optional and omitted ones keep their value. Switching `auto_failover` on needs `accepts_email_fee: true` in the same call and the Growth Plan. Answers `200` with the settings as they now stand.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `auto_failover` (boolean): Whether the platform may swap a banned channel for its standby on its own. Switching it on needs `accepts_email_fee: true` in the same call and the Growth Plan.
- `accepts_email_fee` (boolean): Consent to the per-email fee a failover may charge for the members the bot cannot reach; consent is not implied by the switch.
- `email_delivery` (one of `platform`, `self`): How a project reaches the members its bot cannot message after a swap. A replaced channel re-admits every live member through the project bot, but a member who never started the bot, or whose bot was banned in the same incident, cannot be reached that way. The creator decides once per project whether the platform emails those members on their behalf, at a per-email fee added to the transaction fees, or whether they download the list and write themselves. The default is the free one, so nobody is charged for a choice they did not make.


### DELETE `/v1/projects/{project}/recovery/standby-installation`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/standby-installation \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Stops keeping the spare bot registered for the project and withdraws it from the connector; the live installation, members and access stay as they are. Answers `204`. Registering one is not offered to tokens, because it takes a credential; the dashboard's Prevention page does that. Raises `recovery.standby_removed` with `standby: installation`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/resources/{resource}/replacement/request`

Takes the open replacement request back. Answers `204`, also when nothing was open.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/replacement/request`

Asks the creator, on the connector, to pick the chat that replaces the resource's: the same conversation a standby request starts, ending in a swap instead of a spare. For a degraded resource the swap will spend the channel recovery allowance or join the recovery already absorbing swaps; for a healthy one it is on demand and free. Answers `202` once the request is sent.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/resources/{resource}/standby`

Stops keeping the standby; the chat itself is untouched. Answers `204` and raises `recovery.standby_removed`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/resources/{resource}/standby`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The standby's own identifier on the platform is deliberately absent, as every connector identifier is on the API.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/resources/{resource}/standby`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"mirror": true}'
```

Switches the live mirror on or off: when on, every post made in the channel is copied into the standby as it is made. Only a channel can be mirrored, and switching on needs the Growth Plan. Answers `200` with the standby.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `mirror` (boolean, required): Whether every post made in the channel is copied into the standby as it is made. Only a channel can be mirrored, and switching on needs the Growth Plan.


### DELETE `/v1/projects/{project}/resources/{resource}/standby/request`

Takes the open standby request back. A creator holds one request of each kind at a time, whichever resource it was for, so the resource in the path only keys the route. Answers `204`, also when nothing was open.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/standby/request`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby/request \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Asks the creator, on the connector, to pick the chat that becomes the resource's standby (Growth Plan). Answers `202` once the request is sent; the standby appears, announced by `recovery.standby_registered`, the moment they choose.

Linking a standby or a replacement is a conversation with the creator on the connector: the bot messages them with a picker, and the link or the swap happens the moment they choose. The API cannot name the chat directly, because that would take a platform identifier, so it starts the conversation and takes it back. A creator holds one request of each kind at a time, whichever resource it was for.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/standby/use`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby/use \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Swaps the resource onto its standby right now: the resource points at the standby chat, the old invite links are revoked, every active member is re-admitted, and the standby is consumed. Answers `200` with the recovery operation the swap ran under (`on_demand: true` when the resource was healthy with no open incident, spending no allowance). Undo is offered for 24 hours through the revert endpoint. Raises `recovery.resource_replaced` and `recovery.standby_removed` with `reason: used`, beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/recovery/allowances`

```bash
curl https://api.subscriby.net/v1/recovery/allowances \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One row per kind, plus the window they are counted in.

- `self_service_remaining` is what the rolling window still allows on its own; `grant_remaining` is what support has released on top and not yet spent. `remaining` is their sum and `allowed` whether a recovery of that kind would start right now.
- `uses_grant` is true when the next recovery would spend a support grant rather than the self-service allowance.
- `next_self_service_at` is when the self-service allowance returns, `null` while it is available. `last_used_at` is when the kind was last recovered inside the window.

See [Allowances and support review](https://docs.subscriby.net/disaster-recovery/allowances-and-support-review) for the rule and what support audits before releasing a grant.


### GET `/v1/recovery/incidents`

```bash
curl "https://api.subscriby.net/v1/recovery/incidents?status=open" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

An incident is one problem a probe detected and has not yet seen fixed: the creator's sign-in account unreachable (`kind: account`), a project's bot refused by the platform (`bot`), or a channel or group the project sells gone or no longer administered (`resources`). It resolves itself when a later probe finds the thing healthy, or is resolved by the recovery that replaced it, which `resolved_by_operation_id` then names.

`status` is `open` (the default: what still needs attention), `resolved`, or `all`. Paginated like every list, newest first by `detected_at`; `sort_by` also accepts `kind`, `status` and `resolved_at`.

**Parameters**

- `status` (query, string): The tab: `open` (the default, what still needs attention), `resolved`, or `all`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `detected_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### GET `/v1/recovery/incidents/{incident}`

```bash
curl https://api.subscriby.net/v1/recovery/incidents/$INCIDENT_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One incident.

- `reason` is the connector's own code for what it saw; `reason_label` and `reason_explanation` are that code in the connector's words, the same sentence the alert email carried. Both are `null` when the probe recorded no reason, which is the case for account incidents.
- `resource_id` and `resource_title` are set on `resources` incidents only; `project_id` is `null` on an account incident.

**Parameters**

- `incident` (path, string, required): The incident, resolved within the ledger by the route binder.


### GET `/v1/recovery/operations`

```bash
curl "https://api.subscriby.net/v1/recovery/operations?kind=resources&status=completed" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

An operation is one recovery: run by the creator, by the platform on their behalf (`automatic: true`, the failover you sleep through), or on demand (`on_demand: true`, a Swap & Grant of a healthy resource, which spends no allowance). The row exists from the moment the recovery starts, because it is the quota ledger and the audit trail at once.

Both filters are optional: `kind` is `account`, `bot` or `resources`; `status` is `started`, `completed`, `failed` or `reverted`. Newest first by `started_at`; `sort_by` also accepts `kind`, `status` and `completed_at`.

**Parameters**

- `kind` (query, string): Narrow to one kind: `account`, `bot` or `resources`. An unknown value is refused.
- `status` (query, string): Narrow to one status: `started`, `completed`, `failed` or `reverted`. An unknown value is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `started_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### GET `/v1/recovery/operations/{operation}`

```bash
curl https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One operation, with its undo state.

- `status` is `started` while the recovery runs, then `completed`, `failed` (with `failure_reason`) or `reverted`.
- `revertible` says whether the creator may still undo it **right now**: it is completed, of a kind that can be undone (an account relink or a channel swap, never a bot replacement), and inside the undo window that `revert_window_ends_at` closes. A client should show the undo exactly when this is `true`.
- `grant_id` names the support grant that paid for the recovery when the self-service allowance was already spent; `null` otherwise.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.


### POST `/v1/recovery/operations/{operation}/notify-members`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/notify-members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

After a **bot replacement**, emails every member the project can reach by email that its bot changed, with the new bot's link and the portal, at the per-email fee added to the creator's transaction fees. Sent once per recovery: a second call answers with the count already sent and sends nothing. Answers `200` with the count.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/recovery/operations/{operation}/nudge`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/nudge \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Sends one reminder, with a fresh link, to every member a channel recovery re-admitted who has not joined the new chat yet, and records the nudge on the operation. Read the roll call first: `can_nudge` says whether anyone is still outside and the cooldown has passed. Answers `200` with the count queued.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/recovery/operations/{operation}/revert`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/revert \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"}'
```

Inside the undo window (`revert_window_ends_at` on the operation) a completed recovery can be undone. A **channel recovery** is undone one swap at a time: `resource_id` names the resource to put back on its old chat, and every active member is re-admitted there again; the operation reads `reverted` once its last standing swap is undone. An **account relink** is undone whole and takes no `resource_id`: sign-in moves back to the previous account, every browser session is signed out, and a `relink_disputed` incident opens for support. A **bot replacement** cannot be undone.

Answers `200` with the operation, its `revertible` now `false`. Raises `recovery.operation_reverted`; a channel undo also moves the resource's place (`project.resource.updated` with `changes.space_id`) and an account undo opens the dispute incident (`recovery.incident_opened`).

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `resource_id` (string): For a channel recovery, the resource to put back on its old chat; every active member is re-admitted there again. Omit it for an account relink.


### GET `/v1/recovery/operations/{operation}/roll-call`

```bash
curl https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/roll-call \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Where the re-admission after a channel recovery stands, read live.

- `total` is how many members the swap set out to re-admit; `regranted` how many hold a fresh link into the new chat; `failed` how many could not be given one.
- `unreachable` is how many the bot could not message, and `emailed` how many of those were told by email instead (at the per-email fee, when the project opted in).
- `joined` is stamped the moment the platform approves a member's join request, so `pending` (`regranted − joined`) is who is still outside.
- `settled` means the queue has handled everyone, so the counters will not move on their own. `can_nudge` is true when somebody is still outside and the reminder cooldown has passed; `cooling_down` and `nudge_available_at` explain a `false`.

A recovery of a kind that re-admits nobody (an account relink, a bot replacement) answers the same shape with every counter at zero rather than an error.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.


### GET `/v1/recovery/readiness`

```bash
curl https://api.subscriby.net/v1/recovery/readiness \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The whole checklist the **Readiness** page shows, with its totals.

- `done` is three-valued: `true` or `false` when the platform can verify the line, `null` when it can only remind (`reminder: true`). Reminders never count toward `total`.
- `locked` says the plan lacks the prevention feature the line needs, so a client shows the upgrade rather than the fix; `prevention` at the top says whether the plan bundles those features at all.
- `url` is where the line is fixed, or `null` for a reminder. `detail` is the state in words, such as "2 of 3 projects".
- `connector` names the connector a line belongs to (`connector_name` is its display name); both are `null` for the account's own lines.

The lines are the ones the dashboard lists, in the same order. The account's come first: `second_factor` and `backup_identity`. Then each installed connector's own lines, worded by that connector and keyed within it; Telegram's are `standby_installation`, `standby_spaces`, `auto_failover` and `live_mirror`, one line per key however many projects run it (the detail counts the projects when they differ). Last the two reminders, `off_platform_copy` and `second_admin`. A creator with no connector installed gets the account lines and the reminders alone. Every change to a verifiable line's state raises `recovery.readiness_changed`.


## `referral-affiliates`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-affiliates` | `project-referral:view-any` | List affiliates | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| POST | `/v1/projects/{project}/referral-affiliates` | `project-referral:create` | Enrol a member by hand | `add_referral_affiliate` |
| GET | `/v1/projects/{project}/referral-affiliates/{affiliate}` | `project-referral:view` | Get an affiliate | `get_referral`, `get_referral_affiliate`, `get_referral_program` |
| POST | `/v1/projects/{project}/referral-affiliates/{affiliate}/approve` | `project-referral:update` | Approve an affiliate | `approve_referral_affiliate` |
| POST | `/v1/projects/{project}/referral-affiliates/{affiliate}/suspend` | `project-referral:update` | Suspend an affiliate | `suspend_referral_affiliate` |

### GET `/v1/projects/{project}/referral-affiliates`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-affiliates?status=approved&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Pages the programme's affiliates, newest first. `status` is `pending`, `approved` or `suspended`; `member_id` finds the affiliate row of one member. A list row never carries `balances`: read one affiliate for what they are owed.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Keep only affiliates in this standing: `pending` (awaiting the creator's approval), `approved` (their code counts) or `suspended` (their code no longer counts; what they earned stays).
- `member_id` (query, string): Find one member's affiliate row by their member id, as the members endpoints list them.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/referral-affiliates`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-affiliates \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "member_id": "a1b2c3d4-e5f6-4718-8a9b-0c1d2e3f4a5b" }'
```

Enrols a member as an affiliate, approved whatever the programme's switches say, and hands them their code, their links and the programme's terms in their chat and by mail. Emits `referral.affiliate_joined`. Answers `201` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `member_id` (string, required): The id of a member of this project, as the members endpoints list them.


### GET `/v1/projects/{project}/referral-affiliates/{affiliate}`

One affiliate with their `balances` per currency. An affiliate's own payout details, the wallet address or PayPal email they typed, are never returned by any endpoint: they are the affiliate's money, read only by the dashboard when the creator pays.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.


### POST `/v1/projects/{project}/referral-affiliates/{affiliate}/approve`

Approves a pending or suspended affiliate: their code counts from now on, and they receive their link, code and the programme's terms in their chat and by mail. Emits `referral.affiliate_approved`. An affiliate already approved is left as they are and nothing is emitted. Answers `200` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/referral-affiliates/{affiliate}/suspend`

Their code stops counting new friends and nothing new is earned; what they already earned stays and can still be paid. Emits `referral.affiliate_suspended`. Answers `200` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `referral-payouts`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-payouts` | `project-referral:view-any` | List payouts | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| POST | `/v1/projects/{project}/referral-payouts` | `project-referral:update` | Record a payout | `record_referral_payout` |

### GET `/v1/projects/{project}/referral-payouts`

Pages the payouts the creator recorded, newest first; `affiliate_id` narrows to one affiliate. `rewards_paid` is how many commissions each payout covered.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate_id` (query, string): Keep only the payouts recorded against one affiliate.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/referral-payouts`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-payouts \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_id": "0b1c2d3e-4f50-4617-8a9b-0c1d2e3f4a5b",
    "amount": 30,
    "currency_id": "f0e1d2c3-b4a5-4697-8877-665544332211",
    "reference": "PAYPAL-7F3D1C92"
  }'
```

Records money that already left: you paid the affiliate outside Subscriby and file it here, so the ledger marks their oldest payable commissions in that currency as paid, first in first out, until the amount is covered. Emits `referral.payout_recorded`. Answers `201` with the payout.

> **The amount is capped at the payable balance.** Read the affiliate's `balances` first; `payable` in the currency is the most a payout may record. Pending commissions are still inside the hold and cannot be paid yet.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `affiliate_id` (string, required): The affiliate who was paid, as the referral-affiliates endpoints list them.
- `amount` (number, required): What was paid, greater than 0, at most the affiliate's payable balance in that currency.
- `currency_id` (string, required): The currency the commissions were earned in; a balance exists per currency.
- `reference` (string): Your own reference, such as a transfer id; at most 120 characters.
- `note` (string): A note for your records; at most 1,000 characters.


## `referral-program`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| DELETE | `/v1/projects/{project}/referral-program` | `project-referral:delete` | Delete the programme | `delete_referral_program` |
| GET | `/v1/projects/{project}/referral-program` | `project-referral:view` | Get the programme | `get_referral`, `get_referral_affiliate`, `get_referral_program` |
| PUT | `/v1/projects/{project}/referral-program` | `project-referral:update` | Set up or change the programme | `update_referral_program` |
| POST | `/v1/projects/{project}/referral-program/activate` | `project-referral:update` | Switch the programme on | `activate_referral_program` |
| POST | `/v1/projects/{project}/referral-program/deactivate` | `project-referral:update` | Switch the programme off | `deactivate_referral_program` |

### DELETE `/v1/projects/{project}/referral-program`

Removes the programme. Answers `204` with no body.

> **A delete can be refused.** While any affiliate is owed a commission, the delete answers `422` and asks you to record their payouts or switch the programme off instead. Deleting emits no event.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/referral-program`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program \
  -H "Authorization: Bearer sbt_..."
```

The programme as it stands, with its commission currency's ISO code loaded. `404 RESOURCE_NOT_FOUND` while the project has none.

### Three fields that are easy to misread

> **`plan_ids: []` means every plan, not no plans.** A conversion counts on every plan in the project, including plans added later. Treating it as "restricted to nothing" inverts the meaning.

**`commission_period_months`** is `0` for the friend's first payment only, a number of months, or `null` for life. A `fixed` commission is always the first payment only and always reports `0`.

**`commission_value` is a decimal string with four places**: `"20.0000"` for 20% of each payment, `"10.0000"` for ten of the commission currency. Parse it as a decimal, never a float. `commission_currency_id` is `null` on a percentage, which is earned in each payment's own currency.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/referral-program`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "reward_kind": "cash",
    "commission_type": "percentage",
    "commission_value": 20,
    "commission_period_months": 6,
    "hold_days": 14,
    "friend_reward_kind": "free_days",
    "friend_reward_days": 3,
    "payout_details_label": "PayPal email",
    "terms": "One referral per household."
  }'
```

The first PUT creates the programme and answers `201`; every later PUT changes only the fields it carries and answers `200`. Omitting a field keeps its stored value; a first save without `reward_kind` is a free-days programme, and without `friend_reward_kind` gives friends nothing.

> **Changing the terms is not retroactive, and the affiliates are told.** Rewards already in the ledger keep their figures. Every approved or pending affiliate receives the new terms in their chat and by mail when a field they were promised moves: the reward, the commission, the hold, the friend's reward or your own terms text. Who may join, the payout label and the minimum payout are your side and send nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `active` (boolean): The on/off switch. Prefer the activate and deactivate endpoints, which fire the same event with only that change.
- `customers_only` (boolean): Whether only members with a live membership may join. Defaults to false.
- `approval_required` (boolean): Whether you approve each affiliate before their code counts. Defaults to false.
- `reward_kind` (one of `free_days`, `cash`): What a referrer earns per referral: membership time, or money the creator pays out. Two kinds and no third, because every other shape a creator asked for (a coupon for the referrer, store credit) is one of these in disguise and each adds a surface the Payouts tab would have to explain.
- `reward_days` (integer): Days a referrer earns per converted friend, 1 to 3650; required when `reward_kind` is `free_days`.
- `commission_type` (any or null): `percentage` of every settled payment or a `fixed` amount on the first; required when `reward_kind` is `cash`.
- `commission_value` (number): The rate: 0.0001 to 100 for a percentage, any amount above zero for a fixed commission. Stored as a decimal string with four places.
- `commission_currency_id` (string): The currency a `fixed` commission is paid in; required then, cleared for a percentage.
- `commission_period_months` (integer): How long a percentage commission runs after conversion: `0` for the friend's first payment only, 1 to 36 months, or null for life. A fixed commission is always the first payment only.
- `hold_days` (integer): Days a cash commission waits before it is payable, so a refund inside the window can take it back: 0 to 90. Defaults to 14.
- `minimum_payout` (number): A guide for you, the balance an affiliate reaches before you pay; nothing is enforced. Null for none.
- `friend_reward_kind` (one of `none`, `free_days`, `coupon`): What the referred friend receives for arriving through a referral, if anything. Days are banked on the friend's first purchase the moment it settles; a coupon is applied at their checkout and follows the coupon's own rules, which is why it is offered only to creators who hold the Coupons capability.
- `friend_reward_days` (integer): Days banked on the friend's first purchase, 1 to 3650; required when `friend_reward_kind` is `free_days`.
- `friend_coupon_id` (string): One of this project's coupon codes, applied at the friend's checkout; required when `friend_reward_kind` is `coupon`. Needs coupon codes on the project owner's plan.
- `payout_details_label` (string): The question affiliates answer so you can pay them, such as `PayPal email`; at most 120 characters. Null for none.
- `terms` (string): Your own terms, shown to affiliates and referred friends; at most 5,000 characters. Null for none.
- `plan_ids` (array of string): Restrict conversions to these plans of the project, at most 200. Omit to leave the restriction alone; send `[]` for every plan, including plans added later.


### POST `/v1/projects/{project}/referral-program/activate`

Links and codes attribute again and settled payments earn again. Emits `referral.program_updated` with `active` as the one change, and every affiliate is told the terms as they now stand. Answers `200` with the programme.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/referral-program/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program/deactivate \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The safe way to stop: links stop attributing and payments stop earning at once, while the ledger and the payouts stay readable and every affiliate is told their link no longer counts new friends. Emits `referral.program_updated`. Answers `200` with the programme.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `referral-rewards`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-rewards` | `project-referral:view-any` | List rewards | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |

### GET `/v1/projects/{project}/referral-rewards`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-rewards?affiliate_id=0b1c2d3e-4f50-4617-8a9b-0c1d2e3f4a5b&status=approved" \
  -H "Authorization: Bearer sbt_..."
```

Pages the ledger, newest first: one row per settled payment per side of a referral. `affiliate_id`, `status` (`pending`, `approved`, `paid`, `applied`, `reversed`) and `beneficiary` (`referrer`, `friend`) narrow it. A reversal is a row of its own with a negative `amount` and `reverses_reward_id` naming the reward it cancels. The ledger is read-only: rewards are written when a payment settles, made payable by the hold, paid by a recorded payout and reversed by a refund.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate_id` (query, string): Keep only the rewards one affiliate's referrals earned.
- `status` (query, string): Keep only rewards in this state: `pending` (inside the hold, or days waiting on the balance), `approved` (payable), `paid` (recorded in a payout), `applied` (days banked on a membership) or `reversed` (taken back by a refund).
- `beneficiary` (query, string): Keep only the rewards of one side: `referrer` or `friend`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


## `referrals`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referrals` | `project-referral:view-any` | List referrals | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| GET | `/v1/projects/{project}/referrals/{referral}` | `project-referral:view` | Get a referral | `get_referral`, `get_referral_affiliate`, `get_referral_program` |

### GET `/v1/projects/{project}/referrals`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referrals?status=converted&since=2026-10-01" \
  -H "Authorization: Bearer sbt_..."
```

Pages the friends affiliates brought in, newest first. `status` is `touched`, `converted`, `expired` or `rejected`; `affiliate_id` narrows to one affiliate; `since` keeps the referrals whose friend arrived on or after that instant, so a report can page only what happened after its last run.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Keep only referrals in this state: `touched` (the friend arrived, not yet paid), `converted` (their first payment settled), `expired` (the attribution window passed) or `rejected`.
- `affiliate_id` (query, string): Keep only the referrals one affiliate brought in.
- `since` (query, string): Keep only referrals whose friend arrived on or after this instant, ISO 8601, so a report can page what happened since its last run.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/referrals/{referral}`

One referral: how the friend arrived (`source` is `portal_link`, `connector_link` or `code_at_checkout`; `connector` names the bot's platform on a connector link), whether their first payment settled, and `commission_ends_at`, the instant the affiliate stops earning on them on a programme with a period.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `referral` (path, string, required): The referral, resolved within the project by the route binder.


## `resources`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/resources` | `project-resource:view-any` | List a project's resources | `list_resources` |
| POST | `/v1/projects/{project}/resources` | `project-resource:create` | Create a manual perk | `create_resource` |
| POST | `/v1/projects/{project}/resources/from-space` | `project-resource:create` | Sell a place picked from the connector's list | `create_resource_from_space` |
| POST | `/v1/projects/{project}/resources/link-requests` | `project-resource:create` | Request a place link | `request_resource_link` |
| DELETE | `/v1/projects/{project}/resources/{resource}` | `project-resource:delete` | Delete a resource | `delete_resource` |
| GET | `/v1/projects/{project}/resources/{resource}` | `project-resource:view` | Get a resource | `get_resource` |
| PATCH | `/v1/projects/{project}/resources/{resource}` | `project-resource:update` | Update a resource | `update_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/activate` | `project-resource:update` | Activate a resource | `activate_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/deactivate` | `project-resource:update` | Deactivate a resource | `deactivate_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/unlink` | `project-resource:update` | Unlink a resource's place | `unlink_resource` |

### GET `/v1/projects/{project}/resources`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/resources?kind=telegram:channel" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Newest first, paged with `page` and `per_page`, sortable with `sort_by` (`created_at`, `kind`, `title`, `active`) and `sort_direction`. `kind` narrows to one kind, `connector` to every resource one connector gates.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `kind` (query, string or null): One kind of resource, spelled as the objects spell it: `manual`, or a connector's `connector:kind` as the connector directory lists each connector's `resource_kinds`. Any other shape is refused rather than answered with an empty page.
- `connector` (query, string or null): Every resource one connector gates, by the connector's key as the connector directory lists it.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/resources`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Onboarding PDF",
    "description": "https://example.com/onboarding.pdf"
  }'
```

Answers `201` with the new resource, `kind: "manual"`, and emits `project.resource.created`. The payload names no kind: a manual perk is the only resource this endpoint creates, and a place a connector gates is asked for with the link-request endpoint. A resource is what a plan unlocks, and nothing is sold before a connector can deliver it, so a project running no connected connector is refused, a manual perk included: install a connector on the project and connect it first.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string, required): The perk's name on plan cards, 5 to 255 characters.
- `description` (string): What the perk is, up to 1,000 characters. HTML is filtered to a safe subset before storage.
- `active` (boolean): Whether plans grant it right away. Defaults to true.


### POST `/v1/projects/{project}/resources/from-space`

A connector whose installation can list the places it administers lets a client pick one outright: the installation's spaces endpoint of the Connectors API lists them, and this endpoint sells one. The installation is asked again before the row persists, so a resource is never bound to a place the installation does not administer, which is the same proof the link request gets from the platform's own picker. The resource is created and bound to the place, and `project.resource.linked` fires as it does when a creator picks on the platform. A place the project already sells answers its existing resource with `200`.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/from-space \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "kind": "example:role", "external_id": "1183455190821797899", "title": "Gold members role", "description": "<p>The Gold role and everything it unlocks.</p>" }'
```

Answers `201 Created` with the resource. The dashboard's **Link Place** button on the resource editor and the `create_resource_from_space` tool run the same action; a connector that cannot list its places takes the link request above instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (string, required): The kind of place, spelled `connector:kind` as the connector directory lists each connector's `resource_kinds`, on a connector that lists its places.
- `external_id` (string, required): The platform's id for the place, as the installation's spaces endpoint lists it under `external_id`.
- `title` (string, required): The resource title members read, 5 to 255 characters.
- `description` (string): What members get, up to 1000 characters of well-formed HTML, shown as a perk beside the title.


### POST `/v1/projects/{project}/resources/link-requests`

A place cannot be created from the API: only the connector can prove it administers the place. This endpoint asks the creator, through the connector, to pick the place; the connector messages them with a picker and the resource appears the moment they choose, announced by `project.resource.linked`. Nothing is created by the call itself.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/link-requests \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "kind": "telegram:channel" }'
```

Answers `202 Accepted` once the creator has been asked. The dashboard's **Send Request** button on the resource editor and the `request_resource_link` tool run the same action.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (string, required): A connector's kind of place spelled `connector:kind`, as the connector directory lists each connector's `resource_kinds`. `manual` and a bare kind word are refused.


### DELETE `/v1/projects/{project}/resources/{resource}`

Deletes the row. Plans that linked it stop granting it. Returns `204 No Content` and emits `project.resource.deleted`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/resources/{resource}`

One resource with its place, when it has one.

| Field         | Type           | Notes                                                                                                                                                                                                                       |
| ------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | string         | `manual` for a perk the creator hands over by hand, otherwise `connector:kind` as the [connector directory](https://docs.subscriby.net/api/v1/reference/connectors) lists each connector's `resource_kinds` (`telegram:channel`, `telegram:group`, `telegram:supergroup`). |
| `connector`   | string or null | The connector key the place is on; `null` for a manual perk.                                                                                                                                                                |
| `space`       | object or null | The place the resource is bound to: its `id`, the platform's own `external_id` and its `title` as the connector last read it. `null` for a manual perk and for a place-kind resource that was unlinked.                     |
| `title`       | string         | The resource's name on plan cards; for a linked place, the place's title at link time.                                                                                                                                      |
| `description` | string or null | Up to 1,000 characters of well-formed HTML, shown as a perk beside the title.                                                                                                                                               |
| `active`      | boolean        | Whether plans grant it right now. An inactive resource keeps its link and its plans, but new members do not receive it.                                                                                                     |

A manual perk reads `{ "kind": "manual", "connector": null, "space": null, … }`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/resources/{resource}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Members lounge (VIP)" }'
```

Partial by design: only the fields present in the body change, so a title-only update leaves the description exactly as stored, filtered HTML included, and logs no description edit. `kind` and `space` are not writable here: a resource keeps its kind for life, and its place moves only through the connector.

Answers `200` with the resource. When at least one field actually changed, `project.resource.updated` fires once with a `changes` map of `{field: {from, to}}`; a body that restates the stored values writes nothing and emits nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The resource's name on plan cards, 5 to 255 characters.
- `description` (string): What the resource is, up to 1,000 characters, the same HTML filter as create; null clears it.
- `active` (boolean): Whether plans grant it; the activate and deactivate endpoints flip the same switch.


### POST `/v1/projects/{project}/resources/{resource}/activate`

The switch on the dashboard's resource row, on. A plan grants only its active resources, so the resource returns to what new members receive. Idempotent and answers `200` with the resource; only a flip emits `project.resource.updated`, with `changes.active`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/deactivate \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The switch on the dashboard's resource row, off. An inactive resource stays in the project and keeps its place, but a plan grants only its active resources, so it drops out of what new members receive until it is switched back on. Idempotent and answers `200` with the resource; only a flip emits `project.resource.updated`, with `changes.active`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/unlink`

Detaches the place from a resource, so `space` reads `null` and the row becomes a placeholder. The resource stays in the project's list and keeps its `kind`, but no longer grants access through the connector. Re-linking goes through the connector again. Answers `200` with the resource and emits `project.resource.unlinked`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `retention`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/retention` | `project-subscription:view` | Read the settings | `get_retention_settings` |
| PUT | `/v1/projects/{project}/retention` | `project-subscription:update` | Change the settings | `update_retention_settings` |
| GET | `/v1/projects/{project}/retention/activity` | `project-subscription:view-any` | List the activity ledger | `list_retention_activity` |
| GET | `/v1/projects/{project}/retention/cancellations` | `project-subscription:view-any` | List the cancellation screens | `list_cancellation_feedback` |
| GET | `/v1/projects/{project}/retention/checkouts` | `project-subscription:view-any` | List the checkouts | `list_checkouts` |
| GET | `/v1/projects/{project}/retention/stats` | `project-subscription:view-any` | Read the figures | `get_retention_stats` |

### GET `/v1/projects/{project}/retention`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention \
  -H "Authorization: Bearer sbt_..."
```

The grace window with the ladder it implies in words, the digest switch, the cancellation question, the three offers with the coupons they carry, and the two nurture windows: `checkout_stall_hours` (how long a checkout may stay open with no settled charge before the hourly sweep counts it as stalled and the stalled-checkout sequences start; 1 to 24, 1 by default) and `trial_notice_days` (how many days before a trial without a card ends its trial-ending sequences start; 1 to 14, 3 by default; a shorter trial enrols at its start). The row is created with the defaults on the first read, so a project never answers `404` here.

### Two fields that are easy to misread

**`offers_available` is the owner's plan, not a setting.** It is `true` on Growth and with the Revenue Recovery Addon. The three offer fields are stored whatever it says; the cancellation screen reads them only while it is `true`.

**`ladder` is derived from `grace_days`.** It is the sentence the dashboard and the bot show for the window, in the token holder's language; write `grace_days` and read `ladder` back.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/retention`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"grace_days": 10, "offer_pause_enabled": true, "offer_return_coupon_id": "3b7c9d1e-5f24-4a86-9c0b-2d4e6f8a1b3c"}'
```

Every field is optional and the row keeps its stored value for each one left out, so a client can flip the digest without restating the window. A coupon must be one of the project's own; send `null` to clear an offer. The two nurture windows are whole numbers within their bounds (`checkout_stall_hours` 1 to 24, `trial_notice_days` 1 to 14); a checkout already open is judged by the window in force when the hourly sweep runs. The answer is the settings as they now read.

> A grace window of `0` pauses access at the first failure. The never-paid trial keeps today's immediate revoke whatever the window says, and a one-time purchase never enters grace.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `grace_days` (integer): How many days a failed renewal keeps access while the gateway retries, 0 to 30. `0` pauses access at the failure.
- `digest_enabled` (boolean): Whether the owner gets one message a day with the failures, reminders, pauses and recoveries, only on a day something happened.
- `cancel_feedback_enabled` (boolean): Whether the cancellation screen asks the member why before the offer. Off skips straight to the offer.
- `offer_pause_enabled` (boolean): Whether a cancelling member on Stripe or PayPal is offered one billing cycle on hold. Needs the Growth Plan or the Revenue Recovery Addon; ignored by the screen without it.
- `offer_discount_coupon_id` (string): One of this project's coupons, applied to the member's renewals where Stripe can carry it, or `null` for no discount offer. Needs the Growth Plan or the Revenue Recovery Addon.
- `offer_return_coupon_id` (string): One of this project's coupons, handed to the member on the way out on every payment method, or `null` for no return coupon. Needs the Growth Plan or the Revenue Recovery Addon.
- `checkout_stall_hours` (integer): How many hours a checkout may stay open with no settled charge before the hourly sweep counts it as stalled and the stalled-checkout sequences start, 1 to 24; such as `4`.
- `trial_notice_days` (integer): How many days before a trial without a card ends its trial-ending sequences start, 1 to 14; such as `3`. A trial shorter than that enrols at its start.


### GET `/v1/projects/{project}/retention/activity`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/activity?kind=payment_recovered" \
  -H "Authorization: Bearer sbt_..."
```

The ledger behind every figure: one row per notice, offer, feedback and win-back message, with the member, the kind, the channel that carried it, when it went out, and, once a charge settled after it, `converted_at` and the payment that counted it. `kind` keeps one kind of row; `sort_by` takes `created_at`, `sent_at` or `kind`.

> A row converts when the next charge settles for that member, which is how the figures count a recovery and a member won back; a notice that converts is not a notice that worked on its own, only one that preceded the payment.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `kind` (query, string): Keep only one kind of row: `payment_failed_notice`, `grace_reminder`, `grace_final_warning`, `access_suspended`, `access_restored`, `payment_recovered`, `offer_shown`, `offer_taken`, `feedback` or `sequence_step`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/cancellations`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/cancellations?reason=too_expensive&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Every cancellation screen a member reached, newest first: the member, the plan, the reason they picked, their own words, the offer shown and whether they took it, where they answered, and the pause's dates where they took one. `reason` and `surface` narrow the page; `sort_by` takes `created_at`, `reason`, `surface` or `offer_taken`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reason` (query, string): Keep only the records whose member gave this reason: `too_expensive`, `not_using_enough`, `not_enough_content`, `content_not_expected`, `found_another_community`, `not_the_right_fit`, `taking_a_break`, `got_what_i_needed`, `technical_problems`, `signed_up_by_mistake` or `other`.
- `surface` (query, string): Keep only the records made on the `portal` or in a connector chat (`bot`).
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/checkouts`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/checkouts?stalled=true&recovered=false" \
  -H "Authorization: Bearer sbt_..."
```

Every checkout a member started, newest first: the member, the plan they were buying, the rail and where they started (`portal` or `bot`), the order reference the rail was given, when it started, when the hourly sweep counted it as stalled, when a charge finished it or another checkout superseded it, summed up as `outcome`: `open` while nothing has settled and the sweep has not counted it, `stalled` once the project's checkout window passed with no settled charge, `recovered` when a charge settled after that, `completed` when a charge settled before it could stall, and `superseded` when it closed with no charge of its own because the member paid through another checkout or already held a live membership when the sweep looked. One charge finishes one checkout and brings back one stalled checkout, so a member who tapped Pay three times and paid once has one `completed` and two `superseded`. `enrollment_id` names the stalled-checkout sequence passage the stall opened. `stalled` and `recovered` (booleans; `recovered` reads among the stalled rows, and a stalled row another checkout superseded answers neither), `plan_id` and `member_id` narrow the page; `sort_by` takes `started_at`, `stalled_at` or `completed_at`.

> An access code redemption or a free trial start is not a checkout and never appears here. A member is counted as stalled at most once a day however many checkouts they started; the older open ones are stamped stalled without a second `checkout.stalled` or a second passage.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `stalled` (query, string): Keep only the checkouts the hourly sweep counted as stalled (`true`), or only the ones it never did (`false`). Omit for both.
- `recovered` (query, string): Keep only the stalled checkouts a charge finished after all (`true`), or only the stalled ones still open (`false`). Omit for both.
- `plan_id` (query, string or null): Keep only the checkouts of one plan.
- `member_id` (query, string or null): Keep only one member's checkouts, by their member id as the members endpoints list them.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/stats`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/stats?period=30d" \
  -H "Authorization: Bearer sbt_..."
```

What the programme did over the window, as the dashboard card reads it: the failed renewals, the reminders sent, the pauses, the recoveries with what they brought back restated in US dollars, the restorations, the win-back steps sent and the members won back (the churn trigger alone), the cancellation screens with the offers shown and taken, and why members cancelled with each reason's share; then the nurture block: the leads who arrived, entered a lead sequence and bought while it ran, the checkouts started, stalled and recovered with what the recovered ones were worth in US dollars, and the trials without a card a sequence took and the ones whose member paid while it ran. The two "right now" figures, the members in grace and the members paused, ignore the window.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `period` (query, string): The window the figures cover: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `1y`, `mtd`, `qtd`, `ytd` or `all`. The two "right now" figures ignore it.


## `sequences`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/sequences` | `project-sequence:view-any` | List a project's sequences | `list_sequences` |
| POST | `/v1/projects/{project}/sequences` | `project-sequence:create` | Create a sequence | `create_sequence` |
| DELETE | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:delete` | Delete a sequence | `delete_sequence` |
| GET | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:view` | Get a sequence | `get_sequence` |
| PATCH | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:update` | Change a sequence | `update_sequence` |
| GET | `/v1/projects/{project}/sequences/{sequence}/enrollments` | `project-sequence:view-any` | List a sequence's enrolments | `list_sequence_enrollments` |

### GET `/v1/projects/{project}/sequences`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences?active=true&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's sequences, newest first, each with its steps in order and how it has done: every member ever enrolled, the members still receiving steps, the members who received every step, and the members a payment brought back while they were enrolled. `active` keeps the running or the paused ones; `trigger` keeps one trigger; `sort_by` takes `created_at`, `name` or `updated_at`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `active` (query, string): Keep only running sequences (`true`) or only paused ones (`false`). Omit for both.
- `trigger` (query, string): Keep only the sequences on one trigger: `churned`, `lead`, `stalled_checkout` or `trial_ending`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/sequences`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"name": "Win-back after churn", "steps": [{"delay_days": 3, "body": "Hi {name}, your place in {project} is still here: {link}"}, {"delay_days": 7, "body": "{coupon} takes {discount} off: {link}", "coupon_id": "3b7c9d1e-5f24-4a86-9c0b-2d4e6f8a1b3c"}]}'
```

Builds the sequence with its steps in one write and answers it with `201`; `trigger` defaults to `churned` and `active` to `true`. Up to 8 steps, the first 0 to 180 days after the trigger (`0` goes out on the next hourly run) and each later one 1 to 180 days after the one before, with a message of 1 to 1,000 characters. A sequence built without steps exists and enrols nobody until it has one.

> The body is sent as a chat message, so a step with a coupon reads best when it uses `{coupon}` and `{discount}`, and every step should end on `{link}`, which is the way back.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A creator-facing label, 1 to 120 characters; such as `Win-back after churn`.
- `trigger` (one of `churned`, `lead`, `stalled_checkout`, `trial_ending`): What enrols a member: `churned` (their last live membership ended; the default), `lead` (they arrived without buying), `stalled_checkout` (a checkout they started stayed open past the project's window) or `trial_ending` (a trial without a card is about to end).
- `active` (boolean): Whether the sequence enrols and sends from the start. Defaults to `true`.
- `steps` (array of object): The steps in the order they go out, at most 8. Omit for a sequence with no steps yet, which enrols nobody.
  - `delay_days` (integer, required): Days after the trigger for the first step, 0 to 180 (`0` goes out on the next hourly run); days after the step before for the rest, 1 to 180.
  - `body` (string, required): The message in the creator's words, 1 to 1,000 characters of text, with `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` filled per member at send time. Plain text or HTML: bold, italic, underline, strikethrough, code, links and paragraphs are kept, everything else is stripped to its words.
  - `coupon_id` (string): One of this project's coupons to carry with the step, or `null`.


### DELETE `/v1/projects/{project}/sequences/{sequence}`

Puts the sequence out of use and answers `204`: every member part-way through leaves it as `sequence.exited` with the reason `deleted`, the row and its history stay for the figures, and the id stops answering. There is no undo; build a new sequence instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/sequences/{sequence}`

One sequence with its steps and its counts. A sequence of another project, or one the creator deleted, is `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/sequences/{sequence}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences/9d2f4b6a-1c3e-4f58-8a7b-6e5d4c3b2a19 \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 0c4e8a2d-6f1b-4c9e-8d3a-5b7f9e1c2d64" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

Any subset of the name, the trigger and the switch; fields left out keep their stored values. Switching a sequence off lets every member part-way through go, as `sequence.exited` with the reason `disabled`, and enrols nobody until it runs again; switching it back on enrols nobody retroactively.

`steps`, when present, replaces the whole list in order: a step still at its place keeps its id and a member due it keeps their position, the rest are appended and the extra ones removed from the end. Send `[]` to remove every step. One `sequence.updated` announces the sequence as it then stands.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string): A new creator-facing label, 1 to 120 characters.
- `trigger` (one of `churned`, `lead`, `stalled_checkout`, `trial_ending`): What enrols a member: `churned`, `lead`, `stalled_checkout` or `trial_ending`. Members already part-way through keep their passage.
- `active` (boolean): Switch the sequence on or off. Off lets every member part-way through go, as `sequence.exited` with the reason `disabled`, and enrols nobody until it runs again.
- `steps` (array of object): The whole list of steps in order, at most 8; it replaces the stored list. A step still at its place keeps its id and a member due it keeps their position. Omit to leave the steps alone; send `[]` to remove them all.
  - `delay_days` (integer, required): Days after the trigger for the first step, 0 to 180 (`0` goes out on the next hourly run); days after the step before for the rest, 1 to 180.
  - `body` (string, required): The message in the creator's words, 1 to 1,000 characters, with `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` filled per member at send time.
  - `coupon_id` (string): One of this project's coupons to carry with the step, or `null`.


### GET `/v1/projects/{project}/sequences/{sequence}/enrollments`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences/9d2f4b6a-1c3e-4f58-8a7b-6e5d4c3b2a19/enrollments?exit_reason=reactivated" \
  -H "Authorization: Bearer sbt_..."
```

Every passage a member made through the sequence, the newest first: when they entered, the step due next and when, and how the passage ended if it has. `state` is `open`, `completed` or `exited`, and an exited passage says why: `reactivated` (the member paid again, a win), `opted_out` (the platform could not reach them), `disabled` or `deleted`. `exit_reason` keeps one way out; `sort_by` takes `enrolled_at`, `next_due_at`, `completed_at` or `exited_at`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `exit_reason` (query, string): Keep only the passages that ended this way: `reactivated` (won back), `opted_out`, `disabled` or `deleted`. Omit for every passage, open ones included.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


## `support-canned-replies`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/support/canned-replies` | `support-canned-reply:view-any` | List a project's saved replies | `list_canned_replies` |
| POST | `/v1/projects/{project}/support/canned-replies` | `support-canned-reply:create` | Create a saved reply | `create_canned_reply` |
| DELETE | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:delete` | Delete a saved reply | `delete_canned_reply` |
| GET | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:view-any` | Get a saved reply | `get_canned_reply` |
| PATCH | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:update` | Update a saved reply | `update_canned_reply` |

### GET `/v1/projects/{project}/support/canned-replies`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every snippet on the project in the creator's order (`sort_order` ascending). The set is small by design, so the list is not paginated.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### POST `/v1/projects/{project}/support/canned-replies`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Opening hours",
    "body": "We answer between 9 and 5, Monday to Friday.",
    "shortcut": "hours"
  }'
```

Answers `201` with the snippet and emits `support.canned_reply.created`.

> **A duplicate shortcut is a 422, not a second snippet.** Shortcuts are unique per project. Sending a shortcut another saved reply on the same project already uses is refused on `shortcut`. Two different projects may both have `hours`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string, required): The label shown in the picker, 2 to 80 characters; never sent to the member.
- `body` (string, required): The text sent to the member, 2 to 4,000 characters, the message ceiling the reply has to fit once it is sent.
- `shortcut` (string): Up to 30 letters, numbers, dashes and underscores, unique within the project (two projects may both have `hours`). Omit it, or send null or an empty string, for none. The character set means a shortcut can never be confused with a bot command or need escaping when echoed back.
- `sort_order` (integer): The position in the picker, 0 to 999. Defaults to 0.


### DELETE `/v1/projects/{project}/support/canned-replies/{reply}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies/$REPLY_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The snippet leaves the picker; messages sent with it stay in their threads. Emits `support.canned_reply.deleted`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/support/canned-replies/{reply}`

One snippet. There is no `support-canned-reply:view`: a snippet is only ever read as part of the picker, so this route gates on `view-any` too. A reply is resolved **within the project**: another project's reply id is a `404 RESOURCE_NOT_FOUND`.

`shortcut` is `null` when the creator never set one; the snippet is then picked from the list rather than typed.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.


### PATCH `/v1/projects/{project}/support/canned-replies/{reply}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies/$REPLY_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"title": "Support hours"}'
```

Accepts the same fields as create, all optional. **An omitted field keeps its stored value**, so a snippet can be renamed without resending its body. Send `"shortcut": null` to clear the shortcut. The uniqueness check ignores the snippet being edited, so resending its own shortcut is fine.

Answers `200` with the updated snippet. Replies already sent with the old wording are untouched: a saved reply is copied into a message when it is used, not referenced. Emits `support.canned_reply.updated` only when something actually changed, with a `changes` map.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The label shown in the picker, 2 to 80 characters.
- `body` (string): The text sent to the member, 2 to 4,000 characters. Replies already sent with the old wording are untouched: a saved reply is copied into a message when it is used, not referenced.
- `shortcut` (string): Up to 30 letters, numbers, dashes and underscores, unique within the project. Send null to clear it. The uniqueness check ignores the snippet being edited, so resending its own shortcut is fine.
- `sort_order` (integer): The position in the picker, 0 to 999.


## `support-settings`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/support/settings` | `project:view` | Get a project's support settings | `get_support_settings` |
| PATCH | `/v1/projects/{project}/support/settings` | `project:update` | Update a project's support settings | `update_support_settings` |

### GET `/v1/projects/{project}/support/settings`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/support/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

| Field          | Type           | Notes                                                                                                                                          |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`      | boolean        | Whether a member's unrecognised message to the bot opens a conversation. Off stops **new** threads reaching the inbox; existing ones are kept. |
| `relay_mode`   | string         | `owner_dm`: the platform bot messages the project owner with an inline Reply button. `forum_group`: each conversation is mirrored into its own topic of a group the bot administers. `none`: the dashboard inbox is the only surface. |
| `agent_name`   | string or null | The name outbound replies are prefixed with so they read as coming from a person. `null` falls back to the project's default.                  |
| `auto_reply`   | string or null | Sent to a member on their first message in a thread. `null` sends nothing.                                                                     |
| `notify_email` | boolean        | Whether the creator is emailed about new support activity.                                                                                     |
| `copilot_answers` | boolean | Whether Subscriby Copilot answers members' own-subscription questions and what the project's Knowledge covers in the inbox and the project bot, marked as automated; everything else still waits for a person. |
| `copilot_portal` | boolean | Whether a signed-in member finds the same Copilot in a chat on the project's portal page. |

The keys drop the `support_` prefix the columns carry: on this endpoint everything is about support.

> **The relay chat id is never exposed.** The chat the `owner_dm` relay posts to, and the group `forum_group` mirrors into, are identifiers the bot handshake writes, not settings. They do not appear here and cannot be set from here.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}/support/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/support/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "relay_mode": "owner_dm",
    "auto_reply": "Thanks, a person will reply within a day."
  }'
```

Answers `200` with the complete settings after the change. **Every field is optional and an omitted one keeps its stored value**, so the request above changes the relay and the auto-reply and leaves `enabled`, `agent_name` and `notify_email` alone. `support.settings.updated` fires only when at least one value actually changed, with the full settings and a `changes` map; a `PATCH` that resends the current values changes nothing and raises nothing.

> **`forum_group` needs a group the bot can post into.** `forum_group` mirrors each member conversation into its own topic of a group with topics enabled. Switching the mode here does not link a group: the creator adds the project bot to such a group as an administrator (with permission to manage topics), the bot records the group itself and confirms by direct message. Until that happens, new member messages reach only the dashboard inbox. The group's id is never exposed by this endpoint.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `enabled` (boolean): Whether a member's unrecognised message to the bot opens a conversation.
- `relay_mode` (one of `owner_dm`, `forum_group`, `none`): `owner_dm`, `forum_group` or `none`. Switching to `forum_group` does not link a group: the creator adds the project bot to a group with topics enabled as an administrator, the bot records the group itself and confirms; until then new member messages reach only the dashboard inbox.
- `agent_name` (string): The name outbound replies are prefixed with, up to 60 characters; null or an empty string clears it. Whitespace is trimmed.
- `auto_reply` (string): The acknowledgement sent on a member's first message in a thread, up to 1,000 characters, well under the platform limit because it is sent with an identity header; null clears it.
- `notify_email` (boolean): Whether the creator is emailed about new support activity.
- `copilot_answers` (boolean): Whether Subscriby Copilot answers members' own-subscription questions and what the project's Knowledge covers in the inbox and the project bot, marked as automated; everything else still waits for a person.
- `copilot_portal` (boolean): Whether a signed-in member finds the same Copilot in a chat on the project's portal page.


## `roles`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/roles` | `role:view-any` | List roles | `list_roles` |
| POST | `/v1/roles` | `role:create` | Create a role | `create_role` |
| DELETE | `/v1/roles/{role}` | `role:delete` | Delete a role | `delete_role` |
| GET | `/v1/roles/{role}` | `role:view` | Get a role | `get_role` |
| PATCH | `/v1/roles/{role}` | `role:update` | Update a role | `update_role` |

### GET `/v1/roles`

```bash
curl https://api.subscriby.net/v1/roles \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every role across the teams the caller can see, with its permission codes. Visibility is the union of every team the caller owns or belongs to; a role from a team the caller cannot see answers `404 RESOURCE_NOT_FOUND` rather than `403`, so existence never leaks.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/roles`

```bash
curl -X POST https://api.subscriby.net/v1/roles \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "code": "support-agent",
        "name": "Support Agent",
        "description": "Answers tickets, cannot touch billing",
        "permissions": ["support-conversation:view-any", "support-conversation:update"]
      }'
```

> **Choose the code deliberately.** `code` is the stable identifier permissions are addressed by. It must be unique within the team and **cannot be changed afterwards**: renaming one would detach every assignment that referenced it. Only `name`, `description` and the permission set are mutable.

`permissions` accepts codes from the permission catalog in `entity:action` form. An unknown code is refused rather than silently dropped, so a typo fails loudly instead of creating a role that grants less than you think. Omit the field for a role that grants nothing yet.

Answers `201` with the role and emits `role.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the role in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a role cannot be moved between teams.
- `code` (string, required): The stable identifier permissions are addressed by, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards: renaming one would detach every assignment that referenced it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `description` (string): What the role is for, up to 255 characters; null clears it.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the role grants, in `entity:action` form. Sending it sets the role's permissions to exactly this list; omit the key to leave the existing set untouched. Omit it on create for a role that grants nothing yet.


### DELETE `/v1/roles/{role}`

```bash
curl -X DELETE https://api.subscriby.net/v1/roles/$ROLE_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`, and detaches the role's permissions on the way out. Anyone currently holding the role loses whatever it granted them; they stay in the team. Not gated by tier. Emits `role.deleted`.

Restricted to whoever **created** the role, unless the caller **owns** the team. Belonging to a team is not licence to dismantle how everyone else in it is permissioned.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/roles/{role}`

One role with its permission codes. `permissions` is a flat array of the exact ability strings granted by this role, the same strings used as token abilities, so you can match roles against tokens without a second round-trip.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.


### PATCH `/v1/roles/{role}`

```bash
curl -X PATCH https://api.subscriby.net/v1/roles/$ROLE_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Senior Support Agent", "permissions": ["support-conversation:view-any"]}'
```

> **Permissions replace, they do not merge.** Sending `permissions` sets the role's permissions to exactly that list; anything omitted is revoked. **Omit the key entirely** to leave the existing set untouched while changing only the name or description.

Answers `200` with the role and emits `role.updated`.

**Parameters**

- `role` (path, string, required): The role, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `team_id` (string, required): The team to create the role in; the caller must belong to it, and a team outside their account answers 404. Prohibited on update: a role cannot be moved between teams.
- `code` (string, required): The stable identifier permissions are addressed by, up to 255 letters, numbers, dashes and underscores, unique within the team and immutable afterwards: renaming one would detach every assignment that referenced it. Prohibited on update.
- `name` (string, required): The display name, up to 255 characters.
- `description` (string): What the role is for, up to 255 characters; null clears it.
- `permissions` (array of one of `project:view-any`, `project:view`, `project:create`, `project:update`, `project:delete`, `project-payment-method:view-any`, `project-payment-method:view`, `project-payment-method:create`, `project-payment-method:update`, `project-payment-method:delete`, `project-resource:view-any`, `project-resource:view`, `project-resource:create`, `project-resource:update`, `project-resource:delete`, `project-access-code:view-any`, `project-access-code:view`, `project-access-code:create`, `project-access-code:update`, `project-access-code:delete`, `project-coupon:view-any`, `project-coupon:view`, `project-coupon:create`, `project-coupon:update`, `project-coupon:delete`, `project-subscription:view-any`, `project-subscription:view`, `project-subscription:create`, `project-subscription:update`, `project-subscription:delete`, `project-subscription-plan:view-any`, `project-subscription-plan:view`, `project-subscription-plan:create`, `project-subscription-plan:update`, `project-subscription-plan:delete`, `project-user:view-any`, `project-user:view`, `project-user:create`, `project-user:update`, `project-user:delete`, `project-recovery:view-any`, `project-recovery:view`, `project-recovery:create`, `project-recovery:update`, `project-recovery:delete`, `project-connector:view-any`, `project-connector:view`, `project-connector:create`, `project-connector:update`, `project-connector:delete`, `project-referral:view-any`, `project-referral:view`, `project-referral:create`, `project-referral:update`, `project-referral:delete`, `project-link:view-any`, `project-link:view`, `project-link:create`, `project-link:update`, `project-link:delete`, `project-sequence:view-any`, `project-sequence:view`, `project-sequence:create`, `project-sequence:update`, `project-sequence:delete`, `project-knowledge:view-any`, `project-knowledge:view`, `project-knowledge:create`, `project-knowledge:update`, `project-knowledge:delete`, `support-conversation:view-any`, `support-conversation:view`, `support-conversation:create`, `support-conversation:update`, `support-conversation:delete`, `team-member:view-any`, `team-member:view`, `team-member:invite`, `team-member:remove`, `team-member:update-role`, `copilot:use`): The permission codes the role grants, in `entity:action` form. Sending it sets the role's permissions to exactly this list; omit the key to leave the existing set untouched. Omit it on create for a role that grants nothing yet.


## `subscriptions`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/subscriptions` | `project-subscription:view-any` | List subscriptions | `list_subscriptions` |
| GET | `/v1/subscriptions/{subscription}` | `project-subscription:view` | Get a subscription | `get_subscription` |
| POST | `/v1/subscriptions/{subscription}/cancel` | `project-subscription:update` | Cancel a subscription | `cancel_subscription` |
| GET | `/v1/subscriptions/{subscription}/grants` | `project-subscription:view` | List a subscription's grants | `list_subscription_grants` |
| POST | `/v1/subscriptions/{subscription}/grants/reissue` | `project-subscription:update` | Reissue a subscription's access | `reissue_subscription_grants` |
| POST | `/v1/subscriptions/{subscription}/pause` | `project-subscription:update` | Pause a subscription | `pause_subscription` |
| POST | `/v1/subscriptions/{subscription}/reactivate` | `project-subscription:update` | Reactivate a subscription | `reactivate_subscription` |
| POST | `/v1/subscriptions/{subscription}/remind` | `project-subscription:update` | Remind a pass holder | `remind_pass_holder` |
| POST | `/v1/subscriptions/{subscription}/remind-connection` | `project-subscription:update` | Remind a member to connect | `remind_member_to_connect` |
| POST | `/v1/subscriptions/{subscription}/unpause` | `project-subscription:update` | Unpause a subscription | `unpause_subscription` |

### GET `/v1/subscriptions`

```bash
curl "https://api.subscriby.net/v1/subscriptions?status=active" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The held subscriptions across every project the token reaches, newest first, paged with `page` and `per_page` (default 25; `limit` is accepted as an alias). `status` matches a single payment status and `plan_id` scopes to one plan. Rows carry no `grants`.

A token minted with `scope:project:<uuid>` entries lists only the subscriptions of those projects, and a subscription of any other project is `404 RESOURCE_NOT_FOUND` on every endpoint of this resource.

**Parameters**

- `status` (query, string): Match a single payment status: `trialing`, `active`, `incomplete`, `expired`, `past_due`, `canceled`, `unpaid`, `paused`, `processing`, `succeeded`, `capturable` or `failed`. An unknown value is refused.
- `plan_id` (query, string or null): Scope to one plan.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/subscriptions/{subscription}`

One subscription with its `grants` embedded.

`payment_status` is one of `trialing`, `active`, `incomplete`, `expired`, `past_due`, `canceled`, `unpaid`, `paused`, `processing`, `succeeded`, `capturable` or `failed` (the `subscriby://enums/subscription-status` MCP resource lists them).

`compensation_seconds` is the outage time [Outage Compensation](https://docs.subscriby.net/disaster-recovery/connector-outages#outage-compensation) has banked on the purchase, `0` for almost every subscription. `ends_at` already includes it: a one-time purchase simply ends later, while a recurring plan's `ends_at` runs that many seconds past the period the member last paid for, so the renewal the gateway bills is `ends_at` minus `compensation_seconds`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.


### POST `/v1/subscriptions/{subscription}/cancel`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/cancel \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Cancel is asynchronous: the endpoint answers `202 Accepted` once cancellation is queued. Provider-side cancellation (Stripe, PayPal, Razorpay, Paystack and the others) and the accompanying `subscription.cancelled` event happen on the background worker.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/subscriptions/{subscription}/grants`

```bash
curl https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/grants \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every grant the purchase holds, one per resource and dated window, oldest first. Never paginated.

A **grant** is the access ledger's record that a purchase admits its holder to one resource: one row per resource, and per dated window for a pass. It says which connector gave the access, how (`mode`), where it stands (`state`) and, when it failed, why. Read it to know whether a member is actually in the channel rather than inferring it from the payment status.

- `mode` is `bearer_link` (a personal invite link the member comes through), `membership` (the connector added the member itself), `role` (a role was assigned) or `creator_task` (the creator has to do something by hand).
- `state` is `pending_identity` (the member has not linked an account on that connector yet; `member.resource_pending` was raised, and the grant is issued the moment they connect one), `pending` (issued, not yet used), `held` (issued ahead of a pass window and released when it opens), `granted`, `revoked` or `failed`.
- `identity_id` is the connector account admitted, the same id the [member's identities endpoint](https://docs.subscriby.net/api/v1/reference/members) returns, or `null` while none is linked or for a hand-arranged perk.
- `reference` is the connector's handle on the grant (the invite link on a connector that grants by link), `null` before anything was issued. Treat it as a secret: whoever holds a bearer link can use it.
- A `failed` grant carries `failure_kind` (`unreachable`, `not_permitted`, `target_missing`, `rate_limited`, `configuration`, `transient`, `other`) and `failure_detail`, the sentence the creator sees in the dashboard.

The ledger is written by the same job that mints invite links, so a purchase's grants appear moments after `member.resource_added` fires; a revoked link stays as a `revoked` row rather than disappearing, so history is never lost.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.


### POST `/v1/subscriptions/{subscription}/grants/reissue`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/grants/reissue \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "resource_id": "c9e21f37-8a4b-4d56-b1e0-2f7c9d3a6e15" }'
```

The members page's **Refresh invite links**, for integrations. The grants the member holds are revoked (their personal invite links die) and the job that grants at purchase runs again, issuing fresh grants the bot sends to the member. `resource_id` is optional: name one resource of the plan to reissue it alone, leave it out to reissue every resource the subscription grants.

Answers `202` once the reissue is queued, where `reissued` counts the grants revoked; the fresh grants appear on the grants endpoint seconds later. Each revoked grant raises `member.resource_reissued` and each fresh one `member.resource_added`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `resource_id` (string): A resource the plan grants, to reissue it alone; omit it to reissue every resource. A resource the plan does not grant answers 404.


### POST `/v1/subscriptions/{subscription}/pause`

Suspends access: the member is removed from every linked resource, `payment_status` becomes `paused` and `paused_at` is stamped. Billing continues. Answers `202` with the outcome and emits `subscription.paused`.

> **Pause suspends access, not billing.** The member's payment provider keeps charging on schedule. Subscriby settles through seven providers and only some can hold a recurring charge at all, so a pause meaning "stop billing" would work on some and silently not on others; access is what Subscriby controls directly, so it behaves identically everywhere. If billing must stop, cancel.

Only `active` and `trialing` subscriptions can be paused; only a `paused` one can be unpaused.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/reactivate`

Calls off a scheduled cancellation at the gateway and locally: the counterpart to cancel, and the win-back path. Answers `202` with the outcome (`outcome: reactivated`) and emits `subscription.reactivated`.

> **Stripe only.** On every other provider, cancelling ends the agreement outright, so there is nothing left to resume; the endpoint refuses and the member has to subscribe again. Flipping the record back to active would otherwise claim a recurring subscription the provider will never charge, and the member would keep access indefinitely for free.

An already-expired subscription cannot be reactivated regardless of provider.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/remind`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/remind \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The members page's nudge for a pass holder who bought a window but has not joined yet: their invite links are re-sent. Answers `200` with `reminded: true` when the connector accepted the message, and `reminded: false` when there was nothing to send: the subscription holds no window, the window has ended or been cancelled, the holder has already queued, or they cannot be reached on their connector. `false` is the dashboard's "Nothing sent" notice, not a fault, so it is never a `422`.

This messages a real person: read the subscription back first and do not repeat the nudge within the same window. To nudge everyone still missing from one window at once, use the [pass window remind endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows).

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/remind-connection`

```bash
curl -X POST https://api.subscriby.net/v1/subscriptions/$SUBSCRIPTION_ID/remind-connection \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

The members flyout's "Remind to connect": a purchase that includes a place on a platform the member has not connected (a Discord role bought through Telegram, say) waits for that account, and this sends the member the reminder with the door that connects it, by mail and in their chat. Answers `200` with `reminded: true` when the message went out, and `reminded: false` when nothing was sent: no place waits, the member was reminded within the last day or stopped the project's follow-ups, or the purchase has ended. `false` is the dashboard's "Nothing Sent" notice, not a fault, so it is never a `422`. Find the candidates with `GET /v1/projects/{project}/members?access=waiting`; the daily reminder covers them once on its own.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/subscriptions/{subscription}/unpause`

Restores access with **fresh** invite links: the ones revoked at pause never come back. Answers `202` with the outcome (`outcome: active`) and emits `subscription.unpaused`.

**Parameters**

- `subscription` (path, string, required): The subscription, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `support-conversations`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/support/conversations` | `support-conversation:view-any` | List support conversations | `list_support_conversations` |
| GET | `/v1/support/conversations/{conversation}` | `support-conversation:view` | Get a support conversation | `get_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/assign` | `support-conversation:update` | Assign a support conversation | `assign_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/block` | `support-conversation:update` | Block a support contact | `block_support_contact` |
| GET | `/v1/support/conversations/{conversation}/messages` | `support-conversation:view` | List a conversation's messages |  |
| POST | `/v1/support/conversations/{conversation}/messages` | `support-conversation:update` | Reply to a member | `reply_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/reopen` | `support-conversation:update` | Reopen a support conversation | `reopen_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/resolve` | `support-conversation:update` | Resolve a support conversation | `resolve_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/unblock` | `support-conversation:update` | Unblock a support contact | `unblock_support_contact` |

### GET `/v1/support/conversations`

```bash
curl "https://api.subscriby.net/v1/support/conversations?status=open" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The queue across every project the token can reach, newest activity first, 25 per page. `project_id`, `status` and `assigned_to` narrow it.

**Parameters**

- `project_id` (query, string): Narrow the queue to a single project.
- `status` (query, string): Narrow to one status: `open`, `pending`, `snoozed` or `resolved`. An unknown value is refused.
- `assigned_to` (query, string): Narrow to the conversations assigned to one team member, by user id.
- `page` (query, integer): The page to return, 1-indexed.
- `per_page` (query, integer): Rows per page, 1 to 100.
- `limit` (query, integer): An alias of `per_page`, kept for older integrations.


### GET `/v1/support/conversations/{conversation}`

One thread.

`member_name` is the member's display name, or "Unknown member" when they have not shared one. It is included so a picker built on this endpoint has something human to show; the Zapier and n8n conversation dropdowns both rely on it. Anyone who can reach the bot can open a conversation, including someone who has never paid, so `subscriber_id` may resolve to a member whose status is `lead`.

`channel` is the key of the connector the member wrote through. A member who writes through two connectors has two conversations, and each reply goes back on the connector its conversation came in on.

`status` is one of `open`, `pending`, `snoozed`, `resolved`. `first_response_at` is stamped **once**, on the first human reply ever in the thread: it is an SLA measure of how long the member waited for a person, not of the most recent reply, and a reopen does not reset it.

`blocked: true` means inbound messages from that member are being dropped. The thread is history only, and a blocked member cannot reopen it by writing again.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.


### POST `/v1/support/conversations/{conversation}/assign`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/assign \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to_user_id": "'"$TEAM_USER_ID"'"}'
```

Hands the thread to a team member. `assigned_to_user_id` must be **present**: omitting the key is refused, and sending `null` is how you clear an assignment. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `assigned_to_user_id` (string, required): The team member to hand the thread to, by user id. The key must be **present**: omitting it is refused, while sending null clears the assignment.


### POST `/v1/support/conversations/{conversation}/block`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/block \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Silences the member behind the thread: their messages to this project's bot are dropped without any notice to them, and the thread cannot reopen on inbound. Their paid access is untouched, because a block is an inbox decision and not a moderation one; use the [Members](https://docs.subscriby.net/api/v1/reference/members) endpoints to ban or kick. Idempotent and answers `200` with the thread; blocking an already-blocked contact changes nothing and emits nothing, and when the block actually flips `support.conversation.blocked` fires once.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/support/conversations/{conversation}/messages`

The thread's messages **oldest first**, 50 per page. `internal: true` notes are withheld unless the token also carries `support-conversation:update`: reading a private remark about a member takes the same permission as writing one.

`direction` is `inbound` (from the member) or `outbound` (from your team). `author_kind` is `contact`, `creator` or `system`; `author_user_id` names the team member on an outbound reply and is `null` for inbound and system messages.

`source` is the surface the message came through: `connector_chat` for a member writing to the connector's installation, `dashboard`, `api` or `mcp` for a reply from your team, and `connector_relay_dm` or `connector_relay_group` for a reply your team typed on the platform itself (into the relay's ping, or inside the thread the relay opened in a group). Messages recorded before the connector SDK carry the same three meanings under the Telegram connector's older words, `telegram_bot`, `telegram_relay_dm` and `telegram_relay_group`.

`delivery_status` on an outbound message is `pending` → `sent`, or `failed` / `unreachable`. **`unreachable` means the member has blocked the bot**: the reply is stored but will never arrive, and retrying will not help. `failure_reason` carries the detail.

`body` is `null` for media sent without a caption. A captioned photo puts the caption in `body` and does not create a second message. A member editing an earlier message updates the stored message in place and stamps `edited_at`; no new message is created and no event fires. Inbound messages are rate-limited per member: excess messages are dropped silently rather than queued, so a flooding member produces no burst of events.

Each entry of `attachments` carries the file's `kind`, `mime`, `file_name`, `size`, `width`, `height`, `duration` and `url`.

> **File ids are never returned.** A platform file id plus the bot token is enough to download the file straight from the platform, so it is treated as a credential. `url` is populated only after the file has been fetched at least once; it is `null` until then.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `page` (query, integer): The page to return, 1-indexed.
- `per_page` (query, integer): Messages per page, 1 to 100.
- `limit` (query, integer): An alias of `per_page`, kept for older integrations.


### POST `/v1/support/conversations/{conversation}/messages`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"body": "Sorry about that. Here is a fresh invite link, valid for 24 hours."}'
```

Answers `201` with the created message. `delivery_status` is `pending`: the reply has been recorded and queued, not yet delivered. Poll the message back or subscribe to `support.message.sent` rather than treating `201` as proof of receipt.

**Text only.** Sending media as a reply is a dashboard-inbox feature; this API accepts a `body` of up to 4000 characters, the message ceiling on the connectors.

Send `{"body": "...", "internal": true}` to record a private note for your team instead. Private notes are never delivered to the member and raise no webhook event.

Add `reply_to_message_id` to quote an earlier message, the way a chat client shows a threaded reply. It must name a message in **this** conversation; quoting across threads is refused, because it would put one member's words in front of another.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `body` (string, required): The reply text, up to 4,000 characters, the message ceiling on the connectors. Text only; media replies are a dashboard feature.
- `internal` (boolean): True records a private note for the team instead of a reply: never delivered to the member and raising no event. Defaults to false.
- `reply_to_message_id` (string): An earlier message of **this** conversation to quote, the way a chat client shows a threaded reply. A message from another thread is refused.


### POST `/v1/support/conversations/{conversation}/reopen`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/reopen \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Puts the conversation back to `open` and emits `support.conversation.reopened`, whatever its previous status was. A member writing back does the same thing on its own, so this is for the creator who changes their mind, or owes a follow-up before the member speaks again. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/support/conversations/{conversation}/resolve`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/resolve \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Resolving is not closing: the thread and its history are kept, and the member's next message reopens it automatically, raising `support.conversation.reopened`. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/support/conversations/{conversation}/unblock`

Reverses a block. Idempotent and answers `200` with the thread; `support.conversation.unblocked` fires once when the block actually flips.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `teams`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/teams` | `team:view-any` | List teams | `list_teams` |
| POST | `/v1/teams` | `team:create` | Create a team | `create_team` |
| GET | `/v1/teams/current` | `team:view` | Get the current team | `get_me` |
| DELETE | `/v1/teams/{team}` | `team:delete` | Delete a team | `delete_team` |
| GET | `/v1/teams/{team}` | `team:view` | Get a team | `get_team` |
| PATCH | `/v1/teams/{team}` | `team:update` | Rename a team | `update_team` |

### GET `/v1/teams`

```bash
curl https://api.subscriby.net/v1/teams \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Every team the caller owns or is a member of; teams belonging to other creators are invisible. Never paginated. Useful for a re-auth flow that wants to surface a team picker before the user mints a token scoped to a specific team.


### POST `/v1/teams`

```bash
curl -X POST https://api.subscriby.net/v1/teams \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Collective"}'
```

The caller becomes the team **owner**. Ownership is not a membership row: the owner cannot be removed from the team, cannot be re-roled, and is the only account permitted to rename or delete it.

A new team starts empty. Add people with [Team Members](https://docs.subscriby.net/api/v1/reference/team-members), and give them something to hold with [Roles](https://docs.subscriby.net/api/v1/reference/roles). Answers `201` with the team and emits `team.created`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): The team's name, up to 255 characters; the only mutable field.


### GET `/v1/teams/current`

```bash
curl https://api.subscriby.net/v1/teams/current \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Exactly the team the token is scoped to via `scope:team:<uuid>`. Zapier's connection test calls this on save to validate the bearer token.


### DELETE `/v1/teams/{team}`

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content` and emits `team.deleted`.

> **This takes everything with it.** Deleting a team deletes every project, plan, subscription and member scoped to it. There is no restore and no soft-delete. If you only want to stop selling, archive the projects instead.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The team if the caller belongs to it; `404 RESOURCE_NOT_FOUND` otherwise, never `403`, so foreign-team existence does not leak.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### PATCH `/v1/teams/{team}`

```bash
curl -X PATCH https://api.subscriby.net/v1/teams/$TEAM_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Collective (EU)"}'
```

`name` is the only mutable field. Ownership does not transfer through this endpoint, and membership moves through its own routes. Owner only. Answers `200` with the team and emits `team.updated`.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): The team's name, up to 255 characters; the only mutable field.


## `team-members`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| DELETE | `/v1/teams/{team}/invitations/{invitation}` | `team-member:remove` | Withdraw an invitation | `cancel_team_invitation` |
| GET | `/v1/teams/{team}/members` | `team-member:view-any` | List a team's members | `list_team_members` |
| POST | `/v1/teams/{team}/members` | `team-member:invite` | Invite a team member | `invite_team_member` |
| DELETE | `/v1/teams/{team}/members/{member}` | `team-member:remove` | Remove a team member | `remove_team_member` |
| GET | `/v1/teams/{team}/members/{member}` | `team-member:view` | Get a team member | `get_team_member` |
| PATCH | `/v1/teams/{team}/members/{member}/role` | `team-member:update-role` | Change a team member's role | `update_team_member_role` |

### DELETE `/v1/teams/{team}/invitations/{invitation}`

Requires `team-member:remove`, the same ability as removing a member, because withdrawing an invitation and removing a member revoke the same prospective access.

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID/invitations/$INVITATION_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

> **An invitee is not a member.** Someone who has not accepted has no membership row to remove, only a pending invitation. That is why this is a separate route: removing a member and withdrawing an invitation fail on different things, and using the wrong one returns `404` rather than doing something surprising.

Returns `204 No Content` and the invitation link stops working.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `invitation` (path, string, required): The pending invitation, resolved within the team by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}/members`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The team's owner as the first row followed by every member. Not paginated: a team's collaborator list is small by construction.

`email` is **omitted entirely** unless the token carries `team-member:view`. Listing who is on a team and reading how to reach them are different asks, and the fine-grained ability is what separates them. A roster-only token gets every other field and no `email` key at all: not `null`, absent.

The same `team-member:view-any` permission gates the dashboard's **Settings → Teams → Manage Members** page: only team owners and members holding the permission via their role can load it. Free-tier teams auto-assign everyone as owner, so this only matters on Growth-tier teams with multiple collaborators.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.


### POST `/v1/teams/{team}/members`

```bash
curl -X POST https://api.subscriby.net/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"email": "newcomer@example.com", "role": "support-agent"}'
```

Addressed by **email**, not user id: the invitee may not have a Subscriby account yet, which is what separates inviting from adding. They receive an invitation message with a link; the membership row appears when they accept.

`role` is a role **code** on that team, such as `support-agent`, not a role id. Create it first with [Roles](https://docs.subscriby.net/api/v1/reference/roles) if it does not exist.

Answers `201` with the invitation summary. Emits `team.member.invited`, then `team.member.joined` when they accept.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `email` (string, required): The invitee's email address, up to 255 characters. They receive an invitation message with a link; the membership appears when they accept.
- `role` (string, required): A role **code** on that team, such as `support-agent`, not a role id. Create it first if it does not exist; an unknown code is refused.


### DELETE `/v1/teams/{team}/members/{member}`

```bash
curl -X DELETE https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. They lose access to every project and setting scoped to the team immediately; their own Subscriby account is untouched. Not gated by tier. Emits `team.member.removed`.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The membership, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/teams/{team}/members/{member}`

```bash
curl https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One collaborator, with their `email`, which this route always includes because it requires `team-member:view` by definition. `404 RESOURCE_NOT_FOUND` if the user is not on the team or the team is not in the caller's visibility set.

- `role_id` points at a [Role](https://docs.subscriby.net/api/v1/reference/roles) row on the same team, or `null` for the owner pseudo-row.
- `is_owner` is `true` only for the single team creator; the owner is returned alongside the members but bypasses the membership table entirely.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The person's place on the team, resolved by the route binder.


### PATCH `/v1/teams/{team}/members/{member}/role`

```bash
curl -X PATCH https://api.subscriby.net/v1/teams/$TEAM_ID/members/$USER_ID/role \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"role": "manager"}'
```

Moves a collaborator onto another of the team's roles. The team **owner** cannot be re-roled: ownership is not a membership row and carries everything unconditionally. Answers `200` with the membership and emits `team.member.role_changed`.

Changing a member's role has **no dashboard equivalent**: the settings page offers invite, remove and cancel-invitation only, so this endpoint is the only way to move someone between roles without removing and re-inviting them.

**Parameters**

- `team` (path, string, required): The team, resolved by the route binder.
- `member` (path, string, required): The membership, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `role` (string, required): A role **code** on the team, such as `manager`, not a role id. An unknown code is refused.


## `tokens`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/tokens` | `token:view-any` | List the caller's tokens | `list_tokens` |
| POST | `/v1/tokens` | `token:create` | Mint a token | `create_token` |
| DELETE | `/v1/tokens/{token}` | `token:delete` | Revoke a token | `revoke_token` |
| GET | `/v1/tokens/{token}` | `token:view` | Get a token | `get_token` |

### GET `/v1/tokens`

```bash
curl https://api.subscriby.net/v1/tokens \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Paginated, newest first. `per_page` accepts 1–100 and defaults to 25.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/tokens`

```bash
curl -X POST https://api.subscriby.net/v1/tokens \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Nightly reconciliation",
        "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
        "abilities": ["project-subscription:view-any", "payment:view-any"]
      }'
```

`token` sits alongside `data`, not inside it, the same shape webhook endpoints use for their one-time signing secret. Store it before you do anything else; there is no endpoint that will hand it back. Minting is deliberately not offered as an MCP tool.

**`team_id` is required here, and only here.** Everywhere else in v1 the team comes from the calling token's frozen scope and a `team_id` in the body is ignored. Minting is the exception: a token is created **for** a team, and you may belong to several. The minted token gets `scope:team:<team_id>` automatically. It cannot be widened later.

> **A token can never mint a stronger token.** The abilities you request must be a **subset** of the abilities the calling token holds, and `token:create` is withheld unconditionally from anything minted this way.

Minting used to be dashboard-only precisely so a leaked automation token could not spin up a higher-privilege one. That concern is real, and attenuation is the answer to it rather than a retreat from it: a compromised credential can produce nothing its holder could not already do directly. `token:create` is withheld on top of the subset rule for a separate reason: inherited, it would leave an unbounded ladder of tokens descending from one leak, with no single revocation that ends the chain. A human in the dashboard is not attenuated. They authenticated with a password and a second factor, not with a bearer string, so they can grant anything in the catalog.

If the calling token carries a **deprecated** coarse ability, it may still mint the precise abilities that ability covers; the split does not shrink what an existing token can delegate.

Asking for more than you hold returns `422`; `context.abilities` echoes back what you asked for, not what was refused, and the refused ones are named in `message`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "A token cannot grant abilities it does not hold: coupon:delete, project:delete.",
    "context": {
      "abilities": ["coupon:delete", "project:delete", "project:view-any"]
    }
  }
}
```

A retired ability keeps working on tokens that already carry it, but no new token can be given one. This is a field-level failure, so every offending entry in the array is reported at once under `fields`, and the message names the replacements; an ability that is simply unknown gets a different message pointing at the catalog, because a typo and a retirement need different fixes:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "webhook-endpoint:manage is retired and cannot be granted to a new token. Use webhook-delivery:retry, webhook-delivery:view-any, webhook-endpoint:create, webhook-endpoint:delete, webhook-endpoint:update, webhook-endpoint:view, webhook-endpoint:view-any instead.",
    "fields": {
      "abilities.0": [
        "webhook-endpoint:manage is retired and cannot be granted to a new token. Use webhook-delivery:retry, webhook-delivery:view-any, webhook-endpoint:create, webhook-endpoint:delete, webhook-endpoint:update, webhook-endpoint:view, webhook-endpoint:view-any instead."
      ]
    }
  }
}
```

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A label for the token, up to 255 characters, shown on Settings → API Tokens.
- `abilities` (array of string, required): The abilities the token holds, at least one. Each must be one the calling token holds itself (attenuation), and `token:create` is withheld unconditionally.
- `team_id` (string, required): The team the token is minted **for**; it receives `scope:team:<team_id>` automatically and cannot be widened later. Must be a team the caller owns or belongs to. Required here, unlike everywhere else in v1 where the team comes from the calling token's scope.


### DELETE `/v1/tokens/{token}`

```bash
curl -X DELETE https://api.subscriby.net/v1/tokens/$TOKEN_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. Revocation is immediate: in-flight requests already authenticated will finish, and the next one fails.

**Parameters**

- `token` (path, integer, required): One of the caller's tokens, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/tokens/{token}`

```bash
curl https://api.subscriby.net/v1/tokens/$TOKEN_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One of the caller's tokens, without its value.

- `id` is an **integer** serialised as a string, the one identifier in the platform that is not a UUID. See [Identifiers](https://docs.subscriby.net/api/v1#identifiers).
- `abilities` is the gate strings only. Scope tuples (`scope:team:…`, `scope:project:…`) are split out into `scopes` for readability, so `abilities_count` counts real permissions rather than bookkeeping.
- The plaintext value is **never** returned here. Lose it and the only recovery is to revoke the token and mint another.

**Parameters**

- `token` (path, integer, required): One of the caller's tokens, resolved by the route binder.


## `webhook-deliveries`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-deliveries` | `webhook-delivery:view-any` | List webhook deliveries | `list_webhook_deliveries` |
| POST | `/v1/webhook-deliveries/retry-dead` | `webhook-delivery:retry` | Retry every recent dead delivery | `retry_dead_webhook_deliveries` |
| GET | `/v1/webhook-deliveries/{delivery}` | `webhook-delivery:view-any` | Get a webhook delivery | `get_webhook_delivery` |
| POST | `/v1/webhook-deliveries/{delivery}/retry` | `webhook-delivery:retry` | Retry a webhook delivery | `retry_webhook_delivery` |

### GET `/v1/webhook-deliveries`

```bash
curl "https://api.subscriby.net/v1/webhook-deliveries?status=dead" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The team's deliveries across every endpoint, **newest first**, 25 per page (`per_page` 1 to 100; `limit` is accepted as an alias).

**Parameters**

- `status` (query, string): One of the log's tabs: `all` (the default), `pending`, `delivered`, `failed` or `dead`. A tab rather than a raw status, so an omitted value lists every row instead of quietly matching nothing. Anything else is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/webhook-deliveries/retry-dead`

Once the consumer is fixed, replay everything the team dead-lettered since an instant in one call.

```bash
curl -X POST https://api.subscriby.net/v1/webhook-deliveries/retry-dead \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"since": "2026-09-05T22:00:00Z"}'
```

`retried` is how many rows were reset and queued. Only `dead` rows are touched: a `failed` row is still on its ladder and will be posted again on its own. The replay is capped at 500 rows per call so one request after a long outage cannot flood the queue or the target; call it again if the count comes back at the ceiling.

Each replayed row posts its event again, so confirm the consumer is healthy first; see [replaying bulk dead deliveries](https://docs.subscriby.net/webhooks/v1/retries-and-delivery#replaying-bulk-dead-deliveries).

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `since` (string): ISO 8601, not in the future. Only rows dead-lettered **at or after** this instant are replayed. Omit it for the last 24 hours.


### GET `/v1/webhook-deliveries/{delivery}`

```bash
curl https://api.subscriby.net/v1/webhook-deliveries/$DELIVERY_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One delivery. Another team's delivery is a `404 RESOURCE_NOT_FOUND`, never a `403`.

| Field              | Type            | Notes                                                                                                                                      |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `event`            | string          | The event name, as in the [catalog](https://docs.subscriby.net/api/v1/reference/webhook-events).                                              |
| `event_id`         | string          | The 26-character ULID the envelope's `id` carries without its `evt_` prefix; also the `SB-Event-Id` header your handler received.          |
| `status`           | string          | `pending`, `delivered`, `failed` or `dead`. See below.                                                                                     |
| `attempts`         | integer         | Posts made so far. Reset to `0` by a retry.                                                                                                |
| `response_status`  | integer or null | The HTTP status your endpoint returned on the last attempt; `null` before the first post or after a transport failure.                     |
| `response_excerpt` | string or null  | The start of the response body, or the transport error.                                                                                    |
| `payload`          | object          | The full [event envelope](https://docs.subscriby.net/webhooks/v1/events) that was, or would have been, posted, so a consumer can be debugged against it exactly. |
| `next_attempt_at`  | string or null  | When the worker will post a `failed` row again.                                                                                            |
| `delivered_at`     | string or null  | Stamped on the first 2xx.                                                                                                                  |
| `dead_lettered_at` | string or null  | Stamped when the ladder ran out.                                                                                                           |

There is no `updated_at`: a delivery only moves forward through its statuses, and the three timestamps say when each transition happened.

A row is born `pending`, becomes `failed` after a non-2xx or transport error while retries remain, `delivered` on the first 2xx, and `dead` once the ladder is exhausted or the endpoint vanished. `delivered` and `dead` are final until a retry resets the row to `pending`.

> **`payload` discloses nothing new.** The envelope is what your own endpoint already received, or would have had it answered. Reading it needs `webhook-delivery:view-any`, and the tenant scope reaches a delivery only through an endpoint of the token's team.

**Parameters**

- `delivery` (path, string, required): The delivery, resolved by the route binder.


### POST `/v1/webhook-deliveries/{delivery}/retry`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-deliveries/$DELIVERY_ID/retry \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with the row **pending again**: `attempts` back to `0`, `response_status`, `response_excerpt` and `dead_lettered_at` cleared, and the worker queued. The delivery log then shows the replay's own outcome rather than the original failure's. A retry re-posts the **original** event to its endpoint; nothing new is raised about the replay itself.

> **Only `failed` and `dead` rows can be retried.** Resetting a delivered row would post the event to your server a second time. The dashboard hides its retry button behind the same rule, but a row can be delivered between a render and a click, and the API has no button at all.

**Parameters**

- `delivery` (path, string, required): The delivery, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The endpoint's delivery log stays readable.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/webhook-endpoints/{endpoint}`

```bash
curl https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The endpoint and its delivery health. The signing secret is never part of it; it exists in the create and rotate-secret responses only.

`disabled_at` populates when Subscriby auto-disables an endpoint after too many consecutive failures, or when the creator pauses it. `last_success_at` / `last_failure_at` track the most recent delivery outcomes. `project_id` is `null` for team-wide endpoints.

**Parameters**

- `endpoint` (path, string, required): The endpoint, resolved by the route binder.


### POST `/v1/webhook-endpoints/{endpoint}/pause`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-endpoints/$ENDPOINT_ID/pause \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
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
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
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


## `webhook-events`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-events` | `webhook-delivery:view-any` | Poll recent webhook events |  |

### GET `/v1/webhook-events`

```bash
curl "https://api.subscriby.net/v1/webhook-events?type=subscription.created&limit=3" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The most recent deliveries of one event type, newest first, as the envelopes the endpoints received. `limit` defaults to 3 and is capped at 10; `project_id` restricts to deliveries whose endpoint is scoped to that project.

`api_version` is the payload-envelope stamp the dispatcher wrote at delivery time; see [versioning](https://docs.subscriby.net/api/v1/versioning-and-deprecation). Results are ordered by `created_at` descending. Only deliveries against endpoints owned by the token's team are returned; other tenants' events are never surfaced.

`data` is empty when no endpoint in your team is subscribed to the requested event type yet, or when no delivery has fired for that type since the relevant endpoint was created. Zapier, Make, and n8n all fall back to the trigger's static sample in that case, so builders can still author a Zap end-to-end before the first live event flows.

**Parameters**

- `type` (query, string, required): The event name to sample, such as `subscription.created`; must be a case from the outbound webhook event catalog. An unknown name is refused.
- `limit` (query, integer): How many recent deliveries to return, 1 to 10.
- `project_id` (query, string): Restrict to deliveries whose endpoint is confined to this project.


## `webhook-subscriptions`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-subscriptions` | `webhook-endpoint:view-any` |  |  |
| POST | `/v1/webhook-subscriptions` | `webhook-endpoint:create` |  |  |
| DELETE | `/v1/webhook-subscriptions/{endpoint}` | `webhook-endpoint:delete` |  |  |
