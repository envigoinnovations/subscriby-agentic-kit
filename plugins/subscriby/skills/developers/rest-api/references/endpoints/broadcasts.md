# REST endpoints: Rest api, the `broadcasts` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `broadcasts`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/broadcasts` | `broadcast:read` | List broadcasts | `list_broadcasts` |
| POST | `/v1/projects/{project}/broadcasts` | `broadcast:send` | Send a broadcast | `broadcast_message` |
| GET | `/v1/projects/{project}/broadcasts/audiences` | `broadcast:send` | List every audience | `list_broadcast_audiences` |
| GET | `/v1/projects/{project}/broadcasts/preview` | `broadcast:send` | Preview an audience | `preview_broadcast_audience` |
| GET | `/v1/projects/{project}/broadcasts/{broadcast}` | `broadcast:read` | Read a broadcast | `get_broadcast` |
| GET | `/v1/projects/{project}/broadcasts/{broadcast}/failures` | `broadcast:read` | List the members a broadcast missed | `get_broadcast` |
| POST | `/v1/projects/{project}/broadcasts/{broadcast}/retry` | `broadcast:send` | Retry a broadcast | `retry_broadcast` |

### GET `/v1/projects/{project}/broadcasts`

Every broadcast the project sent since history began, newest first, with who sent it and from where, the audience, the tallies and `progress.line`, the sentence the creator reads on the dashboard's Broadcasts page. `filter` keeps to one face (`sending` for the ones still moving, `completed`, `failed`); `status` keeps to one exact status. Pages with `per_page`, `page`, `sort_by` (`created_at`, `status`, `sent_count`, `failed_count`, `finished_at`) and `sort_direction`.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts?filter=completed" \
  -H "Authorization: Bearer <token>"
```

A send made before the release that introduced the ledger has no row, so a `broadcast_id` remembered from an older `broadcast.queued` event answers `404 RESOURCE_NOT_FOUND`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `filter` (query, string): Keep to one face: `sending` (queued, sending or paused), `completed` or `failed`. Omit for every broadcast.
- `status` (query, string): Keep to one exact status: `queued`, `sending`, `paused`, `completed` or `failed`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/broadcasts`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "<b>New drop is live</b>\nDoors open at 19:00 UTC.",
    "audience": "customer"
  }'
