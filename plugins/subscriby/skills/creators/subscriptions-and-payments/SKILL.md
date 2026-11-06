---
name: subscriptions-and-payments
description: This skill should be used when the user asks about subscriptions and their statuses, cancelling, pausing or reactivating one, a member's payments, transactions, refunds or failed charges, payment methods and gateways, test against live mode, syncing plans to a provider, or the currency a member pays in.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Subscriptions and payments

A subscription is one purchase of one plan by one member: which plan, which payment method, its status, what was paid and when it renews or ends. A member can hold several over time (a trial, an upgrade, a return after churn). A transaction is one payment attempt against a subscription: a first purchase, a renewal, a refund or a failed charge.

## The statuses

`subscriby://enums/subscription-status` is the catalogue; these are the ones every answer needs:

| Status | Meaning |
| --- | --- |
| `active` | Running and paid up. |
| `trialing` | Inside a trial. |
| `pending`, `processing`, `capturable` | A payment submitted, being processed, or authorised but not captured. |
| `incomplete` | The payment did not complete in time. |
| `past_due` | A renewal failed; the member keeps access for the project's grace window while the gateway retries, then is paused until a charge settles. |
| `unpaid` | The gateway gave up; access ends. |
| `failed` | The payment failed outright. |
| `expired` | The period ended and access stopped. |
| `canceled` | Cancelled by the member or the creator; access usually runs to the end of the paid period, then the record expires. |
| `paused` | Access suspended by the creator, by the provider, or by the member taking the pause offer, which ends by itself after one cycle. |

A pass reads `active` from the moment it is paid and carries its own window state beside it (awaiting its window, access granted, ended, never joined); a series carries how many passes are left. Read those from `get_subscription`, never infer them from the status.

## Reading

- `list_subscriptions` pages every purchase the credential may see, with `status` and `plan_id` filters; `get_subscription` answers one with its dates, the window on a pass, the gateway reference and whether it grants access right now (a cancelled renewal still does until its end date).
- `list_subscription_grants` and `reissue_subscription_grants` are the member's places and their invites (the `members` skill).
- `list_transactions` pages a project's payment ledger with `period` or `from`/`to`, `statuses`, `provider_ids`, `plan_ids`, `currency_ids`, a `cursor` and `limit`; amounts are as paid, in the payment's currency, never converted. `list_recent_payments` answers the latest with a `status` of `successful`, `failed`, `pending` or `refunded`.

## Changing a subscription

Every one of these is destructive: name the member, the plan and the consequence, then wait for a yes.

- `cancel_subscription`: stops future renewals; the member keeps access until the paid period ends, then is removed from the places. It sends the member **no message**, and it issues **no refund**; refunds are made in the payment provider's own dashboard and that refund does message the member. On a pass, cancelling releases the date back on sale for that member and they will not be admitted.
- `pause_subscription` suspends access: the member is removed from every place and the record reads `paused`. The dashboard's Suspend Access warns that the provider keeps billing on its normal schedule, and only some providers can hold a charge, so say to the user that a paused member may still be charged and should be told; `unpause_subscription` restores access with fresh invite links.
- `reactivate_subscription` calls off a scheduled cancellation on a Stripe-paid subscription.
- A plan change, an upgrade or a downgrade is the member's own act on the portal or in the bot; there is no tool to move a member between plans.

## Payment methods

A payment method is one gateway connection on a project, live or test. `list_payment_methods` (`active_only`) and `get_payment_method` read them; `activate_payment_method` and `deactivate_payment_method` switch them (a deactivated method keeps renewing its existing subscribers and takes no new ones); `delete_payment_method` leaves its subscriptions with nothing to bill from, so their next renewal fails: never the answer to "hide it".

Connecting a gateway, replacing its keys and switching Access Codes on are dashboard steps, because a credential is typed by a person. A provider exists at most once live and once test per project; a test method takes no real money and a portal whose methods are all test is kept out of search.

What each provider does: Stripe (cards and wallets, 138+ currencies, discounts on recurring plans, Connect), PayPal, Polar (merchant of record, tax handled, 120+ countries), Mollie (iDEAL, SEPA, Bancontact, cards, 29 currencies), Kelviq (merchant of record, chases failed renewals), Paystack (Africa), Razorpay (India), Skrill, CoinPayments and CeyPay (crypto, one-time only), a connector's native payment (Telegram Stars: live, one-time, in the bot only) and Access Codes (no money moves). Recurring billing exists on Stripe, PayPal, Polar, Mollie, Kelviq, Paystack and Razorpay only; a recurring plan on the others never renews.

`sync_payment_method_plans` pushes every plan to a provider that keeps its own catalogue (Stripe, PayPal, Polar, Kelviq, CoinPayments, Razorpay); it runs by itself when a plan goes on sale, and by hand after a provider was connected late, reconnected, or when the bot says a plan is not available for a provider.

## Currency

A member always pays in the plan's currency; their bank or provider converts, Subscriby adds no margin. Dashboard totals and the transaction fee convert through USD at a daily rate. A plan priced in one currency cannot be paid in another; the pattern is one plan per currency.

## Do not

- Do not tell a member a subscription was cancelled or refunded until the tool answered and, for a refund, the provider did it.
- Do not pause as a "polite cancel": it keeps charging.
- Do not delete a payment method with subscriptions on it.
- Do not quote a status from memory; read the subscription.

## References

- [references/tools.md](references/tools.md): the sixteen tools with their arguments.
- [references/events.md](references/events.md): the `subscription.*` and `payment.*` events.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/subscriptions` and `/v1/projects/{project}/payment-methods`.
- [references/abilities.md](references/abilities.md): the `payments` abilities.
- Documentation: [Managing subscriptions](https://docs.subscriby.net/creators/managing-subscriptions), [All transactions](https://docs.subscriby.net/creators/transactions), [Payment methods](https://docs.subscriby.net/creators/methods), [choosing a provider](https://docs.subscriby.net/payments/choosing-a-provider), [currency conversion](https://docs.subscriby.net/payments/currency-conversion), [status reference](https://docs.subscriby.net/reference/status-codes).
