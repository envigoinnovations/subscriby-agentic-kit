# REST endpoints: REST API, the `me` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `me`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/me` | `account:read` | Get the caller's account | `get_me` |
| GET | `/v1/me/alert-destinations` | `account:read` | List your alert destinations | `get_alert_destinations` |
| PUT | `/v1/me/alert-destinations` | `account:write` | Replace your alert destinations | `update_alert_destinations` |
| GET | `/v1/me/copilot-credits` | `account:read` | Your Copilot Credits | `get_copilot_credits` |
| POST | `/v1/me/copilot-credits/packs` | `account:write` | Buy a pack | `create_copilot_credits_pack` |
| PATCH | `/v1/me/copilot-credits/settings` | `account:write` | Change the auto top-up and the cap | `update_copilot_credits_settings` |
| GET | `/v1/me/copilot-credits/statement` | `account:read` | Your statement | `list_copilot_credits_statement` |
| GET | `/v1/me/export` | `account:export` | Read the latest export | `get_account_export` |
| POST | `/v1/me/export` | `account:export` | Ask for an account export | `request_account_export` |
| GET | `/v1/me/identities` | `account:read` | List the caller's linked accounts | `get_me` |
| DELETE | `/v1/me/identities/{identity}` | `account:write` | Unlink an account |  |
| GET | `/v1/me/notifications` | `account:read` | List the caller's notifications | `list_notifications` |
| POST | `/v1/me/notifications/read-all` | `account:write` | Mark every notification read | `mark_all_notifications_read` |
| POST | `/v1/me/notifications/{notification}/read` | `account:write` | Mark a notification read | `mark_notification_read` |
| GET | `/v1/me/partner` | `account:read` | Get your partnership | `get_partner_program` |
| PUT | `/v1/me/partner/payout-details` | `account:write` | Set your payout details | `update_partner_payout_details` |
| GET | `/v1/me/partner/payouts` | `account:read` | List your payouts | `list_partner_payouts` |
| GET | `/v1/me/partner/referrals` | `account:read` | List your referrals | `list_partner_referrals` |
| GET | `/v1/me/partner/referrals/{referral}` | `account:read` | Get a referral | `get_partner_referral` |
| GET | `/v1/me/partner/rewards` | `account:read` | List your commissions | `list_partner_rewards` |
| POST | `/v1/me/partner/terms/accept` | `account:write` | Accept the Partner Program Terms | `accept_partner_terms` |
| GET | `/v1/me/recovery` | `project-recovery:view` | Get the caller's recovery account |  |
| DELETE | `/v1/me/recovery/backup-identity` | `project-recovery:delete` | Remove the backup account |  |
| POST | `/v1/me/recovery/backup-identity` | `project-recovery:create` | Register a backup account |  |
| POST | `/v1/me/recovery/backup-identity/switch` | `project-recovery:create` | Switch to the backup account |  |
| POST | `/v1/me/recovery/handshakes` | `project-recovery:create` | Open a recovery handshake |  |
| DELETE | `/v1/me/recovery/handshakes/{handshake}` | `project-recovery:delete` | Cancel a recovery handshake |  |
| GET | `/v1/me/recovery/handshakes/{handshake}` | `project-recovery:view` | Poll a recovery handshake |  |
| POST | `/v1/me/recovery/handshakes/{handshake}/confirm` | `project-recovery:create` | Confirm a relink handshake |  |
| GET | `/v1/me/transaction-fees` | `account:read` | List your transaction fees | `list_transaction_fees` |
| GET | `/v1/me/transaction-fees/summary` | `account:read` | Get a month's fee summary | `get_transaction_fee_summary` |

### GET `/v1/me`

```bash
curl https://api.subscriby.net/v1/me \
  -H "Authorization: Bearer <token>"
```

The caller's account; never paginated.

> **Read it once per session.** Nothing here changes under a running client except by an action the client itself takes (linking an account, changing alert destinations, switching plan). Read it on sign-in and after those actions; there is no need to poll it.

