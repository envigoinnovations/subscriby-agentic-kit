# Tools: Subscriptions and Payments

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_subscriptions` | read | `project-subscription:view-any` | Pages every subscription the token may see, newest first: id, plan, subscriber, payment method, payment status, price, trial end, end date and whether it was cancelled — the same row shape `get_subscription` answers, which adds the access grants. |
| `get_subscription` | read | `project-subscription:view` | Fetches one subscription by UUID: its plan, subscriber, payment method, payment status, price, trial end, end date, whether it was cancelled, when an access code was redeemed, and its access `grants` (one per resource and pass window, with connector, mode, state and failure). |
| `cancel_subscription` | destructive | `project-subscription:update` | Cancels a subscription. |
| `pause_subscription` | destructive | `project-subscription:update` | Pauses an active or trialing subscription: billing stops and the member keeps their place without being cancelled. |
| `unpause_subscription` | destructive | `project-subscription:update` | Resumes a paused subscription, restarting billing and restoring resource access. |
| `reactivate_subscription` | destructive | `project-subscription:update` | Undoes a scheduled cancellation, putting the subscription back on its normal billing cycle. |
| `list_subscription_grants` | read | `project-subscription:view` | Lists the access grants a subscription holds: one row per resource (and per pass window) with the connector that gave access, the mode (`bearer_link` invite link, `membership`, `role`, `creator_task`), the state (`pending_identity`, `pending`, `held`, `granted`, `revoked`, `failed`), the connector's reference (the invite link, on a connector that grants by link) and, for a failure, `failure_kind` and `failure_detail`. |
| `reissue_subscription_grants` | destructive | `project-subscription:update` | Revokes the access grants a member holds on a subscription — every resource, or only `resource_id` — and has fresh ones issued by the same job that grants at purchase; the bot sends the member the new links. |
| `list_transactions` | read | `project-subscription:view-any` | Keyset-paginated transaction listing for one project, ordered reverse-chronologically. |
| `list_recent_payments` | read | `project-subscription:view-any` | Lists the most recent subscription payments for one project, ordered by `occurred_at` descending. |
| `list_payment_methods` | read | `project-payment-method:view-any` | Lists configured payment methods for one project. |
| `get_payment_method` | read | `project-payment-method:view` | Fetches one configured payment method of a project by UUID. |
| `activate_payment_method` | destructive | `project-payment-method:update` | Offers a configured payment method to buyers again and re-queues the plan sync for its gateway. |
| `deactivate_payment_method` | destructive | `project-payment-method:update` | Stops offering a payment method to new buyers and re-queues the plan sync for its gateway; the subscriptions already sold through it keep renewing. |
| `delete_payment_method` | destructive | `project-payment-method:delete` | Removes a payment method from a project. |
| `sync_payment_method_plans` | destructive | `project-payment-method:update` | Queues a push of the project owner's plans into a payment method's gateway catalogue (Stripe products and prices, Polar products, Kelviq plans, PayPal, Razorpay or CoinPayments plans). |

## `list_subscriptions`

Read · requires `project-subscription:view-any`

Pages every subscription the token may see, newest first: id, plan, subscriber, payment method, payment status, price, trial end, end date and whether it was cancelled — the same row shape `get_subscription` answers, which adds the access grants. Optional "status" matches one payment status ("trialing", "active", "incomplete", "expired", "past_due", "canceled", "unpaid", "paused", "processing", "succeeded", "capturable" or "failed"; an unknown word is `VALIDATION_FAILED`), "plan_id" scopes to one plan, and `limit` (1..100, default 25) with `page` walk the pages. `list_subscribers` lists the people; this lists their purchases.

**Arguments**

- `status` (string): Match one payment status word; an unknown value is refused naming the accepted list.
- `plan_id` (string): Scope to one plan by UUID.
- `limit` (integer): Rows per page, 1..100. Defaults to 25.
- `page` (integer): Page number, from 1.

## `get_subscription`

Read · requires `project-subscription:view`

Fetches one subscription by UUID: its plan, subscriber, payment method, payment status, price, trial end, end date, whether it was cancelled, when an access code was redeemed, and its access `grants` (one per resource and pass window, with connector, mode, state and failure). The same fields the REST subscription payload carries. Use before `cancel_subscription`, `pause_subscription` or `remind_pass_holder` to read the current state back rather than assuming it. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription to fetch.

## `cancel_subscription`

Destructive · requires `project-subscription:update` · idempotent · open world

Cancels a subscription. Async — the call queues a provider-side cancellation; the local row flips to `canceled` and `subscription.cancelled` emits when the worker finishes. Returns `{ subscription_id, status: "cancellation_queued" }` immediately. DESTRUCTIVE: you MUST confirm the target `subscription_id` with a human before calling — this stops billing and revokes connector resource access on the next sync. Idempotent — already-canceled subscriptions return `SUBSCRIPTION_ALREADY_ACTIVE` rather than double-firing.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription to cancel.

## `pause_subscription`

Destructive · requires `project-subscription:update` · idempotent · open world

Pauses an active or trialing subscription: billing stops and the member keeps their place without being cancelled. This is the non-destructive alternative to `cancel_subscription` — prefer it whenever a human asks to "stop billing", "put on hold" or "freeze" an account, because it can be undone with `unpause_subscription` while a cancellation cannot. Confirm the target with a human first; the member loses resource access. Idempotent — pausing an already-paused subscription is a no-op. Emits `subscription.paused`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription to act on.

## `unpause_subscription`

Destructive · requires `project-subscription:update` · idempotent · open world

Resumes a paused subscription, restarting billing and restoring resource access. Refuses anything that is not currently paused. Emits `subscription.unpaused`. Safe to call — this restores service rather than removing it.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription to act on.

## `reactivate_subscription`

Destructive · requires `project-subscription:update` · idempotent · open world

Undoes a scheduled cancellation, putting the subscription back on its normal billing cycle. This is the recovery path for a cancellation made in error, and the tool to reach for on a win-back ("they changed their mind"). Refuses a subscription that was never cancelled. Emits `subscription.reactivated`. Safe to call — it restores an intent the member already had.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription to act on.

## `list_subscription_grants`

Read · requires `project-subscription:view`

Lists the access grants a subscription holds: one row per resource (and per pass window) with the connector that gave access, the mode (`bearer_link` invite link, `membership`, `role`, `creator_task`), the state (`pending_identity`, `pending`, `held`, `granted`, `revoked`, `failed`), the connector's reference (the invite link, on a connector that grants by link) and, for a failure, `failure_kind` and `failure_detail`. Answers "does this member actually have access?" — read it instead of inferring access from the payment status. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription whose grants to list.

## `reissue_subscription_grants`

Destructive · requires `project-subscription:update`

Revokes the access grants a member holds on a subscription — every resource, or only `resource_id` — and has fresh ones issued by the same job that grants at purchase; the bot sends the member the new links. The members page's "Refresh invite links" for agents: use it when a link expired or leaked, or after a chat's admins cleared a ban. Answers `reissued` (grants withdrawn) and `status: reissue_queued`; read the fresh grants back with `list_subscription_grants`. Raises `member.resource_reissued` per grant and `member.resource_added` per fresh one. THIS KILLS LIVE LINKS AND MESSAGES A REAL PERSON: read the subscription back first and never loop it. A subscription that is not active is `VALIDATION_FAILED`; unknown, foreign or out-of-scope ids, or a `resource_id` the plan does not grant, surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription whose grants to reissue.
- `resource_id` (string): UUID of one resource of the plan to reissue alone; omit to reissue every resource the subscription grants.

## `list_transactions`

Read · requires `project-subscription:view-any`

Keyset-paginated transaction listing for one project, ordered reverse-chronologically. Filter by `period` preset or explicit `from`/`to` ISO dates, plus allow-lists for `statuses`, `provider_ids`, `plan_ids`, and `currency_ids`. Pass `cursor` from the previous response's `meta.next_cursor` to continue. Each row carries its owning `project_id`/`project_name`, `plan_id`/`plan_name` and `subscriber_id`/`subscriber_name`, so a payment can be attributed without a follow-up lookup. Raw webhook payloads are never returned. Use this over `list_recent_payments` when walking a long history; reach for `get_earnings_report` when you only need totals.

**Arguments**

- `project_id` (string, required): UUID of the project whose transactions to list.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".
- `statuses` (array of any): Optional payment-status allow-list. Values: successful, failed, pending, refunded.
- `provider_ids` (array of any): Optional payment-method (provider) UUID allow-list.
- `plan_ids` (array of any): Optional plan-UUID allow-list applied to the parent subscription.
- `currency_ids` (array of any): Optional currency UUID allow-list.
- `cursor` (string): Opaque keyset cursor returned in a prior meta.next_cursor. Pass to continue pagination.
- `limit` (integer): Maximum rows to return (1..200, default 50).

## `list_recent_payments`

Read · requires `project-subscription:view-any`

Lists the most recent subscription payments for one project, ordered by `occurred_at` descending. Filter by `status` (`successful`, `pending`, `failed`, `refunded`, etc. — see `subscriby://enums/subscription-status`) and cap with `limit` (1..200, default 50). Rows include the external provider id and event id but never the raw webhook payload. Use for live activity feeds; reach for `list_transactions` when you need keyset pagination over a long window.

