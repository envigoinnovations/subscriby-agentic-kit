# REST endpoints: Revenue Recovery

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `retention`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/retention` | `project-subscription:view` | Read the settings | `get_retention_settings` |
| PUT | `/v1/projects/{project}/retention` | `project-subscription:update` | Change the settings | `update_retention_settings` |
| GET | `/v1/projects/{project}/retention/activity` | `project-subscription:view-any` | List the activity ledger | `list_retention_activity` |
| GET | `/v1/projects/{project}/retention/cancellations` | `project-subscription:view-any` | List the cancellation screens | `list_cancellation_feedback` |
| GET | `/v1/projects/{project}/retention/checkouts` | `project-subscription:view-any` | List the checkouts | `list_checkouts` |
| GET | `/v1/projects/{project}/retention/stats` | `project-subscription:view-any` | Read the figures | `get_retention_stats` |

### GET `/v1/projects/{project}/retention`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention \
  -H "Authorization: Bearer sbt_..."
```

The grace window with the ladder it implies in words, the digest switch, the cancellation question, the three offers with the coupons they carry, and the two nurture windows: `checkout_stall_hours` (how long a checkout may stay open with no settled charge before the hourly sweep counts it as stalled and the stalled-checkout sequences start; 1 to 24, 1 by default) and `trial_notice_days` (how many days before a trial without a card ends its trial-ending sequences start; 1 to 14, 3 by default; a shorter trial enrols at its start). The row is created with the defaults on the first read, so a project never answers `404` here.

### Two fields that are easy to misread

**`offers_available` is the owner's plan, not a setting.** It is `true` on Growth and with the Revenue Recovery Addon. The three offer fields are stored whatever it says; the cancellation screen reads them only while it is `true`.

**`ladder` is derived from `grace_days`.** It is the sentence the dashboard and the bot show for the window, in the token holder's language; write `grace_days` and read `ladder` back.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PUT `/v1/projects/{project}/retention`

```bash
curl -X PUT https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"grace_days": 10, "offer_pause_enabled": true, "offer_return_coupon_id": "3b7c9d1e-5f24-4a86-9c0b-2d4e6f8a1b3c"}'
```

Every field is optional and the row keeps its stored value for each one left out, so a client can flip the digest without restating the window. A coupon must be one of the project's own; send `null` to clear an offer. The two nurture windows are whole numbers within their bounds (`checkout_stall_hours` 1 to 24, `trial_notice_days` 1 to 14); a checkout already open is judged by the window in force when the hourly sweep runs. The answer is the settings as they now read.

> A grace window of `0` pauses access at the first failure. The never-paid trial keeps today's immediate revoke whatever the window says, and a one-time purchase never enters grace.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `grace_days` (integer): How many days a failed renewal keeps access while the gateway retries, 0 to 30. `0` pauses access at the failure.
- `digest_enabled` (boolean): Whether the owner gets one message a day with the failures, reminders, pauses and recoveries, only on a day something happened.
- `cancel_feedback_enabled` (boolean): Whether the cancellation screen asks the member why before the offer. Off skips straight to the offer.
- `offer_pause_enabled` (boolean): Whether a cancelling member on Stripe or PayPal is offered one billing cycle on hold. Needs the Growth Plan or the Revenue Recovery Addon; ignored by the screen without it.
- `offer_discount_coupon_id` (string): One of this project's coupons, applied to the member's renewals where Stripe can carry it, or `null` for no discount offer. Needs the Growth Plan or the Revenue Recovery Addon.
- `offer_return_coupon_id` (string): One of this project's coupons, handed to the member on the way out on every payment method, or `null` for no return coupon. Needs the Growth Plan or the Revenue Recovery Addon.
- `checkout_stall_hours` (integer): How many hours a checkout may stay open with no settled charge before the hourly sweep counts it as stalled and the stalled-checkout sequences start, 1 to 24; such as `4`.
- `trial_notice_days` (integer): How many days before a trial without a card ends its trial-ending sequences start, 1 to 14; such as `3`. A trial shorter than that enrols at its start.


### GET `/v1/projects/{project}/retention/activity`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/activity?kind=payment_recovered" \
  -H "Authorization: Bearer sbt_..."
