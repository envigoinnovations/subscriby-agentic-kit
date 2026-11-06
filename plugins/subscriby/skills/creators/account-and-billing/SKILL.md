---
name: account-and-billing
description: "This skill should be used when the user asks about their own Subscriby account, notifications and where alerts go, exporting their data, the Partner Program and its commissions or payouts, transaction fees and invoices, Copilot Credits and packs, their creator plan or addons, or their API tokens."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# The account, its billing and its ledgers

The creator's own side of Subscriby: who they are, how they are told things, what Subscriby charged them, what Subscriby pays them, and the credentials they hold. None of it involves a project. The creator's own plan (Free, Starter or Growth; the 7-day trial; addons; the billing portal) is dashboard-only; the tools read its ledgers.

## Account and notifications

- `get_me`: the creator, the plan and its capabilities, `current_team`, every team, the linked accounts, where alerts go, the unread count.
- `list_notifications` (`unread`, `class`: `sales`, `support`, `recovery`, `billing`, `security`, `passes`, `onboarding`, `partner`, `retention`, `copilot`, `broadcasts`; `query`), `mark_notification_read`, `mark_all_notifications_read`.
- `get_alert_destinations` and `update_alert_destinations` (`destinations`, the whole grid): which class of alert reaches which linked account and the email. Recovery, billing and security always reach the email; routing them to an account adds a message and never removes the email. Read the grid first and send it whole.

## The data export

`request_account_export` builds an archive of everything the account holds (the account as `get_me` answers it, the webhook endpoints without secrets, the creator's own plan with its invoices, and per project the plans, resources, payment methods without keys, members with their accounts, subscriptions with payments, coupons, pass windows and support conversations, each as JSON plus a workbook) and answers the job; poll `get_job_status`, then `get_account_export` for the signed link, which works 24 hours; the archive is removed after seven days. One export builds at a time and one may be requested per day. The archive holds members' personal data: say so.

## The Partner Program

Subscriby's own referral scheme: a creator who brings other creators earns a share of every invoice they pay for twelve months (5% rising to 30% with verified promotions and milestones), settled as Subscriby Credit on their own invoices or paid out in cash monthly, with a 20% welcome discount for the referred creator for three months. Applying is done in person on the dashboard or in the bot; a creator who never applied is `RESOURCE_NOT_FOUND` on every tool.

- `get_partner_program`: the application's state, the code and links once approved, the commission ladder and the next tier, the referral tallies, the balances, the payout rail and whether it is complete, the tax declaration, the terms, every commitment with its proof state.
- `list_partner_referrals` (creators named by display name alone), `get_partner_referral`, `list_partner_rewards` (the ledger; clawbacks as negative rows; a commission is pending in a 30-day hold, then payable), `list_partner_payouts`.
- `update_partner_payout_details` writes the rail (`method` and its fields) and the tax declaration, never read back by any tool; `accept_partner_terms` records the terms. A referral converts when the creator pays a first Starter or Growth invoice within 180 days; only new accounts count; the partner link remembers a visitor for 60 days.

## Transaction fees

What Subscriby charged the creator: 10% of each sale on the Free Plan, 3% on Starter, 1% on Growth; nothing on test payments; the Free rate during a trial until the first payment; addons are fixed charges, not fees; a coupon's discount reduces the fee's base. `list_transaction_fees` (`month`, `from`, `to`, `project_id`, `channel`, `kind`) pages the ledger line by line (what each fee was for: a payment, an access code past the free allotment, a trial's waived fees, recovery emails; the payment it was priced from; how it was collected: deducted at source by Stripe Connect or metered onto the creator's Subscriby invoice; the invoice that billed it); `get_transaction_fee_summary` (`month`, `project_id`) adds one month up per channel, kind, project and invoice, its metered total being the figure to hold against that month's invoice line.

## Copilot Credits

The prepaid pool Subscriby Copilot draws on once the month's free turns are spent (10 on Free, 25 on Starter, 50 on Growth): $0.10 a turn, $0.05 a suggested inbox reply, $0.01 a member answer; packs of $10, $25 (+$2.50 free), $50 (+$7.50) and $100 (+$15); free credit spent first, then paid oldest first; nothing is ever invoiced, and it is not Subscriby Credit (the Partner Program's balance on the creator's Stripe account, taken off their next invoice). `get_copilot_credits` answers the balance split, the allowance used and left, the prices, the packs and the settings; `list_copilot_credits_statement` every grant, lapse and month of usage; `create_copilot_credits_pack` (`pack`) opens a purchase and answers a Stripe Checkout URL the creator pays on, never credit; `update_copilot_credits_settings` (`auto_topup_pack` or null, `auto_topup_below_cents`, `monthly_spend_cap_cents`; amounts in US cents). The team permission `copilot:use` opens the Copilot to a teammate.

## Tokens

`list_tokens`, `get_token`, `create_token` (`name`, `abilities`, `team_id`: attenuated to the caller's own abilities, `token:create` never inherited, the plaintext answered once), `revoke_token`. The `authentication` and `tokens-and-abilities` skills carry the rules.

## Do not

- Do not read the tools' figures as the creator's plan invoice; the invoice is on the dashboard and in the billing portal.
- Do not touch a payout rail or Copilot settings without the user's explicit yes, and never ask them for bank details in the conversation.
- Do not promise a Partner Program application or a credit payout that the tools cannot make.

## References

- [references/tools.md](references/tools.md): the twenty-six tools with their arguments.
- [references/events.md](references/events.md): the `billing.*`, `partner.*` and `copilot_credit.*` events.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/me` and `/v1/tokens`.
- [references/abilities.md](references/abilities.md): the `account`, `billing` and `tokens` abilities.
- Documentation: [Your creator account](https://docs.subscriby.net/account), [notifications](https://docs.subscriby.net/account/notifications), [the Partner Program](https://docs.subscriby.net/account/partner-program), [transaction fees](https://docs.subscriby.net/fees), [credits and packs](https://docs.subscriby.net/credits), [subscriptions](https://docs.subscriby.net/subscriptions), [addons](https://docs.subscriby.net/addons).
