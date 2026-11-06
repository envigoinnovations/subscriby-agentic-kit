# Tools: Coupons and Access Codes

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_coupons` | read | `project-coupon:view-any` | Lists coupon codes, optionally narrowed to one project via `project_id` or filtered by `active`. |
| `get_coupon` | read | `project-coupon:view` | Fetches one coupon code by UUID, with its discount, limits, redemption tally, plan restriction and whether it is redeemable right now. |
| `create_coupon` | additive | `project-coupon:create` | Creates a coupon code on a project — one code any number of subscribers can redeem for money off. |
| `update_coupon` | destructive | `project-coupon:update` | Changes one or more fields of an existing coupon code; anything you omit keeps its stored value. |
| `activate_coupon` | destructive | `project-coupon:update` | Switches a coupon code on so subscribers can redeem it again, subject to its own start date, expiry and redemption cap. |
| `deactivate_coupon` | destructive | `project-coupon:update` | Switches a coupon code off so no new subscriber can redeem it. |
| `delete_coupon` | destructive | `project-coupon:delete` | Soft-deletes a coupon code so nobody can redeem it again. |
| `list_access_codes` | read | `project-access-code:view-any` | Lists access codes attached to a plan. |
| `preview_access_code_cost` | read | `project-access-code:create` | Previews the cost of generating access codes for a plan WITHOUT queuing the batch. |
| `bulk_generate_access_codes` | additive | `project-access-code:create` | Queues a batch generation of access codes for a plan. |
| `revoke_access_code` | destructive | `project-access-code:delete` | Revokes one unredeemed access code by UUID so it can no longer be redeemed and stops appearing in `list_access_codes`. |
| `get_job_status` | read | none | Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. |

## `list_coupons`

Read · requires `project-coupon:view-any`

Lists coupon codes, optionally narrowed to one project via `project_id` or filtered by `active`. Paginates with `limit` (1..100, default 25) and `page` (default 1). A coupon is one code many subscribers can redeem for money off — distinct from an access code, which is one code for one person and grants access outright. `plan_ids` empty means the code applies to EVERY plan in the project, not to none. `redemptions.remaining` is derived rather than stored, because an abandoned checkout returns its hold, so prefer it over comparing count against the cap yourself. Use to discover coupon ids before calling `create_coupon` to avoid duplicates.

**Arguments**

- `project_id` (string): Optional project UUID to narrow the list to a single project.
- `active` (boolean): Optional filter: true for codes that are switched on, false for those switched off.
- `limit` (integer): Maximum coupons to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_coupon`

Read · requires `project-coupon:view`

Fetches one coupon code by UUID, with its discount, limits, redemption tally, plan restriction and whether it is redeemable right now. Same row shape as `list_coupons`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `coupon_id` (string, required): UUID of the coupon to fetch.

## `create_coupon`

Additive · requires `project-coupon:create` · open world

Creates a coupon code on a project — one code any number of subscribers can redeem for money off. Distinct from an access code, which is one code for one person and grants access outright. `code` accepts letters, numbers and dashes only and is stored uppercase. Set `discount_type=percentage` with `discount_value` 1..99, or `discount_type=fixed` with a `currency_id`; a fixed discount only applies to plans priced in that same currency, while a percentage applies to any. Leave `plan_ids` empty to cover EVERY plan in the project, including ones added later. Omit `max_redemptions` for unlimited uses. The discount applies to the FIRST payment only — renewals are charged in full. Coupons require the Growth tier or the Coupons addon; on any other tier the call is rejected. Discounts cannot be honoured on Razorpay at all, nor on recurring plans through any provider except Stripe — the checkout tells the buyer so rather than silently charging full price.

**Arguments**

