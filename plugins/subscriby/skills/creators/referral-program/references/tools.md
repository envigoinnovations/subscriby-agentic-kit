# Tools: Referral Program

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_referral_program` | read | `project-referral:view` | Fetches a project's Referral Program by `project_id`: what referrers earn (`free_days` or a `cash` commission with its type, rate, currency and period), what referred friends receive on their first purchase, whether only customers may join and whether the creator approves each affiliate, the hold before a commission is payable, the creator's own terms and the plans a conversion counts on (`plan_ids` empty means EVERY plan). |
| `update_referral_program` | destructive | `project-referral:update` | Sets up or changes a project's Referral Program; the first call on a project creates it, every later call changes only the arguments present. |
| `activate_referral_program` | destructive | `project-referral:update` | Switches a project's Referral Program on: affiliates' links and codes attribute again and settled payments earn again, and every affiliate is told the terms as they now stand. |
| `deactivate_referral_program` | destructive | `project-referral:update` | Switches a project's Referral Program off: links and codes stop attributing and settled payments stop earning at once, while what affiliates already earned stays and can still be paid out. |
| `delete_referral_program` | destructive | `project-referral:delete` | Removes a project's Referral Program. |
| `list_referral_affiliates` | read | `project-referral:view-any` | Lists the members enrolled in a project's Referral Program, newest first. |
| `get_referral_affiliate` | read | `project-referral:view` | Fetches one affiliate of a project's Referral Program by `project_id` and `affiliate_id`, with their code, status, days balance and `balances` per currency: `pending` (inside the hold), `earned`, `payable` (what `record_referral_payout` may record) and `paid_out`, each a decimal string. |
| `add_referral_affiliate` | additive | `project-referral:create` | Enrols a member of a project as an affiliate of its Referral Program by hand, approved whatever the programme's customers-only and approval switches say, and hands them their code, their links and the programme's terms in their chat and by mail. |
| `approve_referral_affiliate` | destructive | `project-referral:update` | Approves a pending or suspended affiliate of a project's Referral Program: their code counts from now on, and they receive their link, code and the programme's terms in their chat and by mail. |
| `suspend_referral_affiliate` | destructive | `project-referral:update` | Suspends an affiliate of a project's Referral Program: their code stops counting new friends and nothing new is earned, while what they already earned stays and can still be paid out. |
| `list_referrals` | read | `project-referral:view-any` | Lists the friends affiliates of a project's Referral Program brought in, newest first: how each arrived (`source` is `portal_link`, `connector_link` or `code_at_checkout`), whether their first payment settled (`status` is `touched`, `converted`, `expired` or `rejected`) and until when the affiliate earns on them. |
| `get_referral` | read | `project-referral:view` | Fetches one referral of a project's Referral Program by `project_id` and `referral_id`: the affiliate, the friend's member id, how they arrived, whether their first payment settled and until when the affiliate earns on them. |
| `list_referral_rewards` | read | `project-referral:view-any` | Lists the referral ledger of a project, newest first: one row per settled payment per side of a referral, with the days or money it earned, whose it is (`beneficiary` is `referrer` or `friend`) and where it stands (`status` is `pending` inside the hold, `approved` payable, `paid`, `applied` for days banked on a membership, or `reversed` by a refund; a reversal is its own row with a negative amount). |
| `list_referral_payouts` | read | `project-referral:view-any` | Lists the payouts recorded against a project's affiliates, newest first: how much the creator paid each affiliate outside Subscriby, in which currency, the creator's reference and note, and how many payable commissions the payout covered. |
| `record_referral_payout` | destructive | `project-referral:update` | Records a payout the creator made to an affiliate outside Subscriby, so the ledger marks their oldest payable commissions in that currency as paid, first in first out, until the amount is covered. |

## `get_referral_program`

Read · requires `project-referral:view`

Fetches a project's Referral Program by `project_id`: what referrers earn (`free_days` or a `cash` commission with its type, rate, currency and period), what referred friends receive on their first purchase, whether only customers may join and whether the creator approves each affiliate, the hold before a commission is payable, the creator's own terms and the plans a conversion counts on (`plan_ids` empty means EVERY plan). Same flat keys as `update_referral_program` takes. A project with no programme, an unknown project or one outside the token's scope surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program to fetch.

## `update_referral_program`

Destructive · requires `project-referral:update` · idempotent · open world

Sets up or changes a project's Referral Program; the first call on a project creates it, every later call changes only the arguments present. Requires `project_id`. Optional: `active`, `customers_only`, `approval_required`, `reward_kind` (`free_days` or `cash`), `reward_days` (1..3650, for free days), `commission_type` (`percentage` or `fixed`, for cash), `commission_value` (0.0001..100 for a percentage, any amount above zero for a fixed commission), `commission_currency_id` (needed for a fixed commission), `commission_period_months` (0 for the friend's first payment only, 1..36, or null for life), `hold_days` (0..90), `minimum_payout` (a guide only, null for none), `friend_reward_kind` (`none`, `free_days` or `coupon`), `friend_reward_days`, `friend_coupon_id` (one of the project's coupons), `payout_details_label`, `terms` and `plan_ids` (an empty list counts conversions on every plan, including ones added later). Rewards already in the ledger keep their figures, and every approved or pending affiliate is told in their chat and by mail when a field they were promised moves. Emits `referral.program_updated`. Refused with `TEAM_TIER_REQUIRED` when the project owner's plan does not include the Referral Program, with `VALIDATION_FAILED` when a field is invalid or the shape does not add up.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program to set up or change.
- `active` (boolean): The on/off switch. Prefer activate_referral_program and deactivate_referral_program, which change only this.
- `customers_only` (boolean): Whether only members with a live membership may join.
- `approval_required` (boolean): Whether the creator approves each affiliate before their code counts.
- `reward_kind` (string): "free_days" (membership days banked on the referrer) or "cash" (a commission the creator pays out themselves).
- `reward_days` (integer): Days a referrer earns per converted friend, 1..3650; for a free_days reward.
- `commission_type` (string): "percentage" of every settled payment or a "fixed" amount on the first; for a cash reward.
- `commission_value` (number): The rate: 0.0001..100 for a percentage, any amount above zero for a fixed commission.
- `commission_currency_id` (string): Currency UUID a fixed commission is paid in; ignored and cleared for a percentage.
- `commission_period_months` (integer): How long a percentage commission runs after conversion: 0 for the friend's first payment only, 1..36 months, or null for life.
- `hold_days` (integer): Days a cash commission waits before it is payable, 0..90.
- `minimum_payout` (number): A guide for the creator, the balance an affiliate reaches before they pay; nothing is enforced. Pass null for none.
- `friend_reward_kind` (string): What a referred friend receives on their first purchase: "none", "free_days" or "coupon".
- `friend_reward_days` (integer): Days banked on the friend's first purchase, 1..3650; for a free_days friend reward.
- `friend_coupon_id` (string): UUID of one of the project's coupon codes, applied at the friend's checkout; for a coupon friend reward.
- `payout_details_label` (string): The question affiliates answer so the creator can pay them, such as "PayPal email"; at most 120 characters, null for none.
- `terms` (string): The creator's own terms, shown to affiliates and referred friends; at most 5,000 characters, null for none.
- `plan_ids` (array of string): Plan UUIDs a conversion must be on to count. An empty list counts every plan in the project, including ones added later.

## `activate_referral_program`

Destructive · requires `project-referral:update` · idempotent

Switches a project's Referral Program on: affiliates' links and codes attribute again and settled payments earn again, and every affiliate is told the terms as they now stand. Requires `project_id`. Idempotent: a programme already on is left as it is and nothing is emitted. Emits `referral.program_updated` with `active` as the one change. Refused with `TEAM_TIER_REQUIRED` when the project owner's plan does not include the Referral Program; a project with no programme surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program to switch on.

## `deactivate_referral_program`

Destructive · requires `project-referral:update` · idempotent

Switches a project's Referral Program off: links and codes stop attributing and settled payments stop earning at once, while what affiliates already earned stays and can still be paid out. Every affiliate is told their link no longer counts new friends. Requires `project_id`. Idempotent: a programme already off is left as it is and nothing is emitted. Emits `referral.program_updated` with `active` as the one change. A project with no programme surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program to switch off.

## `delete_referral_program`

Destructive · requires `project-referral:delete` · idempotent

Removes a project's Referral Program. Requires `project_id`. DESTRUCTIVE: you MUST confirm the target `project_id` with a human before calling. Refused with `VALIDATION_FAILED` while any affiliate is still owed a commission; record their payouts with `record_referral_payout`, or call `deactivate_referral_program` instead, which stops the programme and keeps everything. Deleting emits no event. Idempotent: a project with no programme surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope project does.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program to remove.

## `list_referral_affiliates`

Read · requires `project-referral:view-any`

Lists the members enrolled in a project's Referral Program, newest first. Requires `project_id`; optional `status` (`pending`, `approved` or `suspended`) and `member_id` to find one member's affiliate row. Paginates with `limit` (1..100, default 25) and `page` (default 1). A list row carries the code, status and days balance but never the per-currency balances; call `get_referral_affiliate` for what one affiliate is owed. Payout details an affiliate typed are never surfaced by any tool.

**Arguments**

- `project_id` (string, required): UUID of the project whose affiliates to list.
- `status` (string): Optional filter: "pending", "approved" or "suspended".
- `member_id` (string): Optional member UUID, to find that member's affiliate row.
- `limit` (integer): Maximum affiliates to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_referral_affiliate`

