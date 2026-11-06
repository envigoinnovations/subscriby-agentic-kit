# REST endpoints: Rest api, the `referral-rewards` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `referral-rewards`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-rewards` | `project-referral:view-any` | List rewards | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |

### GET `/v1/projects/{project}/referral-rewards`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-rewards?affiliate_id=0b1c2d3e-4f50-4617-8a9b-0c1d2e3f4a5b&status=approved" \
  -H "Authorization: Bearer sbt_..."
```

Pages the ledger, newest first: one row per settled payment per side of a referral. `affiliate_id`, `status` (`pending`, `approved`, `paid`, `applied`, `reversed`) and `beneficiary` (`referrer`, `friend`) narrow it. A reversal is a row of its own with a negative `amount` and `reverses_reward_id` naming the reward it cancels. The ledger is read-only: rewards are written when a payment settles, made payable by the hold, paid by a recorded payout and reversed by a refund.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate_id` (query, string): Keep only the rewards one affiliate's referrals earned.
- `status` (query, string): Keep only rewards in this state: `pending` (inside the hold, or days waiting on the balance), `approved` (payable), `paid` (recorded in a payout), `applied` (days banked on a membership) or `reversed` (taken back by a refund).
- `beneficiary` (query, string): Keep only the rewards of one side: `referrer` or `friend`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.

