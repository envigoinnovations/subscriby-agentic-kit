# Tools: Broadcasts

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_broadcast_audiences` | read | `broadcast:send` | Lists every audience segment `broadcast_message` accepts for a project: the segment's value and label, what it means, whether it requires a pass window, whether it can be narrowed to a plan, whether it reads the expiring-within-days horizon, and a recipient estimate (null for segments that need a pass window first). |
| `preview_broadcast_audience` | read | `broadcast:send` | Sizes a broadcast without sending anything. |
| `broadcast_message` | destructive | `broadcast:send` | Sends a message through the project's connector to a segment of its members. |
| `list_broadcasts` | read | `broadcast:read` | Lists the broadcasts a project sent, newest first, with who sent them and from where, the audience, how far each send got (`progress.line` is the sentence the creator reads) and how many members it could not reach. |
| `get_broadcast` | read | `broadcast:read` | Fetches one broadcast by its `broadcast_id` (the id `broadcast_message` answered with): who sent it and from where, the audience, the tallies, `progress.line` as the creator reads it, the failures by kind, and under `failures` the first fifty members it could not reach with the connector's reason for each. |
| `retry_broadcast` | destructive | `broadcast:send` | Sends a finished broadcast again, to the members it could not reach and nobody else, as a new broadcast under the old one. |

## `list_broadcast_audiences`

Read · requires `broadcast:send`

Lists every audience segment `broadcast_message` accepts for a project: the segment's value and label, what it means, whether it requires a pass window, whether it can be narrowed to a plan, whether it reads the expiring-within-days horizon, and a recipient estimate (null for segments that need a pass window first). Call it before composing a broadcast; `preview_broadcast_audience` sizes one segment with your exact filters. Requires `project_id`.

**Arguments**

- `project_id` (string, required): UUID of the project the broadcast would go to.

## `preview_broadcast_audience`

Read · requires `broadcast:send`

Sizes a broadcast without sending anything. Returns every audience segment this project can address with its current recipient count and the estimated send duration. Call this BEFORE `broadcast_message` and show the human the count — a segment that silently resolves to every member is the one mistake a broadcast cannot be taken back from. Omit `audience` to list all segments.

**Arguments**

- `project_id` (string, required): UUID of the project to size a broadcast for.
- `audience` (string): Size one segment only. Omit to receive every segment with its count.
- `pass_window_id` (string): Needed to size the single-window pass segments; without it they report a null count.
- `plan_id` (string): Optional plan UUID. Sizes each segment as narrowed to that plan. Segments that cannot use a plan filter (`lead`, the pass segments) report their unnarrowed count and a null plan_id.
- `expiring_within_days` (integer): How far ahead `expiring_soon` looks, 1-90, default 7. Ignored by every other segment.

## `broadcast_message`

Destructive · requires `broadcast:send` · open world

Sends a message through the project's connector to a segment of its members. DESTRUCTIVE AND IRREVERSIBLE: you MUST show a human the exact message text, the audience segment and the recipient count from `preview_broadcast_audience`, and get explicit approval, before calling. A broadcast cannot be recalled once queued and every recipient is a real person. NOT idempotent — calling twice sends twice. Emits `broadcast.queued` then `broadcast.completed` with sent/failed tallies. Use `preview_broadcast_audience` first, always. Answers with `broadcast_id`: the creator follows the send on the dashboard and in the Copilot, and `get_broadcast` reads its tallies and the members it could not reach.

**Arguments**

- `project_id` (string, required): UUID of the project whose members will receive the message.
- `message` (string, required): The message body, 1-4096 characters. Canonical HTML subset only (<b>, <i>, <u>, <s>, <a>, <code>, <pre>, <blockquote>, <tg-spoiler>); anything else is stripped before sending.
- `audience` (string): Segment to address: all, customer, trialing, lead, churned, expiring_soon, cancelled_still_active, paused, trialing_cardless, waiting_on_connection, all_pass_holders, all_pass_holders_not_in_queue, pass_holders, pass_holders_not_in_queue. Defaults to `all`, which reaches every member with a linked chat.
- `pass_window_id` (string): Required for the single-window pass segments (`pass_holders`, `pass_holders_not_in_queue`); ignored by the others.
- `plan_id` (string): Optional. Narrows the segment to members on one subscription plan, by plan UUID. Composes with the segment rather than replacing it: `customer` plus a plan reaches people paying for that plan right now, `churned` plus a plan reaches people who held it and left. Rejected for `lead` (never subscribed) and for the pass segments (their plan is implied by the window).
- `expiring_within_days` (integer): Only meaningful for `expiring_soon`. How many days ahead to look, 1-90, default 7. A member is counted only if their access genuinely lapses: an auto-renewing subscription is not expiring.

## `list_broadcasts`

Read · requires `broadcast:read`

Lists the broadcasts a project sent, newest first, with who sent them and from where, the audience, how far each send got (`progress.line` is the sentence the creator reads) and how many members it could not reach. Narrow with `filter` (`sending` for the ones still moving, `completed`, `failed`) or one exact `status` (`queued`, `sending`, `paused`, `completed`, `failed`). Paginates with `limit` (1..100, default 25) and `page`. History begins with the release that introduced it; older sends have no row. Use `get_broadcast` for one broadcast with the members it missed.

**Arguments**

- `project_id` (string, required): UUID of the project whose broadcasts to list.
- `filter` (string): Optional face: `sending` (queued, sending or paused), `completed` or `failed`. Omit for every broadcast.
- `status` (string): Optional exact status: `queued`, `sending`, `paused`, `completed` or `failed`.
- `limit` (integer): Maximum rows per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_broadcast`

Read · requires `broadcast:read`

Fetches one broadcast by its `broadcast_id` (the id `broadcast_message` answered with): who sent it and from where, the audience, the tallies, `progress.line` as the creator reads it, the failures by kind, and under `failures` the first fifty members it could not reach with the connector's reason for each. Same row shape as `list_broadcasts`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `broadcast_id` (string, required): UUID of the broadcast to fetch.

## `retry_broadcast`

Destructive · requires `broadcast:send`

Sends a finished broadcast again, to the members it could not reach and nobody else, as a new broadcast under the old one. DESTRUCTIVE: every member reached is a real person, so show a human the parent's `failed_count` from `get_broadcast` and get explicit approval before calling. Refused while the parent is still sending, when it missed nobody, or when none of the missed can be reached now. Answers with the child's `broadcast_id`, `parent_id`, `recipient_estimate` and `estimated_seconds`; follow it with `get_broadcast`. Emits `broadcast.queued` then `broadcast.completed`, both carrying `parent_id`.

**Arguments**

- `broadcast_id` (string, required): UUID of the finished broadcast whose missed members are tried again.