**Arguments**

- `project_id` (string, required): UUID of the project whose payments to list.
- `status` (one of `successful`, `failed`, `pending`, `refunded`): Payment status filter. One of: successful, failed, pending, refunded
- `limit` (integer): Maximum payments to return (1..200, default 50).

## `list_payment_methods`

Read · requires `project-payment-method:view-any`

Lists configured payment methods for one project. Provider secrets, webhook signing secrets, and Stripe Connect account ids are always stripped — only `id`, `provider`, `connector`, `mode`, `active`, and `created_at` are surfaced. `provider` is a gateway code or a `connector:provider` key for a currency a connector brings, and `connector` names that connector or is null. Set `active_only=true` to omit deactivated methods. Safe to call when deciding whether a plan can charge against a given provider.

**Arguments**

- `project_id` (string, required): UUID of the project whose payment methods to list.
- `active_only` (boolean): When true, omits deactivated payment methods.

## `get_payment_method`

Read · requires `project-payment-method:view`

Fetches one configured payment method of a project by UUID. Requires `project_id` and `payment_method_id`. Same row shape as `list_payment_methods`: only `id`, `provider`, `connector`, `mode`, `active` and `created_at` — provider secrets, webhook signing secrets and Stripe Connect account ids are never surfaced. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method to fetch.

