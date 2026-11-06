# Tools: Revenue Recovery

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_retention_settings` | read | `project-subscription:view` | Reads a project's Revenue Recovery settings: `grace_days` (how long a failed renewal keeps the member's access while the payment gateway retries, 0 to 30), the `ladder` that window implies in words, `digest_enabled` (one message a day to the owner, only on a day something happened), "cancel_feedback_enabled" (whether the cancellation screen asks the member why) and the three offers the screen can make: `offer_pause_enabled` (one billing cycle on hold where the gateway can hold the charge), `offer_discount_coupon` (applied to the renewals where the gateway can carry a coupon) and `offer_return_coupon` (handed over on the way out, on every payment method); then the two nurture windows, `checkout_stall_hours` (how long a checkout may stay open with no settled charge before it counts as stalled and the stalled-checkout sequences start, 1 to 24) and `trial_notice_days` (how many days before a trial without a card ends its trial-ending sequences start, 1 to 14). |
| `update_retention_settings` | additive | `project-subscription:update` | Changes a project's Revenue Recovery settings; every argument is optional and the row keeps its stored value for each one left out. |
| `get_retention_stats` | read | `project-subscription:view-any` | Reads what Revenue Recovery did on a project over a window, the figures the dashboard card shows: `failed_renewals`, `reminders_sent`, `access_paused`, `payments_recovered` with `recovered_usd` (what the settled renewals were worth, restated in US dollars), `access_restored`, `winback_sent` and `won_back` (win-back steps delivered on the churn trigger and members they brought back), `cancellations` with `offers_shown` and `offers_taken`, `reasons` (why members cancelled, the most given first, each with its share in percent), and the nurture block: `leads_arrived`, `leads_nurtured` and `leads_converted` (new leads, the ones a lead sequence took, the ones who bought while it ran), `checkouts_started`, `checkouts_stalled` and `checkouts_recovered` with `checkouts_recovered_usd` (what the charges that finished stalled checkouts were worth, in US dollars), `trials_nurtured` and `trials_saved` (trials without a card a trial-ending sequence took, and the ones whose member paid while it ran). |
| `list_retention_activity` | read | `project-subscription:view-any` | Lists a project's Revenue Recovery ledger, newest first: one row per notice, offer, feedback and win-back message the programme sent, with the member, the `kind` (`payment_failed_notice`, `grace_reminder`, `grace_final_warning`, `access_suspended`, `access_restored`, `payment_recovered`, `offer_shown`, `offer_taken`, `feedback` or `sequence_step`), the `channel` that carried a notice (`chat` or `email`), when it went out, the coupon and the sequence step behind a win-back message, and, once a charge settled for the member after the row, `converted_at` with the `payment_id` that counted it. |
| `list_cancellation_feedback` | read | `project-subscription:view-any` | Lists the cancellation screens a project's members reached, newest first: the member, the plan they were on, the `reason` they picked, their own words in `feedback`, the offer shown (`offer_shown`: `pause`, `discount` or `return_coupon`) and whether they took it (`offer_taken`), where they answered (`surface`: `portal` or `bot`) and the dates of a pause they took. |
| `list_checkouts` | read | `project-subscription:view-any` | Lists the checkouts a project's members started on the portal or in a bot, newest first: the member, the plan they were buying, the rail (`provider`), where they started (`surface`: `portal` or `bot`), the order reference the rail was given, when it started, when the hourly sweep counted it as stalled (`stalled_at`, once the project's checkout window passed with no settled charge) and when a charge finished it (`completed_at` with `payment_id`) or another checkout superseded it (`superseded_at`), summed up as `outcome`: "open", "stalled", "recovered" (a charge settled after it had stalled), "completed" (a charge settled before it could stall) or "superseded" (closed with no charge of its own: the member paid through another checkout, or already held a live membership when the sweep looked). |
| `list_sequences` | read | `project-sequence:view-any` | Lists a project's sequences, newest first, each with its `trigger`, its `active` switch, its `steps` in order (the days each waits, the message with its placeholders unfilled, the coupon it carries) and its `counts` all time: `enrolled`, `open` (still receiving steps), `completed` and `won_back` (a payment settled while the member was enrolled: a member won back on a churn sequence, a conversion on the others). |
| `get_sequence` | read | `project-sequence:view` | Fetches one sequence by `project_id` and `sequence_id`: its name, `trigger`, `active` switch, `steps` in order (each with its stable `id`, `position`, `delay_days`, `body` with the placeholders `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` unfilled, and the coupon it carries) and `counts` all time (`enrolled`, `open`, `completed`, `won_back`). |
| `create_sequence` | additive | `project-sequence:create` | Builds a sequence on a project: the ordered messages a member receives on the days the creator chose after one of four moments, each with the way to the plan as a button. |
| `update_sequence` | destructive | `project-sequence:update` | Changes a sequence; only the arguments present move. |
| `delete_sequence` | destructive | `project-sequence:delete` | Deletes a sequence: every member part-way through leaves it at once (`sequence.exited` with the reason "deleted"), the row and its history stay for the figures, and the id stops answering. |
| `list_sequence_enrollments` | read | `project-sequence:view-any` | Lists the passages members made through one sequence, the newest first: the member, when they entered, the step due next (`next_position`, `next_due_at`) while the passage is open, and how it ended if it has: `state` is "open", "completed" (every step received) or "exited", and an exited passage says why in "exit_reason": "reactivated" (a charge settled for the member: a member won back on a churn sequence, a conversion on a lead, checkout or trial one), "opted_out" (the platform could not reach them, or they pressed Stop), "disabled" (the sequence was switched off) or "deleted". |

## `get_retention_settings`

Read · requires `project-subscription:view`

Reads a project's Revenue Recovery settings: `grace_days` (how long a failed renewal keeps the member's access while the payment gateway retries, 0 to 30), the `ladder` that window implies in words, `digest_enabled` (one message a day to the owner, only on a day something happened), "cancel_feedback_enabled" (whether the cancellation screen asks the member why) and the three offers the screen can make: `offer_pause_enabled` (one billing cycle on hold where the gateway can hold the charge), `offer_discount_coupon` (applied to the renewals where the gateway can carry a coupon) and `offer_return_coupon` (handed over on the way out, on every payment method); then the two nurture windows, `checkout_stall_hours` (how long a checkout may stay open with no settled charge before it counts as stalled and the stalled-checkout sequences start, 1 to 24) and `trial_notice_days` (how many days before a trial without a card ends its trial-ending sequences start, 1 to 14). Requires `project_id`. `offers_available` says whether the project owner's plan includes the offers (Growth or the Revenue Recovery Addon); the offer settings are stored on every plan and ignored by the screen without it. The row is created with the defaults on the first read. Read it before `update_retention_settings` to see what stands.

**Arguments**

- `project_id` (string, required): UUID of the project whose Revenue Recovery settings to read.

## `update_retention_settings`

Additive · requires `project-subscription:update` · idempotent

Changes a project's Revenue Recovery settings; every argument is optional and the row keeps its stored value for each one left out. Requires `project_id`. Optional: `grace_days` (0 to 30; 0 pauses access at the first failed renewal), `digest_enabled`, "cancel_feedback_enabled", `offer_pause_enabled`, `offer_discount_coupon_id` and `offer_return_coupon_id` (each the UUID of one of the project's own coupons, or null to clear the offer), `checkout_stall_hours` (1 to 24: how long a checkout may stay open with no settled charge before it counts as stalled and the stalled-checkout sequences start) and `trial_notice_days` (1 to 14: how many days before a trial without a card ends its trial-ending sequences start; a shorter trial enrols at its start). The three offer settings are stored on every plan and only read by the cancellation screen when the owner's plan includes the offers (Growth or the Revenue Recovery Addon), which `offers_available` in the answer says. Refused with `VALIDATION_FAILED` for a window out of range or a coupon of another project. Nothing is announced: the settings are the creator's own.

**Arguments**

- `project_id` (string, required): UUID of the project whose Revenue Recovery settings to change.
- `grace_days` (integer): How many days a failed renewal keeps the member's access while the gateway retries, 0 to 30. 0 pauses access at the failure.
- `digest_enabled` (boolean): Whether the owner gets one message a day with the failures, reminders, pauses and recoveries, only on a day something happened.
- `cancel_feedback_enabled` (boolean): Whether the cancellation screen asks the member why before the offer. Off skips straight to the offer.
- `offer_pause_enabled` (boolean): Whether a cancelling member whose gateway can hold the charge is offered one billing cycle on hold.
- `offer_discount_coupon_id` (string): UUID of one of the project's coupons, applied to a cancelling member's renewals where the gateway can carry it; null for no discount offer.
- `offer_return_coupon_id` (string): UUID of one of the project's coupons, handed to a cancelling member on the way out on every payment method; null for no return coupon.
- `checkout_stall_hours` (integer): How many hours a checkout may stay open with no settled charge before it counts as stalled and the stalled-checkout sequences start, 1 to 24.
- `trial_notice_days` (integer): How many days before a trial without a card ends its trial-ending sequences start, 1 to 14. A shorter trial enrols at its start.

## `get_retention_stats`

Read · requires `project-subscription:view-any`

Reads what Revenue Recovery did on a project over a window, the figures the dashboard card shows: `failed_renewals`, `reminders_sent`, `access_paused`, `payments_recovered` with `recovered_usd` (what the settled renewals were worth, restated in US dollars), `access_restored`, `winback_sent` and `won_back` (win-back steps delivered on the churn trigger and members they brought back), `cancellations` with `offers_shown` and `offers_taken`, `reasons` (why members cancelled, the most given first, each with its share in percent), and the nurture block: `leads_arrived`, `leads_nurtured` and `leads_converted` (new leads, the ones a lead sequence took, the ones who bought while it ran), `checkouts_started`, `checkouts_stalled` and `checkouts_recovered` with `checkouts_recovered_usd` (what the charges that finished stalled checkouts were worth, in US dollars), `trials_nurtured` and `trials_saved` (trials without a card a trial-ending sequence took, and the ones whose member paid while it ran). Two figures ignore the window: `in_grace_now` (members who keep access on an unpaid renewal right now) and `paused_now` (members paused for non-payment, waiting for a charge to settle). Requires `project_id`. Optional `period` preset: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `1y`, `mtd`, `qtd`, `ytd` or `all`; an unknown preset is `VALIDATION_FAILED`. Use to judge whether the grace window, the offers, the checkout window or a sequence are earning their keep before changing them.

**Arguments**

- `project_id` (string, required): UUID of the project whose Revenue Recovery figures to read.
- `period` (string): Window preset: 7d, 14d, 30d, 60d, 90d, 1y, mtd, qtd, ytd or all. Defaults to 30d. The two "right now" figures ignore it.

## `list_retention_activity`

Read · requires `project-subscription:view-any`

Lists a project's Revenue Recovery ledger, newest first: one row per notice, offer, feedback and win-back message the programme sent, with the member, the `kind` (`payment_failed_notice`, `grace_reminder`, `grace_final_warning`, `access_suspended`, `access_restored`, `payment_recovered`, `offer_shown`, `offer_taken`, `feedback` or `sequence_step`), the `channel` that carried a notice (`chat` or `email`), when it went out, the coupon and the sequence step behind a win-back message, and, once a charge settled for the member after the row, `converted_at` with the `payment_id` that counted it. Requires `project_id`. Optional `kind` keeps one kind of row; an unknown word is `VALIDATION_FAILED`. Paginates with `limit` (1..100, default 25) and `page`. This is the ledger every figure of `get_retention_stats` is counted from.

**Arguments**

- `project_id` (string, required): UUID of the project whose ledger to list.
- `kind` (string): Optional: keep one kind of row, such as "payment_recovered" or "sequence_step".
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_cancellation_feedback`

