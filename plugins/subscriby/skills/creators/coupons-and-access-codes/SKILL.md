---
name: coupons-and-access-codes
description: "This skill should be used when the user asks to create or manage a coupon or discount code, run a sale, generate access codes for a giveaway, an offline sale, a gift, team access or a migration, revoke a code, check a code that does not work, or asks what the code quota and overage cost are."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Coupons and access codes

Two different things that are easy to confuse:

| | Coupon code | Access code |
| --- | --- | --- |
| How many people | One code, many people | One code, one person |
| What it does | Reduces what they pay | Grants a plan outright, no payment |
| Who chooses the string | The creator (`BLACKFRIDAY`) | Subscriby generates it |
| Limited in number | No | By the creator plan's quota |
| Unlocked by | Growth, or the Coupons Addon | Every plan, with the Access Codes payment method on |

A sale is a coupon. A gift, a winner, an offline buyer, a teammate, a migration from another tool: an access code, on a free or an access-code-only plan where no money should move.

## Coupons

`create_coupon` takes `code` (letters, digits and dashes, 3 to 64, stored uppercase), `discount_type` `percentage` with `discount_value` 1 to 99 (any currency) or `fixed` with a `currency_id` (applies only to plans priced in that currency), and the fences, all optional: `max_redemptions` (a use is held while a checkout is in progress and returns to the pool if it is abandoned, so a capped code can read full and free up again), `max_redemptions_per_user` (once by default), `minimum_amount` (keeps a generous percentage off the cheapest tier), `plan_ids` (empty covers every plan, including ones added later), `starts_at` and `expires_at` (in the creator's timezone, which must be confirmed), `active`. `update_coupon` changes the terms (members who already redeemed keep what they paid); `activate_coupon` and `deactivate_coupon` switch it (switching off is the way to retire a code, history kept); `delete_coupon` removes the redemption history too and is refused while a checkout using the code is in progress. `list_coupons` (`active`) and `get_coupon` read them, with the redemptions.

Rules the user needs to hear before a campaign:

- The discount applies to the **first payment only**; renewals charge the list price. On a one-time plan or a pass the whole purchase is discounted. On a plan with a trial it applies to the charge that ends the trial.
- Every method that sells a one-time plan or a pass carries a coupon; only Stripe discounts a **recurring** plan. A member who applies a code and then picks a method that cannot discount is told to choose another or continue without it; nobody is charged full price believing a discount applied.
- A discount cannot take the price below the provider's minimum; the buyer is told why the code will not apply.
- One code per checkout; codes are unique per project; the transaction fee follows the discounted amount. The dashboard's Promotion Impact card counts only uses where the money arrived, and `coupon.redeemed` carries the subscriber id.

## Access codes

Prerequisites: a connected connector (codes are redeemed through the project's bot or on the portal) and the Access Codes payment method switched on, a dashboard step with no credential.

1. `preview_access_code_cost` with the `plan_id` and `quantity` answers `free_remaining`, `chargeable_quantity`, `cost` and `will_bill_overage`. Show the user the figures before anything is queued.
2. `bulk_generate_access_codes` with `plan_id`, `quantity` (up to 1,000 a batch), `export_type` (`file`: a CSV through the bot; `messages`: one forwardable message per code, for small batches), `expiry_preset` (`no_expiry`, `1_day`, `1_week`, `1_month`, `1_year`, `custom` with `custom_expiry_amount` and `custom_expiry_type` `days`, `weeks`, `months` or `years`) and `consent`. It answers a `job_id` at once; poll `get_job_status` until `completed` or `failed`. One batch per plan may be in flight.
3. The codes arrive in the creator's chat with the platform bot; the CSV carries the code, the plan, a **join link** that opens the bot with the code applied, the expiry, the price and the dates.

`list_access_codes` pages a plan's codes (`status` `all`, `unredeemed`, `redeemed`, `expired`), the way to look up a code a member says does not work. `revoke_access_code` withdraws an unredeemed code; a redeemed code became a subscription, so it is cancelled there (the `subscriptions-and-payments` skill).

Quota and cost, as the docs state them: the creator plan includes free codes per billing cycle (Free Plan 5; Starter Plan 25 a month or 250 a year; Growth Plan 150 a month or 1,500 a year). A code counts **when it is redeemed**, not when it is generated; unused quota does not roll over; an expired unredeemed code is deleted and frees its quota; a redemption past the quota is charged the plan's transaction fee on the plan's price, metered onto the creator's Subscriby invoice; during a free trial the quota stays at five until the first payment. The expiry is the code's, not the subscription's: a redeemed code starts a subscription for the plan's billing period, which never auto-renews; the bot reminds the member at 7, 3, 2 and 1 days (only the milestones shorter than the period) and on expiry, asking for a new code.

A plan with `eligibility.access_codes_only` never appears publicly; a `$0` plan with codes is the free-membership pattern (Starter and Growth).

## Do not

- Do not use access codes to run a sale, or a coupon to give someone free access.
- Do not queue a batch without the cost preview in front of the user, and never a second batch for a plan whose job is still running.
- Do not print a generated code into the conversation beyond what the user asked to see; the codes are the creator's to hand out.
- Do not promise a discount on a recurring plan for any method but Stripe.

## References

- [references/tools.md](references/tools.md): the twelve tools with their arguments.
- [references/events.md](references/events.md): the `coupon.*` and `access_code.*` events.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/coupons` and `/plans/{plan}/access-codes`.
- Documentation: [Coupon codes](https://docs.subscriby.net/creators/coupon-codes), [the Coupons Addon](https://docs.subscriby.net/addons/coupons), [generating access codes](https://docs.subscriby.net/creators/codes), [Access Codes as a payment method](https://docs.subscriby.net/payments/access-codes), [async jobs](https://docs.subscriby.net/mcp/v1/async-jobs).