```

`202`, not `200`: the send is queued and runs in the background at roughly 28 messages a second to stay inside the platform's rate limit. The response describes what was *addressed*, not what was delivered.

### Audience segments

| Segment                          | Who it addresses                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `all`                            | Every member reachable on the project's connector, whatever their status.                 |
| `customer`                       | Members holding a paid subscription right now.                                            |
| `trialing`                       | Members currently inside a free trial.                                                    |
| `lead`                           | Members who have used the project's bot but never subscribed.                             |
| `churned`                        | Members who were customers and are not any more.                                          |
| `expiring_soon`                  | Members whose subscription genuinely lapses within `expiring_within_days`.                |
| `cancelled_still_active`         | Members who cancelled but have not run out yet: still reachable, still winnable.          |
| `paused`                         | Members who paused their subscription rather than ending it.                              |
| `trialing_cardless`              | Members trialing without a card on file, who will not convert on their own.               |
| `waiting_on_connection`          | Members whose purchase includes a place on a platform they have not connected yet.        |
| `all_pass_holders`               | Everyone holding a valid pass for any upcoming window.                                    |
| `all_pass_holders_not_in_queue`  | Everyone who has not tapped their invite link, across every upcoming window.              |
| `pass_holders`                   | Everyone holding a valid pass for one access window you choose (`pass_window_id`).        |
| `pass_holders_not_in_queue`      | Holders of one window you choose who have not tapped their invite link yet.               |

A member is a recipient only if they have a linked chat **on that project's connector**. Members with no chat, or whose chat belongs to a different installation, are excluded silently, which is why `recipient_estimate` is frequently well below a project's total membership.

> **An auto-renewing subscription is never `expiring_soon`.** A subscription's `ends_at` is rewritten to the new period end on every renewal, so a date inside the horizon describes an auto-renewing member's next **invoice** rather than an expiry. Counting it would place every monthly subscriber in this segment once a month. A member is counted only when their access genuinely lapses: they have cancelled, or the plan is not recurring.

### Narrowing a segment to a plan

`plan_id` **composes** with `audience` rather than replacing it:

| Request                                     | Who it addresses                         |
| ------------------------------------------- | ---------------------------------------- |
| `audience=customer` + `plan_id=<gold>`      | People paying for Gold right now.        |
| `audience=churned` + `plan_id=<gold>`       | People who held Gold and left.           |
| `audience=paused` + `plan_id=<gold>`        | People whose *paused* plan is Gold.      |
| `audience=expiring_soon` + `plan_id=<gold>` | Gold members lapsing inside the horizon. |

The plan and the state describe the **same subscription**, so a member paying for Silver who once trialled Gold is not matched by the first row. `churned` is the deliberate exception in the other direction: the subscription proving they held the plan is the one that ended, so it is not required to be live.

A `plan_id` sent with `lead` or a pass segment is **refused with `422` and `reason: plan_filter_unsupported`**, not ignored. Silently dropping it would return a recipient count for a different audience than the request described, and a caller has no way to notice.

### Message formatting

The body is reduced to the HTML subset the delivering connector accepts before sending; for the messaging connector that is `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<ins>`, `<s>`, `<strike>`, `<del>`, `<a>`, `<code>`, `<pre>`, `<blockquote>` and `<tg-spoiler>`. Anything else is **stripped, not escaped**: the platform rejects an entire message containing an unknown tag, so removing it is what keeps the message deliverable.

The 4,096-character limit is the platform's own. A longer body is refused here rather than being truncated per recipient.

### Refusals

Every `422` is refused **before** anything is queued. The underlying job re-checks the same conditions and aborts silently, which is correct for a background job and wrong for an API caller, so the endpoint rejects them up front rather than returning `202` for a send that could never leave. A segment that resolves to zero recipients is the send action's own refusal, shared with the dashboard: it is not queued.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `message` (string, required): The message body, 1 to 4,096 characters, in the HTML subset the delivering connector accepts. Unknown tags are stripped rather than escaped, because the platform rejects a whole message that holds one.
- `audience` (one of `all`, `customer`, `trialing`, `lead`, `churned`, `expiring_soon`, `cancelled_still_active`, `paused`, `trialing_cardless`, `waiting_on_connection`, `all_pass_holders`, `all_pass_holders_not_in_queue`, `pass_holders`, `pass_holders_not_in_queue`): Who a broadcast is addressed to. Previously a bare string that BroadcastMessageJob fed to `ProjectUserStatus::tryFrom()`, which quietly meant "anything unrecognised * broadcasts to everyone" — a typo in the audience widened the send rather than refusing it. The pass segments cannot be expressed as a status at all: they are a fact about a subscription bound to a window, not about the member. Declaration order is the order the picker offers them, so each pass segment's every-window form sits above the one that asks for a single date. The backing values of the status-derived cases match ProjectUserStatus so a broadcast queued before this enum existed still resolves.
- `pass_window_id` (string): The access window for `pass_holders` and `pass_holders_not_in_queue`; required by those two, ignored by every other segment.
- `plan_id` (string): Narrow the segment to members whose subscription is on this plan; it composes with `audience` rather than replacing it. Refused, not ignored, for `lead` and the pass segments.
- `expiring_within_days` (integer): The horizon `expiring_soon` counts within, 1 to 90; defaults to 7. Read by no other segment.


### GET `/v1/projects/{project}/broadcasts/audiences`

All thirteen segments with labels, descriptions and current counts, so a UI can offer them without hard-coding the list. Segments that address a single window report `recipient_estimate: null`; they cannot be sized without a window id.

| Field                           | Type            | Meaning                                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `value`                         | string          | The segment key to send as `audience`.                                           |
| `label`, `description`          | string          | The words the dashboard shows, in the creator's language.                        |
| `requires_pass_window`          | boolean         | Whether the segment needs a `pass_window_id`.                                    |
| `supports_plan_filter`          | boolean         | Whether `plan_id` is accepted. False for `lead` and the pass segments.           |
| `requires_expiring_within_days` | boolean         | Whether the segment reads a horizon. True only for `expiring_soon`.              |
| `recipient_estimate`            | integer or null | Who the segment reaches right now; null where a window must be named first.      |

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### GET `/v1/projects/{project}/broadcasts/preview`

Sizes a broadcast without sending it. The dashboard shows this before the confirm button, and an API caller needs the same safety rail.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/preview?audience=customer&plan_id=$PLAN_ID" \
  -H "Authorization: Bearer <token>"
```