Read · requires `project-referral:view`

Fetches one affiliate of a project's Referral Program by `project_id` and `affiliate_id`, with their code, status, days balance and `balances` per currency: `pending` (inside the hold), `earned`, `payable` (what `record_referral_payout` may record) and `paid_out`, each a decimal string. Same row as `list_referral_affiliates` plus the balances. The payout details they typed are never surfaced. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the affiliate belongs to.
- `affiliate_id` (string, required): UUID of the affiliate to fetch.

## `add_referral_affiliate`

Additive · requires `project-referral:create` · open world

Enrols a member of a project as an affiliate of its Referral Program by hand, approved whatever the programme's customers-only and approval switches say, and hands them their code, their links and the programme's terms in their chat and by mail. Requires `project_id` and `member_id` (a member of that project, as `list_subscribers` lists them). Emits `referral.affiliate_joined`. Refused with `TEAM_TIER_REQUIRED` when the project owner's plan does not include the Referral Program, with `VALIDATION_FAILED` when the member already stands in the programme, and with `RESOURCE_NOT_FOUND` for a project with no programme or a member not of the project.

**Arguments**

- `project_id` (string, required): UUID of the project whose Referral Program the member joins.
- `member_id` (string, required): UUID of the member to enrol, as list_subscribers lists them.

