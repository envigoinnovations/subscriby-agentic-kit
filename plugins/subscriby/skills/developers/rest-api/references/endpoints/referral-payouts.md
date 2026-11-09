# REST endpoints: REST API, the `referral-payouts` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `referral-payouts`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-payouts` | `project-referral:view-any` | List payouts | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| POST | `/v1/projects/{project}/referral-payouts` | `project-referral:update` | Record a payout | `record_referral_payout` |

### GET `/v1/projects/{project}/referral-payouts`

Pages the payouts the creator recorded, newest first; `affiliate_id` narrows to one affiliate. `rewards_paid` is how many commissions each payout covered.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate_id` (query, string): Keep only the payouts recorded against one affiliate.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/referral-payouts`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-payouts \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_id": "0b1c2d3e-4f50-4617-8a9b-0c1d2e3f4a5b",
    "amount": 30,
    "currency_id": "f0e1d2c3-b4a5-4697-8877-665544332211",
    "reference": "PAYPAL-7F3D1C92"
  }'
```

Records money that already left: you paid the affiliate outside Subscriby and file it here, so the ledger marks their oldest payable commissions in that currency as paid, first in first out, until the amount is covered. Emits `referral.payout_recorded`. Answers `201` with the payout.

> **The amount is capped at the payable balance.** Read the affiliate's `balances` first; `payable` in the currency is the most a payout may record. Pending commissions are still inside the hold and cannot be paid yet.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `affiliate_id` (string, required): The affiliate who was paid, as the referral-affiliates endpoints list them.
- `amount` (number, required): What was paid, greater than 0, at most the affiliate's payable balance in that currency.
- `currency_id` (string, required): The currency the commissions were earned in; a balance exists per currency.
- `reference` (string): Your own reference, such as a transfer id; at most 120 characters.
- `note` (string): A note for your records; at most 1,000 characters.

