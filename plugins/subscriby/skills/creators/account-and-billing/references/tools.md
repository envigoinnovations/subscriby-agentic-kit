# Tools: Account and Billing

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_me` | read | `account:read` | Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). |
| `list_notifications` | read | `account:read` | Lists the notification centre of the creator this token acts for: every alert the platform sent them (a sale, a support backlog, a bot or channel that went silent, a billing or security notice, a pass window, an onboarding nudge), newest first, each with its `class`, `title`, `body`, where it points (`route` + `params` for a client that maps screens, `url` for one that does not) and whether it was read. |
| `mark_notification_read` | additive | `account:write` | Marks one entry of the creator's notification centre as read, so the dashboard bell stops counting it. |
| `mark_all_notifications_read` | additive | `account:write` | Marks every unread entry of the creator's notification centre as read in one call and answers how many it marked (`marked`). |
| `get_alert_destinations` | read | `account:read` | Lists where the authenticated creator's alerts go: each destination's kind ("connector_identity" or "email"), target, the alert classes routed to it (null means every class, an empty list means none), whether it is the primary connected account, and when it was verified. |
| `update_alert_destinations` | destructive | `account:write` | Replaces the full set of places the authenticated creator's alerts go. |
| `request_account_export` | additive | `account:export` | Queues an archive of everything the creator's account holds: the account as `get_me` describes it, the webhook endpoints, the platform subscription with its invoices, and for every project the plans, resources, payment methods, members, subscriptions, payments, coupons, dated windows and support conversations, as JSON files in the REST API's shapes plus one workbook per project. |
| `get_account_export` | read | `account:export` | Returns the creator's most recent account export: its `status` (`queued`, `building`, `ready`, `failed` or `expired`), when it was requested and finished, its size and project count, and, while `ready`, a signed `download_url` with `download_url_expires_at`. |
| `get_partner_program` | read | `account:read` | Describes where the creator this token belongs to stands in the Partner Program, Subscriby's own programme where a creator earns a share of every invoice paid by the creators they bring to Subscriby: the `status` (`applied` under review, `active`, `rejected` with `reapply_available_at`, `suspended`), and once approved the partner `code`, the `links` to hand out (the web link and one deep link per connector), the commission ladder (`commission_percent` now, `base_percent`, `max_percent`, the commitment and volume points, `paying_referrals` and the next volume tier), the referral tallies by state, the `balance` (pending, payable, credited, paid, earned, decimal strings in USD), the `payout_method` with `payout_details_complete` (the destination itself is never returned), the tax declaration, the terms acceptance and every promotion commitment with its proof state. |
| `get_partner_referral` | read | `account:read` | Fetches one of the authenticated partner's referrals by UUID: who signed up through the link or code, its status, the conversion window and what the conversion earned. |
| `list_partner_referrals` | read | `account:read` | Lists the creators the token's creator brought to Subscriby as a partner, newest first: each with the referred creator's display name (never their email or id), how they arrived (`source` is `link`, `code_at_signup` or `bot_deep_link`), whether their first paid invoice converted them (`status` is `signed_up`, `converted`, `under_review`, `expired` or `rejected`), the plan they converted on, the rate locked onto them and until when the partner earns on them. |
| `list_partner_rewards` | read | `account:read` | Lists the token's creator's Partner Program commission ledger, newest first: one row per paid invoice of a creator they referred (`kind` is `commission`), priced from the invoice's total before tax and after discount (`base_amount`) at the referral's locked rate (`amount`, a decimal string in USD), plus the clawbacks that answer a reversal of money already settled (`kind` is `clawback`, a negative `amount`). |
| `list_partner_payouts` | read | `account:read` | Lists the cash payouts Subscriby made to the token's creator as a partner, newest first: the `amount` (a decimal string in USD), the rail the money went by (`method` is `paypal`, `wise`, `remitly` or `crypto`), the transfer's `reference`, when it left and how many commissions it covered (`rewards_paid`). |
| `update_partner_payout_details` | destructive | `account:write` | Writes how the token's creator is paid as a partner: `method` (`credit` for Subscriby Credit on their own invoices while that rail is open, `paypal`, `wise`, `remitly` or `crypto` for USDT on TRC20), `details` (the PayPal email or the wallet address, for `paypal` and `crypto`), the bank account for `wise` and `remitly` (`bank_holder`, `bank_name`, `bank_country`, `bank_account_number`, optional `bank_swift`, `bank_branch_code`, `bank_address`), the tax declaration every cash rail needs (`legal_name`, `tax_country`, optional `us_person`) and `accept_terms` (true to accept the Partner Program Terms with this save; a rail cannot be saved until they are accepted). |
| `accept_partner_terms` | additive | `account:write` | Records that the token's creator accepts the Partner Program Terms as they stand today, which every payout rail requires; accepting again after the terms change is the same call. |
| `list_transaction_fees` | read | `account:read` | Lists the transaction fees Subscriby charged the creator this token belongs to, newest first, one row per fee: `kind` says what it was for (`payment_fee`, the commission on a member's payment; `access_code_fee`, a code redeemed past the plan's free allotment; `trial_usage`, the metered fees a platform trial waived, collected once it ended; `outage_emails`, emails sent to members during a recovery; `processing_recovery`, the cost of collecting an invoice's fee lines), `channel` how it was collected ("connect_at_source", deducted from the member's payment by Stripe Connect and never invoiced, or "metered", reported to the usage meter and billed on the creator's own Subscriby invoice), and each row carries the project, the member and the payment where there was one, the gross amount and the rate, `fee_amount` as a decimal string in the creator's billing currency, the meter `units`, and `invoice_id` with `invoiced_at` once a paid Subscriby invoice billed a metered line. |
| `get_transaction_fee_summary` | read | `account:read` | Adds up one calendar month of the transaction fees Subscriby charged the creator this token belongs to: `total_fee`, `at_source_fee` (deducted from members' payments by Stripe Connect, never invoiced), `metered_fee` (reported to the usage meter and billed on the creator's own Subscriby invoice; the figure to hold against the invoice's Transaction Fees line) with `metered_units`, `invoiced_fee` and `awaiting_invoice_fee`, every amount a decimal string in the creator's billing currency, plus `by_kind` (one row per kind of fee with its label, sum, units and line count), `by_project` (largest first; the fees no project carries pool under a null id) and `invoices` (the Subscriby invoices that billed the month's metered lines, newest first). |
| `get_copilot_credits` | read | `account:read` | Describes the Copilot Credits of the creator this token belongs to, in one object: `balance` (`total_cents`, `free_cents` spent first, `paid_cents` which never lapses, `lapsing_cents` with `lapsing_at`, `exhausted`), `allowance` (this month's free operator turns and member answers, used and left), this month's `turns_this_month`, `suggestions_this_month`, `answers_this_month` and `paid_spent_this_month_cents`, the prices (`price_turn_cents`, `price_suggestion_cents`, `price_answer_cents`, with `long_turn_steps` and `max_turn_steps`), `low_balance_cents`, the `packs` on sale and the `settings` (auto top-up and monthly cap). |
| `list_copilot_credits_statement` | read | `account:read` | Pages the Copilot Credits statement of the creator this token belongs to, newest first: every pack bought and its bonus, every promotion and goodwill grant, every refund and lapse, and each month's usage per kind, each line with its `kind`, `cents` (positive for credit, negative for debit), `at`, `label`, `expires_at` on a free grant, and `units` with `usage_kind` on a usage line. |
| `create_copilot_credits_pack` | additive | `account:write` | Opens the purchase of a pack of Copilot Credits for the creator this token belongs to and answers the Stripe Checkout URL to send them to, with the pack's `paid_cents` and `bonus_cents`; nothing is charged and no credit lands until the creator pays on that page, and the card they pay with is saved for the auto top-up. |
| `update_copilot_credits_settings` | destructive | `account:write` | Changes the Copilot Credits settings of the creator this token belongs to; anything you omit keeps its stored value. |
| `list_tokens` | read | `token:view-any` | Lists the authenticated user's own personal access tokens. |
| `get_token` | read | `token:view` | Fetches one of the authenticated user's own personal access tokens by UUID: its name, gate abilities, team and project scopes, last use and expiry. |
| `create_token` | destructive | `token:create` | Mints a personal access token: a `name`, the `abilities` it holds (each a value from the ability catalog, and never more than the calling token itself holds — "token:create" is refused unconditionally), and the `team_id` it is minted for, which must be a team the caller owns or belongs to and becomes the token's frozen scope. |
| `revoke_token` | destructive | `token:delete` | Revokes one of the authenticated user's own personal access tokens by id. |
| `get_job_status` | read | none | Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. |

## `get_me`

Read · requires `account:read`

Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). Call it first to learn who you are acting as. Takes no input.

**Arguments**

- none

## `list_notifications`

Read · requires `account:read`

Lists the notification centre of the creator this token acts for: every alert the platform sent them (a sale, a support backlog, a bot or channel that went silent, a billing or security notice, a pass window, an onboarding nudge), newest first, each with its `class`, `title`, `body`, where it points (`route` + `params` for a client that maps screens, `url` for one that does not) and whether it was read. `unread` narrows to what they have not opened (`true`) or already have (`false`); `class` narrows to one class (`sales`, `support`, `recovery`, `billing`, `security`, `passes`, `onboarding`); `query` to entries whose title or body contains the words; `limit` (1..100, default 25) and `page` page it. Answers "what has happened on my account that I have not looked at?". Mark an entry read with `mark_notification_read`, or everything with `mark_all_notifications_read`.

**Arguments**

- `unread` (boolean): `true` for entries not yet read, `false` for entries already read; omit for every entry.
- `class` (one of `sales`, `support`, `recovery`, `billing`, `security`, `passes`, `onboarding`, `partner`, `retention`, `copilot`, `broadcasts`): One class of alert, or omit for every class.
- `query` (string): Words a title or body must contain; omit for every entry.
- `limit` (integer): Entries per page (1..100, default 25).
- `page` (integer): 1-indexed page number.

## `mark_notification_read`

Additive · requires `account:write` · idempotent

Marks one entry of the creator's notification centre as read, so the dashboard bell stops counting it. Idempotent: an entry already read keeps its first `read_at`. Takes the `notification_id` from `list_notifications`; an id that is not one of this creator's entries is `RESOURCE_NOT_FOUND`. To clear the whole backlog use `mark_all_notifications_read`.

**Arguments**

- `notification_id` (string, required): UUID of the entry to mark read, from `list_notifications`.

## `mark_all_notifications_read`

Additive · requires `account:write` · idempotent

Marks every unread entry of the creator's notification centre as read in one call and answers how many it marked (`marked`). Idempotent: a second call marks nothing and answers `0`. Use it when the creator has caught up; to mark one entry use `mark_notification_read`. Takes no input.

**Arguments**

- none

## `get_alert_destinations`

Read · requires `account:read`

Lists where the authenticated creator's alerts go: each destination's kind ("connector_identity" or "email"), target, the alert classes routed to it (null means every class, an empty list means none), whether it is the primary connected account, and when it was verified. The same rows Settings or Notifications edits and `GET /v1/me/alert-destinations` returns. Takes no arguments; `get_me` carries the matching "alert_destinations_default" flag.

**Arguments**

- none

## `update_alert_destinations`

Destructive · requires `account:write` · idempotent

Replaces the full set of places the authenticated creator's alerts go. Pass "destinations" as the complete wanted list (max 20) — rows left out are removed, an empty list silences everything. Each row: "kind" ("connector_identity" or "email"), "target" (the connected account's id from `get_me`'s identities, or an email address), and optional "classes" (any of the alert class words; omit or null for every class, an empty list keeps the destination but routes nothing). A target that is not one of the caller's own accounts or addresses is `RESOURCE_NOT_FOUND`; an unknown kind or class is `VALIDATION_FAILED`. Answers the destinations as they now stand, the same rows `get_alert_destinations` reads.

**Arguments**

- `destinations` (array of any, required): The complete wanted list of destinations, at most 20: objects of "kind" ("connector_identity" or "email"), "target", and optional "classes" (alert class words; omit for every class, empty list for none). Rows left out are removed.

## `request_account_export`

Additive · requires `account:export` · open world

Queues an archive of everything the creator's account holds: the account as `get_me` describes it, the webhook endpoints, the platform subscription with its invoices, and for every project the plans, resources, payment methods, members, subscriptions, payments, coupons, dated windows and support conversations, as JSON files in the REST API's shapes plus one workbook per project. ASYNC — returns an `export_id` and a `job_id` immediately; poll `get_job_status` until `status` is `completed`, then call `get_account_export` for the signed `download_url`, which lives a limited time. One export may be in flight per account and one may be requested a day; a refusal is `VALIDATION_FAILED` and says when the next is allowed. Takes no input. Emits no event.

**Arguments**

- none

## `get_account_export`

Read · requires `account:export`

Returns the creator's most recent account export: its `status` (`queued`, `building`, `ready`, `failed` or `expired`), when it was requested and finished, its size and project count, and, while `ready`, a signed `download_url` with `download_url_expires_at`. The same payload as `GET /v1/me/export`. Answers `RESOURCE_NOT_FOUND` when no export was ever requested. Takes no input.

**Arguments**

- none

## `get_partner_program`

Read · requires `account:read`

Describes where the creator this token belongs to stands in the Partner Program, Subscriby's own programme where a creator earns a share of every invoice paid by the creators they bring to Subscriby: the `status` (`applied` under review, `active`, `rejected` with `reapply_available_at`, `suspended`), and once approved the partner `code`, the `links` to hand out (the web link and one deep link per connector), the commission ladder (`commission_percent` now, `base_percent`, `max_percent`, the commitment and volume points, `paying_referrals` and the next volume tier), the referral tallies by state, the `balance` (pending, payable, credited, paid, earned, decimal strings in USD), the `payout_method` with `payout_details_complete` (the destination itself is never returned), the tax declaration, the terms acceptance and every promotion commitment with its proof state. Takes no input. Applying is done on the dashboard or in the bot: a creator who never applied surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- none

## `get_partner_referral`

Read · requires `account:read`

Fetches one of the authenticated partner's referrals by UUID: who signed up through the link or code, its status, the conversion window and what the conversion earned. Same row shape as `list_partner_referrals`. A creator who never applied for the Partner Program, and a referral of another partner, both surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `referral_id` (string, required): UUID of the referral to fetch, from `list_partner_referrals`.

## `list_partner_referrals`

Read · requires `account:read`

Lists the creators the token's creator brought to Subscriby as a partner, newest first: each with the referred creator's display name (never their email or id), how they arrived (`source` is `link`, `code_at_signup` or `bot_deep_link`), whether their first paid invoice converted them (`status` is `signed_up`, `converted`, `under_review`, `expired` or `rejected`), the plan they converted on, the rate locked onto them and until when the partner earns on them. Optional `status`. Paginates with `limit` (1..100, default 25) and `page` (default 1). A creator who never applied to the programme surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `status` (string): Optional filter: "signed_up", "converted", "under_review", "expired" or "rejected".
- `limit` (integer): Maximum referrals to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_partner_rewards`