- `plan` is the platform tier's type (`free`, `starter`, `growth`, …) while the subscription is active, or `null` without one. It is the plan that gates what you can do, not the one still being billed while past due.
- `capabilities` lists every capability the tiers can grant, each `true` when your plan or an active add-on grants it. The set is fixed by the platform, so a client can render toggles from the keys without knowing them in advance.
- `current_team` is the team the token is scoped to (`scope:team:<uuid>`), when you still belong to it; `null` when the token carries no team scope. Its `id` is the value every project call resolves against.
- `teams` is every team you own or are a member of, the same list as [`GET /v1/teams`](https://docs.subscriby.net/api/v1/reference/teams/list-teams).
- `identities` is the same list as [`GET /v1/me/identities`](https://docs.subscriby.net/api/v1/reference/identities).
- `alert_destinations` is the same list as [`GET /v1/me/alert-destinations`](https://docs.subscriby.net/api/v1/reference/alert-destinations); `alert_destinations_default` is `true` while no destination has been written and the default routing applies (every class to your primary connected account, critical classes by email).
- `unread_notifications` is how many entries of your [Notifications Center](https://docs.subscriby.net/api/v1/reference/notifications) you have not opened, the number on the sidebar entry.
- `partner_code` and `partner_link` are your [Partner Program](https://docs.subscriby.net/api/v1/reference/partner-program) code and the web link it rides on, once Subscriby approved you as a partner; `null` before. The full standing, the referrals, the ledger and the payouts are at `GET /v1/me/partner`.


### GET `/v1/me/alert-destinations`

Your destinations, primary first.

- `kind` is `connector_identity` or `email` (`push_device` is reserved for the creator apps).
- `target` is the connector account's id for `connector_identity`, the same value `GET /v1/me/identities` returns as the account behind a linked identity, or the email address for `email`.
- `classes` lists the alert classes routed here, is `null` for every class, or is `[]` for none (the account is kept but receives nothing).
- `is_primary` marks the destination of your primary connected account. It is derived from your linked identities, never set through this API.

Until you write a destination, you are on the **default**: every class of alert goes to your primary connected account, and the critical classes go to your email as well. The list is empty while the default applies, and the dashboard grid shows the default as every cell ticked on that account. Linking a primary account writes the default down as rows and adds the new account to them, so from then on the rows lead.

> **Critical classes always reach your email.** Recovery, billing and security alerts are sent to your email whatever the destinations say, because they arrive when the connector you would otherwise read them on may have just failed. Routing them to a connected account adds a message there; it never removes the email.


### PUT `/v1/me/alert-destinations`

Takes the complete list you want to keep; anything not in it is removed. Each entry names a `kind`, a `target` and optional `classes`:

```bash
curl -X PUT https://api.subscriby.net/v1/me/alert-destinations \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": [
      { "kind": "connector_identity", "target": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90", "classes": ["sales", "support", "passes"] },
      { "kind": "email", "target": "ada@example.com", "classes": null }
    ]
  }'
```

The response is the resulting list. `PUT` is a replacement, not a patch: send an empty `destinations` list to remove every row and return to the default. `is_primary` in the payload is ignored; the service derives it from your linked identities.

When a creator alert is sent, every connected account routed to its class receives a message through that connector, and email is used when an email destination routes the class, when no connected account does, or when the class is critical. The same routing decides whether the bot messages you at all about a sale, a waiting member or a pass window: a class you route away from an account is never sent there. A newly linked primary account receives a destination for every class automatically, so linking keeps working as it did; unlinking the account removes its destination.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `destinations` (array of object, required): Every destination you want, at most 20. The key must be present; an empty list removes every row and restores the default.
  - `kind` (any, required): `connector_identity` for a connected account or `email` for an address.
  - `target` (string, required): The connected account's id or the email address. It must be one of your own linked accounts or your own address; anything else is refused with `404 RESOURCE_NOT_FOUND` and nothing is written.
  - `classes` (array of any): The alert classes to route here, any of `sales`, `support`, `recovery`, `billing`, `security`, `passes`, `onboarding`. Send `null` for every class or `[]` for none. `is_primary` is not accepted; the service derives it.


### GET `/v1/me/copilot-credits`

```bash
curl https://api.subscriby.net/v1/me/copilot-credits \
  -H "Authorization: Bearer <token>"
```

One object: the `balance` split into free and paid with what lapses next, this month's free `allowance` used and left, this month's usage per kind, the per-unit prices, the `packs` on sale in this environment and the `settings` the write below changes. An agent asking whether it can afford a turn needs only this.

`exhausted` is true when the pool has nothing left; the monthly allowance may still cover a turn, which is why the Copilot keeps answering on a Free Plan with an empty pool. `paid_spent_this_month_cents` is the figure the cap in `settings` is measured against.


### POST `/v1/me/copilot-credits/packs`

```bash
curl -X POST https://api.subscriby.net/v1/me/copilot-credits/packs \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "pack": "regular" }'
```

Answers `201` with the pack and the Stripe Checkout URL to send the creator to. The session pays with their card and saves it for the auto top-up; the pending purchase is credited, bonus included, when Stripe reports the session paid, and `copilot_credit.purchased` fires then. A session nobody pays expires on its own and grants nothing.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `pack` (one of `starter`, `regular`, `plus`, `max`, required): The four Copilot Credits packs a creator can buy, from the smallest to the largest. Each pack is one Stripe price; what it pays into the ledger and the free bonus that comes with it are configuration, read here so a price change never touches code. The bonus is a free grant, never money on Stripe.


### PATCH `/v1/me/copilot-credits/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/me/copilot-credits/settings \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "auto_topup_pack": "regular", "auto_topup_below_cents": 500 }'
```

Answers `200` with the settings after the change. **Every field is optional and an omitted one keeps its stored value**, so `{ "auto_topup_pack": null }` switches the auto top-up off and changes nothing else. The bounds are the Billing dialog's: a threshold of $1 to $100 and a cap of $0 to $10,000, in cents. Saving the settings resumes an auto top-up a failed charge had paused.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `auto_topup_pack` (any or null): The pack the auto top-up buys when the balance falls under the threshold, one of the packs on sale; null switches the auto top-up off. Switching it on needs a card on file.
- `auto_topup_below_cents` (integer): The balance under which the auto top-up buys, 100 to 10,000 (US cents).
- `monthly_spend_cap_cents` (integer): The paid credit the Copilot may draw in a calendar month before it stops, 0 to 1,000,000 (US cents); the free allowance is never capped.


### GET `/v1/me/copilot-credits/statement`

```bash
curl "https://api.subscriby.net/v1/me/copilot-credits/statement?per_page=50" \
  -H "Authorization: Bearer <token>"
```

Pages the last twelve months of lines, newest first: every pack bought and its bonus, every promotion and goodwill grant, every refund and lapse, and each month's usage per kind. Credits are positive and debits negative, so summing `cents` follows the balance. `sort_by` and `sort_direction` are accepted and ignored: a statement is always newest first.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/export`

```bash
curl https://api.subscriby.net/v1/me/export -H "Authorization: Bearer <token>"
```

The caller's most recent export, whatever its state; `404 RESOURCE_NOT_FOUND` when none was ever requested. Poll it after a `POST` until `status` is `ready`, then download the zip from `download_url`, a signed link that works until `download_url_expires_at`; every read of a ready export mints a fresh link. The archive itself is removed at `expires_at`, after which `status` reads `expired` and a new export must be requested.

- `status` is `queued`, `building`, `ready`, `failed` or `expired`; only `ready` carries `download_url`.
- `reason` is `manual` for a request from Settings or this endpoint, `deletion` for the archive a scheduled account deletion builds on its own.


### POST `/v1/me/export`

```bash
curl -X POST https://api.subscriby.net/v1/me/export -H "Authorization: Bearer <token>" -H "Idempotency-Key: 7c1b2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e"
```

Queues an archive of everything the caller's account holds: the account as `GET /v1/me` describes it, the webhook endpoints (never their signing secrets), the platform subscription with its invoices, and for every project the plans, resources, payment methods (never their keys), members, subscriptions, payments, coupons, dated windows and support conversations, each as a JSON file in the shape this API publishes, plus one workbook per project with a sheet per table. Answers `202` with the queued export. The build runs in the background and takes from seconds to a few minutes; the creator is also emailed a signed link when it is ready.

One export may be in flight per account and one may be requested a day; a second request is `422 VALIDATION_FAILED` with the reason and, for the daily limit, when the next one is allowed. Read the existing export instead.

> **The archive holds the members' personal data.** Hand the link only to the creator who owns the token, and treat the file as you would their database.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/identities`

```bash
curl https://api.subscriby.net/v1/me/identities \
  -H "Authorization: Bearer <token>"
```

Every account linked to the caller's creator account, by connector then purpose. Never paginated.

- `purpose` is `primary` (the account that signs you in and receives alerts) or `backup` (the account registered for [Disaster Recovery](https://docs.subscriby.net/account/account-recovery)).
- `source` says how the link was proven: `handshake` (you completed a link from Settings), `bot` (the account came in through the connector's own flow), `backfill` (migrated from before connectors), `portal` or `adopted`.
- `external_id` is the platform's own id for the account, `username` its handle when the platform has one. Secrets and chat rows are never returned.

> **Linking has no endpoint.** Linking is a two-sided proof: you open it from **Settings → Security → Linked accounts** and finish it from the account itself, by opening the link or sending the code to the connector's bot. A token cannot stand in for a person on the connector, so there is nothing to POST here.


### DELETE `/v1/me/identities/{identity}`

```bash
curl -X DELETE https://api.subscriby.net/v1/me/identities/$IDENTITY_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Drops a **primary** link at once and answers an empty `204`. You keep your password and passkeys, so nothing locks you out; what you lose until you link again is the connector side: its bot can no longer reach you or manage your projects, and its sign-in button no longer signs you in.

**Parameters**

- `identity` (path, string, required): One of the caller's links, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/notifications`

```bash
curl "https://api.subscriby.net/v1/me/notifications?unread=1&class=support" \
  -H "Authorization: Bearer <token>"
```

Newest first, paginated with `page` and `per_page` like every list. `unread=1` narrows to entries not yet read (`unread=0` to the ones already read); `class` narrows to one class; `q` to entries whose title or body contains the words.

- `class` is the alert class the creator routes on **Settings → Notifications**: `sales`, `support`, `recovery`, `billing`, `security`, `passes` or `onboarding`; `class_label` is its name in the creator's language.
- `title` and `body` are the alert's heading and one sentence of context, the same words the email used, in the creator's language at the time it was sent.
- `route` and `params` name the dashboard screen the entry opens, as a named route and its parameters, for a client that maps routes to screens; `url` is the same place resolved, for a client that does not. All three are `null` when the alert points nowhere.
- `read` is whether the creator opened it; `read_at` says when.

Every creator alert is written to the notification centre beside whatever else it sends (the email, the message on a connected account the creator routed it to on **Settings → Notifications**). The entry is shaped from the alert's email: its subject becomes the title, its first line the body, its call to action the route and URL. There is no webhook for a new entry; the alerts that matter to an integration already fire their own events (`recovery.*`, `connector.*`, `support.*`), and a Zap that wants the inbox itself polls the `notification_received` trigger.

**Parameters**

- `unread` (query, boolean or null): `1` narrows to entries not yet read, `0` to the ones already read; omit it for both.
- `class` (query, string): Narrow to one alert class: `sales`, `support`, `recovery`, `billing`, `security`, `passes` or `onboarding`. An unknown class is refused.
- `q` (query, string or null): Words the title or body must contain, up to 120 characters.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/me/notifications/read-all`

```bash
curl -X POST https://api.subscriby.net/v1/me/notifications/read-all \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with how many entries were unread and are read now. A second call marks nothing and answers `0`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/notifications/{notification}/read`

```bash
curl -X POST https://api.subscriby.net/v1/me/notifications/$NOTIFICATION_ID/read \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with the entry, `read` now `true`. Idempotent: an entry already read keeps its first `read_at`.

**Parameters**

- `notification` (path, string, required): The row, resolved by the route binder as the caller's.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/partner`

```bash
curl https://api.subscriby.net/v1/me/partner \
  -H "Authorization: Bearer <token>"
```

Where you stand, whole. `status` is `applied` while Subscriby reviews the application, `active` once approved, `rejected` with `reapply_available_at` when it was declined, or `suspended`. Until approval the computed parts are `null`: there is no `code`, no `links`, no `commission_percent`, no `balance`.

Once approved:

- `code` is the seven-character partner code and `links.web` the address to hand out; `links.connectors` carries one deep link per connector whose bot signs creators up, each opening the sign-up conversation with the code attached.
- `commission_percent` is the rate a creator who converts **from now on** is locked to, as a decimal string with two places. It is a ladder: `base_percent` plus `commitment_points` (the verified promotion commitments) plus `volume_points` (the volume tiers reached at `paying_referrals`), capped at `max_percent`; `next_tier_at` and `next_tier_points` say what the next tier takes and adds. A referral keeps the rate it was promised at conversion; a raise reaches every referral still inside its commission period, a drop only new conversions.
- `referrals` tallies the creators brought in by state, and `balance` carries the ledger's sums as decimal strings with four places in `currency`: `pending` (inside the hold), `payable` (approved and not yet settled, clawbacks netted), `credited`, `paid` and `earned` (all of them together).
- `commitments` lists every promotion commitment with its proof state; a commitment is made and its proof submitted on the dashboard or in the bot, where the rules are explained.


### PUT `/v1/me/partner/payout-details`

```bash
curl -X PUT https://api.subscriby.net/v1/me/partner/payout-details \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "paypal",
    "details": "ada@example.com",
    "legal_name": "Ada Lovelace",
    "tax_country": "GB",
    "us_person": false,
    "accept_terms": true
  }'
```

Writes how you are paid: the rail, what it pays to, and the tax declaration every cash rail needs. `paypal` and `crypto` take their one `details` (the PayPal email, the USDT TRC20 wallet address); `wise` and `remitly` take the bank account (`bank_holder`, `bank_name`, `bank_country`, `bank_account_number`, and `bank_swift`, `bank_branch_code`, `bank_address` when the transfer needs them); `credit` takes nothing and is accepted while that rail is open. Only the destination the chosen rail uses is kept, encrypted; a rail you leave behind keeps nothing on file. The response is the partner object with `payout_method` and `payout_details_complete` updated and the destination absent.

> **The terms come first.** A rail cannot be saved until you have accepted the Partner Program Terms: send `accept_terms: true` here, or call the terms endpoint before.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `method` (one of `credit`, `paypal`, `wise`, `remitly`, `crypto`, required): How a partner takes what the Partner Program owes them. Credit needs nothing typed: an approved commission is applied to the partner's own Stripe balance and offsets their next invoices. The four cash rails are paid by the owner by hand: PayPal and USDT to one typed detail (an email, a wallet address), Wise and Remitly into a bank account (the holder, the bank, its country, the account number, and the codes some transfers need). Either is the partner's money, so it is stored encrypted and never announced. Whatever a rail charges to carry the money comes out of the payout, which the terms say in so many words.
- `details` (string): What a single-detail rail pays to: the PayPal email for `paypal`, the wallet address for `crypto`. Required on those rails, ignored on the others. At most 190 characters.
- `bank_holder` (string): The name on the bank account, for `wise` and `remitly`. At most 120 characters.
- `bank_name` (string): The bank, for `wise` and `remitly`. At most 120 characters.
- `bank_country` (string): Where the bank is, as an ISO 3166-1 alpha-2 code, for `wise` and `remitly`.
- `bank_account_number` (string): The account number or IBAN, for `wise` and `remitly`: letters, digits, spaces and dashes, at most 40 characters.
- `bank_swift` (string): The SWIFT or BIC code, when the bank has one: 8 or 11 characters.
- `bank_branch_code` (string): The branch, routing, sort or IFSC code, when the transfer needs one: letters, digits, spaces and dashes, at most 20 characters.
- `bank_address` (string): The account holder's address, when the transfer needs one. At most 200 characters.
- `legal_name` (string): The name a payment is made out to. Required on every cash rail. At most 120 characters.
- `tax_country` (string): The country of tax residence, as an ISO 3166-1 alpha-2 code. Required on every cash rail.
- `us_person` (boolean): Whether you are a US person for tax purposes.
- `accept_terms` (boolean): Send `true` to accept the Partner Program Terms with this save. A rail cannot be saved until the terms are accepted, here or through the terms endpoint.


### GET `/v1/me/partner/payouts`

Pages the cash Subscriby paid you, newest first: the `amount`, the rail it went by (`method` is `paypal`, `wise`, `remitly` or `crypto`), the transfer's `reference`, when it left and how many commissions it covered (`rewards_paid`). Commissions settled as Subscriby Credit are not payouts; they read as `credited` on the rewards list.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/partner/referrals`

```bash
curl "https://api.subscriby.net/v1/me/partner/referrals?status=converted&per_page=25" \
  -H "Authorization: Bearer <token>"
```

Pages the creators you brought to Subscriby, newest first. `status` is `signed_up`, `converted`, `under_review`, `expired` or `rejected`. Each row names the referred creator by display name alone: they are a Subscriby customer, not yours, so their email and id never appear. An application still under review has no referrals and answers an empty page.

**Parameters**

- `status` (query, string): Keep only referrals in this state: `signed_up`, `converted`, `under_review`, `expired` or `rejected`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/partner/referrals/{referral}`

One referral: how the creator arrived (`source` is `link`, `code_at_signup` or `bot_deep_link`), whether their first paid invoice converted them and on which `plan`, the `commission_percent` locked onto them at conversion, and `commission_ends_at`, when you stop earning on them. Another partner's referral is `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `referral` (path, string, required): The referral, resolved within the caller's partnership by the route binder.


### GET `/v1/me/partner/rewards`

```bash
curl "https://api.subscriby.net/v1/me/partner/rewards?status=approved" \
  -H "Authorization: Bearer <token>"
```

Pages the commission ledger, newest first: one `commission` row per paid platform invoice of a referred creator, priced from the invoice's total before tax and after discount (`base_amount`) at the referral's locked rate (`amount`), plus the `clawback` rows that answer a reversal of money already settled, each with a negative `amount`. `status` is `pending` (inside the hold), `approved` (payable), `credited` (applied as Subscriby Credit), `paid` (covered by a cash payout) or `reversed`; `note` says why a row was reversed or re-priced. The ledger is read-only on every surface: rows are written by invoices, moved by the hold, settled by a credit or a payout and reversed by a refund or a dispute.

**Parameters**

- `status` (query, string): Keep only rows in this state: `pending`, `approved`, `credited`, `paid` or `reversed`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/me/partner/terms/accept`

```bash
curl -X POST https://api.subscriby.net/v1/me/partner/terms/accept \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Records that you accept the [Partner Program Terms](https://www.subscriby.net/legal/partners) as they stand today, with their version; accepting again after the terms change is the same call. Answers the partner object with `terms_accepted_at` and `terms_version` set. Emits no event.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/recovery`

```bash
curl https://api.subscriby.net/v1/me/recovery \
  -H "Authorization: Bearer <token>"
```

Recovering the creator's sign-in account, and keeping a backup account ahead of a ban, are two-sided **handshakes**: the API mints a code, the creator taps the link (or types the code) from the account to detect, the connector records which account that was, and the API confirms. Both sides have to agree, which is what keeps a leaked link from binding a stranger. These endpoints live under `/v1/me` because they are about the caller, never a project, and the actions behind them refuse anyone but the account holder.

These flows are deliberately not offered as MCP tools: moving a sign-in is a human act, and [`get_me`](https://docs.subscriby.net/mcp/v1/tools/account/get-me) already shows which accounts are linked.

- `primary_display_name` and `backup_display_name` name the accounts as the connector reported them; their identifiers on the connector never appear.
- `relink_handshake` and `backup_handshake` are the newest handshake of each kind, in whatever state, so a client can pick up a flow the creator started on the dashboard or in the bot.


### DELETE `/v1/me/recovery/backup-identity`

Stops keeping a backup. Answers `204`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/recovery/backup-identity`

```bash
curl -X POST https://api.subscriby.net/v1/me/recovery/backup-identity \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"handshake_id": "0c4f9e2a-7b31-4d68-a5e2-9f1c3b7d6e80"}'
```

Registers the account a **completed backup** handshake detected as the backup (Growth Plan). Answers `200` with the account summary.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `handshake_id` (string, required): A `backup` handshake of the caller's in state `completed`; the account that tapped it becomes the backup.


### POST `/v1/me/recovery/backup-identity/switch`

Moves the sign-in to the backup right now, keeping the previous account as the new backup; spends the account allowance and offers the same undo as a relink. Answers `200` with the recovery operation and raises `recovery.identity_relinked` beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/me/recovery/handshakes`

```bash
curl -X POST https://api.subscriby.net/v1/me/recovery/handshakes \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"kind": "relink"}'
```

`kind` is `relink` (move the sign-in to a new account; needs the account recovery allowance) or `backup` (register a backup account; needs the Growth Plan). Answers `201` with the pending handshake: `code` is the eight-character code to type into the bot, `start_link` the link that opens the bot on it (`null` when the creator cannot be reached on the connector), and the handshake expires fifteen minutes after it was minted.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `relink`, `backup`, required): What a completed identity handshake is for. The same deep link and the same bot-side verification serve two purposes: replacing the creator's identity after a ban (`Relink`), and registering a second identity ahead of time so a later ban is a one-click switch (`Backup`). The kind is fixed when the handshake opens, so a link minted to register a backup can never be used to replace the primary identity.


### DELETE `/v1/me/recovery/handshakes/{handshake}`

Cancels a pending handshake so its code stops working. Answers `204`.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/recovery/handshakes/{handshake}`

`status` moves from `pending` to `completed` when an account taps, with `detected_display_name` and `detected_identity_id` filled; `expired` when the code ran out or was cancelled; `consumed` once confirmed.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.


### POST `/v1/me/recovery/handshakes/{handshake}/confirm`

Confirms a **completed relink**: the sign-in moves to the account that tapped, every browser session is signed out, the account allowance is spent, and the undo mail goes out. Answers `200` with the recovery operation (`kind: account`, `revertible: true`) and raises `recovery.identity_relinked` beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `handshake` (path, string, required): The handshake, resolved within the caller's own by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/me/transaction-fees`

```bash
curl "https://api.subscriby.net/v1/me/transaction-fees?month=2026-10&channel=metered" \
  -H "Authorization: Bearer <token>"
```

Pages the ledger, the most recently incurred first. `month` keeps one calendar month (`YYYY-MM`, UTC) and wins over `from` and `to`, which bound the window by instant; `project_id` keeps one project's lines; `channel` is `connect_at_source` or `metered`; `kind` is `payment_fee`, `access_code_fee`, `trial_usage`, `outage_emails` or `processing_recovery`. Sort with `sort_by` (`occurred_at` by default, or `fee_amount`, `units`, `kind`, `channel`, `created_at`) and `sort_direction`.

Each row names what the fee was for and, for a payment's fee, the project, the member, the purchase and the payment it was priced from with the gross amount, the currency and the rate applied. `fee_amount` is in `fee_currency`, your billing currency; `units` are the cents the meter counted, zero on a fee taken at source. A line of a different kind (a trial's waived fees, a recovery's emails, an invoice's processing recovery) carries its `meter_identifier` and no payment.

**Parameters**

- `month` (query, string): Keep only the lines of one calendar month, as `YYYY-MM` in UTC, such as `2026-10`; wins over `from` and `to`.
- `from` (query, string): Keep only lines incurred at or after this instant, ISO 8601.
- `to` (query, string): Keep only lines incurred before this instant, ISO 8601.
- `project_id` (query, string): Keep only the lines earned on this project.
- `channel` (query, string): Keep only lines collected one way: `connect_at_source` (deducted from the member's payment by Stripe Connect) or `metered` (billed on your own Subscriby invoice).
- `kind` (query, string): Keep only lines of one kind: `payment_fee`, `access_code_fee`, `trial_usage`, `outage_emails` or `processing_recovery`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/me/transaction-fees/summary`

```bash
curl "https://api.subscriby.net/v1/me/transaction-fees/summary?month=2026-10" \
  -H "Authorization: Bearer <token>"
```

Adds up one calendar month, the current one when `month` is left out. `total_fee` is every line; `at_source_fee` is what Stripe Connect deducted from members' payments and never invoiced; `metered_fee` is what reached the usage meter, the figure to hold against that month's Transaction Fees line on your Subscriby invoice, split into `invoiced_fee` (a paid invoice has collected it) and `awaiting_invoice_fee` (it lands on the next one). `by_kind` lists the month per kind of fee, `by_project` per project largest first (the fees no project carries pool under a null id), and `invoices` the Subscriby invoices that billed the month's metered lines. Pass `project_id` to add up one project alone; `by_project` is then empty.

**Parameters**

- `month` (query, string): The calendar month to add up, as `YYYY-MM` in UTC, such as `2026-10`; the current month when left out.
- `project_id` (query, string): Add up one project's lines alone; every project when left out, in which case the per-project shares are returned too.