## `approve_referral_affiliate`

Destructive · requires `project-referral:update` · idempotent

Approves a pending or suspended affiliate of a project's Referral Program: their code counts from now on, and they receive their link, code and the programme's terms in their chat and by mail. Requires `project_id` and `affiliate_id`. Idempotent: an affiliate already approved is left as they are and nothing is emitted. Emits `referral.affiliate_approved`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the affiliate belongs to.
- `affiliate_id` (string, required): UUID of the affiliate to approve.

## `suspend_referral_affiliate`

Destructive · requires `project-referral:update` · idempotent

Suspends an affiliate of a project's Referral Program: their code stops counting new friends and nothing new is earned, while what they already earned stays and can still be paid out. Requires `project_id` and `affiliate_id`. DESTRUCTIVE: a real person stops earning, so confirm the target with a human before calling. Idempotent: an affiliate already suspended is left as they are and nothing is emitted. Emits `referral.affiliate_suspended`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the affiliate belongs to.
- `affiliate_id` (string, required): UUID of the affiliate to suspend.

## `list_referrals`

Read · requires `project-referral:view-any`

Lists the friends affiliates of a project's Referral Program brought in, newest first: how each arrived (`source` is `portal_link`, `connector_link` or `code_at_checkout`), whether their first payment settled (`status` is `touched`, `converted`, `expired` or `rejected`) and until when the affiliate earns on them. Requires `project_id`; optional `status`, `affiliate_id` and `since` (an ISO 8601 instant: only referrals whose friend arrived on or after it, so a report can page what happened since its last run). Paginates with `limit` (1..100, default 25) and `page` (default 1). Nothing names a friend beyond their member id.