- `project_id` (string, required): UUID of the project the code belongs to.
- `code` (string, required): The code subscribers type at checkout. Letters, numbers and dashes only, 3 to 64 characters. Stored uppercase.
- `name` (string): Internal label to tell your codes apart, e.g. "Black Friday 2026". Defaults to the code itself.
- `discount_type` (string, required): Either "percentage" (works on plans in any currency) or "fixed" (requires currency_id, and only applies to plans priced in it).
- `discount_value` (number, required): For percentage, 1..99. For fixed, an amount greater than zero in the chosen currency.
- `currency_id` (string): Currency UUID. Required when discount_type is "fixed", ignored otherwise.
- `max_redemptions` (integer): Total uses allowed across everyone. Omit for unlimited.
- `max_redemptions_per_user` (integer): How many times one subscriber may use the code. Defaults to 1.
- `minimum_amount` (number): Only apply the code when the plan costs at least this much, in the plan's own currency.
- `starts_at` (string): ISO 8601 instant the code becomes usable. Omit to start immediately.
- `expires_at` (string): ISO 8601 instant the code stops working. Omit for no end date.
- `plan_ids` (array of string): Plan UUIDs to restrict the code to. Leave empty or omit to cover every plan in the project, including ones added later.
- `active` (boolean): Whether the code is usable right away. Defaults to true.

## `update_coupon`

Destructive · requires `project-coupon:update` · idempotent · open world

Changes one or more fields of an existing coupon code; anything you omit keeps its stored value. Requires `coupon_id`. Optional: `code` (letters, numbers and dashes, 3..64, stored uppercase, must be unused in the project), `name`, `discount_type` (`percentage` or `fixed`), `discount_value` (1..100 for a percentage, any amount above zero for a fixed discount), `currency_id` (needed when the effective type is fixed and the code has none yet; cleared automatically for a percentage), `max_redemptions` (null for unlimited), `max_redemptions_per_user`, `minimum_amount` (null for none), `starts_at` / `expires_at` (ISO 8601, null to clear; the end must fall after the start), `active`, and `plan_ids` (an empty list covers every plan in the project, including ones added later). The discount still applies to the FIRST payment only. Emits `coupon.updated`. Refused with `TEAM_TIER_REQUIRED` when the project owner's tier no longer includes coupons, with `VALIDATION_FAILED` per field otherwise.

**Arguments**

- `coupon_id` (string, required): UUID of the coupon to change.
- `code` (string): New code subscribers type at checkout. Letters, numbers and dashes only, 3 to 64 characters. Stored uppercase; must not already exist in the project.
- `name` (string): Internal label, 3 to 255 characters.
- `discount_type` (string): Either "percentage" or "fixed". Switching to fixed needs a currency_id unless the code already has one.
- `discount_value` (number): For percentage, 1..100. For fixed, an amount greater than zero in the coupon's currency.
- `currency_id` (string): Currency UUID for a fixed discount. Ignored and cleared for a percentage.
- `max_redemptions` (integer): Total uses allowed across everyone. Pass null for unlimited.
- `max_redemptions_per_user` (integer): How many times one subscriber may use the code.
- `minimum_amount` (number): Only apply the code when the plan costs at least this much. Pass null for no minimum.
- `starts_at` (string): ISO 8601 instant the code becomes usable. Pass null to start immediately.
- `expires_at` (string): ISO 8601 instant the code stops working. Pass null for no end date. Must fall after the start.
- `active` (boolean): Whether the code is usable.
- `plan_ids` (array of string): Plan UUIDs to restrict the code to. An empty list covers every plan in the project, including ones added later.

## `activate_coupon`

Destructive · requires `project-coupon:update` · idempotent

Switches a coupon code on so subscribers can redeem it again, subject to its own start date, expiry and redemption cap. Requires `coupon_id`. Idempotent — re-calling on a code that is already on is a no-op. Emits `coupon.activated`. Refused with `TEAM_TIER_REQUIRED` when the project owner's tier no longer includes coupons. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `coupon_id` (string, required): UUID of the coupon to switch on.

## `deactivate_coupon`

Destructive · requires `project-coupon:update` · idempotent

Switches a coupon code off so no new subscriber can redeem it. A checkout that already applied the code keeps its discount, which is why this is the right call when a code must stop right away — `delete_coupon` refuses while such a checkout is in progress. Requires `coupon_id`. Idempotent — re-calling on a code that is already off is a no-op. Emits `coupon.deactivated`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `coupon_id` (string, required): UUID of the coupon to switch off.

## `delete_coupon`

Destructive · requires `project-coupon:delete` · idempotent

Soft-deletes a coupon code so nobody can redeem it again. Past redemptions and the discounts already applied are kept for history. Requires `coupon_id`. DESTRUCTIVE: you MUST confirm the target `coupon_id` with a human before calling. Refused with `VALIDATION_FAILED` while a checkout using the code is still in progress — call `deactivate_coupon` instead, which stops new redemptions immediately without touching the checkout under way. Emits `coupon.deleted`. Idempotent — an already-deleted id surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope id does.