The preview accepts the same `audience`, `pass_window_id`, `plan_id` and `expiring_within_days` as the send, and applies them identically, segments, plan narrowing and recipient rules alike, so a preview and the send it precedes can never describe different audiences. The fields answer the same as the send's, minus `status`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `audience` (query, string): The segment to size: `all` (the default), `customer`, `trialing`, `lead`, `churned`, `expiring_soon`, `cancelled_still_active`, `paused`, `trialing_cardless`, `waiting_on_connection`, `all_pass_holders`, `all_pass_holders_not_in_queue`, `pass_holders` or `pass_holders_not_in_queue`. An unknown value is `422` with `reason: unknown_audience` and the supported list.
- `pass_window_id` (query, string): The access window for `pass_holders` and `pass_holders_not_in_queue`; ignored by every other segment.
- `plan_id` (query, string): Narrow the segment to members whose subscription is on this plan. Refused for `lead` and the pass segments with `reason: plan_filter_unsupported`; a plan of another project is `reason: unknown_plan`.
- `expiring_within_days` (query, integer): The horizon `expiring_soon` counts within, 1 to 90; a value outside the range clamps. Defaults to 7. Read by no other segment.


### GET `/v1/projects/{project}/broadcasts/{broadcast}`

One broadcast by the `broadcast_id` the send answered with. `progress` is where the send stands: `status` in the five words every tracked piece of work on this API uses (`queued`, `running`, `paused`, `completed`, `failed`), `done` of `total`, `failed`, and `line`. `failures_by_kind` splits the failed count by the connector's reading of why. Poll it while `progress.status` is `queued`, `running` or `paused`, or wait for `broadcast.completed`, which carries the same id.

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The broadcast, resolved within the project by the route binder.


### GET `/v1/projects/{project}/broadcasts/{broadcast}/failures`

The members the walk could not reach, newest first, each with `kind` (`unreachable` for a member who blocked the bot or left, `not_permitted`, `target_missing` for a member with no account to reach, `rate_limited` for one still throttled after the retries, `configuration`, `transient`, `other`) and the platform's `detail` when it gave one. Nothing is kept per successful recipient, so this is the whole record of who missed the message. Pages with `per_page`, `page`, `sort_by` (`failed_at`, `kind`) and `sort_direction`.

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID/failures \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The broadcast, resolved within the project by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `failed_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects/{project}/broadcasts/{broadcast}/retry`

Sends a finished broadcast again, to the members it could not reach and nobody else, as a new broadcast under the old one: the child walks the parent's missed members alone, posts no announcement, and carries the parent's message and audience for the history. Refused with `422 VALIDATION_FAILED` while the parent is still sending, when it missed nobody, when none of the missed can be reached now, or when the project has no connected bot.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/broadcasts/$BROADCAST_ID/retry \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `broadcast` (path, string, required): The finished broadcast, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