**Arguments**

- `project_id` (string, required): UUID of the project whose referrals to list.
- `status` (string): Optional filter: "touched", "converted", "expired" or "rejected".
- `affiliate_id` (string): Optional affiliate UUID, to list one affiliate's referrals.
- `since` (string): Optional ISO 8601 instant: only referrals whose friend arrived on or after it.
- `limit` (integer): Maximum referrals to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_referral`

Read · requires `project-referral:view`

Fetches one referral of a project's Referral Program by `project_id` and `referral_id`: the affiliate, the friend's member id, how they arrived, whether their first payment settled and until when the affiliate earns on them. Same row shape as `list_referrals`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the referral belongs to.
- `referral_id` (string, required): UUID of the referral to fetch.

## `list_referral_rewards`

Read · requires `project-referral:view-any`

Lists the referral ledger of a project, newest first: one row per settled payment per side of a referral, with the days or money it earned, whose it is (`beneficiary` is `referrer` or `friend`) and where it stands (`status` is `pending` inside the hold, `approved` payable, `paid`, `applied` for days banked on a membership, or `reversed` by a refund; a reversal is its own row with a negative amount). Requires `project_id`; optional `affiliate_id`, `status` and `beneficiary`. Paginates with `limit` (1..100, default 25) and `page` (default 1). Read-only: nothing here is written by hand.

**Arguments**

- `project_id` (string, required): UUID of the project whose referral ledger to list.
- `affiliate_id` (string): Optional affiliate UUID, to list one affiliate's rewards.
- `status` (string): Optional filter: "pending", "approved", "paid", "applied" or "reversed".
- `beneficiary` (string): Optional filter: "referrer" or "friend".
- `limit` (integer): Maximum rewards to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `list_referral_payouts`

Read · requires `project-referral:view-any`

Lists the payouts recorded against a project's affiliates, newest first: how much the creator paid each affiliate outside Subscriby, in which currency, the creator's reference and note, and how many payable commissions the payout covered. Requires `project_id`; optional `affiliate_id`. Paginates with `limit` (1..100, default 25) and `page` (default 1).

**Arguments**

- `project_id` (string, required): UUID of the project whose payouts to list.
- `affiliate_id` (string): Optional affiliate UUID, to list one affiliate's payouts.
- `limit` (integer): Maximum payouts to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `record_referral_payout`

Destructive · requires `project-referral:update`

Records a payout the creator made to an affiliate outside Subscriby, so the ledger marks their oldest payable commissions in that currency as paid, first in first out, until the amount is covered. Requires `project_id`, `affiliate_id`, `amount` (greater than zero) and `currency_id`; optional `reference` (at most 120 characters) and `note` (at most 1,000). DESTRUCTIVE: it records that money left and emits `referral.payout_recorded`, so read the affiliate's `balances` with `get_referral_affiliate` first and confirm with a human. Refused with `VALIDATION_FAILED` when the amount exceeds the payable balance in that currency (`error.context.balance` carries what is payable) or the currency is unknown; an affiliate not of the project surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the affiliate belongs to.
- `affiliate_id` (string, required): UUID of the affiliate who was paid.
- `amount` (number, required): What was paid, greater than zero and at most the affiliate's payable balance in the currency.
- `currency_id` (string, required): UUID of the currency the commissions were earned in; a balance exists per currency.
- `reference` (string): The creator's own reference, such as a transfer id; at most 120 characters.
- `note` (string): A note for the creator's records; at most 1,000 characters.
