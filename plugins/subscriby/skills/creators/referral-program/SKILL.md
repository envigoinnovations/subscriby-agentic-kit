---
name: referral-program
description: "This skill should be used when the user asks about a project's Referral Program, affiliates, referral codes or links, free membership days or cash commissions for members who bring friends, approving or suspending an affiliate, the reward ledger, or recording a payout to an affiliate."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# The Referral Program

A project's one programme turns members into affiliates: each who joins gets a code and a link, a friend who arrives through them is theirs for thirty days, and when the friend's first payment settles the affiliate earns what the creator promised. Subscriby tracks every touch, quotes every reward when the payment lands, holds cash commissions through the refund window, reverses them on a refund, and keeps the ledger the creator pays from. Bundled with the Growth Plan; on Free and Starter through the Referral Program Addon. It is not the Partner Program, where a creator refers creators to Subscriby and Subscriby pays (`account-and-billing`).

## The programme

`get_referral_program` reads it; `update_referral_program` creates it on the first call and later changes only the arguments present:

- `reward_kind`: free membership days (`reward_days`, banked on the affiliate's own membership, waiting on their balance if they hold none) or a cash commission (`commission_type` percentage or fixed, `commission_value`, `commission_currency_id`; a percentage can run for the first payment only, a number of `commission_period_months`, or for life; a fixed amount earns on the first payment only).
- `friend_reward_kind`: nothing, free days (`friend_reward_days`) or one of the project's coupons applied at the friend's checkout (`friend_coupon_id`; needs coupon codes on the plan).
- `hold_days` (default 14) before a commission is payable; `customers_only` (only members with a live membership may join); `approval_required`; `minimum_payout` (a guide for the creator, shown to nobody); `terms` and `payout_details_label` (the question affiliates answer so they can be paid, such as a PayPal email); `plan_ids` (conversions outside the list earn nothing); `active`.

`activate_referral_program` and `deactivate_referral_program` switch it (a pause stops links counting and payments earning at once, keeps the ledger readable, tells every affiliate; switching back on tells them the terms as they stand); `delete_referral_program` is refused while any affiliate is owed a commission. Rewards never change after they are written; a change applies to payments that settle afterwards.

## How a referral is counted

A friend arrives through the affiliate's portal link, their bot link, or by typing the code where the checkout asks for a coupon; they are counted for thirty days, the first affiliate to touch them keeps them, an existing payer cannot be referred, and an affiliate cannot refer themselves. The reward is earned when the first payment settles: days are banked at once; a commission is written `pending`, becomes `payable` when the hold passes, is `reversed` by a refund inside the hold, and a refund after a payout writes a clawback the next payout nets.

## Affiliates and the ledger

- `list_referral_affiliates` (`status`, `member_id`), `get_referral_affiliate` (the one read with the per-currency balances: earned, payable, paid), `add_referral_affiliate` by `member_id` (approved whatever the switches say), `approve_referral_affiliate`, `suspend_referral_affiliate` (their code stops counting; what they earned stays payable).
- `list_referrals` (`status`, `affiliate_id`, `since`), `get_referral`, `list_referral_rewards` (`affiliate_id`, `status`, `beneficiary`) for the friends and the ledger.
- `list_referral_payouts` and `record_referral_payout` (`affiliate_id`, `amount`, `currency_id`, `reference`, `note`): a payout **records money that already left** the creator's hands, marks the oldest payable commissions in that currency as paid up to the amount, and tells the affiliate; it is refused above the payable balance, so read `get_referral_affiliate` first. An affiliate's own payout details (the wallet or email they typed) never travel over the tools or the webhooks; the creator reads them on the dashboard.

## Do not

- Do not record a payout the creator has not made, and never above the balance read first.
- Do not promise a reward on a renewal unless the programme's commission runs over a period or for life.
- Do not confuse it with the Partner Program or with coupons.

## References

- [references/tools.md](references/tools.md): the fifteen tools with their arguments.
- [references/events.md](references/events.md): the ten `referral.*` events (programme updated, affiliate joined, approved, suspended, captured, converted, reward earned, approved, reversed, payout recorded).
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/referral-program`, `/referral-affiliates`, `/referrals`, `/referral-rewards` and `/referral-payouts`.
- Documentation: [Referral Program](https://docs.subscriby.net/creators/referral-program), [the addon](https://docs.subscriby.net/addons/referral-program), [refer a friend, the member's side](https://docs.subscriby.net/subscribers/refer-a-friend).
