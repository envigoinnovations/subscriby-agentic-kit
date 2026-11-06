# REST endpoints: Rest api, the `pass-windows` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `pass-windows`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/pass-windows` | `pass-window:view-any` | List a project's pass windows | `list_pass_windows` |
| GET | `/v1/projects/{project}/pass-windows/{window}` | `pass-window:view` | Get a pass window | `get_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/cancel` | `pass-window:delete` | Cancel a pass window | `cancel_pass_window` |
| POST | `/v1/projects/{project}/pass-windows/{window}/remind` | `pass-window:update` | Remind a window's holders | `remind_pass_window_queue` |
| POST | `/v1/projects/{project}/plans/{plan}/pass-windows` | `pass-window:create` | Place a pass window by hand | `create_pass_window` |

### GET `/v1/projects/{project}/pass-windows`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows?status=scheduled&sellable_only=true" \
  -H "Authorization: Bearer <token>"
```

The project's windows across every pass plan, **soonest first**, 50 per page (`per_page` 1 to 100; `limit` is accepted as an alias). Filters are validated before they reach the query: an unknown status or a malformed date is a `422 VALIDATION_FAILED` naming the field, not an empty page.

> **The list also opens to `project-subscription-plan:view-any`.** The list shipped under the plan ability before the `pass-window:*` family had any surface, and it is what the n8n node and the MCP tool docs named. A token holding only `project-subscription-plan:view-any` therefore still satisfies the `pass-window:view-any` gate. Mint new tokens with the precise ability; the alias exists so old ones keep working.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): One pass plan of the project only.
- `status` (query, string): One state only: `scheduled`, `open`, `closed` or `canceled`. Anything else is refused.
- `from` (query, string or null): Only windows starting at or after this moment, ISO 8601.
- `to` (query, string or null): Only windows starting at or before this moment, ISO 8601.
- `sellable_only` (query, boolean): Keep only windows a buyer could still purchase.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 50.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/pass-windows/{window}`

One window, with `sellable` and `holders` resolved for it. A window is resolved **within the project**: a window id that belongs to another project, another team, or to nothing at all is a `404 RESOURCE_NOT_FOUND`, so an id's existence never leaks.

| Field              | Type    | Notes                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `starts_at`        | string  | ISO 8601, **UTC**. Store this.                                                                                                                 |
| `ends_at`          | string  | ISO 8601, UTC.                                                                                                                                 |
| `timezone`         | string  | The IANA zone the plan's schedule was authored in. Render window times in this, never in UTC.                                                  |
| `local_range`      | string  | The same window as a person reads it, already in `timezone`: what the dashboard, the portal and the bot all print.                             |
| `duration_minutes` | integer | Derived from the two instants.                                                                                                                 |
| `status`           | string  | `scheduled`, `open`, `closed` or `canceled`. Set by the scheduler as the window's start and end pass; `canceled` only by an explicit cancel.   |
| `source`           | string  | `generated` from the plan's slots, or `manual` when placed by hand. Manual windows survive a schedule rebuild; generated ones are regenerated. |
| `sellable`         | boolean | Whether a buyer could purchase this window right now: the plan's sales cutoff, resolved for the whole page in one query rather than per row.   |
| `holders`          | integer | How many purchases currently hold the window.                                                                                                  |

> **Why both UTC and a local range.** A pass schedule is authored in the creator's zone and rendered in it everywhere else in the product. Returning only UTC would leave every consumer converting, and getting it wrong across a daylight-saving boundary. `starts_at` is for storing and comparing; `local_range` is for showing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project with its holder count and sale flag.


### POST `/v1/projects/{project}/pass-windows/{window}/cancel`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The body is optional. `series_holders` is the choice the dashboard's cancellation dialog asks for season-ticket holders: `substitute` (the default) moves them to the plan's next window on sale, keeping their season at the same length; `drop` removes the cancelled date from their season, leaves the rest standing and reports what the date was worth per holder. A weekly season always has a next date on sale, so without `drop` a day with no event hands its season-ticket holders a free date the following week while the single-date holders rightly roll forward. Single-date holders are always moved where a window is on sale.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"series_holders": "drop"}'
```

By the time the response arrives every holder has been resettled, and `meta` says how:

| Tally          | What happened to those holders                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rebound`      | Moved to the plan's next window on sale, and told so. Their invite links are re-issued ahead of the new window.                                                   |
| `refund_due`   | The schedule had nothing left to offer, so their pass was ended. Their message states what they paid and that the refund is the creator's decision.               |
| `legs_dropped` | Season-ticket holders who lost this one date and keep the rest of their series. Their message states what they paid, what the date was worth, and the same.        |