Read · requires `project-subscription:view-any`

Lists the cancellation screens a project's members reached, newest first: the member, the plan they were on, the `reason` they picked, their own words in `feedback`, the offer shown (`offer_shown`: `pause`, `discount` or `return_coupon`) and whether they took it (`offer_taken`), where they answered (`surface`: `portal` or `bot`) and the dates of a pause they took. Requires `project_id`. Optional `reason` (`too_expensive`, `not_using_enough`, `not_enough_content`, `content_not_expected`, `found_another_community`, `not_the_right_fit`, `taking_a_break`, `got_what_i_needed`, `technical_problems`, `signed_up_by_mistake` or `other`) and `surface` keep one kind of record; an unknown word is `VALIDATION_FAILED`. Paginates with `limit` (1..100, default 25) and `page`. A member who left without reaching the screen (a lapsed card, a connector that banned them) has no record here; `get_retention_stats` has the counts and the shares.

**Arguments**

- `project_id` (string, required): UUID of the project whose cancellation screens to list.
- `reason` (string): Optional: keep the records whose member gave this reason, such as "too_expensive" or "other".
- `surface` (string): Optional: "portal" for screens answered on the portal, "bot" for screens answered in a connector chat.
- `limit` (integer): Maximum records to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_checkouts`

Read · requires `project-subscription:view-any`

Lists the checkouts a project's members started on the portal or in a bot, newest first: the member, the plan they were buying, the rail (`provider`), where they started (`surface`: `portal` or `bot`), the order reference the rail was given, when it started, when the hourly sweep counted it as stalled (`stalled_at`, once the project's checkout window passed with no settled charge) and when a charge finished it (`completed_at` with `payment_id`) or another checkout superseded it (`superseded_at`), summed up as `outcome`: "open", "stalled", "recovered" (a charge settled after it had stalled), "completed" (a charge settled before it could stall) or "superseded" (closed with no charge of its own: the member paid through another checkout, or already held a live membership when the sweep looked). One charge finishes one checkout and brings back one stalled checkout, so a member who tapped Pay three times and paid once has one "completed" and two "superseded". `enrollment_id` names the stalled-checkout sequence passage the stall opened. Requires `project_id`. Optional `stalled` and `recovered` (booleans; "recovered" reads among the stalled rows), `plan_id` and `member_id` narrow the page; a word that is not a boolean or an id that is not a UUID is `VALIDATION_FAILED`. Paginates with `limit` (1..100, default 25) and `page`. An access code redemption or a free trial start is not a checkout and never appears here; `get_retention_stats` has the counts and what the recovered checkouts were worth.

**Arguments**

- `project_id` (string, required): UUID of the project whose checkouts to list.
- `stalled` (boolean): Optional: true for the checkouts the hourly sweep counted as stalled, false for the ones it never did.
- `recovered` (boolean): Optional: true for the stalled checkouts a charge finished after all, false for the stalled ones still open.
- `plan_id` (string): Optional: UUID of one plan, to keep the checkouts of that plan.
- `member_id` (string): Optional: UUID of one member, to keep their checkouts.
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_sequences`