```

The ledger behind every figure: one row per notice, offer, feedback and win-back message, with the member, the kind, the channel that carried it, when it went out, and, once a charge settled after it, `converted_at` and the payment that counted it. `kind` keeps one kind of row; `sort_by` takes `created_at`, `sent_at` or `kind`.

> A row converts when the next charge settles for that member, which is how the figures count a recovery and a member won back; a notice that converts is not a notice that worked on its own, only one that preceded the payment.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `kind` (query, string): Keep only one kind of row: `payment_failed_notice`, `grace_reminder`, `grace_final_warning`, `access_suspended`, `access_restored`, `payment_recovered`, `offer_shown`, `offer_taken`, `feedback` or `sequence_step`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/cancellations`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/cancellations?reason=too_expensive&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Every cancellation screen a member reached, newest first: the member, the plan, the reason they picked, their own words, the offer shown and whether they took it, where they answered, and the pause's dates where they took one. `reason` and `surface` narrow the page; `sort_by` takes `created_at`, `reason`, `surface` or `offer_taken`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reason` (query, string): Keep only the records whose member gave this reason: `too_expensive`, `not_using_enough`, `not_enough_content`, `content_not_expected`, `found_another_community`, `not_the_right_fit`, `taking_a_break`, `got_what_i_needed`, `technical_problems`, `signed_up_by_mistake` or `other`.
- `surface` (query, string): Keep only the records made on the `portal` or in a connector chat (`bot`).
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/checkouts`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/checkouts?stalled=true&recovered=false" \
  -H "Authorization: Bearer sbt_..."
```

Every checkout a member started, newest first: the member, the plan they were buying, the rail and where they started (`portal` or `bot`), the order reference the rail was given, when it started, when the hourly sweep counted it as stalled, when a charge finished it or another checkout superseded it, summed up as `outcome`: `open` while nothing has settled and the sweep has not counted it, `stalled` once the project's checkout window passed with no settled charge, `recovered` when a charge settled after that, `completed` when a charge settled before it could stall, and `superseded` when it closed with no charge of its own because the member paid through another checkout or already held a live membership when the sweep looked. One charge finishes one checkout and brings back one stalled checkout, so a member who tapped Pay three times and paid once has one `completed` and two `superseded`. `enrollment_id` names the stalled-checkout sequence passage the stall opened. `stalled` and `recovered` (booleans; `recovered` reads among the stalled rows, and a stalled row another checkout superseded answers neither), `plan_id` and `member_id` narrow the page; `sort_by` takes `started_at`, `stalled_at` or `completed_at`.

> An access code redemption or a free trial start is not a checkout and never appears here. A member is counted as stalled at most once a day however many checkouts they started; the older open ones are stamped stalled without a second `checkout.stalled` or a second passage.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `stalled` (query, string): Keep only the checkouts the hourly sweep counted as stalled (`true`), or only the ones it never did (`false`). Omit for both.
- `recovered` (query, string): Keep only the stalled checkouts a charge finished after all (`true`), or only the stalled ones still open (`false`). Omit for both.
- `plan_id` (query, string or null): Keep only the checkouts of one plan.
- `member_id` (query, string or null): Keep only one member's checkouts, by their member id as the members endpoints list them.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/retention/stats`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/retention/stats?period=30d" \
  -H "Authorization: Bearer sbt_..."
```

What the programme did over the window, as the dashboard card reads it: the failed renewals, the reminders sent, the pauses, the recoveries with what they brought back restated in US dollars, the restorations, the win-back steps sent and the members won back (the churn trigger alone), the cancellation screens with the offers shown and taken, and why members cancelled with each reason's share; then the nurture block: the leads who arrived, entered a lead sequence and bought while it ran, the checkouts started, stalled and recovered with what the recovered ones were worth in US dollars, and the trials without a card a sequence took and the ones whose member paid while it ran. The two "right now" figures, the members in grace and the members paused, ignore the window.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `period` (query, string): The window the figures cover: `7d`, `14d`, `30d` (the default), `60d`, `90d`, `1y`, `mtd`, `qtd`, `ytd` or `all`. The two "right now" figures ignore it.


## `sequences`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/sequences` | `project-sequence:view-any` | List a project's sequences | `list_sequences` |
| POST | `/v1/projects/{project}/sequences` | `project-sequence:create` | Create a sequence | `create_sequence` |
| DELETE | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:delete` | Delete a sequence | `delete_sequence` |
| GET | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:view` | Get a sequence | `get_sequence` |
| PATCH | `/v1/projects/{project}/sequences/{sequence}` | `project-sequence:update` | Change a sequence | `update_sequence` |
| GET | `/v1/projects/{project}/sequences/{sequence}/enrollments` | `project-sequence:view-any` | List a sequence's enrolments | `list_sequence_enrollments` |

### GET `/v1/projects/{project}/sequences`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences?active=true&per_page=25" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's sequences, newest first, each with its steps in order and how it has done: every member ever enrolled, the members still receiving steps, the members who received every step, and the members a payment brought back while they were enrolled. `active` keeps the running or the paused ones; `trigger` keeps one trigger; `sort_by` takes `created_at`, `name` or `updated_at`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `active` (query, string): Keep only running sequences (`true`) or only paused ones (`false`). Omit for both.
- `trigger` (query, string): Keep only the sequences on one trigger: `churned`, `lead`, `stalled_checkout` or `trial_ending`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/sequences`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"name": "Win-back after churn", "steps": [{"delay_days": 3, "body": "Hi {name}, your place in {project} is still here: {link}"}, {"delay_days": 7, "body": "{coupon} takes {discount} off: {link}", "coupon_id": "3b7c9d1e-5f24-4a86-9c0b-2d4e6f8a1b3c"}]}'
```

