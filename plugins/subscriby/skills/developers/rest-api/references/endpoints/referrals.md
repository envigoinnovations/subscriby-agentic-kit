# REST endpoints: REST API, the `referrals` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `referrals`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referrals` | `project-referral:view-any` | List referrals | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| GET | `/v1/projects/{project}/referrals/{referral}` | `project-referral:view` | Get a referral | `get_referral`, `get_referral_affiliate`, `get_referral_program` |

### GET `/v1/projects/{project}/referrals`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referrals?status=converted&since=2026-10-01" \
  -H "Authorization: Bearer sbt_..."
```

Pages the friends affiliates brought in, newest first. `status` is `touched`, `converted`, `expired` or `rejected`; `affiliate_id` narrows to one affiliate; `since` keeps the referrals whose friend arrived on or after that instant, so a report can page only what happened after its last run.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Keep only referrals in this state: `touched` (the friend arrived, not yet paid), `converted` (their first payment settled), `expired` (the attribution window passed) or `rejected`.
- `affiliate_id` (query, string): Keep only the referrals one affiliate brought in.
- `since` (query, string): Keep only referrals whose friend arrived on or after this instant, ISO 8601, so a report can page what happened since its last run.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/referrals/{referral}`

One referral: how the friend arrived (`source` is `portal_link`, `connector_link` or `code_at_checkout`; `connector` names the bot's platform on a connector link), whether their first payment settled, and `commission_ends_at`, the instant the affiliate stops earning on them on a programme with a period.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `referral` (path, string, required): The referral, resolved within the project by the route binder.