Read · requires `project-sequence:view-any`

Lists a project's sequences, newest first, each with its `trigger`, its `active` switch, its `steps` in order (the days each waits, the message with its placeholders unfilled, the coupon it carries) and its `counts` all time: `enrolled`, `open` (still receiving steps), `completed` and `won_back` (a payment settled while the member was enrolled: a member won back on a churn sequence, a conversion on the others). Requires `project_id`. Optional `active` (true for running sequences, false for paused ones) and `trigger` (`churned`, `lead`, `stalled_checkout` or `trial_ending`). Paginates with `limit` (1..100, default 25) and `page`. A sequence is the ordered set of messages a member receives on the days the creator chose after one of four moments (they left, they arrived as a lead, their checkout stalled, their trial is about to end), each with the way to the plan as a button. Use to find a sequence id before `get_sequence`, `update_sequence`, `delete_sequence` or `list_sequence_enrollments`.

**Arguments**

- `project_id` (string, required): UUID of the project whose sequences to list.
- `active` (boolean): Optional: true for running sequences only, false for paused ones only. Omit for both.
- `trigger` (string): Optional: keep the sequences on one trigger, such as "churned".
- `limit` (integer): Maximum sequences to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_sequence`

Read · requires `project-sequence:view`

Fetches one sequence by `project_id` and `sequence_id`: its name, `trigger`, `active` switch, `steps` in order (each with its stable `id`, `position`, `delay_days`, `body` with the placeholders `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` unfilled, and the coupon it carries) and `counts` all time (`enrolled`, `open`, `completed`, `won_back`). Same row as `list_sequences`; `list_sequence_enrollments` has the members behind the counts. A sequence of another project, or one the creator deleted, is `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the sequence belongs to.
- `sequence_id` (string, required): UUID of the sequence to fetch.