Read · requires `account:read`

Lists the token's creator's Partner Program commission ledger, newest first: one row per paid invoice of a creator they referred (`kind` is `commission`), priced from the invoice's total before tax and after discount (`base_amount`) at the referral's locked rate (`amount`, a decimal string in USD), plus the clawbacks that answer a reversal of money already settled (`kind` is `clawback`, a negative `amount`). `status` is `pending` (inside the hold), `approved` (payable), `credited` (applied as Subscriby Credit), `paid` (covered by a cash payout) or `reversed`; `note` says why a row was reversed or re-priced. Optional `status`. Paginates with `limit` (1..100, default 25) and `page` (default 1). A creator who never applied to the programme surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `status` (string): Optional filter: "pending", "approved", "credited", "paid" or "reversed".
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_partner_payouts`

Read · requires `account:read`

Lists the cash payouts Subscriby made to the token's creator as a partner, newest first: the `amount` (a decimal string in USD), the rail the money went by (`method` is `paypal`, `wise`, `remitly` or `crypto`), the transfer's `reference`, when it left and how many commissions it covered (`rewards_paid`). Commissions settled as Subscriby Credit are not payouts; read them on `list_partner_rewards` as `credited`. Paginates with `limit` (1..100, default 25) and `page` (default 1). A creator who never applied to the programme surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `limit` (integer): Maximum payouts to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `update_partner_payout_details`

Destructive · requires `account:write` · idempotent

Writes how the token's creator is paid as a partner: `method` (`credit` for Subscriby Credit on their own invoices while that rail is open, `paypal`, `wise`, `remitly` or `crypto` for USDT on TRC20), `details` (the PayPal email or the wallet address, for `paypal` and `crypto`), the bank account for `wise` and `remitly` (`bank_holder`, `bank_name`, `bank_country`, `bank_account_number`, optional `bank_swift`, `bank_branch_code`, `bank_address`), the tax declaration every cash rail needs (`legal_name`, `tax_country`, optional `us_person`) and `accept_terms` (true to accept the Partner Program Terms with this save; a rail cannot be saved until they are accepted). Only the destination the chosen rail uses is kept, encrypted; no tool ever returns it. Answers the partner object as `get_partner_program` describes it. Refused with `VALIDATION_FAILED` when a field is invalid, the terms are not accepted, the credit rail is closed, the detail or the account is missing, or the application is not yet approved; with `RESOURCE_NOT_FOUND` when the creator never applied. Emits no event.

**Arguments**

- `method` (string, required): The rail: "credit", "paypal", "wise", "remitly" or "crypto".
- `details` (string): The PayPal email for "paypal" or the USDT TRC20 wallet address for "crypto"; at most 190 characters. Ignored on the other rails.
- `bank_holder` (string): The name on the bank account, for "wise" and "remitly"; at most 120 characters.
- `bank_name` (string): The bank, for "wise" and "remitly"; at most 120 characters.
- `bank_country` (string): Where the bank is, as a two-letter ISO country code, for "wise" and "remitly".
- `bank_account_number` (string): The account number or IBAN, for "wise" and "remitly": letters, digits, spaces and dashes, at most 40 characters.
- `bank_swift` (string): Optional SWIFT or BIC code, 8 or 11 characters.
- `bank_branch_code` (string): Optional branch, routing, sort or IFSC code: letters, digits, spaces and dashes, at most 20 characters.
- `bank_address` (string): Optional account holder's address, at most 200 characters.
- `legal_name` (string): The name a payment is made out to; required on every cash rail, at most 120 characters.
- `tax_country` (string): The country of tax residence, as a two-letter ISO country code; required on every cash rail.
- `us_person` (boolean): Whether the creator is a US person for tax purposes.
- `accept_terms` (boolean): True to accept the Partner Program Terms with this save.

## `accept_partner_terms`

Additive · requires `account:write` · idempotent

Records that the token's creator accepts the Partner Program Terms as they stand today, which every payout rail requires; accepting again after the terms change is the same call. Answers the partner object as `get_partner_program` describes it, with `terms_accepted_at` and `terms_version` set. Takes no input. Refused with `VALIDATION_FAILED` while the application is under review or was declined, and with `RESOURCE_NOT_FOUND` when the creator never applied. Emits no event.

**Arguments**

- none

## `list_transaction_fees`

Read · requires `account:read`

Lists the transaction fees Subscriby charged the creator this token belongs to, newest first, one row per fee: `kind` says what it was for (`payment_fee`, the commission on a member's payment; `access_code_fee`, a code redeemed past the plan's free allotment; `trial_usage`, the metered fees a platform trial waived, collected once it ended; `outage_emails`, emails sent to members during a recovery; `processing_recovery`, the cost of collecting an invoice's fee lines), `channel` how it was collected ("connect_at_source", deducted from the member's payment by Stripe Connect and never invoiced, or "metered", reported to the usage meter and billed on the creator's own Subscriby invoice), and each row carries the project, the member and the payment where there was one, the gross amount and the rate, `fee_amount` as a decimal string in the creator's billing currency, the meter `units`, and `invoice_id` with `invoiced_at` once a paid Subscriby invoice billed a metered line. Optional `month` (`YYYY-MM`, UTC; wins over the bounds), `from` and `to` (ISO 8601), `project_id`, `channel` and `kind`. Paginates with `limit` (1..100, default 25) and `page` (default 1).

**Arguments**

- `month` (string): Optional calendar month as "YYYY-MM" in UTC, such as "2026-10"; wins over from and to.
- `from` (string): Optional lower bound, ISO 8601: lines incurred at or after it.
- `to` (string): Optional upper bound, ISO 8601: lines incurred before it.
- `project_id` (string): Optional project id: only the lines earned on that project.
- `channel` (string): Optional filter: "connect_at_source" or "metered".
- `kind` (string): Optional filter: "payment_fee", "access_code_fee", "trial_usage", "outage_emails" or "processing_recovery".
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_transaction_fee_summary`