## `activate_payment_method`

Destructive · requires `project-payment-method:update` · idempotent

Offers a configured payment method to buyers again and re-queues the plan sync for its gateway. Requires `project_id` and `payment_method_id`. Idempotent — re-calling on a method that is already on is a no-op. A Stripe method whose Connect onboarding never finished is refused with `VALIDATION_FAILED`: it can only be completed from the dashboard. Emits `project.payment_method.updated` when the switch flips. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method to switch on.

## `deactivate_payment_method`

Destructive · requires `project-payment-method:update` · idempotent

Stops offering a payment method to new buyers and re-queues the plan sync for its gateway; the subscriptions already sold through it keep renewing. Requires `project_id` and `payment_method_id`. Idempotent — re-calling on a method that is already off is a no-op and emits nothing. Emits `project.payment_method.updated` when the switch flips. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method to switch off.

## `delete_payment_method`

Destructive · requires `project-payment-method:delete` · idempotent

Removes a payment method from a project. The row is soft-deleted, so subscriptions sold through it keep their gateway for refunds and history, and configuring the same gateway again later revives it. Requires `project_id` and `payment_method_id`. DESTRUCTIVE: you MUST confirm the target `payment_method_id` with a human before calling — buyers lose that way to pay at once. Emits `project.payment_method.deleted`. Idempotent — an already-deleted id surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope id does.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method to remove.

## `sync_payment_method_plans`

Destructive · requires `project-payment-method:update` · idempotent · open world

Queues a push of the project owner's plans into a payment method's gateway catalogue (Stripe products and prices, Polar products, Kelviq plans, PayPal, Razorpay or CoinPayments plans). Requires `project_id` and `payment_method_id`. Answers with status "sync_queued": the work runs in the background and each plan reports through the plan-sync webhook events as it lands. A gateway that keeps no catalogue (connector currencies, access codes, the redirect gateways) is refused with `VALIDATION_FAILED`. Idempotent — queuing twice pushes the same catalogue twice. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method whose gateway catalogue to refresh.
