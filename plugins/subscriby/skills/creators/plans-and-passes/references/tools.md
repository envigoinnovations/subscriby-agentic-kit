# Tools: Plans and Passes

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_plans` | read | `project-subscription-plan:view-any` | Lists subscription plans, optionally narrowed to one project via `project_id`. |
| `get_plan` | read | `project-subscription-plan:view` | Fetches one subscription plan by UUID. |
| `create_plan` | additive | `project-subscription-plan:create` | Creates a subscription plan on a project. |
| `update_plan` | destructive | `project-subscription-plan:update` | Changes one or more fields of an existing plan; anything you omit keeps its stored value. |
| `delete_plan` | destructive | `project-subscription-plan:delete` | Soft-deletes a plan so it disappears from the portal, the bot and every list; existing subscriptions keep their history and keep running to their end. |
| `publish_plan` | destructive | `project-subscription-plan:update` | Flips a plan's `active` flag. |
| `reorder_plans` | destructive | `project-subscription-plan:update` | Pins the order a project's plans appear in on the public portal and in the project's bot. |
| `sync_payment_method_plans` | destructive | `project-payment-method:update` | Queues a push of the project owner's plans into a payment method's gateway catalogue (Stripe products and prices, Polar products, Kelviq plans, PayPal, Razorpay or CoinPayments plans). |
| `list_pass_windows` | read | `pass-window:view-any` | Lists the dated access windows a time-limited pass plan generates, with their UUIDs. |
| `get_pass_window` | read | `pass-window:view` | Fetches one dated access window of a project's pass plans by UUID. |
| `create_pass_window` | additive | `pass-window:create` | Places one dated access window by hand on a time-limited pass plan, marked manual so a schedule rebuild keeps it. |
| `cancel_pass_window` | destructive | `pass-window:delete` | Cancels one dated access window and resettles everyone holding it. |
| `remind_pass_window_queue` | additive | `pass-window:update` | Nudges everyone who bought a window but has not come through their grant yet, re-sending it. |
| `remind_pass_holder` | additive | `project-subscription:update` | Nudges ONE pass holder who bought a window but has not come through their grant yet, re-sending it. |
| `start_next_season` | additive | `project-subscription-plan:create` | Duplicates a finished pass series into its next season: a NEW inactive pass_series plan with the same price, settings, resources and rules but an empty slate, linked from the old season as its successor so the presale reaches every current holder. |
| `get_pass_roster` | read | `project-user:view-any` | Reads a project's Pass Roster: its members against the dates its pass and series plans sell, one row per member with their standing on each date they hold (in, queued, holds, missed, ended or covered) and the cancelled dates they were moved off with where they went, plus the columns under `meta.dates`, the dates beyond the span that holders were moved onto under `meta.moved_to_dates`, and every move off a column folded by destination under `meta.relocations`. |
| `list_pass_moves` | read | `project-subscription:view` | Lists every hop one purchase's passes made, oldest first, from the project's pass move log: a date cancelled and the holder rolled forward (window_cancelled), a season date replaced by another (series_date_substituted), or a payment that settled after the date it was for and was bound to the next one (paid_after_window). |

## `list_plans`

Read · requires `project-subscription-plan:view-any`

Lists subscription plans, optionally narrowed to one project via `project_id`. Paginates with `limit` (1..100, default 25) and `page` (default 1). Every row carries a `kind` — subscription, pass or pass_series — and that kind names the ONE nested block accompanying it: `billing` (cycle, trial, renewal), `pass` (timezone, recurrence, sales cutoff, next sellable window) or `pass_series` (span, window count, seats, successor). The other two are absent, so a billing cycle never appears on a plan where the cycle means nothing. Every row also carries `cadence`, the human-readable duration string the portal and bot show. Use to discover plan ids before calling `get_plan_performance`, `list_access_codes`, `bulk_generate_access_codes`, `cancel_subscription`, or `list_pass_windows`.

**Arguments**

- `project_id` (string): Optional project UUID to narrow the list to a single project.
- `limit` (integer): Maximum plans to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_plan`

Read · requires `project-subscription-plan:view`