Read · requires `account:read`

Adds up one calendar month of the transaction fees Subscriby charged the creator this token belongs to: `total_fee`, `at_source_fee` (deducted from members' payments by Stripe Connect, never invoiced), `metered_fee` (reported to the usage meter and billed on the creator's own Subscriby invoice; the figure to hold against the invoice's Transaction Fees line) with `metered_units`, `invoiced_fee` and `awaiting_invoice_fee`, every amount a decimal string in the creator's billing currency, plus `by_kind` (one row per kind of fee with its label, sum, units and line count), `by_project` (largest first; the fees no project carries pool under a null id) and `invoices` (the Subscriby invoices that billed the month's metered lines, newest first). Optional `month` (`YYYY-MM`, UTC; the current month by default) and `project_id` (one project alone, in which case `by_project` is empty).

**Arguments**

- `month` (string): Optional calendar month as "YYYY-MM" in UTC, such as "2026-10"; the current month when left out.
- `project_id` (string): Optional project id: add up that project's lines alone.

## `get_copilot_credits`

Read · requires `account:read`

Describes the Copilot Credits of the creator this token belongs to, in one object: `balance` (`total_cents`, `free_cents` spent first, `paid_cents` which never lapses, `lapsing_cents` with `lapsing_at`, `exhausted`), `allowance` (this month's free operator turns and member answers, used and left), this month's `turns_this_month`, `suggestions_this_month`, `answers_this_month` and `paid_spent_this_month_cents`, the prices (`price_turn_cents`, `price_suggestion_cents`, `price_answer_cents`, with `long_turn_steps` and `max_turn_steps`), `low_balance_cents`, the `packs` on sale and the `settings` (auto top-up and monthly cap). Every amount is an integer in US cents. Takes no input; requires `account:read`.

**Arguments**

- none

## `list_copilot_credits_statement`

Read · requires `account:read`

Pages the Copilot Credits statement of the creator this token belongs to, newest first: every pack bought and its bonus, every promotion and goodwill grant, every refund and lapse, and each month's usage per kind, each line with its `kind`, `cents` (positive for credit, negative for debit), `at`, `label`, `expires_at` on a free grant, and `units` with `usage_kind` on a usage line. Optional `limit` (1..100) and `page`. Requires `account:read`.

**Arguments**

- `limit` (integer): Maximum lines to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `create_copilot_credits_pack`

Additive · requires `account:write` · open world

Opens the purchase of a pack of Copilot Credits for the creator this token belongs to and answers the Stripe Checkout URL to send them to, with the pack's `paid_cents` and `bonus_cents`; nothing is charged and no credit lands until the creator pays on that page, and the card they pay with is saved for the auto top-up. Requires `pack`, one of the packs `get_copilot_credits` lists on sale ("starter", "regular", "plus" or "max"); a pack with no price in this environment is refused with `VALIDATION_FAILED`. Requires `account:write`.

**Arguments**

- `pack` (string, required): The pack to buy: "starter" ($10), "regular" ($25 with $2.50 free), "plus" ($50 with $7.50 free) or "max" ($100 with $15 free).

## `update_copilot_credits_settings`

Destructive · requires `account:write` · idempotent

Changes the Copilot Credits settings of the creator this token belongs to; anything you omit keeps its stored value. Optional: `auto_topup_pack` (one of the packs on sale, "starter", "regular", "plus" or "max"; null switches the auto top-up off; switching it on needs a card on file, else `VALIDATION_FAILED`), `auto_topup_below_cents` (100..10000, the balance under which the auto top-up buys) and `monthly_spend_cap_cents` (0..1000000, the paid credit the Copilot may draw in a calendar month; the free allowance is never capped). Answers the settings after the change. Requires `account:write`.

**Arguments**

- `auto_topup_pack` (string): The pack the auto top-up buys: "starter", "regular", "plus" or "max"; null switches the auto top-up off.
- `auto_topup_below_cents` (integer): The balance in US cents under which the auto top-up buys (100..10000).
- `monthly_spend_cap_cents` (integer): The paid credit in US cents the Copilot may draw in a calendar month (0..1000000).

## `list_tokens`

Read · requires `token:view-any`

Lists the authenticated user's own personal access tokens. The plaintext token value is NEVER surfaced — only `id`, `name`, `abilities` (gate codes), `scopes` (`team_id` and `project_ids` extracted from the `scope:team:` / `scope:project:` ability prefixes), `last_used_at`, `expires_at`, and `created_at`. Token ownership IS the permission — no extra ability is required to call. Pair with `revoke_token` to retire a token.

**Arguments**

- none

## `get_token`

Read · requires `token:view`

Fetches one of the authenticated user's own personal access tokens by UUID: its name, gate abilities, team and project scopes, last use and expiry. Same row shape as `list_tokens`; the plaintext value is NEVER surfaced — it exists only in the mint's own answer. Unknown ids and other users' tokens surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `token_id` (string, required): UUID of the token to fetch, from `list_tokens`.

## `create_token`

Destructive · requires `token:create` · open world

Mints a personal access token: a `name`, the `abilities` it holds (each a value from the ability catalog, and never more than the calling token itself holds — "token:create" is refused unconditionally), and the `team_id` it is minted for, which must be a team the caller owns or belongs to and becomes the token's frozen scope. The answer carries the token row plus `token`, the plaintext, THE ONLY TIME IT EXISTS outside your own storage — hand it to the person or store it immediately; every later read returns the row without it. A refused ability or a foreign team is `VALIDATION_FAILED` naming the reason.

**Arguments**

- `name` (string, required): A label for the token, up to 255 characters, shown on Settings under API Tokens.
- `abilities` (array of any, required): The abilities the token holds, at least one, each a value from the ability catalog resource. Must be a subset of what the calling token holds; "token:create" is never granted this way.
- `team_id` (string, required): UUID of the team the token is minted for; it becomes the token's frozen scope and must be a team the caller owns or belongs to.

## `revoke_token`

Destructive · requires `token:delete` · idempotent

Revokes one of the authenticated user's own personal access tokens by id. DESTRUCTIVE: you MUST confirm the target `token_id` with a human before calling — any external integration using the revoked token will start failing immediately on the next request. Refuses self-revocation; the token authenticating this call cannot delete its own row (returns `VALIDATION_FAILED`). Token ownership IS the permission — foreign token ids return `RESOURCE_NOT_FOUND` to prevent existence leaks. Idempotent — re-calling on an already-revoked id returns `RESOURCE_NOT_FOUND`.

**Arguments**

- `token_id` (string, required): UUID of the token to revoke. Must belong to the authenticated user. Cannot be the id of the token authenticating this call.

## `get_job_status`

Read

Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. Always pair with any tool that returns a `job_id` (`bulk_generate_access_codes`, `request_account_export`, and `revert_recovery_operation` for a channel revert); poll until `status=completed`, or in the Copilot watch the step, which follows the job live. Visibility is locked to jobs the authenticated user originally kicked off — foreign job ids return `RESOURCE_NOT_FOUND` to prevent existence leaks.

**Arguments**

- `job_id` (string, required): UUID of the async job to poll.