Builds the sequence with its steps in one write and answers it with `201`; `trigger` defaults to `churned` and `active` to `true`. Up to 8 steps, the first 0 to 180 days after the trigger (`0` goes out on the next hourly run) and each later one 1 to 180 days after the one before, with a message of 1 to 1,000 characters. A sequence built without steps exists and enrols nobody until it has one.

> The body is sent as a chat message, so a step with a coupon reads best when it uses `{coupon}` and `{discount}`, and every step should end on `{link}`, which is the way back.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A creator-facing label, 1 to 120 characters; such as `Win-back after churn`.
- `trigger` (one of `churned`, `lead`, `stalled_checkout`, `trial_ending`): What enrols a member: `churned` (their last live membership ended; the default), `lead` (they arrived without buying), `stalled_checkout` (a checkout they started stayed open past the project's window) or `trial_ending` (a trial without a card is about to end).
- `active` (boolean): Whether the sequence enrols and sends from the start. Defaults to `true`.
- `steps` (array of object): The steps in the order they go out, at most 8. Omit for a sequence with no steps yet, which enrols nobody.
  - `delay_days` (integer, required): Days after the trigger for the first step, 0 to 180 (`0` goes out on the next hourly run); days after the step before for the rest, 1 to 180.
  - `body` (string, required): The message in the creator's words, 1 to 1,000 characters of text, with `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` filled per member at send time. Plain text or HTML: bold, italic, underline, strikethrough, code, links and paragraphs are kept, everything else is stripped to its words.
  - `coupon_id` (string): One of this project's coupons to carry with the step, or `null`.


### DELETE `/v1/projects/{project}/sequences/{sequence}`

Puts the sequence out of use and answers `204`: every member part-way through leaves it as `sequence.exited` with the reason `deleted`, the row and its history stay for the figures, and the id stops answering. There is no undo; build a new sequence instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/sequences/{sequence}`

One sequence with its steps and its counts. A sequence of another project, or one the creator deleted, is `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/sequences/{sequence}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences/9d2f4b6a-1c3e-4f58-8a7b-6e5d4c3b2a19 \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 0c4e8a2d-6f1b-4c9e-8d3a-5b7f9e1c2d64" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

Any subset of the name, the trigger and the switch; fields left out keep their stored values. Switching a sequence off lets every member part-way through go, as `sequence.exited` with the reason `disabled`, and enrols nobody until it runs again; switching it back on enrols nobody retroactively.

`steps`, when present, replaces the whole list in order: a step still at its place keeps its id and a member due it keeps their position, the rest are appended and the extra ones removed from the end. Send `[]` to remove every step. One `sequence.updated` announces the sequence as it then stands.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string): A new creator-facing label, 1 to 120 characters.
- `trigger` (one of `churned`, `lead`, `stalled_checkout`, `trial_ending`): What enrols a member: `churned`, `lead`, `stalled_checkout` or `trial_ending`. Members already part-way through keep their passage.
- `active` (boolean): Switch the sequence on or off. Off lets every member part-way through go, as `sequence.exited` with the reason `disabled`, and enrols nobody until it runs again.
- `steps` (array of object): The whole list of steps in order, at most 8; it replaces the stored list. A step still at its place keeps its id and a member due it keeps their position. Omit to leave the steps alone; send `[]` to remove them all.
  - `delay_days` (integer, required): Days after the trigger for the first step, 0 to 180 (`0` goes out on the next hourly run); days after the step before for the rest, 1 to 180.
  - `body` (string, required): The message in the creator's words, 1 to 1,000 characters, with `{name}`, `{project}`, `{coupon}`, `{discount}` and `{link}` filled per member at send time.
  - `coupon_id` (string): One of this project's coupons to carry with the step, or `null`.


### GET `/v1/projects/{project}/sequences/{sequence}/enrollments`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/sequences/9d2f4b6a-1c3e-4f58-8a7b-6e5d4c3b2a19/enrollments?exit_reason=reactivated" \
  -H "Authorization: Bearer sbt_..."
```

Every passage a member made through the sequence, the newest first: when they entered, the step due next and when, and how the passage ended if it has. `state` is `open`, `completed` or `exited`, and an exited passage says why: `reactivated` (the member paid again, a win), `opted_out` (the platform could not reach them), `disabled` or `deleted`. `exit_reason` keeps one way out; `sort_by` takes `enrolled_at`, `next_due_at`, `completed_at` or `exited_at`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `sequence` (path, string, required): The sequence, resolved within the project by the route binder.
- `exit_reason` (query, string): Keep only the passages that ended this way: `reactivated` (won back), `opted_out`, `disabled` or `deleted`. Omit for every passage, open ones included.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.

