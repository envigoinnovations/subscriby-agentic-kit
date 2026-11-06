# REST endpoints: Rest api, the `sequences` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

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

