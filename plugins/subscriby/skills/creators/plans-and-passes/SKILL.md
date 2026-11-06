---
name: plans-and-passes
description: This skill should be used when the user asks to create, price, edit, publish, reorder or delete a plan, set a billing cycle or trial, restrict who can buy, sell a time-limited pass or a pass series, schedule or cancel access windows, remind pass holders, start a next season, or sync plans to a provider.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Plans, passes and pass series

A plan is the product a member buys. It has one `kind`, and the kind decides the rest of the shape:

| Kind | Sells | Renews |
| --- | --- | --- |
| `subscription` | Access from the moment of payment, for a billing cycle; recurring or one-time. | On a cycle when recurring |
| `pass` | One dated window of access: a match day, a workshop, a session. Buyers pay ahead, are admitted when it opens and removed when it closes. | Never |
| `pass_series` | A season ticket: one payment for a slate of windows drawn from the project's pass plans. | Never |

Passes and series are unlocked by one capability: included in the Growth Plan, or on the Free and Starter Plans through the Passes Addon; neither carries an extra transaction fee. A plan is saved as exactly one kind.

## Every plan

`create_plan` takes `kind`, `name` (5 to 255 characters, unique in the project), `currency_id` (one an active payment method supports), `price` (at least the one-dollar equivalent; 0 publishes a free plan on Starter and Growth), `resources` (at least one for a subscription or a pass), an optional `description` (HTML filtered), `active` (false creates a draft), `sales_cap` (1 to 100,000; the plan pauses itself after that many paid purchases and shows Sold Out; codes and cardless trials do not count) and `eligibility`: `newcomers_only`, `customers_only`, `churned_only` (one at most; introductory, VIP and win-back offers), `single_use` (hidden after one purchase), `access_codes_only` (never shown; reachable by code alone).

`update_plan` changes any of them; a price change applies at the next renewal, a resource change at once, an eligibility change to new purchases only. `publish_plan` with `active` true puts a plan on sale and with `active` false takes it off (existing subscriptions keep running); publishing a free plan on the Free Plan is refused. `delete_plan` is permanent; unpublish instead for anything that had members. `reorder_plans` pins the storefront order (`plan_ids` in the order buyers see; an empty list restores passes, then seasons, then subscriptions, cheapest first); `update_project` with `storefront_arrangement: live` lets the storefront order itself by what is happening now (Growth or the Passes Addon).

Providers with a catalogue (Stripe, PayPal, Polar, Kelviq, CoinPayments, Razorpay) receive a plan the moment it goes on sale; `sync_payment_method_plans` re-pushes everything after a provider was connected late.

## A subscription's billing block

`billing` is required for `kind: subscription` and refused otherwise: `billing_cycle` (`days`, `weeks`, `months`, `years`, `lifetime`) with `billing_cycle_count` (1 to 99; 1 for lifetime), `recurring` (default true; false makes a one-time purchase, and false is mandatory for a crypto or platform currency, which never renews; the providers that renew are Stripe, PayPal, Polar, Mollie, Kelviq, Paystack and Razorpay), `disabled_renewal` (true lets existing members keep renewing after the plan is unpublished: grandfathering), `trial_days` (0 to 365), `trial_cardless` (no card up front; access stops at the end unless they convert) and `trial_type` (`project`: one trial across the project; `plan`: one per plan).

Recipes the docs use: a monthly plan (`months`, 1, recurring), an annual plan (`years`, 1), a lifetime deal (`lifetime`, recurring false, `single_use`), a seven-day trial (`trial_days` 7, project-wide, card on file), a win-back (`churned_only`, `single_use`), an access-code-only gift (`access_codes_only`, recurring false).

## A pass's schedule block

