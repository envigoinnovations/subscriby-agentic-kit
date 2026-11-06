# REST endpoints: Rest api, the `referral-program` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `referral-program`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| DELETE | `/v1/projects/{project}/referral-program` | `project-referral:delete` | Delete the programme | `delete_referral_program` |
| GET | `/v1/projects/{project}/referral-program` | `project-referral:view` | Get the programme | `get_referral`, `get_referral_affiliate`, `get_referral_program` |
| PUT | `/v1/projects/{project}/referral-program` | `project-referral:update` | Set up or change the programme | `update_referral_program` |
| POST | `/v1/projects/{project}/referral-program/activate` | `project-referral:update` | Switch the programme on | `activate_referral_program` |
| POST | `/v1/projects/{project}/referral-program/deactivate` | `project-referral:update` | Switch the programme off | `deactivate_referral_program` |

### DELETE `/v1/projects/{project}/referral-program`

Removes the programme. Answers `204` with no body.

> **A delete can be refused.** While any affiliate is owed a commission, the delete answers `422` and asks you to record their payouts or switch the programme off instead. Deleting emits no event.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/referral-program`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program \
  -H "Authorization: Bearer sbt_..."
```

The programme as it stands, with its commission currency's ISO code loaded. `404 RESOURCE_NOT_FOUND` while the project has none.

### Three fields that are easy to misread

> **`plan_ids: []` means every plan, not no plans.** A conversion counts on every plan in the project, including plans added later. Treating it as "restricted to nothing" inverts the meaning.

**`commission_period_months`** is `0` for the friend's first payment only, a number of months, or `null` for life. A `fixed` commission is always the first payment only and always reports `0`.

**`commission_value` is a decimal string with four places**: `"20.0000"` for 20% of each payment, `"10.0000"` for ten of the commission currency. Parse it as a decimal, never a float. `commission_currency_id` is `null` on a percentage, which is earned in each payment's own currency.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/referral-program`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "reward_kind": "cash",
    "commission_type": "percentage",
    "commission_value": 20,
    "commission_period_months": 6,
    "hold_days": 14,
    "friend_reward_kind": "free_days",
    "friend_reward_days": 3,
    "payout_details_label": "PayPal email",
    "terms": "One referral per household."
  }'
```

The first PUT creates the programme and answers `201`; every later PUT changes only the fields it carries and answers `200`. Omitting a field keeps its stored value; a first save without `reward_kind` is a free-days programme, and without `friend_reward_kind` gives friends nothing.

> **Changing the terms is not retroactive, and the affiliates are told.** Rewards already in the ledger keep their figures. Every approved or pending affiliate receives the new terms in their chat and by mail when a field they were promised moves: the reward, the commission, the hold, the friend's reward or your own terms text. Who may join, the payout label and the minimum payout are your side and send nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `active` (boolean): The on/off switch. Prefer the activate and deactivate endpoints, which fire the same event with only that change.
- `customers_only` (boolean): Whether only members with a live membership may join. Defaults to false.
- `approval_required` (boolean): Whether you approve each affiliate before their code counts. Defaults to false.
- `reward_kind` (one of `free_days`, `cash`): What a referrer earns per referral: membership time, or money the creator pays out. Two kinds and no third, because every other shape a creator asked for (a coupon for the referrer, store credit) is one of these in disguise and each adds a surface the Payouts tab would have to explain.
- `reward_days` (integer): Days a referrer earns per converted friend, 1 to 3650; required when `reward_kind` is `free_days`.
- `commission_type` (any or null): `percentage` of every settled payment or a `fixed` amount on the first; required when `reward_kind` is `cash`.
- `commission_value` (number): The rate: 0.0001 to 100 for a percentage, any amount above zero for a fixed commission. Stored as a decimal string with four places.
- `commission_currency_id` (string): The currency a `fixed` commission is paid in; required then, cleared for a percentage.
- `commission_period_months` (integer): How long a percentage commission runs after conversion: `0` for the friend's first payment only, 1 to 36 months, or null for life. A fixed commission is always the first payment only.
- `hold_days` (integer): Days a cash commission waits before it is payable, so a refund inside the window can take it back: 0 to 90. Defaults to 14.
- `minimum_payout` (number): A guide for you, the balance an affiliate reaches before you pay; nothing is enforced. Null for none.
- `friend_reward_kind` (one of `none`, `free_days`, `coupon`): What the referred friend receives for arriving through a referral, if anything. Days are banked on the friend's first purchase the moment it settles; a coupon is applied at their checkout and follows the coupon's own rules, which is why it is offered only to creators who hold the Coupons capability.
- `friend_reward_days` (integer): Days banked on the friend's first purchase, 1 to 3650; required when `friend_reward_kind` is `free_days`.
- `friend_coupon_id` (string): One of this project's coupon codes, applied at the friend's checkout; required when `friend_reward_kind` is `coupon`. Needs coupon codes on the project owner's plan.
- `payout_details_label` (string): The question affiliates answer so you can pay them, such as `PayPal email`; at most 120 characters. Null for none.
- `terms` (string): Your own terms, shown to affiliates and referred friends; at most 5,000 characters. Null for none.
- `plan_ids` (array of string): Restrict conversions to these plans of the project, at most 200. Omit to leave the restriction alone; send `[]` for every plan, including plans added later.


### POST `/v1/projects/{project}/referral-program/activate`

Links and codes attribute again and settled payments earn again. Emits `referral.program_updated` with `active` as the one change, and every affiliate is told the terms as they now stand. Answers `200` with the programme.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/referral-program/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/referral-program/deactivate \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: $(uuidgen)"
```

The safe way to stop: links stop attributing and payments stop earning at once, while the ledger and the payouts stay readable and every affiliate is told their link no longer counts new friends. Emits `referral.program_updated`. Answers `200` with the programme.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

