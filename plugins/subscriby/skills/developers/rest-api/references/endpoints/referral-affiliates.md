# REST endpoints: Rest api, the `referral-affiliates` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `referral-affiliates`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/referral-affiliates` | `project-referral:view-any` | List affiliates | `list_referral_affiliates`, `list_referral_payouts`, `list_referral_rewards`, `list_referrals` |
| POST | `/v1/projects/{project}/referral-affiliates` | `project-referral:create` | Enrol a member by hand | `add_referral_affiliate` |
| GET | `/v1/projects/{project}/referral-affiliates/{affiliate}` | `project-referral:view` | Get an affiliate | `get_referral`, `get_referral_affiliate`, `get_referral_program` |
| POST | `/v1/projects/{project}/referral-affiliates/{affiliate}/approve` | `project-referral:update` | Approve an affiliate | `approve_referral_affiliate` |
| POST | `/v1/projects/{project}/referral-affiliates/{affiliate}/suspend` | `project-referral:update` | Suspend an affiliate | `suspend_referral_affiliate` |

### GET `/v1/projects/{project}/referral-affiliates`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-affiliates?status=approved&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Pages the programme's affiliates, newest first. `status` is `pending`, `approved` or `suspended`; `member_id` finds the affiliate row of one member. A list row never carries `balances`: read one affiliate for what they are owed.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Keep only affiliates in this standing: `pending` (awaiting the creator's approval), `approved` (their code counts) or `suspended` (their code no longer counts; what they earned stays).
- `member_id` (query, string): Find one member's affiliate row by their member id, as the members endpoints list them.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/referral-affiliates`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-affiliates \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "member_id": "a1b2c3d4-e5f6-4718-8a9b-0c1d2e3f4a5b" }'
```

Enrols a member as an affiliate, approved whatever the programme's switches say, and hands them their code, their links and the programme's terms in their chat and by mail. Emits `referral.affiliate_joined`. Answers `201` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `member_id` (string, required): The id of a member of this project, as the members endpoints list them.


### GET `/v1/projects/{project}/referral-affiliates/{affiliate}`

One affiliate with their `balances` per currency. An affiliate's own payout details, the wallet address or PayPal email they typed, are never returned by any endpoint: they are the affiliate's money, read only by the dashboard when the creator pays.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.


### POST `/v1/projects/{project}/referral-affiliates/{affiliate}/approve`

Approves a pending or suspended affiliate: their code counts from now on, and they receive their link, code and the programme's terms in their chat and by mail. Emits `referral.affiliate_approved`. An affiliate already approved is left as they are and nothing is emitted. Answers `200` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/referral-affiliates/{affiliate}/suspend`

Their code stops counting new friends and nothing new is earned; what they already earned stays and can still be paid. Emits `referral.affiliate_suspended`. Answers `200` with the affiliate.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `affiliate` (path, string, required): The affiliate, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