`pass` is required for `kind: pass`: `timezone` (an IANA zone; every time is wall-clock there and survives daylight saving; the creator must have confirmed their timezone in Localization settings before a pass can go on sale, and a new pass plan is created switched off so the generated dates are seen first), `schedule_mode` (`repeating` builds windows from a pattern; `fixed` places each date by hand), `recurrence` (`daily`, `weekly`, `monthly`), `recurrence_ends_at`, `slots` (each `{weekday 0..6 with 0 Sunday | day_of_month 1..31, start_time "HH:MM", duration_minutes}`; every slot carries its own length; a day of the month of 29, 30 or 31 skips the months without it, so pick 28 or lower for every month), `windows` for a fixed schedule (`{starts_at "YYYY-MM-DD HH:MM", duration_minutes}`), and the cutoff: `sales_cutoff_minutes` with `sales_cutoff_anchor` `before_start` (default; nothing sells once the window runs) or `before_end` (the window keeps selling while it runs at full price; at least 1 minute and under the shortest slot). A mid-window buyer pays the full price for what is left; that is deliberate.

Windows: `list_pass_windows` (by `plan_id` or `project_id`, `status`, `from`, `to`) and `get_pass_window` read them with their holders and the queue count; `create_pass_window` places a manual window (future start, within the plan's length bounds, no duplicate start; kept through schedule rebuilds); `cancel_pass_window` withdraws one and resettles its holders (single-date holders move to the plan's next window on sale, or have the pass ended and flagged for a refund; season holders follow `series_holders`: `substitute` moves them, `drop` removes the date and reports what it was worth), messaging everyone, so confirm the window and the choice with the user; `remind_pass_window_queue` re-sends the grant to every holder who has not come through it yet, and `remind_pass_holder` to one (`subscription_id`). Both message real people: confirm first, never repeat within the same window.

A cancelled pass purchase releases that date back on sale for that member; a refund is made at the provider. A payment that settles after its window binds the pass to the next date and records the move; the member's flyout shows every hop.

## A series' slate block

`pass_series` is required for `kind: pass_series`: `window_ids` (windows that already exist on the project's pass plans, read from `list_pass_windows`; a series never creates or destroys a date; at least two, or a rule), `rules` (each `{source_plan_id, kind date_range | next_n, from_at, to_at, take}`; a rule keeps taking new matching windows in, and grants them to existing holders at no charge), `prevent_overlaps` (default on), `seat_cap` (holders who actually hold; zero is refused; the plan pauses itself at Seats Full), the cutoff `sales_cutoff_minutes` with `sales_cutoff_anchor` `before_start` (off sale before the first window opens), `before_first_end` (sells into the opening session, closing at least 5 minutes before it ends), `before_last_start` (sells until the last window opens, so a buyer always gets one whole date) or `before_end` (sells right through); a mid-season buyer pays the full price for the remainder. `successor_plan_id` and `presale_hours` (1 to 8,760) give current holders the next season to themselves first; who is invited is decided when the season ends, not at purchase. `blackout_window_ids` leave dates out.

The `resources` of a series are a **lounge** the holder keeps for the whole span (a holders-only chat), never the channels its slate passes open: linking those hands every holder a permanent key at purchase, the one mistake that costs money. Each date grants through its own pass plan.

`start_next_season` duplicates a finished series into a new inactive season with the same price, settings, resources and rules and an empty slate, linked as the successor; call it once (every call makes another season), fill the slate with `update_plan` (`pass_series.window_ids` or `rules`), then `publish_plan`.

## Do not

- Do not create a pass or a series before the creator confirmed their timezone; the create succeeds, the sale is refused.
- Do not link slate channels as a series' resources.
- Do not cancel a window, remind a queue or start a season without the confirmation; two of them message real people and one creates a plan every time.
- Do not set `recurring` on a crypto or platform currency, or a lifetime cycle with a count other than 1.

## References

- [references/tools.md](references/tools.md): the fifteen tools with every nested field.
- [references/events.md](references/events.md): the `plan.*`, `pass.*` and `pass_series.*` events (windows scheduled, opened, closed and cancelled; holders queued, moved, missed and stranded; legs added, completed, substituted and dropped; seats exhausted; presale opened).
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/plans` and `/pass-windows`.
- [references/abilities.md](references/abilities.md): the `passes` abilities.
- Documentation: [Subscription plans](https://docs.subscriby.net/creators/plans), [Time-Limited Passes](https://docs.subscriby.net/creators/time-limited-passes), [Pass Series](https://docs.subscriby.net/creators/pass-series), [the Passes Addon](https://docs.subscriby.net/addons/passes), [currency conversion](https://docs.subscriby.net/payments/currency-conversion).