**Arguments**

- `coupon_id` (string, required): UUID of the coupon to delete.

## `list_access_codes`

Read · requires `project-access-code:view-any`

Lists access codes attached to a plan. Filter by `status` (`unredeemed`, `redeemed`, `expired`, `all`) and paginate with `limit` (1..100) / `page`. Codes are returned masked (first 4 + last 4 chars) so support staff can match a ticket without the full secret leaving the server. Full code values are only exposed at generation time through `bulk_generate_access_codes`.

**Arguments**

- `plan_id` (string, required): UUID of the plan to list codes for.
- `status` (one of `all`, `unredeemed`, `redeemed`, `expired`): Filter by code state. One of: unredeemed, redeemed, expired, all.
- `limit` (integer): Maximum codes to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `preview_access_code_cost`

Read · requires `project-access-code:create`

Previews the cost of generating access codes for a plan WITHOUT queuing the batch. Returns `free_remaining`, `chargeable_quantity`, and `cost` (in the creator-tier currency) plus `will_bill_overage` so the agent can surface the charge to a human before any money moves. Always call this before `bulk_generate_access_codes` when `quantity` might exceed the creator-tier free allotment — generation is free, but redemption of overage codes triggers Stripe metered billing.

**Arguments**

- `plan_id` (string, required): UUID of the plan the batch would be attached to.
- `quantity` (integer, required): How many access codes the agent is considering generating (1-10000).

## `bulk_generate_access_codes`

Additive · requires `project-access-code:create` · open world

Queues a batch generation of access codes for a plan. ASYNC — returns a `job_id` immediately; poll `get_job_status` until `status` is `completed` or `failed`. Only one batch per plan may be in flight; queueing a second while the first is unresolved is refused and names the live `job_id`. The response also carries `preview` (`free_remaining`, `chargeable_quantity`, worst-case overage cost) so the agent can surface the charge to a human before queuing; call `preview_access_code_cost` if you need the same numbers without enqueuing the batch. Generation is free — Stripe metered overage triggers on REDEMPTION when the creator-tier free allotment is exhausted. Set `export_type=messages` (with `consent=true`) to deliver one message per code to the creator's connector chat, or `export_type=file` to receive a CSV via the bot. Emits `access_code.generated` once when the worker finishes.

**Arguments**

- `plan_id` (string, required): UUID of the plan to attach the generated codes to.
- `quantity` (integer, required): How many access codes to generate (1-1000).
- `export_type` (string, required): How the job delivers the codes to the creator — file (CSV via bot) or messages (one per code via bot). Required.
- `expiry_preset` (string, required): Required. One of no_expiry, 1_day, 1_week, 1_month, 1_year, custom.
- `custom_expiry_amount` (integer): When expiry_preset=custom, the amount of custom_expiry_type units. Required when preset=custom.
- `custom_expiry_type` (string): When expiry_preset=custom, one of days/weeks/months/years. Required when preset=custom.
- `consent` (boolean): Required and must be true when export_type=messages — acknowledges that one message per code will be sent to the creator's connector chat.

## `revoke_access_code`

Destructive · requires `project-access-code:delete` · idempotent

Revokes one unredeemed access code by UUID so it can no longer be redeemed and stops appearing in `list_access_codes`. Requires `plan_id` and `access_code_id`. Only a pending, unredeemed code can be revoked: a code that was already redeemed became a subscription and surfaces here as `RESOURCE_NOT_FOUND` — read it through `get_subscription` and cancel it there if that is what you mean to do. Answers the revoked code's id with "revoked" true.

**Arguments**

- `plan_id` (string, required): UUID of the plan the code belongs to.
- `access_code_id` (string, required): UUID of the unredeemed code, from `list_access_codes`.

## `get_job_status`

Read

Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. Always pair with any tool that returns a `job_id` (`bulk_generate_access_codes`, `request_account_export`, and `revert_recovery_operation` for a channel revert); poll until `status=completed`, or in the Copilot watch the step, which follows the job live. Visibility is locked to jobs the authenticated user originally kicked off — foreign job ids return `RESOURCE_NOT_FOUND` to prevent existence leaks.

**Arguments**

- `job_id` (string, required): UUID of the async job to poll.