Fetches one subscription plan by UUID. Same row shape as `list_plans`: the row carries a `kind` — subscription, pass or pass_series — and that kind names the ONE nested block accompanying it (`billing`, `pass` or `pass_series`), plus `cadence`, the human-readable duration string the portal and bot show. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `plan_id` (string, required): UUID of the plan to fetch.

## `create_plan`

Additive · requires `project-subscription-plan:create` · open world

Creates a subscription plan on a project. Every plan has a `kind`, and the kind decides which ONE nested object you must send with it: `subscription` takes `billing`, `pass` takes `pass`, `pass_series` takes `pass_series`. Sending a block that does not match the kind is rejected. `currency_id` must be supported by an active payment method on the project. The user-type restriction flags inside `eligibility` (`newcomers_only`, `customers_only`, `churned_only`) are mutually exclusive. Defaults: `kind=subscription`, `active=true`. Emits `plan.created`. KIND subscription: access begins at payment and renews on a cycle; `resources` is required; `billing.billing_cycle=lifetime` requires `billing_cycle_count=1`. KIND pass: sells ONE scheduled access window per purchase; `resources` is required; supply `pass.timezone`, `pass.recurrence` and `pass.slots`, where each slot carries its own `duration_minutes` so one plan can mix a 3-hour and a 14-hour window. KIND pass_series: sells a curated slate of OTHER pass plans' windows for one payment — a season ticket; it owns no windows of its own, so `pass_series.window_ids` must name windows that already exist (use the `list_pass_windows` tool to find them) and `resources` is OPTIONAL, meaning a lounge open for the whole span rather than the thing being sold. Passes and series both require Time-Limited Passes, bundled with Growth or available as the Passes Addon; on any other tier the call is rejected.

**Arguments**