## `create_sequence`

Additive · requires `project-sequence:create` · open world

Builds a sequence on a project: the ordered messages a member receives on the days the creator chose after one of four moments, each with the way to the plan as a button. Requires `project_id` and `name` (1..120 characters). Optional `trigger`: `churned` (their last live membership ended; the default), `lead` (they arrived without buying), `stalled_checkout` (a checkout they started stayed open past the project's checkout window) or `trial_ending` (a trial without a card is about to end, the project's trial reminder before it); `active` (defaults to true) and `steps`, a list of up to 8 objects in the order they go out, each with `delay_days` (0..180 for the first step, counted from the trigger, 0 meaning the next hourly run; 1..180 for the rest, counted from the step before), `body` (1..1,000 characters; `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` are filled per member when the step goes out) and an optional `coupon_id` (one of the project's coupons). The row and its steps are written together, so a refused step leaves no sequence behind; a sequence built without steps exists and enrols nobody until it has one. Emits `sequence.created` once, with the steps. Refused with `VALIDATION_FAILED` when the project owner's plan lacks sequences (Growth or the Revenue Recovery Addon), for an unknown trigger, a step out of bounds or a coupon of another project.

**Arguments**

- `project_id` (string, required): UUID of the project the sequence belongs to.
- `name` (string, required): A creator-facing label, 1 to 120 characters, e.g. "Win-back after churn".
- `trigger` (string): What enrols a member: "churned" (their last live membership ended; the default), "lead" (they arrived without buying), "stalled_checkout" (a checkout they started stayed open past the window the project set) or "trial_ending" (a trial without a card is about to end).
- `active` (boolean): Whether the sequence enrols and sends from the start. Defaults to true.
- `steps` (array of object): The steps in the order they go out, at most 8: each {delay_days: int, 0-180 on the first step and 1-180 after, body: string up to 1,000 characters with {name}, {project}, {coupon}, {discount} and {link} as placeholders, coupon_id?: UUID of one of the project's coupons}. Omit for a sequence with no steps yet.

## `update_sequence`

Destructive · requires `project-sequence:update` · idempotent · open world

Changes a sequence; only the arguments present move. Requires `project_id` and `sequence_id`. Optional `name` (1..120 characters), `trigger` (`churned`, `lead`, `stalled_checkout` or `trial_ending`; members already part-way through keep their passage), `active` and `steps`. `steps`, when present, replaces the whole list in order (at most 8, each {delay_days 0..180 on the first step and 1..180 after, body up to 1,000 characters, optional coupon_id}): a step still at its place keeps its id and a member due it keeps their position, the rest are appended and the extra ones removed from the end; an empty list removes every step. Switching `active` off is DESTRUCTIVE in the sense that every member part-way through leaves the sequence at once (`sequence.exited` with the reason "disabled") and nobody is enrolled until it runs again; switching it back on enrols nobody retroactively. Emits `sequence.updated` once, with the sequence as it then stands. Refused with `VALIDATION_FAILED` when the owner's plan lacks sequences, for an unknown trigger, a step out of bounds or a coupon of another project.

**Arguments**

- `project_id` (string, required): UUID of the project the sequence belongs to.
- `sequence_id` (string, required): UUID of the sequence to change.
- `name` (string): A new creator-facing label, 1 to 120 characters.
- `trigger` (string): What enrols a member: "churned", "lead", "stalled_checkout" or "trial_ending". Members already part-way through keep their passage.
- `active` (boolean): Switch the sequence on or off. Off lets every member part-way through go and enrols nobody until it runs again.
- `steps` (array of object): The whole list of steps in order, at most 8, replacing the stored list: each {delay_days: int, 0-180 on the first step and 1-180 after, body: string up to 1,000 characters, coupon_id?: UUID}. A step still at its place keeps its id. Omit to leave the steps alone; send an empty list to remove them all.

## `delete_sequence`

Destructive · requires `project-sequence:delete`

Deletes a sequence: every member part-way through leaves it at once (`sequence.exited` with the reason "deleted"), the row and its history stay for the figures, and the id stops answering. Requires `project_id` and `sequence_id`. DESTRUCTIVE and never undone: build a new sequence instead. Emits `sequence.deleted`; a second call on the same id is `RESOURCE_NOT_FOUND`. To stop a sequence without losing it, set `active` to false with `update_sequence`.

**Arguments**

- `project_id` (string, required): UUID of the project the sequence belongs to.
- `sequence_id` (string, required): UUID of the sequence to delete.

## `list_sequence_enrollments`

Read · requires `project-sequence:view-any`

Lists the passages members made through one sequence, the newest first: the member, when they entered, the step due next (`next_position`, `next_due_at`) while the passage is open, and how it ended if it has: `state` is "open", "completed" (every step received) or "exited", and an exited passage says why in "exit_reason": "reactivated" (a charge settled for the member: a member won back on a churn sequence, a conversion on a lead, checkout or trial one), "opted_out" (the platform could not reach them, or they pressed Stop), "disabled" (the sequence was switched off) or "deleted". Requires `project_id` and `sequence_id`. Optional "exit_reason" keeps the passages that ended one way; an unknown word is `VALIDATION_FAILED`. Paginates with `limit` (1..100, default 25) and `page`. The counts on `get_sequence` are these rows added up.

**Arguments**

- `project_id` (string, required): UUID of the project the sequence belongs to.
- `sequence_id` (string, required): UUID of the sequence whose passages to list.
- `exit_reason` (string): Optional: keep the passages that ended this way: "reactivated", "opted_out", "disabled" or "deleted". Omit for every passage, open ones included.
- `limit` (integer): Maximum passages to return per page (1..100).
- `page` (integer): 1-indexed page number.
