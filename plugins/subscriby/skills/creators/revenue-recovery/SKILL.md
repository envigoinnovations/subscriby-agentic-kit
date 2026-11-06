---
name: revenue-recovery
description: This skill should be used when the user asks about failed renewals, the grace window, dunning, why members leave, cancellation reasons or offers, win-back or nurture sequences, leads who never bought, stalled checkouts, trials about to end, or the Revenue Recovery figures and settings.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Revenue Recovery

What a project does when a renewal fails, when a member cancels, after a member leaves, and in the moments before a sale. Subscriby never charges the member again: the gateway holds the card and retries on its own schedule; Revenue Recovery keeps the member's access while it does, tells them with the gateway's own way to pay, and lets them back in the moment a charge settles.

The notices, the grace window, the cancellation question, the checkout ledger and the figures are on every plan; the cancellation offers and the sequences on all four triggers are included on the Growth Plan, or on Free and Starter through the Revenue Recovery Addon.

## When a renewal fails

- A failed renewal on a recurring membership opens a **grace window** of `grace_days` (0 to 30; a new project starts at 0, which pauses access at the first failure). The clock starts at the first failure and never restarts on a failed retry. A never-paid trial is removed at once; a one-time purchase ends at the close of its period.
- Four notices reach the member in their connector chat or by email: at the failure, on day three, the day before the window closes, at the pause; each carries the rail's own way to pay again (Stripe's hosted invoice page, PayPal's automatic-payments page, the portal's memberships page for Polar, Paystack and Razorpay, Kelviq's own payment link, the portal checkout elsewhere). Nothing is sent twice or after the member paid.
- At the close the member is **paused** (links revoked, removed from the places) while the subscription stays `past_due`, so the next settled charge can restore it: fresh links, a welcome back, `subscription.payment_recovered`.

## When a member cancels

Up to three screens on the portal and in the bot: the **reason** (a fixed list in the member's language plus an optional sentence; `cancel_feedback_enabled`), one **offer** chosen for the member's payment method from the ones switched on (`offer_pause_enabled`: one cycle on hold, Stripe and PayPal; `offer_discount_coupon_id`: a coupon on the renewals, Stripe; `offer_return_coupon_id`: a coupon to come back with, any method), then the confirmation. Everything is written down; `subscription.cancellation_feedback` and `subscription.offer_taken` announce it.

## Sequences

A sequence is up to eight messages in the creator's words on the days they chose after one of four triggers: a member who left (the win-back), a new lead, a stalled checkout, a trial without a card about to end. The first step waits 0 to 180 days after the trigger, each later step 1 to 180 days after the one before; a step is up to 1,000 characters with `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` filled per member, may carry one coupon, and always carries the way to the plan as a button beside a Stop command. A member is enrolled once per departure into every running sequence on the trigger, and leaves when a charge settles (won back, or converted), when they press Stop, when the platform cannot reach them, or when the sequence is switched off.

- `list_sequences` (`trigger`, `active`), `get_sequence`, `create_sequence` (`name`, `trigger`, `active`, `steps` whole), `update_sequence` (steps are replaced whole), `delete_sequence`.
- `list_sequence_enrollments` pages the passages members made through one (`exit_reason`).
- A sequence switched off enrols nobody and lets everyone part-way through go; switching it back on enrols nobody retroactively. A pass, a series or a one-time purchase that ran its course is not a departure.

## Before they join

- A **lead** is anyone recorded for the first time without a purchase (`member.lead_created`); the leads the project already had are a broadcast audience, not a sequence's.
- Every checkout a member starts is in the **checkout ledger** the moment they are handed the way to pay; an hourly sweep marks one **stalled** once `checkout_stall_hours` passed with no settled charge and no live membership (`checkout.stalled`, once a day per member), and the next settled charge closes it as recovered (`checkout.recovered`). `list_checkouts` (`stalled`, `recovered`, `plan_id`, `member_id`).
- A trial without a card enters the trial-ending sequences `trial_notice_days` before it ends.

## Settings and figures

- `get_retention_settings` and `update_retention_settings` carry `grace_days`, `digest_enabled` (the daily digest), `cancel_feedback_enabled`, the three offers, `checkout_stall_hours` and `trial_notice_days`. Explain what a change does to members before confirming it.
- `get_retention_stats` (`period`) answers the figures the dashboard card shows: failed renewals, recoveries and what they were worth, cancellations and reasons, offers taken, the leads, checkouts and trials the sequences nurtured.
- `list_retention_activity` (`kind`: failed renewals, reminders, pauses, recoveries, restorations, offers, sequence steps) is the ledger behind every figure; `list_cancellation_feedback` (`reason`, `surface`) the screens members answered.

## Do not

- Do not promise a retry or a charge; the gateway retries, Subscriby does not move money.
- Do not write a sequence step that names another member or a figure; keep it in the creator's voice.
- Do not switch an offer on for a method that cannot honour it; the screens pick the offer by method anyway.

## References

- [references/tools.md](references/tools.md): the twelve tools with their arguments.
- [references/events.md](references/events.md): the `checkout.*` and `sequence.*` events (the cancellation and recovery events sit under `subscription.*` in `subscriptions-and-payments`).
- [references/endpoints.md](references/endpoints.md): the REST twins for retention and sequences.
- Documentation: [Revenue Recovery](https://docs.subscriby.net/creators/revenue-recovery), [the addon](https://docs.subscriby.net/addons/revenue-recovery), [follow-up messages, the member's side](https://docs.subscriby.net/subscribers/follow-up-messages).