- `project_id` (string, required): UUID of the parent project.
- `kind` (string, required): subscription (access starts at payment and renews on a cycle), pass (one dated access window per purchase), or pass_series (a season ticket over many of your pass plans' windows). Defaults to subscription. Decides which nested block below is required.
- `name` (string, required): Plan name (min 5, max 255 chars, unique per project).
- `currency_id` (string, required): UUID of the currency. Must be supported by an active payment method on the project.
- `price` (number, required): What one purchase costs, as a decimal. On a pass this buys one window; on a pass_series it buys the whole slate, once. At least the $1.00 USD equivalent — payment providers reject smaller amounts. 0 publishes a free plan and requires the Starter or Growth tier.
- `resources` (array of any): UUIDs of project_resources this plan grants access to. Required on kind subscription and kind pass. OPTIONAL on kind pass_series, where it means a lounge the holder keeps for the whole span — each pass in a series already grants its own plan's resources.
- `description` (string): Optional plan description. Max 1000 chars, HTML is filtered.
- `active` (boolean): Defaults to true. Set false to create in draft state.
- `sales_cap` (integer): Optional. Pause the plan automatically after this many successful purchases (1-100000); the creator publishes it again for another batch. Omit or null for no limit.
- `eligibility` (object): Audience restrictions: {newcomers_only?: bool, customers_only?: bool, churned_only?: bool, single_use?: bool, access_codes_only?: bool}. The first three are mutually exclusive.
- `billing` (object): REQUIRED when kind=subscription, refused otherwise. {billing_cycle: days|weeks|months|years|lifetime, billing_cycle_count: int 1-99, recurring?: bool, disabled_renewal?: bool, trial_days?: int 0-365, trial_cardless?: bool, trial_type?: string}. lifetime requires billing_cycle_count=1. recurring must be false for crypto / platform currencies.
- `pass` (object): REQUIRED when kind=pass, refused otherwise. {timezone: IANA zone e.g. America/New_York, schedule_mode?: repeating|fixed, recurrence?: daily|weekly|monthly, recurrence_ends_at?: ISO-8601, sales_cutoff_minutes?: int, sales_cutoff_anchor?: before_start|before_end, slots?: array, windows?: array}. Slot times are local wall-clock in `timezone` and survive daylight saving. Each slot is {weekday?: 0-6 with 0=Sunday, day_of_month?: 1-31, start_time: "HH:MM", duration_minutes: int} — each carries its own duration, so a plan can mix lengths, and a day_of_month of 29-31 skips months that lack the day. `windows` places explicit dates for schedule_mode=fixed: {starts_at: "YYYY-MM-DD HH:MM", duration_minutes: int}. sales_cutoff_anchor before_start (default) stops sales that many minutes before a window opens; before_end keeps it on sale while it runs, requires at least 1, and must be under the shortest slot duration_minutes.
- `pass_series` (object): REQUIRED when kind=pass_series, refused otherwise. {window_ids: array of pass-window UUIDs, prevent_overlaps?: bool, sales_cutoff_minutes?: int, sales_cutoff_anchor?: before_start|before_first_end|before_last_start|before_end, seat_cap?: int, successor_plan_id?: UUID, presale_hours?: int 1-8760, blackout_window_ids?: array, rules?: array}. A series points at windows that ALREADY EXIST on your pass plans — it never creates any — so get their UUIDs from the `list_pass_windows` tool first. Needs at least two windows, or a rule that will find them. `rules` grows the slate automatically and keeps doing so after holders have bought, granting new matches to them at no charge: each rule is {source_plan_id: UUID of a pass plan, kind: date_range|next_n, from_at?: ISO-8601, to_at?: ISO-8601, take?: int}, where date_range takes every window starting in the period and next_n takes the next `take` windows and then stops. sales_cutoff_anchor before_start closes sales before the FIRST window opens; before_first_end keeps the season on sale into that opening window and closes a set number of minutes (at least 5) before it ends, so a latecomer can still join on the night; before_last_start keeps it on sale until the LAST window opens, so a buyer always gets at least one whole date; before_end keeps the season on sale right through, closing before the LAST window ends. All three sell at full price for whatever remains, and windows that already ran are never issued.

## `update_plan`

Destructive · requires `project-subscription-plan:update` · idempotent · open world

Changes one or more fields of an existing plan; anything you omit keeps its stored value. Requires `plan_id`. Optional: `name`, `description`, `price`, `currency_id`, `active`, `eligibility`, `resources` (the full list of resource UUIDs the plan grants — it REPLACES the current list), and the ONE nested block the plan's `kind` names: `billing` for a subscription, `pass` for a pass, `pass_series` for a season (same fields as `create_plan`; a block of another kind is refused). `kind` itself cannot change — create a new plan instead. Emits `plan.updated`; to flip `active` alone with its own `plan.activated` / `plan.deactivated` event, call `publish_plan`. Refused with `TEAM_TIER_REQUIRED` when the change needs a tier the project owner lacks (a free price, time-limited passes), with `VALIDATION_FAILED` per field otherwise. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `plan_id` (string, required): UUID of the plan to change.
- `name` (string): Plan name (min 5, max 255 chars, unique per project).
- `description` (string): Plan description. Max 1000 chars, HTML is filtered. Pass an empty string to clear.
- `price` (number): What one purchase costs, as a decimal. At least the $1.00 USD equivalent unless 0, which makes the plan free and requires the Starter or Growth tier.
- `currency_id` (string): UUID of the currency. Must be supported by an active payment method on the project.
- `active` (boolean): true publishes the plan, false takes it off sale; existing subscriptions keep running either way.
- `sales_cap` (integer): Pause the plan automatically after this many successful purchases (1-100000). Changing it restarts the count; null removes the limit.
- `eligibility` (object): Audience restrictions: {newcomers_only?: bool, customers_only?: bool, churned_only?: bool, single_use?: bool, access_codes_only?: bool}. The first three are mutually exclusive.
- `resources` (array of any): The full list of project_resources UUIDs this plan grants access to; replaces the current list. Must not be empty on kind subscription or kind pass.
- `billing` (object): Only on a plan of kind subscription. {billing_cycle: days|weeks|months|years|lifetime, billing_cycle_count: int 1-99, recurring?: bool, disabled_renewal?: bool, trial_days?: int 0-365, trial_cardless?: bool, trial_type?: string}. lifetime requires billing_cycle_count=1.
- `pass` (object): Only on a plan of kind pass. {timezone: IANA zone, schedule_mode?: repeating|fixed, recurrence?: daily|weekly|monthly, recurrence_ends_at?: ISO-8601, sales_cutoff_minutes?: int, sales_cutoff_anchor?: before_start|before_end, slots?: array, windows?: array}; the same shape `create_plan` documents.
- `pass_series` (object): Only on a plan of kind pass_series. {window_ids?: array of pass-window UUIDs, prevent_overlaps?: bool, sales_cutoff_minutes?: int, sales_cutoff_anchor?: string, seat_cap?: int, successor_plan_id?: UUID, presale_hours?: int, blackout_window_ids?: array, rules?: array}; the same shape `create_plan` documents. Window ids come from `list_pass_windows`.

## `delete_plan`

Destructive · requires `project-subscription-plan:delete` · idempotent

Soft-deletes a plan so it disappears from the portal, the bot and every list; existing subscriptions keep their history and keep running to their end. Requires `plan_id`. DESTRUCTIVE: you MUST confirm the target `plan_id` with a human before calling. A pass plan is refused with `VALIDATION_FAILED` while customers hold access windows that have not run yet — call `publish_plan` with `active=false` instead, which stops new sales while the purchased windows still run. Emits `plan.deleted`. Idempotent — an already-deleted id surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope id does.

**Arguments**

- `plan_id` (string, required): UUID of the plan to delete.

## `publish_plan`

Destructive · requires `project-subscription-plan:update` · idempotent · open world

Flips a plan's `active` flag. Pass `active=true` to publish (the plan starts accepting checkouts), `active=false` to unpublish (existing subscriptions keep running, but no new checkouts can start). Defaults to `true`. Idempotent — re-calling on a plan already in the target state is a no-op. Emits `plan.activated` or `plan.deactivated`. Plans priced at `0` can only be sold on the Starter and Growth tiers, so publishing one on the Free tier is refused with `TEAM_TIER_REQUIRED` and the plan must be given a price first. Unpublishing is always allowed.

**Arguments**

- `plan_id` (string, required): UUID of the plan to flip.
- `active` (boolean): Target state — true publishes, false unpublishes. Defaults to true.

## `reorder_plans`

Destructive · requires `project-subscription-plan:update` · idempotent · open world

Pins the order a project's plans appear in on the public portal and in the project's bot. Pass `plan_ids` in the order buyers should see them; plans left out keep the built-in order (passes, then seasons, then subscriptions, cheapest first) after the pinned ones. Pass an empty list to clear every pin and return to the built-in order. Only active plans are shown to buyers, but inactive ones may be pinned so they take their place when published. Idempotent. Emits `plan.order_changed`. An id from another project is refused with `VALIDATION_FAILED`.

**Arguments**

- `project_id` (string, required): UUID of the project whose storefront is arranged.
- `plan_ids` (array of any, required): Plan UUIDs in the order buyers should see them. Empty clears every pin and restores the built-in order.

## `sync_payment_method_plans`

Destructive · requires `project-payment-method:update` · idempotent · open world

Queues a push of the project owner's plans into a payment method's gateway catalogue (Stripe products and prices, Polar products, Kelviq plans, PayPal, Razorpay or CoinPayments plans). Requires `project_id` and `payment_method_id`. Answers with status "sync_queued": the work runs in the background and each plan reports through the plan-sync webhook events as it lands. A gateway that keeps no catalogue (connector currencies, access codes, the redirect gateways) is refused with `VALIDATION_FAILED`. Idempotent — queuing twice pushes the same catalogue twice. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method whose gateway catalogue to refresh.

## `list_pass_windows`

Read · requires `pass-window:view-any`

Lists the dated access windows a time-limited pass plan generates, with their UUIDs. Narrow with `plan_id` (one pass plan) or `project_id` (every pass plan on a project), and with `status` (scheduled, open, closed, canceled) or `from`/`to` ISO-8601 bounds. Paginates with `limit` (1..100, default 50) and `page`. Each row carries the window id, the plan it belongs to, its start and end in UTC plus the plan's authoring timezone, its status, whether it is currently on sale, and how many purchases hold it. THIS IS THE TOOL THAT MAKES A PASS SERIES AUTHORABLE: `create_plan` with kind=pass_series takes `pass_series.window_ids`, and a series points at windows that already exist rather than creating any, so their UUIDs have to come from here first. Also useful for reconciling a schedule into an external calendar, or checking what is still sellable before pointing a customer at a plan.

**Arguments**

- `plan_id` (string): UUID of one time-limited pass plan. Takes precedence over project_id.
- `project_id` (string): UUID of a project, to list windows across every pass plan on it.
- `status` (string): Filter by lifecycle state: scheduled (not yet open), open (running now), closed (finished), canceled.
- `from` (string): Only windows starting at or after this ISO-8601 timestamp.
- `to` (string): Only windows starting at or before this ISO-8601 timestamp.
- `limit` (integer): Maximum windows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_pass_window`

Read · requires `pass-window:view`

Fetches one dated access window of a project's pass plans by UUID. Requires `project_id` and `window_id`. Same row shape as `list_pass_windows`: the instant it opens and closes, its local range in the plan's timezone, its lifecycle `status`, whether it is `sellable` right now and how many `holders` bought it. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose pass plans own the window.
- `window_id` (string, required): UUID of the window to fetch.

## `create_pass_window`

Additive · requires `pass-window:create` · open world

Places one dated access window by hand on a time-limited pass plan, marked manual so a schedule rebuild keeps it. Requires `plan_id` (a plan of kind `pass`), `starts_at` (ISO 8601; a value without an offset is read in the plan's own timezone) and `duration_minutes` (a whole number of at least 1; the plan's configured floor and ceiling apply). Refused with `VALIDATION_FAILED` for a plan that is not a pass, a start in the past, a length outside the bounds or a start the plan already has. Emits `pass.window_scheduled`. Returns the new window in the `get_pass_window` row shape. Unknown, foreign or out-of-scope plan ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `plan_id` (string, required): UUID of the pass plan to place the window on.
- `starts_at` (string, required): ISO 8601 instant the window opens. Without an offset it is read in the plan's own timezone.
- `duration_minutes` (integer, required): How long the window runs, in whole minutes.

## `cancel_pass_window`

Destructive · requires `pass-window:delete` · idempotent

Cancels one dated access window and resettles everyone holding it. Single-date holders are moved to the plan's next window on sale, or have their pass ended and flagged for a refund when the schedule has nothing left. Season-ticket holders follow `series_holders`: `substitute` (the default) moves them to the next window on sale too, keeping their season at the same length; `drop` removes the cancelled date from their season, leaves the rest standing and reports what the date was worth per holder. Requires `project_id` and `window_id`. DESTRUCTIVE: you MUST confirm the target `window_id` and the `series_holders` choice with a human before calling — holders are messaged with the amounts and money may be owed. Emits `pass.window_cancelled`, plus a `pass.holder_moved`, `pass.holder_stranded`, `pass_series.leg_substituted` or `pass_series.leg_dropped` event per holder. Returns the cancelled window row with `meta.rebound`, `meta.refund_due`, `meta.legs_dropped`, `meta.series_holders`, `meta.refunds` (one row per holder owed a decision: the member, the reason, what they paid and what the date was worth, in the holder's own currency) and `meta.refund_totals` per currency; Subscriby never moves the refunds itself. Idempotent — an already-cancelled window is answered with zero tallies. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`; an unknown `series_holders` as `VALIDATION_FAILED`.

**Arguments**

- `project_id` (string, required): UUID of the project whose pass plans own the window.
- `window_id` (string, required): UUID of the window to cancel.
- `series_holders` (one of `substitute`, `drop`): What happens to season-ticket holders of the window: "substitute" (the default) moves them to the plan's next window on sale, keeping their season at the same length; "drop" removes the cancelled date from their season, leaves the rest standing and reports what the date was worth per holder. Single-date holders are always moved where a window is on sale.

## `remind_pass_window_queue`

Additive · requires `pass-window:update` · idempotent

Nudges everyone who bought a window but has not come through their grant yet, re-sending it. Requires `project_id` and `window_id`. Answers with how many holders the connector accepted the message for; a window that has ended or been cancelled reminds nobody and answers 0. THIS MESSAGES REAL PEOPLE: confirm with the creator before calling and do not repeat it within the same window. For one holder, call `remind_pass_holder`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose pass plans own the window.
- `window_id` (string, required): UUID of the window whose missing holders to nudge.

## `remind_pass_holder`

Additive · requires `project-subscription:update` · idempotent

Nudges ONE pass holder who bought a window but has not come through their grant yet, re-sending it. Requires `subscription_id`. Answers `reminded: true` when the connector accepted the message, `reminded: false` when there was nothing to send — the subscription holds no window, the window has ended or been cancelled, the holder has already queued, or they are unreachable on their connector — which is a normal answer, not an error. THIS MESSAGES A REAL PERSON: read the subscription back first and do not repeat the nudge within the same window. To remind everyone still missing from a window at once, call `remind_pass_window_queue`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the pass holder's subscription.

## `start_next_season`

Additive · requires `project-subscription-plan:create` · open world

Duplicates a finished pass series into its next season: a NEW inactive pass_series plan with the same price, settings, resources and rules but an empty slate, linked from the old season as its successor so the presale reaches every current holder. Requires `plan_id` of a plan whose kind is `pass_series`; any other kind is refused with `VALIDATION_FAILED`. Emits `plan.created`. Not idempotent — every call creates another season, so call it once per season. Then add dates to the new slate with `update_plan` (the `pass_series.window_ids` or `rules`) and put it on sale with `publish_plan`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `plan_id` (string, required): UUID of the finished pass_series plan to duplicate into its next season.

## `get_pass_roster`

Read · requires `project-user:view-any`

Reads a project's Pass Roster: its members against the dates its pass and series plans sell, one row per member with their standing on each date they hold (in, queued, holds, missed, ended or covered) and the cancelled dates they were moved off with where they went, plus the columns under `meta.dates`, the dates beyond the span that holders were moved onto under `meta.moved_to_dates`, and every move off a column folded by destination under `meta.relocations`. Requires `project_id`. Narrow with `plan_id` (one pass or series plan of the project), with a search text (a name or email fragment), and with `from` and `to` ISO-8601 bounds on the span, which is eight weeks either side of now when neither is given. Paginates with `limit` (1..100, default 25) and `page`, members by name. Use it to answer who holds which date, who was rolled over from a cancelled date and to where, and who still has not joined the queue for a date; `get_subscriber` reads one member in full and `list_pass_moves` one purchase's whole trail. Reads under `project-user:view-any`; each member's address is returned verbatim, as `list_subscribers` warns, so quote it only when the creator asked.

**Arguments**

- `project_id` (string, required): UUID of the project whose roster to read.
- `plan_id` (string): UUID of one pass or series plan of the project, to keep to its dates and holders.
- `search` (string): Keep the members whose name or email contains this text (up to 100 characters).
- `from` (string): ISO-8601 instant: only dates ending at or after it are columns. Eight weeks before now when omitted.
- `to` (string): ISO-8601 instant: only dates starting at or before it are columns. Eight weeks after now when omitted.
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_pass_moves`

Read · requires `project-subscription:view`

Lists every hop one purchase's passes made, oldest first, from the project's pass move log: a date cancelled and the holder rolled forward (window_cancelled), a season date replaced by another (series_date_substituted), or a payment that settled after the date it was for and was bound to the next one (paid_after_window). Requires `subscription_id`. Each hop names both dates by id and as a person reads them in the plan's zone, who made it (null when the platform did on its own) and when; the ledger keeps only a pass's last move, the log keeps them all, so a pass moved twice answers two rows and an empty list means the purchase's passes never moved. Reads under `project-subscription:view`; `get_pass_roster` shows the same hops as departures across every member, and `get_subscription` the purchase itself.

**Arguments**

- `subscription_id` (string, required): UUID of the purchase whose passes' moves to list.