`meta.refunds` lists every holder the cancellation left owed a decision, one row each (a holder who paid nothing is settled and counted in the tallies but listed nowhere, since there is nothing to decide): the member's name, the `reason` (`stranded` or `leg_dropped`), `amount_paid` and `amount` (what the cancelled date was worth) with their `_formatted` twins in the holder's own currency, the `currency`, and `passes_remaining`. `meta.refund_totals` adds the rows up per currency. These are the figures the holders were told, so the creator reads the same number the member will ask about.

> **Subscriby never moves the refunds.** `refund_due`, `legs_dropped` and `refunds` are statements, not actions. The money stays where it is until the creator refunds it at the gateway. An integration that wants to act on them can read `meta.refunds` here, or subscribe to `pass.holder_stranded` and `pass_series.leg_dropped`, which carry the amount per holder.

Cancelling is a `POST` verb and not a `DELETE` on purpose: it resettles every holder, moving them on or ending their pass, which is far too consequential to read as removing a row. It also cannot be undone: the window keeps its start permanently, so the same instant can never be re-created on that plan.

Raises `pass.window_cancelled` carrying the tallies, plus one event per holder: `pass.holder_moved` or `pass.holder_stranded` for ordinary passes, `pass_series.leg_substituted` or `pass_series.leg_dropped` for season-ticket holders. A window that is already cancelled is answered `200` with every tally at zero, so a retry after a lost response changes nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `series_holders` (one of `substitute`, `drop`): What cancelling a date does to the season-ticket holders who hold it. A single-date holder is always moved to the plan's next date on sale, because their purchase was that one date. A season-ticket holder bought a slate, so the creator decides per cancellation whether the date is replaced, which keeps their season at the same length, or dropped, which leaves the rest of the season standing and states what the date was worth. A weekly season always has a next date on sale, so without the choice its holders could never be dropped: a day with no event handed them a free date the following week while the single-date holders rightly rolled forward.


### POST `/v1/projects/{project}/pass-windows/{window}/remind`

Nudges everyone who bought the window but has not yet joined, re-attaching their invite links. It is the panel's **Send Reminder** button; the automatic reminders a day and an hour before a window opens still run regardless.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/pass-windows/$WINDOW_ID/remind \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

`reminded` is how many holders the **connector accepted** a message for, not how many were attempted: a holder who has blocked the bot is skipped without costing the rest their nudge. A window that has ended or been cancelled reminds nobody and answers `0` rather than refusing. No event fires: the reminder is a message on the connector, not a state change.

This messages real people. Do not repeat it within the same window, and to nudge one holder rather than a whole window use the [subscription remind endpoint](https://docs.subscriby.net/api/v1/reference/subscriptions/remind-a-pass-holder).

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `window` (path, string, required): The window, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/plans/{plan}/pass-windows`

Places a window by hand on a `kind: pass` plan. This is how `schedule_mode: fixed` gets its dates, and how a repeating plan gets the one-off that does not fit its pattern.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/plans/$PLAN_ID/pass-windows \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "starts_at": "2026-09-20 09:00",
    "duration_minutes": 180
  }'
```

Answers `201` with the new window: `status: scheduled`, `source: manual`, `holders: 0`. The request above and `"starts_at": "2026-09-20T09:00:00-04:00"` describe the same instant for a plan in `America/New_York`, and both come back as `"2026-09-20T13:00:00+00:00"`. Raises `pass.window_scheduled` with `source: manual`.

A manual window is never touched by regeneration: editing `pass.slots` on the plan rebuilds the generated windows and leaves this one where you put it. Every pass series with a rule is asked to look at the new date afterwards, so a matching series absorbs it as described on the [Plans](https://docs.subscriby.net/api/v1/reference/plans) page.

Each refusal below is a `422 VALIDATION_FAILED` naming the field, the same wording the dashboard's panel shows.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan` (path, string, required): The plan, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `starts_at` (string, required): When access opens, ISO 8601. **A value with no offset is read as wall-clock time in the plan's `timezone`**, exactly as the dashboard authors it; a value with an offset or `Z` is the instant it names. Must be in the future, judged in the plan's own zone.
- `duration_minutes` (integer, required): How long the window lasts, a whole number of minutes, at least 1. The plan's configured floor and ceiling apply: 5 minutes and 30 days by default.

